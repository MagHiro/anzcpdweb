# Academy design system

The supplied `design.md.md` is the visual reference. The academy retains its forest-green brand (`#244c3b`) rather than adopting Cohere's black primary action color.

## Shared decisions

- White canvas, warm stone (`#eeece7`) supporting surfaces, pale green secondary sections, forest-green feature bands and footer.
- Space Grotesk for display headings and Inter for body and controls, self-hosted through Next.js. These are open-source fallbacks for the proprietary reference fonts.
- Regular-weight display type, tight tracking, generous section spacing and rule-separated lists.
- Flat cards with thin borders, 8px utility cards, 22px major panels, pill actions, 4px form controls. No decorative shadows, gradient UI fills, floating cards or route-entry animations.
- Preserve labels, focus rings, keyboard navigation, validation, booking/payment disclosures, authorization and live catalogue data.
- Use real country pathways in the home composition rather than fabricated product dashboards, testimonials or trust marks.

Global tokens and shared shell styles live in `app/globals.css`. Reusable controls and content components live in `components/ui.tsx`. Public navigation and footer live in `components/site-header.tsx`; the account and administration shells share `components/workspace.tsx`.

Responsive checks cover stacked home panels, mobile navigation, forms, catalogue filtering and workspace tables. Primary controls remain at least 44px tall (compact controls 40px), and focus feedback is independent of hover.
