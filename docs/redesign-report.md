# ANZ CPD product redesign specification

**Repository:** `anzcpdweb`  
**Date:** 21 September 2026  
**Scope:** product, information architecture, interaction design, visual language, design system, responsive behavior, and frontend migration plan.

This specification is based on repository inspection, the rendered public catalogue, the database schema and seed data, the booking/payment services, and targeted Mobbin research. It is intentionally implementation-oriented: every recommendation is tied to a current route, data shape, workflow, or reusable frontend boundary.

## 1. Executive summary

ANZ CPD is a source-led continuing-professional-development booking platform for migration professionals in Australia and New Zealand. The redesign should make the product feel like a reliable professional record and booking desk: calm and editorial in public, compact and operational in the admin, and explicit about payment and entitlement state everywhere.

The fundamental change is structural rather than cosmetic:

1. **Create one public activity catalogue.** The current `/courses` and `/classes` surfaces overlap and expose different filters. `/classes` should become the canonical live catalogue; `/courses` remains a compatibility route that translates query parameters and redirects. Public copy should use “activity” or “class” according to context, while the internal `classes` data model remains unchanged.
2. **Separate shells by job.** Public discovery, customer record management, and admin operations should share tokens and primitives but have different navigation, density, and page framing. The current public header is inherited by account and admin routes, which makes internal work feel like a marketing page with a sidebar attached.
3. **Put decision facts first.** Country, date/timezone, delivery, CPD value, presenter, price, capacity, identifier requirement, and source provenance should be scannable before a user commits to a booking or opens a long description.
4. **Treat status as a first-class interaction model.** Human-readable booking/payment/refund states, explicit pending language, and state-specific next actions should replace generic uppercase badges and ambiguous success pages. Stripe remains authoritative; the UI must never imply that a return redirect confirms payment.
5. **Use the right density for the task.** Public detail and forms are comfortable; catalogue results and admin lists are compact; admin editors are structured workspaces rather than long modal chains.
6. **Make high-risk actions staged and reversible.** Cancellation and refund remain separate actions, with a review step, clear amount/reason, webhook-pending language, and an audit trail. Browser `confirm()` is not sufficient for financial operations.

The best first implementation slice is the shared foundation plus the public catalogue: tokens, buttons/fields/statuses, public header, activity-card/data presentation, filter bar, and responsive `/classes`-style collection behavior. It proves the system across typography, navigation, controls, data density, empty/loading states, and mobile behavior without changing booking or payment invariants.

## 2. Product understanding

### Product and users

| User | Context | Primary job | Secondary jobs | Trust concerns |
| --- | --- | --- | --- | --- |
| Australian migration professional / registered migration agent | Time-poor, searching for relevant CPD points | Find a credible, relevant activity and book it | Compare dates, format, presenter, price, and capacity; retain evidence | MARN handling, current professional requirements, no false OMARA approval claim |
| New Zealand immigration adviser | Needs hours and jurisdiction-specific relevance | Find an activity that fits NZ practice and record it | Read instructions/source references; manage attendance details | IAA licence handling, current instructions, no false IAA approval claim |
| Returning customer | Has already paid or attended | Check upcoming bookings and attendance information | Retrieve reference/payment record, cancel an unpaid hold, update profile/security | Private records, entitlement before online attendance information |
| Guest customer | Wants to book without account friction | Complete one secure registration | Create an account after payment or connect prior bookings | Email ownership, payment authority, duplicate/uncertain payment state |
| Catalogue/editorial admin | Maintains public learning records | Create, verify, publish, and archive classes | Assign presenters, attach official sources, manage taxonomy/media | Draft/publish boundary, source traceability, historical snapshots |
| Operations/finance admin | Handles live customer and money exceptions | Find a booking and resolve payment/refund state | Review capacity, cancel class/booking, inspect audit log | Stripe/webhook authority, idempotency, no silent refunds |

### Primary user jobs and goals

**Primary customer goals**

- Find the next useful topic by country, category, activity type, or title.
- Verify that the class is relevant before paying: timing, timezone, delivery, CPD unit, presenter, price, seats, identifier requirement, and sources.
- Complete guest or signed-in booking without unnecessary account creation.
- Understand whether a booking is pending, confirmed, failed, cancelled, refunded, or still processing.
- Return later to a private, durable record of the activity and payment snapshot.

**Primary admin goals**

- Publish only complete, well-scoped activity records.
- See which classes need attention: pending payments, sold-out capacity, cancelled classes, failed/refund states, missing configuration.
- Search a booking quickly by attendee/email/class and open a single contextual record.
- Cancel and refund through explicit, auditable operations.
- Maintain country-specific taxonomy and official source references without breaking historical records.

**Likely frequency**

- Frequent: catalogue search/filter, class comparison, account booking lookup, admin booking search, class status review.
- Occasional but high-risk: booking payment, class publish/cancel, refund, account claim/setup, source-reference edit.
- Low frequency but important: profile/security changes, presenter/category maintenance, runtime settings.

### Product mental model

The core object is a **published CPD activity**:

`country → category → subject/title → presenter → date/timezone → delivery → CPD value → capacity → price → source references`

A **booking** is a dated commercial snapshot of that activity, not a live copy of the class. The schema preserves title, price, currency, CPD value, and timezone so future editorial changes do not rewrite historical records. A **payment state** is synchronized from Stripe webhooks, not inferred from the browser redirect. An **entitlement** controls access to protected attendance information. The redesign must make these distinctions visible without exposing implementation jargon.

### Application architecture inventory

