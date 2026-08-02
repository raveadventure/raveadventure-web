import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

// next/font self-hostuje fonty (bez blokującego @import z Google Fonts) — szybszy pierwszy render,
// brak dodatkowego round-tripu do fonts.googleapis.com. Trzeci font (Unbounded, tylko do nagłówków)
// usunięty 2026-08-02 — brief marketingowy chciał max 2 fonty; wszystkie miejsca używające
// --font-hero (patrz globals.css) już miały jawne font-weight:700, więc po podmianie na pogrubiony
// Space Grotesk wygląd nagłówków zostaje mocny bez dodatkowych zmian w CSS. `shadcn init` (2026-08-02)
// próbował dorzucić 3. font (Geist, przez --font-sans) — celowo usunięty, zostają te same 2 fonty.
const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '700'], variable: '--font-body-raw', display: 'swap' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display-raw', display: 'swap' })

// Ten sam fallback co w app/api/send-order i send-design — jedno źródło prawdy dla
// produkcyjnego adresu, potrzebne żeby metadataBase poprawnie budował bezwzględne URL-e
// (og:image, canonical) niezależnie od tego, gdzie strona jest aktualnie hostowana.
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raveadventure.pl'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'RaveAdventure — Twoja karta festiwalowa',
  description: 'Personalizowane karty wielkości karty kredytowej z motywem techno i rave. Zamów swoją unikalną kartę festiwalową.',
  keywords: 'karta festiwalowa, techno, rave, personalizowana karta, festival card',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'RaveAdventure — Twoja karta festiwalowa',
    description: 'Personalizowane karty z motywem techno i rave. Twoje zdjęcie, Twój styl.',
    url: baseUrl,
    siteName: 'RaveAdventure',
    locale: 'pl_PL',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'RaveAdventure — karty festiwalowe' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RaveAdventure — Twoja karta festiwalowa',
    description: 'Personalizowane karty z motywem techno i rave. Twoje zdjęcie, Twój styl.',
    images: ['/og-image.jpg'],
  },
}

// Dane strukturalne (schema.org) — pomagają Google zrozumieć, że to konkretna marka/usługa,
// nie tylko strona tekstowa; mogą też poprawić wygląd wyniku w wyszukiwarce (np. link do strony
// głównej jako "sitelink"). Nie wpływa na treść widoczną dla użytkownika.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RaveAdventure',
  url: baseUrl,
  logo: `${baseUrl}/logo_kwadrat.png`,
  description: 'Personalizowane karty kolekcjonerskie z motywem techno i rave — Twoje zdjęcie z festiwalu w formacie karty bankomatowej.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
