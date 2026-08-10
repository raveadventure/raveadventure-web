'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { isSupabasePlaceholder, PORTFOLIO_LOCAL_MOCK } from '../lib/portfolioLocalMock'

gsap.registerPlugin(Observer)

// Karuzela portfolio na stronie głównej — karty w wachlarzu 3D wokół aktywnej, przeciąganie/klik
// do zmiany. Zastąpiła 2026-08-10 poprzednią, prostszą PortfolioCarousel.tsx (usuniętą) po tym, jak
// Michał porównał obie wersje żywcem na stronie ("dodaj dwie abym mógł sobie porównać") i wybrał tę.
// `id="realizacje"` przejęty z usuniętego komponentu — quickNav i sekundarne CTA w Hero
// (`href="#realizacje"`) linkują tu bez zmian, nic po ich stronie nie wymagało aktualizacji.
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
    title: 'Nasze karty',
    card: (i: number) => `Karta ${i}`,
    galleryBtn: 'Zobacz całą naszą galerię',
    orderBtn: 'Zamów swoją kartę z ostatniego eventu →',
  },
  en: {
    title: 'Our cards',
    card: (i: number) => `Card ${i}`,
    galleryBtn: 'See our full gallery',
    orderBtn: 'Order your card from the latest event →',
  },
}

// Wymiary powiększone o 20% (2026-08-10, na życzenie Michała) względem pierwszej wersji tego
// komponentu — same proporcje, po prostu w większej skali.
const MAX_OFFSET = 2
const CARD_W = 178
const CARD_SPACING = 94
const STEP_DEG = 16
const ARC_Y = 19

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
        y: abs * ARC_Y + (isActive ? -17 : 0),
        z: -abs * 84,
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
    <section id="realizacje" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-14 [scroll-margin-top:var(--nav-height,70px)]">
      <h2 className="mb-6 text-center font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground">{t.title}</h2>

      <div className="mb-8 text-center">
        <a href="/portfolio"
          className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-7 py-3 text-sm font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_32px_rgba(180,77,255,0.5)] hover:scale-[1.03] active:scale-95"
          style={{ boxShadow: 'var(--glow-neon)' }}>
          {t.galleryBtn}
        </a>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto flex items-center justify-center select-none overflow-hidden"
        style={{ height: '360px', perspective: '1200px', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
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

      <div className="mt-8 text-center">
        <a href="#order"
          className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-7 py-3 text-sm font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_32px_rgba(180,77,255,0.5)] hover:scale-[1.03] active:scale-95"
          style={{ boxShadow: 'var(--glow-neon)' }}>
          {t.orderBtn}
        </a>
      </div>
    </section>
  )
}
