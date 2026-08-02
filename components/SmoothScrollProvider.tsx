'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Płynny scroll (redesign, brief marketingowy) — świadomie Lenis w DOMYŚLNYM trybie (bez opcji
// wrapper/content), więc easing dzieje się na natywnym window.scrollTo, a nie przez transformowany
// div-wrapper jak w GSAP ScrollSmoother. To ważne: wcześniejsza próba ze ScrollSmootherem została
// wycofana (patrz plan redesignu), bo jego wrapper łamał każdy `position: fixed` nav na stronie —
// fixed potomek transformowanego przodka przestaje być fixed względem viewportu. Lenis w tym trybie
// nic nie transformuje, więc nie ma tego problemu — nie wymaga żadnej przebudowy layoutu.
//
// Zsynchronizowany z gsap.ticker (oficjalnie rekomendowany przepis Lenis+GSAP) zamiast osobnej
// pętli requestAnimationFrame — strona i tak używa ScrollTrigger (Hero tilt, reveale sekcji,
// glow w portfolio), więc jeden wspólny "zegar" zamiast dwóch niezależnych rAF-ów unika drobnego
// rozjazdu w klatkach.
//
// Mimo to celowo wyłączony na /admin/** — redesign nie obejmuje panelu admina (decyzja Michała),
// więc jego zachowanie scrolla zostaje dokładnie takie jak dziś, bez żadnych zmian.
export default function SmoothScrollProvider() {
  const pathname = usePathname()
  // /login jest wyłącznie ekranem logowania do panelu admina (patrz CLAUDE.md) — mimo że jego
  // URL nie zaczyna się od /admin, funkcjonalnie należy do tej samej, nieredesignowanej części.
  const isAdmin = pathname?.startsWith('/admin') || pathname === '/login'

  useEffect(() => {
    if (isAdmin) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    })
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [isAdmin])

  return null
}
