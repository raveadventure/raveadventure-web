// Budowanie treści eksportu zamówienia jako tekst (używane przez /api/admin/export-txt i
// /api/generate-order-txt — patrz lib/orderExportServer.ts). Wyciągnięte z app/admin/page.tsx,
// żeby ta sama logika działała zarówno przy ręcznym eksporcie z panelu, jak i przy automatycznym
// wygenerowaniu pliku od razu przy złożeniu zamówienia (patrz CLAUDE.md — folder orders/{id8}/).
//
// UWAGA dla Cards Creator (osobna aplikacja Michała, patrz CLAUDE.md „Aplikacja towarzysząca"):
// ten format parsuje się po znacznikach sekcji, nie po stałych numerach linii — nowe informacje
// zawsze dopisywać na końcu, nigdy nie wstawiać w środku istniejących sekcji.

const STATUSES = [
  { id: 'new',        label: 'Nowe' },
  { id: 'in_project', label: 'W projekcie' },
  { id: 'approval',   label: 'Do akceptacji' },
  { id: 'awaiting_payment', label: 'Do opłacenia' },
  { id: 'production', label: 'Produkcja' },
  { id: 'shipped',    label: 'Wysłane' },
  { id: 'done',       label: 'Zakończone' },
]

// Ta sama lista co FRAME_COLORS w app/page.tsx i app/admin/page.tsx (duplikacja świadoma —
// zgodna z istniejącą konwencją w tym repo, patrz komentarz przy FRAME_COLORS w admin/page.tsx).
const FRAME_COLORS: Record<string, { name: string }> = {
  neon_orange: { name: 'Neon Orange' },
  dark_orange: { name: 'Dark Orange' },
  neon_blue: { name: 'Neon Blue' },
  dark_blue: { name: 'Dark Blue' },
  neon_purple: { name: 'Neon Purple' },
  dark_purple: { name: 'Dark Purple' },
  yellow_neon_blue_sky: { name: 'Yellow Neon + Blue Sky' },
  dark_green: { name: 'Dark Green' },
  neon_green: { name: 'Neon Green' },
  dark_red: { name: 'Dark Red' },
  neon_red: { name: 'Neon Red' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function buildOrderExportLines(order: Record<string, any>): string[] {
  const o = order
  const THEME_EXPORT_LABELS: Record<string, string> = {
    techno_rave: 'Techno / Rave', festival: 'Festiwal', adventure: 'Adventure', custom: 'Custom',
  }
  const backLabel = o.back_option === 'logo' ? 'Standard Logo'
    : o.back_option === 'dedication' ? 'Dedykacja'
    : o.back_option === 'custom_back' ? 'Custom Artwork'
    : o.back_option === 'qr' ? 'QR Code' : (o.back_option || '—')
  const frameLabel = FRAME_COLORS[o.frame_color]?.name || o.frame_color || '—'
  const finishLabels: Record<string, string> = {
    magnes: 'Magnes (wersja na lodówkę)',
    top_holder: 'Top Holder',
    top_holder_magnes: 'Top Holder + Magnes',
    top_holder_stojak: 'Top Holder + Stojak',
    zestaw_promocyjny: 'Zestaw Promocyjny (2 karty + Top Holder + stojak + naklejka magnetyczna)',
  }
  const finishLabel = o.card_finish === 'mixed' ? 'Mieszane (patrz sekcja niżej)' : (finishLabels[o.card_finish] || 'Standard (brak)')
  const finishBreakdownForExport: { finish: string; qty: number; nfc_qty: number }[] = Array.isArray(o.card_finish_breakdown) ? o.card_finish_breakdown : []

  const lines = [
    `ZLECENIE #${String(o.id).slice(0, 8).toUpperCase()}`,
    `Data: ${formatDate(o.created_at)}`,
    `Klient: ${o.name} (${o.email})`,
    '',
    '--- KARTA ---',
    `Typ: ${o.card_type === 'laminated' ? 'Wizytówka (100 szt.)' : 'PVC'}`,
    `Motyw: ${THEME_EXPORT_LABELS[o.theme] || o.theme}`,
    `Tył: ${backLabel}`,
    `Ilość: ${o.quantity ?? '—'}`,
    `NFC/RFID: ${o.nfc_enabled ? `Tak (+${o.nfc_price || 0} zł)` : 'Nie'}`,
    `Wykończenie: ${finishLabel}`,
    '',
    '--- ATRYBUTY KARTY ---',
    `① Lewy nagłówek: ${o.card_year || '—'}`,
    `② Prawy nagłówek: ${o.card_rarity || '—'}`,
    `③ Nazwa: ${o.card_name_custom || '—'}`,
    `④ Atrybut 1: ${[o.attr1_label, o.attr1_value].filter(Boolean).join(' — ') || '—'}`,
    `⑤ Umiejętność: ${o.card_skill || '—'}`,
    `⑥ Atrybut 2: ${[o.attr2_label, o.attr2_value].filter(Boolean).join(' — ') || '—'}`,
    `⑦ Napis w ramce: ${o.card_bottom_text || '—'}`,
    `⑧ Kolor ramki: ${frameLabel}`,
    `⑨ Efekt holo: ${o.holo_effect ? 'Tak' : 'Nie'}`,
  ]

  if (finishBreakdownForExport.length > 1) {
    lines.push('', '--- WYKOŃCZENIE: ROZBICIE NA WARIANTY ---')
    finishBreakdownForExport.forEach(l => {
      const label = l.finish === 'standard' ? 'Standard' : finishLabels[l.finish] || l.finish
      lines.push(`${label} × ${l.qty}${l.nfc_qty > 0 ? ` (${l.nfc_qty} z NFC)` : ''}`)
    })
  }
  if (o.custom_desc) lines.push('', '--- OPIS (CUSTOM) ---', o.custom_desc)
  if (o.qr_link) lines.push('', '--- QR LINK ---', o.qr_link)
  if (o.notes) lines.push('', '--- UWAGI (PRZÓD) ---', o.notes)
  const backNotes = o.card_text || o.notes_back
  if (backNotes) lines.push('', '--- UWAGI / DEDYKACJA (TYŁ) ---', backNotes)
  if (o.review_notes) lines.push('', '--- UWAGI Z KOREKTY PROJEKTU ---', o.review_notes)

  // Dopisane na końcu (nigdy nie wstawiane w środku) — patrz uwaga dla Cards Creator na górze pliku.
  lines.push('', '--- KONTAKT I DOSTAWA ---')
  lines.push(`Telefon: ${o.phone || '—'}`)
  lines.push(o.delivery_method === 'paczkomat'
    ? `Dostawa: Paczkomat InPost — ${o.paczkomat_id || '—'} (${o.address || '—'})`
    : `Dostawa: Adres — ${o.address || '—'}`)
  lines.push(`Język klienta: ${o.lang === 'en' ? 'EN' : 'PL'}`)

  lines.push('', '--- PŁATNOŚĆ I STATUS ---')
  const statusLabel = STATUSES.find(s => s.id === o.status)?.label || o.status
  lines.push(`Status zlecenia: ${statusLabel}`)
  lines.push(`Cena jednostkowa (śr.): ${o.unit_price ?? '—'} zł`)
  lines.push(`Cena całkowita: ${o.total_price ?? '—'} zł`)
  lines.push(`Rabat ilościowy: ${o.has_discount ? 'Tak' : 'Nie'}`)
  if (o.discount_code) lines.push(`Kod rabatowy: ${o.discount_code} (-${o.discount_pct || 0}%)`)
  lines.push(`Opłacone: ${o.paid ? 'Tak' : 'Nie'}`)

  if (o.photo_url || o.design_url || o.design_url_2 || o.design_back_url) {
    // Sama nazwa pliku w Storage (nie pełny URL) — wystarczy do odnalezienia w Supabase,
    // pełny link to długi, nieczytelny ciąg znaków bez praktycznej wartości w tym eksporcie.
    const storageFileName = (url: string) => url.split('/').pop()?.split('?')[0] || url
    lines.push('', '--- ZAŁĄCZNIKI (NAZWY PLIKÓW W SUPABASE) ---')
    if (o.photo_url) lines.push(`Zdjęcie klienta (front): ${storageFileName(o.photo_url)}`)
    if (o.design_url) lines.push(`Projekt — wariant 1: ${storageFileName(o.design_url)}`)
    if (o.design_url_2) lines.push(`Projekt — wariant 2: ${storageFileName(o.design_url_2)}`)
    if (o.design_back_url) lines.push(`Projekt — tył: ${storageFileName(o.design_back_url)}`)
  }

  // Dopisane na samym końcu, tylko dla zamówień zagranicznych (od 2026-08-02) — domowe zamówienia
  // (zdecydowana większość) mają eksport bajt w bajt identyczny jak wcześniej, więc parser Cards
  // Creator nic nie traci; to czysty dodatek, nie zmiana istniejącego formatu.
  if (o.shipping_region === 'intl') {
    lines.push('', '--- WYSYŁKA ZAGRANICZNA ---')
    lines.push('Kraj wysyłki: Zagranica (UE)')
    lines.push(`Koszt wysyłki: ${o.shipping_cost ?? '—'} zł`)
  }

  return lines
}
