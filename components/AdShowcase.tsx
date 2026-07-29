'use client'
import { useEffect, useRef, useState } from 'react'

const TXT = {
  pl: { eyebrow: '// reklama', title: 'Zobacz RaveAdventure w akcji' },
  en: { eyebrow: '// promo', title: 'See RaveAdventure in action' },
}

const CLIPS = ['/real-cards/promo-ad.mp4', '/real-cards/card-animation.mp4']
const POSTERS = ['/real-cards/promo-ad-poster.jpg', '/real-cards/card-animation-poster.jpg']

export default function AdShowcase({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const [muted, setMuted] = useState(true)
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]

  useEffect(() => {
    videoRefs.forEach(r => { if (r.current) r.current.muted = muted })
  }, [muted])

  useEffect(() => {
    const el = videoRefs[active].current
    if (el) { el.currentTime = 0; el.play().catch(() => {}) }
  }, [active])

  const handleEnded = () => {
    setFading(true)
    setTimeout(() => {
      const current = videoRefs[active].current
      if (current) current.pause()
      setActive(a => (a + 1) % CLIPS.length)
      setFading(false)
    }, 500)
  }

  return (
    <section style={{ padding: '32px 5vw 8px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>{t.eyebrow}</p>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>{t.title}</h2>

      <div style={{ position: 'relative', maxWidth: '380px', aspectRatio: '9/16', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
        {CLIPS.map((src, i) => (
          <video
            key={src}
            ref={videoRefs[i]}
            src={src}
            poster={POSTERS[i]}
            muted={muted}
            playsInline
            autoPlay={i === 0}
            onEnded={active === i ? handleEnded : undefined}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: active === i && !fading ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        ))}

        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? (lang === 'pl' ? 'Włącz dźwięk' : 'Unmute') : (lang === 'pl' ? 'Wyłącz dźwięk' : 'Mute')}
          style={{
            position: 'absolute', bottom: '14px', right: '14px', zIndex: 2,
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(8,8,16,0.65)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </section>
  )
}
