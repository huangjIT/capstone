# Scalability Review & Remediation — 2026-08-09

Code-level review of the backend against the Sprint 4 target (50k-user Toronto simulation,
5,000–10,000 telemetry events/sec/node on the 2-node + 1-witness AWS topology), followed by
the fixes applied in the same session. Companion to
`THROUGHPUT_OPTIMIZATION_2026-06-16.md`, which covers the telemetry pipeline specifically.

**Headline finding:** the telemetry ingest path — the part that has had the most optimization
attention — is *not* the first thing that breaks under the target load. The matching engine and
a Micrometer gauge both fail earlier, and the single-EC2 deployment caps everything regardless.

## 1. Bottlenecks, ranked by projected failure order

Ordering is by what fails first as load rises toward the target, not by discovery order. Each
component has a different cost model, which is what makes the ranking possible:
matching was O(candidates) per request, the gauge is O(users) per scrape, ingest is
O(1) round-trips per 1,000 records.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Matching: unbounded geo search + one Redis round-trip per candidate | Critical | **Fixed** |
| 2 | Dashboard gauge loads the whole user table on every Prometheus scrape | Critical | **Fixed** |
| 3 | App, Postgres, Kafka and Redis all on one EC2 instance | Critical | Open (infra) |
| 4 | Hikari pool (20) vs Tomcat threads (200) mismatch | High | **Fixed** |
| 5 | Ingest ceiling is a plan, not a measurement | High | Partly fixed (now measurable) |
| 6 | Unauthenticated endpoints; `KEYS` scan; spoofable telemetry | High | **Fixed** |
| 7 | Schema managed by `ddl-auto: update` | Medium | Open |
| 8 | Silent data-loss paths (no DLQ; TTL erases matching metadata) | Medium | Partly fixed (counters added) |

### 1. Matching: unbounded geo search + N+1 Redis reads — FIXED

`MatchingService` called `GEORADIUS` with no `COUNT` limit and no sort, then issued a separate
blocking `HGETALL` per candidate. At 50k users in Toronto a 10 km radius covers most of the
city, so a single match request could issue tens of thousands of sequential Redis calls —
repeated across all three expansion radii when no match was found. Cost grew linearly with user
density, which is exactly what the load test increases. Every stalled match also stalls the
Redis instance that telemetry ingest writes to.

**Fix:** the search is now bounded and nearest-first (`limit()` + `sortAscending()`), and all
candidate metadata for a radius is fetched in **one pipelined round-trip** instead of one
`HGETALL` per candidate.

The candidate cap **grows with each expansion step (50 → 100 → 200)**. This is the
non-obvious part: because results come back nearest-first, a wider radius with the same cap
would return the exact same nearest members that already failed the filter, making the
expansion pointless. Worst case per request is now 350 metadata reads across 4 round-trips,
down from O(city population) sequential calls.

### 2. Dashboard gauge loads the entire user table — FIXED

`DashboardService.availableUsersCount()` called `userRepository.findByIsActiveTrue().size()`,
hydrating every active user as a JPA entity just to count them — on every Prometheus scrape
(typically every 15s) *and* every dashboard request. At 50k users that is 50k entities
materialized repeatedly, competing with real traffic for the same Hikari connections and heap.
The observability system becomes the load.

**Fix:** added `UserRepository.countByIsActiveTrue()` (a derived `COUNT(*)`) and used it in both
the gauge and `getDashboardMetrics()`.

### 3. Single-instance deployment — OPEN (infrastructure)

`docker-compose.aws.yml` co-locates app, Postgres, Kafka and Redis on one instance with a 2 GB
app heap: Kafka replication factor 1, Redis unreplicated, one app instance, no load balancer,
port 8080 exposed directly to the internet. Whatever the code can do, the ceiling is this box,
and any container dying is a full outage. See section 3 for the target topology.

### 4. Connection-pool arithmetic — FIXED

Tomcat defaults to 200 request threads against a 20-connection Hikari pool: up to 180 threads
queue for a connection with a 30s default timeout, so the failure mode under sustained
DB-heavy load is cascading 500s rather than graceful degradation.

**Fix:** `server.tomcat.threads.max` capped at 50 (`SERVER_TOMCAT_MAX_THREADS` to override).
Still to do: re-tune both numbers against a real load test, and check the total against
Postgres `max_connections` (default 100) before running a second app instance.

### 5. Ingest ceiling — now measurable

The last measured figure is ~720–1,000 records/sec on a laptop with one partition, with an
unexplained oscillation between ~500–1,000/sec. The 5–10k/sec target remains plausible but
unproven.