- **Framework:** Next.js 16 App Router, React 19, strict TypeScript, server components by default.
- **Styling:** Tailwind CSS 4 imported through `app/globals.css`; semantic CSS variables already exist, with many repeated arbitrary utility values in page markup.
- **Motion:** GSAP and ScrollTrigger in `components/animations.tsx`, with reduced-motion handling.
- **Data:** PostgreSQL + Drizzle ORM. Catalogue reads live in `server/catalogue/queries.ts`; booking/payment state lives in `server/bookings`, `server/payments`, and server actions.
- **Auth:** Better Auth with verified email, HttpOnly sessions, customer/admin role checks, account setup/claim tokens.
- **Payments:** Stripe Checkout; signed, idempotent, webhook-authoritative events and explicit refund states.
- **Security:** Cloudflare Turnstile, rate limiting, token hashing, origin checks, server-side validation.
- **Media:** validated class images stored in `public/assets` and joined through `classMedia`.
- **Quality baseline:** `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass; 12 unit/integration tests pass and database-dependent tests are skipped without the integration environment.

### Route and module inventory

There are 43 UI page routes, 13 API routes, 13 component files, and 21 server modules.

**Public discovery and content**

- `/`, `/courses`, `/courses/[slug]` (legacy detail redirect), `/classes`, `/classes/[slug]`, `/classes/[slug]/book`
- `/australia`, `/new-zealand`, `/cpd-requirements`
- `/presenters`, `/presenters/[slug]`
- `/privacy`, `/terms`, `/refund-policy`

**Auth and booking outcomes**

- `/sign-in`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- `/booking/success`, `/booking/cancelled`, `/booking/confirmation`

**Customer record**

- `/account`, `/account/bookings`, `/account/bookings/[id]`, `/account/profile`, `/account/security`
- `/account/setup`, `/account/claim`

**Admin operations**

- `/admin`, `/admin/classes`, `/admin/classes/new`, `/admin/classes/[id]`
- `/admin/categories`, `/admin/presenters`, `/admin/source-references`
- `/admin/bookings`, `/admin/bookings/[id]`, `/admin/customers`
- `/admin/payments`, `/admin/refunds`, `/admin/audit-log`, `/admin/settings`

**Reusable UI currently in `components/ui.tsx`**

`Container`, `Section`, `PageIntro`, `AuthFrame`, `Button`, `LinkButton`, `Badge`, `CountryBadge`, `StatusBadge`, `MetricCard`, `Field`, `TextInput`, `TextArea`, `Select`, `FormNotice`, `Price`, `ClassCard`, `EmptyState`, and `Pagination`.

This is a good start, but the file currently combines foundations, public content cards, forms, and status logic. The redesign should preserve the primitives while splitting semantic families into smaller modules as they stabilize.

## 3. Existing UX audit

### Information architecture

| Finding | Evidence | Impact | Direction |
| --- | --- | --- | --- |
| Two overlapping catalogues | `/courses` filters country/category/activity type/search; `/classes` filters country/category/delivery/time/search | Users cannot predict which route contains the complete catalogue; links and language alternate between “courses”, “classes”, and “activities” | Make `/classes` canonical, merge filters, keep `/courses` as a compatibility redirect |
| Public and internal shells are coupled | Root layout always renders `SiteHeader` and `SiteFooter`; account/admin add their own sidebars below it | Admin and customer tasks carry marketing chrome and excessive vertical framing | Introduce public, account, and admin shells under shared tokens |
| Flat admin navigation | 11 links are one undifferentiated list | Catalogue, people, money, traceability, and configuration are mixed | Group by job and show active location plus page context |
| Country pages are parallel content silos | `/australia` and `/new-zealand` repeat the same structure | Useful context is separated from catalogue filtering and can become stale | Keep jurisdiction hubs, but make them entry points into the same filtered catalogue |
| Legacy naming is hidden rather than explained | `/courses/[slug]` silently redirects to `/classes/[slug]` | Deep links work, but the information model is not explicit | Preserve redirects for SEO; use “Activities”/“Classes” in visible IA |

### Interaction design

- The public mobile menu toggles an absolutely positioned panel but does not manage focus, close on outside interaction, or lock background scroll.
- `AdminModal` handles Escape and body overflow, but does not trap focus, restore focus to the trigger, expose a description relationship, or provide a mobile sheet interaction. A 20-field `AdminClassForm` inside a modal is difficult to orient and easy to abandon.
- Destructive actions use browser `window.confirm()`. This is not branded, is hard to contextualize, and gives no structured review of affected bookings or refund separation.
- Catalogue filters are server-rendered and functional, but labels are visually hidden, category chips can become a long unstructured strip, filter changes are not summarized as removable tokens, and page state can be lost when switching time tabs in `/classes`.
- Pagination only infers “next page” from page size and does not communicate total results or current query context.
- There is no shared popover, command/search pattern, toast, alert-dialog, drawer, or structured table toolbar. Several pages reimplement search/select/filter controls.
- Form feedback is generally present through `Field` and `FormNotice`, which is a strength. However, form-level error summaries, save status, and dirty-state protection are absent from the long admin editor.

### Visual hierarchy and density

- The public art direction is already recognizable—deep forest, warm paper, serif display, coral signal, grid/grain texture—but the same expressive treatment appears on functional surfaces. Large headings, grid backgrounds, rounded cards, shadows, and decorative field-note illustrations compete with the data.
- The home and catalogue heroes use very large display type and generous vertical space. That is suitable for brand introduction, but it pushes the actual search task below the fold and makes the seeded “no upcoming dates” state feel like a dead end.
- Class cards give the decorative `VisualMark` roughly the same visual weight as the class facts. The actual class media relationship is available in the data but not used in listing cards.
- Almost every block is a rounded, elevated card. Tables, warnings, forms, stat cards, empty states, and content sections need distinct surface rules so elevation communicates interaction or importance.
- Admin lists are visually comfortable but not operationally dense. Status, identifier, date, and financial information do not get a shared alignment/formatting system.

### Forms

Strengths:

- `Field` associates labels, hints, errors, `aria-describedby`, and `aria-invalid` with its child control.
- Server validation is domain-aware: country-specific identifier formats, booking terms, date ordering, capacity, CPD amount, and refund amount.
- Guest checkout is intentionally supported, and account creation is optional rather than blocking payment.

Problems:

- Booking is a long single-page form with two large “step” cards but no actual step interaction, progress state, or sticky order summary on small screens.
- Email confirmation is safe but adds friction; signed-in users are not visibly prefilled or told how their existing account changes the flow.
- Admin class creation/editing repeats the same form in a full page and a modal, creating two shells for one workflow.
- “Price in minor units” is an implementation detail exposed to admins. The editor should accept/display major units and convert server-side while preserving integer storage.
- Required, optional, and sensitive fields are not summarized before submit; source/reference and media workflows are separate but not represented as completion checkpoints.

### Data presentation

- Public discovery uses cards even when the user’s primary task is comparison. A compact list/table toggle would help professional users compare date, CPD, delivery, price, and remaining capacity.
- Admin tables use `min-w-*` and horizontal scrolling. This preserves columns but makes mobile operations effectively unusable and hides row actions outside the viewport.
- Booking, payment, and refund records are split into separate pages without a shared data-table toolbar, saved filter model, row status vocabulary, or direct contextual links.
- Admin dashboard metrics are honest and not decorative, but the page lacks a “needs attention” queue tied to pending payments, failed payments, sold-out classes, cancelled classes, and refunds requiring action.
- Source references are correctly modeled and surfaced, but public provenance is visually subordinate to the class narrative and the admin source-reference page stacks all edit forms into a long document.

### States

- Loading: a global skeleton exists, but it is generic and only represents a hero plus three cards; list/detail/admin archetypes need their own skeletons.
- Empty: copy is generally honest and avoids fake content. The default seed state has no upcoming published classes, so empty-state UX is not an edge case—it is the default development/early-production state. Empty screens should offer a path to past classes, country context, guide, or contact without implying a broken catalogue.
- No-results: catalogue filters do not show the active query as a compact summary or provide a one-click “clear all” adjacent to the result count on every breakpoint.
- Payment: success and cancellation pages correctly warn that redirect is not payment authority, but “We’re confirming your booking” needs a visible state timeline and a direct link to the account/guest record. “Do not pay again” should be the dominant recovery guidance.
- Permission/not-found: access is server-protected, but customer/admin permission failure and missing/expired token states are not a common shared pattern.
- Success: profile/password actions use inline notices, while admin actions use screen-reader-only status messages. A shared visible toast/banner would improve confidence without changing server behavior.

### Accessibility

Strengths:

- `focus-ring` is consistently used on many links/buttons.
- Form fields have semantic labels through `Field`; status text is not color-only because status words are rendered.
- Reduced-motion CSS exists and GSAP checks `prefers-reduced-motion`.
- `next/image` alt text is present for class media.

Risks to address:

- Focus is not trapped/restored in `AdminModal`; the mobile public menu has no focus management.
- Status labels are raw enum strings (for example `PARTIALLY REFUNDED`), and some meaningful states map to neutral tone. Use human labels plus icon/shape and a text explanation where action depends on the state.
- Visually hidden labels on public filters satisfy semantics but reduce visible wayfinding. Use visible compact labels or a clear filter heading on desktop and accessible labels on mobile.
- Dense table overflow has no alternate mobile row/card reading order.
- Large serif display text, uppercase eyebrow text, low-contrast muted text, and small 10–11px labels need a contrast/zoom review at 200% and on low-quality displays.
- Icon-only controls are limited today, but any new icon button needs an accessible name, 44px target, and tooltip only as reinforcement, never as the sole label.

### Responsive UX

- Public mobile header is compact and visually good, but menu content behaves like a dropdown rather than a dedicated mobile navigation surface.
- Catalogue filter controls stack acceptably but category chips create a long vertical taxonomic wall. Country should remain a top-level segmented control; secondary filters should collapse into a drawer/sheet with an active-filter count.
- Cards become single-column, but the user still has to scroll through decorative space before reaching comparable facts. A compact mobile activity row/card is better.
- Admin/account sidebars stack above content at narrow widths. Account navigation should become a horizontal scroll tab row or select-like “section switcher”; admin should become a top bar plus drawer, not a 245px sidebar pushed above every page.
- Tables need an intentional mobile transformation: priority fields in a row card, secondary metadata in a disclosure, and a direct “Open record” action. Horizontal scroll may remain for power users on tablet/desktop.
- Booking should use a fixed bottom action bar on mobile after the attendee section is complete, while keeping terms/security copy in the page flow.

## 4. Mobbin research

The following references were inspected as images, not inferred from titles alone. They are evidence for interaction principles, not templates to copy.

### Catalogue discovery and filtering

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [SuperHi course search](https://mobbin.com/screens/9c320c2d-abb2-4b49-b80f-9a548a53d4a4) | Search title, a narrow filter rail, clear result grouping | The user sees the search intent and the result collection as one task; filters stay visually subordinate | Keep a single canonical activity collection; use country as a top-level scope, with category/type/delivery in a compact toolbar or mobile sheet |
| [Uxcel courses](https://mobbin.com/screens/1adf3baa-af36-4c2f-8bdd-c80090c8f3c7) | Persistent sidebar, filter chips, sort/filter controls, repeated result cards | The active filter is visible as a removable token and cards expose comparable metadata consistently | Add active filter tokens, result count, and an explicit sort order. Avoid ratings/popularity because the repository has no such data |
| [Unity courses](https://mobbin.com/screens/33327be3-56c6-4e70-9d0d-bd6c0f3f0592) | Search/filter row above editorial result blocks | It supports browsing without making the user understand a complex taxonomy first | Use repository categories and activity types only; never invent difficulty, ratings, or learner counts |
| [Wix booking list](https://mobbin.com/screens/ce5fdcfd-2289-4b30-8b33-80eb66cd8c7b) | Filtered list with a visible applied-filter strip | It makes scope obvious and supports clearing without reopening filter controls | Reuse the same pattern for admin bookings/classes with status and country tokens |

### Detail and booking decision surfaces

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [Sweatpals event detail](https://mobbin.com/screens/e80f318e-0985-4c2b-acd5-0c76ab5d4bef) | Title, date/location facts, price and registration action are adjacent | The user can decide without scanning a long description; secondary content follows | Put country, date/timezone, delivery, CPD, capacity, price, and identifier requirement in a “decision strip”; retain the long source-led description below |
| [Podia course detail](https://mobbin.com/screens/108082bf-db8b-4b5b-b668-8cb342b7d0f2) | Strong primary action near title and a structured content outline | It makes the next step obvious while allowing deeper reading | Keep a sticky summary rail on desktop and a bottom action bar on mobile; do not introduce course lessons because the schema models live activities |
| [Luma event detail](https://mobbin.com/screens/9af424b7-5e7f-4619-af62-25a763624cee) | Mobile image → title → date/location → price → register hierarchy | The order matches the user’s decision sequence and keeps the CTA in thumb reach | Use real class media when available, a restrained country field mark when absent, and a fixed `Book this class` action after the decision facts |

### Account and booking history

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [Eventbrite orders](https://mobbin.com/screens/8a2cfcc4-27c8-4dd4-b6f7-e34706c88dbe) | Simple order history with chronological grouping | It respects the user’s mental model of “what I booked” and avoids dashboard decoration | Make upcoming/current bookings the default, with past/history separated by time and state |
| [Klook bookings](https://mobbin.com/screens/78e82cdd-3669-4f2e-b1a9-7709d7e870a7) | Booking cards expose payment/booking state and the next action | Users can recover an unpaid or incomplete booking without opening every detail | Show `Awaiting payment`, `Processing`, `Confirmed`, `Cancelled`, `Refunded` as human labels and provide state-specific actions |
| [Cal.com bookings](https://mobbin.com/screens/ec5a3260-529c-4a69-92c7-baa7ff25dada) | Tabs/time scopes above a compact booking list | It keeps high-frequency records scannable and filterable | Use `Upcoming`, `Past`, and `Needs attention`; do not add recurring/event types that do not exist in the product |

### Admin navigation and operations

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [PlanetScale console](https://mobbin.com/screens/a1fa1590-52b6-4554-b83c-03e998fe6537) | Persistent left navigation with active route and quiet hierarchy | The user maintains location while moving among operational tools | Group ANZ CPD admin into `Overview`, `Catalogue`, `Bookings`, `Money`, `Traceability`, `Configuration`; use a drawer on mobile |
| [AWS console](https://mobbin.com/screens/c839e132-c236-4acc-9ac5-1643a76f6e26) | Search and service grouping for broad tools | It is useful when the tool set exceeds a single flat list | Use a small admin command/search affordance only after the grouped nav is clear; avoid AWS-scale complexity for 11 routes |
| [Time2book overview](https://mobbin.com/screens/68e4fd67-55c5-4831-8919-6cf861982aa0) | Metrics paired with recent activity/attention, not decorative charts | It answers “what needs my attention?” before “what are the numbers?” | Add attention queues linked to real pending payments, failed/refund states, sold-out classes, and incomplete draft checks |

### Tables, filters, and editors

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [Fresha appointments table](https://mobbin.com/screens/a1f76a62-568f-4b2d-9c9f-6a610dd3ebf7) | Dense table with search, date filter, sort, and status | It supports repeated operational scanning without turning every row into a card | Add common toolbar and column rules to bookings/payments/refunds/classes; keep the amount/status/date alignment consistent |
| [Cal.com booking list](https://mobbin.com/screens/af649dfd-530a-451f-a953-a39ee3ba40ff) | Tabs + filter + search + row actions | The user can narrow the list before acting and sees actions in context | Use status tabs only for high-value scopes; use query tokens for class/country/search rather than a giant form |
| [Circle event editor](https://mobbin.com/screens/5e14d073-c106-4314-8904-32557b5ceda0) | Top section navigation and sticky save/publish controls | Long editors become navigable, and save status remains visible | Use a full-page class workspace with sections `Basics`, `Schedule`, `Delivery`, `Capacity & CPD`, `Media & sources`, `Search`; preserve draft-first/publish gate |
| [Eventbrite event creation](https://mobbin.com/screens/593564c3-518f-4ceb-a45c-72eb118df221) | Progressive disclosure for time, format, price, and capacity | Fields appear in an order that matches event setup and avoids an all-at-once wall | Keep the existing schema and validation, but reveal capacity/venue/online fields based on delivery and capacity mode |
| [Whop course editor](https://mobbin.com/flows/db66e97a-c08e-48fa-9665-8b4fe611eadc) | Persistent multi-pane editor navigation and staged content creation | The editor preserves context while the user moves through related data | Adapt only the section navigation; the ANZ CPD editor remains a simple server-rendered form rather than a course-builder canvas |

### Flow research

| Reference | Useful pattern | Why it works | ANZ CPD adaptation |
| --- | --- | --- | --- |
| [Expedia activity booking flow](https://mobbin.com/flows/3ee59fa3-79db-4035-81c4-668581249fc7) | Availability/details → payment → final acknowledgement, with important information repeated before commit | Repetition at the final commit protects against wrong dates and amounts | Keep a compact booking summary beside attendee details and repeat the exact class/date/amount before sending the user to Stripe |
| [Klook ticket booking flow](https://mobbin.com/flows/591b29ab-c07a-498d-bd3b-299ce485a4d3) | Visible progress and a persistent order summary | It reduces uncertainty when the user moves through a payment sequence | Use a two-step pre-Stripe flow, then make Stripe the payment step; label the return page `Payment status` rather than assuming success |
| [Sweatpals registration flow](https://mobbin.com/flows/89054293-0f7d-4be9-80c4-f7b776826b56) | Detail facts and registration requirements stay in the same context | The user does not have to reconstruct what they are registering for | Keep the class summary visible while attendee, identifier, terms, and account preference are completed |
| [Codecademy onboarding](https://mobbin.com/flows/9e0051c2-a775-4a37-adcd-a9649df80a60) | Short, explicit steps with a clear progress indicator | It communicates effort and makes a long setup feel bounded | Use this only for account setup/claim if more profile data is added; do not add unrequested personalization questions to the booking flow |
| [Tripadvisor cancellation flow](https://mobbin.com/flows/ed016519-280d-45f0-8212-6ac3a8dff57a) | Reason → review refund amount/policy → confirm | It makes the consequence and refund amount explicit before the destructive action | Admin cancellation and refund should remain separate but share a review panel; customer unpaid cancellation can be simpler because no refund is initiated |

## 5. Product design principles

1. **Decision facts precede persuasion.** Show country, date/timezone, delivery, CPD, price, capacity, identifier requirement, and presenter before long description or decorative art. This prevents important facts from being buried in a marketing hierarchy.
2. **One public catalogue, many entry points.** Country hubs, home categories, presenter pages, and the guide all link into one filterable activity collection. This prevents duplicate route semantics and divergent filter behavior.
3. **Density follows task frequency.** Use comfortable spacing for reading and forms, compact rows for catalogue comparison, and dense tables for admin operations. This prevents the current “every surface is a card” visual monotony and reduces scroll cost.
4. **Provenance is part of the content model.** Source references are not a footer detail; they are a confidence signal attached to the activity and visible at the point of evaluation. The UI must say that a reference is traceability, not accreditation.
5. **Status always explains the next safe action.** Every booking/payment/refund state gets a human label, an explanation when needed, and a contextual next action. This prevents false certainty around Stripe, capacity, and refunds.
6. **Destructive operations are explicit and staged.** Cancellation, class cancellation, and refund are distinct operations. Confirmation must include impact, amount, reason, and pending/final-state language; no silent refund side effects.
7. **Mobile changes the interaction model.** Filters become a sheet, admin navigation becomes a drawer, tables become prioritized rows, and booking actions become thumb-reachable—not merely stacked desktop columns.
8. **Preserve the record even when the catalogue changes.** Historical booking snapshots and payment references are immutable user evidence. Editorial controls may change future public records but never rewrite past commercial meaning.

## 6. Art direction

### Brand personality

**Precise, calm, source-led, quietly authoritative, and human.** The product should feel suitable for professionals making defensible decisions under time pressure, not like a generic education marketplace or a financial back office. The visual system should convey care and trust through order, provenance, and readable detail rather than badges, gradients, or gamification.

### Visual concept: “The working field guide”

Treat every activity like a well-edited field note: a clear title, jurisdiction mark, date stamp, CPD measure, presenter, source trail, and next action. Warm paper and deep forest ink carry the editorial character; fine rules, compact metadata, and small coral marks provide the rhythm of a professional ledger. Decorative texture is reserved for landing/empty states and never competes with operational content.

### Typography

- **Interface/data:** existing `Google_Sans_Flex`, kept as the project-compatible UI family. Use 14px as the default body size, 16px for comfortable reading, 12px for metadata, and `font-variant-numeric: tabular-nums` for prices, counts, dates, and IDs.
- **Display:** existing system serif stack (`Iowan Old Style`, `Baskerville`, `Times New Roman`) for page titles and editorial section headings. Limit display size to 48–64px on public hero surfaces and 32–48px on task pages; never use the 7.6rem scale inside catalogues/admin.
- **Weight hierarchy:** 700 for actions and labels, 600 for row titles, 400–500 for body, 800 only for the wordmark or small status emphasis.
- **Line height:** 1.05–1.15 for display, 1.35 for UI headings, 1.55–1.7 for body/prose, 1.25 for table rows.
- **Letter spacing:** uppercase labels may use 0.12–0.16em at 11–12px; avoid tracking-heavy body copy.
- **Usage rule:** every page has one clear `h1`; the serif hierarchy ends at section titles, not every card title.

### Semantic color direction

The existing palette is a good seed but should be made more semantic and less utility-specific.

| Role | Token | Direction |
| --- | --- | --- |
| Public canvas | `--color-canvas` | Warm vellum, approximately `#F6F3EC` |
| Elevated surface | `--color-surface` | Soft ivory, approximately `#FFFDF8` |
| Inset/admin canvas | `--color-inset` | Cool sage tint, approximately `#EEF3EF` |
| High-emphasis text | `--color-ink` | Deep green-black, approximately `#173B34` |
| Low-emphasis text | `--color-muted` | Desaturated green-gray, approximately `#5F706A` |
| Border/divider | `--color-border` | Quiet sage line, approximately `#D5E0D9` |
| Brand/primary | `--color-brand` | Forest green, approximately `#155044` |
| Brand-hover | `--color-brand-strong` | Darker forest, approximately `#103D35` |
| Accent | `--color-accent` | Coral/rust signal, approximately `#D36B4D` |
| Success | `--color-success` | Green with non-color label/icon |
| Warning | `--color-warning` | Amber with non-color label/icon |
| Danger | `--color-danger` | Brick red with non-color label/icon |
| Information | `--color-info` | Slate blue-green |
| Selection | `--color-selection` | Pale coral/forest tint, never a gradient |
| Focus | `--color-focus` | High-contrast coral ring plus 2px offset |

