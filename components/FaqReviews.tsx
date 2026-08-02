'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isSupabasePlaceholder, mockListReviews, mockInsertReview, mockUploadReviewFile, compressReviewPhoto, ReviewItem } from '../lib/reviewsLocalMock'

const TXT = {
  pl: {
    eyebrow: '// faq i opinie',
    title: 'Pytania i opinie',
    faqTitle: 'Najczęstsze pytania',
    reviewsTitle: 'Co mówią klienci',
    addReviewBtn: '+ Dodaj opinię',
    closeBtn: 'Zwiń',
    noReviews: 'Bądź pierwszą osobą, która zostawi opinię!',
    form: {
      name: 'Imię',
      namePh: 'np. Kasia',
      rating: 'Ocena',
      content: 'Twoja opinia',
      contentPh: 'Jak przebiegło zamówienie? Co szczególnie Ci się podobało?',
      photo: 'Zdjęcie karty (opcjonalnie)',
      photoAdd: '+ Dodaj zdjęcie',
      submit: 'Wyślij opinię',
      sending: 'Wysyłanie...',
      success: 'Dziękujemy! Opinia pojawi się na stronie po zatwierdzeniu.',
      errName: 'Podaj imię.',
      errContent: 'Napisz kilka słów opinii.',
      errGeneric: 'Coś poszło nie tak, spróbuj ponownie.',
    },
    faq: [
      { q: 'Ile czasu zajmuje realizacja zamówienia?', a: 'Zwykle od kilku dni do ok. 2 tygodni od zatwierdzenia projektu — zależy od liczby zamówień w kolejce. Projekt graficzny do akceptacji dostajesz mailem, zanim cokolwiek trafi do druku.' },
      { q: 'Ile poprawek do projektu mogę zgłosić?', a: 'Poprawki są bezpłatne i możesz je zgłaszać do momentu, aż projekt Ci się spodoba i go zaakceptujesz — nie ma sztywnego limitu.' },
      { q: 'Jak wygląda płatność?', a: 'Płatność (BLIK lub przelew) następuje dopiero po zaakceptowaniu projektu, zanim karta trafi do druku. Dane do płatności dostajesz w mailu razem z projektem.' },
      { q: 'Czym różni się karta PVC od wizytówki?', a: 'Karta PVC to solidna, plastikowa karta w formacie karty bankomatowej — trwała, można dodać opcję NFC/RFID oraz wykończenie (magnes, top loader, stojak). Wizytówka to tańszy wariant papierowy, zestaw 100 sztuk.' },
      { q: 'Co to jest opcja NFC/RFID?', a: 'Karta z wbudowanym chipem NFC — wystarczy zbliżyć telefon, żeby otworzyć np. playlistę, link do zdjęć czy dowolną stronę, którą zaprogramujesz. Dostępna tylko dla karty PVC.' },
      { q: 'Czy mogę zamówić kartę z własnym opisem/motywem (custom)?', a: 'Tak — w formularzu zamówienia wybierz motyw "Custom" i opisz swoją wizję. Projekt graficzny i tak tworzę ręcznie na podstawie Twojego opisu i zdjęć.' },
      { q: 'Co jeśli nie mam idealnego zdjęcia?', a: 'Nie musi być profesjonalne — liczy się głównie ostrość i dobrze widoczna twarz/sylwetka, najlepiej w niezbyt ciemnym świetle. Jeśli wahasz się między kilkoma ujęciami, wyślij to, na którym najlepiej się widzisz — resztę (tło, klimat, kompozycję) dopracowuję ręcznie przy tworzeniu projektu. W razie wątpliwości zawsze możesz dopisać uwagi w formularzu.' },
      { q: 'Jak wygląda dostawa?', a: 'Wysyłka kurierem na adres lub do paczkomatu InPost — wybierasz w ostatnim kroku formularza. Koszt wysyłki to zawsze 15 zł, niezależnie od liczby kart w zamówieniu.' },
      { q: 'Czy przy większym zamówieniu jest rabat?', a: 'Tak — przy zamówieniu 3 lub więcej sztuk automatycznie dostajesz rabat ilościowy, widoczny od razu w podsumowaniu ceny w formularzu.' },
    ],
  },
  en: {
    eyebrow: '// faq & reviews',
    title: 'Questions & reviews',
    faqTitle: 'Frequently asked questions',
    reviewsTitle: 'What customers say',
    addReviewBtn: '+ Add a review',
    closeBtn: 'Collapse',
    noReviews: 'Be the first to leave a review!',
    form: {
      name: 'Name',
      namePh: 'e.g. Kate',
      rating: 'Rating',
      content: 'Your review',
      contentPh: 'How did your order go? What did you like most?',
      photo: 'Card photo (optional)',
      photoAdd: '+ Add photo',
      submit: 'Submit review',
      sending: 'Sending...',
      success: 'Thank you! Your review will appear on the site once approved.',
      errName: 'Please enter your name.',
      errContent: 'Please write a few words.',
      errGeneric: 'Something went wrong, please try again.',
    },
    faq: [
      { q: 'How long does an order take?', a: 'Usually a few days up to about 2 weeks after the design is approved — it depends on the current queue. You get the design by email for approval before anything goes to print.' },
      { q: 'How many design revisions can I request?', a: 'Revisions are free and you can request them until you\'re happy with the design and approve it — there\'s no fixed limit.' },
      { q: 'How does payment work?', a: 'Payment (BLIK or bank transfer) happens only after you approve the design, before printing starts. Payment details are sent by email together with the design.' },
      { q: 'What\'s the difference between a PVC card and a business card?', a: 'The PVC card is a sturdy, ATM-card-format plastic card — durable, with optional NFC/RFID and finish options (magnet, top loader, stand). The business card is a cheaper paper variant, a set of 100 pieces.' },
      { q: 'What is the NFC/RFID option?', a: 'A card with a built-in NFC chip — just tap it with a phone to open e.g. a playlist, a photo link, or any page you program. Available for PVC cards only.' },
      { q: 'Can I order a card with my own custom theme/description?', a: 'Yes — choose "Custom" as the theme in the order form and describe your vision. I still create the artwork by hand based on your description and photos.' },
      { q: 'What if I don\'t have a perfect photo?', a: 'It doesn\'t need to be professional — what matters most is that it\'s sharp and your face/figure is clearly visible, ideally in decent lighting. If you\'re torn between a few shots, send the one you look best in — I\'ll handle the rest (background, mood, composition) by hand while creating the design. You can always add notes in the form if you\'re unsure.' },
      { q: 'How is delivery handled?', a: 'Courier delivery to an address or to an InPost parcel locker — you choose in the last step of the form. Shipping is always a flat 15 zł, regardless of order quantity.' },
      { q: 'Is there a discount for larger orders?', a: 'Yes — ordering 3 or more cards automatically applies a quantity discount, shown right away in the price summary in the form.' },
    ],
  },
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{ fontSize: '20px', cursor: onChange ? 'pointer' : 'default', color: n <= value ? '#f59e0b' : 'var(--text-faint)', lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  )
}

