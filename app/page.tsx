'use client'
import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from '../lib/supabase'
import { isSupabasePlaceholder, mockInsertOrder, mockUpdateOrder } from '../lib/ordersLocalMock'
import styles from './page.module.css'
import PortfolioCarousel from '../components/PortfolioCarousel'
import RealCardsSection from '../components/RealCardsSection'
import AdShowcase from '../components/AdShowcase'
import FaqReviews from '../components/FaqReviews'
import WhyUs from '../components/WhyUs'
import InpostGeowidget from '../components/InpostGeowidget'
import InpostAutocomplete from '../components/InpostAutocomplete'
import HeroCardAnimation from '../components/HeroCardAnimation'
import LogoEqualizer from '../components/LogoEqualizer'
import { T, CARD_TYPES_I18N, FRONT_THEMES_I18N, BACK_OPTIONS_I18N, CARD_FINISH_I18N, Lang } from '../lib/translations'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Baner promocyjny nad stroną — wyłączony między eventami. Włącz z powrotem (i zaktualizuj
// tekst/kod/datę) gdy ruszy kolejna promocja powiązana z festiwalem.
const SHOW_PROMO_BANNER = false

// "Pasek transparentności" (brief marketingowy) — aktualny czas przygotowania projektu,
// aktualizowany RĘCZNIE przez Michała w miarę zmian w kolejce (patrz FAQ „Ile czasu zajmuje
// realizacja?" w components/FaqReviews.tsx — te dwie liczby powinny być spójne).
const CURRENT_TURNAROUND_PL = '1–3 dni'
const CURRENT_TURNAROUND_EN = '1–3 days'

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
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [frontTheme, setFrontTheme] = useState('techno_rave')
  const [frameColor, setFrameColor] = useState('neon_purple')
  const [holoEffect, setHoloEffect] = useState(false)
  const [backOption, setBackOption] = useState('logo')
  const [deliveryMethod, setDeliveryMethod] = useState<'address' | 'paczkomat'>('address')
  // Kraj wysyłki — dodane 2026-08-02 na wyraźną prośbę Michała (wcześniej wysyłka tylko PL).
  // Wpływa na SHIPPING_COST niżej; przy zmianie na 'intl' czyścimy ewentualnie już wybrany polski
  // paczkomat (wyszukiwarka InPost, patrz niżej, obsługuje tylko polskie punkty).
  const [shippingRegion, setShippingRegion] = useState<'pl' | 'intl'>('pl')
  const [paczkomatId, setPaczkomatId] = useState('')
  // Osobna flaga potwierdzenia — inaczej "wybrany paczkomat" pokazywał się już po wpisaniu
  // pierwszej litery w polu tekstowym (form.address i paczkomatId były prawdziwe po 1 znaku).
  const [paczkomatConfirmed, setPaczkomatConfirmed] = useState(false)
  // Ilość liczona już w kroku 1 (nie osobno w kroku 4) — dla karty PVC klient może zamówić kilka
  // sztuk NARAZ w różnych wariantach wykończenia (np. 1x magnes + 2x Top Holder, część z NFC),
  // stąd rozbicie per wariant zamiast jednej wspólnej ilości. Wizytówka nie ma wykończeń, więc
  // zostaje przy prostym liczniku.
  const [finishBreakdown, setFinishBreakdown] = useState<Record<string, { qty: number; nfcQty: number }>>({ standard: { qty: 1, nfcQty: 0 } })
  const [laminatedQty, setLaminatedQty] = useState(1)

  // Zestaw Promocyjny to 1 "sztuka" w koszyku, ale fizycznie 2 karty (jedna luzem + jedna w Top
  // Holderze) — limit NFC musi liczyć fizyczne karty, nie pozycje w koszyku, inaczej przy 1x
  // Zestaw dałoby się dodać NFC tylko do jednej z dwóch kart w zestawie.
  const physicalCardsPerUnit = (id: string) => id === 'zestaw_promocyjny' ? 2 : 1
  const maxNfcForBlock = (id: string, qty: number) => qty * physicalCardsPerUnit(id)

  const updateFinishQty = (id: string, delta: number) => {
    setFinishBreakdown(prev => {
      const cur = prev[id] ?? { qty: 0, nfcQty: 0 }
      const qty = Math.max(0, cur.qty + delta)
      return { ...prev, [id]: { qty, nfcQty: Math.min(cur.nfcQty, maxNfcForBlock(id, qty)) } }
    })
  }
  const updateFinishNfcQty = (id: string, delta: number) => {
    setFinishBreakdown(prev => {
      const cur = prev[id] ?? { qty: 0, nfcQty: 0 }
      return { ...prev, [id]: { ...cur, nfcQty: Math.max(0, Math.min(maxNfcForBlock(id, cur.qty), cur.nfcQty + delta)) } }
    })
  }
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
  // "co możesz zamówić" — akordeon per-pozycja (nie sekcja jako całość): każda opcja to tylko
  // ikonka + napis, dopóki klient jej nie kliknie — docelowo dojdą tam też zdjęcia/modele
  // przykładowe, więc trzymanie wszystkiego zwiniętego domyślnie chroni przed rozdęciem sekcji.
  const [openOptionIdx, setOpenOptionIdx] = useState<number | null>(null)

  // Przycisk (i) przy blokach wyboru w formularzu (typ karty/motyw/rewers/wykończenie) skacze do
  // odpowiadającej pozycji w "co możesz zamówić" i od razu ją rozwija — zamiast każdy blok tłumaczyć
  // dwa razy (raz krótko w formularzu, raz szczegółowo w osobnej sekcji), formularz zostaje
  // maksymalnie zwięzły, a szczegóły są o jedno kliknięcie dalej.
  const jumpToOption = (idx: number) => {
    setOpenOptionIdx(idx)
    setTimeout(() => {
      document.getElementById(`option-item-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

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

  // Spójny reveal przy scrollu dla wszystkich głównych sekcji strony (każda oznaczona atrybutem
  // data-reveal) — zastępuje pojedynczy, ręczny IntersectionObserver, który wcześniej istniał
  // tylko w PortfolioCarousel.tsx (przeniesiony tam na osobny ScrollTrigger, bo dotyczy tylko
  // jednej karty, nie pasuje do batch()). useGSAP (nie zwykły useEffect) celowo — działa w
  // useLayoutEffect pod spodem, więc gsap.set() poniżej chowa sekcje PRZED pierwszym malowaniem
  // (bez tego byłby widoczny błysk w pełni widocznej treści przed ukryciem jej przez JS).
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]')
    gsap.set(targets, { opacity: 0, y: 28 })
    ScrollTrigger.batch(targets, {
      start: 'top 85%',
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out', overwrite: true }),
    })
    // Sekcje niżej (portfolio, opinie...) doczytują dane z Supabase asynchronicznie i mogą
    // zmienić wysokość po pierwszym pomiarze — odśwież progi triggerów, gdy strona w pełni
    // doładuje (obrazki, fetch), żeby "top 85%" nie było liczone względem nieaktualnego layoutu.
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
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
  // Wysyłka za granicę (kraje UE) — ustalone z Michałem 2026-08-02: cena ZASTĘPUJE, nie dolicza
  // się do, standardowych 15 zł. Paczkomat 40 zł / adres 80 zł — to najtańsze realne stawki, jakie
  // znalazł, więc nie są dowolne do zmiany bez konsultacji.
  const SHIPPING_COST_INTL_PACZKOMAT = 40
  const SHIPPING_COST_INTL_ADDRESS = 80
  const SHIPPING_COST = shippingRegion === 'intl'
    ? (deliveryMethod === 'paczkomat' ? SHIPPING_COST_INTL_PACZKOMAT : SHIPPING_COST_INTL_ADDRESS)
    : 15
  const NFC_PRICE_STANDARD = 15
  const NFC_PRICE_BULK = 8

  // Wykończenie karty — tylko dla PVC, i tylko tam ma sens rozbicie na kilka wariantów w jednym
  // zamówieniu (np. 1x magnes + 2x Top Holder, część z NFC). Wizytówka nie ma wykończeń ani NFC,
  // więc zostaje przy prostym liczniku (laminatedQty). "zestaw_promocyjny" zastępuje bazową cenę
  // karty (płynie przez rabat ilościowy jak zwykła cena); pozostałe warianty to dopłata per sztuka
  // liczona OSOBNO od rabatu ilościowego, dokładnie jak NFC/RFID (patrz CARD_FINISH_I18N w lib/translations.tsx).
  const activeFinishLines = cardType === 'pvc'
    ? CARD_FINISHES
        .map(f => ({ finish: f, ...(finishBreakdown[f.id] ?? { qty: 0, nfcQty: 0 }) }))
        .filter(l => l.qty > 0)
    : []

  const quantity = cardType === 'pvc' ? activeFinishLines.reduce((s, l) => s + l.qty, 0) : laminatedQty
  const nfcTotalQty = activeFinishLines.reduce((s, l) => s + l.nfcQty, 0)
  const nfcUnitPrice = quantity > 3 ? NFC_PRICE_BULK : NFC_PRICE_STANDARD
  const nfcTotal = nfcTotalQty * nfcUnitPrice
  const nfcActive = nfcTotalQty > 0

  let rawBaseTotal = 0
  let cardFinishAddonTotal = 0
  if (cardType === 'pvc') {
    for (const l of activeFinishLines) {
      const isZestaw = l.finish.id === 'zestaw_promocyjny'
      const blockBasePrice = isZestaw ? l.finish.price : cardObj.price
      rawBaseTotal += (blockBasePrice + backObj.price) * l.qty
      if (!isZestaw && l.finish.id !== 'standard') cardFinishAddonTotal += l.finish.price * l.qty
    }
  } else {
    rawBaseTotal = (cardObj.price + backObj.price) * quantity
  }
  const unitPrice = quantity > 0 ? Math.round(rawBaseTotal / quantity) : 0

  // card_finish/card_finish_breakdown zapisywane do zamówienia: card_finish zostaje pojedynczą
  // wartością (wsteczna kompatybilność z adminem/mailami) — 'mixed' gdy klient wybrał więcej niż
  // jeden wariant wykończenia naraz, wtedy prawdziwy szczegół żyje w card_finish_breakdown (JSON).
  const cardFinishSummary = cardType === 'pvc'
    ? (activeFinishLines.length === 1 ? activeFinishLines[0].finish.id : activeFinishLines.length > 1 ? 'mixed' : 'standard')
    : 'standard'
  const cardFinishBreakdownForDb = cardType === 'pvc' && activeFinishLines.length > 0
    ? activeFinishLines.map(l => ({ finish: l.finish.id, qty: l.qty, nfc_qty: l.nfcQty }))
    : null

  const QUANTITY_DISCOUNT_RATE = 0.35 // -35% rabat ilościowy przy 3+ sztukach (obniżone z -50%, bo przy tamtej stawce zamówienia 3+ szt. wychodziły na zero/stratę — patrz BOM kosztów)
  const hasDiscount = quantity >= 3
  const baseTotal = hasDiscount ? Math.round(rawBaseTotal * (1 - QUANTITY_DISCOUNT_RATE)) : rawBaseTotal
  const savedAmount = hasDiscount ? Math.round(rawBaseTotal * QUANTITY_DISCOUNT_RATE) : 0
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
    if ((deliveryMethod === 'paczkomat' || shippingRegion === 'intl') && !form.phone.trim()) { setError(t.order.step5.errPhoneRequired); return }
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
        nfc_enabled: nfcActive, nfc_price: nfcUnitPrice, nfc_qty: nfcTotalQty,
        card_finish: cardFinishSummary, card_finish_breakdown: cardFinishBreakdownForDb,
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
        shipping_region: shippingRegion, shipping_cost: SHIPPING_COST,
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
          const fileName = `orders/${orderData.id.slice(0, 8)}/front.${safeExt}`
          // upsert:false (nie upsert:true) — ścieżka zawiera świeże ID zamówienia, więc plik nigdy
          // nie istnieje wcześniej; upsert:true wymagałby dodatkowo uprawnienia UPDATE w Storage,
          // którego klucz anon celowo nie ma od blokady RLS (patrz CLAUDE.md) — z upsert:true ten
          // upload kończył się cichym błędem 403 i zamówienie zostawało bez zdjęcia.
          const { error: uploadError } = await supabase.storage.from('order-photos').upload(fileName, photo, { upsert: false })
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
          await supabase.storage.from('order-photos').upload(`orders/${orderData.id.slice(0, 8)}/custom.${safeExt}`, refFileFront, { upsert: false })
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
          await supabase.storage.from('order-photos').upload(`orders/${orderData.id.slice(0, 8)}/ref-back.${safeExt}`, refFileBack, { upsert: false })
        }
      }

      await fetch('/api/send-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, address: form.address, deliveryMethod, paczkomatId, shippingRegion, shippingCost: SHIPPING_COST, cardText: form.notesBack, notes: form.notes,
          theme: frontTheme, orderId: orderData?.id, cardType, backOption, quantity, unitPrice, totalPrice, hasDiscount, savedAmount,
          nfcEnabled: nfcActive, nfcPrice: nfcUnitPrice, nfcQty: nfcTotalQty, cardFinish: cardFinishSummary, cardFinishBreakdown: cardFinishBreakdownForDb,
          cardYear: form.cardYear, cardRarity: form.cardRarity, cardName: form.cardName,
          attr1Label: form.attr1Label, attr1Value: form.attr1Value, cardSkill: form.cardSkill,
          attr2Label: form.attr2Label, attr2Value: form.attr2Value, cardDesc: form.cardDesc, cardBottomText: form.cardBottomText, frameColor, holoEffect, notesBack: form.notesBack,
          lang,
        }),
      })

      // Kopia zamówienia jako .txt w Storage (orders/{id8}/), obok zdjęcia — ten sam plik co
      // ręczny eksport z panelu (patrz CLAUDE.md). Nie blokuje ani nie psuje potwierdzenia
      // zamówienia, jeśli się nie uda — to wygoda dla panelu, nie krok krytyczny dla klienta.
      if (!localMock && orderData?.id) {
        fetch('/api/generate-order-txt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.id }),
        }).catch(() => {})
      }

      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'pl' ? 'Nieznany błąd' : 'Unknown error')
      setError(t.order.step5.errGeneric(msg))
    } finally { setSending(false) }
  }

  // Klasy Tailwind współdzielone przez wszystkie 5 kroków formularza zamówienia — trzymane jako
  // stałe zamiast powtarzania tego samego długiego stringa w każdym kroku (patrz redesign Faza 2).
  const formStepCls = 'flex flex-col gap-5'
  const formStepTitleCls = 'font-heading text-[15px] font-bold text-primary tracking-[0.2px]'
  const sectionEyebrowCls = 'font-mono text-[11px] text-primary tracking-[2px] mb-2.5'
  const btnPrimaryCls = 'py-3 px-7 bg-[linear-gradient(135deg,var(--neon),#a855f7)] text-[#0a0014] text-sm font-bold rounded-[9px] transition-all duration-200 shadow-[0_3px_14px_-4px_rgba(180,77,255,0.5)] enabled:hover:shadow-[0_5px_20px_-4px_rgba(180,77,255,0.7)] enabled:hover:-translate-y-px enabled:active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
  const btnSecondaryCls = 'py-3 px-6 bg-[var(--surface2)] border border-border text-muted-foreground text-sm font-medium rounded-[9px] transition-all duration-200 hover:border-primary hover:text-foreground hover:-translate-y-px active:translate-y-0'
  const formButtonsCls = 'flex gap-3 justify-end mt-2'
  const errorMsgCls = 'text-[13px] text-[var(--error)] py-2.5 px-3.5 border border-[rgba(255,77,109,0.3)] rounded-lg bg-[rgba(255,77,109,0.06)]'
  const fieldCls = 'flex flex-col gap-1.5'
  const fieldGridCls = 'grid grid-cols-2 gap-4 max-md:grid-cols-1'
  const fieldFullCls = 'col-span-full'
  const labelCls = 'text-[13px] text-muted-foreground font-medium'
  const optionalCls = 'text-[var(--text-faint)] font-normal'
  const summaryRowCls = 'flex justify-between text-sm text-muted-foreground [&>strong]:text-foreground'
  const toggleBtnCls = 'flex-1 py-3 px-3.5 rounded-[var(--radius-lg)] cursor-pointer text-center border-[1.5px] border-border bg-[var(--surface2)] text-[13px] font-semibold text-foreground transition-all duration-200 hover:border-[color-mix(in_srgb,var(--neon)_50%,var(--border))] hover:-translate-y-px'

  const LangSwitch = () => (
    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '22px', padding: '3px' }}>
      <button
        onClick={() => setLang('pl')}
        style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: lang === 'pl' ? '#b44dff' : 'transparent', color: lang === 'pl' ? '#0a0014' : 'rgba(240,238,255,0.5)' }}
        aria-pressed={lang === 'pl'}
      >
        PL
      </button>
      <button
        onClick={() => setLang('en')}
        style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: lang === 'en' ? '#b44dff' : 'transparent', color: lang === 'en' ? '#0a0014' : 'rgba(240,238,255,0.5)' }}
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
          <button className={styles.btnPrimary} onClick={() => { setSent(false); setStep(1); setForm({ name:'',email:'',emailConfirm:'',phone:'',address:'',notesBack:'',customDesc:'',notes:'',cardYear:'',cardRarity:'',cardName:'',attr1Label:'',attr1Value:'',cardSkill:'',attr2Label:'',attr2Value:'',cardDesc:'',cardBottomText:'' }); setPhoto(null); setPhotoPreview(null); setRefFileFront(null); setRefFileBack(null); setFinishBreakdown({ standard: { qty: 1, nfcQty: 0 } }); setLaminatedQty(1); setHoloEffect(false); setFrameColor('neon_purple'); setDeliveryMethod('address'); setPaczkomatId(''); setPaczkomatConfirmed(false); setAgreed(false); setDiscountCode(''); setDiscountApplied(false); setDiscountPct(0); setDiscountMsg(null) }}>
            {t.sent.newOrder}
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className={styles.main}>
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-[5vw] py-4 max-md:px-[4vw] max-md:py-2.5 bg-[rgba(8,8,16,0.72)] backdrop-blur-[16px] border-b border-border shadow-[0_1px_0_rgba(180,77,255,0.08)]">
        <span className="font-heading text-lg max-md:text-[15px] font-bold text-foreground tracking-[-0.3px]">Rave<span className="text-primary">Adventure</span></span>
        <div className="flex items-center gap-3.5">
          <LangSwitch />
          <a href="#order" className="text-[13px] max-md:text-xs font-semibold py-[9px] px-5 max-md:py-[7px] max-md:px-3.5 max-md:whitespace-nowrap border border-primary rounded-lg text-primary transition-all duration-200 hover:bg-[var(--neon-dim)] hover:shadow-[var(--glow-neon)] hover:-translate-y-px active:translate-y-0">{t.nav.orderCta}</a>
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
        className="flex items-center justify-center gap-3.5 flex-wrap bg-[linear-gradient(90deg,rgba(180,77,255,0.14),rgba(0,240,255,0.10))] border-b border-[rgba(180,77,255,0.25)] py-2.5 px-[5vw]"
        style={{ marginTop: SHOW_PROMO_BANNER ? undefined : `${navHeight}px` }}
      >
        <span className="text-[13px] font-semibold text-foreground">
          {lang === 'pl' ? 'Zapraszamy na nasze sociale' : 'Follow us on social media'}
        </span>
        <span className="flex items-center gap-2.5">
          <a href="https://www.instagram.com/rave_adventure_pl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center w-11 h-11">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b44dff" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.3" cy="6.7" r="1.1" fill="#b44dff" stroke="none" />
            </svg>
          </a>
          <a href="https://www.facebook.com/raveadventurepl" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex items-center justify-center w-11 h-11">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M13.8 21v-7.2h2.4l.4-2.8h-2.8v-1.8c0-.8.2-1.4 1.4-1.4h1.5V5.3C16.2 5.2 15.3 5 14.3 5c-2.1 0-3.5 1.3-3.5 3.6v2.4H8.4v2.8h2.4V21" fill="none" />
            </svg>
          </a>
        </span>
        <span className="text-[rgba(240,238,255,0.2)]">|</span>
        <span className="text-xs text-[rgba(240,238,255,0.6)]">
          ⏱ {lang === 'pl' ? 'Aktualny czas realizacji' : 'Current turnaround'}: <strong className="text-foreground">{lang === 'pl' ? CURRENT_TURNAROUND_PL : CURRENT_TURNAROUND_EN}</strong>
        </span>
      </div>

      <nav className="flex justify-center flex-wrap gap-2 py-3.5 px-[5vw] max-w-[1100px] mx-auto" aria-label={lang === 'pl' ? 'Szybka nawigacja' : 'Quick navigation'}>
        {[
          { href: '#realizacje', label: lang === 'pl' ? 'Realizacje' : 'Portfolio' },
          { href: '#prawdziwe-karty', label: lang === 'pl' ? 'Prawdziwy produkt' : 'Real product' },
          { href: '#dlaczego-my', label: lang === 'pl' ? 'Dlaczego my' : 'Why us' },
          { href: '#jak-zamowic', label: lang === 'pl' ? 'Jak to działa' : 'How it works' },
          { href: '#order', label: lang === 'pl' ? 'Zamówienie' : 'Order' },
          { href: '#faq-opinie', label: lang === 'pl' ? 'FAQ i opinie' : 'FAQ & reviews' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="text-[12.5px] font-bold text-primary py-[7px] px-4 rounded-full border border-[rgba(180,77,255,0.45)] bg-[var(--neon-dim)] no-underline whitespace-nowrap transition-all duration-150 hover:text-primary-foreground hover:border-primary hover:bg-primary hover:shadow-[0_0_16px_rgba(180,77,255,0.4)] active:scale-95"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.hero.eyebrow}</p>
          <h1 className={styles.heroTitle}>
            {t.hero.title1}<br />
            <span className={styles.neon}>{t.hero.title2}</span>
          </h1>
          <p className={styles.heroSub}>{t.hero.sub}</p>

          <div style={{ marginTop: '28px' }}>
            <HeroCardAnimation lang={lang} />
          </div>

          {/* CTA tuż pod animacją (nie oddzielone innym blokiem) — prosta ścieżka wzroku:
              animacja → przycisk → formularz, patrz brief marketingowy. */}
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <a href="#order" className={styles.btnHero}>{t.hero.cta}</a>
            <a href="#realizacje" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{t.hero.ctaSecondary}</a>
          </div>

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
        </div>
      </section>

      {/* Wordmark + LogoEqualizer + tagline — świadomie umieszczone PO Hero (nie przed nim),
          żeby prawdziwy H1/CTA był pierwszą rzeczą, jaką widzi odwiedzający (priorytet #1 briefu
          marketingowego), nie zablokowany przez dekoracyjny "billboard" z nazwą marki. Sama
          treść/animacja LogoEqualizer zostaje nietknięta — to świadomy element z osobistym
          znaczeniem (fale/equalizer/karta/strzałka), tylko zmieniona pozycja w kolejności strony. */}
      <div className={styles.brandWrap}>
        <p className={`${styles.brandName} ${styles.shimmer}`}>Rave Adventure</p>
        <LogoEqualizer />
        <p className={`${styles.brandTagline} ${styles.shimmer}`}>{t.hero.brandTagline}</p>
      </div>

      <AdShowcase lang={lang} />
      <PortfolioCarousel lang={lang} />
      <RealCardsSection lang={lang} />

      <WhyUs lang={lang} />

      <section className={styles.section} id="jak-zamowic" data-reveal>
        <div className={styles.mobileCollapse}>
          <button type="button" className={styles.mobileCollapseSummary} onClick={() => setHowItWorksOpen(o => !o)}>
            <p className={styles.sectionEye} style={{ margin: 0 }}>{t.howItWorks.eyebrow}</p>
            <span className={styles.collapseIcon} style={{ transform: howItWorksOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          <div className={`${styles.mobileCollapseBody} ${howItWorksOpen ? styles.mobileCollapseBodyOpen : ''}`}>
            <div className={styles.mobileCollapseBodyInner}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5 mb-6">
                {t.howItWorks.steps.map(s => (
                  <div key={s.n} className="glassPanel rounded-[10px] px-3.5 py-3">
                    <span className="font-heading text-[11px] font-bold text-primary tracking-[1px]">{s.n}</span>
                    <p className="mt-[5px] mb-0.5 text-xs font-semibold text-foreground">{s.t}</p>
                    <p className="m-0 text-[11px] text-muted-foreground leading-[1.5]">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className={styles.sectionEye} style={{ margin: '0 0 12px' }}>{t.options.eyebrow}</p>
          <Accordion
            type="single"
            collapsible
            className="flex flex-col gap-2"
            value={openOptionIdx !== null ? String(openOptionIdx) : ''}
            onValueChange={v => setOpenOptionIdx(v === '' ? null : Number(v))}
          >
            {[
              ...t.options.cards,
              {
                icon: '📲',
                title: lang === 'pl' ? 'Karta z NFC/RFID' : 'NFC/RFID Card',
                desc: lang === 'pl'
                  ? 'Chcesz, żeby Twoja karta robiła coś więcej niż tylko dobrze wyglądała? Zaprogramuj wbudowany chip NFC — wystarczy zbliżyć telefon, żeby błyskawicznie udostępnić Twój Instagram, TikTok albo hasło do WiFi na imprezie. Bez wpisywania, bez szukania — jeden dotyk.'
                  : 'Want your card to do more than just look good? Program the built-in NFC chip — one tap of a phone instantly shares your Instagram, TikTok, or the WiFi password at your party. No typing, no searching — just a tap.',
                tags: ['NFC', 'RFID'],
                priceTag: '+15 zł',
              },
            ].map((o, i) => (
              <AccordionItem
                key={i}
                id={`option-item-${i}`}
                value={String(i)}
                className="glassPanel rounded-[10px] overflow-hidden [scroll-margin-top:var(--nav-height,70px)] px-3.5 py-1 not-last:border-b-0"
              >
                <AccordionTrigger className="gap-2.5 text-[13px] font-semibold text-foreground hover:no-underline focus-visible:ring-0 **:data-[slot=accordion-trigger-icon]:text-primary">
                  <span className="text-[17px] shrink-0">{o.icon}</span>
                  <span className="flex-1">{o.title}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-3.5 text-xs text-muted-foreground leading-[1.6]">
                  <p className="mb-2 text-xs text-muted-foreground leading-[1.6]">{o.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {o.tags.map(tag => (
                      <span key={tag} className="text-[10px] py-[3px] px-2.5 rounded-full bg-white/5 border border-border text-muted-foreground">{tag}</span>
                    ))}
                    {'priceTag' in o && o.priceTag && <span className={styles.priceTagSm}>{o.priceTag}</span>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="glassPanel rounded-[10px] mt-2.5 px-3.5 py-3 flex gap-2.5 items-start">
            <span className="text-sm shrink-0">⚙</span>
            <p className="m-0 text-[11px] text-muted-foreground leading-[1.6]">{t.options.attrNote}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} id="order" data-reveal>
        <p className={styles.sectionEye}>{t.order.eyebrow}</p>
        <h2 className={styles.sectionTitle}>{t.order.title}</h2>

        <div className="max-w-[620px] mx-auto mb-6 bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.3)] rounded-[var(--radius-lg)] py-3.5 px-5 flex items-center gap-3.5 text-left">
          <div className="relative w-[42px] h-[42px] rounded-full border-[2.5px] border-[#00e5a0] flex items-center justify-center shrink-0">
            <span className="text-[13px] font-extrabold text-white tracking-[-1px]">$$</span>
            <div className="absolute top-1/2 -left-[3px] -right-[3px] h-[2.5px] bg-[#00e5a0] rotate-[-35deg]" />
          </div>
          <p className="m-0 text-[13px] text-[#00e5a0] leading-[1.6] flex-1">
            {lang === 'pl' ? (
              <>
                <span className="font-bold">Przy zamówieniu nie ponosisz żadnej opłaty!</span><br />
                Śmiało składaj zamówienie wraz ze swoim zdjęciem.
              </>
            ) : (
              <>
                <span className="font-bold">No payment is required to place your order!</span><br />
                Go ahead and order with your photo.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-7 max-w-[680px] mx-auto" ref={progressRef}>
          {t.order.steps.map((s, i) => {
            const n = (i + 1) as Step
            return (
              <div key={n} className={`flex items-center gap-[7px] py-[5px] pl-[5px] pr-3.5 rounded-full flex-none bg-[var(--surface2)] border border-border transition-colors duration-200 ${step === n ? '!border-primary bg-[var(--neon-dim)]' : ''}`}>
                <div className={`w-6 h-6 rounded-full border border-border bg-[var(--surface)] flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0 transition-all duration-200 ${step === n ? 'border-primary text-primary bg-[var(--neon-dim)] shadow-[var(--glow-neon)]' : ''} ${step > n ? 'border-[var(--success)] text-primary-foreground bg-[var(--success)] shadow-[0_0_16px_rgba(0,229,160,0.4)]' : ''}`}>
                  {step > n ? '✓' : n}
                </div>
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{s}</span>
              </div>
            )
          })}
        </div>

        <div className="bg-[var(--glass-bg)] backdrop-blur-[14px] rounded-[var(--radius-lg)] p-8 max-w-[680px] mx-auto max-md:p-5">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <p className="font-heading text-[15px] font-bold text-primary tracking-[0.2px]">{t.order.step1.title}</p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 mb-3">
                {CARD_TYPES.map(c => (
                  <div key={c.id}
                    className={`${styles.cardTypeCard} ${cardType === c.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': c.accent } as React.CSSProperties}
                    onClick={() => setCardType(c.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setCardType(c.id)} aria-pressed={cardType === c.id}>
                    <button type="button" className="absolute top-3.5 left-3.5 w-5 h-5 rounded-full bg-[var(--surface2)] border border-border text-muted-foreground flex items-center justify-center text-[11px] font-bold italic [font-family:Georgia,serif] cursor-pointer z-[2] transition-colors duration-150 hover:border-primary hover:text-primary hover:shadow-[0_0_10px_rgba(180,77,255,0.4)]" onClick={e => { e.stopPropagation(); jumpToOption(0) }} aria-label={lang === 'pl' ? 'Więcej informacji' : 'More info'}>i</button>
                    <div className={styles.themeAccentBar} />
                    <p className={styles.cardTypeName}>{c.label}</p>
                    <span className={styles.cardTypeDims}>{c.dims}</span>
                    <p className={styles.cardTypePriceRow}><span className={styles.cardTypePrice}>{c.price} zł</span></p>
                    <p className={styles.cardTypeDealRow}><span className={styles.cardTypeDeal}>🔥 {t.hero.badge1}</span></p>
                    {cardType === c.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              {cardType === 'laminated' && (
                <>
                  <div className="bg-[var(--surface2)] border border-border rounded-[var(--radius-lg)] p-4 mt-3">
                    <p className="m-0 text-xs text-muted-foreground leading-[1.6]">
                      {lang === 'pl'
                        ? '💡 Dostępne rozmiary: 55 × 85 mm lub 90 × 50 mm. Wybrany rozmiar napisz w komentarzu do zdjęcia w następnym kroku — jeśli nic nie napiszesz, ustalimy to z Tobą przed realizacją.'
                        : '💡 Available sizes: 55 × 85 mm or 90 × 50 mm. Note your preferred size in the photo comment in the next step — if you don\'t, we\'ll confirm it with you before production.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className={sectionEyebrowCls}>
                      {lang === 'pl' ? '// ile zestawów' : '// how many sets'}
                    </p>
                    <div className="flex items-center gap-5 justify-start">
                      <button className="w-11 h-11 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[22px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono hover:border-primary hover:text-primary hover:shadow-[var(--glow-neon)] active:scale-[0.94]" onClick={() => setLaminatedQty(q => Math.max(1, q - 1))}>−</button>
                      <span className="font-heading text-4xl font-bold text-foreground min-w-[60px] text-center">{laminatedQty}</span>
                      <button className="w-11 h-11 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[22px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono hover:border-primary hover:text-primary hover:shadow-[var(--glow-neon)] active:scale-[0.94]" onClick={() => setLaminatedQty(q => q + 1)}>+</button>
                    </div>
                  </div>
                </>
              )}
              {cardType === 'pvc' && (
                <div className="mt-4">
                  <p className={sectionEyebrowCls}>
                    {lang === 'pl' ? '// ile kart i w jakim wykończeniu' : '// how many cards, and which finish'}
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 mb-5">
                    {CARD_FINISHES.map(f => {
                      const bd = finishBreakdown[f.id] ?? { qty: 0, nfcQty: 0 }
                      return (
                        <div key={f.id} className="glassPanel rounded-[var(--radius-lg)] p-4 relative transition-all duration-200 cursor-default hover:border-[rgba(180,77,255,0.45)] hover:-translate-y-[3px] hover:shadow-[var(--glass-shadow),var(--glow-neon)]">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="flex items-center gap-1.5 min-w-0">
                              {f.id !== 'standard' && (
                                <button type="button" className="w-[18px] h-[18px] rounded-full shrink-0 bg-[var(--surface2)] border border-border text-muted-foreground inline-flex items-center justify-center text-[10px] font-bold italic [font-family:Georgia,serif] cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary hover:shadow-[0_0_8px_rgba(180,77,255,0.4)]" onClick={() => jumpToOption(f.id === 'zestaw_promocyjny' ? 6 : 5)} aria-label={lang === 'pl' ? 'Więcej informacji' : 'More info'}>i</button>
                              )}
                              <p className="m-0 text-sm font-semibold text-foreground">{f.label}</p>
                            </span>
                            <span className={`font-heading text-[13px] font-bold rounded-full py-[3px] px-3 whitespace-nowrap inline-block ${f.id === 'standard' ? 'text-[var(--success)] bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.35)]' : 'text-primary bg-[var(--neon-dim)] border border-[color-mix(in_srgb,var(--neon)_35%,transparent)]'}`}>
                              {f.id === 'standard' ? (lang === 'pl' ? 'Gratis' : 'Free')
                                : f.id === 'zestaw_promocyjny' ? `${f.price} zł${lang === 'pl' ? '/kpl.' : '/set'}`
                                : `+${f.price} zł`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-2.5">
                            <button className="w-7 h-7 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[15px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono shrink-0 enabled:hover:border-primary enabled:hover:text-primary enabled:active:scale-[0.94] disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => updateFinishQty(f.id, -1)} disabled={bd.qty === 0}>−</button>
                            <span className="font-heading text-base font-bold text-foreground min-w-5 text-center">{bd.qty}</span>
                            <button className="w-7 h-7 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[15px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono shrink-0 enabled:hover:border-primary enabled:hover:text-primary enabled:active:scale-[0.94] disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => updateFinishQty(f.id, 1)}>+</button>
                          </div>
                          {bd.qty > 0 && (
                            <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-border">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">📲 NFC</span>
                              <button className="w-7 h-7 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[15px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono shrink-0 enabled:hover:border-primary enabled:hover:text-primary enabled:active:scale-[0.94] disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => updateFinishNfcQty(f.id, -1)} disabled={bd.nfcQty === 0}>−</button>
                              <span className="font-heading text-base font-bold text-foreground min-w-5 text-center">{bd.nfcQty}</span>
                              <button className="w-7 h-7 rounded-full bg-[var(--surface2)] border border-border text-foreground text-[15px] cursor-pointer flex items-center justify-center transition-all duration-200 font-mono shrink-0 enabled:hover:border-primary enabled:hover:text-primary enabled:active:scale-[0.94] disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => updateFinishNfcQty(f.id, 1)} disabled={bd.nfcQty >= maxNfcForBlock(f.id, bd.qty)}>+</button>
                              <span className={styles.priceTagSm}>+{nfcUnitPrice} zł{lang === 'pl' ? '/kartę' : '/card'}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {quantity === 0 && (
                    <p className={`${errorMsgCls} mt-2.5`}>
                      {lang === 'pl' ? 'Wybierz co najmniej jedną kartę (kliknij + przy dowolnym wariancie).' : 'Select at least one card (click + on any variant).'}
                    </p>
                  )}
                </div>
              )}
              <button className={btnPrimaryCls} onClick={() => setStep(2)} disabled={cardType === 'pvc' && quantity === 0}>{t.order.step1.next}</button>
            </div>
          )}

          {step === 2 && (
            <div className={formStepCls}>
              <p className={formStepTitleCls}>{t.order.step2.title}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {FRONT_THEMES.map(th => (
                  <div key={th.id}
                    className={`${styles.themeCard} ${frontTheme === th.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': th.accent } as React.CSSProperties}
                    onClick={() => setFrontTheme(th.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setFrontTheme(th.id)} aria-pressed={frontTheme === th.id}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <button type="button" className="mt-0.5 w-[18px] h-[18px] rounded-full shrink-0 bg-[var(--surface2)] border border-border text-muted-foreground inline-flex items-center justify-center text-[10px] font-bold italic [font-family:Georgia,serif] cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary hover:shadow-[0_0_8px_rgba(180,77,255,0.4)]" onClick={e => { e.stopPropagation(); jumpToOption(th.id === 'custom' ? 2 : 1) }} aria-label={lang === 'pl' ? 'Więcej informacji' : 'More info'}>i</button>
                      <p className="font-heading text-base font-bold text-foreground m-0 tracking-[-0.1px] pr-[26px] leading-[1.25]">{th.label}</p>
                    </div>
                    {frontTheme === th.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className={sectionEyebrowCls}>{t.order.step2.frameColorEyebrow}</p>
                <div className="flex flex-wrap gap-2.5">
                  {FRAME_COLORS.map(c => (
                    <div key={c.id}
                      onClick={() => setFrameColor(c.id)} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setFrameColor(c.id)} aria-pressed={frameColor === c.id}
                      className="flex items-center gap-2 py-[7px] pr-3 pl-2 rounded-full cursor-pointer bg-[var(--surface2)] border-[1.5px] border-border transition-all duration-150 hover:-translate-y-px"
                      style={{
                        borderColor: frameColor === c.id ? c.hex : undefined,
                        background: frameColor === c.id ? `${c.hex}22` : undefined,
                      }}>
                      <span className="w-5 h-5 rounded-full shrink-0 border-2 border-[rgba(255,255,255,0.15)]" style={{
                        background: c.hex,
                        boxShadow: `0 0 8px ${c.hex}aa`,
                        borderColor: frameColor === c.id ? '#fff' : undefined,
                      }} />
                      <span className="text-xs text-foreground whitespace-nowrap">{c.name}</span>
                    </div>
                  ))}
                </div>
                <div
                  onClick={() => setHoloEffect(v => !v)} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setHoloEffect(v => !v)}
                  aria-pressed={holoEffect}
                  className="flex gap-3 items-start bg-[var(--surface2)] rounded-[var(--radius-lg)] p-3.5 mt-2.5 cursor-pointer"
                  style={{ border: `1px solid ${holoEffect ? 'var(--neon)' : 'var(--border)'}` }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-px" style={{ border: `2px solid ${holoEffect ? 'var(--neon)' : 'var(--border)'}`, background: holoEffect ? 'var(--neon)' : 'transparent' }}>
                    {holoEffect && <span className="text-[#0a0014] text-[13px] font-bold">✓</span>}
                  </div>
                  <div>
                    <p className="mb-0.5 text-[13px] font-semibold text-foreground">
                      ✨ {lang === 'pl' ? 'Efekt holograficzny' : 'Holographic effect'}
                    </p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {lang === 'pl' ? 'Ramka karty z połyskującym, holo wykończeniem' : "Card frame with a shimmering, holo finish"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className={sectionEyebrowCls}>
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
                  <div className="mt-3 bg-[rgba(245,158,11,0.1)] border-[1.5px] border-[rgba(245,158,11,0.4)] rounded-[var(--radius-lg)] py-3.5 px-[18px] flex gap-3 items-start">
                    <span className="text-lg shrink-0">⚠️</span>
                    <p className="m-0 text-xs text-[#f59e0b] leading-[1.6]">
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

              <div className="bg-[var(--surface2)] border border-border rounded-[var(--radius-lg)] p-5 mt-3">
                <p className="font-mono text-[11px] text-primary tracking-[2px] mb-4">{t.order.step2.attrsEyebrow}</p>
                <div className={fieldGridCls}>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.yearLabel}</label><input value={form.cardYear} onChange={e => setForm({...form, cardYear: e.target.value})} placeholder={t.order.step2.yearPlaceholder} /></div>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.rarityLabel}</label><input value={form.cardRarity} onChange={e => setForm({...form, cardRarity: e.target.value})} placeholder={t.order.step2.rarityPlaceholder} /></div>
                  <div className={`${fieldCls} ${fieldFullCls}`}><label className={labelCls}>{t.order.step2.nameLabel}</label><input value={form.cardName} onChange={e => setForm({...form, cardName: e.target.value})} placeholder={t.order.step2.namePlaceholder} /></div>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.attr1LabelLabel}</label><input value={form.attr1Label} onChange={e => setForm({...form, attr1Label: e.target.value})} placeholder={t.order.step2.attr1LabelPlaceholder} /></div>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.attr1ValueLabel}</label><input value={form.attr1Value} onChange={e => setForm({...form, attr1Value: e.target.value})} placeholder={t.order.step2.attr1ValuePlaceholder} /></div>
                  <div className={`${fieldCls} ${fieldFullCls}`}><label className={labelCls}>{t.order.step2.skillLabel}</label><input value={form.cardSkill} onChange={e => setForm({...form, cardSkill: e.target.value})} placeholder={t.order.step2.skillPlaceholder} /></div>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.attr2LabelLabel}</label><input value={form.attr2Label} onChange={e => setForm({...form, attr2Label: e.target.value})} placeholder={t.order.step2.attr2LabelPlaceholder} /></div>
                  <div className={fieldCls}><label className={labelCls}>{t.order.step2.attr2ValueLabel}</label><input value={form.attr2Value} onChange={e => setForm({...form, attr2Value: e.target.value})} placeholder={t.order.step2.attr2ValuePlaceholder} /></div>
                  <div className={`${fieldCls} ${fieldFullCls}`}><label className={labelCls}>{t.order.step2.bottomTextLabel}</label><input value={form.cardBottomText} onChange={e => setForm({...form, cardBottomText: e.target.value})} placeholder={t.order.step2.bottomTextPlaceholder} /></div>
                </div>
              </div>

              <div className="mt-3">
                <p className={sectionEyebrowCls}>{t.order.step2.photoEyebrow} *</p>
                {!photo ? (
                  <div className="border-[1.5px] border-dashed border-border rounded-[var(--radius-lg)] py-10 px-5 text-center cursor-pointer transition-all duration-200 bg-[var(--surface2)] flex flex-col items-center gap-2.5 hover:border-primary hover:bg-[var(--neon-dim)] hover:shadow-[var(--glow-neon)]" style={error === t.order.step5.errPhotoRequired ? { borderColor: 'var(--error)' } : undefined} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
                    <span className="text-[32px] text-muted-foreground">↑</span>
                    <p className="text-sm font-medium text-foreground">{t.order.step2.dropTitle}</p>
                    <p className="text-xs text-muted-foreground">{t.order.step2.dropSub}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3.5 bg-[rgba(0,229,160,0.08)] border-[1.5px] border-[rgba(0,229,160,0.4)] rounded-[var(--radius-lg)] py-4 px-5">
                    <span className="text-[28px] shrink-0">🖼</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--success)] m-0 mb-[3px]">{t.order.step2.fileAddedTitle}</p>
                      <p className="text-xs text-muted-foreground m-0 whitespace-nowrap overflow-hidden text-ellipsis">{photo.name}</p>
                    </div>
                    <button className="bg-transparent border border-[rgba(255,77,109,0.3)] text-[var(--error)] py-[5px] px-2.5 rounded-md text-xs cursor-pointer shrink-0 font-mono transition-colors duration-150 hover:bg-[rgba(255,77,109,0.1)]" onClick={() => { setPhoto(null); setPhotoPreview(null) }}>✕</button>
                  </div>
                )}
                {error === t.order.step5.errPhotoRequired && (
                  <p className={`${errorMsgCls} mt-2`}>{error}</p>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]) }} />
                <div className={`${fieldCls} mt-2.5`}>
                  <label className={labelCls}>{t.order.step2.photoCommentLabel} <span className={optionalCls}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value.slice(0, 600)})} placeholder={t.order.step2.photoCommentPlaceholder} maxLength={600} />
                  <p className="mt-1 mb-0 text-[11px] text-[var(--text-faint)] text-right">{form.notes.length}/600</p>
                </div>
              </div>

              {frontTheme === 'custom' && (
                <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.25)] rounded-[10px] p-4 mt-3">
                  <p className="font-mono text-[11px] text-[#f59e0b] tracking-[2px] mb-3">{t.order.step2.customEyebrow}</p>
                  <button className={`${btnSecondaryCls} w-full p-3 text-[13px]`} onClick={() => refFileFrontRef.current?.click()}>
                    {refFileFront ? `✓ ${refFileFront.name}` : t.order.step2.customBtnEmpty}
                  </button>
                  <input ref={refFileFrontRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileFront(e.target.files[0]) }} />
                  <div className={`${fieldCls} mt-2.5`}>
                    <label className={labelCls}>{t.order.step2.customDescLabel}</label>
                    <textarea value={form.customDesc} onChange={e => setForm({...form, customDesc: e.target.value.slice(0, 600)})} placeholder={t.order.step2.customDescPlaceholder} maxLength={600} />
                    <p className="mt-1 mb-0 text-[11px] text-[var(--text-faint)] text-right">{form.customDesc.length}/600</p>
                  </div>
                </div>
              )}

              <div className={formButtonsCls}>
                <button className={btnSecondaryCls} onClick={() => setStep(1)}>{t.order.step2.back}</button>
                <button className={btnPrimaryCls} onClick={() => setStep(3)}>{t.order.step2.next}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={formStepCls}>
              <p className={formStepTitleCls}>{t.order.step3.title}</p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 mb-5">
                {BACK_OPTIONS.map((b, i) => (
                  <div key={b.id}
                    className={`glassPanel rounded-[var(--radius-lg)] p-4 cursor-pointer relative transition-all duration-200 hover:border-[rgba(180,77,255,0.45)] hover:-translate-y-[3px] hover:shadow-[var(--glass-shadow),var(--glow-neon)] ${backOption === b.id ? '!border-primary bg-[linear-gradient(160deg,rgba(180,77,255,0.14),rgba(180,77,255,0.03))] [&::before]:!opacity-100 [&::after]:!opacity-100' : ''}`}
                    style={i === BACK_OPTIONS.length - 1 ? { gridColumn: '1 / -1' } : undefined}
                    onClick={() => setBackOption(b.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setBackOption(b.id)} aria-pressed={backOption === b.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="flex items-center gap-1.5 min-w-0">
                        {(b.id === 'dedication' || b.id === 'qr') && (
                          <button type="button" className="w-[18px] h-[18px] rounded-full shrink-0 bg-[var(--surface2)] border border-border text-muted-foreground inline-flex items-center justify-center text-[10px] font-bold italic [font-family:Georgia,serif] cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary hover:shadow-[0_0_8px_rgba(180,77,255,0.4)]" onClick={e => { e.stopPropagation(); jumpToOption(b.id === 'dedication' ? 3 : 4) }} aria-label={lang === 'pl' ? 'Więcej informacji' : 'More info'}>i</button>
                        )}
                        <p className="m-0 text-sm font-semibold text-foreground">{b.label}</p>
                      </span>
                      <span className={`font-heading text-[13px] font-bold rounded-full py-[3px] px-3 whitespace-nowrap inline-block ${b.price === 0 ? 'text-[var(--success)] bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.35)]' : 'text-primary bg-[var(--neon-dim)] border border-[color-mix(in_srgb,var(--neon)_35%,transparent)]'}`}>{b.price === 0 ? t.order.step3.freeLabel : `+${b.price} zł`}</span>
                    </div>
                    {backOption === b.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              {backOption === 'logo' && (
                <div className={`${fieldCls} mt-3`}>
                  <label className={labelCls}>{lang === 'pl' ? 'Komentarz' : 'Comment'} <span className={optionalCls}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={lang === 'pl' ? 'Dodatkowa uwaga do logo (opcjonalnie)' : 'Any extra note about the logo (optional)'} />
                </div>
              )}

              {backOption === 'blank' && (
                <div className={`${fieldCls} mt-3`}>
                  <label className={labelCls}>{lang === 'pl' ? 'Komentarz' : 'Comment'} <span className={optionalCls}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={lang === 'pl' ? 'np. zostawcie karty zupełnie czyste, zbieramy podpisy ekipy...' : 'e.g. keep it completely blank, we\'re collecting signatures from the crew...'} />
                </div>
              )}

              {backOption === 'dedication' && (
                <div className={`${fieldCls} mt-3`}>
                  <label className={labelCls}>{t.order.step3.dedicationLabel}</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.dedicationPlaceholder} />
                </div>
              )}

              {backOption === 'qr' && (
                <div className={`${fieldCls} mt-3`}>
                  <label className={labelCls}>{t.order.step3.qrLabel}</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.qrPlaceholder} />
                  <p className="text-xs text-[var(--text-faint)] mt-1">{t.order.step3.qrNote}</p>
                </div>
              )}

              {backOption === 'custom_back' && (
                <div className="mt-3">
                  <p className={sectionEyebrowCls}>{t.order.step3.customBackEyebrow}</p>
                  <button className={`${btnSecondaryCls} w-full p-3 text-[13px]`} onClick={() => refFileBackRef.current?.click()}>
                    {refFileBack ? `✓ ${refFileBack.name}` : t.order.step3.customBackBtnEmpty}
                  </button>
                  <input ref={refFileBackRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileBack(e.target.files[0]) }} />
                  <div className={`${fieldCls} mt-2.5`}>
                    <label className={labelCls}>{t.order.step3.customBackCommentLabel}</label>
                    <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={t.order.step3.customBackCommentPlaceholder} />
                  </div>
                </div>
              )}

              <div className={formButtonsCls}>
                <button className={btnSecondaryCls} onClick={() => setStep(2)}>{t.order.step3.back}</button>
                <button className={btnPrimaryCls} onClick={() => setStep(4)}>{t.order.step3.next}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={formStepCls}>
              <p className={formStepTitleCls}>{t.order.step4.title}</p>
              <p className="mb-2.5 text-xs text-muted-foreground">
                {lang === 'pl' ? 'Ilość i wykończenie wybrałeś już w kroku 1 — tu tylko podsumowanie.' : 'You already picked quantity and finish in step 1 — this is just the summary.'}
              </p>
              {hasDiscount && <div className="bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] rounded-lg py-2.5 px-4 text-sm text-[var(--success)] text-center mb-4">{t.order.step4.discountBadge(quantity)}</div>}
              {quantity === 2 && <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg py-2.5 px-4 text-[13px] text-[#f59e0b] text-center mb-4">{t.order.step4.discountHint}</div>}
              <div className="border border-border rounded-[var(--radius-lg)] py-4 px-5 mb-5 flex flex-col gap-2.5">
                <p className={summaryRowCls}><span>{t.order.step4.cardTypeLabel}</span><strong>{cardObj.label}</strong></p>
                {cardType === 'pvc' ? activeFinishLines.map(l => (
                  <p key={l.finish.id} className={summaryRowCls}>
                    <span>{l.finish.label} × {l.qty}{l.nfcQty > 0 ? (lang === 'pl' ? ` (${l.nfcQty} z NFC)` : ` (${l.nfcQty} with NFC)`) : ''}</span>
                    <strong>{l.finish.id === 'standard' ? '—' : l.finish.id === 'zestaw_promocyjny' ? `${l.finish.price} zł${lang === 'pl' ? '/kpl.' : '/set'}` : `+${l.finish.price} zł/szt.`}</strong>
                  </p>
                )) : (
                  <p className={summaryRowCls}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                )}
                <p className={summaryRowCls}><span>{t.order.step4.themeLabel}</span><strong>{FRONT_THEMES.find(th=>th.id===frontTheme)?.label}</strong></p>
                <p className={summaryRowCls}><span>{lang === 'pl' ? 'Kolor ramki' : 'Frame color'}</span><strong className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: FRAME_COLORS.find(c=>c.id===frameColor)?.hex }} />{FRAME_COLORS.find(c=>c.id===frameColor)?.name}</strong></p>
                {holoEffect && <p className={summaryRowCls}><span>{lang === 'pl' ? 'Efekt holograficzny' : 'Holographic effect'}</span><strong>✨ {lang === 'pl' ? 'Tak' : 'Yes'}</strong></p>}
                <p className={summaryRowCls}><span>{t.order.step4.backLabel}</span><strong>{backObj.label}</strong></p>
                <p className={summaryRowCls}><span>{t.order.step4.unitPriceLabel}</span><strong>{unitPrice} zł</strong></p>
                {hasDiscount && <p className={summaryRowCls}><span>{t.order.step4.discountLabel}</span><strong className="!text-[var(--success)]">−{savedAmount} zł</strong></p>}
                {nfcActive && <p className={summaryRowCls}><span>{lang === 'pl' ? `NFC/RFID (${nfcTotalQty} × ${nfcUnitPrice} zł)` : `NFC/RFID (${nfcTotalQty} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
                {cardFinishAddonTotal > 0 && <p className={summaryRowCls}><span>{lang === 'pl' ? 'Dopłaty za wykończenie' : 'Finish add-ons'}</span><strong>{cardFinishAddonTotal} zł</strong></p>}
                <p className={summaryRowCls}><span>{lang === 'pl' ? 'Wysyłka' : 'Shipping'}{shippingRegion === 'intl' ? (lang === 'pl' ? ' (zagranica)' : ' (abroad)') : ''}</span><strong>{SHIPPING_COST} zł</strong></p>
                <div className="flex justify-between items-center pt-3 border-t border-border text-base"><span>{t.order.step4.totalLabel}</span><strong className="!text-[var(--success)] !text-[22px]">{totalPrice} zł</strong></div>
                <p className="text-xs text-[var(--text-faint)]">{t.order.step4.note}</p>
                <p className="text-xs text-[var(--text-faint)]">{t.order.step5.shippingCostNote(SHIPPING_COST)}</p>
              </div>
              <div className={formButtonsCls}>
                <button className={btnSecondaryCls} onClick={() => setStep(3)}>{t.order.step4.back}</button>
                <button className={btnPrimaryCls} onClick={() => setStep(5)}>{t.order.step4.next}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className={formStepCls}>
              <p className={formStepTitleCls}>{t.order.step5.title}</p>
              <p className="-mt-1.5 mb-3.5 text-xs text-muted-foreground">
                {lang === 'pl' ? '* pola wymagane' : '* required fields'}
              </p>
              <div className={fieldGridCls}>
                <div className={fieldCls}><label className={labelCls}>{t.order.step5.nameLabel}</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t.order.step5.namePlaceholder} /></div>
                <div className={fieldCls}><label className={labelCls}>{t.order.step5.emailLabel}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder={t.order.step5.emailPlaceholder} /></div>
                <div className={fieldCls}>
                  <label className={labelCls}>{lang === 'pl' ? 'Powtórz adres email *' : 'Confirm email address *'}</label>
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
                    <p className="mt-0.5 mb-0 text-[11px] text-[var(--error)]">
                      {lang === 'pl' ? 'Adresy email nie są identyczne' : "Email addresses don't match"}
                    </p>
                  )}
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>{t.order.step5.phoneLabel}{deliveryMethod === 'paczkomat' ? ' *' : ''}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t.order.step5.phonePlaceholder} />
                  {deliveryMethod === 'paczkomat' && (
                    <p className="mt-0.5 mb-0 text-[11px] text-[var(--text-faint)]">
                      {lang === 'pl' ? 'InPost wysyła SMS-em kod odbioru paczki.' : 'InPost sends the pickup code by SMS.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <p className={sectionEyebrowCls}>{t.order.step5.shippingRegionEyebrow}</p>
                <div className="flex gap-2.5 mb-4">
                  {(['pl', 'intl'] as const).map(r => (
                    <div key={r}
                      onClick={() => {
                        // Zmiana kraju czyści ewentualnie już wybrany/potwierdzony paczkomat —
                        // polska wyszukiwarka nie ma sensu dla zagranicy i odwrotnie.
                        setShippingRegion(r); setPaczkomatConfirmed(false); setPaczkomatId('')
                        if (deliveryMethod === 'paczkomat') setForm({ ...form, address: '' })
                      }} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setShippingRegion(r)} aria-pressed={shippingRegion === r}
                      className={`${toggleBtnCls} ${shippingRegion === r ? '!border-primary !bg-[var(--neon-dim)] shadow-[var(--glow-neon)]' : ''}`}>
                      {r === 'pl' ? `🇵🇱 ${t.order.step5.shippingRegionPl}` : `🇪🇺 ${t.order.step5.shippingRegionIntl}`}
                    </div>
                  ))}
                </div>

                <p className={sectionEyebrowCls}>{t.order.step5.deliveryEyebrow}</p>
                <div className="flex gap-2.5 mb-3">
                  {(['address', 'paczkomat'] as const).map(m => (
                    <div key={m}
                      onClick={() => setDeliveryMethod(m)} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setDeliveryMethod(m)} aria-pressed={deliveryMethod === m}
                      className={`${toggleBtnCls} ${deliveryMethod === m ? '!border-primary !bg-[var(--neon-dim)] shadow-[var(--glow-neon)]' : ''}`}>
                      {m === 'address' ? `📍 ${t.order.step5.deliveryAddressOption}` : `📦 ${t.order.step5.deliveryParcelOption}`}
                    </div>
                  ))}
                </div>

                {deliveryMethod === 'address' ? (
                  <div className={fieldCls}>
                    <label className={labelCls}>{t.order.step5.addressLabel}</label>
                    <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={shippingRegion === 'intl' ? t.order.step5.addressIntlPlaceholder : t.order.step5.addressPlaceholder} />
                    {shippingRegion === 'intl' && <p className="mt-1 mb-0 text-[11px] text-[var(--text-faint)]">{t.order.step5.addressIntlNote}</p>}
                  </div>
                ) : shippingRegion === 'intl' ? (
                  // Darmowe, publiczne API InPost, którego używamy do podpowiedzi (patrz
                  // components/InpostAutocomplete.tsx), obejmuje tylko polskie paczkomaty — dla
                  // zagranicy klient wpisuje kod ręcznie (znajdzie go w aplikacji InPost/lokalnym
                  // odpowiedniku w swoim kraju).
                  <div className={fieldCls}>
                    <label className={labelCls}>{t.order.step5.intlPaczkomatLabel}</label>
                    <input value={form.address} onChange={e => { setForm({...form, address: e.target.value}); setPaczkomatId(e.target.value) }} placeholder={t.order.step5.intlPaczkomatPlaceholder} />
                    <p className="mt-1 mb-0 text-[11px] text-[var(--text-faint)]">{t.order.step5.intlPaczkomatNote}</p>
                    <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-[var(--neon2)] no-underline">
                      {t.order.step5.paczkomatMapLink}
                    </a>
                  </div>
                ) : (
                  <div className={fieldCls}>
                    {paczkomatConfirmed && form.address ? (
                      <div className="flex items-center justify-between gap-2.5 bg-[var(--surface2)] border border-primary rounded-[var(--radius-lg)] py-3 px-3.5">
                        <div>
                          <p className="mb-0.5 text-[11px] text-muted-foreground">{t.order.step5.paczkomatSelected}</p>
                          <p className="m-0 text-[13px] font-semibold text-foreground">📦 {form.address}</p>
                        </div>
                        <button type="button" className={`${btnSecondaryCls} w-auto py-2 px-3.5 text-xs shrink-0`}
                          onClick={() => { setPaczkomatConfirmed(false); setPaczkomatId(''); setForm({...form, address: ''}) }}>
                          {t.order.step5.paczkomatChange}
                        </button>
                      </div>
                    ) : process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ? (
                      <>
                        <label className={labelCls}>{t.order.step5.paczkomatPickLabel}</label>
                        <InpostGeowidget lang={lang} onSelect={p => { setPaczkomatId(p.id); setForm({...form, address: p.address}); setPaczkomatConfirmed(true) }} />
                      </>
                    ) : (
                      <>
                        <label className={labelCls}>{t.order.step5.paczkomatManualLabel}</label>
                        <InpostAutocomplete lang={lang} onSelect={p => { setPaczkomatId(p.id); setForm({...form, address: p.address}); setPaczkomatConfirmed(true) }} />
                        <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-[var(--neon2)] no-underline">
                          {t.order.step5.paczkomatMapLink}
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-[var(--surface2)] border border-border rounded-[var(--radius-lg)] p-4 mt-2">
                <p className={sectionEyebrowCls}>{t.order.step5.discountEyebrow}</p>
                <div className="flex gap-2">
                  <input value={discountCode} onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountMsg(null); setDiscountApplied(false); setDiscountPct(0) }} placeholder="" className="flex-1 uppercase tracking-[2px]" disabled={discountApplied} />
                  <button onClick={applyDiscount} disabled={!discountCode.trim() || discountApplied} className={`${btnSecondaryCls} w-auto py-2.5 px-[18px] text-[13px] shrink-0`}>{discountApplied ? t.order.step5.discountActive : t.order.step5.discountApply}</button>
                </div>
                {discountMsg && <p className={`mt-2 mb-0 text-xs ${discountApplied ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>{discountMsg}</p>}
              </div>

              <div className="border border-border rounded-[var(--radius-lg)] py-4 px-5 mt-2 flex flex-col gap-2.5">
                <p className={summaryRowCls}><span>{cardObj.label}</span><strong>{t.order.step4.unitPriceLabel}: {unitPrice} zł</strong></p>
                {cardType === 'pvc' && activeFinishLines.map(l => (
                  <p key={l.finish.id} className={summaryRowCls}>
                    <span>{l.finish.label} × {l.qty}{l.nfcQty > 0 ? (lang === 'pl' ? ` (${l.nfcQty} z NFC)` : ` (${l.nfcQty} with NFC)`) : ''}</span>
                    <strong>{l.finish.id === 'standard' ? '—' : l.finish.id === 'zestaw_promocyjny' ? `${l.finish.price} zł${lang === 'pl' ? '/kpl.' : '/set'}` : `+${l.finish.price} zł/szt.`}</strong>
                  </p>
                ))}
                <p className={summaryRowCls}><span>{t.order.step4.backLabel} — {backObj.label}</span><strong>{backObj.price === 0 ? t.order.step3.freeLabel : `+${backObj.price} zł`}</strong></p>
                <p className={summaryRowCls}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                {hasDiscount && <p className={summaryRowCls}><span>{t.order.step5.quantityDiscountLabel}</span><strong className="!text-[var(--success)]">−{savedAmount} zł</strong></p>}
                {discountApplied && <p className={summaryRowCls}><span>{t.order.step5.codeDiscountLabel(discountCode.toUpperCase(), discountPct)}</span><strong className="!text-[var(--success)]">−{discountSaved} zł</strong></p>}
                {nfcActive && <p className={summaryRowCls}><span>{lang === 'pl' ? `NFC/RFID (${nfcTotalQty} × ${nfcUnitPrice} zł)` : `NFC/RFID (${nfcTotalQty} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
                {cardFinishAddonTotal > 0 && <p className={summaryRowCls}><span>{lang === 'pl' ? 'Dopłaty za wykończenie' : 'Finish add-ons'}</span><strong>{cardFinishAddonTotal} zł</strong></p>}
                <p className={summaryRowCls}><span>{lang === 'pl' ? 'Wysyłka' : 'Shipping'}{shippingRegion === 'intl' ? (lang === 'pl' ? ' (zagranica)' : ' (abroad)') : ''}</span><strong>{SHIPPING_COST} zł</strong></p>
                <div className="flex justify-between items-center pt-3 border-t border-border text-base"><span>{t.order.step5.payLabel}</span><strong className="!text-[var(--success)] !text-[22px]">{totalPrice} zł</strong></div>
                <p className="text-xs text-[var(--text-faint)]">{t.order.step5.payNote}</p>
              </div>

              <div className="flex gap-3 items-start bg-[var(--surface2)] rounded-[var(--radius)] p-3.5 cursor-pointer" style={{ border: `1px solid ${agreed ? 'rgba(0,229,160,0.3)' : 'var(--border)'}` }} onClick={() => setAgreed(a => !a)}>
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-px transition-all duration-150" style={{ border: `2px solid ${agreed ? 'var(--success)' : 'var(--border)'}`, background: agreed ? 'var(--success)' : 'transparent' }}>
                  {agreed && <span className="text-[#0a0014] text-[13px] font-bold">✓</span>}
                </div>
                <p className="m-0 text-[13px] text-muted-foreground leading-[1.6]">
                  {t.order.step5.agreePrefix} <a href="/regulamin" target="_blank" className="text-primary" onClick={e => e.stopPropagation()}>{t.order.step5.agreeRegulamin}</a> {t.order.step5.agreeAnd} <a href="/polityka-prywatnosci" target="_blank" className="text-primary" onClick={e => e.stopPropagation()}>{t.order.step5.agreePrivacy}</a> {t.order.step5.agreeSuffix}
                </p>
              </div>

              {error && <p className={errorMsgCls}>{error}</p>}
              <div className={formButtonsCls}>
                <button className={btnSecondaryCls} onClick={() => setStep(4)}>{t.order.step5.back}</button>
                <button className={btnPrimaryCls} onClick={handleSubmit} disabled={sending || !agreed}>
                  {sending ? t.order.step5.sending : t.order.step5.submit(totalPrice)}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <FaqReviews lang={lang} />

      <footer className="border-t border-border py-10 px-[5vw] text-center">
        <p className="font-heading text-xl font-bold text-primary mb-1.5">RaveAdventure</p>
        <p className="text-sm text-muted-foreground mb-4">kontakt@raveadventure.pl</p>
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3">
          <a href="https://www.instagram.com/rave_adventure_pl/" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">Instagram</a>
          <span className="text-[var(--text-faint)] text-xs">·</span>
          <a href="https://www.facebook.com/raveadventurepl" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">Facebook</a>
          <span className="text-[var(--text-faint)] text-xs">·</span>
          <a href="/regulamin" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.regulamin}</a>
          <span className="text-[var(--text-faint)] text-xs">·</span>
          <a href="/polityka-prywatnosci" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.polityka}</a>
          <span className="text-[var(--text-faint)] text-xs">·</span>
          <a href="/portfolio" className="text-[13px] text-muted-foreground no-underline transition-colors duration-150 hover:text-primary">{t.footer.portfolio}</a>
        </div>
        <p className="text-xs text-[var(--text-faint)]">{t.footer.copy}</p>
      </footer>
    </main>
  )
}
