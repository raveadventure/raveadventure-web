import type { Metadata } from 'next'
import { Orbitron, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SmoothScrollProvider from '../components/SmoothScrollProvider'

// next/font self-hostuje fonty (bez blokującego @import z Google Fonts) — szybszy pierwszy render,
// brak dodatkowego round-tripu do fonts.googleapis.com.
//
// Redesign 2026-08-02 (Faza 0, kierunek wizualny wg skilla frontend-design): Space Grotesk/Space
// Mono zamienione na Orbitron (nagłówki — agresywny, geometryczny, bliżej estetyki flyerów
// techno/HUD niż "tech startup", które sugerowała baza ui-ux-pro-max dla Space Grotesk) +
// JetBrains Mono (WSZYSTKO inne — tekst, etykiety/eyebrow, przyciski). To zastępuje jednocześnie
// dawną rolę Space Grotesk (body) i Space Mono (etykiety) jednym fontem, więc nadal dokładnie
// 2 fonty łącznie, zgodnie z briefem. Mapowanie ról w app/globals.css (--font-hero/--font-body/
// --font-display wszystkie teraz przez te dwie zmienne).
const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '800', '900'], variable: '--font-heading-raw', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700'], variable: '--font-mono-raw', display: 'swap' })

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
    <html lang="pl" className={`${orbitron.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <SmoothScrollProvider />
        {children}
      </body>
    </html>
  )
}
