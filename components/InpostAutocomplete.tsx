'use client'
import { useEffect, useRef, useState } from 'react'

type Point = { id: string; address: string }

// Podpowiedzi paczkomatów "w locie" — pyta /api/inpost-search (serwerowy proxy do darmowego,
// publicznego API InPost) po każdej zmianie tekstu, z debounce, żeby nie odpytywać przy każdym
// znaku. Używane jako fallback, gdy nie ma jeszcze prawdziwego tokenu Geowidget (patrz
// components/InpostGeowidget.tsx) — nie wymaga żadnego konta/tokenu.
export default function InpostAutocomplete({ lang, onSelect }: { lang: 'pl' | 'en'; onSelect: (point: Point) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Point[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); setLoading(false); return }
    setLoading(true)
    const timeout = setTimeout(() => {
      fetch(`/api/inpost-search?q=${encodeURIComponent(query.trim())}`)
        .then(r => r.json())
        .then(data => { setResults(data.points || []); setOpen(true) })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={lang === 'pl' ? 'np. Kraków, ul. Floriańska lub WAW01A' : 'e.g. city, street, or locker code'}
      />
      {open && (loading || results.length > 0 || query.trim().length >= 3) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)', maxHeight: '260px', overflowY: 'auto',
        }}>
          {loading ? (
            <p style={{ margin: 0, padding: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {lang === 'pl' ? 'Szukam…' : 'Searching…'}
            </p>
          ) : results.length === 0 ? (
            <p style={{ margin: 0, padding: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {lang === 'pl' ? 'Brak wyników — spróbuj innej nazwy miasta lub ulicy.' : 'No results — try a different city or street name.'}
            </p>
          ) : (
            results.map(p => (
              <div key={p.id}
                onClick={() => { onSelect(p); setQuery(''); setResults([]); setOpen(false) }}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && (onSelect(p), setQuery(''), setResults([]), setOpen(false))}
                style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--neon-dim)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                📦 {p.address}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
