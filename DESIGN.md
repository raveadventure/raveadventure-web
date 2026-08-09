# Design

<!-- impeccable:design-schema 1 -->

**Scope note:** This records the visual system established for the Hero section (`app/page.tsx` Hero block + `components/HeroCardAnimation.tsx`) on 2026-08-08, extended the same day to the "Jak to działa" step cards, the `WhyUs` ("Dlaczego my") cards, the FAQ "still have questions" card in `components/FaqReviews.tsx`, and the persistent nav CTA; extended 2026-08-09 to the new `components/CostTransparency.tsx` section. The rest of the public site (AdShowcase, PortfolioCarousel — already pill-styled independently before this direction existed, RealCardsSection, order form, footer) predates this decision and has not been brought into this system yet — do not assume it matches until it's deliberately extended here.

## Component Language — CTA buttons: what got unified, what deliberately didn't

- **Unified:** the fixed nav's "Zamów kartę" button (`app/page.tsx`) was the last remaining Persuade-mode marketing CTA still on the old `border + rounded-lg` treatment — moved to the same glowing-pill class already shared by Hero, PortfolioCarousel, the FAQ card, and the step-1 accessories button. That pill class has now been reused identically in five places without a sixth variant being invented.
- **Deliberately left alone:** the order form's step-navigation ("Dalej"/"Wstecz") and final submit buttons. Those are Operate-mode (task completion, not persuasion) — per this skill's own mode guidance, expression should never obscure the task or a familiar affordance there, and pill/glow treatment is a Persuade-mode signature. Converting them would have been scope creep against the skill's own rules, not consistency.
- Utility icon buttons (mute/unmute on `AdShowcase`, accordion toggles, the payment-info disclosure toggle) were left as-is for the same reason — they're controls, not calls to action.

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

## Component Language — "Jak to działa" step cards

- Extends the Hero direction rather than repeating it verbatim: same card surface (`var(--surface)` fill, 1px border, 16px radius, purple border-glow + lift on hover) as the rest of the site's card language, but the step number is now the dominant visual element — large (32px, Audiowide), low-opacity purple, pinned bottom-right — replacing the small top-left "01" label the section used before.
- **StepsRays**: a second, more subdued instance of the ray-burst motif (20 rays vs. Hero's 28, lower opacity, smaller mask radius) centered behind the step row. Shares its generator (`buildRays()`) with `HeroRays` rather than being a copy-pasted variant, but is deliberately toned down — the brief's own reference used the ray motif at different scales in different sections (hero vs. process vs. blog cards), never identically, and this follows that precedent rather than stamping the same asset everywhere.
- **Bug caught in review (fixed same session):** the first version let the step description text and the bottom-right number collide on the longest step ("Zatwierdź projekt", 4 lines at narrow widths) — cards stretch to equal height via CSS Grid's default `align-items: stretch`, so a fixed bottom-padding reservation wasn't enough once one card's real content got tall. Fixed by giving the description text a permanent `padding-right` (34px) instead of relying on bottom padding — the text column now stays clear of the number's column at every vertical position, not just past a guessed height.

## Component Language — `WhyUs` ("Dlaczego my") cards

- Extends the direction with a new small element: a short uppercase tag pill in the card's top-right corner (e.g. "1:1, NIE SZABLON", "NAMACALNE"), same row as the existing icon box — mirrors the reference's icon-left/tag-right service-card header without copying its copy or icon set. Tag color and icon-box color both key off the card's existing `--accent` CSS variable (the pre-existing 4-color cycle: neon/cyan/success/warning), so the new element didn't require inventing a second color system.
- Card body order changed from icon+heading-on-one-row/description to icon+tag-header-row, then heading, then description — gives the tag room without crowding the heading, and reads top-to-bottom like the SkyNexa reference instead of the prior single icon+heading row.
- Existing card chrome (gradient surface fill, top glow bar, hover lift + accent-tinted shadow, 2×2/1-col responsive grid) was already close to the established direction and was kept as-is — this pass added the tag, not a rebuild.
- Kept the site's existing icon convention (emoji, matching `WhyUs`'s own prior pattern and the options/FAQ cards elsewhere) rather than introducing a drawn-icon system for one section — craft-floor generally discourages emoji-as-icons, but this section inherits an established site-wide convention rather than being a fresh greenfield surface, and mixing two icon systems on one page would have been the worse failure.

## Component Language — FAQ "Nadal masz pytania?" card

