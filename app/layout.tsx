import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
