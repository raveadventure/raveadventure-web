'use client'
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { id: 'new',        label: 'Nowe',         color: '#f59e0b' },
  { id: 'in_project', label: 'W projekcie',   color: '#3b82f6' },
  { id: 'approval',   label: 'Do akceptacji', color: '#8b5cf6' },
  { id: 'production', label: 'Produkcja',      color: '#f97316' },
  { id: 'shipped',    label: 'Wysłane',        color: '#10b981' },
  { id: 'done',       label: 'Zakończone',     color: '#6b7280' },
]

const THEMES: Record<string, string> = {
  techno: 'Techno', rave: 'Rave', festival: 'Festival', travel: 'Adventure',
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
  design_url: string | null
  design_back_url: string | null
  review_notes: string | null
  approved_at: string | null
  shipped_at: string | null
  total_price: number | null
  paid: boolean
  status: string
  lang: string | null
}

function LangBadge({ lang, size = 'normal' }: { lang: string | null; size?: 'normal' | 'small' }) {
  if (lang !== 'en') return null
  const fontSize = size === 'small' ? '10px' : '11px'
  const padding = size === 'small' ? '1px 7px' : '2px 8px'
  return (
    <span style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.3)', padding, borderRadius: '4px', fontSize, fontWeight: 700, whiteSpace: 'nowrap' }}>
      🇬🇧 EN
    </span>
  )
}