Rules:

- Forest is the primary action and navigation color; coral is a signal/CTA accent, not a second primary system.
- Tinted neutrals distinguish public canvas, inset groups, and admin surfaces.
- Status colors appear with a text label and, where helpful, a small icon/shape. Do not rely on color alone.
- Dark mode is not a first-release requirement. Keep tokens mode-ready, but prioritize high-contrast light mode because the current product is a professional record/print-friendly workflow.

### Shape, borders, and elevation

- Controls: 8px radius; compact tags/statuses: 999px only when the element is truly a token; standard buttons: 8–10px, not universally pill-shaped.
- Content surfaces: 12–16px radius. Use a card only when it groups a meaningful object or action; use plain sections and rules for prose and tables.
- Borders are the primary grouping tool. Shadows are reserved for sticky summary panels, dialogs, and a small number of interactive elevated surfaces.
- No large blur/glow around functional content. Grid/grain textures are limited to landing hero, empty state, or a provenance/guide callout.

### Iconography

- Keep the existing bespoke stroke icon family, normalized to 16/18/20px and `1.7–1.8` stroke width.
- Use icons to reinforce status, navigation, external links, search, filters, calendar, location, and security—not to decorate every label.
- Icon-only controls require an accessible name and 44px target. Tooltips are optional reinforcement.
- Country is communicated through text (`Australia`, `New Zealand`), not flags alone.

