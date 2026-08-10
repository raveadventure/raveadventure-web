'use client'
import { useState } from 'react'
import { SubpageNav, SubpageBack, SubpageFooter } from '../../components/SubpageChrome'
import FaqReviews from '../../components/FaqReviews'

// Wydzielone ze strony głównej 2026-08-10 (Michał: "Strona jest dla mnie za długa") — dawniej
// <FaqReviews /> renderowane bezpośrednio w app/page.tsx na samym końcu strony; treść 1:1 bez
// zmian (formularz dodawania opinii z moderacją, akordeon FAQ), tylko nowe miejsce.
export default function FaqOpiniePage() {
  const [lang, setLang] = useState<'pl' | 'en'>('pl')

  return (
    <main className="min-h-screen">
      <SubpageNav lang={lang} setLang={setLang} />
      <SubpageBack lang={lang} />
      <div className="mx-auto max-w-[1100px] px-[5vw] pt-6 pb-2 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-primary">// {lang === 'pl' ? 'pytania i opinie' : 'questions & reviews'}</p>
        <h1 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-foreground">{lang === 'pl' ? 'FAQ i opinie' : 'FAQ & reviews'}</h1>
      </div>
      <FaqReviews lang={lang} />
      <SubpageFooter lang={lang} />
    </main>
  )
}
