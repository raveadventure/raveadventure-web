'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { isSupabasePlaceholder, mockInsertOrder, mockUpdateOrder } from '../lib/ordersLocalMock'
import styles from './page.module.css'
import PortfolioCarousel from '../components/PortfolioCarousel'
import RealCardsSection from '../components/RealCardsSection'
import AdShowcase from '../components/AdShowcase'
import FaqReviews from '../components/FaqReviews'
import InpostGeowidget from '../components/InpostGeowidget'
import InpostAutocomplete from '../components/InpostAutocomplete'
import HeroCardAnimation from '../components/HeroCardAnimation'
import LogoEqualizer from '../components/LogoEqualizer'
import { T, CARD_TYPES_I18N, FRONT_THEMES_I18N, BACK_OPTIONS_I18N, CARD_FINISH_I18N, Lang } from '../lib/translations'

// Baner promocyjny nad stroną — wyłączony między eventami. Włącz z powrotem (i zaktualizuj
// tekst/kod/datę) gdy ruszy kolejna promocja powiązana z festiwalem.
const SHOW_PROMO_BANNER = false

type Step = 1 | 2 | 3 | 4 | 5

// Kolorystyka ramek karty — nazwy są już marketingowe/neutralne językowo, więc nie idą przez
// lib/translations.tsx (w odróżnieniu od reszty tekstów UI). Wymaga kolumny `frame_color` w
// Supabase (text) — patrz przypomnienie w PR/komentarzu przy insertach niżej.
const FRAME_COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'neon_orange', name: 'Neon Orange', hex: '#ff8a1f' },
  { id: 'dark_orange', name: 'Dark Orange', hex: '#b35900' },
  { id: 'neon_blue', name: 'Neon Blue', hex: '#22aaff' },
  { id: 'dark_blue', name: 'Dark Blue', hex: '#1b5e94' },
  { id: 'neon_purple', name: 'Neon Purple', hex: '#b44dff' },
  { id: 'dark_purple', name: 'Dark Purple', hex: '#6b2fa3' },
  { id: 'yellow_neon_blue_sky', name: 'Yellow Neon + Blue Sky', hex: '#ffd60a' },
  { id: 'dark_green', name: 'Dark Green', hex: '#1f7a3d' },
  { id: 'neon_green', name: 'Neon Green', hex: '#39ff6a' },
  { id: 'dark_red', name: 'Dark Red', hex: '#8f1f1f' },
  { id: 'neon_red', name: 'Neon Red', hex: '#ff2b4d' },
]

// Bazowe grafiki podglądu karty per motyw (public/) — techno/festival/adventure dzielą
// identyczny układ pól (tylko kolor ramki się różni), custom ma własny, eksperymentalny układ.
const CARD_PREVIEW_BG: Record<string, string> = {
  techno_rave: '/card_techno.png',
  festival: '/card_festival.png',
  adventure: '/card_adventure.png',
  custom: '/card_custom_1.png',
}
// Warianty z efektem holo — sam układ pól identyczny jak w wersji bazowej (te same wymiary PNG).
const CARD_PREVIEW_BG_HOLO: Record<string, string> = {
  techno_rave: '/card_techno_holo.png',
  festival: '/card_festival_holo.png',
  adventure: '/card_adventure_holo.png',
  custom: '/card_custom_1_holo.png',
}
// Powtarzalny znak wodny nakładany na podgląd karty — utrudnienie dla prostego "screenshot + AI",
// nie realna ochrona (patrz wyjaśnienie przy wdrożeniu tej funkcji).
const PREVIEW_WATERMARK_BG = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140'><text x='-20' y='85' transform='rotate(-28 130 70)' font-family='Arial, sans-serif' font-size='24' font-weight='800' fill='rgba(255,255,255,0.32)' stroke='rgba(0,0,0,0.25)' stroke-width='0.5' letter-spacing='1'>RAVEADVENTURE • PODGLĄD</text></svg>`
)}")`

