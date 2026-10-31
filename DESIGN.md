---
name: Quiet Editorial Prestige
colors:
  surface: '#e7fff3'
  surface-dim: '#c7e0d4'
  surface-bright: '#e7fff3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e1f9ee'
  surface-container: '#dbf3e8'
  surface-container-high: '#d5eee2'
  surface-container-highest: '#d0e8dd'
  on-surface: '#0a1f18'
  on-surface-variant: '#414845'
  inverse-surface: '#20342d'
  inverse-on-surface: '#def6eb'
  outline: '#717974'
  outline-variant: '#c1c8c3'
  surface-tint: '#426558'
  primary: '#002218'
  on-primary: '#ffffff'
  primary-container: '#14382c'
  on-primary-container: '#7da292'
  inverse-primary: '#a8cfbe'
  secondary: '#2c694e'
  on-secondary: '#ffffff'
  secondary-container: '#aeeecb'
  on-secondary-container: '#316e52'
  tertiary: '#002214'
  on-tertiary: '#ffffff'
  tertiary-container: '#003a25'
  on-tertiary-container: '#59a982'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ebd9'
  primary-fixed-dim: '#a8cfbe'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#2a4d40'
  secondary-fixed: '#b1f0ce'
  secondary-fixed-dim: '#95d4b3'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#0e5138'
  tertiary-fixed: '#a1f4c8'
  tertiary-fixed-dim: '#86d7ad'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#e7fff3'
  on-background: '#0a1f18'
  surface-variant: '#d0e8dd'
typography:
  headline-2xl:
    fontFamily: Google Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-2xl-mobile:
    fontFamily: Google Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-xl:
    fontFamily: Google Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Google Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Google Sans
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Google Sans
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Google Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Google Sans Flex
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Google Sans Flex
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Google Sans Flex
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Google Sans Flex
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Google Sans Flex
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Google Sans Flex
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system embodies quiet authority, institutional trust, and editorial poise tailored for legal, migration, and professional CPD (Continuing Professional Development) education in the Australia–New Zealand jurisdiction.

### Design Movement & Core Philosophy
The aesthetic unifies **Swiss International Typographic Style** with **Quiet Luxury**:
- **Generous Spatial Rhythm:** Content breathes within expansive, deliberate negative space. Density is never forced; clarity governs layout.
- **Editorial Distinction:** Hierarchy is established through disciplined typographic scale, variable weight shifts, and tracking adjustments rather than heavy fills, dropshadows, or decorative ornaments.
- **Hairline Precision:** Thin, surgical borders (1px) establish structural containment without introducing visual heaviness.
- **Restrained Interaction:** Micro-interactions are subtle and immediate—opacity adjustments, slight tint shifts, and precise hairline state borders replace theatrical motion.

### Target Persona & Emotional Response
Engineered for migration agents, immigration lawyers, corporate mobility consultants, and regulatory practitioners. The interface evokes rigorous competence, institutional prestige, calm focus, and total absence of cognitive noise.

## Colors

The palette draws from native antipodean botanical tones—deep coastal eucalyptus, inland sage, and sub-alpine forest greens—grounded by mineral neutrals.

### Surface System
- **Canvas Base (`#FAFCFB`):** The foundational neutral surface across full-viewport layouts; reduces eye strain while maintaining a crisp, paper-like freshness.
- **Surface Pure (`#FFFFFF`):** High-priority card backgrounds, form fields, and reading panes.
- **Surface Muted (`#F2F7F4`):** Soft laurel tint for secondary module backdrops, interactive resting states, and highlighted callouts.
- **Surface Subtle (`#EAF1ED`):** Active selections, row hovers, and table header accents.

### Text & Core Roles
- **Primary Ink (`#14382C`):** Deep botanical forest green used for primary headlines, high-contrast labels, and dominant brand anchors. Never pure black.
- **Secondary Ink (`#556B62`):** Muted slate-eucalyptus for body text, meta annotations, timestamps, and secondary captions.
- **Tertiary Ink (`#7B9087`):** Placeholder labels, inactive icons, and quiet helper text.

