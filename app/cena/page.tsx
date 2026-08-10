'use client'
import { useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SubpageNav, SubpageBack, SubpageFooter } from '../../components/SubpageChrome'
import CostTransparency from '../../components/CostTransparency'
import PremiumOptionsShowcase from '../../components/PremiumOptionsShowcase'

// Wydzielone ze strony głównej 2026-08-10 (Michał: "Strona jest dla mnie za długa") — dawniej
// <CostTransparency /> renderowane bezpośrednio w app/page.tsx między WhyUs a "Jak to działa";
// treść komponentu 1:1 bez zmian, tylko nowe miejsce. Link w quickNav ("Cena") i to samo miejsce w
// mailach/gdziekolwiek indziej może później wskazywać tutaj zamiast na kotwicę na stronie głównej.
//
// Rozbudowane tego samego dnia (drugie zlecenie): Michał podesłał obszerny prompt opisujący
// motion-design zewnętrznej strony klubu tenisowego jako REFERENCJĘ STYLU ("przygotuj całą stronę
// CENA i dostosuj na podstawie tego promptu") — pewna, edytorialska prezentacja z dużym nagłówkiem
// odsłanianym maską (clip-mask reveal). Nagłówek "Cena" dostał ten sam zabieg (GSAP, nie surowy JS
// ze sprężynami z promptu — patrz komentarz w PremiumOptionsShowcase.tsx), plus nowa sekcja
// <PremiumOptionsShowcase /> pokazująca Top Holder/magnes/NFC jako osobne, "warte dopłaty" karty.
export default function CenaPage() {
  const [lang, setLang] = useState<'pl' | 'en'>('pl')
  const titleWrapRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!titleWrapRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      titleWrapRef.current.querySelector('h1'),
      { y: '115%', opacity: 0 },
      { y: '0%', opacity: 1, duration: 1, ease: 'expo.out', delay: 0.15 }
    )
  }, { scope: titleWrapRef })

  return (
    <main className="min-h-screen">
      <SubpageNav lang={lang} setLang={setLang} />
      <SubpageBack lang={lang} />
      <div className="mx-auto max-w-[1100px] px-[5vw] pt-6 pb-2 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-primary">// {lang === 'pl' ? 'cennik' : 'pricing'}</p>
        <div ref={titleWrapRef} className="overflow-hidden">
          <h1 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-foreground">{lang === 'pl' ? 'Cena' : 'Price'}</h1>
        </div>
      </div>
      <CostTransparency lang={lang} />
      <PremiumOptionsShowcase lang={lang} />
      <SubpageFooter lang={lang} />
    </main>
  )
}
