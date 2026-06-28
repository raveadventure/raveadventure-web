'use client'
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import styles from './page.module.css'
import PortfolioCarousel from '../components/PortfolioCarousel'

const CARD_TYPES = [
  {
    id: 'pvc',
    label: 'Karta PVC',
    price: 89,
    dims: '85.6 × 54 mm · grubość 0.76 mm',
    desc: 'Format karty kredytowej. Twarda, wodoodporna, mieści się w każdym portfelu.',
    accent: '#b44dff',
  },
  {
    id: 'laminated',
    label: 'Karta Laminowana',
    price: 40,
    dims: '63 × 88 mm',
    desc: 'Większy format, lżejsza produkcja. Idealna na festiwal lub jako zakładka.',
    accent: '#00f0ff',
  },
]

const FRONT_THEMES = [
  { id: 'techno_rave', label: 'Techno / Rave', desc: 'Nocny klimat, laser, dark vibe', accent: '#b44dff' },
  { id: 'festival',    label: 'Festiwal',       desc: 'Scena, tłum, światła, energia', accent: '#ff6b35' },
  { id: 'adventure',   label: 'Adventure / Travel', desc: 'Droga, natura, wolność', accent: '#00e5a0' },
  { id: 'custom',      label: 'Custom',          desc: 'Twój własny pomysł na projekt', accent: '#f59e0b' },
]

const BACK_OPTIONS = [
  { id: 'logo',         label: 'RaveAdventure Logo',       price: 0,  desc: 'Nasze logo na rewersie karty' },
  { id: 'dedication',   label: 'Personal Dedication',      price: 15, desc: 'Dedykacja, cytat lub tekst osobisty' },
  { id: 'custom_back',  label: 'Custom Artwork',           price: 30, desc: 'Własna grafika lub motyw na rewersie' },
  { id: 'qr',          label: 'QR Code',                  price: 40, desc: 'Link do social media, strony lub portfolio' },
]

type Step = 1 | 2 | 3 | 4 | 5

