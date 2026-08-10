'use client'
import { T } from '../lib/translations'

// Lekka wspólna "obudowa" (nav + footer) dla nowych podstron wydzielonych ze strony głównej
// (2026-08-10: /cena, /jak-to-dziala, /faq-opinie — Michał: "Strona jest dla mnie za długa").
// Świadomie prostsza niż fixed nav strony głównej (bez quickNav, bez blur/scroll-shrink) — te
// podstrony mają być na razie "do klikania", dopracowanie wizualne przyjdzie później (patrz
// DESIGN.md). Footer to 1:1 treść z app/page.tsx (te same linki/teksty z T[lang].footer), więc
// stopka wygląda identycznie na każdej stronie serwisu.

export function SubpageNav({ lang, setLang }: { lang: 'pl' | 'en'; setLang: (l: 'pl' | 'en') => void }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-[rgba(8,8,16,0.85)] px-[5vw] py-4 backdrop-blur-md">
      <a href="/" className="font-heading text-lg font-bold text-foreground no-underline">
        Rave<span className="text-primary">Adventure</span>
      </a>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-[var(--surface2)] p-1">
          <button
            onClick={() => setLang('pl')}
            aria-pressed={lang === 'pl'}
            className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold transition-colors duration-150 ${lang === 'pl' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            PL
          </button>
          <button
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold transition-colors duration-150 ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            EN
          </button>
        </div>
        <a
          href="/#order"
          className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-4 py-2 text-xs font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_24px_rgba(180,77,255,0.5)]"
        >
          {lang === 'pl' ? 'Zamów kartę' : 'Order a card'}
        </a>
      </div>
    </nav>
  )
}

export function SubpageBack({ lang }: { lang: 'pl' | 'en' }) {
  return (
    <div className="mx-auto max-w-[1100px] px-[5vw] pt-6">
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">
        ← {lang === 'pl' ? 'Strona główna' : 'Home'}
      </a>
    </div>
  )
}

export function SubpageFooter({ lang }: { lang: 'pl' | 'en' }) {
  const t = T[lang]
  return (
    <footer className="border-t border-border py-10 px-[5vw] text-center">
      <p className="font-heading text-xl font-bold text-primary mb-1.5">RaveAdventure</p>
      <p className="text-sm text-muted-foreground mb-4">kontakt@raveadventure.pl</p>
      <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3">
        <a href="https://www.instagram.com/rave_adventure_pl/" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">Instagram</a>
        <span className="text-[var(--text-faint)] text-xs">·</span>
        <a href="https://www.facebook.com/raveadventurepl" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">Facebook</a>
        <span className="text-[var(--text-faint)] text-xs">·</span>
        <a href="/regulamin" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.regulamin}</a>
        <span className="text-[var(--text-faint)] text-xs">·</span>
        <a href="/polityka-prywatnosci" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.polityka}</a>
        <span className="text-[var(--text-faint)] text-xs">·</span>
        <a href="/portfolio" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.portfolio}</a>
      </div>
      <p className="text-xs text-[var(--text-faint)]">{t.footer.copy}</p>
    </footer>
  )
}
