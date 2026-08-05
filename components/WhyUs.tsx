'use client'

const TXT = {
  pl: {
    title: 'Co wyróżnia RaveAdventure?',
    items: [
      { icon: '🎯', heading: 'Personalizacja 1:1', detail: 'Każda karta powstaje na bazie Twojego zdjęcia i opisu — nie gotowego szablonu.' },
      { icon: '🎴', heading: 'Fizyczny produkt, nie plik JPG', detail: 'Prawdziwa karta z subkultury rave/techno — coś, co możesz trzymać w ręku, w portfelu, na lodówce.' },
      { icon: '📲', heading: 'NFC, magnes, Top Holder, stojak', detail: 'Karta jako pamiątka, dekoracja na biurku albo inteligentny link do playlisty z imprezy.' },
      { icon: '⚙️', heading: 'Proces zoptymalizowany przez inżyniera', detail: 'Szybka realizacja, wysoka jakość i jasna komunikacja na każdym etapie zamówienia.' },
    ],
  },
  en: {
    title: 'What makes RaveAdventure different?',
    items: [
      { icon: '🎯', heading: '1:1 personalization', detail: 'Every card is built from your own photo and description — not a ready-made template.' },
      { icon: '🎴', heading: 'A physical product, not a JPG', detail: 'A real card from rave/techno culture — something you can hold, keep in your wallet, or put on the fridge.' },
      { icon: '📲', heading: 'NFC, magnet, Top Holder, stand', detail: 'Your card as a keepsake, desk decoration, or a smart link to your festival playlist.' },
      { icon: '⚙️', heading: 'A process optimized by an engineer', detail: 'Fast turnaround, high quality, and clear communication at every step of your order.' },
    ],
  },
}

// Te same 4 kolory co reszta marki (var(--neon)/--neon2/--success/--warning w globals.css) —
// każda karta dostaje inny akcent, cyklicznie, żeby siatka 2×2 nie wyglądała jednolicie płasko.
const ACCENTS = ['var(--neon)', 'var(--neon2)', 'var(--success)', 'var(--warning)']

export default function WhyUs({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]

  return (
    <section id="dlaczego-my" data-reveal className="mx-auto max-w-[1100px] px-[5vw] pt-8 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <style>{`
        .whyUsGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: left; }
        @media (max-width: 640px) {
          .whyUsGrid { grid-template-columns: 1fr; }
        }
        .whyUsCard {
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, var(--surface) 0%, var(--surface2) 120%);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
        }
        .whyUsCard:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
          box-shadow: 0 10px 28px -12px color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .whyUsBar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 12px var(--accent);
        }
        .whyUsIcon {
          width: 42px; height: 42px; flex-shrink: 0;
          border-radius: 12px;
          background: color-mix(in srgb, var(--accent) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
      `}</style>
      <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground mb-7">{t.title}</h2>

      <div className="whyUsGrid">
        {t.items.map((item, i) => (
          <div key={i} className="whyUsCard" style={{ '--accent': ACCENTS[i % ACCENTS.length] } as React.CSSProperties}>
            <div className="whyUsBar" />
            <div className="mb-2.5 flex items-center gap-3">
              <div className="whyUsIcon">{item.icon}</div>
              <h3 className="m-0 text-[15px] font-bold text-foreground">{item.heading}</h3>
            </div>
            <p className="m-0 text-[13px] leading-[1.6] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