export default function Home() {
  const [step, setStep] = useState<Step>(1)
  const [cardType, setCardType] = useState('pvc')
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

  const DISCOUNT_CODES: Record<string, number> = {
    'RAVE10': 10,
    'SIERRA20': 20,
    'AWAKENINGS': 15,
    'FRIENDS50': 50,
  }

  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase()
    if (DISCOUNT_CODES[code]) {
      setDiscountPct(DISCOUNT_CODES[code])
      setDiscountApplied(true)
      setDiscountMsg(`Kod aktywny! Rabat ${DISCOUNT_CODES[code]}% zastosowany.`)
    } else {
      setDiscountPct(0)
      setDiscountApplied(false)
      setDiscountMsg('Nieprawidłowy kod rabatowy.')
    }
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const refFileFrontRef = useRef<HTMLInputElement>(null)
  const refFileBackRef = useRef<HTMLInputElement>(null)

  const cardObj = CARD_TYPES.find(c => c.id === cardType)!
  const backObj = BACK_OPTIONS.find(b => b.id === backOption)!
  const unitPrice = cardObj.price + backObj.price
  const hasDiscount = quantity >= 3
  const baseTotal = hasDiscount ? Math.round(unitPrice * quantity * 0.5) : unitPrice * quantity
  const savedAmount = hasDiscount ? Math.round(unitPrice * quantity * 0.5) : 0
  const discountSaved = discountApplied ? Math.round(baseTotal * discountPct / 100) : 0
  const totalPrice = baseTotal - discountSaved

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
    if (!form.name || !form.email || !form.address) {
      setError('Uzupełnij imię, email i adres wysyłki.')
      return
    }
    if (!agreed) {
      setError('Zaakceptuj regulamin i politykę prywatności aby kontynuować.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const { data: orderData, error: insertError } = await supabase.from('orders').insert([{
        theme: frontTheme,
        card_type: cardType,
        back_option: backOption,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        has_discount: hasDiscount,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        card_text: form.notesBack,
        custom_desc: form.customDesc,
        qr_link: form.notesBack,
        card_year: form.cardYear,
        card_rarity: form.cardRarity,
        card_name_custom: form.cardName,
        attr1_label: form.attr1Label,
        attr1_value: form.attr1Value,
        card_skill: form.cardSkill,
        attr2_label: form.attr2Label,
        attr2_value: form.attr2Value,
        card_desc: form.cardDesc,
        discount_code: discountApplied ? discountCode.trim().toUpperCase() : null,
        discount_pct: discountPct,
        photo_url: null,
        status: 'new',
      }]).select('id').single()

      if (insertError) throw new Error(insertError.message)

      // Upload zdjęcia
      if (photo && orderData?.id) {
        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','heic'].includes(ext) ? ext : 'jpg'
        const fileName = `${orderData.id}.${safeExt}`
        const { error: uploadError } = await supabase.storage
          .from('order-photos')
          .upload(fileName, photo, { upsert: true })
        if (uploadError) {
          console.error('Photo upload error:', uploadError.message)
        } else {
          const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(fileName)
          const { error: updateError } = await supabase.from('orders').update({ photo_url: urlData.publicUrl }).eq('id', orderData.id)
          if (updateError) console.error('Photo URL update error:', updateError.message)
        }
      }

      // Upload pliku referencyjnego frontu
      if (refFileFront && orderData?.id) {
        const ext = (refFileFront.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
        await supabase.storage.from('order-photos').upload(`${orderData.id}-ref-front.${safeExt}`, refFileFront)
      }
      // Upload pliku referencyjnego tyłu
      if (refFileBack && orderData?.id) {
        const ext = (refFileBack.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','pdf'].includes(ext) ? ext : 'jpg'
        await supabase.storage.from('order-photos').upload(`${orderData.id}-ref-back.${safeExt}`, refFileBack)
      }

      // Wyślij maile
      await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          address: form.address, cardText: form.notesBack, notes: form.notes,
          theme: frontTheme, orderId: orderData?.id,
          cardType, backOption, quantity, unitPrice, totalPrice, hasDiscount, savedAmount,
          cardYear: form.cardYear, cardRarity: form.cardRarity, cardName: form.cardName,
          attr1Label: form.attr1Label, attr1Value: form.attr1Value,
          cardSkill: form.cardSkill, attr2Label: form.attr2Label, attr2Value: form.attr2Value,
          cardDesc: form.cardDesc, notesBack: form.notesBack,
        }),
      })

      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd'
      setError(`Coś poszło nie tak: ${msg}`)
    } finally {
      setSending(false)
    }
  }

  const themeObj = FRONT_THEMES.find(t => t.id === frontTheme)!

  if (sent) {
    return (
      <div className={styles.sentWrap}>
        <div className={styles.sentBox}>
          <div className={styles.sentIcon}>✓</div>
          <h2>Zamówienie wysłane!</h2>
          <p>Odezwiemy się w ciągu 24h na adres <strong>{form.email}</strong> z projektem karty do zatwierdzenia.</p>
          <div className={styles.sentSummary}>
            <span>{cardObj.label} × {quantity}</span>
            <strong>{totalPrice} zł</strong>
          </div>
          <button className={styles.btnPrimary} onClick={() => { setSent(false); setStep(1); setForm({ name:'',email:'',phone:'',address:'',notesBack:'',customDesc:'',notes:'',cardYear:'2025',cardRarity:'RARE',cardName:'',attr1Label:'',attr1Value:'',cardSkill:'',attr2Label:'',attr2Value:'',cardDesc:'' }); setPhoto(null); setPhotoPreview(null); setRefFileFront(null); setRefFileBack(null); setQuantity(1); setAgreed(false); setDiscountCode(''); setDiscountApplied(false); setDiscountPct(0); setDiscountMsg(null) }}>
            Zamów kolejną kartę
          </button>
        </div>
      </div>
    )
  }

  const steps = ['Typ karty', 'Motyw frontu', 'Rewers', 'Ilość', 'Dane']

  return (
    <main className={styles.main}>
      {/* NAV */}
      <nav className={styles.nav}>
        <span className={styles.logo}>Rave<span>Adventure</span></span>
        <a href="#order" className={styles.navCta}>Zamów kartę</a>
      </nav>

      {/* LOGO BANNER */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '72px 5vw 0',
        marginTop: '57px',
      }}>
        <img
          src="/logo.png"
          alt="RaveAdventure — Sierra, learn to see beauty at every height"
          style={{
            maxWidth: '100%',
            width: '900px',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* PORTFOLIO CAROUSEL */}
      <PortfolioCarousel />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>// festival cards</p>
          <h1 className={styles.heroTitle}>
            Twoje zdjęcie.<br />
            <span className={styles.neon}>Twoja karta.</span>
          </h1>
          <p className={styles.heroSub}>
            Personalizowane karty z klimatem techno i rave. Mieszczą się w portfelu — zabierasz ze sobą na każdy event.
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Karta PVC od 89 zł</span>
            <span className={styles.badge}>Karta Laminowana od 40 zł</span>
            <span className={styles.badge}>-50% przy 3+ sztukach</span>
            <span className={styles.badge}>Projekt w 24h</span>
          </div>
          <a href="#order" className={styles.btnHero}>Zamów swoją kartę →</a>
        </div>

      </section>

      {/* TYPY KART */}
      <section className={styles.section} id="cards">
        <p className={styles.sectionEye}>// rodzaje kart</p>
        <h2 className={styles.sectionTitle}>Wybierz format</h2>
        <div className={styles.cardTypesGrid}>
          {CARD_TYPES.map(c => (
            <div key={c.id} className={styles.cardTypeCard} style={{ '--accent': c.accent } as React.CSSProperties}>
              <div className={styles.themeAccentBar} />
              <div className={styles.cardTypeHeader}>
                <p className={styles.themeLabel}>{c.label}</p>
                <span className={styles.cardTypePrice}>{c.price} zł</span>
              </div>
              <p className={styles.cardTypeDims}>{c.dims}</p>
              <p className={styles.themeDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.section}>
        <p className={styles.sectionEye}>// jak to działa</p>
        <h2 className={styles.sectionTitle}>Trzy kroki do karty</h2>
        <div className={styles.stepsGrid}>
          {[
            { n: '01', t: 'Zamów online', d: 'Wybierz typ, motyw, rewers i dodaj zdjęcie.' },
            { n: '02', t: 'Zatwierdzasz projekt', d: 'W ciągu 24h wysyłamy projekt. Możesz prosić o poprawki.' },
            { n: '03', t: 'Karta do Ciebie', d: 'Produkujemy i wysyłamy. Czas realizacji: 3–5 dni roboczych.' },
          ].map(s => (
            <div key={s.n} className={styles.stepCard}>
              <span className={styles.stepNum}>{s.n}</span>
              <p className={styles.stepTitle}>{s.t}</p>
              <p className={styles.stepDesc}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULARZ */}
      <section className={styles.section} id="order">
        <p className={styles.sectionEye}>// zamówienie</p>
        <h2 className={styles.sectionTitle}>Zamów swoją kartę</h2>

        {/* Progress */}
        <div className={styles.progressWrap}>
          {steps.map((s, i) => {
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

          {/* KROK 1 — TYP KARTY */}
          {step === 1 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Wybierz typ karty</p>
              <div className={styles.cardTypesGrid}>
                {CARD_TYPES.map(c => (
                  <div key={c.id}
                    className={`${styles.cardTypeCard} ${cardType === c.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': c.accent } as React.CSSProperties}
                    onClick={() => setCardType(c.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setCardType(c.id)}
                    aria-pressed={cardType === c.id}
                  >
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
              <button className={styles.btnPrimary} onClick={() => setStep(2)}>Dalej — wybierz motyw →</button>
            </div>
          )}

          {/* KROK 2 — MOTYW FRONTU */}
          {step === 2 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Motyw frontu karty</p>
              <div className={styles.themesGrid}>
                {FRONT_THEMES.map(t => (
                  <div key={t.id}
                    className={`${styles.themeCard} ${frontTheme === t.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': t.accent } as React.CSSProperties}
                    onClick={() => setFrontTheme(t.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setFrontTheme(t.id)}
                    aria-pressed={frontTheme === t.id}
                  >
                    <div className={styles.themeAccentBar} />
                    <p className={styles.themeLabel}>{t.label}</p>
                    <p className={styles.themeDesc}>{t.desc}</p>
                    {frontTheme === t.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              {/* ZDJĘCIE FRONT + NOTES */}
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>// zdjęcie do przeróbki (front)</p>
                {!photo ? (
                  <div className={styles.dropZone} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={handleDrop} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
                    <span className={styles.dropIcon}>↑</span>
                    <p className={styles.dropTitle}>Dodaj zdjęcie (FRONT)</p>
                    <p className={styles.dropSub}>To zdjęcie stanie się bazą Twojej karty · JPG, PNG, HEIC · maks. 20 MB</p>
                  </div>
                ) : (
                  <div className={styles.fileAdded}>
                    <span className={styles.fileIcon}>🖼</span>
                    <div className={styles.fileInfo}>
                      <p className={styles.fileAddedTitle}>Zdjęcie FRONT dodane ✓</p>
                      <p className={styles.fileName}>{photo.name}</p>
                    </div>
                    <button className={styles.fileRemove} onClick={() => { setPhoto(null); setPhotoPreview(null) }}>✕</button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]) }} />
                <div className={styles.field} style={{ marginTop: '10px' }}>
                  <label className={styles.label}>Komentarz do zdjęcia <span className={styles.optional}>(opcjonalnie)</span></label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="np. skup się na twarzy, pomiń tło, dodaj efekt neonowy..." />
                </div>
              </div>

              {/* ATRYBUTY KARTY */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 16px' }}>// atrybuty karty</p>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>① Rok / wartość</label>
                    <input value={form.cardYear} onChange={e => setForm({...form, cardYear: e.target.value})} placeholder="np. 2025 · SEASON 1" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>② Rzadkość</label>
                    <input value={form.cardRarity} onChange={e => setForm({...form, cardRarity: e.target.value})} placeholder="COMMON · RARE · EPIC · LEGENDARY" />
                  </div>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label}>③ Nazwa karty</label>
                    <input value={form.cardName} onChange={e => setForm({...form, cardName: e.target.value})} placeholder="np. BARON VON KOCH · RAVE FAMILY · ADE 2025" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>④ Atrybut 1 — nazwa</label>
                    <input value={form.attr1Label} onChange={e => setForm({...form, attr1Label: e.target.value})} placeholder="np. ENERGY · VIBE · BPM" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>④ Atrybut 1 — wartość</label>
                    <input value={form.attr1Value} onChange={e => setForm({...form, attr1Value: e.target.value})} placeholder="np. x3 · x5 · 140" />
                  </div>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label}>⑤ Umiejętność</label>
                    <input value={form.cardSkill} onChange={e => setForm({...form, cardSkill: e.target.value})} placeholder="np. HARD TECHNO MASTER · FRIENDS VIBE · PURE FUN" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>⑥ Atrybut 2 — nazwa</label>
                    <input value={form.attr2Label} onChange={e => setForm({...form, attr2Label: e.target.value})} placeholder="np. HAPPINESS · SUCCESS RATE" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>⑥ Atrybut 2 — wartość</label>
                    <input value={form.attr2Value} onChange={e => setForm({...form, attr2Value: e.target.value})} placeholder="np. x2 · x4" />
                  </div>
                </div>
              </div>

              {/* GRAFIKA REFERENCYJNA — tylko Custom */}
              {frontTheme === 'custom' && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: '#f59e0b', letterSpacing: '2px', margin: '0 0 12px' }}>// grafika referencyjna (styl karty)</p>
                  <button className={styles.btnSecondary} style={{ width: '100%', padding: '12px', fontSize: '13px' }} onClick={() => refFileFrontRef.current?.click()}>
                    {refFileFront ? `✓ ${refFileFront.name}` : '+ Dodaj zdjęcie referencyjne (np. karta Pokemon, inspiracja stylu)'}
                  </button>
                  <input ref={refFileFrontRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileFront(e.target.files[0]) }} />
                  <div className={styles.field} style={{ marginTop: '10px' }}>
                    <label className={styles.label}>Opis do karty niestandardowej</label>
                    <textarea value={form.customDesc} onChange={e => setForm({...form, customDesc: e.target.value})} placeholder="np. styl kart Pokemon ale zielone kolory, klimat techno, mroczna atmosfera..." />
                  </div>
                </div>
              )}

              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Wstecz</button>
                <button className={styles.btnPrimary} onClick={() => setStep(3)}>Dalej — rewers →</button>
              </div>
            </div>
          )}

          {/* KROK 3 — BACK SIDE */}
          {step === 3 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Co ma być na rewersie?</p>
              <div className={styles.backGrid}>
                {BACK_OPTIONS.map(b => (
                  <div key={b.id}
                    className={`${styles.backCard} ${backOption === b.id ? styles.backCardSelected : ''}`}
                    onClick={() => setBackOption(b.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setBackOption(b.id)}
                    aria-pressed={backOption === b.id}
                  >
                    <div className={styles.backCardTop}>
                      <p className={styles.backCardLabel}>{b.label}</p>
                      <span className={styles.backCardPrice}>{b.price === 0 ? 'gratis' : `+${b.price} zł`}</span>
                    </div>
                    <p className={styles.backCardDesc}>{b.desc}</p>
                    {backOption === b.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>

              {/* Personal Dedication — komentarz tył */}
              {backOption === 'dedication' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>Komentarz tył — treść dedykacji *</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder="np. 'Za każdy rave z Tobą' · imię + data · cytat który chcesz umieścić..." />
                </div>
              )}

              {/* QR Code — komentarz tył */}
              {backOption === 'qr' && (
                <div className={styles.field} style={{ marginTop: '12px' }}>
                  <label className={styles.label}>Komentarz tył — link do QR kodu *</label>
                  <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder="https://instagram.com/twojprofil&#10;Opcjonalnie: dodatkowe uwagi do projektu tyłu..." />
                  <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>Wygenerujemy QR kod z podanego linku</p>
                </div>
              )}

              {/* Custom Artwork — zdjęcie tył + komentarz */}
              {backOption === 'custom_back' && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>// zdjęcie do tyłu karty (back)</p>
                  <button className={styles.btnSecondary} style={{ width: '100%', padding: '12px', fontSize: '13px' }} onClick={() => refFileBackRef.current?.click()}>
                    {refFileBack ? `✓ ${refFileBack.name}` : '+ Dodaj zdjęcie (BACK) — np. zdjęcie budy, grafika na tył karty'}
                  </button>
                  <input ref={refFileBackRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setRefFileBack(e.target.files[0]) }} />
                  <div className={styles.field} style={{ marginTop: '10px' }}>
                    <label className={styles.label}>Komentarz tył *</label>
                    <textarea value={form.notesBack} onChange={e => setForm({...form, notesBack: e.target.value})} placeholder="Opisz co chcesz na rewersie — styl, kolory, nastrój, elementy..." />
                  </div>
                </div>
              )}

              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Wstecz</button>
                <button className={styles.btnPrimary} onClick={() => setStep(4)}>Dalej — ilość →</button>
              </div>
            </div>
          )}

          {/* KROK 4 — ILOŚĆ I CENA */}
          {step === 4 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Ile kart zamawiasz?</p>

              <div className={styles.quantityWrap}>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>

              {hasDiscount && (
                <div className={styles.discountBadge}>
                  🎉 Rabat 50% aktywny — zamawiasz {quantity} sztuki tego samego typu!
                </div>
              )}
              {quantity === 2 && (
                <div className={styles.discountHint}>
                  Dodaj jeszcze 1 kartę i oszczędź 50% na całości!
                </div>
              )}

              <div className={styles.priceSummary}>
                <p className={styles.summaryRow}><span>Typ karty</span><strong>{cardObj.label}</strong></p>
                <p className={styles.summaryRow}><span>Motyw frontu</span><strong>{FRONT_THEMES.find(t=>t.id===frontTheme)?.label}</strong></p>
                <p className={styles.summaryRow}><span>Rewers</span><strong>{backObj.label}</strong></p>
                <p className={styles.summaryRow}><span>Cena za sztukę</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>Ilość</span><strong>× {quantity}</strong></p>
                {hasDiscount && (
                  <p className={styles.summaryRow}><span>Rabat 50%</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>
                )}
                <div className={styles.summaryTotal}>
                  <span>Łącznie</span>
                  <strong className={styles.totalPrice}>{totalPrice} zł</strong>
                </div>
                <p className={styles.summaryNote}>Płatność przelewem po zatwierdzeniu projektu.</p>
              </div>

              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(3)}>← Wstecz</button>
                <button className={styles.btnPrimary} onClick={() => setStep(5)}>Dalej — dane kontaktowe →</button>
              </div>
            </div>
          )}

          {/* KROK 5 — DANE KONTAKTOWE */}
          {step === 5 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Dane kontaktowe</p>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Imię i nazwisko *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Anna Kowalska" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="anna@email.com" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Telefon</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+48 500 000 000" />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Adres wysyłki *</label>
                  <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="ul. Przykładowa 1, 00-000 Warszawa" />
                </div>
              </div>

              {/* KOD RABATOWY */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginTop: '8px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--neon)', letterSpacing: '2px', margin: '0 0 10px' }}>// kod rabatowy</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={discountCode}
                    onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountMsg(null); setDiscountApplied(false); setDiscountPct(0) }}
                    placeholder="np. RAVE10"
                    style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px' }}
                    disabled={discountApplied}
                  />
                  <button
                    onClick={applyDiscount}
                    disabled={!discountCode.trim() || discountApplied}
                    className={styles.btnSecondary}
                    style={{ width: 'auto', padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}
                  >
                    {discountApplied ? '✓ Aktywny' : 'Zastosuj'}
                  </button>
                </div>
                {discountMsg && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: discountApplied ? 'var(--success)' : 'var(--error)' }}>
                    {discountMsg}
                  </p>
                )}
              </div>

              {/* PODSUMOWANIE CENY */}
              <div className={styles.priceSummary} style={{ marginTop: '8px' }}>
                <p className={styles.summaryRow}><span>{cardObj.label}</span><strong>{cardObj.price} zł</strong></p>
                <p className={styles.summaryRow}><span>Rewers — {backObj.label}</span><strong>{backObj.price === 0 ? 'gratis' : `+${backObj.price} zł`}</strong></p>
                <p className={styles.summaryRow}><span>Cena za sztukę</span><strong>{unitPrice} zł</strong></p>
                <p className={styles.summaryRow}><span>Ilość</span><strong>× {quantity}</strong></p>
                {hasDiscount && (
                  <p className={styles.summaryRow}><span>Rabat ilościowy (50%)</span><strong className={styles.discount}>−{savedAmount} zł</strong></p>
                )}
                {discountApplied && (
                  <p className={styles.summaryRow}><span>Kod rabatowy ({discountCode.toUpperCase()} −{discountPct}%)</span><strong className={styles.discount}>−{discountSaved} zł</strong></p>
                )}
                <div className={styles.summaryTotal}>
                  <span>Do zapłaty</span>
                  <strong className={styles.totalPrice}>{totalPrice} zł</strong>
                </div>
                <p className={styles.summaryNote}>Płatność przelewem lub BLIK po zatwierdzeniu projektu. Dane do płatności wyślemy mailem.</p>
              </div>

              {/* ZGODA RODO */}
              <div
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid ${agreed ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '14px', cursor: 'pointer' }}
                onClick={() => setAgreed(a => !a)}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${agreed ? 'var(--success)' : 'var(--border)'}`, background: agreed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all .15s' }}>
                  {agreed && <span style={{ color: '#0a0014', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Zapoznałem/am się z <a href="/regulamin" target="_blank" style={{ color: 'var(--neon)' }} onClick={e => e.stopPropagation()}>regulaminem</a> oraz <a href="/polityka-prywatnosci" target="_blank" style={{ color: 'var(--neon)' }} onClick={e => e.stopPropagation()}>polityką prywatności</a> i akceptuję warunki zamówienia. Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji zamówienia.
                </p>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(4)}>← Wstecz</button>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={sending || !agreed}
                  style={{ opacity: !agreed ? 0.5 : 1 }}
                >
                  {sending ? 'Wysyłam...' : `Wyślij zamówienie (${totalPrice} zł) →`}
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
          <a href="/regulamin" className={styles.footerLink}>Regulamin</a>
          <span className={styles.footerDot}>·</span>
          <a href="/polityka-prywatnosci" className={styles.footerLink}>Polityka prywatności</a>
          <span className={styles.footerDot}>·</span>
          <a href="/portfolio" className={styles.footerLink}>Portfolio</a>
        </div>
        <p className={styles.footerCopy}>© 2025 RaveAdventure. Wszystkie prawa zastrzeżone.</p>
      </footer>
    </main>
  )
}