### Motion

- 120ms for hover/pressed feedback; 180ms for dropdown/sheet/dialog transitions; 240ms for page-section reveal.
- Use opacity/translate for entry and a short height/opacity transition for filter sheets. Avoid scroll-scrub art on tables/forms.
- Do not animate payment/status changes in a way that suggests a result before the server state is known.
- Respect `prefers-reduced-motion`; when active, remove parallax, stagger, and non-essential transforms.

## 7. Design system

### Foundation tokens

```text
color.canvas / surface / inset / elevated / inverse
color.ink / ink-muted / ink-subtle / border / border-strong
color.brand / brand-hover / accent / focus
color.success / success-surface / warning / warning-surface
color.danger / danger-surface / info / info-surface

font.ui / font.display / font-mono
type.xs 12/16, sm 14/20, md 16/24, lg 18/28, xl 24/30
type.h3 28/32, h2 36/40, h1 48/52, hero 64/66

space.1 4, 2 8, 3 12, 4 16, 5 20, 6 24, 8 32, 10 40,
space.12 48, 16 64, 20 80

radius.control 8, surface 12, feature 16, pill 999
border.default 1px solid color.border
shadow.surface 0 8px 24px rgba(23,59,52,.06)
shadow.overlay 0 20px 60px rgba(23,59,52,.18)

size.control-sm 36, control-md 44, control-lg 48
icon.sm 16, md 18, lg 20, xl 24
breakpoint.sm 640, md 768, lg 1024, xl 1280
z.header 40, drawer 50, dialog 60, toast 70
motion.fast 120ms, standard 180ms, slow 240ms
```

