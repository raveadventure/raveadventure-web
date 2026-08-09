'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

const TXT = {
  pl: {
    title: 'To nie tylko grafika na ekranie',
    sub: 'Każda karta trafia do Ciebie jako prawdziwy, namacalny przedmiot — plastikowa karta w formacie karty bankomatowej, którą nosisz w portfelu razem z resztą kart.',
    walletCaption: '✅ Prawdziwe nagranie — bez CGI',
    premiumTitle: 'Twoja pamiątka w akcesoriach premium',
    premiumSub: 'Top Holder ze stojakiem na biurko albo na lodówkę — Twoja karta zawsze na widoku, nie w szufladzie.',
  },
  en: {
    title: 'Not just a design on a screen',
    sub: 'Every card arrives as a real, tangible object — a PVC card in ATM-card format that lives in your wallet alongside the rest of your cards.',
    walletCaption: '✅ Real footage — no CGI',
    premiumTitle: 'Your keepsake in premium accessories',
    premiumSub: 'Top Holder with a desk stand or fridge mount — your card always on display, not in a drawer.',
  },
}

const PHOTOS = [
  { id: 'card-1', captionPl: 'Ekipa z ulubionego setu — zawsze pod ręką, w jednej karcie.', captionEn: 'Your crew from that one set — always close, in a single card.' },
  { id: 'card-2', captionPl: 'Karta-hołd dla Twojego ulubionego artysty z line-upu.', captionEn: 'A tribute card for your favorite artist from the lineup.' },
  { id: 'card-3', captionPl: 'Noc w Amsterdamie, zamknięta w kolekcjonerskiej karcie.', captionEn: 'A night in Amsterdam, sealed into a collectible card.' },
  { id: 'card-4', captionPl: 'Cały festiwal z lotu ptaka — pamiątka, którą masz zawsze przy sobie.', captionEn: 'The whole festival from above — a keepsake you always carry.' },
]

// Osobna sekcja "akcesoria premium" (poniżej wideo z portfelem) — Top Holder na stojaku i na
// lodówce, świadomie oddzielone od zwykłej galerii "karta w dłoni" powyżej: pokazuje eskalację
// od codziennego noszenia (portfel) do wystawienia na widoku (biurko/lodówka).
const PREMIUM_PHOTOS = [
  { id: 'top-holder-1', tagPl: 'STOJAK NA BIURKO', tagEn: 'DESK STAND', titlePl: 'Mini-plakat', titleEn: 'Mini-poster', captionPl: 'Karta w Top Holderze na stojaku — mini-plakat z najlepszej nocy w Amsterdamie.', captionEn: 'A card in a Top Holder stand — a mini-poster from your best night in Amsterdam.' },
  { id: 'top-holder-2', tagPl: 'DWIE KARTY', tagEn: 'TWO CARDS', titlePl: 'Mini-galeria', titleEn: 'Mini-gallery', captionPl: 'Dwie karty, dwóch ulubionych DJ-ów — Twoja mini-galeria na biurku.', captionEn: 'Two cards, two favorite DJs — your own mini-gallery on the desk.' },
  { id: 'fridge-1', tagPl: 'NA LODÓWCE', tagEn: 'ON THE FRIDGE', titlePl: 'Zawsze na widoku', titleEn: 'Always on display', captionPl: 'Top Holder na lodówce — pamiątka, którą widzisz codziennie.', captionEn: 'A Top Holder on the fridge — a keepsake you see every day.' },
  { id: 'fridge-2', tagPl: 'NA LODÓWCE', tagEn: 'ON THE FRIDGE', titlePl: 'Cała ekipa', titleEn: 'The whole crew', captionPl: 'Ekipa z Twojego ulubionego festiwalu, zawsze na widoku w kuchni.', captionEn: 'Your crew from your favorite festival, always in view in the kitchen.' },
  { id: 'fridge-3', tagPl: 'CAŁA KOLEKCJA', tagEn: 'FULL COLLECTION', titlePl: 'Mini-galeria wspomnień', titleEn: 'A gallery of memories', captionPl: 'Cała kolekcja na lodówce — Top Holder do każdej karty, mini-galeria Twoich wspomnień.', captionEn: 'Your whole collection on the fridge — a Top Holder for every card, a mini-gallery of your memories.' },
  { id: 'fridge-4', tagPl: 'SAM MAGNES', tagEn: 'JUST THE MAGNET', titlePl: 'Bez etui', titleEn: 'No case', captionPl: 'Wersja bez etui — sam magnes, prosto na lodówkę.', captionEn: 'The no-case version — just the magnet, straight on the fridge.' },
]

