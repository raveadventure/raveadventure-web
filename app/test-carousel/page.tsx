'use client'
import { useEffect, useState } from 'react'

export default function TestCarousel() {
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState('loading...')
  const [url, setUrl] = useState('')

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setUrl(supabaseUrl || 'BRAK URL')

    if (!supabaseUrl || !supabaseKey) {
      setStatus('BRAK ZMIENNYCH ŚRODOWISKOWYCH')
      return
    }

    fetch(`${supabaseUrl}/rest/v1/portfolio?select=id,name,card_url&active=eq.true&order=sort_order.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    })
      .then(r => {
        setStatus(`Status HTTP: ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data)
          setStatus(`OK — znaleziono ${data.length} kart`)
        } else {
          setStatus(`Błąd: ${JSON.stringify(data)}`)
        }
      })
      .catch(err => setStatus(`Fetch error: ${err.message}`))
  }, [])

  return (
    <div style={{ padding: '40px', background: '#080810', minHeight: '100vh', color: '#f0eeff', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#b44dff', marginBottom: '20px' }}>Test Carousel</h1>
      <p style={{ marginBottom: '8px' }}>Supabase URL: <strong>{url}</strong></p>
      <p style={{ marginBottom: '24px' }}>Status: <strong style={{ color: status.startsWith('OK') ? '#00e5a0' : '#ff4d6d' }}>{status}</strong></p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {items.map(item => (
          <div key={item.id} style={{ textAlign: 'center' }}>
            <img src={item.card_url} alt={item.name} style={{ width: '120px', borderRadius: '8px', display: 'block', marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', color: '#b44dff' }}>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