### Core primitives

| Component | Purpose and variants | States/accessibility | Responsive/composition |
| --- | --- | --- | --- |
| `Button` / `LinkButton` | `primary`, `secondary`, `quiet`, `danger`; `sm`, `md`, `lg` | Visible focus, disabled, loading with `aria-busy`, preserves label while pending | Full-width only in mobile form/action contexts; pair primary/secondary intentionally |
| `IconButton` | Small set of named icon actions | Required `aria-label`, 44px target, tooltip optional | Avoid for primary navigation on mobile |
| `Field` + `Input`/`Textarea`/`Select` | Label, hint, error, required/optional, read-only | `aria-describedby`, `aria-invalid`, error `role=alert`; visible label by default | Full width on mobile; controlled widths in editor grids |
| `Checkbox` / `Switch` | Terms, account preference, runtime toggles | Native semantics, grouped legends where needed | Checkbox rows remain touch-friendly, not tiny inline controls |
| `StatusChip` | Human-readable booking/payment/refund/class states | Text + semantic tone/icon; no raw enum display | Never truncate the status; use short label on narrow rows |
| `Banner` / `FormNotice` / `Toast` | Persistent contextual feedback, inline validation, transient save confirmation | `role=status` or `alert`; live-region priority chosen by severity | Banner spans content; toast avoids covering mobile action bar |
| `Tabs` / `SegmentedControl` | Upcoming/past, country scope, status scopes | `aria-selected`, keyboard arrow navigation if custom | Horizontal scroll on mobile; preserves URL state for server-rendered tabs |
| `Popover` / `DropdownMenu` / `CommandPalette` | Secondary filters, account actions, admin search | Escape, outside click, focus return, labelled surface | Use sheet/drawer variant under 768px |
| `Dialog` / `AlertDialog` | Review and confirmation, not long editors | Focus trap, restore focus, labelled title/description, Escape rules | Full-screen/sheet-like on mobile |
| `Drawer` / `Sheet` | Mobile filters and admin navigation | Focus trap, inert background, close button and Escape | Desktop equivalent may be inline sidebar/popover |
| `PageHeader` / `SectionHeader` | Consistent task heading, context, primary action | Semantic `h1/h2`, optional breadcrumbs/back link | Actions wrap below heading on narrow screens |
| `FilterBar` / `SearchInput` | Query, active tokens, clear-all, result count | Visible labels, submit semantics, URL state | Inline desktop; filter sheet mobile |
| `ActivityCard` / `ActivityRow` | Public catalogue object | Whole title/link target, facts aligned, status/capacity text | Card grid desktop; compact row/list on mobile or list toggle |
| `DataTable` | Admin scan/compare | `caption`/`aria-label`, row link, numeric alignment, empty/loading states | Priority-column row cards or horizontal scroll with affordance |
| `BookingSummary` | Cross-check class/date/amount before payment | Uses snapshot data, not inferred client price; clear currency/timezone | Sticky rail desktop; fixed action summary mobile |
| `Timeline` / `StatePanel` | Payment/refund/booking lifecycle | Textual state explanation, timestamps when available | Stacks vertically on mobile |
| `Skeleton` / `EmptyState` | Loading/no result/no live data | No content announced as data; `aria-busy` on region | Archetype-specific shapes; actions remain visible |

### Component composition rules

- Pages compose `PageHeader → FilterBar/Toolbar → content region → Pagination/next step`; they do not restyle raw inputs independently.
- `StatusChip` receives a domain status plus a label map; pages cannot print enum strings directly.
- `DataTable` owns empty/loading/overflow treatment; pages only define columns and row content.
- Long editors compose `EditorShell`, `EditorSection`, `SaveBar`, and `ValidationSummary`; they do not open inside `AdminModal`.
- Public detail and account detail share `DefinitionList`, `BookingSummary`, and `StatePanel`, but use different shell density.

## 8. Proposed information architecture

### Global shell

#### Public shell

- **Header:** wordmark, `Activities`, `By country`, `Guide`, `Presenters`, and a right-side `My record`/`Sign in` action. Keep contact details in footer or a slim utility bar on wide screens only.
- **Page frame:** `max-width: 1280px`, 24px mobile / 32–48px desktop gutters. Public hero can be wide; task pages use narrower reading/decision columns.
- **Persistent context:** country scope and active filters are URL-backed; no hidden state.
- **Primary CTA:** `Browse activities`/`Book this class`, never multiple equal-weight “explore” links.
- **Footer:** legal/business details and reference disclaimer; remove repeated marketing copy from task pages.

#### Customer shell

- **Desktop:** slim account header plus two-column frame with a compact account nav: `Overview`, `Bookings`, `Profile`, `Security`.
- **Mobile:** top back/brand bar and horizontally scrollable section tabs or a compact menu. The root public header is not repeated above the account content.
- **Persistent actions:** `Browse activities` in the account header; sign out in an account menu rather than a footer-like nav item.

#### Admin shell

- **Desktop:** fixed/sticky 224–240px sidebar, compact top bar with search/actor menu, content canvas with dense page frame.
- **Navigation groups:**
  - Overview: `Overview`
  - Catalogue: `Classes`, `Categories`, `Presenters`
  - Operations: `Bookings`, `Customers`
  - Money: `Payments`, `Refunds`
  - Traceability: `Source references`, `Audit log`
  - Configuration: `Settings`
- **Mobile:** top bar + drawer; active route and current entity remain visible when drawer closes.
- **Page context:** breadcrumbs/back link on detail/editor pages; no marketing hero.

### Proposed route tree

```text
/
├── /classes                         canonical activity catalogue
│   ├── /classes/[slug]              activity detail
│   └── /classes/[slug]/book         secure booking preflight
├── /courses                         compatibility redirect to /classes
├── /courses/[slug]                   compatibility redirect to /classes/[slug]
├── /australia, /new-zealand         jurisdiction entry points into /classes filters
├── /cpd-requirements                 guide, taxonomy, source-provenance explanation
├── /presenters, /presenters/[slug]  faculty discovery
├── /account                         customer record shell
│   ├── /bookings, /bookings/[id]
│   ├── /profile, /security
│   ├── /setup, /claim
├── /booking/success, /cancelled      payment state/recovery pages
├── /booking/confirmation             guest private record
└── /admin                            operations shell
    ├── /classes, /classes/new, /classes/[id]
    ├── /categories, /presenters
    ├── /bookings, /bookings/[id], /customers
    ├── /payments, /refunds
    ├── /source-references, /audit-log, /settings
```

### Page archetypes

| Archetype | Structure | Density |
| --- | --- | --- |
| Public collection | Scope tabs → page header → filter bar → result count/sort → activity grid/list → pagination → helpful empty state | Comfortable toolbar, compact result facts |
| Public detail | Breadcrumb → title/decision facts → content/provenance → sticky booking summary | Comfortable reading + compact decision rail |
| Booking preflight | Progress → booking summary → attendee/identifier → terms/security → secure payment action | Comfortable, one decision per group |
| Customer overview | Page header → next booking/attention panel → upcoming list → record summary | Comfortable |
| Customer record list | Scope tabs → compact booking rows/cards → status/action | Compact but readable |
| Admin overview | Page header → attention queue → operational metrics → recent activity/quick actions | Dense |
| Admin collection | Page header/primary action → search/filter toolbar → data table → pagination | Data-dense |
| Admin record detail | Back/breadcrumb → identity/status → definition lists → related records → explicit actions | Dense with clear action rail |
| Admin editor | Editor header/status → section nav → form sections → sticky save/publish bar → validation summary | Comfortable within a dense shell |
| Guide/reference | Editorial intro → taxonomy/source list → jurisdiction navigation → disclaimer/CTA | Comfortable reading |

## 9. Route-by-route redesign map

Change severity describes implementation scope, not page quality.

### Public routes

