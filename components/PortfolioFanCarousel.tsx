'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { isSupabasePlaceholder, PORTFOLIO_LOCAL_MOCK } from '../lib/portfolioLocalMock'

gsap.registerPlugin(Observer)

// Wersja porównawcza karuzeli (2026-08-10, na wyraźną prośbę Michała: "dodaj dwie abym mógł sobie
// porównać") — ta sama pula kart co PortfolioCarousel.tsx (identyczne dane, żeby porównanie było
// uczciwe — różni się tylko MECHANIKA prezentacji), renderowana bezpośrednio pod istniejącą
// karuzelą na stronie głównej. Świadomie TYMCZASOWA — Michał ma wybrać, którą zostawić, a którą
// usunąć; nie traktować obu jako docelowego, podwójnego stanu strony.
//
// Michał podesłał gotowy komponent `CardStack` (framer-motion + Draggable spring physics, karty w
// formacie landscape 520×320 z podpisem na nakładce). CLAUDE.md dokumentuje świadomą decyzję z tej
// sesji: framer-motion nie wchodzi do projektu (stack animacji został celowo skonsolidowany do
// samego GSAP), więc przeniesiona została WYŁĄCZNIE zasada działania (karty w wachlarzu 3D wokół
// aktywnej, przeciąganie do zmiany karty) — zaimplementowana od zera na GSAP Observer (dokładnie ten
// sam mechanizm co przeciąganie/tilt w HeroCardAnimation.tsx i HoloCardShowcase.tsx, nie nowy wzorzec
// w kodzie) zamiast Draggable+framer's useSpring. Format karty zmieniony z landscape 520×320 na
// pionowy 638:1011 — to prawdziwy kształt karty RaveAdventure, taki sam jak w reszcie strony.
type Item = { id: string; name: string; card_url: string; theme: string }

const TXT = {
  pl: {
    title: 'Wersja 2 — karuzela w wachlarzu',
    sub: 'Ta sama pula kart, inny sposób przeglądania — przeciągnij w bok albo kliknij dowolną kartę.',
    card: (i: number) => `Karta ${i}`,
  },
  en: {
    title: 'Version 2 — fan carousel',
    sub: 'The same set of cards, a different way to browse them — drag sideways or click any card.',
    card: (i: number) => `Card ${i}`,
  },
}

const MAX_OFFSET = 2
const CARD_W = 148
const CARD_SPACING = 78
const STEP_DEG = 16
const ARC_Y = 16

function wrap(n: number, len: number) {
  if (len <= 0) return 0
  return ((n % len) + len) % len
}

function signedOffset(i: number, active: number, len: number) {
  const raw = i - active
  if (len <= 1) return raw
  const alt = raw > 0 ? raw - len : raw + len
  return Math.abs(alt) < Math.abs(raw) ? alt : raw
}

