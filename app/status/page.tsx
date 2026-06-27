'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { id: 'new',        label: 'Zamówienie przyjęte',  desc: 'Twoje zamówienie zostało zarejestrowane w systemie.',        color: '#f59e0b', icon: '📋' },
  { id: 'in_project', label: 'W projekcie',           desc: 'Pracujemy nad Twoją kartą. Projekt będzie gotowy wkrótce.',  color: '#3b82f6', icon: '🎨' },
  { id: 'approval',   label: 'Czeka na akceptację',   desc: 'Projekt został wysłany na Twój email. Sprawdź skrzynkę.',   color: '#8b5cf6', icon: '📬' },
  { id: 'production', label: 'W produkcji',            desc: 'Projekt zaakceptowany! Karta jest drukowana.',              color: '#f97316', icon: '🖨' },
  { id: 'shipped',    label: 'Wysłana',                desc: 'Karta została nadana i jest w drodze do Ciebie.',           color: '#10b981', icon: '📦' },
  { id: 'done',       label: 'Dostarczona',            desc: 'Gotowe! Ciesz się swoją kartą.',                            color: '#6b7280', icon: '✅' },
]

type Order = {
  id: string
  created_at: string
  approved_at: string | null
  shipped_at: string | null
  status: string
  name: string
  theme: string
  card_type: string
  quantity: number
  total_price: number
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days} ${days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} temu`
  if (hours > 0) return `${hours} ${hours === 1 ? 'godzinę' : 'godziny'} temu`
  if (mins > 0) return `${mins} min temu`
  return 'przed chwilą'
}

function StatusContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    supabase
      .from('orders')
      .select('id,created_at,approved_at,shipped_at,status,name,theme,card_type,quantity,total_price')
      .eq('id', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setOrder(data)
        setLoading(false)
      })
  }, [token])

  const s = { fontFamily: "'Space Grotesk', sans-serif", color: '#f0eeff' }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#080810', ...s }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <nav style={{ background: '#0e0e1a', borderBottom: '1px solid rgba(180,77,255,0.2)', padding: '16px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontFamily: 'Space Mono', fontSize: '18px', fontWeight: 700, color: '#f0eeff', textDecoration: 'none' }}>
          Rave<span style={{ color: '#b44dff' }}>Adventure</span>
        </a>
        <a href="/#order" style={{ fontSize: '13px', color: '#b44dff', textDecoration: 'none', border: '1px solid rgba(180,77,255,0.3)', padding: '6px 14px', borderRadius: '6px' }}>
          Zamów kartę
        </a>
      </nav>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 5vw 80px' }}>
        {children}
      </div>
    </div>
  )

  if (loading) return wrap(<p style={{ color: 'rgba(240,238,255,0.4)', textAlign: 'center', padding: '60px 0' }}>Ładowanie...</p>)

  if (notFound || !order) return wrap(
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</p>
      <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Nie znaleziono zamówienia</p>
      <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>Link może być nieprawidłowy lub zamówienie zostało usunięte.</p>
      <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#b44dff', fontSize: '14px' }}>kontakt@raveadventure.pl</a>
    </div>
  )

  const currentIdx = STATUSES.findIndex(s => s.id === order.status)
  const current = STATUSES[currentIdx] || STATUSES[0]

  const THEMES: Record<string, string> = { techno_rave: 'Techno / Rave', festival: 'Festiwal', adventure: 'Adventure', custom: 'Custom' }
  const TYPES: Record<string, string> = { pvc: 'Karta PVC', laminated: 'Karta Laminowana' }

  return wrap(<>
    <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#b44dff', letterSpacing: '2px', margin: '0 0 12px' }}>// status zamówienia</p>
    <h1 style={{ fontFamily: 'Space Mono', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
      Hej, {order.name.split(' ')[0]}!
    </h1>
    <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px', margin: '0 0 32px' }}>
      Zamówienie złożone {timeSince(order.created_at)}
    </p>

    {/* AKTUALNY STATUS */}
    <div style={{ background: '#0e0e1a', border: `1px solid ${current.color}44`, borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{current.icon}</div>
      <p style={{ fontFamily: 'Space Mono', fontSize: '16px', fontWeight: 700, color: current.color, margin: '0 0 8px' }}>{current.label}</p>
      <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>{current.desc}</p>
    </div>

    {/* OŚ CZASU STATUSÓW */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 16px' }}>// postęp zamówienia</p>
      {STATUSES.map((s, i) => {
        const isDone = i <= currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={s.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < STATUSES.length - 1 ? '4px' : '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDone ? s.color : '#16162a', border: `2px solid ${isDone ? s.color : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', transition: 'all .3s' }}>
                {isDone ? (isCurrent ? s.icon : '✓') : ''}
              </div>
              {i < STATUSES.length - 1 && (
                <div style={{ width: '2px', height: '24px', background: i < currentIdx ? s.color : 'rgba(255,255,255,0.06)', transition: 'background .3s' }} />
              )}
            </div>
            <div style={{ paddingTop: '4px', paddingBottom: '20px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: isCurrent ? 600 : 400, color: isDone ? '#f0eeff' : 'rgba(240,238,255,0.3)' }}>{s.label}</p>
              {isCurrent && <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>{s.desc}</p>}
            </div>
          </div>
        )
      })}
    </div>

    {/* CZAS REALIZACJI */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 14px' }}>// czas realizacji</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'rgba(240,238,255,0.5)' }}>Zamówienie złożone</span>
          <span style={{ color: '#f0eeff' }}>{timeSince(order.created_at)}</span>
        </div>
        {order.approved_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Projekt zaakceptowany</span>
            <span style={{ color: '#00e5a0' }}>{timeSince(order.approved_at)}</span>
          </div>
        )}
        {order.shipped_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Karta wysłana</span>
            <span style={{ color: '#10b981' }}>{timeSince(order.shipped_at)}</span>
          </div>
        )}
        {order.approved_at && !order.shipped_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Czas od akceptacji do teraz</span>
            <span style={{ color: '#f97316' }}>{timeSince(order.approved_at)}</span>
          </div>
        )}
      </div>
    </div>

    {/* SZCZEGÓŁY */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 14px' }}>// szczegóły zamówienia</p>
      {[
        { label: 'Typ karty', value: TYPES[order.card_type] || order.card_type },
        { label: 'Motyw', value: THEMES[order.theme] || order.theme },
        { label: 'Ilość', value: `${order.quantity} szt.` },
        { label: 'Do zapłaty', value: `${order.total_price} zł` },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
          <span style={{ color: 'rgba(240,238,255,0.5)' }}>{row.label}</span>
          <span style={{ color: '#f0eeff', fontWeight: 500 }}>{row.value}</span>
        </div>
      ))}
    </div>

    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,240,255,0.04)', borderRadius: '10px', border: '1px solid rgba(0,240,255,0.1)' }}>
      <p style={{ fontSize: '13px', color: 'rgba(240,238,255,0.6)', margin: '0 0 6px' }}>Masz pytania do zamówienia?</p>
      <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#00f0ff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>kontakt@raveadventure.pl</a>
    </div>
  </>)
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(240,238,255,0.3)', fontFamily: 'sans-serif' }}>Ładowanie...</p>
      </div>
    }>
      <StatusContent />
    </Suspense>
  )
}