| Route | Current purpose/problems | Proposed hierarchy/components/responsive behavior | Severity |
| --- | --- | --- | --- |
| `/` | Brand-heavy hero, category cards, upcoming cards, CTA; giant display and repeated decorative surfaces; default seed state has no live dates | Keep as a short orientation page: promise → choose AU/NZ or browse activities → next dates → trust/source explanation. Use `Hero`, `CountryChooser`, `ActivityPreview`, and honest no-live-dates panel. Reduce hero height and decorative art | Major redesign |
| `/courses` | Full upcoming catalogue with country/category/type/search filters; overlaps `/classes` | Translate query parameters to `/classes` and redirect. Preserve inbound links and SEO metadata | Restructure |
| `/courses/[slug]` | Legacy detail alias | Redirect to `/classes/[slug]` with canonical metadata; no visible duplicate screen | Retain |
| `/classes` | Live/past class listing with a different filter vocabulary and state-lossy tabs | Canonical `ActivityCollection`: scope tabs `Upcoming/Past`, country tabs, query search, category/type/delivery filters, active tokens, result count, sort, grid/list toggle, responsive filter sheet | Major redesign |
| `/classes/[slug]` | Strong detail content and sticky booking summary, but large hero/rounded surfaces and media/provenance are secondary | `ActivityDetail`: breadcrumb, title + decision facts, real media, reading column, presenter/source trail, sticky booking summary; mobile fixed CTA | Major redesign |
| `/classes/[slug]/book` | Long single-page form with visual step cards, summary sidebar, guest checkout | Two-step preflight with URL-safe server action behavior: `Attendee details` → `Confirm & secure payment`; summary stays visible; mobile bottom action; preserve Turnstile, terms, idempotency, and guest option | Restructure |
| `/australia` | Jurisdiction marketing/education page with duplicated catalogue card section | Jurisdiction hub: requirements context, current activity count, filter link, next/past sections, relevant sources; no new content model | Polish |
| `/new-zealand` | Same as Australia with NZ-specific language | Same archetype; show hours and IAA/source caveats explicitly | Polish |
| `/cpd-requirements` | Guide shows taxonomy, activity types, source references and CTA; many cards | Keep as `Guide` archetype; add country tabs, definition of “reference ≠ approval”, source freshness and direct filtered links; reduce card count through grouped lists | Restructure |
| `/presenters` | Presenter cards with decorative header art | Faculty index with compact profile rows/cards, areas of expertise, upcoming activity count; real profile action | Polish |
| `/presenters/[slug]` | Presenter bio + current class cards | Profile header → expertise → upcoming activities → source/role context; use same ActivityCard as catalogue | Polish |
| `/privacy` | Plain prose legal page | Keep legal content, apply narrow reading layout, visible document title/updated metadata when available | Polish |
| `/terms` | Plain prose legal page | Same legal archetype; preserve reviewed copy | Polish |
| `/refund-policy` | Explains separate cancellation/refund and webhook state in a decorative card | Keep content, add “What happens after checkout / class cancellation / refund request” timeline, no promise of policy eligibility beyond reviewed copy | Polish |

### Auth, booking outcome, and private-link routes

| Route | Current purpose/problems | Proposed hierarchy/components/responsive behavior | Severity |
| --- | --- | --- | --- |
| `/sign-in` | AuthFrame + form | Keep calm split auth shell; add explicit destination context when arriving from booking/admin, password visibility control, visible status/validation summary | Polish |
| `/register` | Account creation with verification explanation | Keep; emphasize optionality during booking and what the account unlocks. Avoid treating account creation as the default purchase path | Polish |
| `/forgot-password` | Private recovery form | Keep minimal and privacy-preserving; use shared auth field/notice primitives | Retain |
| `/reset-password` | Token-based password reset | Keep; improve missing/expired token state and focus on recovery action | Polish |
| `/verify-email` | Email verification guidance | Add resend/help/contact path if supported; maintain non-disclosure language | Polish |
| `/booking/success` | Payment return page that correctly says payment is still being confirmed | Convert to a `Payment status` state page: pending timeline, `Check my record`, `Do not pay again`, and clear next states | Restructure |
| `/booking/cancelled` | Checkout closed, warns about uncertain state | Keep recovery guidance; show “check record first” as primary action and `Return to class` as secondary | Polish |
| `/booking/confirmation` | Guest private booking record with entitlement-aware attendance info | Use shared booking record layout with timestamp/status timeline, exact payment snapshot, privacy note, account setup CTA | Restructure |

### Customer account routes

| Route | Current purpose/problems | Proposed hierarchy/components/responsive behavior | Severity |
| --- | --- | --- | --- |
| `/account` | Greeting, three metric cards, upcoming cards | Overview: one next-action panel, upcoming bookings, `Needs attention`, record summary. Replace decorative metrics with useful counts/links | Restructure |
| `/account/bookings` | All bookings as large cards, no upcoming/history scopes | Tabs `Upcoming`, `Past`, `Needs attention`; compact rows with date, title, delivery, CPD, amount, status, next action; mobile cards | Major redesign |
| `/account/bookings/[id]` | Detail definition cards and unpaid cancellation | Booking record header/status timeline → class facts → payment snapshot → attendance entitlement → allowed action. Unpaid cancellation in AlertDialog; no refund implication | Restructure |
| `/account/profile` | Single profile form in one rounded surface | Keep; use sectioned account form and explicit save state; show email as verified/read-only with explanation | Polish |
| `/account/security` | Password form in one rounded surface | Keep; add password visibility and security status language without inventing session controls | Polish |
| `/account/setup` | One-time paid-booking account setup | Keep focused; show booking reference context without exposing unnecessary data; clear expired token recovery | Polish |
| `/account/claim` | Connect prior guest bookings via email link | Keep focused; show a three-step explanation (`request → verify email → connect`) and result count | Polish |

### Admin routes

| Route | Current purpose/problems | Proposed hierarchy/components/responsive behavior | Severity |
| --- | --- | --- | --- |
| `/admin` | Three metrics, attention counts, quick links; no recent/attention queue | Admin overview: attention queue first, operational metrics, recent activity, quick actions. Keep metrics grounded in existing queries; add queries only when needed | Restructure |
| `/admin/classes` | Filter form + horizontally scrolling table; edit opens full class form in modal | Catalogue collection with table/list density, status/country/search tokens, publish readiness column, direct detail link; editor becomes full page | Major redesign |
| `/admin/classes/new` | Full class form with repeated rounded sections | `EditorShell` with section nav and sticky save/publish bar; price in major units; progressive delivery/capacity fields | Major redesign |
| `/admin/classes/[id]` | Detail header/actions + affected bookings warning + source references | Class workspace: status/readiness header, preview facts, booking/capacity panel, source references, activity history, explicit action rail. Move edit to full editor route/state | Major redesign |
| `/admin/categories` | Table + two ordering forms + modal edit | Taxonomy workspace: country tabs, compact table, inline sort mode or dedicated reorder sheet, edit dialog only for short records | Restructure |
| `/admin/presenters` | Table + modal edit | People index with profile preview, assigned-class count, archive state, short edit dialog; mobile rows | Polish |
| `/admin/source-references` | Table plus every edit form stacked below | Reference collection with `New reference` drawer/dialog; edit one record at a time; filter by jurisdiction and freshness; attached-class count if queried | Restructure |
| `/admin/bookings` | Search/status form + horizontal table | Operational data table with state scopes, query tokens, attendee/class/date/amount/status, direct detail row action; mobile priority rows | Major redesign |
| `/admin/bookings/[id]` | Booking/payment cards + refund form + separate cancel button | Booking record with lifecycle timeline, commercial snapshot, payment/refund section, affected class context, staged cancel/refund actions and audit feedback | Major redesign |
| `/admin/customers` | Search email + table; no customer detail path | Keep collection but make name/email row target explicit; optionally add customer record only if product needs it. Do not invent account actions | Polish |
| `/admin/payments` | Search/status form + table | Money table with amounts aligned, status scopes, booking link, Stripe references only in detail, webhook freshness indicator if available | Restructure |
| `/admin/refunds` | Search/status form + table | Refund queue with status/age/reason/booking links; “requires action” scope and retry/inspect path only if backend supports it | Restructure |
| `/admin/audit-log` | Long stack of cards with raw JSON metadata | Dense chronological timeline/table; human action label, actor, entity link, timestamp, expandable metadata; preserve raw JSON for audit detail | Restructure |
| `/admin/settings` | Runtime readiness list | Keep as read-only configuration readiness dashboard; add grouped integration sections and remediation links/instructions without exposing secrets | Polish |

