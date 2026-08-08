# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Festival/rave/techno attendees who want a physical, collectible keepsake from a specific event or memory — not a generic gift-shop customer. They upload a personal photo (often from a specific set/night/festival) and expect the finished card to feel like *their* memory, not a template with their face swapped in. Secondary: people ordering as a gift for someone in that scene (e.g. a DJ, a friend who went to a specific event).

## Product Purpose

RaveAdventure turns a festival/rave photo into a personalized, collectible PVC card (ATM-card format) or business-card-format set. The customer uploads a photo → gets a confirmation email → the owner (Michał) creates the artwork (via a separate AI-assisted desktop tool, "Rave Adventure Cards Creator," not part of this repo) → sends 1–2 design proposals for approval → customer approves (unlimited free revisions until happy) → customer pays (automatically via Paybylink — BLIK/Przelewy Online — or manual BLIK/transfer as fallback) → card is printed and shipped.

## Positioning

Not a mass-produced photo-gift service (like a generic "put your face on a mug/card" site). RaveAdventure is boutique/curated: every order is hand-reviewed by one person who is genuinely part of the rave/techno subculture, so the finished card reads as an insider artifact of that scene (imagery, tone, card "rarity"/attribute game mechanics borrowed from collectible trading cards) rather than a generic novelty print. The owner's engineering background is itself part of the pitch (fast turnaround, clear communication, quality process) layered onto the passion-project authenticity.

## Operating Context

Solo-run, unregistered hobby business (Poland) alongside a full-time job — not a funded/scaled company. Order volume is roughly 10–30 cards/day at peak, handled by one person end-to-end (design curation, admin panel, shipping). Every order goes through a linear status pipeline (`new → in_project → approval → awaiting_payment → production → shipped → done`) visible to the owner in a custom admin panel and to the customer via a token-based status page. Design creation itself happens outside this repo, in a separate desktop tool; this site only collects the order brief (theme, photo, attributes, notes) and manages the business/communication/payment flow around it.

## Capabilities and Constraints

- 5-step order form (card type → theme/photo/attributes → back options → quantity/price → contact/discount/consent) — step count and order are settled product decisions, not open to simplification.
- Card types: PVC (ATM-card format, supports NFC/RFID, multiple finish options — magnet, Top Holder, stand, combinations) and business-card set (100 pcs, no finish options).
- Pricing/discount logic (quantity discount, discount codes, NFC add-on, finish add-ons, PL/EU shipping tiers) is settled and must be preserved functionally through any visual redesign.
- Payment: automated online (Paybylink — BLIK + Przelewy Online) with manual BLIK/bank-transfer as a permanent fallback, not a temporary state.
- Unlimited free design revisions until the customer approves — this is a deliberate differentiator, not a limitation to "fix."
- Backend: Next.js/Supabase/Resend. No dedicated design-generation feature in this repo (that lives in a separate desktop app) — do not propose building AI image generation into this site.
- Admin panel (`/admin` and related tools) is explicitly out of scope for the current visual redesign effort — it stays on its existing (pre-redesign) styling.

## Brand Commitments

- Name: RaveAdventure / "Rave Adventure." Logo motif (waves/equalizer bars → forming a card shape → arrow) has real personal meaning to the owner (his own journey into the rave scene) — treat it as emotionally load-bearing, not a placeholder mark to redraw freely.
- Tone: warm, personal, hobbyist passion project — explicitly not corporate or enterprise-sounding, even as the site itself looks polished/premium.
- **Protected color palette (do not change without explicit confirmation):** background `#07070f` / `#0a0014`, primary neon accent purple `#b44dff`, secondary accent cyan `#00f0ff`, success `#00e5a0`, error `#ff4d6d`, warning `#f59e0b`. This has been treated as non-negotiable brand identity since the project's redesign began and was explicitly reconfirmed during this exact Hero-redesign request.
- Copy exists in Polish and English (`lib/translations.tsx`); Polish is the primary/default language for the owner and most customers.

## Evidence on Hand

- Real product photography exists (card in hand, in a wallet, in a Top Holder stand, on a fridge magnet) — see `components/RealCardsSection.tsx` / `public/real-cards/`.
- A real portfolio of past cards exists (`app/portfolio`, `components/PortfolioCarousel.tsx`) with theme tags (Rave/Festival/Adventure/Custom).
- Real customer reviews/testimonials exist (`components/FaqReviews.tsx`, admin-moderated) including optional photo/quote social proof.
- No case studies, press mentions, or third-party benchmarks exist — do not fabricate any.

## Product Principles

1. Every visual and UX decision should read as "personal, curated, insider" rather than "mass-market e-commerce template" — the site is selling a subculture artifact, not a commodity print.
2. Preserve business logic and data flow exactly through any visual change (pricing math, order status pipeline, Supabase schema, transactional emails) — redesign changes appearance, never mechanics, without an explicit separate decision.
3. Keep the maintenance burden appropriate for a solo hobbyist working alongside a full-time job — avoid patterns that require ongoing operational overhead beyond occasional content updates.
4. The protected brand palette (purple/cyan on near-black) is the one visual constant that survives every redesign iteration unless the owner explicitly decides otherwise.
5. Mobile is a first-class target, not an afterthought — a large share of customers browse and order on phones.

## Accessibility & Inclusion

No formally required standard has been set by the owner; general web accessibility good practice (contrast, touch target size, reduced-motion support) has been applied in past redesign passes and should continue.