function PreviewSlot({ top, left, width, align = 'center', fontSize = '10px', color = '#f0eeff', weight = 700, value }: {
  top: string; left: string; width: string; align?: 'left' | 'center' | 'right'; fontSize?: string; color?: string; weight?: number; value: string
}) {
  // left/top to najpierw ŚRODEK slotu (transform -50%/-50%), a width to pełna szerokość pola tekstowego
  // na oryginalnej grafice — tło rozciąga się na całą tę szerokość, żeby zawsze w pełni zasłonić
  // placeholder wypalony w PNG, niezależnie od długości wpisanego tekstu.
  return (
    <div style={{
      position: 'absolute', top, left, width, transform: 'translate(-50%, -50%)',
      display: 'flex', justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    }}>
      <span style={{
        display: 'block', width: '100%', boxSizing: 'border-box', background: '#0a0a12',
        borderRadius: '4px', padding: '2px 5px', fontFamily: 'var(--font-display)', fontSize, color, fontWeight: weight,
        textAlign: align, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</span>
    </div>
  )
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('pl')
  const t = T[lang]
  // Nadpisania cen/nazw względem lib/translations.tsx (na życzenie: PVC 50 zł,
  // "Karta Laminowana" -> "Wizytówka (100 sztuk)" 50 zł). Jeśli wolisz zmienić
  // to docelowo w samym translations.tsx, ten override można wtedy usunąć.
  const CARD_TYPES = CARD_TYPES_I18N[lang].map(c => {
    if (c.id === 'pvc') return { ...c, price: 40 }
    if (c.id === 'laminated') return {
      ...c,
      price: 50,
      label: lang === 'pl' ? 'Wizytówka (100 sztuk)' : 'Business Card (100 pcs)',
      dims: '55 × 85 mm lub 90 × 50 mm',
      desc: lang === 'pl'
        ? 'Zestaw 100 wizytówek z Twoją personalizowaną grafiką.'
        : 'Set of 100 business cards with your personalized artwork.',
    }
    return c
  })
  const FRONT_THEMES = FRONT_THEMES_I18N[lang]
  const BACK_OPTIONS = BACK_OPTIONS_I18N[lang]
  const CARD_FINISHES = CARD_FINISH_I18N[lang]

  const [step, setStep] = useState<Step>(1)
  const [cardType, setCardType] = useState('pvc')
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [cardFinish, setCardFinish] = useState('standard')
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [frontTheme, setFrontTheme] = useState('techno_rave')
  const [frameColor, setFrameColor] = useState('neon_purple')
  const [holoEffect, setHoloEffect] = useState(false)
  const [backOption, setBackOption] = useState('logo')
  const [deliveryMethod, setDeliveryMethod] = useState<'address' | 'paczkomat'>('address')
  const [paczkomatId, setPaczkomatId] = useState('')
  // Osobna flaga potwierdzenia — inaczej "wybrany paczkomat" pokazywał się już po wpisaniu
  // pierwszej litery w polu tekstowym (form.address i paczkomatId były prawdziwe po 1 znaku).
  const [paczkomatConfirmed, setPaczkomatConfirmed] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', emailConfirm: '', phone: '', address: '',
    notesBack: '', customDesc: '', notes: '',
    cardYear: '', cardRarity: '', cardName: '', attr1Label: '', attr1Value: '', cardSkill: '', attr2Label: '', attr2Value: '', cardDesc: '', cardBottomText: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refFileFront, setRefFileFront] = useState<File | null>(null)
  const [refFileBack, setRefFileBack] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountPct, setDiscountPct] = useState(0)
  const [discountMsg, setDiscountMsg] = useState<string | null>(null)

  const DISCOUNT_CODES: Record<string, number> = {} // brak aktywnych kodów — LSF2026 wygasł 27.07.2026, usunięty

  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase()
    if (DISCOUNT_CODES[code]) {
      setDiscountPct(DISCOUNT_CODES[code]); setDiscountApplied(true)
      setDiscountMsg(t.discount.active(DISCOUNT_CODES[code]))
    } else {
      setDiscountPct(0); setDiscountApplied(false); setDiscountMsg(t.discount.invalid)
    }
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const refFileFrontRef = useRef<HTMLInputElement>(null)
  const refFileBackRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [navHeight, setNavHeight] = useState(64)
  const progressRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(step)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    if (!navRef.current) return
    const el = navRef.current
    const update = () => {
      setNavHeight(el.offsetHeight)
      // Udostępnij wysokość fixed navu jako CSS var, żeby scroll-margin-top na sekcjach
      // (kotwice w quick-nav) mogły się do niej dopasować bez twardego kodowania pikseli.
      document.documentElement.style.setProperty('--nav-height', `${el.offsetHeight}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Prosty licznik odwiedzin — jedno zdarzenie na wejście na stronę, do wglądu w panelu admina.
  useEffect(() => {
    fetch('/api/track-visit', { method: 'POST' }).catch(() => {})
  }, [])

  // Po zmianie kroku formularza przewiń do paska postępu (nie zostawiaj klienta na dole
  // poprzedniego kroku) — widzi od razu, który krok jest aktywny i wypełnia od góry w dół.
  // Porównanie z poprzednią wartością (zamiast flagi "czy to pierwszy render") jest odporne
  // na podwójne wywołanie efektów przez React Strict Mode w trybie dev — flaga konsumowana
  // przy pierwszym z dwóch wywołań powodowała, że drugie i tak przewijało stronę od razu po wejściu.
  useEffect(() => {
    if (prevStepRef.current === step) return
    prevStepRef.current = step
    if (!progressRef.current) return
    const y = progressRef.current.getBoundingClientRect().top + window.scrollY - navHeight - 16
    window.scrollTo({ top: y, behavior: 'smooth' })
  }, [step, navHeight])

  const cardObj = CARD_TYPES.find(c => c.id === cardType)!
  const backObj = BACK_OPTIONS.find(b => b.id === backOption)!
  const SHIPPING_COST = 15
  const NFC_PRICE_STANDARD = 15
  const NFC_PRICE_BULK = 8
  const nfcActive = nfcEnabled && cardType === 'pvc'
  const nfcUnitPrice = quantity > 3 ? NFC_PRICE_BULK : NFC_PRICE_STANDARD
  const nfcTotal = nfcActive ? nfcUnitPrice * quantity : 0
  // Wykończenie karty — tylko dla PVC. "zestaw_promocyjny" zastępuje bazową cenę karty (płynie
  // przez unitPrice i rabat ilościowy jak zwykła cena); reszta to dopłata per sztuka liczona
  // OSOBNO od rabatu ilościowego, dokładnie jak NFC/RFID (patrz CARD_FINISH_I18N w lib/translations.tsx).
  const cardFinishId = cardType === 'pvc' ? cardFinish : 'standard'
  const cardFinishObj = CARD_FINISHES.find(f => f.id === cardFinishId)!
  const isZestawPromocyjny = cardFinishId === 'zestaw_promocyjny'
  const cardFinishAddonTotal = (!isZestawPromocyjny && cardFinishId !== 'standard') ? cardFinishObj.price * quantity : 0
  const effectiveCardTypePrice = isZestawPromocyjny ? cardFinishObj.price : cardObj.price
  const unitPrice = effectiveCardTypePrice + backObj.price
  const QUANTITY_DISCOUNT_RATE = 0.35 // -35% rabat ilościowy przy 3+ sztukach (obniżone z -50%, bo przy tamtej stawce zamówienia 3+ szt. wychodziły na zero/stratę — patrz BOM kosztów)
  const hasDiscount = quantity >= 3
  const baseTotal = hasDiscount ? Math.round(unitPrice * quantity * (1 - QUANTITY_DISCOUNT_RATE)) : unitPrice * quantity
  const savedAmount = hasDiscount ? Math.round(unitPrice * quantity * QUANTITY_DISCOUNT_RATE) : 0
  const discountSaved = discountApplied ? Math.round(baseTotal * discountPct / 100) : 0
  const totalPrice = baseTotal - discountSaved + SHIPPING_COST + nfcTotal + cardFinishAddonTotal

  const handlePhoto = (file: File) => {
    setPhoto(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handlePhoto(file)
  }

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const handleSubmit = async () => {
    if (!photo) { setError(t.order.step5.errPhotoRequired); setStep(2); return }
    if (!form.name || !form.email || !form.address) { setError(t.order.step5.errRequired); return }
    if (deliveryMethod === 'paczkomat' && !form.phone.trim()) { setError(t.order.step5.errPhoneRequired); return }
    if (!isValidEmail(form.email)) {
      setError(lang === 'pl' ? 'Podaj prawidłowy adres email (musi zawierać znak @ i domenę).' : 'Please enter a valid email address (must include @ and a domain).')
      return
    }
    if (form.email.trim().toLowerCase() !== form.emailConfirm.trim().toLowerCase()) {
      setError(lang === 'pl' ? 'Podane adresy email nie są takie same — sprawdź oba pola.' : 'The email addresses do not match — please check both fields.')
      return
    }
    if (!agreed) { setError(t.order.step5.errAgree); return }
    setSending(true); setError(null)
    try {
      const orderFields = {
        theme: frontTheme, card_type: cardType, back_option: backOption, quantity,
        nfc_enabled: nfcActive, nfc_price: nfcTotal, card_finish: cardFinishId,
        unit_price: unitPrice, total_price: totalPrice, has_discount: hasDiscount,
        name: form.name, email: form.email, phone: form.phone, address: form.address,
        notes: form.notes, card_text: form.notesBack, custom_desc: form.customDesc, qr_link: form.notesBack,
        card_year: form.cardYear, card_rarity: form.cardRarity, card_name_custom: form.cardName,
        attr1_label: form.attr1Label, attr1_value: form.attr1Value, card_skill: form.cardSkill,
        attr2_label: form.attr2Label, attr2_value: form.attr2Value, card_desc: form.cardDesc,
        card_bottom_text: form.cardBottomText, frame_color: frameColor, holo_effect: holoEffect,
        discount_code: discountApplied ? discountCode.trim().toUpperCase() : null, discount_pct: discountPct,
        photo_url: null, status: 'new', lang,
        delivery_method: deliveryMethod, paczkomat_id: deliveryMethod === 'paczkomat' ? paczkomatId : null,
      }
      const localMock = isSupabasePlaceholder()
      let orderData: { id: string } | null = null
      if (localMock) {
        const { data, error: insertError } = await mockInsertOrder(orderFields)
        if (insertError) throw new Error(insertError.message)
        orderData = data
      } else {
        const res = await fetch('/api/create-order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderFields),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać zamówienia.')
        orderData = data
      }

      if (photo && orderData?.id) {
        if (localMock) {
          // Brak prawdziwego Storage lokalnie — zdjęcie zamieniamy na data URL i zapisujemy wprost w mocku.
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(photo)
          })
          const { error: updateError } = await mockUpdateOrder(orderData.id, { photo_url: dataUrl })
          if (updateError) console.error('Photo URL update error:', updateError.message)
        } else {
          const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
          const safeExt = ['jpg','jpeg','png','gif','webp','heic'].includes(ext) ? ext : 'jpg'
          const fileName = `${orderData.id}-front.${safeExt}`
          const { error: uploadError } = await supabase.storage.from('order-photos').upload(fileName, photo, { upsert: true })
          if (uploadError) { console.error('Photo upload error:', uploadError.message) }
          else {
            const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(fileName)
            const patchRes = await fetch('/api/create-order', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderData.id, photo_url: urlData.publicUrl }),
            })
            if (!patchRes.ok) console.error('Photo URL update error:', (await patchRes.json()).error)
          }
        }
      }

      if (refFileFront && orderData?.id) {
        if (localMock) {
          // Brak prawdziwego Storage lokalnie — grafikę referencyjną zamieniamy na data URL i zapisujemy wprost w mocku
          // (pole ref_front_url istnieje tylko w lokalnym JSON-owym mocku, produkcja i tak korzysta z listowania Storage).
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(refFileFront)
          })
          await mockUpdateOrder(orderData.id, { ref_front_url: dataUrl })
        } else {
          const ext = (refFileFront.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
          const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
          await supabase.storage.from('order-photos').upload(`${orderData.id}-custom.${safeExt}`, refFileFront, { upsert: true })
        }
      }
      if (refFileBack && orderData?.id) {
        if (localMock) {
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(refFileBack)
          })
          await mockUpdateOrder(orderData.id, { ref_back_url: dataUrl })
        } else {
          const ext = (refFileBack.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
          const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
          await supabase.storage.from('order-photos').upload(`${orderData.id}-ref-back.${safeExt}`, refFileBack, { upsert: true })
        }
      }

      await fetch('/api/send-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, address: form.address, deliveryMethod, paczkomatId, cardText: form.notesBack, notes: form.notes,
          theme: frontTheme, orderId: orderData?.id, cardType, backOption, quantity, unitPrice, totalPrice, hasDiscount, savedAmount,
          nfcEnabled: nfcActive, nfcPrice: nfcTotal, cardFinish: cardFinishId,
          cardYear: form.cardYear, cardRarity: form.cardRarity, cardName: form.cardName,
          attr1Label: form.attr1Label, attr1Value: form.attr1Value, cardSkill: form.cardSkill,
          attr2Label: form.attr2Label, attr2Value: form.attr2Value, cardDesc: form.cardDesc, cardBottomText: form.cardBottomText, frameColor, holoEffect, notesBack: form.notesBack,
          lang,
        }),
      })

      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'pl' ? 'Nieznany błąd' : 'Unknown error')
      setError(t.order.step5.errGeneric(msg))
    } finally { setSending(false) }
  }

  const LangSwitch = () => (
    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px' }}>
      <button
        onClick={() => setLang('pl')}
        style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: lang === 'pl' ? '#b44dff' : 'transparent', color: lang === 'pl' ? '#0a0014' : 'rgba(240,238,255,0.5)' }}
        aria-pressed={lang === 'pl'}
      >
        PL
      </button>
      <button
        onClick={() => setLang('en')}
        style={{ padding: '4px 10px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: lang === 'en' ? '#b44dff' : 'transparent', color: lang === 'en' ? '#0a0014' : 'rgba(240,238,255,0.5)' }}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )

  if (sent) {
    return (
      <div className={styles.sentWrap}>
        <div className={styles.sentBox}>
          <div className={styles.sentIcon}>✓</div>
          <h2>{t.sent.title}</h2>
          <p>{t.sent.body(form.email)}</p>
          <div className={styles.sentSummary}>
            <span>{cardObj.label} × {quantity}</span>
            <strong>{totalPrice} zł</strong>
          </div>
          <button className={styles.btnPrimary} onClick={() => { setSent(false); setStep(1); setForm({ name:'',email:'',emailConfirm:'',phone:'',address:'',notesBack:'',customDesc:'',notes:'',cardYear:'',cardRarity:'',cardName:'',attr1Label:'',attr1Value:'',cardSkill:'',attr2Label:'',attr2Value:'',cardDesc:'',cardBottomText:'' }); setPhoto(null); setPhotoPreview(null); setRefFileFront(null); setRefFileBack(null); setQuantity(1); setNfcEnabled(false); setHoloEffect(false); setFrameColor('neon_purple'); setDeliveryMethod('address'); setPaczkomatId(''); setPaczkomatConfirmed(false); setAgreed(false); setDiscountCode(''); setDiscountApplied(false); setDiscountPct(0); setDiscountMsg(null) }}>
            {t.sent.newOrder}
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className={styles.main}>
      <nav ref={navRef} className={styles.nav}>
        <span className={styles.logo}>Rave<span>Adventure</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <LangSwitch />
          <a href="#order" className={styles.navCta}>{t.nav.orderCta}</a>
        </div>
      </nav>

      {SHOW_PROMO_BANNER && (
        <a
          href="#order"
          style={{
            display: 'block',
            marginTop: `${navHeight}px`,
            background: 'linear-gradient(90deg, rgba(180,77,255,0.18), rgba(0,240,255,0.12))',
            borderBottom: '1px solid rgba(180,77,255,0.3)',
            padding: '10px 5vw',
            textAlign: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0eeff' }}>
              {lang === 'pl' ? '☀️ Podczas trwania Łódź Summer Festival — 25% zniżki na wszystkie karty!' : '☀️ During Łódź Summer Festival — 25% off all cards!'}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(240,238,255,0.5)' }}>
            {lang === 'pl' ? 'Użyj kodu' : 'Use code'}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: '#b44dff', letterSpacing: '1px', margin: '0 6px', textDecoration: 'underline' }}>
              LSF2026
            </span>
            · {lang === 'pl' ? 'kod ważny przy zamówieniu do 27.07.2026' : 'code valid for orders until July 27, 2026'}
          </p>
        </a>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          background: 'linear-gradient(90deg, rgba(180,77,255,0.14), rgba(0,240,255,0.10))',
          borderBottom: '1px solid rgba(180,77,255,0.25)',
          padding: '10px 5vw',
          marginTop: SHOW_PROMO_BANNER ? undefined : `${navHeight}px`,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0eeff' }}>
          {lang === 'pl' ? 'Zapraszamy na nasze sociale' : 'Follow us on social media'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="https://www.instagram.com/rave_adventure_pl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b44dff" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.3" cy="6.7" r="1.1" fill="#b44dff" stroke="none" />
            </svg>
          </a>
          <a href="https://www.facebook.com/raveadventurepl" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M13.8 21v-7.2h2.4l.4-2.8h-2.8v-1.8c0-.8.2-1.4 1.4-1.4h1.5V5.3C16.2 5.2 15.3 5 14.3 5c-2.1 0-3.5 1.3-3.5 3.6v2.4H8.4v2.8h2.4V21" fill="none" />
            </svg>
          </a>
        </span>
      </div>

      <div className={styles.brandWrap}>
        <h2 className={`${styles.brandName} ${styles.shimmer}`}>Rave Adventure</h2>
        <LogoEqualizer />
        <p className={`${styles.brandTagline} ${styles.shimmer}`}>The best memories from your adventure deserve a card</p>
      </div>

      <nav className={styles.quickNav} aria-label={lang === 'pl' ? 'Szybka nawigacja' : 'Quick navigation'}>
        <a href="#realizacje" className={styles.quickNavBtn}>{lang === 'pl' ? 'Realizacje' : 'Portfolio'}</a>
        <a href="#prawdziwe-karty" className={styles.quickNavBtn}>{lang === 'pl' ? 'Prawdziwy produkt' : 'Real product'}</a>
        <a href="#jak-zamowic" className={styles.quickNavBtn}>{lang === 'pl' ? 'Jak to działa' : 'How it works'}</a>
        <a href="#order" className={styles.quickNavBtn}>{lang === 'pl' ? 'Zamówienie' : 'Order'}</a>
        <a href="#faq-opinie" className={styles.quickNavBtn}>{lang === 'pl' ? 'FAQ i opinie' : 'FAQ & reviews'}</a>
      </nav>

      <AdShowcase lang={lang} />
      <PortfolioCarousel lang={lang} />
      <RealCardsSection lang={lang} />

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.hero.eyebrow}</p>
          <h1 className={styles.heroTitle}>
            {t.hero.title1}<br />
            <span className={styles.neon}>{t.hero.title2}</span>
          </h1>
          <p className={styles.heroSub}>{t.hero.sub}</p>

          <a href="#order" className={styles.btnHero}>{t.hero.cta}</a>

          <div
            onClick={() => setShowPaymentInfo(v => !v)} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setShowPaymentInfo(v => !v)}
            style={{
              margin: '14px auto 0',
              maxWidth: '620px',
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '50%', border: '2.5px solid #00e5a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>$$</span>
                <div style={{ position: 'absolute', top: '50%', left: '-3px', right: '-3px', height: '2.5px', background: '#00e5a0', transform: 'rotate(-35deg)' }} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#00e5a0', lineHeight: '1.6', flex: 1 }}>
                {lang === 'pl' ? (
                  <>
                    <span style={{ fontWeight: 700 }}>Przy zamówieniu nie ponosisz żadnej opłaty!</span><br />
                    Śmiało składaj zamówienie wraz ze swoim zdjęciem.<br />
                    Opłata dopiero po zatwierdzeniu projektu.
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 700 }}>No payment is required to place your order!</span><br />
                    Go ahead and order with your photo.<br />
                    Payment is only due after the design is approved.
                  </>
                )}
              </p>
              <span style={{ fontSize: '11px', color: 'rgba(0,229,160,0.6)', flexShrink: 0, alignSelf: 'center' }}>{showPaymentInfo ? '▲' : '▼'}</span>
            </div>
            {showPaymentInfo && (
              <p style={{ margin: '10px 0 0', paddingTop: '10px', borderTop: '1px solid rgba(0,229,160,0.2)', fontSize: '12.5px', color: 'rgba(240,238,255,0.7)', lineHeight: '1.7', textAlign: 'left' }}>
                {lang === 'pl'
                  ? 'Po przygotowaniu projektu otrzymasz go na maila do zatwierdzenia lub do poprawek. W tym samym mailu znajdziesz informację o opłacie — możliwość przelewu BLIK na telefon lub na numer konta. Po zaksięgowaniu opłaty karta trafia do druku, a następnie do wysyłki.'
                  : "Once your design is ready, you'll receive it by email for approval or revisions. That same email includes payment details — BLIK to a phone number or a bank transfer. Once payment is confirmed, your card goes to print and then shipping."}
              </p>
            )}
          </div>

          <div style={{ marginTop: '36px' }}>
            <HeroCardAnimation lang={lang} />
          </div>
        </div>
      </section>

      <section className={styles.section} id="jak-zamowic">
        <div className={styles.mobileCollapse}>
          <button type="button" className={styles.mobileCollapseSummary} onClick={() => setHowItWorksOpen(o => !o)}>
            <p className={styles.sectionEye} style={{ margin: 0 }}>{t.howItWorks.eyebrow}</p>
            <span className={styles.collapseIcon} style={{ transform: howItWorksOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          <div className={`${styles.mobileCollapseBody} ${howItWorksOpen ? styles.mobileCollapseBodyOpen : ''}`}>
            <div className={styles.mobileCollapseBodyInner}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                {t.howItWorks.steps.map(s => (
                  <div key={s.n} className={styles.infoBlock}>
                    <span style={{ fontFamily: 'var(--font-hero)', fontSize: '11px', fontWeight: 700, color: 'var(--neon)', letterSpacing: '1px' }}>{s.n}</span>
                    <p style={{ margin: '5px 0 2px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{s.t}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mobileCollapse}>
          <button type="button" className={styles.mobileCollapseSummary} onClick={() => setOptionsOpen(o => !o)}>
            <p className={styles.sectionEye} style={{ margin: 0 }}>{t.options.eyebrow}</p>
            <span className={styles.collapseIcon} style={{ transform: optionsOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          <div className={`${styles.mobileCollapseBody} ${optionsOpen ? styles.mobileCollapseBodyOpen : ''}`}>
            <div className={styles.mobileCollapseBodyInner}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {t.options.cards.map((o, i) => (
                  <div key={i} className={styles.infoBlock} style={{ borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{o.icon}</span>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{o.title}</p>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{o.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {o.tags.map(tag => (
                        <span key={tag} className={styles.tagPill}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className={styles.infoBlock} style={{ borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>📲</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {lang === 'pl' ? 'Karta z NFC/RFID' : 'NFC/RFID Card'}
                    </p>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {lang === 'pl'
                      ? 'Chcesz, żeby Twoja karta robiła coś więcej niż tylko dobrze wyglądała? Zaprogramuj wbudowany chip NFC — wystarczy zbliżyć telefon, żeby błyskawicznie udostępnić Twój Instagram, TikTok albo hasło do WiFi na imprezie. Bez wpisywania, bez szukania — jeden dotyk.'
                      : 'Want your card to do more than just look good? Program the built-in NFC chip — one tap of a phone instantly shares your Instagram, TikTok, or the WiFi password at your party. No typing, no searching — just a tap.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['NFC', 'RFID'].map(tag => (
                      <span key={tag} className={styles.tagPill}>{tag}</span>
                    ))}
                    <span className={styles.priceTagSm}>+15 zł</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoBlock} style={{ marginTop: '10px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>⚙</span>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{t.options.attrNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="order">
        <p className={styles.sectionEye}>{t.order.eyebrow}</p>
        <h2 className={styles.sectionTitle}>{t.order.title}</h2>

        <div style={{
          maxWidth: '620px',
          margin: '0 auto 24px',
          background: 'rgba(0,229,160,0.08)',
          border: '1px solid rgba(0,229,160,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'left',
        }}>
          <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '50%', border: '2.5px solid #00e5a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>$$</span>
            <div style={{ position: 'absolute', top: '50%', left: '-3px', right: '-3px', height: '2.5px', background: '#00e5a0', transform: 'rotate(-35deg)' }} />
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#00e5a0', lineHeight: '1.6', flex: 1 }}>
            {lang === 'pl' ? (
              <>
                <span style={{ fontWeight: 700 }}>Przy zamówieniu nie ponosisz żadnej opłaty!</span><br />
                Śmiało składaj zamówienie wraz ze swoim zdjęciem.
              </>
            ) : (
              <>
                <span style={{ fontWeight: 700 }}>No payment is required to place your order!</span><br />
                Go ahead and order with your photo.
              </>
            )}
          </p>
        </div>

        <div className={styles.progressWrap} ref={progressRef}>
          {t.order.steps.map((s, i) => {
            const n = (i + 1) as Step
            return (
              <div key={n} className={`${styles.progressItem} ${step === n ? styles.progressItemActive : ''}`}>
                <div className={`${styles.stepDot} ${step === n ? styles.stepDotActive : ''} ${step > n ? styles.stepDotDone : ''}`}>
                  {step > n ? '✓' : n}
                </div>
                <span className={styles.progressLabel}>{s}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.formBox}>
          {step === 1 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>{t.order.step1.title}</p>
              <div className={styles.cardTypesGrid}>
                {CARD_TYPES.map(c => (
                  <div key={c.id}
                    className={`${styles.cardTypeCard} ${cardType === c.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': c.accent } as React.CSSProperties}
                    onClick={() => setCardType(c.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setCardType(c.id)} aria-pressed={cardType === c.id}>
                    <div className={styles.themeAccentBar} />
                    <p className={styles.cardTypeName}>{c.label}</p>
                    <span className={styles.cardTypeDims}>{c.dims}</span>
                    <p className={styles.cardTypePriceRow}><span className={styles.cardTypePrice}>{c.price} zł</span></p>
                    <p className={styles.cardTypeDealRow}><span className={styles.cardTypeDeal}>🔥 {t.hero.badge1}</span></p>
                    <p className={styles.themeDesc}>{c.desc}</p>
                    {cardType === c.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              {cardType === 'laminated' && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginTop: '12px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {lang === 'pl'
                      ? '💡 Dostępne rozmiary: 55 × 85 mm lub 90 × 50 mm. Wybrany rozmiar napisz w komentarzu do zdjęcia w następnym kroku — jeśli nic nie napiszesz, ustalimy to z Tobą przed realizacją.'
                      : '💡 Available sizes: 55 × 85 mm or 90 × 50 mm. Note your preferred size in the photo comment in the next step — if you don\'t, we\'ll confirm it with you before production.'}
                  </p>
                </div>
              )}
              {cardType === 'pvc' && (
                <div
                  onClick={() => setNfcEnabled(v => !v)} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setNfcEnabled(v => !v)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid ${nfcEnabled ? 'var(--neon)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px', marginTop: '12px', cursor: 'pointer' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${nfcEnabled ? 'var(--neon)' : 'var(--border)'}`, background: nfcEnabled ? 'var(--neon)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {nfcEnabled && <span style={{ color: '#0a0014', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span>📲 {lang === 'pl' ? 'Dodaj programowanie NFC/RFID' : 'Add NFC/RFID programming'}</span>
                      <span className={styles.priceTagSm}>
                        +{NFC_PRICE_STANDARD} zł{lang === 'pl' ? '/kartę' : '/card'}
                      </span>
                      <span className={styles.priceTagSmSuccess}>
                        🔥 {NFC_PRICE_BULK} zł{lang === 'pl' ? ' przy 3+ szt.' : ' at 3+ cards'}
                      </span>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      {lang === 'pl'
                        ? 'Zbliżenie telefonu do karty błyskawicznie udostępni Twój Instagram, TikTok albo hasło do WiFi. Przy zamówieniu powyżej 3 kart cena spada do 8 zł/kartę.'
                        : 'Tapping a phone to the card instantly shares your Instagram, TikTok, or WiFi password. Orders above 3 cards drop to 8 zł/card.'}
                    </p>
                  </div>
                </div>
              )}
              {cardType === 'pvc' && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>
                    {lang === 'pl' ? '// wykończenie karty' : '// card finish'}
                  </p>
                  <div className={styles.backGrid}>
                    {CARD_FINISHES.map(f => (
                      <div key={f.id}
                        className={`${styles.backCard} ${cardFinish === f.id ? styles.backCardSelected : ''}`}
                        onClick={() => setCardFinish(f.id)} role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setCardFinish(f.id)} aria-pressed={cardFinish === f.id}>
                        <div className={styles.backCardTop}>
                          <p className={styles.backCardLabel}>{f.label}</p>
                          <span className={`${styles.backCardPrice} ${f.id === 'standard' ? styles.backCardPriceFree : ''}`}>
                            {f.id === 'standard' ? (lang === 'pl' ? 'Gratis' : 'Free')
                              : f.id === 'zestaw_promocyjny' ? `${f.price} zł${lang === 'pl' ? '/kpl.' : '/set'}`
                              : `+${f.price} zł`}
                          </span>
                        </div>
                        <p className={styles.backCardDesc}>{f.desc}</p>
                        {cardFinish === f.id && <span className={styles.themeCheck}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button className={styles.btnPrimary} onClick={() => setStep(2)}>{t.order.step1.next}</button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>{t.order.step2.title}</p>
              <div className={styles.themesGrid}>
                {FRONT_THEMES.map(th => (
                  <div key={th.id}
                    className={`${styles.themeCard} ${frontTheme === th.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': th.accent } as React.CSSProperties}
                    onClick={() => setFrontTheme(th.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setFrontTheme(th.id)} aria-pressed={frontTheme === th.id}>
                    <p className={styles.themeLabel}>{th.label}</p>
                    <p className={styles.themeDesc}>{th.desc}</p>
                    {frontTheme === th.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step2.frameColorEyebrow}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {FRAME_COLORS.map(c => (
                    <div key={c.id}
                      onClick={() => setFrameColor(c.id)} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setFrameColor(c.id)} aria-pressed={frameColor === c.id}
                      className={styles.swatchPill}
                      style={{
                        borderColor: frameColor === c.id ? c.hex : undefined,
                        background: frameColor === c.id ? `${c.hex}22` : undefined,
                      }}>
                      <span className={styles.swatchDot} style={{
                        background: c.hex,
                        boxShadow: `0 0 8px ${c.hex}aa`,
                        borderColor: frameColor === c.id ? '#fff' : undefined,
                      }} />
                      <span style={{ fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </div>
                  ))}
                </div>
                <div
                  onClick={() => setHoloEffect(v => !v)} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setHoloEffect(v => !v)}
                  aria-pressed={holoEffect}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid ${holoEffect ? 'var(--neon)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px', marginTop: '10px', cursor: 'pointer' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${holoEffect ? 'var(--neon)' : 'var(--border)'}`, background: holoEffect ? 'var(--neon)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {holoEffect && <span style={{ color: '#0a0014', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      ✨ {lang === 'pl' ? 'Efekt holograficzny' : 'Holographic effect'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {lang === 'pl' ? 'Ramka karty z połyskującym, holo wykończeniem' : "Card frame with a shimmering, holo finish"}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>
                  {lang === 'pl' ? '// podgląd karty' : '// card preview'}
                </p>
                <div
                  onContextMenu={e => e.preventDefault()}
                  style={{
                    position: 'relative', width: '100%',
                    maxWidth: frontTheme === 'custom' ? '360px' : '260px',
                    aspectRatio: frontTheme === 'custom' ? '1011 / 638' : '638 / 1011',
                    margin: '0 auto', borderRadius: '14px', overflow: 'hidden',
                    backgroundImage: `url(${(holoEffect ? CARD_PREVIEW_BG_HOLO[frontTheme] : CARD_PREVIEW_BG[frontTheme]) || CARD_PREVIEW_BG.techno_rave})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
                  } as React.CSSProperties}>
                  {photoPreview && (
                    <img src={photoPreview} alt="" draggable={false} onContextMenu={e => e.preventDefault()} style={{
                      position: 'absolute', objectFit: 'cover',
                      ...(frontTheme === 'custom'
                        ? { left: '14.4%', top: '21.6%', width: '79%', height: '48.3%' }
                        : { left: '5.96%', top: '10.5%', width: '87.9%', height: '60.2%' }),
                    }} />
                  )}
                  {frontTheme === 'custom' ? (
                    <>
                      <PreviewSlot top="6%" left="78%" width="12%" align="center" fontSize="10px" weight={800} value={form.cardYear || 'LN'} />
                      {form.attr1Label && <PreviewSlot top="14.9%" left="70%" width="17%" align="center" fontSize="7px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr1Label} />}
                      {form.attr1Value && <PreviewSlot top="14.9%" left="90%" width="19%" align="center" fontSize="7px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr1Value} />}
                      {form.attr2Label && <PreviewSlot top="71.8%" left="47%" width="17%" align="center" fontSize="7px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr2Label} />}
                      {form.cardName && <PreviewSlot top="86.7%" left="82%" width="22%" align="center" fontSize="9px" weight={800} value={form.cardName} />}
                    </>
                  ) : (
                    <>
                      <PreviewSlot top="7.4%" left="18.4%" width="20%" align="center" fontSize="13px" weight={800} value={form.cardYear || 'LN'} />
                      <PreviewSlot top="7.4%" left="82%" width="22%" align="center" fontSize="13px" weight={800} value={form.cardRarity || 'PN'} />
                      {form.cardName && <PreviewSlot top="75.2%" left="50%" width="87%" align="center" fontSize="12px" weight={800} value={form.cardName} />}
                      {form.attr1Label && <PreviewSlot top="82.8%" left="29.8%" width="44%" align="left" fontSize="9px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr1Label} />}
                      {form.attr1Value && <PreviewSlot top="82.8%" left="74.8%" width="36%" align="right" fontSize="9px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr1Value} />}
                      {form.cardSkill && <PreviewSlot top="88%" left="50%" width="89%" align="left" fontSize="9px" value={form.cardSkill} />}
                      {form.attr2Label && <PreviewSlot top="93.5%" left="29.8%" width="44%" align="left" fontSize="9px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr2Label} />}
                      {form.attr2Value && <PreviewSlot top="93.5%" left="74.8%" width="36%" align="right" fontSize="9px" color={FRONT_THEMES.find(th => th.id === frontTheme)?.accent} value={form.attr2Value} />}
                      {form.cardBottomText && <PreviewSlot top="98.2%" left="50%" width="90%" align="center" fontSize="7px" weight={500} color="#c9c6da" value={form.cardBottomText} />}
                    </>
                  )}
                  <div style={{
                    position: 'absolute', inset: 0, backgroundImage: PREVIEW_WATERMARK_BG,
                    backgroundRepeat: 'repeat', backgroundSize: '150px 81px', pointerEvents: 'none',
                  }} />
                </div>
                {frontTheme === 'custom' && (
                  <div style={{ marginTop: '12px', background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.4)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '12px', color: '#f59e0b', lineHeight: '1.6' }}>
                      {lang === 'pl' ? (
                        <>
                          <strong>To tylko przykład układu specjalnej karty</strong> — niestandardowy layout, sam pomysł na to, jak to może wyglądać. Twoja karta custom będzie inna, atrybuty niekoniecznie się pokryją. Dokładne wytyczne (co, gdzie, w jakim stylu) opisz w <strong>uwagach do zdjęcia / karty</strong> poniżej i dołącz opcjonalnie <strong>grafikę referencyjną</strong>.
                        </>
                      ) : (
                        <>
                          <strong>This is just an example layout for a special card</strong> — a custom design, just one idea of what it could look like. Your custom card will be different, and the attributes may not match at all. Describe exact guidelines (what, where, what style) in the <strong>photo/card notes</strong> below, and optionally attach a <strong>reference image</strong>.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 16px' }}>{t.order.step2.attrsEyebrow}</p>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.yearLabel}</label><input value={form.cardYear} onChange={e => setForm({...form, cardYear: e.target.value})} placeholder={t.order.step2.yearPlaceholder} /></div>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.rarityLabel}</label><input value={form.cardRarity} onChange={e => setForm({...form, cardRarity: e.target.value})} placeholder={t.order.step2.rarityPlaceholder} /></div>
                  <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>{t.order.step2.nameLabel}</label><input value={form.cardName} onChange={e => setForm({...form, cardName: e.target.value})} placeholder={t.order.step2.namePlaceholder} /></div>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.attr1LabelLabel}</label><input value={form.attr1Label} onChange={e => setForm({...form, attr1Label: e.target.value})} placeholder={t.order.step2.attr1LabelPlaceholder} /></div>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.attr1ValueLabel}</label><input value={form.attr1Value} onChange={e => setForm({...form, attr1Value: e.target.value})} placeholder={t.order.step2.attr1ValuePlaceholder} /></div>
                  <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>{t.order.step2.skillLabel}</label><input value={form.cardSkill} onChange={e => setForm({...form, cardSkill: e.target.value})} placeholder={t.order.step2.skillPlaceholder} /></div>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.attr2LabelLabel}</label><input value={form.attr2Label} onChange={e => setForm({...form, attr2Label: e.target.value})} placeholder={t.order.step2.attr2LabelPlaceholder} /></div>
                  <div className={styles.field}><label className={styles.label}>{t.order.step2.attr2ValueLabel}</label><input value={form.attr2Value} onChange={e => setForm({...form, attr2Value: e.target.value})} placeholder={t.order.step2.attr2ValuePlaceholder} /></div>
                  <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>{t.order.step2.bottomTextLabel}</label><input value={form.cardBottomText} onChange={e => setForm({...form, cardBottomText: e.target.value})} placeholder={t.order.step2.bottomTextPlaceholder} /></div>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step2.photoEyebrow} *</p>
                {!photo ? (
                  <div className={styles.dropZone} style={error === t.order.step5.errPhotoRequired ? { borderColor: 'var(--error)' } : undefined} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
                    <span className={styles.dropIcon}>↑</span>
                    <p className={styles.dropTitle}>{t.order.step2.dropTitle}</p>
                    <p className={styles.dropSub}>{t.order.step2.dropSub}</p>
                  </div>
                ) : (
                  <div className={styles.fileAdded}>
                    <span className={styles.fileIcon}>🖼</span>
                    <div className={styles.fileInfo}>
                      <p className={styles.fileAddedTitle}>{t.order.step2.fileAddedTitle}</p>
                      <p className={styles.fileName}>{photo.name}</p>
                    </div>
                    <button className={styles.fileRemove} onClick={() => { setPhoto(null); setPhotoPreview(null) }}>✕</button>
                  </div>
                )}
                {error === t.order.step5.errPhotoRequired && (
                  <p className={styles.errorMsg} style={{ marginTop: '8px' }}>{error}</p>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]) }} />
                <div className={styles.field} style={{ marginTop: '10px' }}>
                  <label className={styles.label}>{t.order.step2.photoCommentLabel} <span className={styles.optional}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t.order.step2.photoCommentPlaceholder} />
                </div>
              </div>

              {frontTheme === 'custom' && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: '#f59e0b', letterSpacing: '2px', margin: '0 0 12px' }}>{t.order.step2.customEyebrow}</p>
                  <button className={styles.btnSecondary} style={{ width: '100%', padding: '12px', fontSize: '13px' }} onClick={() => refFileFrontRef.current?.click()}>
                    {refFileFront ? `✓ ${refFileFront.name}` : t.order.step2.customBtnEmpty}
                  </button>
                  <input ref={refFileFrontRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileFront(e.target.files[0]) }} />
                  <div className={styles.field} style={{ marginTop: '10px' }}>
                    <label className={styles.label}>{t.order.step2.customDescLabel}</label>
                    <textarea value={form.customDesc} onChange={e => setForm({...form, customDesc: e.target.value})} placeholder={t.order.step2.customDescPlaceholder} />
                  </div>
                </div>
              )}

              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>{t.order.step2.back}</button>
                <button className={styles.btnPrimary} onClick={() => setStep(3)}>{t.order.step2.next}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>{t.order.step3.title}</p>
              <div className={styles.backGrid}>
                {BACK_OPTIONS.map((b, i) => (
                  <div key={b.id}
                    className={`${styles.backCard} ${backOption === b.id ? styles.backCardSelected : ''}`}
                    style={i === BACK_OPTIONS.length - 1 ? { gridColumn: '1 / -1' } : undefined}
                    onClick={() => setBackOption(b.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setBackOption(b.id)} aria-pressed={backOption === b.id}>
                    <div className={styles.backCardTop}>
                      <p className={styles.backCardLabel}>{b.label}</p>
                      <span className={`${styles.backCardPrice} ${b.price === 0 ? styles.backCardPriceFree : ''}`}>{b.price === 0 ? t.order.step3.freeLabel : `+${b.price} zł`}</span>
                    </div>
                    <p className={styles.backCardDesc}>{b.desc}</p>
                    {backOption === b.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              {backOption === 'logo' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>{lang === 'pl' ? 'Komentarz' : 'Comment'} <span className={styles.optional}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={lang === 'pl' ? 'Dodatkowa uwaga do logo (opcjonalnie)' : 'Any extra note about the logo (optional)'} />
                </div>
              )}

              {backOption === 'blank' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>{lang === 'pl' ? 'Komentarz' : 'Comment'} <span className={styles.optional}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={lang === 'pl' ? 'np. zostawcie karty zupełnie czyste, zbieramy podpisy ekipy...' : 'e.g. keep it completely blank, we\'re collecting signatures from the crew...'} />
                </div>
              )}

              {backOption === 'dedication' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>{t.order.step3.dedicationLabel}</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.dedicationPlaceholder} />
                </div>
              )}

              {backOption === 'qr' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>{t.order.step3.qrLabel}</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.qrPlaceholder} />
                  <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>{t.order.step3.qrNote}</p>
                </div>
              )}

              {backOption === 'custom_back' && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step3.customBackEyebrow}</p>
                  <button className={styles.btnSecondary} style={{ width: '100%', padding: '12px', fontSize: '13px' }} onClick={() => refFileBackRef.current?.click()}>
                    {refFileBack ? `✓ ${refFileBack.name}` : t.order.step3.customBackBtnEmpty}
                  </button>
                  <input ref={refFileBackRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileBack(e.target.files[0]) }} />
                  <div className={styles.field} style={{ marginTop: '10px' }}>
                    <label className={styles.label}>{t.order.step3.customBackCommentLabel}</label>
                    <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.customBackCommentPlaceholder} />
                  </div>
                </div>
              )}

              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(2)}>{t.order.step3.back}</button>
                <button className={styles.btnPrimary} onClick={() => setStep(4)}>{t.order.step3.next}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>{t.order.step4.title}</p>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {cardType === 'laminated'
                  ? (lang === 'pl' ? 'Ile zestawów wizytówek zamawiasz? Każdy zestaw to 100 sztuk.' : 'How many business card sets are you ordering? Each set is 100 pieces.')
                  : (lang === 'pl' ? 'Ile kart zamawiasz?' : 'How many cards are you ordering?')}
              </p>
              <div className={styles.quantityWrap}>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
              {hasDiscount && <div className={styles.discountBadge}>{t.order.step4.discountBadge(quantity)}</div>}
              {quantity === 2 && <div className={styles.discountHint}>{t.order.step4.discountHint}</div>}
              <div className={styles.priceSummary}>
                <p className={styles.summaryRow}><span>{t.order.step4.cardTypeLabel}</span><strong>{cardObj.label}</strong></p>
                {cardFinishId !== 'standard' && <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Wykończenie' : 'Finish'}</span><strong>{cardFinishObj.label}</strong></p>}
                <p className={styles.summaryRow}><span>{t.order.step4.themeLabel}</span><strong>{FRONT_THEMES.find(th=>th.id===frontTheme)?.label}</strong></p>
                <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Kolor ramki' : 'Frame color'}</span><strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: FRAME_COLORS.find(c=>c.id===frameColor)?.hex, flexShrink: 0 }} />{FRAME_COLORS.find(c=>c.id===frameColor)?.name}</strong></p>
                {holoEffect && <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Efekt holograficzny' : 'Holographic effect'}</span><strong>✨ {lang === 'pl' ? 'Tak' : 'Yes'}</strong></p>}
                <p className={styles.summaryRow}><span>{t.order.step4.backLabel}</span><strong>{backObj.label}</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.unitPriceLabel}</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                {hasDiscount && <p className={styles.summaryRow}><span>{t.order.step4.discountLabel}</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>}
                {nfcActive && <p className={styles.summaryRow}><span>{lang === 'pl' ? `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)` : `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
                {cardFinishAddonTotal > 0 && <p className={styles.summaryRow}><span>{cardFinishObj.label} ({quantity} × {cardFinishObj.price} zł)</span><strong>{cardFinishAddonTotal} zł</strong></p>}
                <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Wysyłka' : 'Shipping'}</span><strong>{SHIPPING_COST} zł</strong></p>
                <div className={styles.summaryTotal}><span>{t.order.step4.totalLabel}</span><strong className={styles.totalPrice}>{totalPrice} zł</strong></div>
                <p className={styles.summaryNote}>{t.order.step4.note}</p>
                <p className={styles.summaryNote}>{lang === 'pl' ? `Do ceny doliczamy stały koszt wysyłki: ${SHIPPING_COST} zł za zamówienie.` : `A flat shipping fee of ${SHIPPING_COST} zł is added to every order.`}</p>
              </div>
              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(3)}>{t.order.step4.back}</button>
                <button className={styles.btnPrimary} onClick={() => setStep(5)}>{t.order.step4.next}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>{t.order.step5.title}</p>
              <p style={{ margin: '-6px 0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {lang === 'pl' ? '* pola wymagane' : '* required fields'}
              </p>
              <div className={styles.fieldGrid}>
                <div className={styles.field}><label className={styles.label}>{t.order.step5.nameLabel}</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t.order.step5.namePlaceholder} /></div>
                <div className={styles.field}><label className={styles.label}>{t.order.step5.emailLabel}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder={t.order.step5.emailPlaceholder} /></div>
                <div className={styles.field}>
                  <label className={styles.label}>{lang === 'pl' ? 'Powtórz adres email *' : 'Confirm email address *'}</label>
                  <input
                    type="email"
                    value={form.emailConfirm}
                    onChange={e => setForm({ ...form, emailConfirm: e.target.value })}
                    onPaste={e => e.preventDefault()}
                    placeholder={lang === 'pl' ? 'Wpisz ponownie swój email' : 'Type your email again'}
                    style={{
                      borderColor: form.emailConfirm && form.email.trim().toLowerCase() !== form.emailConfirm.trim().toLowerCase()
                        ? 'var(--error)' : undefined,
                    }}
                  />
                  {form.emailConfirm && form.email.trim().toLowerCase() !== form.emailConfirm.trim().toLowerCase() && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--error)' }}>
                      {lang === 'pl' ? 'Adresy email nie są identyczne' : "Email addresses don't match"}
                    </p>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t.order.step5.phoneLabel}{deliveryMethod === 'paczkomat' ? ' *' : ''}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t.order.step5.phonePlaceholder} />
                  {deliveryMethod === 'paczkomat' && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
                      {lang === 'pl' ? 'InPost wysyła SMS-em kod odbioru paczki.' : 'InPost sends the pickup code by SMS.'}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step5.deliveryEyebrow}</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  {(['address', 'paczkomat'] as const).map(m => (
                    <div key={m}
                      onClick={() => setDeliveryMethod(m)} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setDeliveryMethod(m)} aria-pressed={deliveryMethod === m}
                      className={`${styles.toggleBtn} ${deliveryMethod === m ? styles.toggleBtnActive : ''}`}>
                      {m === 'address' ? `📍 ${t.order.step5.deliveryAddressOption}` : `📦 ${t.order.step5.deliveryParcelOption}`}
                    </div>
                  ))}
                </div>

                {deliveryMethod === 'address' ? (
                  <div className={styles.field}>
                    <label className={styles.label}>{t.order.step5.addressLabel}</label>
                    <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={t.order.step5.addressPlaceholder} />
                  </div>
                ) : (
                  <div className={styles.field}>
                    {paczkomatConfirmed && form.address ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--surface2)', border: '1px solid var(--neon)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)' }}>{t.order.step5.paczkomatSelected}</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>📦 {form.address}</p>
                        </div>
                        <button type="button" className={styles.btnSecondary} style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
                          onClick={() => { setPaczkomatConfirmed(false); setPaczkomatId(''); setForm({...form, address: ''}) }}>
                          {t.order.step5.paczkomatChange}
                        </button>
                      </div>
                    ) : process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ? (
                      <>
                        <label className={styles.label}>{t.order.step5.paczkomatPickLabel}</label>
                        <InpostGeowidget lang={lang} onSelect={p => { setPaczkomatId(p.id); setForm({...form, address: p.address}); setPaczkomatConfirmed(true) }} />
                      </>
                    ) : (
                      <>
                        <label className={styles.label}>{t.order.step5.paczkomatManualLabel}</label>
                        <InpostAutocomplete lang={lang} onSelect={p => { setPaczkomatId(p.id); setForm({...form, address: p.address}); setPaczkomatConfirmed(true) }} />
                        <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--neon2)', textDecoration: 'none' }}>
                          {t.order.step5.paczkomatMapLink}
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginTop: '8px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step5.discountEyebrow}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={discountCode} onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountMsg(null); setDiscountApplied(false); setDiscountPct(0) }} placeholder="" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px' }} disabled={discountApplied} />
                  <button onClick={applyDiscount} disabled={!discountCode.trim() || discountApplied} className={styles.btnSecondary} style={{ width: 'auto', padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}>{discountApplied ? t.order.step5.discountActive : t.order.step5.discountApply}</button>
                </div>
                {discountMsg && <p style={{ margin: '8px 0 0', fontSize: '12px', color: discountApplied ? 'var(--success)' : 'var(--error)' }}>{discountMsg}</p>}
              </div>

              <div className={styles.priceSummary} style={{ marginTop: '8px' }}>
                <p className={styles.summaryRow}><span>{cardObj.label}</span><strong>{effectiveCardTypePrice} zł</strong></p>
                {cardFinishId !== 'standard' && <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Wykończenie' : 'Finish'}</span><strong>{cardFinishObj.label}</strong></p>}
                <p className={styles.summaryRow}><span>{t.order.step4.backLabel} — {backObj.label}</span><strong>{backObj.price === 0 ? t.order.step3.freeLabel : `+${backObj.price} zł`}</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.unitPriceLabel}</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                {hasDiscount && <p className={styles.summaryRow}><span>{t.order.step5.quantityDiscountLabel}</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>}
                {discountApplied && <p className={styles.summaryRow}><span>{t.order.step5.codeDiscountLabel(discountCode.toUpperCase(), discountPct)}</span><strong className={styles.discount}>−{discountSaved} zł</strong></p>}
                {nfcActive && <p className={styles.summaryRow}><span>{lang === 'pl' ? `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)` : `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
                {cardFinishAddonTotal > 0 && <p className={styles.summaryRow}><span>{cardFinishObj.label} ({quantity} × {cardFinishObj.price} zł)</span><strong>{cardFinishAddonTotal} zł</strong></p>}
                <p className={styles.summaryRow}><span>{lang === 'pl' ? 'Wysyłka' : 'Shipping'}</span><strong>{SHIPPING_COST} zł</strong></p>
                <div className={styles.summaryTotal}><span>{t.order.step5.payLabel}</span><strong className={styles.totalPrice}>{totalPrice} zł</strong></div>
                <p className={styles.summaryNote}>{t.order.step5.payNote}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid ${agreed ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '14px', cursor: 'pointer' }} onClick={() => setAgreed(a => !a)}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${agreed ? 'var(--success)' : 'var(--border)'}`, background: agreed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all .15s' }}>
                  {agreed && <span style={{ color: '#0a0014', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {t.order.step5.agreePrefix} <a href="/regulamin" target="_blank" style={{ color: 'var(--neon)' }} onClick={e => e.stopPropagation()}>{t.order.step5.agreeRegulamin}</a> {t.order.step5.agreeAnd} <a href="/polityka-prywatnosci" target="_blank" style={{ color: 'var(--neon)' }} onClick={e => e.stopPropagation()}>{t.order.step5.agreePrivacy}</a> {t.order.step5.agreeSuffix}
                </p>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(4)}>{t.order.step5.back}</button>
                <button className={styles.btnPrimary} onClick={handleSubmit} disabled={sending || !agreed} style={{ opacity: !agreed ? 0.5 : 1 }}>
                  {sending ? t.order.step5.sending : t.order.step5.submit(totalPrice)}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <FaqReviews lang={lang} />

      <footer className={styles.footer}>
        <p className={styles.footerLogo}>RaveAdventure</p>
        <p className={styles.footerSub}>kontakt@raveadventure.pl</p>
        <div className={styles.footerLinks}>
          <a href="https://www.instagram.com/rave_adventure_pl/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Instagram</a>
          <span className={styles.footerDot}>·</span>
          <a href="https://www.facebook.com/raveadventurepl" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Facebook</a>
          <span className={styles.footerDot}>·</span>
          <a href="/regulamin" className={styles.footerLink}>{t.footer.regulamin}</a>
          <span className={styles.footerDot}>·</span>
          <a href="/polityka-prywatnosci" className={styles.footerLink}>{t.footer.polityka}</a>
          <span className={styles.footerDot}>·</span>
          <a href="/portfolio" className={styles.footerLink}>{t.footer.portfolio}</a>
        </div>
        <p className={styles.footerCopy}>{t.footer.copy}</p>
      </footer>
    </main>
  )
}
