# Security maintenance

## Authentication boundaries

- Browser authentication uses the application routes with validation, Turnstile where configured, origin checks, and PostgreSQL-backed rate limits. The generic Better Auth handler exposes only session reads, verification/reset callbacks, and sign-out. Do not expose raw sign-in/sign-up/password mutation endpoints without equivalent controls.
- Passwords require 12–128 characters. Password reset tokens expire after 30 minutes and successful resets revoke existing sessions. Password changes revoke other sessions.
- Sessions expire after seven days and renew after 12 hours. Production cookies are secure, HTTP-only, and SameSite=Lax.
- Admin mutations recheck the user's role in the database. Account booking access checks ownership server-side.
- The web container must remain bound to loopback behind the trusted Apache reverse proxy. Rate limits use the rightmost forwarded IP appended by Apache, not client-supplied Cloudflare or X-Real-IP headers. Revisit this assumption before changing proxy topology.

## Deployment protection

Each build gets a deployment ID. Browser mutations carry that ID and are rejected before execution if it is absent or stale. Stripe webhooks are exempt and retain Stripe signature verification. The version identifier is not an authentication credential or a substitute for authorization/CSRF protection.

Open pages check for updates every 30 seconds, on focus/reconnection, and before fetch-based mutations. An update opens a non-dismissible reload dialog. Reloading may discard unsaved edits. Pages predating this guard cannot display the dialog but their unversioned mutations are rejected.

## Release checks

Run `pnpm audit`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and relevant Playwright tests before release. Dependency audit results cover known published advisories, not a guarantee that the application is vulnerability-free. Review security overrides in `pnpm-workspace.yaml` during dependency updates.

Keep production secrets outside Git. Rotate any credentials disclosed in chat or logs directly in the provider and production environment. This release does not rotate Stripe credentials or add multi-factor authentication.
