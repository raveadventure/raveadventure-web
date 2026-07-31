// Serwerowy dostęp do lokalnego mocka tabeli `reviews` (.dev-reviews/items.json) — używany
// przez app/api/dev-reviews/route.ts. Plik startowy zasilany jest przykładowymi opiniami, żeby
// lokalnie strona główna i panel admina od razu miały co pokazać. Usunąć razem z resztą
// lokalnego mocka, gdy podłączymy prawdziwe środowisko Supabase.
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { REVIEWS_SEED } from './reviewsSeed'

const STORE_DIR = path.join(process.cwd(), '.dev-reviews')
const STORE_FILE = path.join(STORE_DIR, 'items.json')

function seed() {
  return REVIEWS_SEED.map(r => ({ ...r, id: randomUUID() }))
}

export function readReviews(): any[] {
  if (!fs.existsSync(STORE_FILE)) return seed()
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) } catch { return seed() }
}

export function writeReviews(items: any[]) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2))
}

export function insertReview(fields: Record<string, any>) {
  const items = readReviews()
  const item = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    approved: false,
    lang: 'pl',
    photo_url: null,
    ...fields,
  }
  items.unshift(item)
  writeReviews(items)
  return item
}

export function updateReview(id: string, updates: Record<string, any>) {
  const items = readReviews()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates }
  writeReviews(items)
  return items[idx]
}

export function deleteReview(id: string) {
  const items = readReviews().filter(i => i.id !== id)
  writeReviews(items)
}
