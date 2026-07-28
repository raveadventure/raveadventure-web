// Lokalne dane portfolio używane podczas redesignu, gdy .env.local ma placeholder Supabase.
// Metadane (nazwa/motyw/opis/kolejność) pochodzą z eksportu produkcyjnej tabeli `portfolio`,
// pliki graficzne leżą w public/portfolio-local/ pod tymi samymi ID co w Storage.
// Usunąć to i wszystkie miejsca, które to importują, gdy podłączymy prawdziwy Supabase.

export function isSupabasePlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export type PortfolioLocalItem = {
  id: string
  name: string
  theme: string
  description: string
  original_url: string | null
  card_url: string
}

const p = (file: string) => `/portfolio-local/${file}`

export async function mockListPortfolio() {
  try {
    const res = await fetch('/api/dev-portfolio')
    const data = await res.json()
    return { data: res.ok ? data : [], error: res.ok ? null : { message: data?.error || 'List failed' } }
  } catch (e: any) {
    return { data: [], error: { message: e?.message || 'List failed' } }
  }
}

export async function mockInsertPortfolio(fields: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-portfolio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Insert failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Insert failed' } }
  }
}

export async function mockUpdatePortfolio(id: string, updates: Record<string, any>) {
  try {
    const res = await fetch('/api/dev-portfolio', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data?.error || 'Update failed' } }
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Update failed' } }
  }
}

