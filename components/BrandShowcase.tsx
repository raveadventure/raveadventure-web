'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

// Pasek "gotowych plakatów" (Michał wgrał 5 zdjęć wygenerowanych w narzędziu do zdjęć produktowych,
// każde już z wypalonym w grafikę angielskim nagłówkiem/podpisem — 2026-08-21). Świadomie NIE
// wciśnięte w istniejącą galerię "prawdziwe karty" (RealCardsSection) — tamta siatka jest zrobiona
// pod małe, przycięte kafelki z osobnym podpisem HTML pod spodem; te zdjęcia to kompletne,
// pionowe (1520:2688) plakaty z tekstem wewnątrz kadru, więc przycinanie/zmniejszanie do tamtego
// wzorca ucięłoby ten tekst. Angielskie podpisy zostają nietknięte mimo że strona ma przełącznik
// PL/EN — scena rave/techno i tak swobodnie miesza polski z angielskim słownictwem (Top Holder,
// NFC, „Zamów kartę"), więc to spójne klimatycznie, nie niedopatrzenie.
const TXT = {
  pl: {
    title: 'Więcej niż karta',
    sub: 'Karta, która towarzyszy Ci na evencie, w podróży i w domu.',
    hint: 'przesuń, aby zobaczyć więcej →',
  },
  en: {
    title: 'More than a card',
    sub: 'A card that stays with you — at the event, on the road, and at home.',
    hint: 'swipe to see more →',
  },
}

const PHOTOS = [
  { id: 'hand', file: 'hand.jpg', altPl: 'Osoba trzyma podświetloną kartę RaveAdventure na tle sceny festiwalowej', altEn: 'A person holding a glowing RaveAdventure card in front of festival stage lights' },
  { id: 'festival-memento', file: 'festival-memento.jpg', altPl: 'Karta RaveAdventure w Top Holderze na stojaku, prezentowana jako pamiątka z festiwalu', altEn: 'A RaveAdventure card in a Top Holder stand, presented as a festival keepsake' },
  { id: 'nfc', file: 'nfc.jpg', altPl: 'Zbliżenie telefonu do karty RaveAdventure z technologią NFC', altEn: 'A phone tapping a RaveAdventure card equipped with NFC' },
  { id: 'top-holder-shelf', file: 'top-holder-shelf.jpg', altPl: 'Osoba czyści kartę w Top Holderze stojącą na półce', altEn: 'A person wiping a card in a Top Holder stand on a shelf' },
  { id: 'fridge', file: 'fridge.jpg', altPl: 'Kolekcja kart RaveAdventure z magnesami na lodówce', altEn: 'A growing collection of RaveAdventure cards as fridge magnets' },
]

export default function BrandShowcase({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(i => (i === null ? i : (i + 1) % PHOTOS.length))
      if (e.key === 'ArrowLeft') setLightbox(i => (i === null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  return (
    <section id="marka" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground mb-2.5">{t.title}</h2>
      <p className="mx-auto mb-2 max-w-[560px] text-sm leading-[1.7] text-muted-foreground">{t.sub}</p>
      <p className="mb-6 text-xs text-[var(--text-faint)] sm:hidden">{t.hint}</p>

      <div className="relative">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PHOTOS.map((photo, i) => (
            <div
              key={photo.id}
              onClick={() => setLightbox(i)}
              className="relative shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl border border-border shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:-translate-y-1 hover:border-primary"
              style={{ width: 220, aspectRatio: '1520 / 2688' }}
            >
              <Image
                src={`/brand-showcase/${photo.file}`}
                alt={lang === 'pl' ? photo.altPl : photo.altEn}
                fill
                sizes="(max-width: 640px) 220px, 260px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        {/* Delikatny poblask na prawej krawędzi — sygnalizuje, że pasek da się przewinąć dalej,
            nie tnie żadnej karty w spoczynku (bo scrollbox jest wyśrodkowany na pierwszej karcie
            na mobile, więc prawa krawędź zawsze pokazuje kawałek kolejnej). */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center bg-[rgba(8,8,16,0.95)] p-5"
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label={lang === 'pl' ? 'Zamknij' : 'Close'}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <button
            onClick={e => { e.stopPropagation(); setLightbox(i => (i === null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length)) }}
            aria-label={lang === 'pl' ? 'Poprzednie zdjęcie' : 'Previous image'}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary sm:left-4"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <img
              src={`/brand-showcase/${PHOTOS[lightbox].file}`}
              alt={lang === 'pl' ? PHOTOS[lightbox].altPl : PHOTOS[lightbox].altEn}
              className="max-h-[85vh] max-w-[90vw] rounded-xl"
            />
          </div>

          <button
            onClick={e => { e.stopPropagation(); setLightbox(i => (i === null ? i : (i + 1) % PHOTOS.length)) }}
            aria-label={lang === 'pl' ? 'Następne zdjęcie' : 'Next image'}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary sm:right-4"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            {lightbox + 1} / {PHOTOS.length}
          </div>
        </div>
      )}
    </section>
  )
}
