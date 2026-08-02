'use client'
import { useState } from 'react'
import Image from 'next/image'

const TXT = {
  pl: {
    eyebrow: '// prawdziwe karty',
    title: 'To nie tylko grafika na ekranie',
    sub: 'Każda karta trafia do Ciebie jako prawdziwy, namacalny przedmiot — plastikowa karta w formacie karty bankomatowej, którą nosisz w portfelu razem z resztą kart.',
    walletCaption: '✅ Prawdziwe nagranie — bez CGI',
  },
  en: {
    eyebrow: '// real cards',
    title: 'Not just a design on a screen',
    sub: 'Every card arrives as a real, tangible object — a PVC card in ATM-card format that lives in your wallet alongside the rest of your cards.',
    walletCaption: '✅ Real footage — no CGI',
  },
}

const PHOTOS = [
  { id: 'card-1', captionPl: 'Ekipa z ulubionego setu — zawsze pod ręką, w jednej karcie.', captionEn: 'Your crew from that one set — always close, in a single card.' },
  { id: 'card-2', captionPl: 'Karta-hołd dla Twojego ulubionego artysty z line-upu.', captionEn: 'A tribute card for your favorite artist from the lineup.' },
  { id: 'card-3', captionPl: 'Noc w Amsterdamie, zamknięta w kolekcjonerskiej karcie.', captionEn: 'A night in Amsterdam, sealed into a collectible card.' },
  { id: 'card-4', captionPl: 'Cały festiwal z lotu ptaka — pamiątka, którą masz zawsze przy sobie.', captionEn: 'The whole festival from above — a keepsake you always carry.' },
]

export default function RealCardsSection({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null)

  return (
    <section id="prawdziwe-karty" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <p className="font-mono text-xs tracking-[2px] text-primary mb-3">{t.eyebrow}</p>
      <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground mb-2.5">{t.title}</h2>
      <p className="mx-auto mb-7 max-w-[560px] text-sm leading-[1.7] text-muted-foreground">{t.sub}</p>

      {/* GALERIA ZDJĘĆ PRAWDZIWYCH KART */}
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 text-left">
        {PHOTOS.map(photo => (
          <div key={photo.id}>
            <div
              onClick={() => setLightbox({ src: `/real-cards/${photo.id}.jpg`, caption: lang === 'pl' ? photo.captionPl : photo.captionEn })}
              className="relative aspect-[0.8] cursor-pointer overflow-hidden rounded-2xl border border-border"
            >
              <Image src={`/real-cards/${photo.id}.jpg`} alt={lang === 'pl' ? photo.captionPl : photo.captionEn} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" loading="lazy" />
            </div>
            <p className="mt-2 text-xs leading-[1.5] text-muted-foreground">{lang === 'pl' ? photo.captionPl : photo.captionEn}</p>
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
      <p className="text-[11px] text-[var(--text-faint)]">{t.walletCaption}</p>

      {/* LIGHTBOX ZDJĘĆ */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center bg-[rgba(8,8,16,0.92)] p-5"
        >
          <img src={lightbox.src} alt={lightbox.caption} className="max-h-[90vh] max-w-[90vw] rounded-xl" />
        </div>
      )}
    </section>
  )
}
