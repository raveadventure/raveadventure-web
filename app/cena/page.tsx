'use client'
import { useState } from 'react'
import { SubpageNav, SubpageBack, SubpageFooter } from '../../components/SubpageChrome'
import CostTransparency from '../../components/CostTransparency'

// Wydzielone ze strony głównej 2026-08-10 (Michał: "Strona jest dla mnie za długa") — dawniej
// <CostTransparency /> renderowane bezpośrednio w app/page.tsx między WhyUs a "Jak to działa";
// treść komponentu 1:1 bez zmian, tylko nowe miejsce. Link w quickNav ("Cena") i to samo miejsce w
// mailach/gdziekolwiek indziej może później wskazywać tutaj zamiast na kotwicę na stronie głównej.
export default function CenaPage() {
  const [lang, setLang] = useState<'pl' | 'en'>('pl')

  return (
    <main className="min-h-screen">
      <SubpageNav lang={lang} setLang={setLang} />
      <SubpageBack lang={lang} />
      <div className="mx-auto max-w-[1100px] px-[5vw] pt-6 pb-2 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-primary">// {lang === 'pl' ? 'cennik' : 'pricing'}</p>
        <h1 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-foreground">{lang === 'pl' ? 'Cena' : 'Price'}</h1>
      </div>
      <CostTransparency lang={lang} />
      <SubpageFooter lang={lang} />
    </main>
  )
}
