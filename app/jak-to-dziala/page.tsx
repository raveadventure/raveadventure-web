'use client'
import { useState } from 'react'
import { SubpageNav, SubpageBack, SubpageFooter } from '../../components/SubpageChrome'
import HowItWorksSteps from '../../components/HowItWorksSteps'

// Wydzielone ze strony głównej 2026-08-10 (Michał: "Strona jest dla mnie za długa") — dawniej 4
// kroki procesu zamówienia renderowane bezpośrednio w app/page.tsx (id="jak-zamowic"), owinięte w
// mechanizm zwijania na mobile (.mobileCollapse — usunięty razem z tym przeniesieniem, bo cały sens
// zwijania był oszczędzanie miejsca na DŁUGIEJ stronie głównej; na dedykowanej podstronie użytkownik
// świadomie tu wszedł, więc kroki są od razu w pełni widoczne).
//
// UWAGA: akordeon "Co możesz zamówić" (opcje tyłu karty/NFC) ZOSTAŁ na stronie głównej, mimo że
// wcześniej dzielił tę samą sekcję z krokami — te "(i)" przyciski w formularzu zamówienia
// (jumpToOption w app/page.tsx) skaczą bezpośrednio do tego akordeonu i rozwijają konkretną pozycję;
// przeniesienie go tutaj zerwałoby tę funkcję. To świadomy, nie przeoczony podział.
export default function JakToDzialaPage() {
  const [lang, setLang] = useState<'pl' | 'en'>('pl')

  return (
    <main className="min-h-screen">
      <SubpageNav lang={lang} setLang={setLang} />
      <SubpageBack lang={lang} />
      <div className="mx-auto max-w-[1100px] px-[5vw] pt-6 pb-2 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-primary">// {lang === 'pl' ? 'proces zamówienia' : 'order process'}</p>
        <h1 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-foreground">{lang === 'pl' ? 'Jak to działa' : 'How it works'}</h1>
      </div>
      <div className="mx-auto max-w-[1100px] px-[5vw] pt-4 pb-14">
        <HowItWorksSteps lang={lang} />
        <div className="mt-8 text-center">
          <a
            href="/#order"
            className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-7 py-3 text-sm font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_32px_rgba(180,77,255,0.5)] hover:scale-[1.03] active:scale-95"
            style={{ boxShadow: 'var(--glow-neon)' }}
          >
            {lang === 'pl' ? 'Zamów swoją kartę →' : 'Order your card →'}
          </a>
        </div>
      </div>
      <SubpageFooter lang={lang} />
    </main>
  )
}