type FaqItem = { q: string; a: string }

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => {
        const open = openIdx === i
        return (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: 'var(--text)', padding: '16px 18px', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span style={{ flex: 1 }}>{item.q}</span>
              <span style={{ color: 'var(--neon)', fontSize: '14px', transition: 'transform 250ms cubic-bezier(0.23, 1, 0.32, 1)', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
            </button>
            <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 300ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                <p style={{ margin: 0, padding: '0 18px 16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FaqReviews({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      if (isSupabasePlaceholder()) {
        const { data } = await mockListReviews()
        setReviews((data || []).filter((r: ReviewItem) => r.approved))
      } else {
        const { data } = await supabase.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false })
        setReviews(data || [])
      }
      setLoading(false)
    })()
  }, [])

  const handleSubmit = async () => {
    setStatus(null)
    if (!name.trim()) { setStatus({ type: 'err', text: t.form.errName }); return }
    if (!content.trim()) { setStatus({ type: 'err', text: t.form.errContent }); return }
    setSending(true)
    try {
      let photoUrl: string | null = null
      const id = crypto.randomUUID()

      if (isSupabasePlaceholder()) {
        if (photoFile) {
          const compressed = await compressReviewPhoto(photoFile)
          photoUrl = await mockUploadReviewFile(compressed)
        }
        const { error } = await mockInsertReview({ id, name: name.trim(), rating, content: content.trim(), photo_url: photoUrl, approved: false, lang })
        if (error) throw new Error(error.message)
      } else {
        if (photoFile) {
          const compressed = await compressReviewPhoto(photoFile)
          const path = `reviews/${id}.jpg`
          const { error: ue } = await supabase.storage.from('order-photos').upload(path, compressed)
          if (ue) throw ue
          const { data: pu } = supabase.storage.from('order-photos').getPublicUrl(path)
          photoUrl = pu.publicUrl
        }
        const { error } = await supabase.from('reviews').insert([{ id, name: name.trim(), rating, content: content.trim(), photo_url: photoUrl, approved: false, lang }])
        if (error) throw error
      }

      setStatus({ type: 'ok', text: t.form.success })
      setName(''); setRating(5); setContent(''); setPhotoFile(null)
    } catch (e: unknown) {
      setStatus({ type: 'err', text: t.form.errGeneric })
    }
    setSending(false)
  }

  return (
    <section id="faq-opinie" style={{ padding: '32px 5vw 60px', maxWidth: '1100px', margin: '0 auto', scrollMarginTop: 'var(--nav-height, 70px)' }}>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px', textAlign: 'center' }}>{t.eyebrow}</p>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 32px', textAlign: 'center' }}>{t.title}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        {/* FAQ */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>{t.faqTitle}</h3>
          <FaqAccordion items={t.faq} />
        </div>

        {/* OPINIE */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.reviewsTitle}</h3>
            <button
              onClick={() => setFormOpen(o => !o)}
              style={{ background: formOpen ? 'transparent' : 'var(--neon)', color: formOpen ? 'var(--text-muted)' : '#0a0014', border: formOpen ? '1px solid var(--border)' : 'none', borderRadius: 'var(--radius)', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {formOpen ? t.closeBtn : t.addReviewBtn}
            </button>
          </div>

          {formOpen && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{t.form.name}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t.form.namePh} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{t.form.rating}</label>
                <Stars value={rating} onChange={setRating} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{t.form.content}</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t.form.contentPh} rows={4} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{t.form.photo}</label>
                <button onClick={() => photoRef.current?.click()} style={{ background: photoFile ? 'rgba(0,229,160,0.08)' : 'var(--surface2)', border: `1px ${photoFile ? 'solid rgba(0,229,160,0.4)' : 'dashed var(--border)'}`, borderRadius: 'var(--radius)', color: photoFile ? 'var(--success)' : 'var(--text-muted)', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {photoFile ? `✓ ${photoFile.name}` : t.form.photoAdd}
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setPhotoFile(e.target.files[0])} />
              </div>
              <button onClick={handleSubmit} disabled={sending} style={{ background: sending ? 'rgba(180,77,255,0.3)' : 'var(--neon)', color: '#0a0014', border: 'none', borderRadius: 'var(--radius)', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {sending ? t.form.sending : t.form.submit}
              </button>
              {status && <p style={{ margin: 0, fontSize: '13px', color: status.type === 'ok' ? 'var(--success)' : 'var(--error)' }}>{status.text}</p>}
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '13px' }}>...</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '13px' }}>{t.noReviews}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{r.name}</strong>
                    <Stars value={r.rating} />
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>{r.content}</p>
                  {r.photo_url && (
                    <img src={r.photo_url} alt="" style={{ maxWidth: '160px', borderRadius: '8px', display: 'block' }} loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
