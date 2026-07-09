'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { id: 'new',        labelPl: 'Zamówienie przyjęte',  labelEn: 'Order received',        descPl: 'Twoje zamówienie zostało zarejestrowane w systemie.', descEn: 'Your order has been registered in our system.', color: '#f59e0b', icon: '📋' },
  { id: 'in_project', labelPl: 'W projekcie',           labelEn: 'In design',              descPl: 'Pracujemy nad Twoją kartą. Projekt będzie gotowy wkrótce.', descEn: 'We are working on your card. The design will be ready soon.', color: '#3b82f6', icon: '🎨' },
  { id: 'approval',   labelPl: 'Czeka na akceptację',   labelEn: 'Awaiting approval',      descPl: 'Projekt został wysłany na Twój email. Sprawdź skrzynkę.', descEn: 'The design has been sent to your email. Please check your inbox.', color: '#8b5cf6', icon: '📬' },
  { id: 'awaiting_payment', labelPl: 'Do opłacenia',    labelEn: 'Awaiting payment',       descPl: 'Projekt zaakceptowany! Dane do płatności znajdziesz w mailu z projektem.', descEn: 'Design approved! Payment details are in the email with your design.', color: '#ec4899', icon: '💳' },
  { id: 'production', labelPl: 'W produkcji',            labelEn: 'In production',          descPl: 'Projekt zaakceptowany! Karta jest drukowana.', descEn: 'Design approved! Your card is being printed.', color: '#f97316', icon: '🖨' },
  { id: 'shipped',    labelPl: 'Wysłana',                labelEn: 'Shipped',                descPl: 'Karta została nadana i jest w drodze do Ciebie.', descEn: 'Your card has been shipped and is on its way to you.', color: '#10b981', icon: '📦' },
  { id: 'done',       labelPl: 'Dostarczona',            labelEn: 'Delivered',              descPl: 'Gotowe! Ciesz się swoją kartą.', descEn: 'All done! Enjoy your card.', color: '#6b7280', icon: '✅' },
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
  const pl = days > 0 ? `${days} ${days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'} temu`
    : hours > 0 ? `${hours} ${hours === 1 ? 'godzinę' : 'godziny'} temu`
    : mins > 0 ? `${mins} min temu` : 'przed chwilą'
  const en = days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} ago`
    : hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    : mins > 0 ? `${mins} min ago` : 'just now'
  return { pl, en }
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
          Zamów kartę · Order
        </a>
      </nav>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 5vw 80px' }}>
        {children}
      </div>
    </div>
  )

  if (loading) return wrap(<p style={{ color: 'rgba(240,238,255,0.4)', textAlign: 'center', padding: '60px 0' }}>Ładowanie... · Loading...</p>)

  if (notFound || !order) return wrap(
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</p>
      <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Nie znaleziono zamówienia</p>
      <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(240,238,255,0.6)', marginBottom: '16px' }}>Order not found</p>
      <p style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px', marginBottom: '4px' }}>Link może być nieprawidłowy lub zamówienie zostało usunięte.</p>
      <p style={{ color: 'rgba(240,238,255,0.35)', fontSize: '13px', marginBottom: '24px' }}>This link may be invalid, or the order has been removed.</p>
      <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#b44dff', fontSize: '14px' }}>kontakt@raveadventure.pl</a>
    </div>
  )

  const currentIdx = STATUSES.findIndex(s => s.id === order.status)
  const current = STATUSES[currentIdx] || STATUSES[0]

  const THEMES: Record<string, { pl: string; en: string }> = {
    techno_rave: { pl: 'Techno / Rave', en: 'Techno / Rave' },
    festival: { pl: 'Festiwal', en: 'Festival' },
    adventure: { pl: 'Adventure', en: 'Adventure' },
    custom: { pl: 'Custom', en: 'Custom' },
  }
  const TYPES: Record<string, { pl: string; en: string }> = {
    pvc: { pl: 'Karta PVC', en: 'PVC Card' },
    laminated: { pl: 'Karta Laminowana', en: 'Laminated Card' },
  }

  const createdSince = timeSince(order.created_at)
  const approvedSince = order.approved_at ? timeSince(order.approved_at) : null
  const shippedSince = order.shipped_at ? timeSince(order.shipped_at) : null

  return wrap(<>
    <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#b44dff', letterSpacing: '2px', margin: '0 0 12px' }}>// status zamówienia · order status</p>
    <h1 style={{ fontFamily: 'Space Mono', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
      Hej, {order.name.split(' ')[0]}! <span style={{ color: 'rgba(240,238,255,0.4)', fontSize: '18px' }}>· Hi, {order.name.split(' ')[0]}!</span>
    </h1>
    <p style={{ margin: '0 0 32px' }}>
      <span style={{ color: 'rgba(240,238,255,0.5)', fontSize: '14px' }}>Zamówienie złożone {createdSince.pl}</span>
      <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '13px' }}> · Order placed {createdSince.en}</span>
    </p>

    {/* AKTUALNY STATUS */}
    <div style={{ background: '#0e0e1a', border: `1px solid ${current.color}44`, borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{current.icon}</div>
      <p style={{ fontFamily: 'Space Mono', fontSize: '16px', fontWeight: 700, color: current.color, margin: '0 0 2px' }}>{current.labelPl}</p>
      <p style={{ fontFamily: 'Space Mono', fontSize: '13px', fontWeight: 600, color: `${current.color}bb`, margin: '0 0 10px' }}>{current.labelEn}</p>
      <p style={{ color: 'rgba(240,238,255,0.6)', fontSize: '14px', margin: '0 0 4px', lineHeight: '1.6' }}>{current.descPl}</p>
      <p style={{ color: 'rgba(240,238,255,0.35)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>{current.descEn}</p>
    </div>

    {/* OŚ CZASU STATUSÓW */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 16px' }}>// postęp zamówienia · order progress</p>
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
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: isCurrent ? 600 : 400, color: isDone ? '#f0eeff' : 'rgba(240,238,255,0.3)' }}>
                {s.labelPl} <span style={{ color: isDone ? 'rgba(240,238,255,0.4)' : 'rgba(240,238,255,0.2)', fontWeight: 400 }}>· {s.labelEn}</span>
              </p>
              {isCurrent && (
                <>
                  <p style={{ margin: '0 0 1px', fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>{s.descPl}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.3)' }}>{s.descEn}</p>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>

    {/* CZAS REALIZACJI */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 14px' }}>// czas realizacji · timeline</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'rgba(240,238,255,0.5)' }}>Zamówienie złożone <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '12px' }}>· Order placed</span></span>
          <span style={{ color: '#f0eeff' }}>{createdSince.pl}</span>
        </div>
        {approvedSince && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Projekt zaakceptowany <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '12px' }}>· Design approved</span></span>
            <span style={{ color: '#00e5a0' }}>{approvedSince.pl}</span>
          </div>
        )}
        {shippedSince && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Karta wysłana <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '12px' }}>· Card shipped</span></span>
            <span style={{ color: '#10b981' }}>{shippedSince.pl}</span>
          </div>
        )}
        {approvedSince && !shippedSince && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(240,238,255,0.5)' }}>Czas od akceptacji <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '12px' }}>· Time since approval</span></span>
            <span style={{ color: '#f97316' }}>{approvedSince.pl}</span>
          </div>
        )}
      </div>
    </div>

    {/* SZCZEGÓŁY */}
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'rgba(240,238,255,0.4)', letterSpacing: '2px', margin: '0 0 14px' }}>// szczegóły zamówienia · order details</p>
      {[
        { labelPl: 'Typ karty', labelEn: 'Card type', value: TYPES[order.card_type]?.pl || order.card_type, valueEn: TYPES[order.card_type]?.en || order.card_type },
        { labelPl: 'Motyw', labelEn: 'Theme', value: THEMES[order.theme]?.pl || order.theme, valueEn: THEMES[order.theme]?.en || order.theme },
        { labelPl: 'Ilość', labelEn: 'Quantity', value: `${order.quantity} szt.`, valueEn: `${order.quantity} pcs.` },
        { labelPl: 'Do zapłaty', labelEn: 'Total due', value: `${order.total_price} zł`, valueEn: `${order.total_price} zł` },
      ].map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
          <span style={{ color: 'rgba(240,238,255,0.5)' }}>{row.labelPl} <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: '12px' }}>· {row.labelEn}</span></span>
          <span style={{ color: '#f0eeff', fontWeight: 500, textAlign: 'right' }}>
            {row.value}
            {row.valueEn !== row.value && <span style={{ display: 'block', color: 'rgba(240,238,255,0.35)', fontSize: '11px', fontWeight: 400 }}>{row.valueEn}</span>}
          </span>
        </div>
      ))}
    </div>

    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,240,255,0.04)', borderRadius: '10px', border: '1px solid rgba(0,240,255,0.1)' }}>
      <p style={{ fontSize: '13px', color: 'rgba(240,238,255,0.6)', margin: '0 0 2px' }}>Masz pytania do zamówienia?</p>
      <p style={{ fontSize: '12px', color: 'rgba(240,238,255,0.35)', margin: '0 0 8px' }}>Questions about your order?</p>
      <a href="mailto:kontakt@raveadventure.pl" style={{ color: '#00f0ff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>kontakt@raveadventure.pl</a>
    </div>
  </>)
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(240,238,255,0.3)', fontFamily: 'sans-serif' }}>Ładowanie... · Loading...</p>
      </div>
    }>
      <StatusContent />
    </Suspense>
  )
}
