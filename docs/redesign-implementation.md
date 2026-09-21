# ANZ CPD redesign — implementation handoff

## Direction and applicability

The application is a professional-development catalogue and booking service for migration professionals, not a visa application portal. The implementation translates the research into a restrained academy identity: eucalyptus green, warm white, pale sage, editorial serif headings on public pages, and compact sans-serif workspaces. Real activity metadata takes priority over decorative imagery. No accreditation, government endorsement, reviews, testimonials, or learning-management features were invented.

Patterns adapted from the supplied Mobbin research:

| Reference | Application here | Deliberate boundary |
| --- | --- | --- |
| [Unity catalogue](https://mobbin.com/screens/33327be3-56c6-4e70-9d0d-bd6c0f3f0592), [SuperHi](https://mobbin.com/screens/9c320c2d-abb2-4b49-b80f-9a548a53d4a4) | Topic-led catalogue, persistent filters, readable activity cards | No subscriptions or invented courses |
| [Sweatpals detail](https://mobbin.com/screens/e80f318e-0985-4c2b-acd5-0c76ab5d4bef), [Luma](https://mobbin.com/screens/fb172cac-fa93-407d-bb68-1dc4a27db64d) | Decision facts before narrative, clear price and booking action | No invented popularity or urgency |
| [Cloudflare authentication](https://mobbin.com/screens/b9278f30-6fbc-443f-8379-6bfd0012dc9a) | Focused account forms and clear recovery routes | Existing email verification and Turnstile retained |
| [Cal bookings](https://mobbin.com/screens/463e79bf-4ff0-46c7-b66a-610e39cbbbf8), [Expedia](https://mobbin.com/screens/8a727458-68d4-4e8b-8e4c-de89565ffc36) | Booking scopes and clear next actions | Booking confirmation remains provider-verified |
| [Stripe finance](https://mobbin.com/screens/464dcf70-a0d4-4ba9-b23d-ca6ba18e60f5), [Deel](https://mobbin.com/screens/eb392439-083f-4863-b60b-baa13493780b) | Compact financial records, readable statuses and normal currency input | No new financial operations or accounting claims |
| [Whop admin](https://mobbin.com/screens/6472b575-afa7-4fb6-9a91-dbfaa034e121), [Eventbrite](https://mobbin.com/screens/4850f8a6-adad-4b0d-bc41-57200c396a2c) | Grouped operational navigation and full-page class editing | Existing role checks and publishing rules retained |

These are pattern adaptations, not copied screenshots or third-party assets. Reference research is the basis supplied with the request; this file records the implementation, not a new Mobbin audit.

## Route coverage

Every UI route receives the new foundation and its appropriate shell. Some routes are composed entirely from shared components rather than requiring independent markup changes.

| Route(s) | Implemented treatment |
| --- | --- |
| `/` | New editorial homepage, jurisdiction pathways, live activities, topic index and booking explanation |
| `/classes` | Canonical catalogue; search, country, category, type and delivery filters; removable chips; filter-preserving date tabs and pagination; separate service-error state |
| `/classes/[slug]` | Decision-first header; date, timezone, format and CPD; description, presenter, references; sticky booking summary; removed decorative missing-image panel |
| `/classes/[slug]/book` | Shared activity summary, labelled attendee fields, matching-email validation and review before hosted checkout |
| `/courses` | Compatibility redirect to `/classes`, preserving query parameters and mapping country names |
| `/courses/[slug]` | Existing detail compatibility redirect retained |
| `/australia`, `/new-zealand` | Shared editorial country layout, jurisdiction context and redesigned activity cards; load failures distinguished from empty lists |
| `/cpd-requirements` | Updated guide surfaces and language; complete source-reference list with authority and checked dates |
| `/presenters`, `/presenters/[slug]` | Restyled faculty directory/profile surfaces, expertise, biographies and shared activity cards |
| `/privacy`, `/terms`, `/refund-policy` | Shared readable policy document with section navigation, related policies and explicit draft/legal-review disclosure |
| `/sign-in`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | New shared authentication layout; password visibility, native validation, recovery action, pending/error/success treatment |
| `/booking/success` | Neutral payment-checking state; no success checkmark or claim of confirmation; avoid-double-payment guidance |
| `/booking/cancelled` | Restyled recovery state and existing return actions |
| `/booking/confirmation` | Private guest record, status explanation, immutable title/price/CPD/timezone and entitlement-gated attendance information |
| `/account` | Dedicated customer shell, active navigation, compact metrics and upcoming bookings |
| `/account/bookings` | All/upcoming/past/needs-attention scopes, status cards and actionable empty states |
| `/account/bookings/[id]` | Status explanation, snapshot-based booking record, payment and attendance details, existing cancellation rules |
| `/account/profile`, `/account/security` | Consistent settings surfaces; pending, success and network-error states; password visibility |
| `/account/setup` | Public token-based onboarding layout, missing-token explanation, disabled invalid submission; URL unchanged |
| `/account/claim` | Protected record-linking surface with loading, success and network-error feedback |
| `/admin` | Dedicated operations shell, grouped navigation, compact metrics and linked follow-up actions |
| `/admin/classes` | Restyled table/mobile record rows; Edit opens the full class workspace |
| `/admin/classes/new`, `/admin/classes/[id]` | Full-page editor, section navigation, sticky save controls, major-unit currency input, separate publication/actions/source context |
| `/admin/categories` | Compact records, focused native editor dialog, existing ordering controls |
| `/admin/presenters` | Compact records, focused native editor dialog and profile controls |
| `/admin/source-references` | Source record list with one focused editor at a time, replacing the stacked collection of edit forms |
| `/admin/bookings`, `/admin/bookings/[id]` | Consistent operational surfaces, mobile records and explicit cancel/refund review dialogs |
| `/admin/customers` | Search label, responsive records and a real empty-result explanation |
| `/admin/payments` | Human status filters, currency records, responsive rows and links to the associated booking |
| `/admin/refunds` | Human status filters, responsive records and booking links |
| `/admin/audit-log` | Compact event records, expandable metadata and empty state |
| `/admin/settings` | Configuration status list; explicitly distinguishes configured values from live connection health |
| Loading, error and not-found boundaries | Shared visual system, labelled loading states, workspace-specific skeletons, safer payment-error wording |

## Shared component coverage

- `ui`: containers, sections, headings, authentication frame, buttons, badges, status labels, metrics, form fields, inputs, notices, currency, activity cards, empty states and pagination.
- `site-header` / `app-chrome`: canonical navigation, active state, skip link, keyboard menu handling and shell selection. Public business information remains intact.
- `workspace`: grouped admin/customer navigation, identity, sign-out, mobile navigation, top bar and support footer.
- `admin-modal`: native modal focus containment, unique labels, Escape dismissal and focus restoration.
- `confirm-form`: explicit financial/destructive action review while preserving the original form submitter and server action.
- `money-input`: visible decimal amounts with integer minor-unit submission; server validation is unchanged.
- `password-input`: labelled show/hide control with autocomplete retained.
- Booking, authentication, account, profile, refund, admin forms and record managers all use the new shared surfaces.
- `booking-status`, `legal-document`, `source-manager`, and `workspace-loading` consolidate previously inconsistent patterns.
- Existing code-native icons, Turnstile integration and reduced-motion-aware animation helpers are retained; global decorative grid/grain effects are removed. No raster assets or new dependencies are required.

## Preserved boundaries

No database schema, payment API, webhook, booking transition, capacity reservation, price snapshot creation, role authorization, guest token, or refund-processing service was changed. Checkout remains hosted by Stripe. The UI does not treat a redirect as proof of payment. Public class pages do not expose protected online-attendance information. Account setup was moved outside the protected account layout, but still uses the existing token-validation API; every protected account route remains under the authenticated layout.

Displayed customer booking titles and timezones now use the stored snapshots. Class schedules and attendance information remain the current class information. Class cancellation and refunding remain separate actions. Existing category/presenter archive confirmations are retained.

## Verification

- TypeScript and ESLint checks passed during implementation.
- Production build passed with all routes generated successfully.
- Unit tests: 16 passed, 2 environment-gated tests skipped.
- Browser tests: 13 passed, 3 existing database-fixture journeys skipped. Coverage includes catalogue compatibility/filter preservation, password visibility, account setup, payment-return messaging, mobile menu behavior, policy navigation and protected-route redirects.
- Mobile read-only sweep: 16 public/onboarding/booking-state pages returned HTTP 200, had one main heading and no horizontal overflow at 390px; one seeded presenter detail also had no horizontal overflow.
- Desktop/mobile homepage and desktop sign-in screenshots were inspected. The ready-state mobile catalogue was also inspected at 390px.

### Verification limits and launch checks

Authenticated admin/customer records and a real Stripe payment/refund were not exercised end to end. The seed catalogue has no upcoming published activities, so the public empty state was checked rather than publishing data for a screenshot. No business records were created or changed for verification. Use dedicated test accounts and a published test activity to check booking review, cancellation/refund confirmation, editor saves, private attendance entitlement and mobile populated tables before deployment. The legal documents remain operational drafts requiring the owner’s legal review. This is not a claim of a formal accessibility audit or verified integration health.
