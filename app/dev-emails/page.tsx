'use client'
import { useEffect, useState } from 'react'

type DevEmail = { id: string; to: string[]; from: string; subject: string; createdAt: string }

export default function DevEmailsPage() {
  const [emails, setEmails] = useState<DevEmail[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/dev-emails')
    const data = await res.json()
    setEmails(data.emails || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eeff', fontFamily: "'Space Grotesk', sans-serif", display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* LISTA */}
      <div style={{ width: '340px', flexShrink: 0, borderRight: '1px solid rgba(180,77,255,0.2)', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(180,77,255,0.2)', position: 'sticky', top: 0, background: '#080810' }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#b44dff', letterSpacing: '2px', margin: '0 0 4px' }}>// dev-emails (lokalny podgląd)</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(240,238,255,0.5)' }}>{emails.length} zapisanych maili</p>
          <button onClick={load} style={{ marginTop: '8px', background: 'transparent', border: '1px solid rgba(180,77,255,0.3)', color: '#b44dff', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↻ Odśwież
          </button>
        </div>
        {loading ? (
          <p style={{ padding: '20px', color: 'rgba(240,238,255,0.3)', fontSize: '13px' }}>Ładowanie...</p>
        ) : emails.length === 0 ? (
          <p style={{ padding: '20px', color: 'rgba(240,238,255,0.3)', fontSize: '13px', lineHeight: 1.6 }}>
            Brak maili. Złóż testowe zamówienie albo wyślij projekt w panelu admina — pojawi się tutaj zamiast trafić na prawdziwy Resend.
          </p>
        ) : (
          emails.map(e => (
            <div key={e.id} onClick={() => setSelected(e.id)}
              style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', background: selected === e.id ? 'rgba(180,77,255,0.1)' : 'transparent' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>{e.subject}</p>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>do: {e.to.join(', ')}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.3)', fontFamily: 'Space Mono' }}>{new Date(e.createdAt).toLocaleString('pl-PL')}</p>
            </div>
          ))
        )}
      </div>

      {/* PODGLĄD */}
      <div style={{ flex: 1, height: '100vh' }}>
        {selected ? (
          <iframe src={`/api/dev-emails/${selected}`} style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} title="Podgląd maila" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(240,238,255,0.3)', fontSize: '14px' }}>
            Wybierz mail z listy po lewej, żeby zobaczyć podgląd
          </div>
        )}
      </div>
    </div>
  )
}
