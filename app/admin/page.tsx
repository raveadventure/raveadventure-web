'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { id: 'new',        label: 'Nowe',           color: '#f59e0b' },
  { id: 'in_project', label: 'W projekcie',     color: '#3b82f6' },
  { id: 'approval',   label: 'Do akceptacji',   color: '#8b5cf6' },
  { id: 'production', label: 'Produkcja',        color: '#f97316' },
  { id: 'shipped',    label: 'Wysłane',          color: '#10b981' },
  { id: 'done',       label: 'Zakończone',       color: '#6b7280' },
]

const THEMES: Record<string, string> = {
  techno: 'Techno',
  rave: 'Rave',
  festival: 'Festival',
  travel: 'Adventure',
}

type Order = {
  id: string
  created_at: string
  theme: string
  name: string
  email: string
  phone: string
  address: string
  card_text: string
  notes: string
  photo_url: string | null
  status: string
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    }
    setUpdating(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusObj = (id: string) => STATUSES.find(s => s.id === id) || STATUSES[0]

  const formatDate = (d: string) => new Date(d).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.id] = orders.filter(o => o.status === s.id).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eeff', fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: '#0e0e1a', borderBottom: '1px solid rgba(180,77,255,0.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ fontSize: '18px', fontWeight: 700, color: '#f0eeff', textDecoration: 'none' }}>
            Rave<span style={{ color: '#b44dff' }}>Adventure</span>
          </a>
          <span style={{ fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(240,238,255,0.4)' }}>
            {orders.length} zamówień łącznie
          </span>
          <button onClick={fetchOrders} style={{ background: 'rgba(180,77,255,0.15)', border: '1px solid rgba(180,77,255,0.3)', color: '#b44dff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↻ Odśwież
          </button>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '0', minHeight: 'calc(100vh - 57px)' }}>

        {/* LEWA KOLUMNA */}
        <div style={{ padding: '24px' }}>

          {/* STATYSTYKI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            <div
              onClick={() => setFilter('all')}
              style={{ background: filter === 'all' ? 'rgba(180,77,255,0.15)' : '#0e0e1a', border: `1px solid ${filter === 'all' ? '#b44dff' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#f0eeff' }}>{orders.length}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>Wszystkie</p>
            </div>
            {STATUSES.map(s => (
              <div
                key={s.id}
                onClick={() => setFilter(filter === s.id ? 'all' : s.id)}
                style={{ background: filter === s.id ? `${s.color}22` : '#0e0e1a', border: `1px solid ${filter === s.id ? s.color : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}
              >
                <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: s.color }}>{counts[s.id] || 0}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* LISTA ZAMÓWIEŃ */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(240,238,255,0.3)' }}>Ładowanie zamówień...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(240,238,255,0.3)' }}>Brak zamówień</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(order => {
                const st = statusObj(order.status)
                const isSelected = selected?.id === order.id
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelected(isSelected ? null : order)}
                    style={{
                      background: isSelected ? '#16162a' : '#0e0e1a',
                      border: `1px solid ${isSelected ? '#b44dff' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', padding: '16px 20px', cursor: 'pointer',
                      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px',
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '16px' }}>
                      {/* Zdjęcie */}
                      {order.photo_url ? (
                        <img src={order.photo_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#16162a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎴</div>
                      )}
                      {/* Dane */}
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '15px', color: '#f0eeff' }}>{order.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.4)' }}>
                          {THEMES[order.theme] || order.theme} · {formatDate(order.created_at)}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44`, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {st.label}
                      </span>
                    </div>

                    {/* Szybka zmiana statusu */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      {STATUSES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updateStatus(order.id, s.id)}
                          disabled={order.status === s.id || updating === order.id}
                          style={{
                            background: order.status === s.id ? `${s.color}33` : 'transparent',
                            border: `1px solid ${order.status === s.id ? s.color : 'rgba(255,255,255,0.1)'}`,
                            color: order.status === s.id ? s.color : 'rgba(240,238,255,0.4)',
                            padding: '4px 10px', borderRadius: '5px', fontSize: '11px', cursor: order.status === s.id ? 'default' : 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.15s'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PRAWY PANEL — SZCZEGÓŁY */}
        {selected && (
          <div style={{ background: '#0e0e1a', borderLeft: '1px solid rgba(180,77,255,0.2)', padding: '24px', position: 'sticky', top: '57px', height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// szczegóły</p>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Zdjęcie */}
            {selected.photo_url && (
              <div style={{ marginBottom: '20px' }}>
                <img src={selected.photo_url} alt="Zdjęcie klienta" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', maxHeight: '200px' }} />
                <a href={selected.photo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#b44dff', textDecoration: 'none' }}>
                  Otwórz pełne zdjęcie →
                </a>
              </div>
            )}

            {/* Status */}
            <div style={{ background: '#16162a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(240,238,255,0.4)' }}>Zmień status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => updateStatus(selected.id, s.id)}
                    disabled={selected.status === s.id || updating === selected.id}
                    style={{
                      background: selected.status === s.id ? `${s.color}22` : 'transparent',
                      border: `1px solid ${selected.status === s.id ? s.color : 'rgba(255,255,255,0.1)'}`,
                      color: selected.status === s.id ? s.color : 'rgba(240,238,255,0.6)',
                      padding: '8px 14px', borderRadius: '7px', fontSize: '13px',
                      cursor: selected.status === s.id ? 'default' : 'pointer',
                      fontFamily: 'inherit', textAlign: 'left', fontWeight: selected.status === s.id ? 600 : 400,
                      transition: 'all 0.15s'
                    }}
                  >
                    {selected.status === s.id ? '● ' : '○ '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dane */}
            <div style={{ background: '#16162a', borderRadius: '10px', overflow: 'hidden' }}>
              {[
                { label: 'ID', value: selected.id.slice(0, 8) + '...' },
                { label: 'Data', value: formatDate(selected.created_at) },
                { label: 'Motyw', value: THEMES[selected.theme] || selected.theme },
                { label: 'Klient', value: selected.name },
                { label: 'Email', value: selected.email, link: `mailto:${selected.email}` },
                { label: 'Telefon', value: selected.phone || '—' },
                { label: 'Adres', value: selected.address },
                { label: 'Tekst', value: selected.card_text || '—' },
                { label: 'Uwagi', value: selected.notes || '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(240,238,255,0.4)', minWidth: '60px', flexShrink: 0 }}>{row.label}</span>
                  {row.link
                    ? <a href={row.link} style={{ fontSize: '13px', color: '#00f0ff', textDecoration: 'none', wordBreak: 'break-all' }}>{row.value}</a>
                    : <span style={{ fontSize: '13px', color: '#f0eeff', wordBreak: 'break-word' }}>{row.value}</span>
                  }
                </div>
              ))}
            </div>

            {/* Wyślij maila do klienta */}
            <a
              href={`mailto:${selected.email}?subject=Twój projekt karty RaveAdventure&body=Hej ${selected.name.split(' ')[0]},%0A%0APrzygotowaliśmy projekt Twojej karty do zatwierdzenia.%0A%0APozdrawiamy,%0ARaveAdventure`}
              style={{ display: 'block', textAlign: 'center', background: '#b44dff', color: '#0a0014', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', marginTop: '16px' }}
            >
              ✉ Wyślij projekt do klienta
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
