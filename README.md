# ANZ CPD

ANZ CPD is a production-oriented booking platform for continuing professional development activities for immigration professionals in Australia and New Zealand. It supports public catalogue discovery, guest checkout, customer accounts, country-specific professional identifiers and CPD units, protected administration, Stripe Checkout, webhook-authoritative payment state, refunds, capacity reservations, source references and transactional email.

The initial seed data is deliberately unpublished. It uses professional immigration terminology and official source references, but it does not claim government accreditation, endorsement or provider approval.

## Stack

- Next.js 16 App Router with React 19 and strict TypeScript
- PostgreSQL with Drizzle ORM and checked-in SQL migrations
- Better Auth email/password authentication with verified email and secure sessions
- Stripe Checkout, signed webhooks, persisted webhook idempotency and Stripe refunds
- Cloudflare Turnstile Siteverify validation plus database-backed application rate limits
- Tailwind CSS, GSAP with ScrollTrigger and reduced-motion handling
- Resend or SMTP email delivery behind an outbox/retry abstraction
- Validated class media uploads stored in `public/assets`
- Vitest unit/integration tests and Playwright critical-path browser tests

## Architecture and decisions

The application keeps domain logic in `server/` and `lib/`, while App Router pages are responsible for composition. The main boundaries are:

- `server/bookings/service.ts`: server-priced Checkout creation, locked capacity reservation, explicit status transitions and booking fulfilment.
- `server/payments/webhook.ts`: raw-body Stripe signature verification is handled by the route, then events are persisted and claimed before side effects are applied.
- `server/payments/refunds.ts`: locked refund amount validation, Stripe idempotency, refund lifecycle state and booking/payment synchronization.
- `server/auth/`: Better Auth configuration, server-session authorization and secure account setup/claim tokens.
- `server/catalogue/`: public/admin catalogue queries and server-authorized catalogue mutations.
- `db/schema/index.ts`: auth tables and business tables, with foreign keys, unique indexes, check constraints and timestamped records.
- `/admin/source-references`: editable jurisdiction-scoped editorial references attached to classes for traceability.
- `/api/health`: a no-store readiness check that reports database availability without exposing configuration.

Prices are integer minor units. A booking stores a title, price, currency, timezone and CPD snapshot so later catalogue edits do not change historical commercial records. A class row is locked before capacity is counted and a pending booking is inserted, so simultaneous final-seat attempts cannot oversell the class. Pending holds are released by Stripe expiration/failure events; local time alone is not treated as proof that an uncertain payment is abandoned.

The browser never decides price, payment success, role, booking ownership or refund amount. The success page is informational; Stripe webhooks are the payment authority. Guest confirmation links use random, hashed, time-limited tokens and never expose online attendance information before entitlement is confirmed.

## Requirements

- Node.js 20.9 or newer
- pnpm 12 or newer
- PostgreSQL 15 or newer
- Stripe CLI for local webhook forwarding

Install dependencies with pnpm only:

```bash
pnpm install
cp .env.example .env
```

Create a PostgreSQL database and set `DATABASE_URL`. Set a random `BETTER_AUTH_SECRET` of at least 32 characters. The app validates runtime environment variables when a server integration is used; production must provide Stripe, Turnstile and transactional-email configuration.

## Local startup

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Seed records are draft-only. To create the first administrator, set the three `INITIAL_ADMIN_*` variables in `.env`, then run:

```bash
pnpm db:bootstrap-admin
```

Remove those bootstrap variables after the command completes. There is no public administrator registration path.

## Database workflow

```bash
pnpm db:generate   # create a new checked-in migration after a schema change
pnpm db:migrate    # apply migrations safely
pnpm db:seed       # idempotent AU/NZ taxonomy, references and draft classes
```

Migrations live in `db/migrations`. Review generated SQL before applying it in production. Back up PostgreSQL before migrations and verify restore procedures. Financial and audit records use restrictive foreign keys or archival states instead of destructive deletion.

## Stripe test mode

1. Create test-mode API keys in Stripe and set `STRIPE_SECRET_KEY`.
2. Start the app with `pnpm dev`.
3. Forward signed events with the Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the CLI `whsec_...` value into `STRIPE_WEBHOOK_SECRET` and restart the app.
5. Publish a valid seeded or admin-created class, then use the real booking form. Stripe Checkout is hosted by Stripe; do not put card numbers in this application.

The webhook route expects, at minimum, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `refund.created`, `refund.updated`, `refund.failed`, `charge.refunded` and `payment_intent.payment_failed`. Events are signature-verified, uniquely recorded, claimed once and safe to retry. Pending reservations remain fail-closed until Stripe reports an authoritative expiration/failure or payment outcome; local clock expiry alone does not release an uncertain hold.

