'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isSupabasePlaceholder, mockListReviews, mockInsertReview, mockUploadReviewFile, compressReviewPhoto, ReviewItem } from '../lib/reviewsLocalMock'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

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
      quote: 'Krótki cytat (opcjonalnie)',
      quotePh: 'np. z wiadomości, którą do mnie wysłałeś/aś — "Karta zrobiła niesamowite wrażenie!"',
      photo: 'Zdjęcie karty lub screenshot wiadomości (opcjonalnie)',
      photoAdd: '+ Dodaj zdjęcie',
      submit: 'Wyślij opinię',
      sending: 'Wysyłanie...',
      success: 'Dziękujemy! Opinia pojawi się na stronie po zatwierdzeniu.',
      errName: 'Podaj imię.',
      errContent: 'Napisz kilka słów opinii.',
      errGeneric: 'Coś poszło nie tak, spróbuj ponownie.',
    },
    faq: [
      { q: 'Ile czasu zajmuje realizacja zamówienia?', a: 'Przygotowanie projektu zajmuje 1–3 dni — dostajesz go mailem do akceptacji, zanim cokolwiek trafi do druku. Po zatwierdzeniu i opłaceniu karta jest wysyłana następnego dnia roboczego. Dalej zależy od dostawy: w Polsce do paczkomatu — do 3 dni, na adres — do 7 dni; za granicę (UE) do paczkomatu InPost — 4–7 dni, na adres — 7–14 dni.' },
      { q: 'Ile poprawek do projektu mogę zgłosić?', a: 'Poprawki są bezpłatne i możesz je zgłaszać do momentu, aż projekt Ci się spodoba i go zaakceptujesz — nie ma sztywnego limitu.' },
      { q: 'Jak wygląda płatność?', a: 'Płatność (BLIK lub przelew) następuje dopiero po zaakceptowaniu projektu, zanim karta trafi do druku. Dane do płatności dostajesz w mailu razem z projektem.' },
      { q: 'Czym różni się karta PVC od wizytówki?', a: 'Karta PVC to solidna, plastikowa karta w formacie karty bankomatowej — trwała, można dodać opcję NFC/RFID oraz wykończenie (magnes, top loader, stojak). Wizytówka to tańszy wariant papierowy, zestaw 100 sztuk.' },
      { q: 'Co to jest opcja NFC/RFID?', a: 'Karta z wbudowanym chipem NFC — wystarczy zbliżyć telefon, żeby otworzyć np. playlistę, link do zdjęć czy dowolną stronę, którą zaprogramujesz. Dostępna tylko dla karty PVC.' },
      { q: 'Czy mogę zamówić kartę z własnym opisem/motywem (custom)?', a: 'Tak — w formularzu zamówienia wybierz motyw "Custom" i opisz swoją wizję. Projekt graficzny i tak tworzę ręcznie na podstawie Twojego opisu i zdjęć.' },
      { q: 'Co jeśli nie mam idealnego zdjęcia?', a: 'Nie musi być profesjonalne — liczy się głównie ostrość i dobrze widoczna twarz/sylwetka, najlepiej w niezbyt ciemnym świetle. Jeśli wahasz się między kilkoma ujęciami, wyślij to, na którym najlepiej się widzisz — resztę (tło, klimat, kompozycję) dopracowuję ręcznie przy tworzeniu projektu. W razie wątpliwości zawsze możesz dopisać uwagi w formularzu.' },
      { q: 'Jak wygląda dostawa?', a: 'Wysyłka kurierem na adres lub do paczkomatu InPost — wybierasz w ostatnim kroku formularza. W Polsce koszt wysyłki to zawsze 15 zł, niezależnie od liczby kart w zamówieniu.' },
      { q: 'Czy wysyłacie za granicę?', a: 'Tak, wysyłamy do krajów UE! W ostatnim kroku formularza wybierz „Zagranica (UE)" — dostawa do paczkomatu InPost kosztuje 40 zł, a na adres 80 zł (zamiast standardowych 15 zł w Polsce). Nasza wyszukiwarka podpowiada tylko polskie paczkomaty, więc przy zagranicznym paczkomacie kod wpisujesz ręcznie — znajdziesz go w aplikacji InPost (lub lokalnym odpowiedniku) w Twoim kraju.' },
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
      quote: 'Short quote (optional)',
      quotePh: 'e.g. from a message you sent me — "This card blew me away!"',
      photo: 'Card photo or a message screenshot (optional)',
      photoAdd: '+ Add photo',
      submit: 'Submit review',
      sending: 'Sending...',
      success: 'Thank you! Your review will appear on the site once approved.',
      errName: 'Please enter your name.',
      errContent: 'Please write a few words.',
      errGeneric: 'Something went wrong, please try again.',
    },
    faq: [
      { q: 'How long does an order take?', a: 'Preparing the design takes 1–3 days — you get it by email for approval before anything goes to print. Once approved and paid, the card ships the next business day. From there it depends on delivery: in Poland to a parcel locker — up to 3 days, to an address — up to 7 days; abroad (EU) to an InPost locker — 4–7 days, to an address — 7–14 days.' },
      { q: 'How many design revisions can I request?', a: 'Revisions are free and you can request them until you\'re happy with the design and approve it — there\'s no fixed limit.' },
      { q: 'How does payment work?', a: 'Payment (BLIK or bank transfer) happens only after you approve the design, before printing starts. Payment details are sent by email together with the design.' },
      { q: 'What\'s the difference between a PVC card and a business card?', a: 'The PVC card is a sturdy, ATM-card-format plastic card — durable, with optional NFC/RFID and finish options (magnet, top loader, stand). The business card is a cheaper paper variant, a set of 100 pieces.' },
      { q: 'What is the NFC/RFID option?', a: 'A card with a built-in NFC chip — just tap it with a phone to open e.g. a playlist, a photo link, or any page you program. Available for PVC cards only.' },
      { q: 'Can I order a card with my own custom theme/description?', a: 'Yes — choose "Custom" as the theme in the order form and describe your vision. I still create the artwork by hand based on your description and photos.' },
      { q: 'What if I don\'t have a perfect photo?', a: 'It doesn\'t need to be professional — what matters most is that it\'s sharp and your face/figure is clearly visible, ideally in decent lighting. If you\'re torn between a few shots, send the one you look best in — I\'ll handle the rest (background, mood, composition) by hand while creating the design. You can always add notes in the form if you\'re unsure.' },
      { q: 'How is delivery handled?', a: 'Courier delivery to an address or to an InPost parcel locker — you choose in the last step of the form. Within Poland, shipping is always a flat 15 zł, regardless of order quantity.' },
      { q: 'Do you ship abroad?', a: 'Yes, we ship to EU countries! Choose "Abroad (EU)" in the last step of the form — delivery to an InPost locker costs 40 zł, and to an address 80 zł (instead of the standard 15 zł within Poland). Our search only suggests Polish parcel lockers, so for a foreign locker you type in the code manually — you\'ll find it in the InPost app (or local equivalent) in your country.' },
      { q: 'Is there a discount for larger orders?', a: 'Yes — ordering 3 or more cards automatically applies a quantity discount, shown right away in the price summary in the form.' },
    ],
  },
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          className={`text-xl leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ color: n <= value ? '#f59e0b' : 'var(--text-faint)' }}
        >★</span>
      ))}
    </div>
  )
}

type FaqItem = { q: string; a: string }

function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <AccordionItem key={i} value={String(i)} className="overflow-hidden rounded-[var(--radius)] border border-border bg-card px-[18px] py-1.5 not-last:border-b-0">
          <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline focus-visible:ring-0 **:data-[slot=accordion-trigger-icon]:text-primary">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-[13px] leading-[1.7] text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
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
  const [quote, setQuote] = useState('')
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
        const { error } = await mockInsertReview({ id, name: name.trim(), rating, content: content.trim(), quote: quote.trim() || null, photo_url: photoUrl, approved: false, lang })
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
        const { error } = await supabase.from('reviews').insert([{ id, name: name.trim(), rating, content: content.trim(), quote: quote.trim() || null, photo_url: photoUrl, approved: false, lang }])
        if (error) throw error
      }

      setStatus({ type: 'ok', text: t.form.success })
      setName(''); setRating(5); setContent(''); setQuote(''); setPhotoFile(null)
    } catch (e: unknown) {
      setStatus({ type: 'err', text: t.form.errGeneric })
    }
    setSending(false)
  }

  return (
    <section id="faq-opinie" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-14 [scroll-margin-top:var(--nav-height,70px)]">
      <p className="mb-3 text-center font-mono text-xs tracking-[2px] text-primary">{t.eyebrow}</p>
      <h2 className="mb-8 text-center font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground">{t.title}</h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-10">
        {/* FAQ */}
        <div>
          <h3 className="mb-4 text-base font-bold text-foreground">{t.faqTitle}</h3>
          <FaqAccordion items={t.faq} />
        </div>

        {/* OPINIE */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground">{t.reviewsTitle}</h3>
            <button
              onClick={() => setFormOpen(o => !o)}
              className={`rounded-[var(--radius)] px-4 py-2 text-[13px] font-bold cursor-pointer font-[inherit] ${
                formOpen ? 'bg-transparent border border-border text-muted-foreground' : 'bg-primary border-none text-[#0a0014]'
              }`}
            >
              {formOpen ? t.closeBtn : t.addReviewBtn}
            </button>
          </div>

          {formOpen && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-[18px]">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t.form.name}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t.form.namePh} className="box-border w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t.form.rating}</label>
                <Stars value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t.form.content}</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t.form.contentPh} rows={4} className="box-border w-full resize-y font-[inherit]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t.form.quote}</label>
                <input value={quote} onChange={e => setQuote(e.target.value.slice(0, 200))} placeholder={t.form.quotePh} maxLength={200} className="box-border w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t.form.photo}</label>
                <button onClick={() => photoRef.current?.click()}
                  className="cursor-pointer rounded-[var(--radius)] px-3.5 py-2.5 text-[13px] font-[inherit] border"
                  style={{
                    background: photoFile ? 'rgba(0,229,160,0.08)' : 'var(--surface2)',
                    borderStyle: photoFile ? 'solid' : 'dashed',
                    borderColor: photoFile ? 'rgba(0,229,160,0.4)' : 'var(--border)',
                    color: photoFile ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                  {photoFile ? `✓ ${photoFile.name}` : t.form.photoAdd}
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setPhotoFile(e.target.files[0])} />
              </div>
              <button onClick={handleSubmit} disabled={sending}
                className={`rounded-[var(--radius)] border-none p-3 text-sm font-bold font-[inherit] ${sending ? 'cursor-not-allowed bg-primary/30' : 'cursor-pointer bg-primary'}`}
                style={{ color: '#0a0014' }}>
                {sending ? t.form.sending : t.form.submit}
              </button>
              {status && <p className="m-0 text-[13px]" style={{ color: status.type === 'ok' ? 'var(--success)' : 'var(--error)' }}>{status.text}</p>}
            </div>
          )}

          {loading ? (
            <p className="text-[13px] text-[var(--text-faint)]">...</p>
          ) : reviews.length === 0 ? (
            <p className="text-[13px] text-[var(--text-faint)]">{t.noReviews}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-[var(--radius)] border border-border bg-card px-[18px] py-4">
                  <div className="mb-2 flex items-center justify-between gap-2.5">
                    <strong className="text-sm text-foreground">{r.name}</strong>
                    <Stars value={r.rating} />
                  </div>
                  {r.quote && (
                    <p className="mb-2 border-l-2 border-primary pl-2.5 text-sm italic leading-[1.6] text-primary">„{r.quote}"</p>
                  )}
                  <p className="mb-2.5 text-[13px] leading-[1.7] text-muted-foreground">{r.content}</p>
                  {r.photo_url && (
                    <img src={r.photo_url} alt="" className="block max-w-[160px] rounded-lg" loading="lazy" />
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
