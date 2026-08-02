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
    <section data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-2 text-center">
      <p className="font-mono text-xs tracking-[2px] text-primary mb-3">{t.eyebrow}</p>
      <h2 className="font-heading text-[clamp(20px,3vw,28px)] font-bold text-foreground mb-5">{t.title}</h2>

      <div className="relative mx-auto aspect-[9/16] max-w-[380px] overflow-hidden rounded-2xl border border-border bg-black">
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
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out"
            style={{ opacity: active === i && !fading ? 1 : 0 }}
          />
        ))}

        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? (lang === 'pl' ? 'Włącz dźwięk' : 'Unmute') : (lang === 'pl' ? 'Wyłącz dźwięk' : 'Mute')}
          className="absolute bottom-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/65 text-base text-white cursor-pointer"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </section>
  )
}
