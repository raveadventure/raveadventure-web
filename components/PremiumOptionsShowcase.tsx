'use client'
import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Nowa sekcja na /cena (2026-08-10) — Michał podesłał obszerny prompt opisujący styl motion-design
// zewnętrznej strony klubu tenisowego ("Baseline") jako REFERENCJĘ ESTETYCZNĄ: pewna, edytorialska
// prezentacja, duże karty ze zdjęciami, spring/scroll reveale, przemyślana hierarchia. Zaadaptowane
// TYLKO jako język wizualny — nie skopiowano ani jednej linijki kodu/treści o tenisie. Reveale
// zrobione na GSAP + ScrollTrigger (nie na surowym JS-owym silniku sprężyn z promptu i nie na
// Lenis-owanej bibliotece spring), bo GSAP to już jedyna, ustalona biblioteka animacji w tym
// repo (patrz CLAUDE.md — świadoma decyzja skonsolidowania stacku, framer-motion/inne biblioteki
// animacji celowo nie wchodzą do projektu).
const TXT = {
  pl: {
    eyebrow: '// warto dopłacić',
    title: 'Zrób z karty coś więcej',
    sub: 'Trzy dodatki, które najczęściej wybierają nasi klienci — i dlaczego naprawdę zmieniają, jak często wracasz do swojej karty.',
    items: [
      {
        id: 'top-holder',
        img: '/real-cards/top-holder-1.jpg',
        title: 'Karta w stylowym Top Holderze',
        price: '+20 zł',
        body: 'Sztywne, przezroczyste etui na mini-stojaku zamienia kartę w prawdziwy kolekcjonerski eksponat — stoi na biurku, nie leży zapomniana w portfelu. Chroni przed zarysowaniem i zagięciem, a każdy kto ją zobaczy, zapyta „co to za karta?".',
      },
      {
        id: 'magnet',
        img: '/real-cards/fridge-1.jpg',
        title: 'Karta z magnesem na lodówkę',
        price: '+5 zł',
        body: 'Magnes z tyłu karty zamienia ją w pamiątkę, którą widzisz codziennie — nie raz w miesiącu, gdy przypadkiem otworzysz portfel. Idealna na lodówkę, tablicę korkową czy szafkę w biurze.',
      },
      {
        id: 'nfc',
        img: null,
        title: 'Karta z chipem NFC',
        price: '+15 zł/kartę',
        priceNote: '(od 4 szt. +8 zł/kartę)',
        body: 'Zbliż telefon do karty, a od razu udostępnisz swój Instagram, playlistę z imprezy albo hasło do WiFi — bez wpisywania, bez szukania. Twoja karta robi coś więcej niż tylko dobrze wygląda.',
      },
    ],
  },
  en: {
    eyebrow: '// worth the upgrade',
    title: 'Make your card do more',
    sub: "Three add-ons our customers pick most often — and why they genuinely change how often you come back to your card.",
    items: [
      {
        id: 'top-holder',
        img: '/real-cards/top-holder-1.jpg',
        title: 'Card in a stylish Top Holder',
        price: '+20 zł',
        body: "A rigid, clear case on a mini stand turns your card into a real collectible display piece — standing on your desk, not forgotten in your wallet. It protects against scratches and bending, and everyone who sees it will ask \"what card is that?\"",
      },
      {
        id: 'magnet',
        img: '/real-cards/fridge-1.jpg',
        title: 'Card with a fridge magnet',
        price: '+5 zł',
        body: 'A magnet on the back turns your card into a keepsake you see every day — not once a month when you happen to open your wallet. Perfect for the fridge, a cork board, or your desk at work.',
      },
      {
        id: 'nfc',
        img: null,
        title: 'Card with an NFC chip',
        price: '+15 zł/card',
        priceNote: '(4+ cards: +8 zł/card)',
        body: "Tap your phone on the card and instantly share your Instagram, your festival playlist, or the WiFi password — no typing, no searching. Your card does more than just look good.",
      },
    ],
  },
}

function NfcVisual() {
  // Brak realnego zdjęcia "w użyciu" (NFC to niewidzialna technologia) — zamiast stockowego
  // zdjęcia telefonu, własna grafika w języku wizualnym marki: karta + fala zbliżenia, te same
  // kolory/rytm co HeroRays/StepsRays (fioletowo-cyjanowe promienie), nie nowy motyw.
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#12081f,#0a0014)]">
      <svg viewBox="0 0 200 200" className="absolute h-[220%] w-[220%] opacity-40" aria-hidden="true">
        {[0, 1, 2, 3].map(i => (
          <circle
            key={i}
            cx="100" cy="100" r={26 + i * 22}
            fill="none"
            stroke={i % 2 === 0 ? '#b44dff' : '#00f0ff'}
            strokeWidth="1"
            strokeOpacity={0.55 - i * 0.1}
          />
        ))}
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(0,240,255,0.5)] bg-[rgba(0,240,255,0.08)] text-3xl shadow-[0_0_28px_rgba(0,240,255,0.35)]">
          📲
        </div>
        <span className="rounded-full border border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.08)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[2px] text-[#00f0ff]">
          NFC / RFID
        </span>
      </div>
    </div>
  )
}

export default function PremiumOptionsShowcase({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!sectionRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cards = gsap.utils.toArray<HTMLElement>('[data-premium-card]', sectionRef.current)
    gsap.set(cards, { opacity: 0, y: 36 })
    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }),
    })
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-10 pb-16">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-primary">{t.eyebrow}</p>
        <h2 className="mb-3 font-heading text-[clamp(24px,3.4vw,38px)] font-bold text-foreground">{t.title}</h2>
        <p className="mx-auto max-w-[560px] text-sm text-muted-foreground leading-relaxed">{t.sub}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {t.items.map(item => (
          <div
            key={item.id}
            data-premium-card
            className="group overflow-hidden rounded-[20px] border border-border bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(180,77,255,0.45)] hover:shadow-[var(--glass-shadow),var(--glow-neon)]"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              {item.img ? (
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <NfcVisual />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 rounded-full border border-primary bg-[var(--neon-dim)] px-3 py-1 font-heading text-xs font-bold text-primary backdrop-blur-sm">
                {item.price}
              </div>
            </div>
            <div className="p-5">
              <h3 className="mb-1.5 font-heading text-[16px] font-bold text-foreground">{item.title}</h3>
              {'priceNote' in item && item.priceNote && (
                <p className="mb-2 text-[11px] text-muted-foreground">{item.priceNote}</p>
              )}
              <p className="text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href="/#order"
          className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-7 py-3 text-sm font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_32px_rgba(180,77,255,0.5)] hover:scale-[1.03] active:scale-95"
          style={{ boxShadow: 'var(--glow-neon)' }}
        >
          {lang === 'pl' ? 'Skonfiguruj swoją kartę →' : 'Configure your card →'}
        </a>
      </div>
    </section>
  )
}
