# Design

<!-- impeccable:design-schema 1 -->

**Scope note:** This records the visual system established for the Hero section (`app/page.tsx` Hero block + `components/HeroCardAnimation.tsx`, styled via `app/page.module.css`) on 2026-08-08. The rest of the public site (AdShowcase, PortfolioCarousel, RealCardsSection, WhyUs, "Jak to działa", order form, FAQ, nav/footer) predates this decision and has not been brought into this system yet — do not assume it matches until it's deliberately extended here.

## Direction

Brief-pinned redesign: Michał found https://www.skynexalabs.xyz/ (a paid "premium digital agency" template on 21st.dev) and asked for its visual language — bold rounded display type, pill CTA paired with a circular arrow-icon button, and a radiating decorative motif — adapted into RaveAdventure's own protected palette. Confirmed via structured question: full style/vibe (not just one component), palette stays purple/cyan (not SkyNexa's lime-green). No source code, assets, or copy were copied from the reference — only the structural/visual pattern language, reimplemented from scratch and fused with RaveAdventure's own pre-existing equalizer/wave brand motif (see `components/LogoEqualizer.tsx`) so the signature decoration reads as "this brand's sound," not a borrowed sunburst.

## Color Strategy

Committed — the palette is fixed brand identity (protected, see PRODUCT.md), not derived per-surface. Near-black ground (`#07070f` / `#0a0014`), neon purple `#b44dff` as primary interactive/accent color, cyan `#00f0ff` as a secondary accent used sparingly (roughly 1 ray in 7, the equalizer scan-line). Dark ground is a scene decision, not a default: the product is photographed/consumed at night, in club/festival contexts, and the existing brand has used near-black since before this redesign.

## Typography

- Display/headings: Audiowide (`--font-hero`), single weight (400) — already geometric and heavy by construction, so no weight escalation was needed or attempted.
- Body/labels/mono accents: JetBrains Mono (`--font-body`) — used for eyebrow-style labels, badges, and UI chrome throughout the existing site; unchanged by this work.

## Component Language — Hero

- **CTA pair**: primary action is a full pill (`border-radius: 999px`) with a small circular icon-badge inset on its trailing edge (arrow, rotates 45° on hover); secondary action is plain label + a standalone circular icon button (40px, bordered, glows on hover). This pairing replaces the prior single rounded-rect button + plain underlined text link. Reuses the "glowing pill" convention already established elsewhere on the site (e.g. the step-1 "Dodaj akcesoria premium" button) rather than inventing a third button style.
- **Signature decoration — HeroRays**: a pure-SVG radiating line-burst (28 rays, 3-step long/short/medium length pattern echoing equalizer bars, ~1-in-7 rendered in cyan as accent) centered behind `HeroCardAnimation`, masked to fade at its edges. Replaces the prior flat CSS dot-grid background for the Hero section (removed — the mechanical detector flagged the grid as a generic "codex-grid-background" pattern, and running both at once would have split the section's one authored decorative moment into two competing ones).
- **HeroCardAnimation** (the photo→card transformation sequence) is untouched — it is the product's actual mechanism and existing brand IP, not something this pass had licence to redesign; only the button/decoration language around it changed.

## Motion

One authored moment per interactive element: CTA icon rotates on hover (existing pattern, kept), secondary CTA's circular icon gets a border-glow + slight scale on hover. No new scroll-triggered or ambient animation was added in this pass — `HeroCardAnimation`'s existing GSAP tilt/glare and phase-machine animation are unchanged.

## What This Pass Deliberately Did Not Touch

- Hero copy/content (H1, subhead, badges) — visual-only redesign per PRODUCT.md's Capabilities and Constraints.
- Business logic, order form, pricing — out of scope by product principle #2.
- Every other section of the public site, and the entire `/admin` surface — out of scope by product principle (admin explicitly excluded from the visual redesign effort).

## Verification

`npx tsc --noEmit` clean; `npm run build` clean; mechanical detector (`detect.mjs`) run on `app/page.tsx` + `app/page.module.css` — zero findings introduced by this change (one pre-existing, unrelated gradient-text advisory elsewhere in the file, left untouched as out of scope); full order-form regression script passed; desktop (1280px) and mobile (390px) screenshots reviewed for both the hero composition and the CTA/decoration area, no overflow or contrast issues observed.

**Review substitution disclosed:** this session's tool roster does not include the `impeccable-finish-reviewer` / `impeccable-documenter` subagents the skill's finish flow calls for; the finish review and this document were produced in-thread against `reference/craft-floor.md` and the mechanical detector instead, per the skill's degraded-flow instructions for a harness without that specific subagent available.
