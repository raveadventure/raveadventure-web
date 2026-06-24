'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

type Item = { id: string; name: string; card_url: string; theme: string }

export default function PortfolioCarousel() {
  const [items, setItems] = useState<Item[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolio')
          .select('id,name,card_url,theme')
          .eq('active', true)
          .order('sort_order', { ascending: true })
        if (error) {
          console.error('Portfolio carousel error:', error)
          return
        }
        if (data && data.length > 0) {
          setItems(data)
        }
      } catch (err) {
        console.error('Portfolio carousel exception:', err)
      }
    }
    loadPortfolio()
  }, [])

  useEffect(() => {
    if (items.length <= 1 || paused) return
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length)
    }, 3500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [items.length, paused])

  const go = (dir: number) => {
    setPaused(true)
    setCurrent(c => (c + dir + items.length) % items.length)
    setTimeout(() => setPaused(false), 5000)
  }

  if (items.length === 0) return null // no items yet

  return (
    <section style={{ padding: '80px 5vw', maxWidth: '1100px', margin: '0 auto' }}>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>// realizacje</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Nasze karty</h2>
        <a href="/portfolio" style={{ fontSize: '13px', color: 'var(--neon)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Zobacz wszystkie →
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '16px' }}>
        {/* Strzałka wstecz */}
        <button onClick={() => go(-1)} aria-label="Poprzednia karta"
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--neon)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          ←
        </button>

        {/* Karty */}
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden', justifyContent: 'center' }}>
          {[-2, -1, 0, 1, 2].map(offset => {
            const idx = (current + offset + items.length * 5) % items.length
            const item = items[idx]
            const isCenter = offset === 0
            const dist = Math.abs(offset)
            return (
              <div key={`${idx}-${offset}`}
                onClick={() => isCenter ? window.location.href = '/portfolio' : go(offset > 0 ? 1 : -1)}
                style={{
                  flexShrink: 0,
                  width: isCenter ? '180px' : dist === 1 ? '140px' : '100px',
                  aspectRatio: '0.7',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  opacity: isCenter ? 1 : dist === 1 ? 0.6 : 0.3,
                  transform: `scale(${isCenter ? 1 : dist === 1 ? 0.92 : 0.84})`,
                  transition: 'all .4s cubic-bezier(.4,0,.2,1)',
                  cursor: 'pointer',
                  border: isCenter ? '1.5px solid var(--neon)' : '1px solid var(--border)',
                  boxShadow: isCenter ? '0 0 24px rgba(180,77,255,0.2)' : 'none',
                  display: ['xs','sm'].includes(dist > 1 ? 'xs' : '') ? 'none' : 'block',
                }}>
                <img src={item.card_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )
          })}
        </div>

        {/* Strzałka dalej */}
        <button onClick={() => go(1)} aria-label="Następna karta"
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--neon)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          →
        </button>
      </div>

      {/* Nazwa i dots */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px' }}>{items[current]?.name}</p>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => { setPaused(true); setCurrent(i); setTimeout(() => setPaused(false), 5000) }}
              aria-label={`Karta ${i + 1}`}
              style={{ width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px', border: 'none', background: i === current ? 'var(--neon)' : 'var(--border)', cursor: 'pointer', padding: 0, transition: 'all .3s' }} />
          ))}
        </div>
      </div>
    </section>
  )
}
