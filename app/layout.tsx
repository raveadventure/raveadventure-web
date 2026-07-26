import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono, Unbounded } from 'next/font/google'
import './globals.css'

// next/font self-hostuje fonty (bez blokującego @import z Google Fonts) — szybszy pierwszy render,
// brak dodatkowego round-tripu do fonts.googleapis.com. Unbounded to nowy, mocniejszy font
// nagłówkowy (duże napisy hero/sekcji), Space Grotesk/Mono zostają jak dotąd (tekst/etykiety UI).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '700'], variable: '--font-body-raw', display: 'swap' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display-raw', display: 'swap' })
const unbounded = Unbounded({ subsets: ['latin', 'latin-ext'], weight: ['500', '700', '900'], variable: '--font-hero-raw', display: 'swap' })

export const metadata: Metadata = {
  title: 'RaveAdventure — Twoja karta festiwalowa',
  description: 'Personalizowane karty wielkości karty kredytowej z motywem techno i rave. Zamów swoją unikalną kartę festiwalową.',
  keywords: 'karta festiwalowa, techno, rave, personalizowana karta, festival card',
  openGraph: {
    title: 'RaveAdventure — Twoja karta festiwalowa',
    description: 'Personalizowane karty z motywem techno i rave. Twoje zdjęcie, Twój styl.',
    url: 'https://raveadventure.pl',
    siteName: 'RaveAdventure',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${spaceGrotesk.variable} ${spaceMono.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  )
}
