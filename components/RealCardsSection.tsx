'use client'
import { useState } from 'react'

const TXT = {
  pl: {
    eyebrow: '// prawdziwe karty',
    title: 'To nie tylko grafika na ekranie',
    sub: 'Każda karta trafia do Ciebie jako prawdziwy, namacalny przedmiot — plastikowa karta w formacie karty bankomatowej, którą nosisz w portfelu razem z resztą kart.',
    walletCaption: '✅ Prawdziwe nagranie — bez CGI',
    adLabel: 'Zobacz nasz spot',
    play: 'Odtwórz z dźwiękiem',
  },
  en: {
    eyebrow: '// real cards',
    title: 'Not just a design on a screen',
    sub: 'Every card arrives as a real, tangible object — a PVC card in ATM-card format that lives in your wallet alongside the rest of your cards.',
    walletCaption: '✅ Real footage — no CGI',
    adLabel: 'Watch our video',
    play: 'Play with sound',
  },
}

const PHOTOS = ['card-1', 'card-2', 'card-3', 'card-4']

export default function RealCardsSection({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [adPlaying, setAdPlaying] = useState(false)

  return (
    <section style={{ padding: '32px 5vw 40px', maxWidth: '1100px', margin: '0 auto' }}>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>{t.eyebrow}</p>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>{t.title}</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '560px', marginBottom: '28px' }}>{t.sub}</p>

      {/* GALERIA ZDJĘĆ PRAWDZIWYCH KART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px' }}>
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

      {/* WIDEO: karty w portfelu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
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
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '0 0 32px' }}>{t.walletCaption}</p>

      {/* SPOT REKLAMOWY — z dźwiękiem, więc odtwarzany dopiero na kliknięcie */}
      <div
        onClick={() => setAdPlaying(true)}
        style={{
          position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: adPlaying ? 'default' : 'pointer',
          border: '1px solid var(--border)', maxWidth: '480px', aspectRatio: '0.8', background: '#000',
        }}
      >
        {adPlaying ? (
          <video src="/real-cards/promo-ad.mp4" controls autoPlay style={{ width: '100%', height: '100%', display: 'block' }} />
        ) : (
          <>
            <img src="/real-cards/promo-ad-poster.jpg" alt={t.adLabel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,16,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#0a0014' }}>▶</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{t.play}</p>
            </div>
          </>
        )}
      </div>

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
