'use client'
import { useState } from 'react'

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

const PHOTOS = ['card-1', 'card-2', 'card-3', 'card-4']

export default function RealCardsSection({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <section id="prawdziwe-karty" style={{ padding: '32px 5vw 40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center', scrollMarginTop: 'var(--nav-height, 70px)' }}>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>{t.eyebrow}</p>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>{t.title}</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto 28px' }}>{t.sub}</p>

      {/* GALERIA ZDJĘĆ PRAWDZIWYCH KART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px', textAlign: 'left' }}>
        {PHOTOS.map(id => (
          <div
            key={id}
            onClick={() => setLightbox(`/real-cards/${id}.jpg`)}
            style={{ position: 'relative', aspectRatio: '0.8', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}
          >
            <img src={`/real-cards/${id}.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          </div>
        ))}
      </div>

      {/* WIDEO: karty w portfelu — wyśrodkowane, węższy blok niż cała sekcja */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px', maxWidth: '640px', margin: '0 auto 14px' }}>
        {['wallet-1', 'wallet-2'].map(id => (
          <div key={id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <video
              src={`/real-cards/${id}.mp4`}
              poster={`/real-cards/${id}-poster.jpg`}
              muted
              loop
              autoPlay
              playsInline
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>{t.walletCaption}</p>

      {/* LIGHTBOX ZDJĘĆ */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'pointer' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px' }} />
        </div>
      )}
    </section>
  )
}
