'use client'
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import styles from './page.module.css'

const THEMES = [
  { id: 'techno', label: 'Techno', desc: 'Grid, beton, ciemność', accent: '#b44dff' },
  { id: 'rave',   label: 'Rave',   desc: 'Nocna impreza, laser', accent: '#00f0ff' },
  { id: 'festival', label: 'Festival', desc: 'Scena, tłum, światła', accent: '#ff6b35' },
  { id: 'travel', label: 'Adventure', desc: 'Droga, wolność, natura', accent: '#00e5a0' },
]

type Step = 1 | 2 | 3

export default function Home() {
  const [step, setStep] = useState<Step>(1)
  const [theme, setTheme] = useState('techno')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', cardText: '', notes: '' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    setSending(true)
    setError(null)
    try {
      let photoUrl = null
      if (photo) {
        // Bezpieczna nazwa pliku — tylko litery, cyfry i kropka
        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const safeExt = ['jpg','jpeg','png','gif','webp','heic'].includes(ext) ? ext : 'jpg'
        const fileName = `orders/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

        const { error: uploadError } = await supabase.storage
          .from('order-photos')
          .upload(fileName, photo, { contentType: photo.type || 'image/jpeg' })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Błąd uploadu zdjęcia: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('orders').insert([{
        theme,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        card_text: form.cardText,
        notes: form.notes,
        photo_url: photoUrl,
        status: 'new',
      }])

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(`Błąd zapisu: ${insertError.message}`)
      }

      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd'
      setError(`Coś poszło nie tak: ${msg}. Napisz na kontakt@raveadventure.pl`)
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const selectedTheme = THEMES.find(t => t.id === theme)!

  if (sent) {
    return (
      <div className={styles.sentWrap}>
        <div className={styles.sentBox}>
          <div className={styles.sentIcon}>✓</div>
          <h2>Zamówienie wysłane!</h2>
          <p>Odezwiemy się w ciągu 24h na adres <strong>{form.email}</strong> z projektem karty do zatwierdzenia.</p>
          <button className={styles.btnPrimary} onClick={() => { setSent(false); setStep(1); setForm({ name:'',email:'',phone:'',address:'',cardText:'',notes:'' }); setPhoto(null); setPhotoPreview(null) }}>
            Zamów kolejną kartę
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className={styles.main}>
      {/* NAV */}
      <nav className={styles.nav}>
        <span className={styles.logo}>Rave<span>Adventure</span></span>
        <a href="#order" className={styles.navCta}>Zamów kartę</a>
      </nav>

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
            Personalizowane karty wielkości karty kredytowej z klimatem techno i rave.
            Mieszczą się w portfelu — zabierasz ze sobą na każdy event.
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Format karty kredytowej</span>
            <span className={styles.badge}>Druk PVC</span>
            <span className={styles.badge}>Projekt w 24h</span>
          </div>
          <a href="#order" className={styles.btnHero}>Zamów swoją kartę →</a>
        </div>
        <div className={styles.heroCard} aria-hidden="true">
          <div className={styles.previewCard} style={{ '--accent': selectedTheme.accent } as React.CSSProperties}>
            <span className={styles.previewThemeLabel}>{selectedTheme.label}</span>
            <span className={styles.previewScan}>▓▓▓ ▓▓▓▓ ▓▓▓▓</span>
            <span className={styles.previewName}>RAVE ADVENTURE</span>
          </div>
        </div>
      </section>

      {/* THEMES */}
      <section className={styles.section} id="themes">
        <p className={styles.sectionEye}>// motywy</p>
        <h2 className={styles.sectionTitle}>Wybierz swój klimat</h2>
        <div className={styles.themesGrid}>
          {THEMES.map(t => (
            <div
              key={t.id}
              className={`${styles.themeCard} ${theme === t.id ? styles.themeSelected : ''}`}
              style={{ '--accent': t.accent } as React.CSSProperties}
              onClick={() => setTheme(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setTheme(t.id)}
              aria-pressed={theme === t.id}
            >
              <div className={styles.themeAccentBar} />
              <p className={styles.themeLabel}>{t.label}</p>
              <p className={styles.themeDesc}>{t.desc}</p>
              {theme === t.id && <span className={styles.themeCheck}>✓</span>}
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
            { n: '01', t: 'Zamów online', d: 'Wybierz motyw, wypełnij formularz, dodaj zdjęcie.' },
            { n: '02', t: 'Zatwierdzasz projekt', d: 'W ciągu 24h wysyłamy projekt do akceptacji. Możesz prosić o poprawki.' },
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

      {/* ORDER FORM */}
      <section className={styles.section} id="order">
        <p className={styles.sectionEye}>// zamówienie</p>
        <h2 className={styles.sectionTitle}>Zamów swoją kartę</h2>

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          {([1,2,3] as Step[]).map(n => (
            <div key={n} className={`${styles.stepDot} ${step === n ? styles.stepDotActive : ''} ${step > n ? styles.stepDotDone : ''}`}>
              {step > n ? '✓' : n}
            </div>
          ))}
          <div className={styles.stepLine} style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
        <div className={styles.stepLabels}>
          <span>Motyw</span><span>Dane</span><span>Zdjęcie</span>
        </div>

        <div className={styles.formBox}>
          {/* STEP 1 — theme */}
          {step === 1 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Potwierdzasz motyw</p>
              <div className={styles.themesGridSm}>
                {THEMES.map(t => (
                  <div
                    key={t.id}
                    className={`${styles.themeCard} ${theme === t.id ? styles.themeSelected : ''}`}
                    style={{ '--accent': t.accent } as React.CSSProperties}
                    onClick={() => setTheme(t.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setTheme(t.id)}
                    aria-pressed={theme === t.id}
                  >
                    <div className={styles.themeAccentBar} />
                    <p className={styles.themeLabel}>{t.label}</p>
                    <p className={styles.themeDesc}>{t.desc}</p>
                    {theme === t.id && <span className={styles.themeCheck}>✓</span>}
                  </div>
                ))}
              </div>
              <button className={styles.btnPrimary} onClick={() => setStep(2)}>
                Dalej — dane kontaktowe →
              </button>
            </div>
          )}

          {/* STEP 2 — contact */}
          {step === 2 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Dane kontaktowe i adres</p>
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
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Tekst na karcie <span className={styles.optional}>(opcjonalnie — maks. 3 słowa)</span></label>
                  <input value={form.cardText} onChange={e => setForm({...form, cardText: e.target.value})} placeholder="np. imię, rok, hasło..." />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Dodatkowe uwagi <span className={styles.optional}>(opcjonalnie)</span></label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Opisz swój pomysł, okazję, kolorystykę..." />
                </div>
              </div>
              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Wstecz</button>
                <button className={styles.btnPrimary} onClick={() => {
                  if (!form.name || !form.email || !form.address) { setError('Uzupełnij imię, email i adres.'); return; }
                  setError(null); setStep(3)
                }}>Dalej — dodaj zdjęcie →</button>
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
            </div>
          )}

          {/* STEP 3 — photo + submit */}
          {step === 3 && (
            <div className={styles.formStep}>
              <p className={styles.formStepTitle}>Dodaj swoje zdjęcie</p>
              <div
                className={`${styles.dropZone} ${photoPreview ? styles.dropZoneFilled : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                aria-label="Kliknij lub przeciągnij zdjęcie"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Podgląd zdjęcia" className={styles.photoPreview} />
                  : <>
                      <span className={styles.dropIcon}>↑</span>
                      <p className={styles.dropTitle}>Kliknij lub przeciągnij zdjęcie</p>
                      <p className={styles.dropSub}>JPG, PNG, HEIC · maks. 20 MB · min. 1500 × 1000 px</p>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]) }} />
              {photoPreview && (
                <button className={styles.btnSecondary} style={{ marginTop: '8px', width: 'auto', padding: '6px 16px', fontSize: '13px' }} onClick={() => { setPhoto(null); setPhotoPreview(null) }}>
                  Usuń zdjęcie
                </button>
              )}

              <div className={styles.photoTips}>
                <p className={styles.tipsTitle}>Wskazówki do zdjęcia</p>
                <ul>
                  <li>✓ Poziome, dobrze oświetlone, wyraźna twarz lub motyw</li>
                  <li>✓ Zdjęcie z imprezy, w plenerze lub studio</li>
                  <li>✗ Unikaj bardzo ciemnych lub rozmazanych zdjęć</li>
                </ul>
              </div>

              <div className={styles.summary}>
                <p className={styles.summaryRow}><span>Motyw</span><strong>{selectedTheme.label}</strong></p>
                <p className={styles.summaryRow}><span>Zamawia</span><strong>{form.name}</strong></p>
                <p className={styles.summaryRow}><span>Email</span><strong>{form.email}</strong></p>
                <p className={styles.summaryRow}><span>Cena</span><strong className={styles.price}>89 zł</strong></p>
                <p className={styles.summaryNote}>Płatność przelewem po zatwierdzeniu projektu.</p>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.formButtons}>
                <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Wstecz</button>
                <button className={styles.btnPrimary} onClick={handleSubmit} disabled={sending}>
                  {sending ? 'Wysyłam...' : 'Wyślij zamówienie →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p className={styles.footerLogo}>RaveAdventure</p>
        <p className={styles.footerSub}>kontakt@raveadventure.pl</p>
        <p className={styles.footerCopy}>© 2025 RaveAdventure. Wszystkie prawa zastrzeżone.</p>
      </footer>
    </main>
  )
}
