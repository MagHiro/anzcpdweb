# Security maintenance

## Class resources

- PDF materials are stored outside `public` on the persistent `private-resources` volume. Back up this volume alongside the database; database backups alone do not include PDF content.
- Resources are drafts until explicitly published. Every download checks the signed-in account for an active owned booking (confirmed or partially refunded); administrators may preview drafts. Cancellation or full refund removes participant access. No public catalogue resource URLs are exposed.
- Recording links use the same access checks, but external video hosts must enforce playback restrictions; redirects cannot prevent sharing the destination URL. Use authenticated/domain-restricted hosting where required.

## Authentication boundaries

- Browser authentication uses the application routes with validation, Turnstile where configured, origin checks, and PostgreSQL-backed rate limits. The generic Better Auth handler exposes only session reads, verification/reset callbacks, and sign-out. Do not expose raw sign-in/sign-up/password mutation endpoints without equivalent controls.
- Passwords require 12–128 characters. Password reset tokens expire after 30 minutes and successful resets revoke existing sessions. Password changes revoke other sessions.
- Sessions expire after 60 minutes by default, or seven days with explicit Remember me consent. Session refresh is disabled so activity does not extend the expiry. Existing sessions are capped at 60 minutes during the MFA migration. Production cookies are secure, HTTP-only, and SameSite=Lax.
- Customers can enable authenticator-app MFA under Account → Security. Activation requires a password and a valid TOTP code. Encrypted MFA secrets and single-use recovery codes are managed by Better Auth. A password reset does not disable MFA; users without their authenticator need an unused recovery code. No trusted-device bypass is exposed.
- Admin mutations recheck the user's role in the database. Account booking access checks ownership server-side.
- The web container must remain bound to loopback behind the trusted Apache reverse proxy. Rate limits use the rightmost forwarded IP appended by Apache, not client-supplied Cloudflare or X-Real-IP headers. Revisit this assumption before changing proxy topology.

## Deployment protection

Each build gets a deployment ID. Browser mutations carry that ID and are rejected before execution if it is absent or stale. Stripe webhooks are exempt and retain Stripe signature verification. The version identifier is not an authentication credential or a substitute for authorization/CSRF protection.

Open pages check for updates every 30 seconds, on focus/reconnection, and before fetch-based mutations. An update opens a non-dismissible reload dialog. Reloading may discard unsaved edits. Pages predating this guard cannot display the dialog but their unversioned mutations are rejected.

## Release checks

Run `pnpm audit`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and relevant Playwright tests before release. Dependency audit results cover known published advisories, not a guarantee that the application is vulnerability-free. Review security overrides in `pnpm-workspace.yaml` during dependency updates.

Keep production secrets outside Git. Rotate any credentials disclosed in chat or logs directly in the provider and production environment. This release does not rotate Stripe credentials. Back up the database and auth encryption secret securely; losing the encryption secret affects MFA recovery.
