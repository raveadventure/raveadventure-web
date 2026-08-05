'use client'
import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isSupabasePlaceholder, PORTFOLIO_LOCAL_MOCK } from '../lib/portfolioLocalMock'

gsap.registerPlugin(ScrollTrigger)

type Item = { id: string; name: string; card_url: string; theme: string }

const TXT = {
  pl: {
    title: 'Nasze karty', viewAll: 'Zobacz wszystkie →', prev: 'Poprzednia karta', next: 'Następna karta', card: (i: number) => `Karta ${i}`,
    filters: [
      { id: 'all', label: 'Wszystkie' },
      { id: 'techno_rave', label: 'Rave' },
      { id: 'festival', label: 'Festiwal' },
      { id: 'adventure', label: 'Podróże' },
      { id: 'custom', label: 'Custom' },
    ],
    ctaBelow: 'Zamów swoją kartę z kolejnego eventu →',
  },
  en: {
    title: 'Our cards', viewAll: 'View all →', prev: 'Previous card', next: 'Next card', card: (i: number) => `Card ${i}`,
    filters: [
      { id: 'all', label: 'All' },
      { id: 'techno_rave', label: 'Rave' },
      { id: 'festival', label: 'Festival' },
      { id: 'adventure', label: 'Travel' },
      { id: 'custom', label: 'Custom' },
    ],
    ctaBelow: 'Order your card from your next event →',
  },
}

export default function PortfolioCarousel({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('all')
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  // Mini-animacja przy scrollu (brief marketingowy, pkt 9) — środkowa karta dostaje jednorazowy
  // puls glow, gdy sekcja wjeżdża w widok, spójny ze świeceniem karty w animacji Hero
  // (patrz raGlowPulse w HeroCardAnimation.tsx). Odpala się raz, przy pierwszym wejściu w viewport.
  const sectionRef = useRef<HTMLElement>(null)
  const [glowIn, setGlowIn] = useState(false)

  const filteredItems = filter === 'all' ? items : items.filter(i => i.theme === filter)

  // Filtr zmienia pulę kart w karuzeli — wracamy na pierwszą, żeby "current" nie wskazywał
  // poza nową, krótszą listę (np. przy przejściu z "Wszystkie" na kategorię z 2 kartami).
  useEffect(() => { setCurrent(0) }, [filter])

  useEffect(() => {
    if (isSupabasePlaceholder()) {
      setItems(PORTFOLIO_LOCAL_MOCK)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    fetch(`${url}/rest/v1/portfolio?select=id,name,card_url,theme&active=eq.true&order=sort_order.asc`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setItems(data)
      })
      .catch(err => console.error('Carousel fetch error:', err))
  }, [])

  useEffect(() => {
    if (filteredItems.length <= 1 || paused) return
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % filteredItems.length)
    }, 3500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [filteredItems.length, paused])

  const go = (dir: number) => {
    setPaused(true)
    setCurrent(c => (c + dir + filteredItems.length) % filteredItems.length)
    setTimeout(() => setPaused(false), 5000)
  }

  useEffect(() => {
    if (!sectionRef.current) return
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      once: true,
      onEnter: () => setGlowIn(true),
    })
    return () => trigger.kill()
  }, [])

  if (items.length === 0) return null

  return (
    <section ref={sectionRef} id="realizacje" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-10 [scroll-margin-top:var(--nav-height,70px)]">
      <style>{`
        @keyframes raPortfolioGlowIn {
          0% { box-shadow: 0 0 0px rgba(180,77,255,0); }
          50% { box-shadow: 0 0 44px rgba(180,77,255,0.55); }
          100% { box-shadow: 0 0 28px rgba(180,77,255,0.25); }
        }
      `}</style>
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground">{t.title}</h2>
        <a href="/portfolio" className="text-sm text-primary whitespace-nowrap hover:underline">{t.viewAll}</a>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {t.filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 font-mono text-xs cursor-pointer transition-all duration-200 border text-center max-md:basis-[30%] ${
              filter === f.id
                ? 'border-primary text-primary bg-primary/15'
                : 'border-border text-muted-foreground bg-transparent'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">—</p>
      ) : (
      <>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <button onClick={() => go(-1)} aria-label={t.prev}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-lg cursor-pointer bg-transparent">
          ←
        </button>

        <div className="flex items-center justify-center gap-4 overflow-hidden">
          {[-2, -1, 0, 1, 2].map(offset => {
            const idx = (current + offset + filteredItems.length * 5) % filteredItems.length
            const item = filteredItems[idx]
            const isCenter = offset === 0
            const dist = Math.abs(offset)
            if (dist > 1 && filteredItems.length < 3) return null
            return (
              <div key={`${offset}`}
                onClick={() => isCenter ? (window.location.href = '/portfolio') : go(offset > 0 ? 1 : -1)}
                className="shrink-0 overflow-hidden rounded-[10px] cursor-pointer transition-all duration-400 ease-[cubic-bezier(.4,0,.2,1)]"
                style={{
                  width: isCenter ? '180px' : dist === 1 ? '130px' : '90px',
                  aspectRatio: '638 / 1011',
                  opacity: isCenter ? 1 : dist === 1 ? 0.55 : 0.25,
                  transform: `scale(${isCenter ? 1 : dist === 1 ? 0.9 : 0.8})`,
                  border: isCenter ? '1.5px solid var(--neon)' : '1px solid var(--border)',
                  boxShadow: isCenter ? '0 0 28px rgba(180,77,255,0.25)' : 'none',
                  animation: isCenter && glowIn ? 'raPortfolioGlowIn 1.3s ease-out' : undefined,
                }}>
                <img src={item.card_url} alt={item.name} className="h-full w-full object-cover block" />
              </div>
            )
          })}
        </div>

        <button onClick={() => go(1)} aria-label={t.next}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground text-lg cursor-pointer bg-transparent">
          →
        </button>
      </div>

      <div className="mt-5 text-center">
        <p className="mb-3 text-sm font-semibold text-foreground">{filteredItems[current]?.name}</p>
        <div className="flex justify-center gap-1.5">
          {filteredItems.map((_, i) => (
            <button key={i} onClick={() => { setPaused(true); setCurrent(i); setTimeout(() => setPaused(false), 5000) }}
              aria-label={t.card(i + 1)}
              className={`h-1.5 rounded-[3px] border-none cursor-pointer p-0 transition-all duration-300 ${i === current ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />
          ))}
        </div>
      </div>
      </>
      )}

      <div className="mt-8 text-center">
        <a href="#order"
          className="inline-block rounded-full border-[1.5px] border-primary bg-[var(--neon-dim)] px-7 py-3 text-sm font-bold text-primary no-underline transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_32px_rgba(180,77,255,0.5)] hover:scale-[1.03] active:scale-95"
          style={{ boxShadow: 'var(--glow-neon)', animation: glowIn ? 'raPortfolioGlowIn 1.3s ease-out' : undefined }}>
          {t.ctaBelow}
        </a>
      </div>
    </section>
  )
}
