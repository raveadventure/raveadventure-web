'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(useGSAP, Observer)

// Fazy: photo → flash → artwork → frame → attrs → final → real → (loop)
// "real" (prawdziwa, sfotografowana karta) dotyczy tylko kart z polem `real` (patrz CARDS) —
// dla kart bez tego pola faza jest pomijana w useEffect niżej.
const PHASES = [
  { id: 'photo', dur: 2200 },
  { id: 'flash', dur: 450 },
  { id: 'artwork', dur: 1600 },
  { id: 'frame', dur: 1100 },
  { id: 'attrs', dur: 2300 },
  { id: 'final', dur: 7000 },
  { id: 'real', dur: 2800 },
  { id: 'fade', dur: 900 },
] as const

type Phase = typeof PHASES[number]['id']

const TXT = {
  pl: {
    photo: '// twoje zdjęcie z eventu',
    click: '📸 CLICK!',
    artwork: '// przerabiamy w sztukę...',
    frame: '// dodajemy ramkę',
    attrs: ['NAZWA', 'ATRYBUT 1', 'UMIEJĘTNOŚĆ', 'ATRYBUT 2'],
    final: '✦ Twoja karta gotowa',
    real: '✦ Prawdziwa karta w Twojej dłoni',
    photoAlt: 'Zdjęcie z festiwalu',
    finalAlt: 'Gotowa karta RaveAdventure',
    realAlt: 'Prawdziwa, wydrukowana karta RaveAdventure',
  },
  en: {
    photo: '// your photo from the event',
    click: '📸 CLICK!',
    artwork: '// turning it into art...',
    frame: '// adding the frame',
    attrs: ['NAME', 'ATTRIBUTE 1', 'SKILL', 'ATTRIBUTE 2'],
    final: '✦ Your card is ready',
    real: '✦ A real card in your hands',
    photoAlt: 'Photo from the festival',
    finalAlt: 'Finished RaveAdventure card',
    realAlt: 'A real, printed RaveAdventure card',
  },
}

// Strefy karty #1 (procenty z anim-card.png 591x1063)
const ZONES_1 = {
  artwork: 'inset(11.5% 6% 29% 6%)',
  frame: 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 6% 11.5%, 94% 11.5%, 94% 98.3%, 6% 98.3%, 6% 11.5%)',
  name: 'inset(71.3% 5% 18.4% 5%)',
  attr1: 'inset(81.8% 5% 12.6% 5%)',
  skill: 'inset(87.4% 5% 7.3% 5%)',
  attr2: 'inset(92.5% 5% 1.7% 5%)',
}

// Strefy karty #2 "Rave Family" (procenty z anim-card-2.png 638x1011,
// wyliczone z Twoich oznaczeń kolorami: zielony = ramka+top bar, żółty = blok atrybutów)
const ZONES_2 = {
  artwork: 'inset(9.7% 5% 27.8% 4.4%)',
  frame: 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 4.4% 9.7%, 95% 9.7%, 95% 97.3%, 4.4% 97.3%, 4.4% 9.7%)',
  name: 'inset(72.2% 5% 18.3% 4.4%)',
  attr1: 'inset(81.7% 5% 13.0% 4.4%)',
  skill: 'inset(87.0% 5% 7.9% 4.4%)',
  attr2: 'inset(92.1% 5% 2.8% 4.4%)',
}

// Realne atrybuty widoczne na karcie #2 — pokazywane w plakietkach fazy "attrs"
const CARD2_ATTRS = ['RAVE FAMILY', 'UNITY ×6', 'AUDIORIVER AURA', 'HAPPINESS ×100']

