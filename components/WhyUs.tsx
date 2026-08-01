'use client'

const TXT = {
  pl: {
    eyebrow: '// dlaczego my',
    title: 'Co wyróżnia RaveAdventure?',
    items: [
      { icon: '🎯', heading: 'Personalizacja 1:1', detail: 'Każda karta powstaje na bazie Twojego zdjęcia i opisu — nie gotowego szablonu.' },
      { icon: '🎴', heading: 'Fizyczny produkt, nie plik JPG', detail: 'Prawdziwa karta z subkultury rave/techno — coś, co możesz trzymać w ręku, w portfelu, na lodówce.' },
      { icon: '📲', heading: 'NFC, magnes, Top Holder, stojak', detail: 'Karta jako pamiątka, dekoracja na biurku albo inteligentny link do playlisty z imprezy.' },
      { icon: '⚙️', heading: 'Proces zoptymalizowany przez inżyniera', detail: 'Szybka realizacja, wysoka jakość i jasna komunikacja na każdym etapie zamówienia.' },
    ],
  },
  en: {
    eyebrow: '// why us',
    title: 'What makes RaveAdventure different?',
    items: [
      { icon: '🎯', heading: '1:1 personalization', detail: 'Every card is built from your own photo and description — not a ready-made template.' },
      { icon: '🎴', heading: 'A physical product, not a JPG', detail: 'A real card from rave/techno culture — something you can hold, keep in your wallet, or put on the fridge.' },
      { icon: '📲', heading: 'NFC, magnet, Top Holder, stand', detail: 'Your card as a keepsake, desk decoration, or a smart link to your festival playlist.' },
      { icon: '⚙️', heading: 'A process optimized by an engineer', detail: 'Fast turnaround, high quality, and clear communication at every step of your order.' },
    ],
  },
}

export default function WhyUs({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]

  return (
    <section id="dlaczego-my" style={{ padding: '32px 5vw 40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center', scrollMarginTop: 'var(--nav-height, 70px)' }}>
      <style>{`
        .whyUsGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: left; }
        @media (max-width: 640px) {
          .whyUsGrid { grid-template-columns: 1fr; }
        }
      `}</style>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: 'var(--neon)', letterSpacing: '2px', marginBottom: '12px' }}>{t.eyebrow}</p>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 28px' }}>{t.title}</h2>

      <div className="whyUsGrid">
        {t.items.map((item, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{item.heading}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
