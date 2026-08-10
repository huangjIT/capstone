# Deploying the backend to a single EC2 instance

The simplest deployment that actually works: one instance running the app, Postgres,
Redis and Kafka via `../docker-compose.aws.yml`. This is the showcase path.

For the 2-node + witness topology (ALB, RDS, Sentinel failover) see
[`README.md`](README.md) — that's the design target, but it takes hours to stand up and
needs a failover drill before you'd trust it live.

**Only the backend goes on AWS.** The mobile app is installed on your phone or emulator
and talks to this instance over the internet; nothing about the app is hosted here.

---

## Sizing: what the instance actually needs

### Disk — 20 GB

The mobile app has no bearing on this. The disk is consumed by container images and the
build, measured from the real images:

| Item | Size |
|---|---|
| `confluentinc/cp-kafka:7.5.0` | 1.33 GB |
| `redis:7-alpine` | 61 MB |
| `postgres:16-alpine` | 395 MB |
| `maven:...-temurin-21` (build stage) + downloaded dependencies | ~1.5 GB |
| `eclipse-temurin:21-jre` (runtime stage) + the 93 MB fat jar | ~0.4 GB |
| Amazon Linux 2023 itself | ~2.5 GB |
| Postgres data + Kafka logs | grows with use |

That's roughly **6–7 GB before storing a single row**, which is why the default 8 GB
root volume fails partway through the build — and it fails with a confusing error
(`ExtractAarTransform` / `no space left on device` style messages from whichever tool
happens to be running), not a clear "disk full". 20 GB leaves comfortable headroom.

> The compose file uses `redis:7-alpine`, not `redis/redis-stack`. The app only uses
> core Redis (GEO, HASH, STRING, ZSET, SCAN) and never the Stack modules, and this
> deployment doesn't publish the GUI port. That swap alone saves 1.36 GB. Local dev
> keeps `redis-stack` in `../docker-compose.yml` because RedisInsight is useful there.

### Memory — t3.large (8 GB)

The Dockerfile pins the app to `-Xmx2g`, and it shares the box with a Kafka JVM,
Postgres and Redis. On a 4 GB `t3.medium` this OOMs under any real load. If cost matters
more than headroom, `t3.medium` works **only** if you also lower the app heap:

```yaml
# docker-compose.aws.yml, app service
environment:
  JAVA_OPTS: "-XX:+UseZGC -Xms512m -Xmx1g -XX:+HeapDumpOnOutOfMemoryError"
```

---

## 1. Launch the instance

```bash
SG=$(aws ec2 create-security-group --group-name pawpal-demo \
  --description "PawPal backend" --vpc-id vpc-0de0a557a3217366d --query GroupId --output text)

# SSH from your machine only
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 \
  --cidr $(curl -s https://checkip.amazonaws.com)/32
# API open, so your phone can reach it from any network
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 8080 --cidr 0.0.0.0/0

aws ec2 run-instances --image-id $(aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query Parameter.Value --output text) \
  --instance-type t3.large --key-name pawpal --security-group-ids $SG \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=pawpal-demo}]' \
  --query 'Instances[0].InstanceId' --output text
```

Get the public IP (your phone will need it):

```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=pawpal-demo" \
  "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

Port 8080 is open to the internet here because a phone on mobile data has no fixed IP to
allowlist. That is acceptable for a demo *because* the API is deny-by-default
authenticated and the load-generation endpoints are switched off — it would not have
been before those changes.

## 2. Install Docker

```bash
ssh -i ~/.ssh/pawpal.pem ec2-user@<PUBLIC_IP>

sudo dnf update -y && sudo dnf install -y docker git
sudo systemctl enable --now docker && sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
exit    # re-ssh so the docker group membership applies
```

## 3. Clone

The repo is private, so use a personal access token
(GitHub → Settings → Developer settings → Personal access tokens, `repo` scope):

```bash
git clone https://<YOUR_TOKEN>@github.com/huangjIT/capstone.git
cd capstone/backend
```

## 4. Create `.env`

`.env` is gitignored, so it does **not** arrive with the clone — that is the point.
Generate fresh values on the server; don't reuse the ones from your laptop.

```bash
cp .env.example .env
nano .env
```

```ini
APP_JWT_SECRET=<openssl rand -base64 48>
DB_USERNAME=pawpal
DB_PASSWORD=<openssl rand -base64 24 | tr -d '/+='>
APP_CORS_ALLOWED_ORIGINS=*
```

Compose uses `${VAR:?message}` for these, so it refuses to start and names the missing
variable rather than falling back to a default that every deployment would share.

## 5. Start

```bash
docker compose --env-file .env -f docker-compose.aws.yml up -d --build
docker compose --env-file .env -f docker-compose.aws.yml logs -f app
```

First build is 5–10 minutes (Maven downloads inside the container). Wait for
`Started PetSocialApplication`.

## 6. Verify

```bash
curl http://<PUBLIC_IP>:8080/api/system/health

# schema: both migrations should be success = t
docker exec pet-social-postgres psql -U pawpal -d pet_social_db \
  -c 'select version, description, success from flyway_schema_history order by installed_rank'

# auth is deny-by-default: this must be 401
curl -o /dev/null -w '%{http_code}\n' http://<PUBLIC_IP>:8080/api/notifications
```

On a fresh database Flyway runs V1 then V2 from scratch. The baseline-skip behaviour
only applies to databases that already had tables before Flyway existed.

## 7. Point the phone at it

In `frontend/mobile/src/utils/api.ts`:

```ts
const BASE_URL = 'http://<PUBLIC_IP>:8080';
```

This is a JS-only change, so Metro serves it without a native rebuild. For a standalone
APK on your phone you do need a build — note that Android blocks cleartext HTTP by
default on API 28+, so either add a network-security-config exception for this host or
put the API behind HTTPS.

## Before demoing

**Seed presence, or the map will be empty.** Matching requires a live
`users:presence:*` key, which only exists after a user has sent telemetry. Open the app
and let it ping (every 3 minutes, and once on launch) a few minutes before you present.
Alternatively set `APP_MATCHING_REQUIRE_FRESH_PRESENCE=false` for the day.

**Use two accounts.** Matching has no self-exclusion, so a single account can match
itself — which looks odd on stage.

**Grafana will be empty** unless you expose the metrics endpoint:

```yaml
MGMT_ENDPOINTS: health,info,prometheus
MGMT_PROMETHEUS_ENABLED: "true"
```

## Teardown

```bash
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
aws ec2 delete-security-group --group-id $SG    # after the instance is gone
```

A forgotten `t3.large` is roughly $60/month.

## Known limitations of this deployment

- **Plain HTTP.** No TLS; tokens cross the network in the clear. Fine for a demo, not
  for anything real.
- **One box, one blast radius.** Any container dying takes the system down, and Kafka
  runs at replication factor 1. That is the finding this deployment knowingly accepts —
  `README.md` is the answer to it.
- **No rate limiting.** Login runs BCrypt at ~100 ms of CPU per attempt.