export async function mockDeletePortfolio(id: string) {
  try {
    const res = await fetch(`/api/dev-portfolio?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    return { error: res.ok ? null : { message: data?.error || 'Delete failed' } }
  } catch (e: any) {
    return { error: { message: e?.message || 'Delete failed' } }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function mockUploadPortfolioFile(file: File): Promise<string> {
  return fileToDataUrl(file)
}

export const PORTFOLIO_LOCAL_MOCK: PortfolioLocalItem[] = [
  { id: 'a312dceb-afc7-43b9-a7cc-d1af2e483dcd', name: 'Rave Friends', theme: 'festival', description: 'Pamiątka z festiwalu Audioriver 2025', original_url: p('a312dceb-afc7-43b9-a7cc-d1af2e483dcd-orig.jpg'), card_url: p('a312dceb-afc7-43b9-a7cc-d1af2e483dcd-card.png') },
  { id: '839f3cc9-2adf-4e89-8751-17e695b870de', name: 'Travel Friends', theme: 'adventure', description: 'Wspomnienia z Tajlandii ', original_url: p('839f3cc9-2adf-4e89-8751-17e695b870de-orig.jpg'), card_url: p('839f3cc9-2adf-4e89-8751-17e695b870de-card.png') },
  { id: 'bbc29a36-b0c4-4a3f-b587-3fa2c2849f74', name: 'Rave Family', theme: 'techno_rave', description: 'Dla najlepszej ekipy Rave - pamiątka z Exist 2026', original_url: p('bbc29a36-b0c4-4a3f-b587-3fa2c2849f74-orig.jpg'), card_url: p('bbc29a36-b0c4-4a3f-b587-3fa2c2849f74-card.png') },
  { id: '71b3fa33-02c7-4e3f-9d96-d023344c0116', name: 'Baron von Koch', theme: 'techno_rave', description: 'Prezent ', original_url: p('71b3fa33-02c7-4e3f-9d96-d023344c0116-orig.jpg'), card_url: p('71b3fa33-02c7-4e3f-9d96-d023344c0116-card.jpg') },
  { id: '8934a495-d94b-4b12-bbe3-89e708fb832e', name: 'ADE Festiwal', theme: 'adventure', description: 'Karta dla najbardziej zajebistych braci ever !', original_url: p('8934a495-d94b-4b12-bbe3-89e708fb832e-orig.jpg'), card_url: p('8934a495-d94b-4b12-bbe3-89e708fb832e-card.png') },
  { id: '62fc5249-6128-40dc-bf8c-09a70a9f4e21', name: 'FREEDOM PARADE', theme: 'techno_rave', description: 'Ekipa RAVE FAMILY na Parada Wolności Łódź 2025', original_url: p('62fc5249-6128-40dc-bf8c-09a70a9f4e21-orig.jpg'), card_url: p('62fc5249-6128-40dc-bf8c-09a70a9f4e21-card.png') },
  { id: '4d002dbb-3ae9-4108-9b1c-567a236deecc', name: 'MIAMI VIBE', theme: 'festival', description: '', original_url: p('4d002dbb-3ae9-4108-9b1c-567a236deecc-orig.jpg'), card_url: p('4d002dbb-3ae9-4108-9b1c-567a236deecc-card.png') },
  { id: '77b29ce8-0645-43dc-b4af-43c0f0840fb4', name: 'CHICAGO', theme: 'adventure', description: 'Zwiedzanie zimnego Chicago - podróż 2023', original_url: p('77b29ce8-0645-43dc-b4af-43c0f0840fb4-orig.jpg'), card_url: p('77b29ce8-0645-43dc-b4af-43c0f0840fb4-card.png') },
  { id: 'abf2e171-c035-49d0-bd0c-9d5b36d34fba', name: 'FI Addict Couple', theme: 'adventure', description: '', original_url: null, card_url: p('abf2e171-c035-49d0-bd0c-9d5b36d34fba-card.png') },
  { id: '9b2551f1-a7af-4dc3-9e7f-94ec61a7a048', name: 'Upperground Warsaw 2026', theme: 'techno_rave', description: 'Rave Crew', original_url: p('9b2551f1-a7af-4dc3-9e7f-94ec61a7a048-orig.jpg'), card_url: p('9b2551f1-a7af-4dc3-9e7f-94ec61a7a048-card.png') },
  { id: '5c133ff1-1d4a-4e11-813f-c0cf8ec558a4', name: 'Traveler Brothers', theme: 'adventure', description: 'Nowy rok w Tulum', original_url: p('5c133ff1-1d4a-4e11-813f-c0cf8ec558a4-orig.jpg'), card_url: p('5c133ff1-1d4a-4e11-813f-c0cf8ec558a4-card.png') },
  { id: '9245e556-633a-40db-a906-3b56c764e890', name: 'Shark Experience', theme: 'adventure', description: 'Exuma Bahamas ', original_url: p('9245e556-633a-40db-a906-3b56c764e890-orig.png'), card_url: p('9245e556-633a-40db-a906-3b56c764e890-card.png') },
  { id: 'ef8d5d37-6bf0-48b9-94ab-e1f18a6532fb', name: 'ADMSTERDAM ADE 2025', theme: 'techno_rave', description: 'AWAKENINGS HARD OPENING - AZYR', original_url: null, card_url: p('ef8d5d37-6bf0-48b9-94ab-e1f18a6532fb-card.png') },
  { id: 'a977fe56-741b-4c70-bf3a-8827d0e5b174', name: 'AUDIORIVER 2025', theme: 'festival', description: 'Pamiątka z audioriver 2025', original_url: p('a977fe56-741b-4c70-bf3a-8827d0e5b174-orig.png'), card_url: p('a977fe56-741b-4c70-bf3a-8827d0e5b174-card.png') },
  { id: '392f9c54-df93-4957-bd5c-5357f93dd80f', name: 'RAVE BROTHERS', theme: 'techno_rave', description: 'HOLY PRIEST SHOW WARSAW', original_url: p('392f9c54-df93-4957-bd5c-5357f93dd80f-orig.jpg'), card_url: p('392f9c54-df93-4957-bd5c-5357f93dd80f-card.png') },
  { id: '7de3963d-bbab-4cd6-9905-13d65c765c16', name: 'I HATE MODELS', theme: 'festival', description: 'KARTA DLA MISTRZA HARD TECHNO', original_url: p('7de3963d-bbab-4cd6-9905-13d65c765c16-orig.png'), card_url: p('7de3963d-bbab-4cd6-9905-13d65c765c16-card.png') },
  { id: '2ba9a2bb-880e-4455-8e1c-93b6c5104443', name: 'KLANGKUENSTLER', theme: 'festival', description: 'Dla legendarnego DJa - z okazji 20 rocznicy Audioriver', original_url: null, card_url: p('2ba9a2bb-880e-4455-8e1c-93b6c5104443-card.png') },
  { id: '07034608-c276-4491-b51a-9c4e2b2a1789', name: 'WRK', theme: 'festival', description: 'Dla perełki Łódzkiej i Polskiej sceny Techno na Audioriver 2026', original_url: p('07034608-c276-4491-b51a-9c4e2b2a1789-orig.png'), card_url: p('07034608-c276-4491-b51a-9c4e2b2a1789-card.png') },
  { id: 'fce06a6b-9f89-4826-b09e-754b1e6543d4', name: 'Rave Family ', theme: 'festival', description: 'Rocznica znajomości, pamiątką z Audioriver 2026', original_url: p('fce06a6b-9f89-4826-b09e-754b1e6543d4-orig.png'), card_url: p('fce06a6b-9f89-4826-b09e-754b1e6543d4-card.png') },
]