### Border & Rule System
- **Hairline Border (`#E2ECE6`):** The primary boundary token. Renders crisp 1px structural dividers and unselected component perimeters.
- **Active Border (`#2D6A4F`):** Focused inputs, selected filter states, and accent dividers.

## Typography

The typography uses Google Sans for headlines and Google Sans Flex for body and labels to deliver crisp geometric clarity, generous open counters, and institutional legibility.

### Typographic Rules
- **Headline Architecture:** Always rendered in `#14382C`. Tight negative letter-spacing (`-0.01em` to `-0.02em`) is applied to headline roles above 22px to retain editorial cohesion.
- **Editorial Sub-caps:** The `label-caps` role must be transformed to uppercase (`text-transform: uppercase`) with a deliberate `+0.08em` tracking. Used for CPD accreditation badges, category identifiers, statute module tags, and metadata headers.
- **Body Text:** Maintained strictly at `line-height: 1.6` (`24px` on `15px` body) in `#556B62` to deliver fatigue-free reading across dense regulatory texts, case analysis, and curriculum agendas.

## Layout & Spacing

Layouts follow a structured, rhythm-driven grid balanced by deliberate spatial intervals.

### Grid Framework
- **Desktop (1200px+):** 12-column fluid grid, max-width `1280px` centered, with `3rem` (`margin`) page margins and `1.5rem` (`gutter`) column gutters.
- **Tablet (768px - 1199px):** 8-column layout, `2rem` page margins, `1.25rem` gutters.
- **Mobile (< 768px):** 4-column layout, `1.25rem` (`margin-mobile`) margins, `1rem` (`gutter-mobile`) gutters. Reflows multi-column modules into continuous single-column cards.

### Spacing Rules
- Dense UI components (tags, meta rows, pills) use `space-xs` (4px) and `space-sm` (8px).
- Module padding within cards adheres strictly to `space-md` (16px) or `space-lg` (24px).
- Structural section gaps between major curriculum modules, legal briefs, and accreditation sections demand `space-xl` (40px) or `space-2xl` (64px) to preserve quiet editorial hierarchy.

## Elevation & Depth

This design system avoids theatrical drop shadows and skeuomorphic gradients in favor of **low-contrast outlines, tonal surface stepping, and whisper-quiet depth**.

### Depth Tiers
- **Flat Ground (Level 0):** Canvas base `#FAFCFB`. Structural dividers use `1px solid #E2ECE6`.
- **Resting Container (Level 1):** Background `#FFFFFF`, bordered with `1px solid #E2ECE6`. No box-shadow applied.
- **Interactive Hover / Elevate (Level 2):** Subtle elevation applied exclusively on interactive cards (e.g., CPD Course Card, Webinar Module):
  - Border transitions to `1px solid #C9DBD1`.
  - Box Shadow: `0 4px 20px -2px rgba(20, 56, 44, 0.04)`.
- **Float / Overlay (Level 3):** Dropdown menus, tooltips, popovers, and sticky sub-navigation:
  - Background `#FFFFFF`.
  - Border: `1px solid #E2ECE6`.
  - Box Shadow: `0 8px 30px rgba(20, 56, 44, 0.07)`.
- **Modal Backdrop:** `rgba(20, 56, 44, 0.28)` overlaid with a pure white container and subtle hairline border.

## Shapes

The system implements pill-shaped and highly rounded geometry (`roundedness: 3`), conveying modern approachability and soft visual boundaries.

### Corner Radius System
- **Base (1rem / 16px):** Form input fields, standard actionable buttons, small inline code blocks, and table containers.
- **Large (2rem / 32px):** Primary content cards, curriculum modules, modal sheets, and structured panels.
- **Extra Large (3rem / 48px):** Hero feature banners and promotional accreditation showcases.
- **Pill (Fully Rounded / 9999px):** Status badges, CPD category tags, accreditation indicators, and standalone chip filters.