export default function PortfolioFanCarousel({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [items, setItems] = useState<Item[]>([])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (isSupabasePlaceholder()) {
      setItems(PORTFOLIO_LOCAL_MOCK)
      return
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    fetch(`${url}/rest/v1/portfolio?select=id,name,card_url,theme&active=eq.true&order=sort_order.asc`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setItems(data) })
      .catch(err => console.error('Fan carousel fetch error:', err))
  }, [])

  const go = (dir: number) => {
    setPaused(true)
    setActive(a => wrap(a + dir, items.length))
    setTimeout(() => setPaused(false), 5000)
  }

  // Autoplay — wstrzymywane na hover/drag, wyłączone całkowicie przy prefers-reduced-motion (ten
  // sam wzorzec co reszta strony: sprawdzone jawnie w JS, bo samo CSS media query nie łapie
  // transformów pisanych bezpośrednio przez GSAP).
  useEffect(() => {
    if (items.length <= 1 || paused || dragging || reducedMotion.current) return
    intervalRef.current = setInterval(() => setActive(a => wrap(a + 1, items.length)), 3200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [items.length, paused, dragging])

  // Przeciąganie całego "stage'a" (nie tylko aktywnej karty) — Observer śledzi gest, sam nie
  // przesuwa niczego wizualnie w trakcie (żeby nie kłócić się o te same property co layoutowy
  // useEffect niżej); dopiero na końcu gestu decyduje, czy próg został przekroczony.
  useEffect(() => {
    if (!stageRef.current || items.length <= 1) return
    let total = 0
    const observer = Observer.create({
      target: stageRef.current,
      type: 'touch,pointer',
      onPress: () => { total = 0; setDragging(true) },
      onDrag: self => { total += self.deltaX },
      onDragEnd: self => {
        setDragging(false)
        const threshold = 55
        if (total < -threshold || self.velocityX < -400) go(1)
        else if (total > threshold || self.velocityX > 400) go(-1)
      },
    })
    return () => observer.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // Layout — dla każdej widocznej karty (offset -MAX_OFFSET..MAX_OFFSET od aktywnej) animuje
  // pozycję w wachlarzu GSAP-em, ten sam mechanizm (quickTo/tweeny na rotationX/Y/Z + z) co tilt w
  // HeroCardAnimation.tsx/HoloCardShowcase.tsx — nie nowy wzorzec animacji w tym repo.
  useEffect(() => {
    if (items.length === 0) return
    items.forEach((item, i) => {
      const off = signedOffset(i, active, items.length)
      const abs = Math.abs(off)
      const el = cardRefs.current[item.id]
      if (!el) return
      if (abs > MAX_OFFSET) {
        gsap.set(el, { autoAlpha: 0, pointerEvents: 'none' })
        return
      }
      const isActive = off === 0
      gsap.to(el, {
        x: off * CARD_SPACING,
        y: abs * ARC_Y + (isActive ? -14 : 0),
        z: -abs * 70,
        rotationZ: off * STEP_DEG,
        rotationX: isActive ? 0 : 8,
        scale: isActive ? 1.08 : 1 - abs * 0.13,
        autoAlpha: 1 - abs * 0.12,
        zIndex: 100 - abs,
        pointerEvents: 'auto',
        duration: reducedMotion.current ? 0 : 0.6,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    })
  }, [active, items])

  if (items.length === 0) return null

  return (
    <section data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-4 pb-14 [scroll-margin-top:var(--nav-height,70px)]">
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="rounded-full border border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.08)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[2px] text-[#00f0ff]">
          A/B
        </span>
        <h2 className="font-heading text-[clamp(18px,2.4vw,24px)] font-bold text-foreground">{t.title}</h2>
      </div>
      <p className="mb-8 text-center text-sm text-muted-foreground">{t.sub}</p>

      <div
        ref={stageRef}
        className="relative mx-auto flex items-center justify-center select-none overflow-hidden"
        style={{ height: '300px', perspective: '1200px', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
      >
        {items.map((item, i) => {
          const off = signedOffset(i, active, items.length)
          if (Math.abs(off) > MAX_OFFSET) return null
          const isActive = off === 0
          return (
            <div
              key={item.id}
              ref={el => { cardRefs.current[item.id] = el }}
              onClick={() => { if (!dragging) setActive(i) }}
              className="absolute overflow-hidden rounded-[14px] border shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
              style={{
                width: CARD_W,
                aspectRatio: '638 / 1011',
                borderColor: isActive ? 'var(--neon)' : 'var(--border)',
                borderWidth: isActive ? '1.5px' : '1px',
                boxShadow: isActive ? '0 0 28px rgba(180,77,255,0.3), 0 18px 40px -16px rgba(0,0,0,0.6)' : undefined,
                transformStyle: 'preserve-3d',
                cursor: isActive ? 'grab' : 'pointer',
              }}
            >
              <img src={item.card_url} alt={item.name} className="h-full w-full object-cover pointer-events-none" draggable={false} />
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="mb-3 text-sm font-semibold text-foreground">{items[active]?.name}</p>
        <div className="flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={() => { setPaused(true); setActive(i); setTimeout(() => setPaused(false), 5000) }}
              aria-label={t.card(i + 1)}
              className={`h-1.5 rounded-[3px] border-none cursor-pointer p-0 transition-all duration-300 ${i === active ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