// Kolejne karty odtwarzane w pętli: #1, #2, #3 (nowa, "prawdziwa karta"), potem znów #1... Każda
// ma teraz `real` — dokłada dodatkową fazę po "final": crossfade z cyfrowego projektu do zdjęcia
// prawdziwej, wydrukowanej karty w dłoni — dowód, że to nie tylko plik JPG (patrz WhyUs.tsx).
// Karta #3 dodatkowo nie ma skalibrowanych `zones` (procentowych stref do budowania warstwa-po-
// warstwie jak #1/#2) — `simple: true` sprawia, że pomija fazy artwork/frame/attrs i przechodzi
// prosto do gotowej grafiki.
const CARDS = [
  { photo: '/anim-photo.jpg', card: '/anim-card.png', zones: ZONES_1, real: '/first_animation_real_card.jpg' },
  { photo: '/anim-photo-2.jpg', card: '/anim-card-2.png', zones: ZONES_2, real: '/second_animation_real_card.jpg' },
  { photo: '/new_animation_bacic_photo.png', card: '/new_animation_final_card.png', zones: ZONES_1, simple: true, real: '/new_animation_real_card.png' },
] as const

// Proporcje (szerokość/wysokość) każdego pliku — używane, żeby "scena" mogła
// pomieścić zdjęcie/kartę W CAŁOŚCI, bez przycinania, niezależnie od jej wymiarów.
// Wartości poniżej to realne proporcje Twoich obecnych plików (auto-wykrywane
// i nadpisywane po załadowaniu obrazu — więc jeśli kiedyś podmienisz plik na
// inny o innych wymiarach, wszystko przeliczy się samo, bez zmian w kodzie).
const DEFAULT_RATIOS: Record<string, number> = {
  '/anim-photo.jpg': 0.75, // szacunek — brak oryginalnego pliku do zmierzenia, zostanie skorygowany automatycznie po załadowaniu
  '/anim-card.png': 591 / 1063,
  '/anim-photo-2.jpg': 900 / 1176,
  '/anim-card-2.png': 638 / 1011,
  '/new_animation_bacic_photo.png': 638 / 1011,
  '/new_animation_final_card.png': 638 / 1011,
  '/new_animation_real_card.png': 638 / 1011,
  '/first_animation_real_card.jpg': 1785 / 2830,
  '/second_animation_real_card.jpg': 638 / 1011,
}

// Proporcja samej "sceny" (czarnego tła). Dobrana tak, by przy obecnych
// plikach czarne pasy były minimalne — nie musi pasować idealnie do żadnej
// karty, bo dopasowanie treści (contain-fit) i tak zawsze wyklucza przycięcie.
const STAGE_RATIO = 0.62

function containFit(stageRatio: number, contentRatio: number) {
  if (contentRatio >= stageRatio) {
    return { width: '100%', height: `${(stageRatio / contentRatio) * 100}%` }
  }
  return { width: `${(contentRatio / stageRatio) * 100}%`, height: '100%' }
}

