import { T } from '../lib/translations'
import styles from './HowItWorksSteps.module.css'

// Wyodrębnione z app/page.tsx (2026-08-10) razem z przeniesieniem sekcji "Jak to działa" na osobną
// podstronę /jak-to-dziala — homepage była za długa (Michał: "Strona jest dla mnie za długa").
// StepsRays/buildRays skopiowane 1:1 (nie wyciągnięte do wspólnego pliku z HeroRays w app/page.tsx,
// który zostaje na stronie głównej — dwie prawie identyczne funkcje w dwóch miejscach są tu
// prostsze niż wspólny plik importowany w dwie strony, a każda ma inny zestaw parametrów/kolorów).
function buildRays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i
    const pattern = [46, 22, 34]
    const len = pattern[i % pattern.length]
    const isAccent = i % 7 === 0
    return { angle, len, isAccent }
  })
}

function StepsRays() {
  const rays = buildRays(20)
  return (
    <svg viewBox="-50 -50 100 100" className={styles.stepsRays} aria-hidden="true">
      {rays.map((r, i) => (
        <line
          key={i}
          x1={0} y1={-6}
          x2={0} y2={-6 - r.len}
          stroke={r.isAccent ? '#00f0ff' : '#b44dff'}
          strokeOpacity={r.isAccent ? 0.32 : 0.16}
          strokeWidth={1}
          strokeLinecap="round"
          transform={`rotate(${r.angle})`}
        />
      ))}
    </svg>
  )
}

export default function HowItWorksSteps({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = T[lang]
  return (
    <div className={styles.stepsWrap}>
      <StepsRays />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {t.howItWorks.steps.map(s => (
          <div key={s.n} className={styles.stepCard}>
            <p className={`m-0 mb-1.5 text-sm font-semibold text-foreground ${styles.stepDesc}`}>{s.t}</p>
            <p className={`m-0 text-[11px] text-muted-foreground leading-[1.5] ${styles.stepDesc}`}>{s.d}</p>
            <span className={styles.stepNum} aria-hidden="true">{s.n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
