'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './page.module.css'
import PortfolioCarousel from '../components/PortfolioCarousel'
import HeroCardAnimation from '../components/HeroCardAnimation'
import { T, CARD_TYPES_I18N, FRONT_THEMES_I18N, BACK_OPTIONS_I18N, Lang } from '../lib/translations'

type Step = 1 | 2 | 3 | 4 | 5

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
  const BACK_OPTIONS = BACK_OPTIONS_I18N[lang].map(b => {
    if (b.id === 'logo') return {
      ...b,
      label: lang === 'pl' ? 'RaveAdventure Logo lub Pusta biała karta' : 'RaveAdventure Logo or Blank White Card',
    }
    return b
  })

  const [step, setStep] = useState<Step>(1)
  const [cardType, setCardType] = useState('pvc')
  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [frontTheme, setFrontTheme] = useState('techno_rave')
  const [backOption, setBackOption] = useState('logo')
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    notesBack: '', customDesc: '', notes: '',
    cardYear: '2025', cardRarity: 'RARE', cardName: '', attr1Label: '', attr1Value: '', cardSkill: '', attr2Label: '', attr2Value: '', cardDesc: '',
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

  const DISCOUNT_CODES: Record<string, number> = { 'RAVE10': 10, 'SIERRA20': 20, 'AWAKENINGS': 15, 'FRIENDS50': 50, 'COFFEERAVE': 20 }

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

  useEffect(() => {
    if (!navRef.current) return
    const el = navRef.current
    const update = () => setNavHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cardObj = CARD_TYPES.find(c => c.id === cardType)!
  const backObj = BACK_OPTIONS.find(b => b.id === backOption)!
  const SHIPPING_COST = 15
  const NFC_PRICE_STANDARD = 15
  const NFC_PRICE_BULK = 8
  const nfcActive = nfcEnabled && cardType === 'pvc'
  const nfcUnitPrice = quantity > 3 ? NFC_PRICE_BULK : NFC_PRICE_STANDARD
  const nfcTotal = nfcActive ? nfcUnitPrice * quantity : 0
  const unitPrice = cardObj.price + backObj.price
  const hasDiscount = quantity >= 3
  const baseTotal = hasDiscount ? Math.round(unitPrice * quantity * 0.5) : unitPrice * quantity
  const savedAmount = hasDiscount ? Math.round(unitPrice * quantity * 0.5) : 0
  const discountSaved = discountApplied ? Math.round(baseTotal * discountPct / 100) : 0
  const totalPrice = baseTotal - discountSaved + SHIPPING_COST + nfcTotal

  const handlePhoto = (file: File) => {
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handlePhoto(file)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.address) { setError(t.order.step5.errRequired); return }
    if (!agreed) { setError(t.order.step5.errAgree); return }
    setSending(true); setError(null)
    try {
      const { data: orderData, error: insertError } = await supabase.from('orders').insert([{
        theme: frontTheme, card_type: cardType, back_option: backOption, quantity,
        nfc_enabled: nfcActive, nfc_price: nfcTotal,
        unit_price: unitPrice, total_price: totalPrice, has_discount: hasDiscount,
        name: form.name, email: form.email, phone: form.phone, address: form.address,
        notes: form.notes, card_text: form.notesBack, custom_desc: form.customDesc, qr_link: form.notesBack,
        card_year: form.cardYear, card_rarity: form.cardRarity, card_name_custom: form.cardName,
        attr1_label: form.attr1Label, attr1_value: form.attr1Value, card_skill: form.cardSkill,
        attr2_label: form.attr2Label, attr2_value: form.attr2Value, card_desc: form.cardDesc,
        discount_code: discountApplied ? discountCode.trim().toUpperCase() : null, discount_pct: discountPct,
        photo_url: null, status: 'new', lang,
      }]).select('id').single()

      if (insertError) throw new Error(insertError.message)

      if (photo && orderData?.id) {
        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','heic'].includes(ext) ? ext : 'jpg'
        const fileName = `${orderData.id}-front.${safeExt}`
        const { error: uploadError } = await supabase.storage.from('order-photos').upload(fileName, photo, { upsert: true })
        if (uploadError) { console.error('Photo upload error:', uploadError.message) }
        else {
          const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(fileName)
          const { error: updateError } = await supabase.from('orders').update({ photo_url: urlData.publicUrl }).eq('id', orderData.id)
          if (updateError) console.error('Photo URL update error:', updateError.message)
        }
      }

      if (refFileFront && orderData?.id) {
        const ext = (refFileFront.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
        await supabase.storage.from('order-photos').upload(`${orderData.id}-custom.${safeExt}`, refFileFront, { upsert: true })
      }
      if (refFileBack && orderData?.id) {
        const ext = (refFileBack.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
        await supabase.storage.from('order-photos').upload(`${orderData.id}-ref-back.${safeExt}`, refFileBack, { upsert: true })
      }

      await fetch('/api/send-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, address: form.address, cardText: form.notesBack, notes: form.notes,
          theme: frontTheme, orderId: orderData?.id, cardType, backOption, quantity, unitPrice, totalPrice, hasDiscount, savedAmount,
          nfcEnabled: nfcActive, nfcPrice: nfcTotal,
          cardYear: form.cardYear, cardRarity: form.cardRarity, cardName: form.cardName,
          attr1Label: form.attr1Label, attr1Value: form.attr1Value, cardSkill: form.cardSkill,
          attr2Label: form.attr2Label, attr2Value: form.attr2Value, cardDesc: form.cardDesc, notesBack: form.notesBack,
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
          <button className={styles.btnPrimary} onClick={() => { setSent(false); setStep(1); setForm({ name:'',email:'',phone:'',address:'',notesBack:'',customDesc:'',notes:'',cardYear:'2025',cardRarity:'RARE',cardName:'',attr1Label:'',attr1Value:'',cardSkill:'',attr2Label:'',attr2Value:'',cardDesc:'' }); setPhoto(null); setPhotoPreview(null); setRefFileFront(null); setRefFileBack(null); setQuantity(1); setNfcEnabled(false); setAgreed(false); setDiscountCode(''); setDiscountApplied(false); setDiscountPct(0); setDiscountMsg(null) }}>
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
            {lang === 'pl' ? '☕ Z okazji Coffee Rave „Wstań i Tańcz" — 20% zniżki na wszystkie karty!' : '☕ To celebrate Coffee Rave "Wstań i Tańcz" — 20% off all cards!'}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(240,238,255,0.5)' }}>
          {lang === 'pl' ? 'Użyj kodu' : 'Use code'}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: '#b44dff', letterSpacing: '1px', margin: '0 6px', textDecoration: 'underline' }}>
            COFFEERAVE
          </span>
          · {lang === 'pl' ? 'ważny do 26.07.2026' : 'valid until July 26, 2026'}
        </p>
      </a>

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

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 5vw 0' }}>
        <img src="/logo_kwadrat.png" alt="RaveAdventure — The best memories from your adventure deserve a card." style={{ maxWidth: '100%', width: '720px', height: 'auto', display: 'block' }} />
      </div>

      <PortfolioCarousel lang={lang} />

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
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '26px', fontWeight: 800, color: '#00e5a0',
                textDecoration: 'line-through', textDecorationThickness: '3px', textDecorationColor: '#00e5a0',
                lineHeight: 1,
              }}>
                $$
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: '#00e5a0', lineHeight: '1.6' }}>
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
              <span style={{ fontSize: '11px', color: 'rgba(0,229,160,0.6)' }}>{showPaymentInfo ? '▲' : '▼'}</span>
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

      <section className={styles.section}>
        <p className={styles.sectionEye}>{t.howItWorks.eyebrow}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {t.howItWorks.steps.map(s => (
            <div key={s.n} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: 'var(--text-faint)', letterSpacing: '1px' }}>{s.n}</span>
              <p style={{ margin: '3px 0 2px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{s.t}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.d}</p>
            </div>
          ))}
        </div>

        <p className={styles.sectionEye}>{t.options.eyebrow}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {t.options.cards.map((o, i) => (
            <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{o.icon}</span>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{o.title}</p>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{o.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {o.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
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
              {['NFC', 'RFID', '+15 zł'].map(tag => (
                <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>⚙</span>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{t.options.attrNote}</p>
        </div>
      </section>

      <section className={styles.section} id="order">
        <p className={styles.sectionEye}>{t.order.eyebrow}</p>
        <h2 className={styles.sectionTitle}>{t.order.title}</h2>

        <p style={{
          maxWidth: '620px',
          margin: '0 auto 24px',
          fontSize: '13px',
          color: '#00e5a0',
          background: 'rgba(0,229,160,0.08)',
          border: '1px solid rgba(0,229,160,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 18px',
          lineHeight: '1.5',
          textAlign: 'center',
        }}>
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

        <div className={styles.progressWrap}>
          {t.order.steps.map((s, i) => {
            const n = (i + 1) as Step
            return (
              <div key={n} className={styles.progressItem}>
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
                    <div className={styles.cardTypeHeader}>
                      <p className={styles.themeLabel}>{c.label}</p>
                      <span className={styles.cardTypePrice}>{c.price} zł</span>
                    </div>
                    <p className={styles.cardTypeDims}>{c.dims}</p>
                    <p className={styles.themeDesc}>{c.desc}</p>
                    {cardType === c.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '12px 0 4px' }}>
                <span className={styles.badge}>{t.hero.badge1}</span>
                <span className={styles.badge}>{t.hero.badge2}</span>
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
                    <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      📲 {lang === 'pl' ? 'Dodaj programowanie NFC/RFID' : 'Add NFC/RFID programming'}
                      <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--neon)' }}>
                        +{quantity > 3 ? NFC_PRICE_BULK : NFC_PRICE_STANDARD} zł{lang === 'pl' ? '/kartę' : '/card'}
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
                    <div className={styles.themeAccentBar} />
                    <p className={styles.themeLabel}>{th.label}</p>
                    <p className={styles.themeDesc}>{th.desc}</p>
                    {frontTheme === th.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>{t.order.step2.photoEyebrow}</p>
                {!photo ? (
                  <div className={styles.dropZone} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
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
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]) }} />
                <div className={styles.field} style={{ marginTop: '10px' }}>
                  <label className={styles.label}>{t.order.step2.photoCommentLabel} <span className={styles.optional}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t.order.step2.photoCommentPlaceholder} />
                </div>
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
                {BACK_OPTIONS.map(b => (
                  <div key={b.id}
                    className={`${styles.backCard} ${backOption === b.id ? styles.backCardSelected : ''}`}
                    onClick={() => setBackOption(b.id)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setBackOption(b.id)} aria-pressed={backOption === b.id}>
                    <div className={styles.backCardTop}>
                      <p className={styles.backCardLabel}>{b.label}</p>
                      <span className={styles.backCardPrice}>{b.price === 0 ? t.order.step3.freeLabel : `+${b.price} zł`}</span>
                    </div>
                    <p className={styles.backCardDesc}>{b.desc}</p>
                    {backOption === b.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              {backOption === 'logo' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>{lang === 'pl' ? 'Komentarz' : 'Comment'} <span className={styles.optional}>{t.order.step2.optional}</span></label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder={lang === 'pl' ? 'Napisz, czy chcesz logo RaveAdventure czy pustą białą kartę — albo dodaj inną uwagę' : "Let us know if you'd like the RaveAdventure logo or a blank white card — or add any other note"} />
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
                <p className={styles.summaryRow}><span>{t.order.step4.themeLabel}</span><strong>{FRONT_THEMES.find(th=>th.id===frontTheme)?.label}</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.backLabel}</span><strong>{backObj.label}</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.unitPriceLabel}</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                {hasDiscount && <p className={styles.summaryRow}><span>{t.order.step4.discountLabel}</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>}
                {nfcActive && <p className={styles.summaryRow}><span>{lang === 'pl' ? `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)` : `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
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
              <div className={styles.fieldGrid}>
                <div className={styles.field}><label className={styles.label}>{t.order.step5.nameLabel}</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t.order.step5.namePlaceholder} /></div>
                <div className={styles.field}><label className={styles.label}>{t.order.step5.emailLabel}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder={t.order.step5.emailPlaceholder} /></div>
                <div className={styles.field}><label className={styles.label}>{t.order.step5.phoneLabel}</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t.order.step5.phonePlaceholder} /></div>
                <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>{t.order.step5.addressLabel}</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={t.order.step5.addressPlaceholder} /></div>
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
                <p className={styles.summaryRow}><span>{cardObj.label}</span><strong>{cardObj.price} zł</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.backLabel} — {backObj.label}</span><strong>{backObj.price === 0 ? t.order.step3.freeLabel : `+${backObj.price} zł`}</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.unitPriceLabel}</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>{t.order.step4.qtyLabel}</span><strong>× {quantity}</strong></p>
                {hasDiscount && <p className={styles.summaryRow}><span>{t.order.step5.quantityDiscountLabel}</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>}
                {discountApplied && <p className={styles.summaryRow}><span>{t.order.step5.codeDiscountLabel(discountCode.toUpperCase(), discountPct)}</span><strong className={styles.discount}>−{discountSaved} zł</strong></p>}
                {nfcActive && <p className={styles.summaryRow}><span>{lang === 'pl' ? `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)` : `NFC/RFID (${quantity} × ${nfcUnitPrice} zł)`}</span><strong>{nfcTotal} zł</strong></p>}
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
