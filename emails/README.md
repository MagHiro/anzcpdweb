# Transactional emails

All eight templates are maintained in code. There is no admin email editor,
template database, or separate preview application.

Templates use a shared table-based layout in `_components/layout.tsx`, with
14px Tahoma body text, a 20px heading, and a forest-green action button.
Each email includes a plain link as a fallback for the button. Example props
are fictional; production values come from the email queue.

Subjects and template selection live in `server/email/render.tsx`. Rendering
produces HTML and plain text through `@react-email/render`. Queue processing,
SMTP/Resend delivery, and PDF receipt attachments remain in
`server/email/service.ts`.

Run `pnpm test` to check rendering, escaping, transaction details, safety copy,
and typography. Never put real customer data or live tokens in examples.
