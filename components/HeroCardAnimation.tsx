'use client'
import { useEffect, useState } from 'react'

// Fazy: photo → flash → artwork → frame → attrs → final → (loop)
const PHASES = [
  { id: 'photo', dur: 2200 },
  { id: 'flash', dur: 450 },
  { id: 'artwork', dur: 1600 },
  { id: 'frame', dur: 1100 },
  { id: 'attrs', dur: 2300 },
  { id: 'final', dur: 3000 },
] as const

type Phase = typeof PHASES[number]['id']

// Strefy karty (procenty z anim-card.png 591x1063)
const ZONES = {
  artwork: 'inset(11.5% 6% 29% 6%)',       // grafika (1)
  frame: 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 6% 11.5%, 94% 11.5%, 94% 98.3%, 6% 98.3%, 6% 11.5%)', // ramka + top bar (2)
  name: 'inset(71.3% 5% 18.4% 5%)',        // a — RAVE FAMILY
  attr1: 'inset(81.8% 5% 12.6% 5%)',       // b — ENERGY x5
  skill: 'inset(87.4% 5% 7.3% 5%)',        // c — EXIST WARSAW EXPO XXI
  attr2: 'inset(92.5% 5% 1.7% 5%)',        // d — HAPPINESS x3
}

export default function HeroCardAnimation() {
  const [phase, setPhase] = useState<Phase>('photo')

  useEffect(() => {
    const i1 = new Image(); i1.src = '/anim-photo.jpg'
    const i2 = new Image(); i2.src = '/anim-card.png'
  }, [])

  useEffect(() => {
    const current = PHASES.find(p => p.id === phase)!
    const idx = PHASES.indexOf(current)
    const next = PHASES[(idx + 1) % PHASES.length]
    const t = setTimeout(() => setPhase(next.id), current.dur)
    return () => clearTimeout(t)
  }, [phase])

  const idx = PHASES.findIndex(p => p.id === phase)
  const isPhoto = phase === 'photo'
  const isFlash = phase === 'flash'
  const isArtwork = phase === 'artwork'
  const isFinal = phase === 'final'

  // Warstwa karty — img z clip-path
  const CardLayer = ({ clip, show, anim, z = 2 }: { clip: string; show: boolean; anim?: string; z?: number }) => {
    if (!show) return null
    return (
      <img
        src="/anim-card.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          clipPath: clip,
          animation: anim,
          zIndex: z,
        }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <style>{`
        @keyframes raZoom { 0% { transform: scale(1); } 100% { transform: scale(1.06); } }
        @keyframes raFlash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes raScan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 72%; opacity: 0; }
        }
        @keyframes raArtIn {
          0% { opacity: 0; filter: brightness(2) saturate(0); }
          100% { opacity: 1; filter: brightness(1) saturate(1); }
        }
        @keyframes raFrameIn {
          0% { opacity: 0; transform: scale(1.12); }
          70% { opacity: 1; transform: scale(0.99); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes raDrop {
          0% { opacity: 0; transform: translateY(-28px) scale(1.06); }
          65% { opacity: 1; transform: translateY(3px) scale(1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes raShine {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }
        @keyframes raGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(180,77,255,0.35), 0 0 60px rgba(180,77,255,0.12); }
          50% { box-shadow: 0 0 38px rgba(180,77,255,0.6), 0 0 90px rgba(180,77,255,0.25); }
        }
        @keyframes raTilt {
          0%, 100% { transform: rotateY(-4deg) rotateX(2deg); }
          50% { transform: rotateY(4deg) rotateX(-2deg); }
        }
        @keyframes raPop {
          0% { opacity: 0; transform: translateY(8px) scale(0.85); }
          60% { transform: translateY(-2px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{ perspective: '900px' }}>
        <div
          style={{
            position: 'relative',
            width: 'min(240px, 62vw)',
            aspectRatio: '0.556',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#07070f',
            border: '1px solid rgba(180,77,255,0.25)',
            animation: isFinal ? 'raGlow 2.4s ease-in-out infinite, raTilt 5s ease-in-out infinite' : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ZDJĘCIE ORYGINALNE — znika po flashu */}
          {idx <= 1 && (
            <img
              src="/anim-photo.jpg"
              alt="Zdjęcie z festiwalu"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                animation: isPhoto ? 'raZoom 2.2s ease-out forwards' : undefined,
              }}
            />
          )}

          {/* VIEWFINDER */}
          {(isPhoto || isFlash) && (
            <>
              {[
                { top: '10px', left: '10px', borderWidth: '2px 0 0 2px' },
                { top: '10px', right: '10px', borderWidth: '2px 2px 0 0' },
                { bottom: '10px', left: '10px', borderWidth: '0 0 2px 2px' },
                { bottom: '10px', right: '10px', borderWidth: '0 2px 2px 0' },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', width: '22px', height: '22px',
                  borderStyle: 'solid', borderColor: '#fff', opacity: 0.9,
                  zIndex: 3, ...pos,
                } as React.CSSProperties} />
              ))}
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px', zIndex: 3 }}>
                ● REC
              </div>
            </>
          )}

          {/* FLASH */}
          {isFlash && (
            <div style={{ position: 'absolute', inset: 0, background: '#fff', animation: 'raFlash 0.45s ease-out forwards', zIndex: 6 }} />
          )}

          {/* 1 — GRAFIKA (artwork na czarnym tle) */}
          <CardLayer clip={ZONES.artwork} show={idx >= 2} anim={isArtwork ? 'raArtIn 1.4s ease-out both' : undefined} z={2} />

          {/* SCANLINE podczas artwork */}
          {isArtwork && (
            <div style={{
              position: 'absolute', left: '6%', right: '6%', height: '3px',
              background: 'linear-gradient(90deg, transparent, #b44dff, #00f0ff, #b44dff, transparent)',
              boxShadow: '0 0 16px #b44dff, 0 0 32px rgba(180,77,255,0.6)',
              animation: 'raScan 1.5s linear forwards', zIndex: 5,
            }} />
          )}

          {/* 2 — RAMKA + górny pasek */}
          <CardLayer clip={ZONES.frame} show={idx >= 3} anim={phase === 'frame' ? 'raFrameIn 0.9s ease-out both' : undefined} z={3} />

          {/* 3 — ATRYBUTY spadają kolejno: a, b, c, d */}
          <CardLayer clip={ZONES.name}  show={idx >= 4} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 0.0s both' : undefined} z={4} />
          <CardLayer clip={ZONES.attr1} show={idx >= 4} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 0.5s both' : undefined} z={4} />
          <CardLayer clip={ZONES.skill} show={idx >= 4} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 1.0s both' : undefined} z={4} />
          <CardLayer clip={ZONES.attr2} show={idx >= 4} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 1.5s both' : undefined} z={4} />

          {/* SHINE — final */}
          {isFinal && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 7, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '45%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                animation: 'raShine 1.6s ease-in-out 0.5s',
              }} />
            </div>
          )}
        </div>
      </div>

      {/* ETYKIETY PROCESU */}
      <div style={{ display: 'flex', gap: '6px', minHeight: '26px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isPhoto && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: 'rgba(240,238,255,0.5)', animation: 'raPop 0.3s ease-out' }}>
            // twoje zdjęcie z eventu
          </span>
        )}
        {isFlash && (
          <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', color: '#fff', animation: 'raPop 0.2s ease-out' }}>
            📸 CLICK!
          </span>
        )}
        {isArtwork && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#00f0ff', animation: 'raPop 0.3s ease-out' }}>
            // przerabiamy w sztukę...
          </span>
        )}
        {phase === 'frame' && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#b44dff', animation: 'raPop 0.3s ease-out' }}>
            // dodajemy ramkę
          </span>
        )}
        {phase === 'attrs' && (
          <>
            {['NAZWA', 'ATRYBUT 1', 'UMIEJĘTNOŚĆ', 'ATRYBUT 2'].map((label, i) => (
              <span key={label} style={{
                fontSize: '10px', fontFamily: 'monospace', letterSpacing: '1px',
                color: '#00e5a0', background: 'rgba(0,229,160,0.08)',
                border: '1px solid rgba(0,229,160,0.3)', padding: '3px 10px',
                borderRadius: '20px',
                animation: `raPop 0.35s ease-out ${i * 0.5}s both`,
              }}>
                ✓ {label}
              </span>
            ))}
          </>
        )}
        {isFinal && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#b44dff', fontWeight: 700, animation: 'raPop 0.3s ease-out' }}>
            ✦ Twoja karta gotowa
          </span>
        )}
      </div>
    </div>
  )
}