## Components

### Buttons
- **Primary:** Background `#14382C`, text `#FFFFFF`, border `none`, border-radius `1rem`, padding `12px 24px`. Hover: `#2D6A4F`. Active: `#0D251D`.
- **Secondary / Outline:** Background `#FFFFFF`, text `#14382C`, border `1px solid #E2ECE6`, border-radius `1rem`, padding `12px 24px`. Hover: Background `#F2F7F4`, border `#C9DBD1`.
- **Ghost:** Background transparent, text `#2D6A4F`, padding `12px 16px`. Hover: Background `#F2F7F4`, text `#14382C`.
- **Typography:** `label-lg`, center-aligned.

### Chips & Badges
- **CPD Category Pill:** Background `#F2F7F4`, text `#2D6A4F`, border `1px solid #E2ECE6`, border-radius `9999px`, padding `6px 14px`, typography `label-caps`.
- **Accreditation / Status Badge (Active):** Background `#FFFFFF`, text `#14382C`, border `1px solid #2D6A4F`, border-radius `9999px`, padding `4px 12px`, typography `label-caps`. Incorporates a `6px` circular dot in `#40916C`.
- **Interactive Filter Chip:** Resting has background `#FFFFFF`, text `#556B62`, border `1px solid #E2ECE6`. Selected has background `#14382C`, text `#FFFFFF`, border `1px solid #14382C`.

### Cards
- **Course & Article Cards:** Flat white background (`#FFFFFF`), `1px solid #E2ECE6` hairline perimeter, border-radius `2rem`, inner padding `24px`.
- **Header Area:** Flex row housing CPD point counter (`label-caps` in `#2D6A4F`) and jurisdictional indicator (e.g., "OMARA / CPD" or "NZ IAA").
- **Divider:** Subtle `1px solid #F2F7F4` rule between card body and meta footer.
- **Hover State:** Micro-shift border color to `#C9DBD1` with whisper shadow `0 4px 20px -2px rgba(20, 56, 44, 0.04)`.

### Form Fields & Inputs
- **Base Input:** Background `#FFFFFF`, text `#14382C`, placeholder `#7B9087`, border `1px solid #E2ECE6`, border-radius `1rem`, height `48px`, padding `0 16px`, typography `body-md`.
- **Focus State:** Border `1px solid #2D6A4F`, outline `2px solid rgba(45, 106, 79, 0.12)`.
- **Labels:** `label-md` in `#14382C` placed above the input with `6px` bottom spacing.
- **Error State:** Border `1px solid #9E2A2B`, subtle tint background `#FCF4F4`.

### Checkboxes & Radios
- **Checkbox:** Size `18px x 18px`, border `1px solid #CAD8D0`, border-radius `4px`, background `#FFFFFF`. Selected: Background `#14382C`, border `#14382C`, crisp white hairline checkmark icon.
- **Radio:** Size `18px x 18px`, border `1px solid #CAD8D0`, border-radius `50%`. Selected: Border `#14382C`, inner dot `#14382C` (size `8px`).

### Lists & Curriculum Tables
- **Table Structure:** Borderless row edges; separated by `1px solid #E2ECE6` horizontal rules.
- **Row Padding:** `16px 20px`.
- **Hover:** Gentle tint fill `#F2F7F4` across the row.
- **Headers:** `label-caps` in `#556B62`, background `#FAFCFB`, bottom border `1px solid #D5E2DB`.

### Regulatory Compliance Callout (Domain-Specific)
- **Container:** Background `#F2F7F4`, border-left `3px solid #14382C`, hairline borders top/right/bottom `1px solid #E2ECE6`, border-radius `0 1rem 1rem 0`, padding `16px 20px`.
- **Content:** Title in `label-lg` (`#14382C`), advisory text in `body-sm` (`#556B62`).