- Adapts SkyNexa's FAQ sidebar card (icon + copy + CTA pill) as a closing element below the FAQ accordion, not a third grid column — RA's FAQ section is already a 2-column grid (FAQ list / reviews), and a third column would have broken that existing balance rather than extending it. This is the pattern's intent (a contact prompt after the question list) adapted to RA's actual layout, not a literal transplant.
- CTA reuses the exact "glowing pill" class string already used in three other places on the site (Hero secondary-turned-primary pattern, PortfolioCarousel's bottom CTA, the step-1 "Dodaj akcesoria premium" button) — a fourth invented button style would have fragmented the system rather than extending it.
- **Deliberately not responsive-row (no `sm:flex-row`):** the first version put icon+copy on one row and the button beside them at `sm:` (640px viewport) width, which looks fine in isolation but this card lives inside a ~500px-wide grid column even on a 1280px desktop viewport — Tailwind's `sm:` breakpoint reads the *viewport*, not the containing grid track, so it flipped to a cramped row layout that visually collided. Caught in review before shipping; fixed by keeping the card always vertical (icon+heading row, then description, then button, no breakpoint) since the column width, not the viewport, is what actually constrains this element.

## Component Language — `CostTransparency` ("Skąd bierze się cena Twojej karty?")

- New section (2026-08-09, Michał's request) placed between `WhyUs` and "Jak to działa" — narratively "why us" → "why this price is fair" → "how it works". Real cost figures supplied directly by Michał (materials 2,00 zł; printing front+back 2,00 zł; artwork generation 3,20 zł; fixed costs/domain+licenses 7,16 zł; shipping supplies 3,20 zł; his own labor explicitly 0,00 zł), total production cost 17,57 zł against a 40,00 zł Standard card price. Numbers are real business figures, not placeholders — do not invent or round them differently in future edits without Michał confirming new numbers.
- Origin note: Michał pasted a generic "integrate this shadcn registry component" prompt (a currency-balance widget from an unrelated third-party registry, with its own competing Button/Card/Badge/Avatar component family and design tokens). That component's actual content didn't match the request at all, and importing its component family would have introduced a second, conflicting design system alongside RA's existing bespoke Tailwind + CSS-variable one. Only the underlying *pattern* — a segmented proportional bar with a legend — was reused; the component itself was built from scratch on RA's own tokens, no new npm dependencies added (radix-ui/lucide-react/class-variance-authority were already installed for the existing shadcn Accordion/Dialog/Tabs/Button).
- **"Praca własna" (own labor) is a callout badge, not a bar segment** — a 0-width segment would be invisible and undercut the exact point Michał wanted to make (he doesn't charge for his own time). Rendered instead as a highlighted pill reading "ZA DARMO"/"FREE".
- Segment colors are meaningful, not just cycled: purple/cyan for the two most "product" line items (material, printing), warning-amber for artwork generation, a neutral gray for fixed infrastructure costs (domain/licenses — deliberately the least visually exciting category), success-green for shipping/logistics.
- Closing copy explicitly frames the gap between cost and price as covering real, unlisted costs and unpaid labor time — not profit — per Michał's explicit request ("w tym projekcie nie chodzi o zarabianie"). This is a factual/tone claim from the business owner, not invented copy.

## Motion

One authored moment per interactive element: CTA icon rotates on hover (existing pattern, kept), secondary CTA's circular icon gets a border-glow + slight scale on hover. No new scroll-triggered or ambient animation was added in this pass — `HeroCardAnimation`'s existing GSAP tilt/glare and phase-machine animation are unchanged.

## What This Pass Deliberately Did Not Touch

- Hero copy/content (H1, subhead, badges) — visual-only redesign per PRODUCT.md's Capabilities and Constraints.
- Business logic, order form, pricing — out of scope by product principle #2.
- Every other section of the public site, and the entire `/admin` surface — out of scope by product principle (admin explicitly excluded from the visual redesign effort).

## Verification

`npx tsc --noEmit` clean; `npm run build` clean; mechanical detector (`detect.mjs`) run on `app/page.tsx` + `app/page.module.css` — zero findings introduced by this change (one pre-existing, unrelated gradient-text advisory elsewhere in the file, left untouched as out of scope); full order-form regression script passed; desktop (1280px) and mobile (390px) screenshots reviewed for both the hero composition and the CTA/decoration area, no overflow or contrast issues observed.

**Review substitution disclosed:** this session's tool roster does not include the `impeccable-finish-reviewer` / `impeccable-documenter` subagents the skill's finish flow calls for; the finish review and this document were produced in-thread against `reference/craft-floor.md` and the mechanical detector instead, per the skill's degraded-flow instructions for a harness without that specific subagent available.