## 10. Critical flow redesigns

### Flow A: Discover and book an activity

**Current:** home or `/courses` → filters → `/classes/[slug]` → `/classes/[slug]/book` → long form → Stripe → `/booking/success` or `/booking/cancelled` → email/account.

**Proposed:**

1. **Entry:** home, country hub, presenter, guide, or shared `/classes` catalogue.
2. **Intent:** find a relevant, available CPD activity.
3. **Action:** select country scope; search/filter; compare activity rows/cards.
4. **Decision:** inspect title, country, category, date/timezone, delivery, CPD, presenter, price, seats, identifier requirement, and source references.
5. **Action:** `Book this class`.
6. **Preflight step 1:** attendee name/email and country-specific professional identifier, with signed-in prefill where valid.
7. **Preflight step 2:** optional account request, terms/refund acknowledgement, security check, exact summary and amount.
8. **System feedback:** disabled/loading action says `Preparing secure checkout…`; no client-side price authority.
9. **Payment:** Stripe Checkout; the app remains explicit that payment is not confirmed by a return redirect.
10. **Completion:** webhook-confirmed booking produces email/record. The return page shows `Payment status: processing/confirmed/failed` based on the record, with no duplicate-payment ambiguity.
11. **Recovery:** availability changed → return to current activity; Stripe pending → check record/wait; failed → retry only after state is known; abandoned → check account/guest link before restarting.

### Flow B: Guest becomes a customer

**Current:** guest booking → optional `createAccountRequested` → post-payment email setup link; separate `/account/claim` for older records.

**Proposed:** keep the behavior and make the mental model visible:

1. The booking form says `Continue as guest` by default and offers `Keep a record with an account` as an optional preference.
2. After webhook-confirmed payment, the email explains either `Set up your account` or `View your private booking record`.
3. `/account/setup` shows a short progress explanation and preserves a clear expired-link path.
4. `/account/claim` explains why email matching is required, then confirms exactly how many records were connected.

### Flow C: Customer checks an upcoming booking

1. **Entry:** `My record` header, payment status page, confirmation email, or sign-in redirect.
2. **Intent:** know when/where the activity is and whether attendance details are available.
3. **Action:** open `Upcoming` record.
4. **Feedback:** status, local timezone, CPD snapshot, delivery details, payment snapshot, and entitlement are shown in one record view.
5. **Action:** view class details, cancel an unpaid booking, or return to catalogue.
6. **Recovery:** online attendance is withheld until entitlement; pending payment shows wait/check guidance; cancelled/refunded states remain readable history.

### Flow D: Admin creates and publishes a class

**Current:** new page has a long multi-section form; edit uses a modal; publish action is on detail page; source references are a separate block.

**Proposed:**

1. **Entry:** Admin → Catalogue → New class.
2. **Basics:** title, slug, country, category, presenter, short/full description.
3. **Schedule & delivery:** timezone, start/end, format; reveal venue or online fields based on format.
4. **Capacity & CPD:** controlled/unlimited capacity, seat count, CPD unit/amount, activity category, identifier requirement.
5. **Commercial window:** display price/currency, open/close.
6. **Media & provenance:** alt text/media and country-scoped source references.
7. **Validation:** section checklist identifies missing fields; save draft remains available.
8. **Preview/readiness:** detail page shows what will be public and any missing publish requirements.
9. **Publish:** one explicit action with impact statement; status changes remain server-authorized.
10. **Feedback:** visible saved/published banner plus audit record link; no silent navigation away from unsaved work.

### Flow E: Admin resolves a booking/refund exception

1. **Entry:** Overview attention queue, booking table, refund table, or class affected-bookings link.
2. **Intent:** understand current booking/payment/refund state.
3. **Decision:** read lifecycle timeline and captured/refunded amounts; see class status and customer details.
4. **Action:** choose `Cancel booking` or `Issue refund` separately.
5. **Review:** show impact, amount, currency, reason, and that Stripe/webhooks determine final status.
6. **Confirm:** AlertDialog with explicit verb; idempotency key remains backend-controlled.
7. **Feedback:** visible `Request submitted — pending Stripe confirmation` state; record remains actionable only when allowed.
8. **Recovery:** failure/requires action shows reason and next supported action; never make an operator guess whether to retry.

## 11. Component migration map

| Existing | Decision | Migration |
| --- | --- | --- |
| `Container`, `Section` | Keep/refine | Replace hardcoded max/gutters with layout tokens and archetype variants |
| `PageIntro` | Refactor | Fold into `PageHeader` with public/editorial/task density variants |
| `AuthFrame` | Keep/refactor | Keep split auth pattern, remove repeated marketing copy, add error/help slots |
| `Button`, `LinkButton` | Refactor | Tokenized radius/sizes/loading/disabled states; preserve API compatibility during migration |
| `Badge`, `CountryBadge` | Refactor | Split `Tag`/`StatusChip`; status label map and accessible semantics |
| `StatusBadge` | Replace | Human label map for all domain statuses, semantic tone, optional icon, no raw enum output |
| `MetricCard` | Refactor | `Stat` for useful linked metrics; no default shadow/card wrapper on every metric |
| `Field`, `TextInput`, `TextArea`, `Select` | Keep/refactor | Keep good a11y wiring; add visible compact labels, sizes, invalid styling, combobox/checkbox primitives |
| `FormNotice` | Keep/refactor | Generalize to `Banner` + inline error and visible live-region feedback |
| `Price` | Keep | Add tabular numerics and a snapshot/major-unit distinction for admin forms |
| `ClassCard` | Refactor/rename alias | Build `ActivityCard` with decision facts, real media, compact/list variants; keep `ClassCard` export temporarily |
| `EmptyState` | Refactor | Archetype-specific no-results/no-live-dates/no-permission/error variants |
| `Pagination` | Refactor | Preserve query state, disabled states, result range where available |
| `SiteHeader`/`SiteFooter` | Replace | `PublicHeader`, `PublicFooter`, responsive mobile nav with focus/scroll management |
| account sidebar in `app/account/layout.tsx` | Replace | `AccountShell` with active state and mobile section switcher |
| admin sidebar in `app/admin/layout.tsx` | Replace | `AdminShell`, grouped nav, top bar, drawer, active entity context |
| `AdminModal` | Replace for long editors | Accessible `Dialog` only for short records; `EditorShell` for class editing |
| `AdminClassForm` | Refactor | Sectioned `ClassEditor` with validation summary, major-unit price, progressive disclosure, sticky save bar |
| inline page tables | Replace gradually | `DataTable`/`ResponsiveTable` with shared toolbar, status cells, row links, mobile priority layout |
| `HeroMotion`/`Reveal` | Refine | Keep restrained public entry motion; remove from dense lists and respect reduced motion by default |

## 12. Implementation roadmap

Each phase should leave the app usable and deployable.

### Phase 0 — Contract and visual baseline

- Freeze domain labels and status copy from schema/service behavior.
- Add a route-level screenshot checklist for public catalogue, detail, booking, account list, admin table, editor, and mobile widths.
- Keep `pnpm lint`, `pnpm typecheck`, and `pnpm test` green before every phase.

### Phase 1 — Tokens and foundations

