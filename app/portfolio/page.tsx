'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isSupabasePlaceholder, PORTFOLIO_LOCAL_MOCK } from '../../lib/portfolioLocalMock'
import styles from './portfolio.module.css'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

const THEMES = [
  { id: 'all',       label: 'Wszystkie' },
  { id: 'techno_rave', label: 'Techno / Rave' },
  { id: 'festival',  label: 'Festiwal' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'custom',    label: 'Custom' },
  { id: 'fan_art',   label: 'Fan Art' },
]

type PortfolioItem = {
  id: string
  name: string
  theme: string
  description: string
  original_url: string | null
  card_url: string
}

type ViewMode = 'large' | 'compact'

function IconZoom() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}
function IconFlip() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.5a9 9 0 1 1-6.6 2.9" />
      <path d="M17 2.5V7h-4.5" />
    </svg>
  )
}
function IconGridLarge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}
function IconGridSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {[3, 10, 17].map(x => [3, 10, 17].map(y => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1" />
      )))}
    </svg>
  )
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('large')
  const [lightbox, setLightbox] = useState<{ item: PortfolioItem; view: 'original' | 'card' } | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (isSupabasePlaceholder()) {
        setItems(PORTFOLIO_LOCAL_MOCK)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('portfolio')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (data) setItems(data)
      setLoading(false)
    }
    fetchPortfolio()
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.theme === filter)
  const grouped = THEMES.slice(1).reduce((acc, t) => {
    const group = filtered.filter(i => i.theme === t.id)
    if (group.length > 0) acc[t.id] = { label: t.label, items: group }
    return acc
  }, {} as Record<string, { label: string; items: PortfolioItem[] }>)

  const renderGrid = (list: PortfolioItem[]) => viewMode === 'compact' ? (
    <div className={styles.compactGrid}>
      {list.map(item => (
        <div key={item.id} className={styles.compactThumb} onClick={() => setLightbox({ item, view: 'card' })}>
          <img src={item.card_url} alt={item.name} loading="lazy" />
          {item.theme === 'fan_art' && <span className={styles.compactFanArtBadge}>Fan Art</span>}
          <span className={styles.compactName}>{item.name}</span>
        </div>
      ))}
    </div>
  ) : (
    <div className={styles.grid}>
      {list.map(item => (
        <CardPair key={item.id} item={item} onOpen={setLightbox} />
      ))}
    </div>
  )

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <a href="/" className={styles.logo}>Rave<span>Adventure</span></a>
        <div className={styles.navLinks}>
          <a href="/#order" className={styles.navLink}>Zamów kartę</a>
          <span className={styles.navActive}>Portfolio</span>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <p className={styles.eyebrow}>// realizacje</p>
        <h1 className={styles.heroTitle}>Nasze <span className={styles.neon}>karty</span></h1>
        <p className={styles.heroSub}>Każda karta to unikalna historia. Zobacz jak zamieniamy Twoje zdjęcia w kolekcjonerskie karty.</p>
      </div>

      {/* FILTRY */}
      <div className={styles.filters}>
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`${styles.filterBtn} ${filter === t.id ? styles.filterActive : ''}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* GĘSTOŚĆ SIATKI */}
      <div className={styles.densityRow}>
        <span className={styles.densityLabel}>// widok</span>
        <div className={styles.densityToggle}>
          <button
            className={`${styles.densityBtn} ${viewMode === 'large' ? styles.densityActive : ''}`}
            onClick={() => setViewMode('large')}
            aria-label="Duże karty"
            title="Duże karty"
          >
            <IconGridLarge />
          </button>
          <button
            className={`${styles.densityBtn} ${viewMode === 'compact' ? styles.densityActive : ''}`}
            onClick={() => setViewMode('compact')}
            aria-label="Małe miniatury"
            title="Małe miniatury"
          >
            <IconGridSmall />
          </button>
        </div>
      </div>

      {/* GALERIA */}
      <div className={styles.content}>
        {filter === 'fan_art' && (
          <div style={{
            maxWidth: '680px', margin: '0 auto 24px',
            background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: '14px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🎨</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#f59e0b', lineHeight: '1.6' }}>
              <strong>To karty fanowskie</strong>, stworzone i umieszczone za zgodą artysty — prezentujemy je z szacunku dla ich twórczości i społeczności. <strong>Nie są dostępne do zamówienia ani sprzedaży.</strong>
            </p>
          </div>
        )}
        {loading ? (
          <div className={styles.loading}>Ładowanie portfolio...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Brak realizacji w tej kategorii</div>
        ) : filter === 'all' ? (
          Object.values(grouped).map(group => (
            <div key={group.label} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.label}</h2>
              {renderGrid(group.items)}
            </div>
          ))
        ) : renderGrid(filtered)}
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaText}>Chcesz mieć swoją kartę z kolejnego eventu?</p>
        <a href="/#order" className={styles.ctaBtn}>Zamów teraz →</a>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <Dialog open onOpenChange={open => { if (!open) setLightbox(null) }}>
          <DialogContent className={`${styles.lightboxContent} block !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2`} showCloseButton={false}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)} aria-label="Zamknij">✕</button>
            <Tabs value={lightbox.view} onValueChange={v => setLightbox({ ...lightbox, view: v as 'original' | 'card' })}>
              <TabsList className={`${styles.lightboxTabs} h-auto w-full bg-[var(--surface2)] p-1`}>
                {lightbox.item.original_url && (
                  <TabsTrigger value="original" className={`${styles.lightboxTab} ${lightbox.view === 'original' ? styles.lightboxTabActive : ''}`}>📷 Oryginał</TabsTrigger>
                )}
                <TabsTrigger value="card" className={`${styles.lightboxTab} ${lightbox.view === 'card' ? styles.lightboxTabActive : ''}`}>🎴 Karta</TabsTrigger>
              </TabsList>
            </Tabs>
            <img
              src={lightbox.view === 'card' ? lightbox.item.card_url : (lightbox.item.original_url || lightbox.item.card_url)}
              alt={lightbox.item.name}
              className={styles.lightboxImg}
            />
            <DialogTitle className={styles.lightboxName}>{lightbox.item.name}</DialogTitle>
            {lightbox.item.description && <DialogDescription className={styles.lightboxDesc}>{lightbox.item.description}</DialogDescription>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CardPair({ item, onOpen }: { item: PortfolioItem; onOpen: (v: { item: PortfolioItem; view: 'original' | 'card' }) => void }) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [spin, setSpin] = useState(false)

  // Preload oryginału żeby pierwszy flip był płynny
  useEffect(() => {
    if (item.original_url) {
      const img = new Image()
      img.src = item.original_url
    }
  }, [item.original_url])

  const handleFlip = () => {
    if (flipping || !item.original_url) return
    setFlipping(true)
    setSpin(true)
    setTimeout(() => {
      setShowOriginal(s => !s)
      setFlipping(false)
    }, 200)
    setTimeout(() => setSpin(false), 350)
  }

  return (
    <div className={styles.cardPairWrap}>
      <div className={styles.cardPair} style={{ perspective: '1000px' }}>
        {/* Cały obszar karty — kliknięcie odwraca (łatwy, duży cel dotyku) */}
        <div
          onClick={handleFlip}
          style={{
            cursor: item.original_url ? 'pointer' : 'default',
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
            transition: 'transform 0.2s ease-in',
          }}
        >
          <img
            src={showOriginal && item.original_url ? item.original_url : item.card_url}
            alt={showOriginal ? `${item.name} - oryginał` : item.name}
            className={styles.thumbImg}
          />
          <div className={styles.thumbLabel}>{showOriginal ? 'Oryginał' : 'Karta'}</div>
        </div>
        {item.theme === 'fan_art' && <span className={styles.fanArtBadge}>Fan Art · Not for sale</span>}

        {/* Lupka — powiększenie/lightbox */}
        <button
          className={`${styles.cardIconBtn} ${styles.zoomBtn}`}
          onClick={(e) => { e.stopPropagation(); onOpen({ item, view: showOriginal ? 'original' : 'card' }) }}
          aria-label="Powiększ"
          title="Powiększ"
        >
          <IconZoom />
        </button>

        {/* Odwróć — duży, ergonomiczny przycisk-ikona */}
        {item.original_url && (
          <button
            className={`${styles.cardIconBtn} ${styles.flipBtn} ${spin ? styles.flipBtnSpin : ''}`}
            onClick={(e) => { e.stopPropagation(); handleFlip() }}
            aria-label="Przełącz widok karta / oryginał"
            title="Przełącz widok"
          >
            <IconFlip />
          </button>
        )}
      </div>

      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{item.name}</p>
        {item.description && <p className={styles.cardDesc}>{item.description}</p>}
      </div>
    </div>
  )
}