**Fixed:** added `telemetry.kafka.batch.size` (the distribution summary
`THROUGHPUT_OPTIMIZATION_2026-06-16.md` §4.1 said was needed to diagnose the oscillation), and
fixed the load generator's pacing — `startContinuousTelemetryStream` slept a flat 1000 ms *on
top of* however long the send blast took, so the offered rate was both bursty and below the
requested rate. It now sleeps only the remainder of each second.

**Structural limits that remain** (measurement first, then redesign):
- All consumer threads funnel into **one Redis primary**. Replicas provide failover, not write
  capacity.
- The geo index is **a single key** (`users:geo`), so even Redis Cluster would not spread these
  writes — one key lives on one shard. Real write scaling needs the index sharded by city tile
  or geohash prefix (`geo:{tile}`), querying the tile containing the search circle plus its
  neighbours.

### 6. Attack surface — FIXED

`JwtAuthFilter` was registered against an enumerated list of eleven URL patterns, so any
endpoint nobody remembered to add shipped open. Exposed at the time of review: the telemetry
POST (which trusted the `userId` in the request body — anyone could write any user's position),
`/api/match`, pet browsing, invitations, reviews, and marketplace. `InspectorController` ran
`KEYS users:meta:*`, a single blocking O(N) pass over the keyspace that stalls every other
Redis caller while it runs.

**Fixes:**
- The filter now covers **all of `/api/*`**, with an explicit allowlist in
  `JwtAuthFilter.PUBLIC_PATHS`: the three token-minting endpoints, their two legacy
  `/api/users/*` aliases, and `/api/system/health` (load balancers cannot log in). The posture
  flipped from allow-by-default to **deny-by-default** — a newly added controller is now born
  protected, and forgetting one causes an immediately visible 401 instead of a silently open
  endpoint.
- `TelemetryController` takes the user id from the verified JWT and ignores any id in the body,
  so a client can only ever report its own position.
- `TestDataController` and `InspectorController` are gated behind
  `app.test-endpoints.enabled` (`APP_TEST_ENDPOINTS_ENABLED`), which `docker-compose.aws.yml`
  now sets to `false`. `/api/test-data/stream` spawns producer threads on demand — on an
  internet-reachable box, that lets anyone run a load test against you.
- `KEYS` replaced with cursor-based `SCAN`.

**Still open:** rate limiting. Login performs unthrottled BCrypt (~100 ms of CPU per attempt),
a cheap CPU-exhaustion vector. Best placed at the WAF/ALB layer of the target architecture, or
Bucket4j in-app.

### 7. `ddl-auto: update` — OPEN

Already failed silently once (see `THROUGHPUT_OPTIMIZATION_2026-06-16.md` §1): adding NOT NULL
columns to a populated table left the schema stale while the app kept running. At 50k-row
tables, boot-time DDL can also take long locks. Move to Flyway or Liquibase — explicit,
reviewable, and it fails loudly. Deferred because it touches every environment's schema state
and wants a planned rollout.

### 8. Silent data loss — partly fixed

Two paths:

- **Poison messages.** The consumer logs parse failures and commits offsets — deliberate
  at-most-once handling for telemetry, where the next ping supersedes the lost one and a retry
  loop would be worse than a gap. What was missing was visibility.
  **Fixed:** added `telemetry.consume.parse.errors` and `telemetry.consume.batch.errors`, so a
  systematic failure can no longer masquerade as low traffic. A dead-letter topic is still
  worth adding.
- **TTL erases matching metadata — OPEN.** The consumer refreshes a 6-hour `EXPIRE` on
  `users:meta:{id}`, but that same hash holds the `active` and `preferences` fields written
  once at registration. A user idle for more than 6 hours silently becomes unmatchable. Under a
  multi-day soak test this presents as mysterious match-rate decay. The fix is to split durable
  fields from volatile ones (or re-hydrate from Postgres on a miss); deferred because it
  touches four services.

**Related design gap, still open:** the consumer writes `available`/`lastSeen` on every ping,
but matching filters on `active`/`preferences`, which are only written at registration. Matching
therefore ignores telemetry freshness entirely — the two systems under load test are not
actually connected. "Available" should mean "pinged recently."

## 2. What is already sound

Worth stating explicitly, because the review focused on what breaks:

- **Async ingest by design.** `202 Accepted` + Kafka decouples spike absorption from processing;
  per-user partition keys preserve chronological order where it matters.
- **Batch consumption with one pipelined Redis call per batch**, amortising the round-trip
  across up to 1,000 records.
- **Partition count declared in code** (`KafkaTopicConfig`) and shared with listener concurrency
  through one property, so the two cannot drift apart — the exact failure mode diagnosed on
  2026-06-16.
- **JPA hygiene:** `open-in-view: false`, fetch-joins against N+1s, pagination on feeds, JDBC
  batching with SEQUENCE ids, entity-level indexes on the hot query paths.
- **Stateless auth.** JWT verified per request with no DB hit — the property that makes
  horizontal scaling an infrastructure change rather than a code change.
- **Caching where polling concentrates.** `UnreadCountService` serves badge counts from a 15s
  Redis cache with write-side invalidation, degrading to Postgres when Redis is down.
- **Observability as method.** Micrometer p50/p95/p99 timers and purpose-built gauges were added
  *before* optimising; the 1-partition root cause was found because of them.

## 3. Target AWS architecture

### Phase 1 — capstone budget (~3 small EC2 + free-tier RDS)

The proposal's 2-node + 1-witness topology, actually implemented:

- **ALB in front of two app instances**, one per node. No session affinity needed — auth is
  already stateless. Removes both the single point of failure and the single-box CPU ceiling.
- **Node A: app + Kafka broker. Node B: app + Redis primary.** Never co-locate the broker with
  the Redis primary; they compete for the same disk I/O and network on the hottest path.
- **Witness (t3.nano): quorum only.** Runs Redis Sentinel (and later a Kafka controller vote) to
  arbitrate failover, carrying zero data-plane workload. Its purpose is split-brain prevention
  via an odd-numbered vote.
- **Postgres → RDS** (t4g.micro, free tier): managed backups, and the database's disk I/O
  isolated from Kafka's.
- **Secrets → SSM Parameter Store.** `docker-compose.aws.yml` currently carries DB credentials
  and the JWT signing secret in plaintext.
- **Only the ALB is public.** App instances and datastores move to private subnets.

### Phase 2 — with real budget

| Concern | Phase 1 (owned) | Phase 2 (managed) | Why |
|---|---|---|---|
| App tier | 2× EC2 + ALB | ECS Fargate + auto-scaling | Scale on CPU/RPS; deploys become task-definition updates |
| Kafka | 1 broker on EC2 | Amazon MSK (3 brokers, RF 3) | Survives broker loss; no self-managed KRaft quorum |
| Redis | primary + replica + Sentinel | ElastiCache, cluster mode | Only pays off *after* sharding `users:geo` — one key, one shard |
| Postgres | RDS single-AZ | RDS Multi-AZ + read replica | Automatic failover; reads move off the writer |
| Edge | ALB + security groups | + WAF rate rules, CloudFront | Throttle login and telemetry before the JVM pays for it |
| Secrets | SSM Parameter Store | Secrets Manager + rotation | Automatic rotation, IAM-scoped per service |
| Observability | self-hosted Prom/Grafana | Managed Prometheus + Grafana | Monitoring survives what it monitors |
| Delivery | `compose up` on the box | ECR + GitHub Actions | Zero-downtime deploys behind the ALB health check |

The interesting exception is Redis: the scaling work there is in the **data model**, not the
service tier. See §1.5.

## 4. Files changed in this session

- `service/MatchingService.java` — bounded nearest-first `GEOSEARCH`, growing per-radius caps,
  pipelined metadata fetch
- `repository/UserRepository.java` — `countByIsActiveTrue()`
- `service/DashboardService.java` — count query in gauge and metrics map
- `service/TelemetryConsumerService.java` — batch-size distribution, parse/batch error counters
- `service/TestDataGeneratorService.java` — compensated stream pacing
- `controller/TelemetryController.java` — identity from JWT, not the request body
- `controller/TestDataController.java`, `controller/InspectorController.java` — property gate;
  `KEYS` → `SCAN`
- `web/JwtAuthFilter.java` — public-path allowlist
- `web/WebConfig.java` — filter registered on `/api/*`
- `application.yml` — Tomcat thread cap, `app.test-endpoints.enabled`
- `docker-compose.aws.yml` — `APP_TEST_ENDPOINTS_ENABLED: "false"`
- `demo.ps1` — captures and sends tokens (login fallback for pre-existing users)
- `.gitignore` — ignore `logs/` and `.env`

Verified: `mvnw compile` clean, `mvnw test` green (13 tests).

## 5. Next steps

1. **Frontend coordination (blocking).** Screens calling previously public endpoints — pet
   browsing, invitations, reviews, marketplace, location pings, match — now need the
   `Authorization: Bearer` header the messaging screens already send. Usually one change to a
   shared HTTP-client interceptor. Smoke-test the app against this build before merging.
2. **Re-run the load test** with the fixed generator pacing, and read `telemetry.kafka.batch.size`
   to settle the oscillation question.
3. **Benchmark Redis directly** for the GEOADD+HSET+EXPIRE+INCR pattern (4 ops/record → 200k
   ops/sec at a 50k records/sec target) before sizing partitions.
4. **Verify matching still returns results** against a live stack. The filter semantics are
   unchanged, but the candidate set is now the nearest 50–200 rather than everyone.
5. Then: Flyway, the metadata TTL split, rate limiting, and the Phase 1 topology.
