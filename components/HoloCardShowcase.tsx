'use client'
import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(useGSAP, Observer)

// Interaktywna karta "holo" — Michał podesłał wzór (komponent HoloCard z zewnętrznego rejestru,
// poziomy format karty kredytowej), ale dostarczył tylko plik demo/użycia, nie sam komponent z
// logiką tilt+folia. Zamiast zgadywać nieznany kod, zbudowany od zera na DOKŁADNIE tym samym
// mechanizmie tiltu co HeroCardAnimation.tsx (GSAP Observer + quickTo na rotationX/rotationY) —
// sprawdzony, już działający w tym repo — plus warstwa tęczowej folii (CSS custom properties
// --holo-x/--holo-y aktualizowane na bieżąco pod kursorem, mix-blend-mode: color-dodge, dokładnie
// ten sam mechanizm co typowe karty "holo" w grach kolekcjonerskich). Dostosowane do PIONOWEGO
// formatu prawdziwej karty RA (638×1011, proporcja 0.631) zamiast poziomego demo (aspect 1.586).
export default function HoloCardShowcase({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  // `caption` zostaje w danych (jako alt zdjęcia, patrz niżej) mimo że widoczny akapit z tym
  // tekstem pod kartą został usunięty 2026-08-10 (Michał: mniej tekstu na stronie głównej,
  // szczegóły przenosimy na osobne podstrony) — tekst nadal potrzebny dla czytników ekranu/SEO.
  const t = lang === 'pl'
    ? { title: 'Poczuj efekt holo na żywo', caption: 'Przykładowa karta z naszej realizacji „Cambodia Style" — Twoja będzie unikalna, zaprojektowana specjalnie dla Ciebie.' }
    : { title: 'Feel the holo effect live', caption: 'A sample card from our "Cambodia Style" order — yours will be unique, designed just for you.' }

  const sceneRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const foilRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!sceneRef.current || !cardRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const card = cardRef.current
    const foil = foilRef.current
    const quickRotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' })
    const quickRotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' })
    const quickFoilOpacity = foil ? gsap.quickTo(foil, 'opacity', { duration: 0.3 }) : null

    const observer = Observer.create({
      target: sceneRef.current,
      type: 'pointer,touch',
      onMove: self => {
        const rect = sceneRef.current!.getBoundingClientRect()
        const px = gsap.utils.clamp(0, 1, ((self.x ?? 0) - rect.left) / rect.width)
        const py = gsap.utils.clamp(0, 1, ((self.y ?? 0) - rect.top) / rect.height)
        quickRotY(gsap.utils.mapRange(0, 1, -16, 16, px))
        quickRotX(gsap.utils.mapRange(0, 1, 14, -14, py))
        quickFoilOpacity?.(0.6)
        if (foil) {
          foil.style.setProperty('--holo-x', `${px * 100}%`)
          foil.style.setProperty('--holo-y', `${py * 100}%`)
        }
      },
      onHoverEnd: () => {
        quickRotX(0)
        quickRotY(0)
        quickFoilOpacity?.(0)
      },
    })

    return () => observer.kill()
  }, { scope: sceneRef })

  return (
    <section id="holo-karta" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-2 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <style>{`
        .holoFoil {
          position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background-image:
            radial-gradient(circle at var(--holo-x, 50%) var(--holo-y, 50%), rgba(255,255,255,0.3), transparent 45%),
            repeating-linear-gradient(
              115deg,
              rgba(180,77,255,0.16) 0%,
              rgba(0,240,255,0.16) 8%,
              rgba(0,229,160,0.14) 16%,
              rgba(255,183,3,0.14) 24%,
              rgba(180,77,255,0.16) 32%
            );
          background-size: 100% 100%, 220% 220%;
          background-position: var(--holo-x, 50%) var(--holo-y, 50%), var(--holo-x, 50%) var(--holo-y, 50%);
          mix-blend-mode: color-dodge;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      `}</style>

      <h2 className="font-heading text-[clamp(20px,2.6vw,28px)] font-bold text-foreground mb-6">{t.title}</h2>

      {/* touchAction: 'none' — bez tego dotknięcie karty na telefonie jednocześnie scrollowało
          stronę (przeglądarka domyślnie interpretuje przeciąganie palcem jako scroll), zanim GSAP
          Observer zdążył przejąć gest do tiltu. To wyłącza natywne gesty dotykowe (scroll/pinch)
          w obrębie tego kontenera, żeby cały gest szedł do Observera. */}
      <div ref={sceneRef} style={{ perspective: '1000px', touchAction: 'none' }} className="mx-auto flex w-[min(280px,68vw)] items-center justify-center">
        <div
          ref={cardRef}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform', aspectRatio: '638 / 1011' }}
          className="relative w-full overflow-hidden rounded-[16px] border border-border shadow-[0_0_28px_rgba(180,77,255,0.25)]"
        >
          <Image src="/holo_card_ex.png" alt={t.caption} fill sizes="280px" className="object-cover" priority />
          <div ref={foilRef} className="holoFoil" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
