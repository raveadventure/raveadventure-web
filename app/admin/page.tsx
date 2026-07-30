'use client'
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { isSupabasePlaceholder, mockListOrders, mockUpdateOrder, mockDeleteOrder } from '../../lib/ordersLocalMock'

const STATUSES = [
  { id: 'new',        label: 'Nowe',         color: '#f59e0b' },
  { id: 'in_project', label: 'W projekcie',   color: '#3b82f6' },
  { id: 'approval',   label: 'Do akceptacji', color: '#8b5cf6' },
  { id: 'awaiting_payment', label: 'Do opłacenia', color: '#ec4899' },
  { id: 'production', label: 'Produkcja',      color: '#f97316' },
  { id: 'shipped',    label: 'Wysłane',        color: '#10b981' },
  { id: 'done',       label: 'Zakończone',     color: '#6b7280' },
]

const THEMES: Record<string, string> = {
  techno: 'Techno', rave: 'Rave', festival: 'Festival', travel: 'Adventure',
}

// ── ARCHIWIZACJA ZDJĘĆ ZAKOŃCZONYCH ZAMÓWIEŃ ──────────────────────────────
// Gdy zamówienie trafia do statusu "done", przenosimy jego pliki w Storage do
// folderu closed-orders/, żeby dało się je później zbiorczo ściągnąć na dysk
// i skasować z Supabase (limit 5GB na Free Planie — patrz Lekcja #5 w CLAUDE.md).
const STORAGE_BUCKET = 'order-photos'
const ARCHIVE_PREFIX = 'closed-orders/'
const ARCHIVABLE_URL_FIELDS = [
  'photo_url', 'design_url', 'design_url_2', 'design_back_url',
  'design_original_url', 'design_original_url_2', 'design_back_original_url',
] as const

function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length)
  // ?v=... na końcu to tylko cache-busting doklejany przy wyświetlaniu (patrz admin/page.tsx
  // przy zapisie design_url) — nie jest częścią prawdziwej ścieżki pliku w Storage.
  const queryIdx = path.indexOf('?')
  return queryIdx === -1 ? path : path.slice(0, queryIdx)
}

// Ta sama lista co FRAME_COLORS w app/page.tsx (duplikacja świadoma — admin już trzyma własne,
// niezależne słowniki etykiet, np. THEMES powyżej, więc to zgodne z ustaloną konwencją).
const FRAME_COLORS: Record<string, { name: string; hex: string }> = {
  neon_orange: { name: 'Neon Orange', hex: '#ff8a1f' },
  dark_orange: { name: 'Dark Orange', hex: '#b35900' },
  neon_blue: { name: 'Neon Blue', hex: '#22aaff' },
  dark_blue: { name: 'Dark Blue', hex: '#1b5e94' },
  neon_purple: { name: 'Neon Purple', hex: '#b44dff' },
  dark_purple: { name: 'Dark Purple', hex: '#6b2fa3' },
  yellow_neon_blue_sky: { name: 'Yellow Neon + Blue Sky', hex: '#ffd60a' },
  dark_green: { name: 'Dark Green', hex: '#1f7a3d' },
  neon_green: { name: 'Neon Green', hex: '#39ff6a' },
  dark_red: { name: 'Dark Red', hex: '#8f1f1f' },
  neon_red: { name: 'Neon Red', hex: '#ff2b4d' },
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
  design_url_2: string | null
  design_back_url: string | null
  design_original_url: string | null
  design_original_url_2: string | null
  design_back_original_url: string | null
  approved_design_option: number | null
  review_notes: string | null
  approved_at: string | null
  shipped_at: string | null
  total_price: number | null
  paid: boolean
  status: string
  lang: string | null
}