// Tymczasowe ograniczenie do 2×2 (Michał, 2026-08-04) — docelowo sekcja ma pokazywać 4 rzędy
// (8 zdjęć), ale brakuje jeszcze 2 nowych fotek. Do tego czasu wyświetlamy tylko te 4, reszta
// ZOSTAJE w PREMIUM_PHOTOS gotowa do włączenia — usuń ten filtr (i wróć renderPhotoGrid do
// domyślnej siatki auto-fit), gdy dojdą kolejne zdjęcia. fridge-3 (Top Holdery na lodówce)
// zamieniony na fridge-4 (te same 3 karty, sam magnes bez etui) — Michał chciał pokazać wariant
// bez Top Holdera zamiast dublować go z fridge-1.
const PREMIUM_FEATURED_IDS = ['top-holder-1', 'top-holder-2', 'fridge-1', 'fridge-4']

export default function RealCardsSection({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  // Galeria "prawdziwe karty" (4 zdjęcia) — rozszerzanie na hover + lightbox z nawigacją
  // strzałka/licznik, zamiast zwykłej siatki. Świadomie osobny stan od `lightbox` wyżej (ten
  // zostaje bez zmian dla galerii akcesoriów premium) — tu lightbox musi znać SWÓJ indeks w
  // PHOTOS, żeby strzałki przewijały wewnątrz tej samej czwórki zdjęć.
  const [galleryHover, setGalleryHover] = useState<number | null>(null)
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null)

  // Galeria "akcesoria premium" — jeden aktywny kafelek na raz (accordion, nie hover-expand
  // wszystkich naraz jak wyżej): domyślnie 2. zdjęcie już rozwinięte, żeby sekcja od razu
  // wyglądała interesująco, nie płasko, zanim ktokolwiek najedzie kursorem.
  const featuredPremium = PREMIUM_PHOTOS.filter(p => PREMIUM_FEATURED_IDS.includes(p.id))
  const [activePremium, setActivePremium] = useState(featuredPremium[1]?.id ?? featuredPremium[0]?.id)

  useEffect(() => {
    if (galleryLightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryLightbox(null)
      if (e.key === 'ArrowRight') setGalleryLightbox(i => (i === null ? i : (i + 1) % PHOTOS.length))
      if (e.key === 'ArrowLeft') setGalleryLightbox(i => (i === null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryLightbox])

  return (
    <section id="prawdziwe-karty" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground mb-2.5">{t.title}</h2>
      <p className="mx-auto mb-7 max-w-[560px] text-sm leading-[1.7] text-muted-foreground">{t.sub}</p>

      {/* GALERIA ZDJĘĆ PRAWDZIWYCH KART — codzienne noszenie (dłoń/telefon). Dwa osobne
          renderowania, nie jeden responsywny hybrid: na mobile hover nie istnieje, więc
          hover-expand nie miałby tam sensu (zostaje sprawdzony, prosty grid 2×2 z podpisem pod
          każdym zdjęciem, jak dotąd). Na desktopie (sm+): poziomy pasek, najechane zdjęcie
          rozszerza się kosztem sąsiadów (czysty CSS `transition-[flex]`, bez żadnej biblioteki
          animacji — projekt świadomie stoi na samym GSAP, nie dokładamy Framer Motion dla
          jednego hover-efektu); podpisy nie mieszczą się sensownie pod dynamicznie zmieniającą
          szerokość kolumną, więc tu żyją w lightboksie po kliknięciu (z licznikiem i strzałkami). */}
      <div className="mb-7 grid grid-cols-2 gap-2.5 text-left sm:hidden">
        {PHOTOS.map((photo, i) => (
          <div key={photo.id}>
            <div
              onClick={() => setGalleryLightbox(i)}
              className="relative aspect-[0.8] cursor-pointer overflow-hidden rounded-2xl border border-border"
            >
              <Image src={`/real-cards/${photo.id}.jpg`} alt={lang === 'pl' ? photo.captionPl : photo.captionEn} fill sizes="45vw" className="object-cover" loading="lazy" />
            </div>
            <p className="mt-2 text-xs leading-[1.5] text-muted-foreground">{lang === 'pl' ? photo.captionPl : photo.captionEn}</p>
          </div>
        ))}
      </div>
      <div className="mb-7 hidden text-left sm:flex sm:h-[380px] sm:gap-2">
        {PHOTOS.map((photo, i) => (
          <div
            key={photo.id}
            onMouseEnter={() => setGalleryHover(i)}
            onMouseLeave={() => setGalleryHover(null)}
            onClick={() => setGalleryLightbox(i)}
            style={{ flex: galleryHover === null ? 1 : galleryHover === i ? 2.4 : 0.7 }}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-border transition-[flex] duration-500 ease-in-out"
          >
            <Image
              src={`/real-cards/${photo.id}.jpg`}
              alt={lang === 'pl' ? photo.captionPl : photo.captionEn}
              fill
              sizes="380px"
              className="object-cover"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
              style={{ opacity: galleryHover === i ? 0 : 0.25 }}
            />
          </div>
        ))}
      </div>

      {/* WIDEO: karty w portfelu — wyśrodkowane, węższy blok niż cała sekcja */}
      <div className="mx-auto mb-3.5 grid max-w-[640px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
        {['wallet-1', 'wallet-2'].map(id => (
          <div key={id} className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border">
            <video
              src={`/real-cards/${id}.mp4`}
              poster={`/real-cards/${id}-poster.jpg`}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover block"
            />
          </div>
        ))}
      </div>
      <p className="mb-8 text-[11px] text-[var(--text-faint)]">{t.walletCaption}</p>

      {/* AKCESORIA PREMIUM: Top Holder na stojaku / na lodówce — eskalacja od "noszę przy sobie"
          (galeria + wideo wyżej) do "mam wystawione na widoku". Osobny nagłówek, nie wrzucone do
          głównej galerii, żeby wizualnie odróżnić standardowe noszenie od dodatkowego wykończenia. */}
      <h3 className="font-heading text-[clamp(18px,2.4vw,24px)] font-bold text-foreground mb-2">{t.premiumTitle}</h3>
      <p className="mx-auto mb-7 max-w-[560px] text-sm leading-[1.7] text-muted-foreground">{t.premiumSub}</p>

      {/* Galeria "elastyczna" — jeden kafelek naraz rośnie (flex-[4] vs flex-[1]) kosztem
          pozostałych, jaśnieje na aktywnym/hover, przyciemnia resztę. Pionowo na mobile (kafelki
          rosną WYSOKOŚCIĄ, flex-col), poziomo na desktopie (flex-row, rosną SZEROKOŚCIĄ) — ten sam
          kontener obsługuje oba dzięki temu, że flex kieruje się flex-direction, nie potrzeba
          osobnego renderowania jak w galerii "prawdziwe karty" wyżej. Czysty CSS
          `transition-[flex,filter]`, zero nowych zależności (next/image i lucide-react już są
          w projekcie). CTA "Zamów →" prowadzi do formularza, nie do nieistniejącej "strony
          projektu" — to jedyna realna akcja, jaką klient może tu wykonać. */}
      <div className="mx-auto flex h-[480px] w-full max-w-[700px] flex-col gap-2 sm:h-[420px] sm:flex-row sm:gap-3">
        {featuredPremium.map(photo => {
          const isActive = activePremium === photo.id
          return (
            <div
              key={photo.id}
              onMouseEnter={() => setActivePremium(photo.id)}
              onClick={() => setActivePremium(photo.id)}
              className={`relative cursor-pointer overflow-hidden rounded-2xl border border-border transition-[flex,filter] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'flex-[4] brightness-100' : 'flex-[1] brightness-50 hover:brightness-75'}`}
            >
              <Image
                src={`/real-cards/${photo.id}.jpg`}
                alt={lang === 'pl' ? photo.captionPl : photo.captionEn}
                fill
                sizes="(max-width: 640px) 92vw, 700px"
                className={`object-cover transition-transform duration-1000 ${isActive ? 'scale-100' : 'scale-110'}`}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-500"
                style={{ opacity: isActive ? 1 : 0 }}
              />

              {/* Etykieta kategorii — zawsze w lewym górnym rogu (aktywny i nieaktywny kafelek),
                  nie w bloku treści na dole — widoczna na pierwszy rzut oka, bez potrzeby hover. */}
              <span className="pointer-events-none absolute left-3 top-3 z-10 inline-block w-fit rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md sm:left-4 sm:top-4">
                {lang === 'pl' ? photo.tagPl : photo.tagEn}
              </span>

              {/* Treść aktywnego kafelka */}
              <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 transition-all duration-500 sm:p-6 ${isActive ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-8 opacity-0'}`}>
                <h4 className="text-xl font-black uppercase leading-tight text-white sm:text-3xl">
                  {lang === 'pl' ? photo.titlePl : photo.titleEn}
                </h4>
                <p className="max-w-[320px] text-xs leading-[1.5] text-white/75 sm:text-[13px]">
                  {lang === 'pl' ? photo.captionPl : photo.captionEn}
                </p>
                <a href="#order" className="mt-1 flex w-fit items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/90 transition-colors hover:text-primary">
                  {lang === 'pl' ? 'Zamów' : 'Order now'} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Etykieta nieaktywnego kafelka — tytuł (nie tag, ten jest już zawsze widoczny w
                  rogu wyżej), pionowo na desktopie (wąska kolumna), poziomo na mobile (niski,
                  zwinięty pasek) */}
              <div className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500 sm:bottom-6 ${isActive ? 'scale-50 opacity-0' : 'opacity-100 delay-300'}`}>
                <span className="hidden whitespace-nowrap text-sm font-bold uppercase tracking-widest text-white sm:block" style={{ writingMode: 'vertical-rl' }}>
                  {lang === 'pl' ? photo.titlePl : photo.titleEn}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-white sm:hidden">
                  {lang === 'pl' ? photo.titlePl : photo.titleEn}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* LIGHTBOX GALERII "PRAWDZIWE KARTY" — z nawigacją strzałka/licznik, osobny od powyższego */}
      {galleryLightbox !== null && (
        <div
          onClick={() => setGalleryLightbox(null)}
          className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center bg-[rgba(8,8,16,0.95)] p-5"
        >
          <button
            onClick={() => setGalleryLightbox(null)}
            aria-label={lang === 'pl' ? 'Zamknij' : 'Close'}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {PHOTOS.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setGalleryLightbox(i => (i === null ? i : (i - 1 + PHOTOS.length) % PHOTOS.length)) }}
              aria-label={lang === 'pl' ? 'Poprzednie zdjęcie' : 'Previous image'}
              className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary sm:left-4"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}

          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <img
              src={`/real-cards/${PHOTOS[galleryLightbox].id}.jpg`}
              alt={lang === 'pl' ? PHOTOS[galleryLightbox].captionPl : PHOTOS[galleryLightbox].captionEn}
              className="max-h-[75vh] max-w-[90vw] rounded-xl"
            />
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {lang === 'pl' ? PHOTOS[galleryLightbox].captionPl : PHOTOS[galleryLightbox].captionEn}
            </p>
          </div>

          {PHOTOS.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setGalleryLightbox(i => (i === null ? i : (i + 1) % PHOTOS.length)) }}
              aria-label={lang === 'pl' ? 'Następne zdjęcie' : 'Next image'}
              className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary sm:right-4"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            {galleryLightbox + 1} / {PHOTOS.length}
          </div>
        </div>
      )}
    </section>
  )
}
