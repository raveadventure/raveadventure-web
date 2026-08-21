'use client'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Link as LinkIcon, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Adaptacja komponentu "radial-orbital-timeline" (społecznościowy prompt/rejestr shadcn) pod
// RaveAdventure — świadome odstępstwa od oryginału, patrz WhyUs.tsx dla pełnego uzasadnienia:
//  - brak `h-screen`/`bg-black` — to osadzalna sekcja (embeddable), nie pełnoekranowa scena, więc
//    dziedziczy tło strony (aurora) zamiast wymuszać własne czarne tło
//  - brak pól `date`/`status`/`energy` z oryginału — te 4 węzły to RÓWNOLEGŁE cechy produktu, nie
//    chronologiczne kroki projektu, więc etykiety w stylu "IN PROGRESS"/"Energy Level: 60%" byłyby
//    zmyśloną, mylącą metryką (nic takiego nie istnieje) — usunięte, nie tylko przemianowane
//  - `viewMode`/`centerOffset` z oryginału były martwym stanem (nigdy nie zmieniane w dostarczonym
//    kodzie, brak drag handlerów) — usunięte
//  - reaguje na prefers-reduced-motion (ten sam wzorzec co PortfolioFanCarousel/HeroCardAnimation)
export interface OrbitalNode {
  id: number
  title: string
  tag: string
  detail: string
  icon: LucideIcon
  relatedIds: number[]
}

interface RadialOrbitalTimelineProps {
  items: OrbitalNode[]
  height?: number
  radius?: number
  connectedLabel?: string
  closeLabel?: string
}

export default function RadialOrbitalTimeline({
  items,
  height = 480,
  radius = 170,
  connectedLabel = 'Connected',
  closeLabel = 'Close',
}: RadialOrbitalTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion.current) setAutoRotate(false)
  }, [])

  useEffect(() => {
    if (!autoRotate) return
    const timer = setInterval(() => {
      setRotationAngle(prev => Number(((prev + 0.25) % 360).toFixed(3)))
    }, 50)
    return () => clearInterval(timer)
  }, [autoRotate])

  const toggleItem = (id: number) => {
    const opening = expandedId !== id
    setExpandedId(opening ? id : null)
    setAutoRotate(!opening && !reducedMotion.current)
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      setExpandedId(null)
      setAutoRotate(!reducedMotion.current)
    }
  }

  const calculatePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360
    const radian = (angle * Math.PI) / 180
    const x = radius * Math.cos(radian)
    const y = radius * Math.sin(radian)
    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const opacity = Math.max(0.55, Math.min(1, 0.55 + 0.45 * ((1 + Math.sin(radian)) / 2)))
    return { x, y, zIndex, opacity }
  }

  const isRelatedToActive = (itemId: number) => {
    if (expandedId === null) return false
    const active = items.find(i => i.id === expandedId)
    return !!active?.relatedIds.includes(itemId)
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative mx-auto flex w-full items-center justify-center"
      style={{ height }}
    >
      <div className="pointer-events-none absolute flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon)] via-[#8a3fd9] to-[var(--neon2)]">
        {!reducedMotion.current && (
          <>
            <div className="absolute h-20 w-20 animate-ping rounded-full border border-primary/30 opacity-70" />
            <div className="absolute h-24 w-24 animate-ping rounded-full border border-accent/20 opacity-50" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <div className="h-8 w-8 rounded-full bg-white/85 backdrop-blur-md" />
      </div>

      <div className="pointer-events-none absolute rounded-full border border-border" style={{ width: radius * 2, height: radius * 2 }} />

      {items.map((item, index) => {
        const pos = calculatePosition(index, items.length)
        const isExpanded = expandedId === item.id
        const isRelated = isRelatedToActive(item.id)
        const Icon = item.icon
        // Karta rozwija się w stronę środka orbity (nad węzłem w dolnej połowie, pod węzłem
        // w górnej) — bez tego węzły blisko dolnej krawędzi kontenera przycinały rozwiniętą
        // kartę (overflow), a sam kontener nie może mieć overflow-hidden bez utraty tego
        // przycinania w drugą stronę.
        const opensAbove = pos.y >= 0

        return (
          <div
            key={item.id}
            className="absolute cursor-pointer transition-all duration-700"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isExpanded ? 200 : pos.zIndex,
              opacity: isExpanded ? 1 : pos.opacity,
            }}
            onClick={e => { e.stopPropagation(); toggleItem(item.id) }}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isExpanded
                  ? 'scale-125 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : isRelated
                    ? 'border-primary bg-primary/25 text-foreground animate-pulse'
                    : 'border-border bg-card text-foreground'
              }`}
            >
              <Icon size={17} />
            </div>

            <div className={`absolute top-13 left-1/2 w-max -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ${isExpanded ? 'scale-110 text-foreground' : 'text-muted-foreground'}`}>
              {item.title}
            </div>

            {isExpanded && (
              <Card
                onClick={e => e.stopPropagation()}
                className={`absolute left-1/2 w-64 -translate-x-1/2 cursor-default overflow-visible border-primary/30 bg-[color-mix(in_srgb,var(--card)_92%,transparent)] shadow-xl shadow-primary/10 backdrop-blur-lg ${opensAbove ? 'bottom-full mb-3' : 'top-20'}`}
              >
                <div className={`absolute left-1/2 h-3 w-px -translate-x-1/2 bg-border ${opensAbove ? '-bottom-3' : '-top-3'}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/50 px-2 text-[10px] text-primary">{item.tag}</Badge>
                    <button
                      onClick={e => { e.stopPropagation(); toggleItem(item.id) }}
                      aria-label={closeLabel}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      ✕
                    </button>
                  </div>
                  <CardTitle className="mt-2 text-sm">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>{item.detail}</p>

                  {item.relatedIds.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="mb-2 flex items-center gap-1">
                        <LinkIcon size={10} className="text-muted-foreground" />
                        <h4 className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{connectedLabel}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.relatedIds.map(relId => {
                          const rel = items.find(i => i.id === relId)
                          if (!rel) return null
                          return (
                            <Button
                              key={relId}
                              variant="outline"
                              size="sm"
                              className="h-6 rounded-none border-border bg-transparent px-2 py-0 text-xs text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                              onClick={e => { e.stopPropagation(); toggleItem(relId) }}
                            >
                              {rel.title}
                              <ArrowRight size={8} className="ml-1" />
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
}