function ClientMaterials({ order }: { order: Order }) {
  const [refFrontUrl, setRefFrontUrl] = React.useState<string | null>(null)
  const [refBackUrl, setRefBackUrl] = React.useState<string | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  React.useEffect(() => {
    supabase.storage.from('order-photos').list('', { search: order.id })
      .then(({ data }) => {
        if (!data) return
        const front = data.find(f => f.name.includes(order.id + '-custom'))
        const back = data.find(f => f.name.includes(order.id + '-ref-back'))
        if (front) setRefFrontUrl(`${supabaseUrl}/storage/v1/object/public/order-photos/${front.name}`)
        if (back) setRefBackUrl(`${supabaseUrl}/storage/v1/object/public/order-photos/${back.name}`)
      })
  }, [order.id])

  const backOption = (order as any).back_option || 'logo'
  const theme = (order as any).theme || ''
  const isCustomFront = theme === 'custom'
  const notesBack = (order as any).card_text || (order as any).notes_back || ''
  const notesFront = (order as any).notes || ''

  const THEME_LABELS: Record<string, string> = {
    techno_rave: 'Techno / Rave',
    festival: 'Festiwal',
    adventure: 'Adventure',
    custom: 'Custom',
  }

  const BackPlaceholder = ({ icon, title, value }: { icon: string; title: string; value?: string }) => (
    <div style={{ width: '100%', aspectRatio: '0.75', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', boxSizing: 'border-box' }}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'rgba(240,238,255,0.5)', textAlign: 'center', letterSpacing: '1px' }}>{title}</p>
      {value && <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.4)', textAlign: 'center', lineHeight: '1.5', wordBreak: 'break-word' }}>{value}</p>}
    </div>
  )

  return (
    <div style={{ marginBottom: '16px' }}>

      {/* NAGŁÓWEK — styl karty */}
      <div style={{ marginBottom: '12px', padding: '10px 14px', background: isCustomFront ? 'rgba(245,158,11,0.06)' : 'rgba(180,77,255,0.06)', border: `1px solid ${isCustomFront ? 'rgba(245,158,11,0.25)' : 'rgba(180,77,255,0.2)'}`, borderRadius: '8px' }}>
        <p style={{ margin: '0 0 2px', fontSize: '10px', color: isCustomFront ? '#f59e0b' : '#b44dff', letterSpacing: '2px', fontWeight: 700 }}>
          STYL KARTY: {THEME_LABELS[theme] || theme.toUpperCase()}
        </p>

        {isCustomFront && (
          <>
            {(order as any).custom_desc && (
              <p style={{ margin: '6px 0 6px', fontSize: '12px', color: '#f0eeff', lineHeight: '1.6' }}>{(order as any).custom_desc}</p>
            )}
            {refFrontUrl
              ? <a href={refFrontUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
                  🖼 Podgląd grafiki referencyjnej →
                </a>
              : <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.3)' }}>Brak grafiki referencyjnej</p>
            }
          </>
        )}
      </div>

      {/* SIATKA: FRONT | BACK */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

        <div>
          <p style={{ margin: '0 0 5px', fontSize: '10px', color: '#b44dff', letterSpacing: '1px', fontWeight: 600 }}>FRONT</p>
          {order.photo_url ? (
            <>
              <img src={order.photo_url} alt="Front" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(180,77,255,0.3)', display: 'block' }} />
              <a href={order.photo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '10px', color: '#b44dff', textDecoration: 'none', marginTop: '3px', textAlign: 'center' }}>pełne zdjęcie →</a>
            </>
          ) : (
            <div style={{ width: '100%', aspectRatio: '0.75', borderRadius: '8px', border: '1px dashed rgba(180,77,255,0.2)', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.2)' }}>brak zdjęcia</p>
            </div>
          )}
          {notesFront && (
            <div style={{ marginTop: '6px', padding: '7px 10px', background: 'rgba(180,77,255,0.06)', borderRadius: '6px', borderLeft: '2px solid rgba(180,77,255,0.4)' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.7)', lineHeight: '1.5' }}>{notesFront}</p>
            </div>
          )}
        </div>

        <div>
          <p style={{ margin: '0 0 5px', fontSize: '10px', color: '#00f0ff', letterSpacing: '1px', fontWeight: 600 }}>
            TYŁ — {backOption === 'logo' ? 'STANDARD' : backOption === 'dedication' ? 'DEDYKACJA' : backOption === 'qr' ? 'QR CODE' : 'CUSTOM ARTWORK'}
          </p>

          {backOption === 'logo' && <BackPlaceholder icon="🎴" title="Logo RaveAdventure" />}
          {backOption === 'dedication' && <BackPlaceholder icon="📝" title="Dedykacja" />}
          {backOption === 'qr' && <BackPlaceholder icon="⬛" title="QR Code" />}
          {backOption === 'custom_back' && (
            refBackUrl ? (
              <>
                <img src={refBackUrl} alt="Back" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', display: 'block' }} />
                <a href={refBackUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '10px', color: '#00f0ff', textDecoration: 'none', marginTop: '3px', textAlign: 'center' }}>pełne zdjęcie →</a>
              </>
            ) : (
              <BackPlaceholder icon="🖼" title="Custom Artwork" value="brak zdjęcia" />
            )
          )}

          {notesBack && (
            <div style={{ marginTop: '6px', padding: '7px 10px', background: 'rgba(0,240,255,0.05)', borderRadius: '6px', borderLeft: '2px solid rgba(0,240,255,0.3)' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.7)', lineHeight: '1.5' }}>{notesBack}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [designPreview, setDesignPreview] = useState<string | null>(null)
  const [designFileBack, setDesignFileBack] = useState<File | null>(null)
  const [designPreviewBack, setDesignPreviewBack] = useState<string | null>(null)
  const [designNote, setDesignNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileBackRef = useRef<HTMLInputElement>(null)

  const deleteOrder = async (id: string) => {
    const filesToDelete: string[] = []
    const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'pdf']

    exts.forEach(ext => filesToDelete.push(`${id}-front.${ext}`))
    exts.forEach(ext => filesToDelete.push(`${id}-custom.${ext}`))
    exts.forEach(ext => filesToDelete.push(`${id}-ref-back.${ext}`))

    const { data: designFiles } = await supabase.storage
      .from('order-photos')
      .list('designs')
    if (designFiles) {
      designFiles
        .filter(f => f.name.startsWith(id))
        .forEach(f => filesToDelete.push(`designs/${f.name}`))
    }

    const unique = filesToDelete.filter((v, i, a) => a.indexOf(v) === i)
    if (unique.length > 0) {
      await supabase.storage.from('order-photos').remove(unique)
    }

    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setDesignFile(null)
        setDesignPreview(null)
        setDesignFileBack(null)
        setDesignPreviewBack(null)
        setDesignNote('')
        setSendMsg(null)
      }
    }
    setConfirmDelete(null)
  }

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error && data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const updates: Record<string, unknown> = { status }
    if (status === 'production') updates.approved_at = new Date().toISOString()
    if (status === 'shipped') updates.shipped_at = new Date().toISOString()
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    }
    setUpdating(null)
  }

  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from('orders').update({ paid: !paid }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paid: !paid } : o))
    setSelected(prev => prev?.id === id ? { ...prev, paid: !paid } : prev)
  }

  const handleDesignFile = (file: File) => {
    setDesignFile(file)
    const reader = new FileReader()
    reader.onload = e => setDesignPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setSendMsg(null)
  }

  const handleDesignFileBack = (file: File) => {
    setDesignFileBack(file)
    const reader = new FileReader()
    reader.onload = e => setDesignPreviewBack(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSendDesign = async () => {
    if (!selected || !designFile) return
    setSending(true)
    setSendMsg(null)
    try {
      const fd = new FormData()
      fd.append('orderId', selected.id)
      fd.append('design', designFile)
      fd.append('note', designNote)
      if (designFileBack) fd.append('designBack', designFileBack)
      const res = await fetch('/api/send-design', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setSendMsg({ type: 'ok', text: 'Projekt wysłany do klienta! Status zmieniony na "Do akceptacji".' })
        setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status: 'approval', design_url: data.designUrl, design_back_url: data.designBackUrl || null } : o))
        setSelected(prev => prev ? { ...prev, status: 'approval', design_url: data.designUrl, design_back_url: data.designBackUrl || null } : null)
        setDesignFile(null)
        setDesignPreview(null)
        setDesignFileBack(null)
        setDesignPreviewBack(null)
        setDesignNote('')
      } else {
        setSendMsg({ type: 'err', text: data.error || 'Błąd wysyłki.' })
      }
    } catch {
      setSendMsg({ type: 'err', text: 'Błąd połączenia.' })
    }
    setSending(false)
  }

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search.trim() || o.id.toLowerCase().startsWith(search.trim().toLowerCase()))
  const statusObj = (id: string) => STATUSES.find(s => s.id === id) || STATUSES[0]
  const formatDate = (d: string) => new Date(d).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (mins > 0) return `${mins}m`
    return 'teraz'
  }
  const counts = STATUSES.reduce((acc, s) => { acc[s.id] = orders.filter(o => o.status === s.id).length; return acc }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eeff', fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: '#0e0e1a', borderBottom: '1px solid rgba(180,77,255,0.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ fontSize: '18px', fontWeight: 700, color: '#f0eeff', textDecoration: 'none' }}>Rave<span style={{ color: '#b44dff' }}>Adventure</span></a>
          <span style={{ fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(240,238,255,0.4)' }}>{orders.length} zamówień</span>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj po ID..."
              style={{ background: '#16162a', border: `1px solid ${search ? '#b44dff' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', color: '#f0eeff', padding: '5px 30px 5px 10px', fontSize: '13px', fontFamily: 'monospace', width: '180px', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(240,238,255,0.4)', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>✕</button>
            )}
          </div>
          <a href="/admin/portfolio" style={{ background: 'rgba(180,77,255,0.15)', border: '1px solid rgba(180,77,255,0.3)', color: '#b44dff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none' }}>Portfolio</a>
          <button onClick={fetchOrders} style={{ background: 'rgba(180,77,255,0.15)', border: '1px solid rgba(180,77,255,0.3)', color: '#b44dff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>↻ Odśwież</button>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '2fr 1fr' : '1fr', minHeight: 'calc(100vh - 57px)' }}>

        {/* LEWA KOLUMNA */}
        <div style={{ padding: '24px' }}>
          {/* STATYSTYKI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            <div onClick={() => setFilter('all')} style={{ background: filter === 'all' ? 'rgba(180,77,255,0.15)' : '#0e0e1a', border: `1px solid ${filter === 'all' ? '#b44dff' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}>
              <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#f0eeff' }}>{orders.length}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>Wszystkie</p>
            </div>
            {STATUSES.map(s => (
              <div key={s.id} onClick={() => setFilter(filter === s.id ? 'all' : s.id)} style={{ background: filter === s.id ? `${s.color}22` : '#0e0e1a', border: `1px solid ${filter === s.id ? s.color : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer' }}>
                <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: s.color }}>{counts[s.id] || 0}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* LISTA */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(240,238,255,0.3)' }}>Ładowanie...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(240,238,255,0.3)' }}>Brak zamówień</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(order => {
                const st = statusObj(order.status)
                const isSelected = selected?.id === order.id
                return (
                  <div key={order.id} onClick={() => setSelected(isSelected ? null : order)}
                    style={{ background: isSelected ? '#16162a' : '#0e0e1a', border: `1px solid ${isSelected ? '#b44dff' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {order.photo_url
                      ? <img src={order.photo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '42px', height: '42px', borderRadius: '7px', background: '#16162a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎴</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: '#f0eeff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {order.name}
                        <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(240,238,255,0.3)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</span>
                        <LangBadge lang={order.lang} size="small" />
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.4)' }}>
                        {THEMES[order.theme] || order.theme} · {formatDate(order.created_at)}
                        <span style={{ color: '#f59e0b', marginLeft: '6px' }}>⏱ {timeSince(order.created_at)} od złożenia</span>
                        {order.approved_at && (
                          <span style={{ color: '#f97316', marginLeft: '8px' }}>🔧 {timeSince(order.approved_at)} od produkcji</span>
                        )}
                      </p>
                    </div>
                    {order.review_notes && (
                      <span title={order.review_notes} style={{ fontSize: '16px' }}>💬</span>
                    )}
                    <span style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      {STATUSES.map(s => (
                        <button key={s.id} onClick={() => updateStatus(order.id, s.id)} disabled={order.status === s.id || updating === order.id}
                          style={{ background: order.status === s.id ? `${s.color}33` : 'transparent', border: `1px solid ${order.status === s.id ? s.color : 'rgba(255,255,255,0.1)'}`, color: order.status === s.id ? s.color : 'rgba(240,238,255,0.4)', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: order.status === s.id ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                          {s.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setConfirmDelete(order.id)}
                        style={{ background: 'transparent', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', padding: '3px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', marginLeft: '4px' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PANEL SZCZEGÓŁÓW */}
        {selected && (
          <div style={{ background: '#0e0e1a', borderLeft: '1px solid rgba(180,77,255,0.2)', padding: '24px', position: 'sticky', top: '57px', height: 'calc(100vh - 57px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#b44dff', fontFamily: 'Space Mono', letterSpacing: '2px' }}>// szczegóły</p>
              <button onClick={() => { setSelected(null); setDesignFile(null); setDesignPreview(null); setSendMsg(null) }} style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Znacznik języka zamówienia — widoczny na górze */}
            {selected.lang === 'en' && (
              <div style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LangBadge lang={selected.lang} />
                <p style={{ margin: 0, fontSize: '12px', color: '#00f0ff' }}>Zamówienie złożone w wersji angielskiej — wyślij projekt i wiadomości po angielsku.</p>
              </div>
            )}

            {/* Uwagi klienta (jeśli są) */}
            {selected.review_notes && (
              <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#ff4d6d', fontWeight: 600 }}>💬 Uwagi klienta do projektu</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#f0eeff', lineHeight: '1.6' }}>{selected.review_notes}</p>
              </div>
            )}

            {/* MATERIAŁY KLIENTA */}
            <ClientMaterials order={selected} />

            {/* WYSŁANY PROJEKT */}
            {selected.design_url && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(240,238,255,0.4)', letterSpacing: '1px' }}>WYSŁANY PROJEKT</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#b44dff', letterSpacing: '1px' }}>PRZÓD</p>
                    <img src={selected.design_url} alt="Przód" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(180,77,255,0.3)' }} />
                    <a href={selected.design_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#b44dff', textDecoration: 'none', marginTop: '4px', textAlign: 'center' }}>pełne zdjęcie →</a>
                  </div>
                  {selected.design_back_url ? (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#00f0ff', letterSpacing: '1px' }}>TYŁ</p>
                      <img src={selected.design_back_url} alt="Tył" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)' }} />
                      <a href={selected.design_back_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#00f0ff', textDecoration: 'none', marginTop: '4px', textAlign: 'center' }}>pełne zdjęcie →</a>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'rgba(240,238,255,0.3)', letterSpacing: '1px' }}>TYŁ — nie wysłano</p>
                      <div style={{ width: '100%', aspectRatio: '0.7', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)', background: '#0d0d1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: '24px', opacity: 0.3 }}>🎴</span>
                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(240,238,255,0.2)', textAlign: 'center' }}>brak projektu tyłu</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UPLOAD I WYŚLIJ PROJEKT */}
            <div style={{ background: '#16162a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#f0eeff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selected.design_url ? '🔄 Wyślij poprawiony projekt' : '📤 Wyślij projekt do zatwierdzenia'}
                <LangBadge lang={selected.lang} size="small" />
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: `1.5px dashed ${designPreview ? '#00e5a0' : 'rgba(180,77,255,0.3)'}`, borderRadius: '8px', padding: designPreview ? '8px' : '24px 16px', textAlign: 'center', cursor: 'pointer', background: designPreview ? 'rgba(0,229,160,0.05)' : 'transparent', marginBottom: '12px' }}
              >
                {designPreview
                  ? <img src={designPreview} alt="Podgląd projektu" style={{ width: '100%', borderRadius: '6px', maxHeight: '140px', objectFit: 'contain' }} />
                  : <>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'rgba(240,238,255,0.6)' }}>Kliknij aby wybrać grafikę</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,238,255,0.3)' }}>JPG, PNG · projekt karty</p>
                  </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleDesignFile(e.target.files[0]) }} />

              {/* TYŁ KARTY — zawsze dostępny */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(240,238,255,0.5)' }}>
                  Tył karty — {(selected as any).back_option === 'logo' ? 'Standard Logo' : (selected as any).back_option === 'dedication' ? 'Dedykacja' : (selected as any).back_option === 'custom_back' ? 'Custom Artwork' : (selected as any).back_option === 'qr' ? 'QR Code' : 'tył'}
                </p>
                  <div
                    onClick={() => fileBackRef.current?.click()}
                    style={{ border: `1.5px dashed ${designPreviewBack ? '#00f0ff' : 'rgba(0,240,255,0.2)'}`, borderRadius: '8px', padding: designPreviewBack ? '8px' : '16px', textAlign: 'center', cursor: 'pointer', background: designPreviewBack ? 'rgba(0,240,255,0.05)' : 'transparent' }}
                  >
                    {designPreviewBack
                      ? <img src={designPreviewBack} alt="Tył karty" style={{ width: '100%', borderRadius: '6px', maxHeight: '120px', objectFit: 'contain' }} />
                      : <>
                        <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'rgba(240,238,255,0.5)' }}>Kliknij aby wybrać tył karty</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.3)' }}>opcjonalnie — jeśli tył jest osobnym projektem</p>
                      </>
                    }
                  </div>
                  <input ref={fileBackRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleDesignFileBack(e.target.files[0]) }} />
                  {designPreviewBack && (
                    <button onClick={() => { setDesignFileBack(null); setDesignPreviewBack(null) }}
                      style={{ marginTop: '6px', background: 'transparent', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Usuń tył
                    </button>
                  )}
                </div>

              {selected.lang === 'en' && (
                <div style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#00f0ff' }}>💡 Wiadomość poniżej trafi do klienta EN — pisz po angielsku. Reszta maila (przyciski, teksty) jest już przetłumaczona automatycznie.</p>
                </div>
              )}
              <textarea
                value={designNote}
                onChange={e => setDesignNote(e.target.value)}
                placeholder={selected.lang === 'en' ? 'Optional message to the client — questions, notes, extra info request...' : 'Opcjonalna wiadomość do klienta — pytania, wskazówki, prośby o dodatkowe info...'}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0e0e1a', border: '1px solid rgba(180,77,255,0.2)', borderRadius: '8px', color: '#f0eeff', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px', outline: 'none', marginBottom: '10px' }}
              />
              <button
                onClick={handleSendDesign}
                disabled={!designFile || sending}
                style={{ width: '100%', background: designFile ? '#b44dff' : 'rgba(180,77,255,0.2)', color: designFile ? '#0a0014' : 'rgba(240,238,255,0.3)', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: designFile ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
              >
                {sending ? 'Wysyłam...' : '✉ Wyślij projekt do klienta'}
              </button>
              {sendMsg && (
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: sendMsg.type === 'ok' ? '#00e5a0' : '#ff4d6d', textAlign: 'center' }}>{sendMsg.text}</p>
              )}
            </div>

            {/* Zmiana statusu */}
            <div style={{ background: '#16162a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(240,238,255,0.4)' }}>Zmień status ręcznie</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {STATUSES.map(s => (
                  <button key={s.id} onClick={() => updateStatus(selected.id, s.id)} disabled={selected.status === s.id || updating === selected.id}
                    style={{ background: selected.status === s.id ? `${s.color}22` : 'transparent', border: `1px solid ${selected.status === s.id ? s.color : 'rgba(255,255,255,0.1)'}`, color: selected.status === s.id ? s.color : 'rgba(240,238,255,0.6)', padding: '8px 14px', borderRadius: '7px', fontSize: '13px', cursor: selected.status === s.id ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', fontWeight: selected.status === s.id ? 600 : 400 }}>
                    {selected.status === s.id ? '● ' : '○ '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kwota i płatność */}
            <div style={{ background: selected.paid ? 'rgba(0,229,160,0.08)' : 'rgba(245,158,11,0.06)', border: `1px solid ${selected.paid ? 'rgba(0,229,160,0.3)' : 'rgba(245,158,11,0.25)'}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(240,238,255,0.4)', letterSpacing: '1px' }}>DO ZAPŁATY</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: selected.paid ? '#00e5a0' : '#f59e0b', fontFamily: 'Space Mono, monospace' }}>
                  {selected.total_price ? `${selected.total_price} zł` : '— zł'}
                </p>
              </div>
              <button
                onClick={() => togglePaid(selected.id, selected.paid)}
                style={{ background: selected.paid ? 'rgba(0,229,160,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${selected.paid ? 'rgba(0,229,160,0.4)' : 'rgba(245,158,11,0.4)'}`, color: selected.paid ? '#00e5a0' : '#f59e0b', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                {selected.paid ? '✓ Opłacone' : 'Oznacz jako opłacone'}
              </button>
            </div>

            {/* Dane klienta */}
            <div style={{ background: '#16162a', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' }}>
              {[
                { label: 'ID', value: selected.id },
                { label: 'Data', value: formatDate(selected.created_at) },
                { label: 'Motyw', value: THEMES[selected.theme] || selected.theme },
                { label: 'Język', value: selected.lang === 'en' ? '🇬🇧 English' : '🇵🇱 Polski' },
                { label: 'Klient', value: selected.name },
                { label: 'Email', value: selected.email, link: `mailto:${selected.email}` },
                { label: 'Telefon', value: selected.phone || '—' },
                { label: 'Adres', value: selected.address },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(240,238,255,0.4)', minWidth: '55px', flexShrink: 0 }}>{row.label}</span>
                  {row.link
                    ? <a href={row.link} style={{ fontSize: '13px', color: '#00f0ff', textDecoration: 'none', wordBreak: 'break-all' }}>{row.value}</a>
                    : <span style={{ fontSize: '12px', color: '#f0eeff', wordBreak: 'break-all', fontFamily: row.label === 'ID' ? 'monospace' : 'inherit' }}>{row.value}</span>
                  }
                </div>
              ))}
            </div>

            {/* Atrybuty karty */}
            <div style={{ background: '#16162a', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' }}>
              <p style={{ margin: 0, padding: '10px 16px 6px', fontSize: '10px', color: '#b44dff', letterSpacing: '2px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ATRYBUTY KARTY</p>
              {[
                { label: '① Rok', value: (selected as any).card_year || '—' },
                { label: '② Rzadkość', value: (selected as any).card_rarity || '—' },
                { label: '③ Nazwa', value: (selected as any).card_name_custom || '—' },
                { label: '④ Atrybut 1', value: [(selected as any).attr1_label, (selected as any).attr1_value].filter(Boolean).join(' — ') || '—' },
                { label: '⑤ Umiejętność', value: (selected as any).card_skill || '—' },
                { label: '⑥ Atrybut 2', value: [(selected as any).attr2_label, (selected as any).attr2_value].filter(Boolean).join(' — ') || '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(240,238,255,0.4)', minWidth: '90px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: row.value === '—' ? 'rgba(240,238,255,0.2)' : '#f0eeff', wordBreak: 'break-word' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* MODAL POTWIERDZENIA USUNIĘCIA */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,77,109,0.4)', borderRadius: '14px', padding: '32px 28px', maxWidth: '400px', width: '100%', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '22px' }}>🗑</div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: '#f0eeff', margin: '0 0 10px' }}>Usunąć zlecenie?</p>
            <p style={{ fontSize: '14px', color: 'rgba(240,238,255,0.5)', margin: '0 0 8px', lineHeight: '1.6' }}>
              To działanie jest <strong style={{ color: '#ff4d6d' }}>nieodwracalne</strong>.<br />
              Zlecenie zostanie trwale usunięte z bazy danych.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(240,238,255,0.3)', margin: '0 0 24px', fontFamily: 'monospace' }}>
              {orders.find(o => o.id === confirmDelete)?.name} — {orders.find(o => o.id === confirmDelete)?.email}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(240,238,255,0.6)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Anuluj
              </button>
              <button
                onClick={() => deleteOrder(confirmDelete)}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#ff4d6d', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Tak, usuń trwale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