- Replace scattered CSS variable names with semantic aliases while retaining backwards-compatible aliases.
- Add type/spacing/radius/control/motion tokens and tabular numeric rules.
- Refactor `Button`, `LinkButton`, `Field`, inputs, `StatusChip`, `FormNotice`, `EmptyState`, and `Pagination`.
- Add accessible `IconButton`, `Tabs`, `FilterBar`, `Dialog`, `Drawer`, `Toast` primitives only where used by the first slice.

**Dependency:** none.  
**Exit criterion:** no new raw button/input/status styling in the first-slice routes; keyboard/focus tests cover primitives.

### Phase 2 — Shells and navigation

- Split root public shell from account/admin shell behavior.
- Add active navigation, focus management, mobile drawer/sheet, scroll locking, and responsive page frame.
- Keep all existing links and auth guards.

**Dependency:** Phase 1.  
**Exit criterion:** public, account, and admin routes can be navigated without carrying the wrong shell semantics.

### Phase 3 — Canonical catalogue and detail

- Merge `/courses` and `/classes` query semantics into canonical `/classes`.
- Add URL-backed `FilterBar`, active tokens, result state, list/grid presentation, real media, and compact activity cards.
- Update home, country, presenter, guide, and footer links to canonical catalogue URLs.
- Refactor `/classes/[slug]` into `ActivityDetail` with booking summary and mobile CTA.

**Dependency:** Phases 1–2.  
**Exit criterion:** every public entry point reaches one catalogue with preserved filter meaning; empty/live/past/no-result states are distinguishable.

### Phase 4 — Booking and payment clarity

- Recompose booking form into real steps without changing server action, Turnstile, idempotency, validation, or Stripe behavior.
- Add shared `BookingSummary`, payment-state page, guest record timeline, and visible pending/success/error feedback.
- Test confirmed, pending, failed, expired, cancelled, and sold-out paths against existing webhook tests.

**Dependency:** Phases 1–3.  
**Exit criterion:** no UI copy implies browser redirect equals payment confirmation; duplicate-payment recovery is visible.

### Phase 5 — Customer record

- Replace account sidebar with customer shell and mobile section switcher.
- Add upcoming/past/needs-attention scopes and compact booking rows.
- Improve record detail, account setup/claim, profile/security feedback.

**Dependency:** Phases 1–2, booking-state copy from Phase 4.  
**Exit criterion:** a customer can find the next class, understand entitlement, and recover a guest record without support.

### Phase 6 — Admin operations

- Introduce grouped admin shell and data-table toolbar.
- Convert bookings, payments, refunds, customers, classes, source references, and audit log to shared table/list primitives.
- Add overview attention queue from real data; do not invent analytics.

**Dependency:** Phases 1–2; status component from Phase 1.  
**Exit criterion:** common filters, status labels, row links, pagination, loading/empty/error states, and mobile priority rows are consistent.

### Phase 7 — Editor and high-risk actions

- Move class edit from long modal to full editor shell; keep short category/presenter/reference dialogs.
- Add publish readiness/checklist and visible save/publish feedback.
- Add AlertDialog review for cancel/refund while preserving separate backend actions and audit logging.

**Dependency:** Phase 6 tables/shell; existing server action contracts.  
**Exit criterion:** no long form in a modal; no financial action relies on browser `confirm()`.

### Phase 8 — Accessibility, responsive, and consistency pass

- Keyboard/focus review at desktop/mobile, 200% zoom, reduced motion, screen-reader announcements, and contrast.
- Verify mobile drawers, filter sheets, sticky actions, table row ordering, and touch targets.
- Remove old arbitrary classes and legacy duplicate patterns.

**Dependency:** all UI migrations.  
**Exit criterion:** route-by-route checklist complete; no known focus trap, status-only color, or mobile overflow issue remains without an explicit exception.

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `/courses`/`/classes` merge breaks inbound links or filter URLs | SEO and user confusion | Preserve redirects, translate query keys, set canonical metadata, add route tests |
| Visual migration touches shared primitives used by every route | Broad regression surface | Backwards-compatible variants, screenshot each archetype, migrate in phases |
| UI implies payment success before webhook | Financial/support risk | Reuse existing server authority; make pending state the default return state |
| Refactoring admin editor changes validation/save behavior | Editorial data loss | Keep `AdminClassForm` action contracts initially; add validation summary without rewriting server actions |
| Mobile data tables become too sparse or too dense | Operations friction | Define priority columns per table and retain tablet horizontal-scroll fallback |
| Country language becomes over-generalized | Regulatory/product trust risk | Keep AU/NZ labels, MARN/IAA-specific helper text, CPD points/hours semantics from `COUNTRY_CONFIG` |
| Source references are mistaken for approval | Compliance risk | Repeat “traceability, not accreditation” at class and guide surfaces |
| More animation creates performance/accessibility regressions | Reduced trust and slower task completion | Limit motion to entry/state changes and retain reduced-motion behavior |
| Admin attention queue lacks data support | False operational confidence | Start with existing stats and query only concrete states; no synthetic charts |
| No upcoming seed classes make the new catalogue look empty | Misread as broken product | Design explicit no-live-dates and past/history paths; keep seed data deliberately unpublished as documented |

## 14. First implementation slice

### Slice goal

Prove the new design system on the public activity catalogue and its shared shell without changing booking/payment behavior.

### Included

1. **Foundations:** semantic color aliases, typography rules, spacing/radius/control tokens, tabular numerics, surface/elevation rules, reduced motion.
2. **Shared primitives:** refactored `Button`, `LinkButton`, `Field`, inputs/selects, `StatusChip`, `PageHeader`, `FilterBar` support, `ActivityCard`, `EmptyState`, and `Pagination`.
3. **Public shell:** improved header active state and mobile menu behavior; keep existing public links but make `Catalogue` resolve to the chosen canonical collection as the migration progresses.
4. **Catalogue surface:** restructure `/courses` as the first visible collection slice while preserving its current server queries and URL filters; later promote the same implementation to canonical `/classes` and add query translation.
5. **Responsive behavior:** desktop filter toolbar, mobile stacked/filter-sheet-ready controls, compact activity card facts, and an honest no-live-dates/no-results state.
6. **States:** loading skeleton aligned with collection layout; no-results copy with clear filters; status/capacity label semantics.

### Deliberately excluded from this slice

- Stripe/payment service changes.
- Booking form submission/validation changes.
- Admin shell/editor changes.
- New dependencies.
- New domain fields, fake ratings, fake dates, fake attendee counts, or unverified regulatory claims.

### Success criteria

- The catalogue reads as a task surface within one viewport: title/context, scope, filters, result state, and next action.
- Activity cards present date/timezone, country, delivery, CPD, price, presenter/category, and capacity in a consistent scan order.
- Empty and loading states make the next safe action obvious.
- Keyboard focus is visible; mobile menu and controls have accessible names and touch targets.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` remain green.
- A desktop and 390px screenshot show the same product character without the mobile version being a collapsed desktop wall.

### Acceptance notes for implementation

- Use existing `getPublishedClasses`, `getCategories`, `getCountries`, and `getPublishedActivityTypes`; do not invent content.
- Keep `/courses/[slug]` redirect behavior until the canonical route merge phase.
- Keep all server action contracts and booking/payment invariants unchanged.
- Add comments only where a compatibility alias or route migration would otherwise look surprising.

### Implementation checkpoint — 21 September 2026

The first slice is implemented in the working tree: semantic foundation tokens and backwards-compatible aliases in `app/globals.css`; refactored shared controls/status labels/activity cards/empty states in `components/ui.tsx`; active, keyboard-aware public navigation in `components/site-header.tsx`; and the redesigned, query-compatible catalogue surface in `app/courses/page.tsx`. No booking, authentication, database, Stripe, or admin server behavior was changed. The seeded database currently has no published upcoming activity, so visual verification covers the honest no-live-dates state while the activity card remains driven by the existing catalogue query shape.

Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test` (12 passed, 2 skipped), `pnpm build`, and the public Playwright smoke test pass. The three database-backed browser journeys remain intentionally skipped unless `E2E_DATABASE_READY=1` is configured.
