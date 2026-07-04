'use client'
import { useEffect, useState } from 'react'

// Fazy: photo → flash → transform → build → final → (loop)
const PHASES = [
  { id: 'photo', dur: 2200 },
  { id: 'flash', dur: 450 },
  { id: 'transform', dur: 1700 },
  { id: 'build', dur: 2100 },
  { id: 'final', dur: 2800 },
] as const

type Phase = typeof PHASES[number]['id']

export default function HeroCardAnimation() {
  const [phase, setPhase] = useState<Phase>('photo')

  useEffect(() => {
    // Preload obrazów
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

  const phaseIdx = PHASES.findIndex(p => p.id === phase)
  const cardVisible = phaseIdx >= 2 // transform, build, final
  const isTransform = phase === 'transform'
  const isBuild = phase === 'build'
  const isFinal = phase === 'final'
  const isFlash = phase === 'flash'
  const isPhoto = phase === 'photo'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <style>{`
        @keyframes raScan {
          0% { top: -4%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes raShine {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }
        @keyframes raPop {
          0% { opacity: 0; transform: translateY(8px) scale(0.85); }
          60% { transform: translateY(-2px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes raFlash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes raZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        @keyframes raGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(180,77,255,0.35), 0 0 60px rgba(180,77,255,0.12); }
          50% { box-shadow: 0 0 38px rgba(180,77,255,0.6), 0 0 90px rgba(180,77,255,0.25); }
        }
        @keyframes raTilt {
          0%, 100% { transform: rotateY(-4deg) rotateX(2deg); }
          50% { transform: rotateY(4deg) rotateX(-2deg); }
        }
      `}</style>

      {/* SCENA */}
      <div style={{ perspective: '900px' }}>
        <div
          style={{
            position: 'relative',
            width: 'min(240px, 62vw)',
            aspectRatio: '0.58',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#0d0d1a',
            border: '1px solid rgba(180,77,255,0.25)',
            animation: isFinal ? 'raGlow 2.4s ease-in-out infinite, raTilt 5s ease-in-out infinite' : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ZDJĘCIE ORYGINALNE */}
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

          {/* VIEWFINDER — rogi aparatu (tylko faza photo) */}
          {(isPhoto || isFlash) && (
            <>
              {[
                { top: '10px', left: '10px', borderWidth: '2px 0 0 2px' },
                { top: '10px', right: '10px', borderWidth: '2px 2px 0 0' },
                { bottom: '10px', left: '10px', borderWidth: '0 0 2px 2px' },
                { bottom: '10px', right: '10px', borderWidth: '0 2px 2px 0' },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '22px',
                  height: '22px',
                  borderStyle: 'solid',
                  borderColor: '#fff',
                  opacity: 0.9,
                  ...pos,
                } as React.CSSProperties} />
              ))}
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                ● REC
              </div>
            </>
          )}

          {/* FLASH */}
          {isFlash && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: '#fff',
              animation: 'raFlash 0.45s ease-out forwards',
              zIndex: 5,
            }} />
          )}

          {/* KARTA — odsłaniana od góry (transform) potem pełna */}
          {cardVisible && (
            <img
              src="/anim-card.png"
              alt="Gotowa karta RaveAdventure"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                clipPath: isTransform ? undefined : 'inset(0 0 0% 0)',
                animation: isTransform ? 'raReveal 1.7s linear forwards' : undefined,
                zIndex: 2,
              }}
            />
          )}
          <style>{`
            @keyframes raReveal {
              0% { clip-path: inset(0 0 100% 0); }
              100% { clip-path: inset(0 0 0% 0); }
            }
          `}</style>

          {/* SCANLINE */}
          {isTransform && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #b44dff, #00f0ff, #b44dff, transparent)',
              boxShadow: '0 0 16px #b44dff, 0 0 32px rgba(180,77,255,0.6)',
              animation: 'raScan 1.7s linear forwards',
              zIndex: 3,
            }} />
          )}

          {/* SHINE — przejeżdżający błysk (final) */}
          {isFinal && (
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              zIndex: 4,
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '45%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                animation: 'raShine 1.6s ease-in-out 0.4s',
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
        {isTransform && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#00f0ff', animation: 'raPop 0.3s ease-out' }}>
            // przerabiamy w sztukę...
          </span>
        )}
        {isBuild && (
          <>
            {['RAMKA', 'NAZWA', 'ATRYBUTY'].map((label, i) => (
              <span key={label} style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                color: '#00e5a0',
                background: 'rgba(0,229,160,0.08)',
                border: '1px solid rgba(0,229,160,0.3)',
                padding: '3px 10px',
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