// Nakłada powtarzalny, ukośny znak wodny na canvas — projekt wysyłany klientowi do akceptacji
// nie może być swobodnie pobrany i użyty (np. jako wzór dla AI) przed opłaceniem zamówienia.
// Oryginał w pełnej rozdzielczości (design_original_url) zostaje bez znaku wodnego — to on
// trafia do druku po zatwierdzeniu i opłaceniu, znak wodny dotyczy tylko podglądu.
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.font = `800 ${Math.max(22, Math.round(width / 12))}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1.5
  ctx.textBaseline = 'middle'
  const text = 'RAVEADVENTURE • PODGLĄD'
  const stepX = ctx.measureText(text).width + 50
  const stepY = Math.max(90, Math.round(height / 6))
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 7)
  ctx.translate(-width, -height)
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      ctx.fillText(text, x, y)
      ctx.strokeText(text, x, y)
    }
  }
  ctx.restore()
}

// Kompresuje obraz w przeglądarce przed uploadem (canvas) — zwraca lżejszy Blob JPG.
// Oryginalny plik wybrany przez użytkownika pozostaje nietknięty. `watermark: true` nakłada
// znak wodny na wynikowy podgląd (patrz drawWatermark) — używane dla wszystkiego, co trafia
// do klienta przed opłaceniem (mail z projektem do akceptacji).
async function compressImage(file: File, maxWidth = 1200, quality = 0.82, watermark = false): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
  const scale = Math.min(1, maxWidth / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  if (watermark) drawWatermark(ctx, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Kompresja nie powiodła się')), 'image/jpeg', quality)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Obraz "na kliknięcie" — nic nie pobiera się automatycznie, dopóki admin sam nie kliknie.
function LazyImage({ src, alt, style, label }: { src: string; alt: string; style?: React.CSSProperties; label?: string }) {
  const [show, setShow] = useState(false)
  if (show) {
    return <img src={src} alt={alt} style={style} />
  }
  return (
    <div
      onClick={e => { e.stopPropagation(); setShow(true) }} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setShow(true) } }}
      style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#0d0d1a', cursor: 'pointer' }}
      title="Kliknij, aby wczytać obraz"
    >
      <span style={{ fontSize: '20px', opacity: 0.6 }}>🖼</span>
      {label && <span style={{ fontSize: '9px', color: 'rgba(240,238,255,0.4)', textAlign: 'center', padding: '0 4px' }}>{label}</span>}
    </div>
  )
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
    if (isSupabasePlaceholder()) {
      // Lokalny mock nie ma prawdziwego Storage — grafiki referencyjne trafiają wprost jako data URL
      // na pola ref_front_url/ref_back_url zamówienia (patrz app/page.tsx, zapis przy tworzeniu zamówienia).
      if ((order as any).ref_front_url) setRefFrontUrl((order as any).ref_front_url)
      if ((order as any).ref_back_url) setRefBackUrl((order as any).ref_back_url)
      return
    }
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
  const cardType = (order as any).card_type || 'pvc'
  const nfcEnabled = !!(order as any).nfc_enabled
  const nfcPrice = (order as any).nfc_price || 0
  const cardFinish = (order as any).card_finish || 'standard'

  const CARD_FINISH_LABELS: Record<string, string> = {
    magnes: '🧲 Magnes (wersja na lodówkę)',
    top_holder: '🛡 Top Holder',
    top_holder_magnes: '🛡🧲 Top Holder + Magnes',
    top_holder_stojak: '🛡📐 Top Holder + Stojak',
    zestaw_promocyjny: '🎁 Zestaw Promocyjny (2 karty + Top Holder + stojak + naklejka magnetyczna)',
  }

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

        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(240,238,255,0.7)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>
            Typ karty: <strong style={{ color: '#f0eeff' }}>{cardType === 'laminated' ? 'Wizytówka (100 szt.)' : 'PVC'}</strong>
          </span>
          {nfcEnabled ? (
            <span style={{ color: '#00e5a0', fontWeight: 700 }}>
              📲 NFC/RFID — do zaprogramowania{nfcPrice ? ` (+${nfcPrice} zł)` : ''}
            </span>
          ) : (
            <span style={{ color: 'rgba(240,238,255,0.3)' }}>bez NFC</span>
          )}
          {cardFinish !== 'standard' && CARD_FINISH_LABELS[cardFinish] && (
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{CARD_FINISH_LABELS[cardFinish]}</span>
          )}
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
              <LazyImage src={order.photo_url} alt="Front" style={{ width: '100%', aspectRatio: '0.75', borderRadius: '8px', border: '1px solid rgba(180,77,255,0.3)', display: 'block' }} label="Kliknij, aby wczytać" />
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
            TYŁ — {backOption === 'logo' ? 'STANDARD' : backOption === 'blank' ? 'PUSTA KARTA' : backOption === 'dedication' ? 'DEDYKACJA' : backOption === 'qr' ? 'QR CODE' : 'CUSTOM ARTWORK'}
          </p>

          {backOption === 'logo' && <BackPlaceholder icon="🎴" title="Logo RaveAdventure" />}
          {backOption === 'blank' && <BackPlaceholder icon="⬜" title="Pusta biała karta" />}
          {backOption === 'dedication' && <BackPlaceholder icon="📝" title="Dedykacja" />}
          {backOption === 'qr' && <BackPlaceholder icon="⬛" title="QR Code" />}
          {backOption === 'custom_back' && (
            refBackUrl ? (
              <>
                <LazyImage src={refBackUrl} alt="Back" style={{ width: '100%', aspectRatio: '0.75', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', display: 'block' }} label="Kliknij, aby wczytać" />
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
  const [visitCount, setVisitCount] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [designPreview, setDesignPreview] = useState<string | null>(null)
  const [designFile2, setDesignFile2] = useState<File | null>(null)
  const [designPreview2, setDesignPreview2] = useState<string | null>(null)
  const [designFileBack, setDesignFileBack] = useState<File | null>(null)
  const [designPreviewBack, setDesignPreviewBack] = useState<string | null>(null)
  const [designNote, setDesignNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileRef2 = useRef<HTMLInputElement>(null)
  const fileBackRef = useRef<HTMLInputElement>(null)

  // Zrzut danych zlecenia do pliku .txt — Michał trzyma to otwarte obok Pixlra zamiast
  // przełączać się z powrotem do panelu za każdym razem, gdy potrzebuje sprawdzić atrybut.
  const exportOrderAsText = (order: Order) => {
    const o = order as any
    // THEMES (wyżej w pliku) nie pokrywa się z realnymi wartościami theme (techno_rave/festival/
    // adventure/custom) — osobna mapa tylko na potrzeby eksportu, żeby nie pokazywać surowego id.
    const THEME_EXPORT_LABELS: Record<string, string> = {
      techno_rave: 'Techno / Rave', festival: 'Festiwal', adventure: 'Adventure', custom: 'Custom',
    }
    const backLabel = o.back_option === 'logo' ? 'Standard Logo'
      : o.back_option === 'dedication' ? 'Dedykacja'
      : o.back_option === 'custom_back' ? 'Custom Artwork'
      : o.back_option === 'qr' ? 'QR Code' : (o.back_option || '—')
    const frameLabel = FRAME_COLORS[o.frame_color]?.name || o.frame_color || '—'
    const finishLabels: Record<string, string> = {
      magnes: 'Magnes (wersja na lodówkę)',
      top_holder: 'Top Holder',
      top_holder_magnes: 'Top Holder + Magnes',
      top_holder_stojak: 'Top Holder + Stojak',
      zestaw_promocyjny: 'Zestaw Promocyjny (2 karty + Top Holder + stojak + naklejka magnetyczna)',
    }
    const finishLabel = finishLabels[o.card_finish] || 'Standard (brak)'

    const lines = [
      `ZLECENIE #${order.id.slice(0, 8).toUpperCase()}`,
      `Data: ${formatDate(order.created_at)}`,
      `Klient: ${order.name} (${order.email})`,
      '',
      '--- KARTA ---',
      `Typ: ${o.card_type === 'laminated' ? 'Wizytówka (100 szt.)' : 'PVC'}`,
      `Motyw: ${THEME_EXPORT_LABELS[order.theme] || order.theme}`,
      `Tył: ${backLabel}`,
      `Ilość: ${o.quantity ?? '—'}`,
      `NFC/RFID: ${o.nfc_enabled ? `Tak (+${o.nfc_price || 0} zł)` : 'Nie'}`,
      `Wykończenie: ${finishLabel}`,
      '',
      '--- ATRYBUTY KARTY ---',
      `① Lewy nagłówek: ${o.card_year || '—'}`,
      `② Prawy nagłówek: ${o.card_rarity || '—'}`,
      `③ Nazwa: ${o.card_name_custom || '—'}`,
      `④ Atrybut 1: ${[o.attr1_label, o.attr1_value].filter(Boolean).join(' — ') || '—'}`,
      `⑤ Umiejętność: ${o.card_skill || '—'}`,
      `⑥ Atrybut 2: ${[o.attr2_label, o.attr2_value].filter(Boolean).join(' — ') || '—'}`,
      `⑦ Napis w ramce: ${o.card_bottom_text || '—'}`,
      `⑧ Kolor ramki: ${frameLabel}`,
      `⑨ Efekt holo: ${o.holo_effect ? 'Tak' : 'Nie'}`,
    ]

    if (o.custom_desc) lines.push('', '--- OPIS (CUSTOM) ---', o.custom_desc)
    if (o.qr_link) lines.push('', '--- QR LINK ---', o.qr_link)
    if (order.notes) lines.push('', '--- UWAGI (PRZÓD) ---', order.notes)
    const backNotes = order.card_text || o.notes_back
    if (backNotes) lines.push('', '--- UWAGI / DEDYKACJA (TYŁ) ---', backNotes)
    if (order.review_notes) lines.push('', '--- UWAGI Z KOREKTY PROJEKTU ---', order.review_notes)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zlecenie-${order.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const deleteOrder = async (id: string) => {
    // Kasuje też zapisane podglądy maili (/dev-emails) powiązane z tym zleceniem — bezpieczne
    // do wywołania zawsze (endpoint zwraca 404 na produkcji i po prostu nic nie robi).
    fetch(`/api/dev-emails?orderId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
    if (isSupabasePlaceholder()) {
      await mockDeleteOrder(id)
      setOrders(prev => prev.filter(o => o.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setDesignFile(null)
        setDesignPreview(null)
        setDesignFile2(null)
        setDesignPreview2(null)
        setDesignFileBack(null)
        setDesignPreviewBack(null)
        setDesignNote('')
        setSendMsg(null)
      }
      setConfirmDelete(null)
      return
    }
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
        setDesignFile2(null)
        setDesignPreview2(null)
        setDesignFileBack(null)
        setDesignPreviewBack(null)
        setDesignNote('')
        setSendMsg(null)
      }
    }
    setConfirmDelete(null)
  }

  const archiveOrderFiles = async (order: Record<string, any>) => {
    const updates: Record<string, string> = {}
    for (const field of ARCHIVABLE_URL_FIELDS) {
      const path = storagePathFromUrl(order[field])
      if (!path) {
        if (order[field]) console.warn(`[archive] ${order.id}: pole "${field}" nie pasuje do formatu URL Storage:`, order[field])
        continue
      }
      if (path.startsWith(ARCHIVE_PREFIX)) continue
      const destPath = ARCHIVE_PREFIX + path
      const { error: moveError } = await supabase.storage.from(STORAGE_BUCKET).move(path, destPath)
      if (moveError) {
        console.error(`[archive] ${order.id}: nie udało się przenieść "${field}" (${path} → ${destPath}):`, moveError)
        continue
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(destPath)
      updates[field] = data.publicUrl
    }
    return updates
  }

  const [archiving, setArchiving] = useState(false)
  const archiveAllDone = async () => {
    if (isSupabasePlaceholder() || archiving) return
    setArchiving(true)
    const doneOrders = orders.filter(o => o.status === 'done')
    let archivedCount = 0
    let filesMoved = 0
    for (const order of doneOrders) {
      const fileUpdates = await archiveOrderFiles(order)
      filesMoved += Object.keys(fileUpdates).length
      if (Object.keys(fileUpdates).length > 0) {
        const { error } = await supabase.from('orders').update(fileUpdates).eq('id', order.id)
        if (error) {
          console.error(`[archive] ${order.id}: przeniesiono pliki, ale nie udało się zaktualizować zamówienia:`, error)
        } else {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...fileUpdates } : o))
          archivedCount++
        }
      }
    }
    console.log(`[archive] Gotowe: ${archivedCount}/${doneOrders.length} zamówień, ${filesMoved} plików przeniesionych. Szczegóły błędów (jeśli są) wyżej w konsoli.`)
    setArchiving(false)
    alert(`Zarchiwizowano pliki dla ${archivedCount} z ${doneOrders.length} zakończonych zamówień (${filesMoved} plików łącznie).${filesMoved === 0 ? '\n\nNic nie przeniesiono — otwórz konsolę przeglądarki (F12 → Console) i sprawdź komunikaty [archive], to pokaże dokładną przyczynę.' : ''}`)
  }

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = isSupabasePlaceholder()
      ? await mockListOrders()
      : await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error && data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])
  useEffect(() => {
    fetch('/api/track-visit').then(r => r.json()).then(d => setVisitCount(d.count)).catch(() => {})
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const updates: Record<string, unknown> = { status }
    if (status === 'production') updates.approved_at = new Date().toISOString()
    if (status === 'shipped') updates.shipped_at = new Date().toISOString()
    if (status === 'done' && !isSupabasePlaceholder()) {
      const order = orders.find(o => o.id === id)
      if (order) Object.assign(updates, await archiveOrderFiles(order))
    }
    const { error } = isSupabasePlaceholder()
      ? await mockUpdateOrder(id, updates)
      : await supabase.from('orders').update(updates).eq('id', id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
    }
    setUpdating(null)
  }

  const togglePaid = async (id: string, paid: boolean, currentStatus?: string) => {
    const updates: Record<string, unknown> = { paid: !paid }
    // Automatyczne przejście do produkcji gdy oznaczamy jako opłacone, a zlecenie czekało na płatność
    if (!paid && currentStatus === 'awaiting_payment') {
      updates.status = 'production'
      updates.approved_at = new Date().toISOString()
    }
    const { data, error } = isSupabasePlaceholder()
      ? await mockUpdateOrder(id, updates)
      : await supabase.from('orders').update(updates).eq('id', id).select('*').single()
    if (error) {
      console.error('Błąd zapisu płatności:', error.message)
      alert('Błąd zapisu: ' + error.message)
      return
    }
    if (data) {
      setOrders(prev => prev.map(o => o.id === id ? (data as Order) : o))
      setSelected(prev => prev?.id === id ? (data as Order) : prev)
    }
  }

  const handleDesignFile = (file: File) => {
    setDesignFile(file)
    const reader = new FileReader()
    reader.onload = e => setDesignPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setSendMsg(null)
  }

  const handleDesignFile2 = (file: File) => {
    setDesignFile2(file)
    const reader = new FileReader()
    reader.onload = e => setDesignPreview2(e.target?.result as string)
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
      const timestamp = Date.now()
      const localMock = isSupabasePlaceholder()

      // 1. PRZÓD — upload ORYGINAŁU (pełna rozdzielczość, bez zmian) osobno od LEKKIEGO PODGLĄDU (skompresowany).
      //    Podgląd trafia do maila i jest tym, co się automatycznie wyświetla — to on generuje powtarzalny ruch (egress),
      //    więc ma być lekki. Oryginał leży w Storage i nie jest nigdzie ładowany automatycznie.
      let designOriginalUrl: string
      let designUrl: string
      if (localMock) {
        // Brak prawdziwego Storage lokalnie — oryginał i podgląd zamieniamy na data URL zamiast uploadu.
        designOriginalUrl = await blobToDataUrl(designFile)
        const compressedFront = await compressImage(designFile, 1200, 0.82, true)
        designUrl = await blobToDataUrl(compressedFront)
      } else {
        const extFront = (designFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExtFront = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extFront) ? extFront : 'jpg'
        const fileNameFrontOriginal = `designs/${selected.id}-${timestamp}-original.${safeExtFront}`
        const { error: uploadFrontOriginalError } = await supabase.storage
          .from('order-photos')
          .upload(fileNameFrontOriginal, designFile, { upsert: false })
        if (uploadFrontOriginalError) {
          setSendMsg({ type: 'err', text: 'Błąd uploadu oryginału przodu: ' + uploadFrontOriginalError.message })
          setSending(false)
          return
        }
        const { data: urlFrontOriginalData } = supabase.storage.from('order-photos').getPublicUrl(fileNameFrontOriginal)
        designOriginalUrl = urlFrontOriginalData.publicUrl

        const compressedFront = await compressImage(designFile, 1200, 0.82, true)
        const fileNameFront = `designs/${selected.id}-${timestamp}.jpg`
        const { error: uploadFrontError } = await supabase.storage
          .from('order-photos')
          .upload(fileNameFront, compressedFront, { upsert: false, contentType: 'image/jpeg' })
        if (uploadFrontError) {
          setSendMsg({ type: 'err', text: 'Błąd uploadu podglądu przodu: ' + uploadFrontError.message })
          setSending(false)
          return
        }
        const { data: urlFrontData } = supabase.storage.from('order-photos').getPublicUrl(fileNameFront)
        designUrl = urlFrontData.publicUrl + `?v=${timestamp}`
      }

      // 1b. WARIANT 2 (opcjonalnie) — drugi projekt przodu do wyboru przez klienta, ta sama zasada.
      let designOriginalUrl2: string | null = null
      let designUrl2: string | null = null
      if (designFile2) {
        if (localMock) {
          designOriginalUrl2 = await blobToDataUrl(designFile2)
          const compressedFront2 = await compressImage(designFile2, 1200, 0.82, true)
          designUrl2 = await blobToDataUrl(compressedFront2)
        } else {
          const extFront2 = (designFile2.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
          const safeExtFront2 = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extFront2) ? extFront2 : 'jpg'
          const fileNameFrontOriginal2 = `designs/${selected.id}-${timestamp}-2-original.${safeExtFront2}`
          const { error: uploadFrontOriginalError2 } = await supabase.storage
            .from('order-photos')
            .upload(fileNameFrontOriginal2, designFile2, { upsert: false })
          if (!uploadFrontOriginalError2) {
            const { data: urlFrontOriginalData2 } = supabase.storage.from('order-photos').getPublicUrl(fileNameFrontOriginal2)
            designOriginalUrl2 = urlFrontOriginalData2.publicUrl
          }

          const compressedFront2 = await compressImage(designFile2, 1200, 0.82, true)
          const fileNameFront2 = `designs/${selected.id}-${timestamp}-2.jpg`
          const { error: uploadFrontError2 } = await supabase.storage
            .from('order-photos')
            .upload(fileNameFront2, compressedFront2, { upsert: false, contentType: 'image/jpeg' })
          if (!uploadFrontError2) {
            const { data: urlFrontData2 } = supabase.storage.from('order-photos').getPublicUrl(fileNameFront2)
            designUrl2 = urlFrontData2.publicUrl + `?v=${timestamp}`
          }
        }
      }

      // 2. TYŁ (opcjonalnie) — ta sama zasada: oryginał + skompresowany podgląd
      let designBackUrl: string | null = null
      let designBackOriginalUrl: string | null = null
      if (designFileBack) {
        if (localMock) {
          designBackOriginalUrl = await blobToDataUrl(designFileBack)
          const compressedBack = await compressImage(designFileBack, 1200, 0.82, true)
          designBackUrl = await blobToDataUrl(compressedBack)
        } else {
          const extBack = (designFileBack.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
          const safeExtBack = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extBack) ? extBack : 'jpg'
          const fileNameBackOriginal = `designs/${selected.id}-${timestamp}-back-original.${safeExtBack}`
          const { error: uploadBackOriginalError } = await supabase.storage
            .from('order-photos')
            .upload(fileNameBackOriginal, designFileBack, { upsert: false })
          if (!uploadBackOriginalError) {
            const { data: urlBackOriginalData } = supabase.storage.from('order-photos').getPublicUrl(fileNameBackOriginal)
            designBackOriginalUrl = urlBackOriginalData.publicUrl
          }

          const compressedBack = await compressImage(designFileBack, 1200, 0.82, true)
          const fileNameBack = `designs/${selected.id}-${timestamp}-back.jpg`
          const { error: uploadBackError } = await supabase.storage
            .from('order-photos')
            .upload(fileNameBack, compressedBack, { upsert: false, contentType: 'image/jpeg' })
          if (!uploadBackError) {
            const { data: urlBackData } = supabase.storage.from('order-photos').getPublicUrl(fileNameBack)
            designBackUrl = urlBackData.publicUrl
          }
        }
      }

      // 3. Wyślij do API tylko małe dane JSON (linki + notatka) — zero ryzyka 413
      const res = await fetch('/api/send-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selected.id,
          designUrl,
          designUrl2,
          designBackUrl,
          designOriginalUrl,
          designOriginalUrl2,
          designBackOriginalUrl,
          note: designNote,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSendMsg({ type: 'ok', text: 'Projekt wysłany do klienta! Status zmieniony na "Do akceptacji".' })
        const patch = { status: 'approval', design_url: designUrl, design_url_2: designUrl2, design_back_url: designBackUrl, design_original_url: designOriginalUrl, design_original_url_2: designOriginalUrl2, design_back_original_url: designBackOriginalUrl, approved_design_option: null }
        setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, ...patch } : o))
        setSelected(prev => prev ? { ...prev, ...patch } : null)
        setDesignFile(null)
        setDesignPreview(null)
        setDesignFile2(null)
        setDesignPreview2(null)
        setDesignFileBack(null)
        setDesignPreviewBack(null)
        setDesignNote('')
      } else {
        setSendMsg({ type: 'err', text: data.error || 'Błąd wysyłki.' })
      }
    } catch (err) {
      setSendMsg({ type: 'err', text: 'Błąd połączenia: ' + (err instanceof Error ? err.message : 'nieznany') })
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
          <span style={{ fontSize: '13px', color: 'rgba(240,238,255,0.4)' }} title="Odwiedziny strony głównej (od uruchomienia licznika)">
            👁 {visitCount === null ? '—' : visitCount.toLocaleString('pl-PL')} odwiedzin
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
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
          {!isSupabasePlaceholder() && (
            <button
              onClick={archiveAllDone}
              disabled={archiving}
              title="Przenosi zdjęcia wszystkich zakończonych zamówień do folderu closed-orders/ w Storage"
              style={{ background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.4)', color: '#9ca3af', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: archiving ? 'wait' : 'pointer', fontFamily: 'inherit' }}
            >
              {archiving ? 'Archiwizuję...' : '🗄 Zarchiwizuj zakończone'}
            </button>
          )}
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
                      ? <LazyImage src={order.photo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '42px', height: '42px', borderRadius: '7px', background: '#16162a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎴</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: '#f0eeff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {order.name}
                        <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(240,238,255,0.3)', fontFamily: 'monospace' }}>
                          #{order.id.slice(0, 8)} ({(order as any).card_type === 'laminated' ? 'Wizytówki' : 'PVC'})
                        </span>
                        {(order as any).nfc_enabled && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#00e5a0', fontFamily: 'monospace' }}>(NFC)</span>
                        )}
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
                    <span style={{
                      background: order.paid ? 'rgba(0,229,160,0.15)' : 'rgba(245,158,11,0.15)',
                      color: order.paid ? '#00e5a0' : '#f59e0b',
                      border: `1px solid ${order.paid ? 'rgba(0,229,160,0.4)' : 'rgba(245,158,11,0.4)'}`,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>
                      {order.paid ? '💰 Opłacone' : '⏳ Nieopłacone'}
                    </span>
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
            <ClientMaterials key={selected.id} order={selected} />

            {/* WYSŁANY PROJEKT */}
            {selected.design_url && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(240,238,255,0.4)', letterSpacing: '1px' }}>WYSŁANY PROJEKT</p>
                {selected.approved_design_option && (
                  <div style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.35)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#00e5a0', fontWeight: 700 }}>✓ Klient zatwierdził: Wariant {selected.approved_design_option}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#b44dff', letterSpacing: '1px' }}>
                      {selected.design_url_2 ? 'WARIANT 1' : 'PRZÓD (podgląd)'}{selected.approved_design_option === 1 ? ' ✓' : ''}
                    </p>
                    <LazyImage key={`${selected.id}-design-front`} src={selected.design_url} alt="Przód" style={{ width: '100%', aspectRatio: '0.7', borderRadius: '8px', border: `1px solid ${selected.approved_design_option === 1 ? 'rgba(0,229,160,0.6)' : 'rgba(180,77,255,0.3)'}` }} label="Kliknij, aby wczytać" />
                    <a href={selected.design_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#b44dff', textDecoration: 'none', marginTop: '4px', textAlign: 'center' }}>podgląd w nowej karcie →</a>
                    {selected.design_original_url && (
                      <a href={selected.design_original_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#00e5a0', textDecoration: 'none', marginTop: '2px', textAlign: 'center' }}>⬇ oryginał bez znaku wodnego →</a>
                    )}
                  </div>
                  {selected.design_url_2 && (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#b44dff', letterSpacing: '1px' }}>
                        WARIANT 2{selected.approved_design_option === 2 ? ' ✓' : ''}
                      </p>
                      <LazyImage key={`${selected.id}-design-front-2`} src={selected.design_url_2} alt="Wariant 2" style={{ width: '100%', aspectRatio: '0.7', borderRadius: '8px', border: `1px solid ${selected.approved_design_option === 2 ? 'rgba(0,229,160,0.6)' : 'rgba(180,77,255,0.3)'}` }} label="Kliknij, aby wczytać" />
                      <a href={selected.design_url_2} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#b44dff', textDecoration: 'none', marginTop: '4px', textAlign: 'center' }}>podgląd w nowej karcie →</a>
                      {selected.design_original_url_2 && (
                        <a href={selected.design_original_url_2} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#00e5a0', textDecoration: 'none', marginTop: '2px', textAlign: 'center' }}>⬇ oryginał bez znaku wodnego →</a>
                      )}
                    </div>
                  )}
                  {selected.design_back_url ? (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#00f0ff', letterSpacing: '1px' }}>TYŁ (podgląd)</p>
                      <LazyImage key={`${selected.id}-design-back`} src={selected.design_back_url} alt="Tył" style={{ width: '100%', aspectRatio: '0.7', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)' }} label="Kliknij, aby wczytać" />
                      <a href={selected.design_back_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#00f0ff', textDecoration: 'none', marginTop: '4px', textAlign: 'center' }}>podgląd w nowej karcie →</a>
                      {selected.design_back_original_url && (
                        <a href={selected.design_back_original_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: '#00e5a0', textDecoration: 'none', marginTop: '2px', textAlign: 'center' }}>⬇ oryginał bez znaku wodnego →</a>
                      )}
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
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: 'rgba(0,229,160,0.7)' }}>💧 Podgląd wysyłany do klienta dostaje automatycznie znak wodny — oryginał bez znaku wodnego zostaje tylko w panelu, do druku po opłaceniu.</p>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'rgba(240,238,255,0.5)' }}>Wariant 1 (przód)</p>
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

              <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'rgba(240,238,255,0.5)' }}>Wariant 2 (przód, opcjonalnie) — klient dostanie oba do wyboru</p>
              <div
                onClick={() => fileRef2.current?.click()}
                style={{ border: `1.5px dashed ${designPreview2 ? '#00e5a0' : 'rgba(180,77,255,0.3)'}`, borderRadius: '8px', padding: designPreview2 ? '8px' : '16px', textAlign: 'center', cursor: 'pointer', background: designPreview2 ? 'rgba(0,229,160,0.05)' : 'transparent', marginBottom: '12px' }}
              >
                {designPreview2
                  ? <img src={designPreview2} alt="Podgląd wariantu 2" style={{ width: '100%', borderRadius: '6px', maxHeight: '120px', objectFit: 'contain' }} />
                  : <>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'rgba(240,238,255,0.5)' }}>Kliknij aby wybrać drugi wariant</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,238,255,0.3)' }}>opcjonalnie — min. 2 warianty do wyboru dla klienta</p>
                  </>
                }
              </div>
              <input ref={fileRef2} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleDesignFile2(e.target.files[0]) }} />
              {designPreview2 && (
                <button onClick={() => { setDesignFile2(null); setDesignPreview2(null) }}
                  style={{ marginTop: '-6px', marginBottom: '12px', background: 'transparent', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Usuń wariant 2
                </button>
              )}

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
            <div style={{ background: selected.paid ? 'rgba(0,229,160,0.08)' : 'rgba(245,158,11,0.06)', border: `1px solid ${selected.paid ? 'rgba(0,229,160,0.3)' : 'rgba(245,158,11,0.25)'}`, borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(240,238,255,0.6)' }}>
                  Ilość: <strong style={{ color: '#f0eeff' }}>× {(selected as any).quantity ?? '—'}</strong>
                  {(selected as any).unit_price ? ` (${(selected as any).unit_price} zł/szt.)` : ''}
                </span>
                {(selected as any).has_discount && (
                  <span style={{ fontSize: '12px', color: '#00e5a0' }}>🎉 Rabat ilościowy (-35%)</span>
                )}
                {(selected as any).discount_code && (
                  <span style={{ fontSize: '12px', color: '#00e5a0' }}>
                    🏷 Kod: <strong>{(selected as any).discount_code}</strong>{(selected as any).discount_pct ? ` (-${(selected as any).discount_pct}%)` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(240,238,255,0.4)', letterSpacing: '1px' }}>DO ZAPŁATY</p>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: selected.paid ? '#00e5a0' : '#f59e0b', fontFamily: 'Space Mono, monospace' }}>
                    {selected.total_price ? `${selected.total_price} zł` : '— zł'}
                  </p>
                </div>
                <button
                  onClick={() => togglePaid(selected.id, selected.paid, selected.status)}
                  style={{ background: selected.paid ? 'rgba(0,229,160,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${selected.paid ? 'rgba(0,229,160,0.4)' : 'rgba(245,158,11,0.4)'}`, color: selected.paid ? '#00e5a0' : '#f59e0b', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {selected.paid ? '✓ Opłacone' : 'Oznacz jako opłacone'}
                </button>
              </div>
              {!selected.paid && selected.status === 'awaiting_payment' && (
                <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#ec4899' }}>💡 Po oznaczeniu jako opłacone status automatycznie zmieni się na "Produkcja".</p>
              )}
            </div>

            <button
              onClick={() => exportOrderAsText(selected)}
              style={{ width: '100%', marginTop: '8px', background: 'rgba(180,77,255,0.12)', border: '1px solid rgba(180,77,255,0.35)', color: '#b44dff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📄 Eksportuj dane zlecenia (.txt)
            </button>

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
                (selected as any).delivery_method === 'paczkomat'
                  ? {
                      label: '📦 Paczkomat',
                      value: selected.address + ((selected as any).paczkomat_id && !selected.address?.includes((selected as any).paczkomat_id)
                        ? ` (kod: ${(selected as any).paczkomat_id})` : ''),
                    }
                  : { label: 'Adres', value: selected.address },
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
                { label: '① Lewy nagł. [LN]', value: (selected as any).card_year || '—' },
                { label: '② Prawy nagł. [PN]', value: (selected as any).card_rarity || '—' },
                { label: '③ Nazwa', value: (selected as any).card_name_custom || '—' },
                { label: '④ Atrybut 1', value: [(selected as any).attr1_label, (selected as any).attr1_value].filter(Boolean).join(' — ') || '—' },
                { label: '⑤ Umiejętność', value: (selected as any).card_skill || '—' },
                { label: '⑥ Atrybut 2', value: [(selected as any).attr2_label, (selected as any).attr2_value].filter(Boolean).join(' — ') || '—' },
                { label: '⑦ Napis w ramce', value: (selected as any).card_bottom_text || '—' },
                { label: '⑧ Kolor ramki', value: FRAME_COLORS[(selected as any).frame_color]?.name || (selected as any).frame_color || '—', hex: FRAME_COLORS[(selected as any).frame_color]?.hex },
                { label: '⑨ Efekt holo', value: (selected as any).holo_effect ? '✨ Tak' : 'Nie' },
              ].map((row: any, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(240,238,255,0.4)', minWidth: '108px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: row.value === '—' ? 'rgba(240,238,255,0.2)' : '#f0eeff', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {row.hex && <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: row.hex, flexShrink: 0 }} />}
                    {row.value}
                  </span>
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
