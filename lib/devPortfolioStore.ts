// Serwerowy dostęp do lokalnego mocka tabeli `portfolio` (.dev-portfolio/items.json) — używany
// przez app/api/dev-portfolio/route.ts. Plik startowy jest zasilany z PORTFOLIO_LOCAL_MOCK
// (lib/portfolioLocalMock.ts), żeby panel admina od razu widział te same karty co publiczna
// strona /portfolio lokalnie. Usunąć razem z resztą lokalnego mocka, gdy podłączymy prawdziwe
// środowisko Supabase.
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { PORTFOLIO_LOCAL_MOCK } from './portfolioLocalMock'

const STORE_DIR = path.join(process.cwd(), '.dev-portfolio')
const STORE_FILE = path.join(STORE_DIR, 'items.json')

function seed() {
  return PORTFOLIO_LOCAL_MOCK.map((item, i) => ({ ...item, active: true, sort_order: i }))
}

export function readPortfolio(): any[] {
  if (!fs.existsSync(STORE_FILE)) return seed()
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) } catch { return seed() }
}

export function writePortfolio(items: any[]) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2))
}

export function insertPortfolioItem(fields: Record<string, any>) {
  const items = readPortfolio()
  const item = { id: randomUUID(), active: true, sort_order: items.length, ...fields }
  items.push(item)
  writePortfolio(items)
  return item
}

export function updatePortfolioItem(id: string, updates: Record<string, any>) {
  const items = readPortfolio()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates }
  writePortfolio(items)
  return items[idx]
}

export function deletePortfolioItem(id: string) {
  const items = readPortfolio().filter(i => i.id !== id)
  writePortfolio(items)
}