Use Stripe test cards from Stripe’s documentation for successful, declined and asynchronous-payment scenarios. Test abandoned/expired Checkout Sessions, duplicate event delivery, full refunds, partial refunds and a failed refund state before production enablement.

## Turnstile

Turnstile is validated server-side through Cloudflare Siteverify on registration, login, forgotten-password and guest booking. The client token is never accepted as proof by itself. For automated tests, use Cloudflare’s official testing keys or mock the Siteverify boundary as the unit tests do. `TURNSTILE_DEV_BYPASS=true` is allowed only outside production and should not be used as a production configuration.

## Email delivery

Critical booking/webhook handlers enqueue messages in `email_outbox` rather than waiting for a slow provider. A scheduler or worker should run:

```bash
pnpm email:process
```

The outbox retries failed messages with backoff and has a unique deduplication key. Set `EMAIL_PROVIDER=smtp` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER` and `SMTP_PASSWORD` to use SMTP. Port 465 normally uses `SMTP_SECURE=true`; port 587 normally uses `SMTP_SECURE=false` with `SMTP_REQUIRE_TLS=true`. `EMAIL_PROVIDER=auto` selects SMTP when `SMTP_HOST` is set, otherwise Resend when `RESEND_API_KEY` is set. In non-production without either provider, processing logs only safe message metadata; production fails closed rather than pretending email was delivered.

Required messages include email verification, password reset, account setup/claim, booking confirmation, booking cancellation and refund status. The outbox also reclaims stale processing leases so a worker crash does not permanently strand a message.

## Media

Admin uploads accept PNG, JPEG and WebP images up to 5 MB. MIME type, size and magic bytes are checked server-side. Validated files are written to `public/assets/classes/<class-id>/` and served directly by Next.js at `/assets/...`; PostgreSQL stores the relative asset key and alt text. In Docker production, the web service mounts a persistent volume at `/app/public/assets` so uploaded media survives container replacement.

## Content and source references

Seed references are maintained as editable records. The implementation was checked against official sources including:

- Australia: [OMARA CPD rules](https://www.mara.gov.au/continuing-professional-development/before-you-re-register/cpd-rules)
- Australia: [Department of Home Affairs skilled occupation list](https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list)
- New Zealand: [Immigration New Zealand Operational Manual — Skilled Migrant Category](https://www.immigration.govt.nz/opsmanual/90250.htm)
- New Zealand: [Immigration New Zealand Operational Manual — Accredited Employer instructions](https://www.immigration.govt.nz/opsmanual/82317.htm)
- New Zealand: [IAA continuing professional development toolkit](https://www.iaa.govt.nz/for-advisers/adviser-tools/continuing-professional-development-toolkit/)

Regulatory content is not scraped per request. Administrators maintain source title, authority, URL, jurisdiction, checked date and notes. Public class copy includes an educational-material disclaimer and does not claim approval or guarantee an immigration outcome.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The default unit suite runs without PostgreSQL. `tests/database.integration.test.ts` runs when `DATABASE_URL` is available and migrations have been applied; it exercises webhook uniqueness and a two-request final-seat race. Set `E2E_DATABASE_READY=1` after preparing a local database and seed data to enable the database-backed Playwright journeys.

Playwright may require browser installation on a new machine:

```bash
pnpm exec playwright install chromium
```

## Production deployment considerations

- Use a managed PostgreSQL deployment with encrypted connections, backups and tested restore procedures.
- Set `APP_URL` to the canonical HTTPS origin and configure Stripe webhook delivery to `/api/stripe/webhook`.
- Provide a strong Better Auth secret, Stripe live keys, a live webhook secret, Turnstile production keys and a transactional email provider through the deployment secret manager.
- Run migrations as a controlled release step, not on every request.
- Run the email outbox processor through a durable scheduler/worker.
- Put infrastructure-level WAF/rate limits in front of the app in addition to the application rate-limit buckets.
- Configure centralized structured logs/error reporting without logging passwords, tokens, card data, Turnstile secrets or full professional identifiers.
- Keep the per-request CSP nonce configuration in `proxy.ts`; the remaining `style-src 'unsafe-inline'` is deliberate for runtime styling/animation compatibility and should be revisited if the frontend no longer needs it.
- Replace the public legal information pages with the operating entity’s reviewed privacy, terms and refund language before launch.

## Production Docker Compose deployment

Use the production Compose stack in [`docs/docker-production.md`](docs/docker-production.md). It builds the standalone web image, runs PostgreSQL with a persistent volume, applies migrations before startup and keeps the email outbox processor running as a separate service.

The final web image remains independently buildable with `docker build -t anzcpdweb:production .`, but production deployments should use Compose so database readiness, migrations and the worker have an explicit lifecycle.