export default function HeroCardAnimation({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const [phase, setPhase] = useState<Phase>('photo')
  const [cardIndex, setCardIndex] = useState(0)
  const [ratios, setRatios] = useState<Record<string, number>>(DEFAULT_RATIOS)

  // Interaktywny tilt + połysk (GSAP) — Faza 1 redesignu. Dodane OBOK istniejącej, dopracowanej
  // sekwencji faz (setTimeout state machine wyżej) zamiast jej przepisywania: to jedyna realna,
  // ryzykowna zmiana wizualna, którą warto było przetestować w izolacji. sceneRef = zewnętrzny
  // kontener 3D (perspective), cardInnerRef = sama karta (preserve-3d, obraca się), glareRef =
  // nowa warstwa połysku podążająca za kursorem.
  const sceneRef = useRef<HTMLDivElement>(null)
  const cardInnerRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!sceneRef.current || !cardInnerRef.current) return
    // Reduced motion: żadnego tiltu/połysku — GSAP pisze transform bezpośrednio do DOM, więc
    // globalna reguła @media (prefers-reduced-motion) w globals.css (celowana w CSS
    // animation/transition) go NIE łapie. Musi być sprawdzone jawnie tutaj.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const card = cardInnerRef.current
    const glare = glareRef.current
    if (glare) gsap.set(glare, { opacity: 0 })
    const quickRotX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' })
    const quickRotY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' })
    const quickGlareX = glare ? gsap.quickTo(glare, 'x', { duration: 0.35, ease: 'power3.out' }) : null
    const quickGlareY = glare ? gsap.quickTo(glare, 'y', { duration: 0.35, ease: 'power3.out' }) : null
    const quickGlareOpacity = glare ? gsap.quickTo(glare, 'opacity', { duration: 0.3 }) : null

    const observer = Observer.create({
      target: sceneRef.current,
      type: 'pointer,touch',
      onMove: self => {
        const rect = sceneRef.current!.getBoundingClientRect()
        const px = gsap.utils.clamp(0, 1, ((self.x ?? 0) - rect.left) / rect.width)
        const py = gsap.utils.clamp(0, 1, ((self.y ?? 0) - rect.top) / rect.height)
        quickRotY(gsap.utils.mapRange(0, 1, -10, 10, px))
        quickRotX(gsap.utils.mapRange(0, 1, 8, -8, py))
        quickGlareX?.(gsap.utils.mapRange(0, 1, -70, 70, px))
        quickGlareY?.(gsap.utils.mapRange(0, 1, -70, 70, py))
        quickGlareOpacity?.(0.5)
      },
      onHoverEnd: () => {
        quickRotX(0)
        quickRotY(0)
        quickGlareOpacity?.(0)
      },
    })

    return () => observer.kill()
  }, { scope: sceneRef })

  const current = CARDS[cardIndex]
  const attrsLabels = cardIndex === 0 ? t.attrs : CARD2_ATTRS

  useEffect(() => {
    const allSrcs = Array.from(new Set(CARDS.flatMap(c => [c.photo, c.card, ...('real' in c && c.real ? [c.real] : [])])))
    allSrcs.forEach(src => {
      const img = new window.Image()
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const real = img.naturalWidth / img.naturalHeight
          setRatios(prev => (prev[src] === real ? prev : { ...prev, [src]: real }))
        }
      }
      img.src = src
    })
  }, [])

  useEffect(() => {
    const card = CARDS[cardIndex]
    const idx = PHASES.findIndex(p => p.id === phase)
    const isLastPhase = idx === PHASES.length - 1
    let nextIdx = (idx + 1) % PHASES.length
    // Karty "simple" (patrz CARDS) nie mają skalibrowanych stref do budowania warstwa-po-warstwie
    // — pomijają artwork/frame/attrs i przechodzą prosto do gotowej grafiki karty.
    if ('simple' in card && card.simple && PHASES[nextIdx].id === 'artwork') {
      nextIdx = PHASES.findIndex(p => p.id === 'final')
    }
    // Faza "real" (crossfade do zdjęcia prawdziwej, wydrukowanej karty) tylko dla kart, które ją mają.
    if (PHASES[nextIdx].id === 'real' && !('real' in card && card.real)) {
      nextIdx = PHASES.findIndex(p => p.id === 'fade')
    }
    const next = PHASES[nextIdx]
    // Karta "simple" (#3) pomija cały wieloetapowy build-up (patrz wyżej), więc "final" nie musi
    // trzymać się tak długo jak u kart #1/#2, które dochodzą do niego przez artwork/frame/attrs.
    const durOverrides: Partial<Record<Phase, number>> = ('simple' in card && card.simple) ? { final: 1800 } : {}
    const currentDur = durOverrides[phase] ?? PHASES[idx].dur
    const timer = setTimeout(() => {
      if (isLastPhase) {
        setCardIndex(ci => (ci + 1) % CARDS.length)
      }
      setPhase(next.id)
    }, currentDur)
    return () => clearTimeout(timer)
  }, [phase, cardIndex])

  const idx = PHASES.findIndex(p => p.id === phase)
  const isPhoto = phase === 'photo'
  const isFlash = phase === 'flash'
  const isArtwork = phase === 'artwork'
  const isFinal = phase === 'final'
  const isReal = phase === 'real'
  const isFade = phase === 'fade'
  const showCard = isFinal || isReal || isFade
  const realSrc = 'real' in current && current.real ? current.real : null

  // Dopóki widoczne jest zdjęcie źródłowe (photo/flash) dopasowujemy scenę do
  // JEGO proporcji; od fazy "artwork" w górę — do proporcji finalnej karty.
  const activeSrc = idx <= 1 ? current.photo : current.card
  const activeRatio = ratios[activeSrc] ?? DEFAULT_RATIOS[activeSrc] ?? STAGE_RATIO
  const frameSize = containFit(STAGE_RATIO, activeRatio)

  const CardLayer = ({ clip, show, anim, z = 2 }: { clip: string; show: boolean; anim?: string; z?: number }) => {
    if (!show) return null
    return (
      <Image
        src={current.card}
        alt=""
        aria-hidden="true"
        fill
        sizes="280px"
        priority
        style={{
          objectFit: 'cover',
          clipPath: clip,
          animation: anim,
          zIndex: z,
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
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
          0% { transform: translate3d(-130%, 0, 0) skewX(-18deg); animation-timing-function: ease-in-out; }
          45% { transform: translate3d(230%, 0, 0) skewX(-18deg); }
          100% { transform: translate3d(230%, 0, 0) skewX(-18deg); }
        }
        @keyframes raGlowPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
        @keyframes raFadeToBlack {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes raFadeFromBlack {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes raPop {
          0% { opacity: 0; transform: translateY(8px) scale(0.85); }
          60% { transform: translateY(-2px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* SCENA: stały, większy obszar z czarnym tłem — mieści zdjęcie/kartę
          w całości niezależnie od jej proporcji (bez przycinania po bokach).
          sceneRef = zasięg Observer (tilt reaguje na ruch myszy w całym tym obszarze, nie tylko
          nad samą kartą — łatwiej "trafić" w efekt). */}
      <div ref={sceneRef} style={{
        perspective: '900px',
        position: 'relative',
        width: 'min(280px, 68vw)',
        aspectRatio: String(STAGE_RATIO),
        background: '#07070f',
        borderRadius: '16px',
        border: '1px solid rgba(180,77,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <div style={{ position: 'relative', width: frameSize.width, height: frameSize.height }}>
        {showCard && (
          <div style={{
            position: 'absolute',
            inset: '-14px',
            borderRadius: '22px',
            background: 'radial-gradient(ellipse at center, rgba(180,77,255,0.35) 0%, rgba(180,77,255,0.12) 55%, transparent 75%)',
            animation: 'raGlowPulse 2.4s ease-in-out infinite',
            willChange: 'opacity',
            pointerEvents: 'none',
          }} />
        )}
        <div
          ref={cardInnerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#07070f',
            border: '1px solid rgba(180,77,255,0.25)',
            boxShadow: showCard ? '0 0 28px rgba(180,77,255,0.4)' : undefined,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {idx <= 1 && (
            <Image
              src={current.photo}
              alt={t.photoAlt}
              fill
              sizes="280px"
              priority
              style={{
                objectFit: 'cover',
                animation: isPhoto ? 'raZoom 2.2s ease-out forwards' : undefined,
              }}
            />
          )}

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

          {isFlash && (
            <div style={{ position: 'absolute', inset: 0, background: '#fff', animation: 'raFlash 0.45s ease-out forwards', zIndex: 6 }} />
          )}

          {showCard && (
            <Image
              src={current.card}
              alt={t.finalAlt}
              fill
              sizes="280px"
              priority
              style={{ objectFit: 'cover', zIndex: 2, transform: 'translateZ(0)' }}
            />
          )}

          {/* Crossfade z cyfrowego projektu do zdjęcia prawdziwej, wydrukowanej karty — dowód
              namacalny, że to nie tylko plik JPG (patrz WhyUs.tsx, "fizyczny produkt, nie plik JPG"). */}
          {(isReal || isFade) && realSrc && (
            <Image
              src={realSrc}
              alt={t.realAlt}
              fill
              sizes="280px"
              priority
              style={{
                objectFit: 'cover',
                zIndex: 2, transform: 'translateZ(0)',
                animation: isReal ? 'raArtIn 0.9s ease-out both' : undefined,
              }}
            />
          )}

          <CardLayer clip={current.zones.artwork} show={idx >= 2 && !showCard} anim={isArtwork ? 'raArtIn 1.4s ease-out both' : undefined} z={2} />

          {isArtwork && (
            <div style={{
              position: 'absolute', left: '6%', right: '6%', height: '3px',
              background: 'linear-gradient(90deg, transparent, #b44dff, #00f0ff, #b44dff, transparent)',
              boxShadow: '0 0 16px #b44dff, 0 0 32px rgba(180,77,255,0.6)',
              animation: 'raScan 1.5s linear forwards', zIndex: 5,
            }} />
          )}

          <CardLayer clip={current.zones.frame} show={idx >= 3 && !showCard} anim={phase === 'frame' ? 'raFrameIn 0.9s ease-out both' : undefined} z={3} />

          <CardLayer clip={current.zones.name}  show={idx >= 4 && !showCard} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 0.0s both' : undefined} z={4} />
          <CardLayer clip={current.zones.attr1} show={idx >= 4 && !showCard} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 0.5s both' : undefined} z={4} />
          <CardLayer clip={current.zones.skill} show={idx >= 4 && !showCard} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 1.0s both' : undefined} z={4} />
          <CardLayer clip={current.zones.attr2} show={idx >= 4 && !showCard} anim={phase === 'attrs' ? 'raDrop 0.5s ease-out 1.5s both' : undefined} z={4} />

          {isFade && (
            <div style={{
              position: 'absolute', inset: 0, background: '#07070f',
              animation: 'raFadeToBlack 0.85s ease-in-out both',
              zIndex: 8, pointerEvents: 'none',
            }} />
          )}

          {isPhoto && (
            <div style={{
              position: 'absolute', inset: 0, background: '#07070f',
              animation: 'raFadeFromBlack 0.7s ease-out both',
              zIndex: 8, pointerEvents: 'none',
            }} />
          )}

          {(isFinal || isReal) && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 7, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '45%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                transform: 'translate3d(-130%, 0, 0) skewX(-18deg)',
                animation: 'raShine 3.4s linear 0.5s infinite',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }} />
            </div>
          )}

          {/* Interaktywny połysk — podąża za kursorem (GSAP, patrz useGSAP wyżej), niezależny od
              istniejącego okresowego "sweep" (raShine) powyżej — dwa różne, uzupełniające się
              efekty świetlne, nie zamiennik. Zawsze w DOM, żeby GSAP miał stały element do
              animowania bez re-montowania przy każdej zmianie fazy. UWAGA: opacity NIE jest
              ustawiane tutaj w JSX (celowo) — GSAP ustawia je startowo w useGSAP (gsap.set) i
              zarządza nim wyłącznie odtąd; gdyby zostało tu jako statyczna wartość React,
              każdy re-render (zmiana fazy, co 0.5-7s) zresetowałby je, kasując quickTo z GSAP
              — dokładnie ten sam błąd co wcześniej ze statycznym transform na karcie. */}
          <div
            ref={glareRef}
            aria-hidden="true"
            style={{
              position: 'absolute', top: '50%', left: '50%', width: '70%', height: '70%',
              marginTop: '-35%', marginLeft: '-35%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)',
              mixBlendMode: 'overlay', zIndex: 7, pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
          />
        </div>
      </div>
      </div>

      {/* ETYKIETY PROCESU */}
      <div style={{ display: 'flex', gap: '6px', minHeight: '26px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isPhoto && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: 'rgba(240,238,255,0.5)', animation: 'raPop 0.3s ease-out' }}>
            {t.photo}
          </span>
        )}
        {isFlash && (
          <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', color: '#fff', animation: 'raPop 0.2s ease-out' }}>
            {t.click}
          </span>
        )}
        {isArtwork && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#00f0ff', animation: 'raPop 0.3s ease-out' }}>
            {t.artwork}
          </span>
        )}
        {phase === 'frame' && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#b44dff', animation: 'raPop 0.3s ease-out' }}>
            {t.frame}
          </span>
        )}
        {phase === 'attrs' && (
          <>
            {attrsLabels.map((label, i) => (
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
            {t.final}
          </span>
        )}
        {isReal && (
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', color: '#00e5a0', fontWeight: 700, animation: 'raPop 0.3s ease-out' }}>
            {t.real}
          </span>
        )}
        {isFade && <span style={{ fontSize: '11px' }}>&nbsp;</span>}
      </div>
    </div>
  )
}
