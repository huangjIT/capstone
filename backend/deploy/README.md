# Multi-node AWS deployment (Phase 1)

The 2-node + 1-witness topology from the project proposal, replacing the
single-instance `docker-compose.aws.yml` where app, Postgres, Kafka and Redis all
shared one box (and one blast radius).

## Layout

```
                       internet
                          |
                   ALB (public subnet)      <-- the only thing with a public address
                    /              \
        ┌──────────────────┐  ┌──────────────────┐      ┌─────────────┐
        │ NODE A (private) │  │ NODE B (private) │      │  WITNESS    │
        │  app             │  │  app             │      │  sentinel   │
        │  kafka broker    │  │  redis PRIMARY   │      │  (quorum,   │
        │  redis replica   │  │  sentinel        │      │   no data)  │
        │  sentinel        │  │                  │      │  t3.nano    │
        └──────────────────┘  └──────────────────┘      └─────────────┘
                    \              /
                     RDS PostgreSQL (private, Multi-AZ optional)
```

**Why this placement.** The Kafka broker and the Redis primary are the two
I/O-hottest processes; putting them on the same instance makes each the other's
noisy neighbour on disk and network, which is the same reasoning that moves
Postgres to its own RDS endpoint. The witness carries no workload at all — it
exists so Sentinel has an odd number of votes and a partition can't produce two
primaries.

**What this does not fix.** Kafka is still a single broker at replication factor
1, so losing node A stops telemetry ingestion until it comes back. And all writes
still funnel into one Redis primary — replicas are failover, not write capacity.
Both are Phase 2 items (MSK; sharding `users:geo` by city tile). See
`../SCALABILITY_REVIEW_2026-08-09.md` §1.5.

## Bring-up order

Node B first — node A's replica needs a primary to attach to, and Sentinel needs
the primary reachable to start monitoring.

```bash
# 1. every instance
cp .env.example .env && vi .env          # same values on all three

# 2. NODE B
docker compose --env-file .env -f docker-compose.node-b.yml up -d

# 3. NODE A  (runs Flyway migrations; node B has FLYWAY_ENABLED=false so the
#             two instances can't race for the migration lock at startup)
docker compose --env-file .env -f docker-compose.node-a.yml up -d

# 4. WITNESS
docker compose --env-file .env -f docker-compose.witness.yml up -d
```

## Verify

```bash
# replication is live (expect role:master + connected_slaves:1)
redis-cli -h $NODE_B_IP info replication

# all three sentinels see each other (expect num-other-sentinels:2)
redis-cli -h $WITNESS_IP -p 26379 sentinel master pawpal | grep -E 'num-other-sentinels|quorum'

# both app instances healthy
curl -s http://$NODE_A_IP:8080/api/system/health
curl -s http://$NODE_B_IP:8080/api/system/health

# schema is at the expected migration version
psql -h $RDS_ENDPOINT -U $DB_USERNAME -d pet_social_db \
  -c 'select version, description, success from flyway_schema_history order by installed_rank'
```

Failover drill — stop the primary and confirm a replica is promoted within
`down-after-milliseconds` + `failover-timeout` (~15s here), with no app redeploy:

```bash
docker stop pawpal-redis-primary
sleep 20
redis-cli -h $NODE_A_IP info replication | grep role   # expect role:master
```

## Security groups

| From | To | Port | Why |
|---|---|---|---|
| internet | ALB | 443 | only public ingress |
| ALB | node A, node B | 8080 | app traffic; never open 8080 to the internet |
| node A ↔ node B | each other | 6379 | Redis replication |
| node A, node B, witness | each other | 26379 | Sentinel gossip |
| node B | node A | 9092 | Kafka clients |
| node A, node B | RDS | 5432 | JDBC |

The app instances need **no** inbound rule from the internet, and the witness
needs none from the ALB. Egress to the Expo push endpoint (443) is required on
both app nodes, or notifications silently fail to deliver.

## Secrets

`.env` is gitignored, but a file on disk is not a secret store. Put
`DB_PASSWORD` and `APP_JWT_SECRET` in SSM Parameter Store (free tier) and render
`.env` at boot:

```bash
aws ssm get-parameter --name /pawpal/jwt-secret --with-decryption \
  --query Parameter.Value --output text
```

The single-instance `docker-compose.aws.yml` still carries a hardcoded JWT secret.
Rotate it when moving here — anything that was committed should be treated as
compromised.
