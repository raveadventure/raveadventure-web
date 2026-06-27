'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './portfolio.module.css'

const THEMES = [
  { id: 'all',       label: 'Wszystkie' },
  { id: 'techno_rave', label: 'Techno / Rave' },
  { id: 'festival',  label: 'Festiwal' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'custom',    label: 'Custom' },
]

type PortfolioItem = {
  id: string
  name: string
  theme: string
  description: string
  original_url: string | null
  card_url: string
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState<{ item: PortfolioItem; view: 'original' | 'card' } | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.theme === filter)
  const grouped = THEMES.slice(1).reduce((acc, t) => {
    const group = filtered.filter(i => i.theme === t.id)
    if (group.length > 0) acc[t.id] = { label: t.label, items: group }
    return acc
  }, {} as Record<string, { label: string; items: PortfolioItem[] }>)

  return (
    <div className={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

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

      {/* GALERIA */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Ładowanie portfolio...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Brak realizacji w tej kategorii</div>
        ) : filter === 'all' ? (
          Object.values(grouped).map(group => (
            <div key={group.label} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.label}</h2>
              <div className={styles.grid}>
                {group.items.map(item => (
                  <CardPair key={item.id} item={item} onOpen={setLightbox} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.grid}>
            {filtered.map(item => (
              <CardPair key={item.id} item={item} onOpen={setLightbox} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaText}>Chcesz mieć swoją kartę?</p>
        <a href="/#order" className={styles.ctaBtn}>Zamów teraz →</a>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
            <div className={styles.lightboxTabs}>
              {lightbox.item.original_url && (
                <button
                  className={`${styles.lightboxTab} ${lightbox.view === 'original' ? styles.lightboxTabActive : ''}`}
                  onClick={() => setLightbox({ ...lightbox, view: 'original' })}
                >
                  Oryginał
                </button>
              )}
              <button
                className={`${styles.lightboxTab} ${lightbox.view === 'card' ? styles.lightboxTabActive : ''}`}
                onClick={() => setLightbox({ ...lightbox, view: 'card' })}
              >
                Karta
              </button>
            </div>
            <img
              src={lightbox.view === 'card' ? lightbox.item.card_url : (lightbox.item.original_url || lightbox.item.card_url)}
              alt={lightbox.item.name}
              className={styles.lightboxImg}
            />
            <p className={styles.lightboxName}>{lightbox.item.name}</p>
            {lightbox.item.description && <p className={styles.lightboxDesc}>{lightbox.item.description}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function CardPair({ item, onOpen }: { item: PortfolioItem; onOpen: (v: { item: PortfolioItem; view: 'original' | 'card' }) => void }) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className={styles.cardPairWrap}>
      <div className={styles.cardPair}>
        {/* DOMYŚLNIE: karta. Po kliknięciu: oryginał */}
        <div
          className={styles.cardThumb}
          onClick={() => onOpen({ item, view: showOriginal ? 'original' : 'card' })}
          style={{ cursor: 'zoom-in' }}
        >
          <img
            src={showOriginal && item.original_url ? item.original_url : item.card_url}
            alt={showOriginal ? `${item.name} - oryginał` : item.name}
            className={styles.thumbImg}
          />
          <div className={styles.thumbLabel}>{showOriginal ? 'Oryginał' : 'Karta'}</div>
        </div>

        {/* TOGGLE — tylko jeśli jest oryginał */}
        {item.original_url && (
          <button
            className={styles.toggleBtn}
            onClick={() => setShowOriginal(s => !s)}
            aria-label="Przełącz widok"
          >
            {showOriginal ? '← Karta' : 'Pokaż oryginał →'}
          </button>
        )}
      </div>

      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{item.name}</p>
        {item.description && <p className={styles.cardDesc}>{item.description}</p>}
        <button className={styles.cardZoom} onClick={() => onOpen({ item, view: 'card' })}>
          Powiększ →
        </button>
      </div>
    </div>
  )
}
