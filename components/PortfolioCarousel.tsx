'use client'
import { useEffect, useState, useRef } from 'react'
import { isSupabasePlaceholder, PORTFOLIO_LOCAL_MOCK } from '../lib/portfolioLocalMock'

type Item = { id: string; name: string; card_url: string; theme: string }

const TXT = {
  pl: {
    eyebrow: '// realizacje', title: 'Nasze karty', viewAll: 'Zobacz wszystkie →', prev: 'Poprzednia karta', next: 'Następna karta', card: (i: number) => `Karta ${i}`,
    filters: [
      { id: 'all', label: 'Wszystkie' },
      { id: 'techno_rave', label: 'Rave' },
      { id: 'festival', label: 'Festiwal' },
      { id: 'adventure', label: 'Podróże' },
      { id: 'custom', label: 'Custom' },
    ],
    ctaBelow: 'Zamów swoją kartę z kolejnego eventu →',
  },
  en: {
    eyebrow: '// our work', title: 'Our cards', viewAll: 'View all →', prev: 'Previous card', next: 'Next card', card: (i: number) => `Card ${i}`,
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setGlowIn(true); observer.disconnect() }
    }, { threshold: 0.3 })
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) return null

  return (
    <section ref={sectionRef} id="realizacje" style={{ padding: '32px 5vw 40px', maxWidth: '1100px', margin: '0 auto', scrollMarginTop: 'var(--nav-height, 70px)' }}>
      <style>{`
        @keyframes raPortfolioGlowIn {
          0% { box-shadow: 0 0 0px rgba(180,77,255,0); }
          50% { box-shadow: 0 0 44px rgba(180,77,255,0.55); }
          100% { box-shadow: 0 0 28px rgba(180,77,255,0.25); }
        }
      `}</style>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>{t.eyebrow}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.title}</h2>
        <a href="/portfolio" style={{ fontSize: '13px', color: 'var(--neon)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{t.viewAll}</a>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {t.filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontFamily: "'Space Mono', monospace",
              cursor: 'pointer', transition: 'all .2s',
              border: filter === f.id ? '1px solid var(--neon)' : '1px solid var(--border)',
              background: filter === f.id ? 'color-mix(in srgb, var(--neon) 15%, transparent)' : 'transparent',
              color: filter === f.id ? 'var(--neon)' : 'var(--text-muted)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '32px 0' }}>—</p>
      ) : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => go(-1)} aria-label={t.prev}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          ←
        </button>

        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
          {[-2, -1, 0, 1, 2].map(offset => {
            const idx = (current + offset + filteredItems.length * 5) % filteredItems.length
            const item = filteredItems[idx]
            const isCenter = offset === 0
            const dist = Math.abs(offset)
            if (dist > 1 && filteredItems.length < 3) return null
            return (
              <div key={`${offset}`}
                onClick={() => isCenter ? (window.location.href = '/portfolio') : go(offset > 0 ? 1 : -1)}
                style={{
                  flexShrink: 0,
                  width: isCenter ? '180px' : dist === 1 ? '130px' : '90px',
                  aspectRatio: '0.65',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  opacity: isCenter ? 1 : dist === 1 ? 0.55 : 0.25,
                  transform: `scale(${isCenter ? 1 : dist === 1 ? 0.9 : 0.8})`,
                  transition: 'all .4s cubic-bezier(.4,0,.2,1)',
                  cursor: 'pointer',
                  border: isCenter ? '1.5px solid var(--neon)' : '1px solid var(--border)',
                  boxShadow: isCenter ? '0 0 28px rgba(180,77,255,0.25)' : 'none',
                  animation: isCenter && glowIn ? 'raPortfolioGlowIn 1.3s ease-out' : undefined,
                }}>
                <img src={item.card_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )
          })}
        </div>

        <button onClick={() => go(1)} aria-label={t.next}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          →
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px' }}>{filteredItems[current]?.name}</p>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {filteredItems.map((_, i) => (
            <button key={i} onClick={() => { setPaused(true); setCurrent(i); setTimeout(() => setPaused(false), 5000) }}
              aria-label={t.card(i + 1)}
              style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', border: 'none', background: i === current ? 'var(--neon)' : 'var(--border)', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
          ))}
        </div>
      </div>
      </>
      )}

      <div style={{ textAlign: 'center', marginTop: '28px' }}>
        <a href="#order" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neon)', textDecoration: 'none' }}>{t.ctaBelow}</a>
      </div>
    </section>
  )
}
