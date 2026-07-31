// Przykładowe opinie — źródło prawdy dla lokalnego mocka (.dev-reviews) oraz treść wstawiona
// bezpośrednio do produkcyjnej tabeli `reviews` w Supabase. Trzymane osobno od devReviewsStore.ts,
// żeby dało się łatwo podejrzeć/zmienić samą treść bez grzebania w logice pliku.
export type ReviewSeedItem = {
  created_at: string
  name: string
  rating: number
  content: string
  photo_url: string | null
  approved: boolean
  lang: 'pl' | 'en'
}

export const REVIEWS_SEED: ReviewSeedItem[] = [
  {
    created_at: '2025-08-12T10:00:00.000Z',
    name: 'Kasia W.',
    rating: 5,
    content: 'Zamówiłyśmy karty dla całej ekipy po Audioriverze — 5 sztuk, każda inna, a i tak wszystko dopięte na czas. Jakość wykonania robi wrażenie, karta wygląda jak prawdziwa karta kolekcjonerska. Polecam każdemu, kto chce mieć pamiątkę z festiwalu inną niż zdjęcia w telefonie.',
    photo_url: null,
    approved: true,
    lang: 'pl',
  },
  {
    created_at: '2025-09-03T10:00:00.000Z',
    name: 'Czesiek',
    rating: 5,
    content: 'Dorzuciłem opcję NFC do swojej karty i to był strzał w dziesiątkę — stukam telefonem i leci playlista z imprezy. Ludzie pytają co to za karta, jak to działa. Kontakt z Michałem super, szybko odpisuje i cierpliwie tłumaczy opcje.',
    photo_url: null,
    approved: true,
    lang: 'pl',
  },
  {
    created_at: '2025-11-15T10:00:00.000Z',
    name: 'Ihatemodels_fan',
    rating: 5,
    content: 'Perfekcyjna pamiątka, uwielbiam!!! Zawsze w portfelu (przydaje się na afterach) 😎',
    photo_url: null,
    approved: true,
    lang: 'pl',
  },
  {
    created_at: '2025-12-02T10:00:00.000Z',
    name: 'Mooonik',
    rating: 5,
    content: 'To jest naprawdę niesamowity pomysł na pamiątkę - też mamy z ekipą swoją kartę "Rave Family" 🔥',
    photo_url: null,
    approved: true,
    lang: 'pl',
  },
]
