# Production deployment with Docker Compose

This repository includes a production Compose stack in [`compose.yaml`](../compose.yaml). It runs:

- `db`: PostgreSQL 16 with a named persistent volume.
- `migrate`: a one-shot container that applies the checked-in Drizzle migrations.
- `web`: the Next.js standalone production server.
- `worker`: a small process that checks the email outbox every 30 seconds.

The web and worker containers wait for a healthy database and a successful migration. The database is not published to the host. The web container binds to `127.0.0.1:3000` by default so a reverse proxy can terminate HTTPS in front of it.

## Requirements

Use a server with:

- Docker Engine and the Docker Compose plugin (`docker compose`).
- A persistent disk for the PostgreSQL volume.
- A DNS name and an HTTPS reverse proxy such as Caddy, Nginx or an equivalent managed load balancer.

The included `db` service is suitable for a single-host deployment. For a highly available production database, use a managed PostgreSQL service instead and point `DATABASE_URL` at it; keep backups and restore testing outside the application container lifecycle.

## Configure the server

From the repository root:

```bash
cp deploy/production.env.example deploy/production.env
```

Edit `deploy/production.env` and set, at minimum:

- `APP_URL` to the public HTTPS origin.
- `POSTGRES_PASSWORD` and the matching `DATABASE_URL`.
- A random `BETTER_AUTH_SECRET` with at least 32 characters.
- Live Stripe keys and the webhook signing secret.
- Production Turnstile keys.
- `RESEND_API_KEY` and `EMAIL_FROM`.
- All R2 variables. Production local-disk uploads are intentionally rejected, so class images need R2 or another S3-compatible service.

Generate secrets on the server rather than placing real values in source control. For example:

```bash
openssl rand -hex 32
```

If the PostgreSQL password contains URL-reserved characters, percent-encode it in `DATABASE_URL`. Using a long URL-safe password avoids that extra step.

The Compose file uses `deploy/production.env` twice: as the container environment file and as the Compose interpolation file. Include `--env-file deploy/production.env` on every Compose command so the database credentials and port settings are resolved consistently.

## Validate, build and start

Validate the Compose file without printing the resolved secret values:

```bash
docker compose --env-file deploy/production.env config --quiet
```

Build all three application images and start the stack:

```bash
docker compose --env-file deploy/production.env build --pull
docker compose --env-file deploy/production.env up -d
```

The first start creates the PostgreSQL volume, waits for PostgreSQL to pass its health check, applies migrations, and then starts the web and email-worker services. Check the result with:

```bash
docker compose --env-file deploy/production.env ps
curl --fail http://127.0.0.1:3000/api/health
```

The health endpoint must report the database as available before traffic is sent through the reverse proxy.

## Create the first administrator

Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` and `INITIAL_ADMIN_NAME` in `deploy/production.env` temporarily. Then run the bootstrap script from the already-built tools image:

```bash
docker compose --env-file deploy/production.env run --rm --no-deps worker node_modules/.bin/tsx scripts/bootstrap-admin.ts
```

Remove all three `INITIAL_ADMIN_*` values immediately after the command succeeds. There is no public administrator registration path.

## Stripe and reverse proxy

Point the live Stripe webhook at:

```text
https://your-public-host.example/api/stripe/webhook
```

Forward HTTPS traffic from the reverse proxy to `http://127.0.0.1:3000`. Preserve the original host and protocol headers so generated account, booking and payment links use the canonical `APP_URL`. Do not expose the PostgreSQL port publicly.

## Releases and migrations

Migrations run as a Compose dependency before the new web and worker containers become healthy. For a release:

```bash
git pull
docker compose --env-file deploy/production.env build --pull
docker compose --env-file deploy/production.env up -d
```

If a migration fails, the web and worker services remain blocked. Inspect the migration logs, correct the issue, and rerun it:

```bash
docker compose --env-file deploy/production.env logs migrate
docker compose --env-file deploy/production.env run --rm migrate
docker compose --env-file deploy/production.env up -d
```

Review generated migration SQL before deploying schema changes. Take a database backup before applying a migration that changes or removes data.

## Logs and operations

```bash
docker compose --env-file deploy/production.env ps
docker compose --env-file deploy/production.env logs -f web
docker compose --env-file deploy/production.env logs -f worker
docker compose --env-file deploy/production.env restart web
```

The worker is intentionally a polling process. It claims outbox rows transactionally and retries failed deliveries with backoff. If email delivery is unavailable, messages remain in the database for retry rather than being silently discarded.

## PostgreSQL backups

Create a logical backup without publishing the database port:

```bash
docker compose --env-file deploy/production.env exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > backup-$(date +%Y%m%d-%H%M%S).sql
```

Restore only during a planned maintenance window. The following replaces rows in the selected database, so verify the backup and target before running it:

```bash
docker compose --env-file deploy/production.env exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backup.sql
```

`docker compose down` preserves the named volume. Do not use `docker compose down -v` on a production host; it removes the PostgreSQL data volume.

## Shutdown and troubleshooting

Stop the services while preserving data:

```bash
docker compose --env-file deploy/production.env down
```

Useful checks:

- Migration failed: `docker compose --env-file deploy/production.env logs migrate`.
- Database is unhealthy: `docker compose --env-file deploy/production.env logs db` and check disk space.
- Web is unhealthy: `docker compose --env-file deploy/production.env logs web`; verify `APP_URL`, `DATABASE_URL` and the required runtime secrets.
- Emails are pending or failed: `docker compose --env-file deploy/production.env logs worker`; verify Resend credentials and `EMAIL_FROM`.
- Class image uploads fail: verify every R2 variable and ensure the R2 bucket is reachable from the server.

Never commit `deploy/production.env`. It is ignored by the repository’s `.gitignore`; use the server’s secret manager or protected deployment files to distribute it.
