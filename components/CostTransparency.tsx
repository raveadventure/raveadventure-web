'use client'

// Sekcja transparentności cenowej — na wyraźną prośbę Michała (2026-08-09), z realnymi kwotami
// kosztu wytworzenia karty Standard, które podał wprost. Segmentowy pasek to świadomie zapożyczony
// WZORZEC wizualny (proporcjonalny podział kwoty na kategorie), nie kopia konkretnego komponentu —
// zbudowany od zera na istniejących tokenach RA (--neon/--neon2/--success/--warning), bez
// wciągania osobnego zestawu komponentów UI. "Praca własna" pokazana jako osobna plakietka, nie
// segment paska — 0 zł jako segment paska byłby niewidoczny i bez wydźwięku.

const TXT = {
  pl: {
    title: 'Skąd bierze się cena Twojej karty?',
    sub: 'Pełna przejrzystość — oto z czego realnie składa się koszt wytworzenia standardowej karty PVC.',
    items: [
      { label: 'Koszty materiałowe', amount: 2.0, color: 'var(--neon)' },
      { label: 'Nadruk (przód + tył)', amount: 2.0, color: 'var(--neon2)' },
      { label: 'Generowanie grafik', amount: 3.2, color: 'var(--warning)' },
      { label: 'Koszty stałe (domena, licencje)', amount: 7.16, color: 'rgba(240,238,255,0.28)' },
      { label: 'Dodatki wysyłkowe', amount: 3.2, color: 'var(--success)' },
    ],
    laborLabel: 'Koszt pracy (projekt + obsługa zamówienia)',
    laborAmount: 'ZA DARMO',
    totalLabel: 'Razem koszt wytworzenia',
    priceLabel: 'Cena karty Standard',
    quote: 'Nie chodzi mi o zarabianie — chodzi o to, żebyś dostał/a wyjątkową pamiątkę.',
    quoteTagline: 'To pasja, nie etat.',
    quoteAuthor: 'Michał Koch',
    quoteRole: 'Twórca Rave Adventure',
  },
  en: {
    title: "Where does your card's price come from?",
    sub: 'Full transparency — here\'s what actually makes up the production cost of a Standard PVC card.',
    items: [
      { label: 'Material costs', amount: 2.0, color: 'var(--neon)' },
      { label: 'Printing (front + back)', amount: 2.0, color: 'var(--neon2)' },
      { label: 'Artwork generation', amount: 3.2, color: 'var(--warning)' },
      { label: 'Fixed costs (domain, licenses)', amount: 7.16, color: 'rgba(240,238,255,0.28)' },
      { label: 'Shipping supplies', amount: 3.2, color: 'var(--success)' },
    ],
    laborLabel: 'My labor (design + order handling)',
    laborAmount: 'FREE',
    totalLabel: 'Total production cost',
    priceLabel: 'Standard card price',
    quote: "This was never about the money — it's about you getting a genuinely special keepsake.",
    quoteTagline: "It's a passion project, not a job.",
    quoteAuthor: 'Michał Koch',
    quoteRole: 'Founder of Rave Adventure',
  },
}

const TOTAL_COST = 17.57
const PRICE = 40.0

export default function CostTransparency({ lang = 'pl' }: { lang?: 'pl' | 'en' }) {
  const t = TXT[lang]
  const sumItems = t.items.reduce((s, i) => s + i.amount, 0)

  return (
    <section id="przejrzystosc-cenowa" data-reveal className="mx-auto max-w-[760px] px-[5vw] pt-8 pb-10 text-center [scroll-margin-top:var(--nav-height,70px)]">
      <h2 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-foreground mb-2.5">{t.title}</h2>
      <p className="mx-auto mb-7 max-w-[560px] text-sm leading-[1.7] text-muted-foreground">{t.sub}</p>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 text-left">
        {/* PASEK SEGMENTOWY */}
        <div className="mb-4 flex h-2.5 w-full gap-1 overflow-hidden rounded-full">
          {t.items.map(item => (
            <div
              key={item.label}
              style={{ width: `${(item.amount / sumItems) * 100}%`, background: item.color }}
              className="h-full rounded-full"
            />
          ))}
        </div>

        {/* LEGENDA */}
        <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {t.items.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden="true" />
                {item.label}
              </span>
              <span className="shrink-0 font-semibold text-foreground">{item.amount.toFixed(2).replace('.', ',')} zł</span>
            </div>
          ))}
        </div>

        {/* PRACA WŁASNA — osobna plakietka, nie segment paska */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-primary/30 bg-[var(--neon-dim)] px-4 py-3">
          <span className="text-[13px] font-semibold text-foreground">{t.laborLabel}</span>
          <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-[0.5px] text-primary-foreground">{t.laborAmount}</span>
        </div>

        <div className="mb-1 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">{t.totalLabel}</span>
          <span className="font-semibold text-foreground">{TOTAL_COST.toFixed(2).replace('.', ',')} zł</span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span className="font-bold text-foreground">{t.priceLabel}</span>
          <span className="font-bold text-primary">{PRICE.toFixed(2).replace('.', ',')} zł</span>
        </div>
      </div>

      {/* Cytat-podpis — pełna szerokość sekcji, w tej samej ramce co karty "Jak to działa"
          (border + rounded-[16px] + tło var(--surface)), zamiast wąskiego akapitu tekstu.
          Krótszy, jednozdaniowy cytat + podpis (imię i rola) zamiast długiego wyjaśnienia. */}
      <div className="mt-6 w-full rounded-[16px] border border-border bg-[var(--surface)] px-6 py-7 text-center sm:px-10">
        <p className="mx-auto max-w-[520px] text-[15px] italic leading-[1.6] text-foreground sm:text-base">
          „{t.quote}<br />{t.quoteTagline}”
        </p>
        <p className="mt-4 text-sm font-bold text-foreground">{t.quoteAuthor}</p>
        <p className="text-xs text-muted-foreground">{t.quoteRole}</p>
      </div>
    </section>
  )
}
