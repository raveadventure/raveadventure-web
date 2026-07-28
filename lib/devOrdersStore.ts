// Serwerowy dostęp do lokalnego mocka tabeli `orders` (.dev-orders/orders.json) — używany przez
// API route'y, które w produkcji piszą bezpośrednio do Supabase (send-design, approve, reject).
// Te route'y nie mogą korzystać z lib/ordersLocalMock.ts (ten robi fetch() na relatywny URL, co
// działa tylko w przeglądarce) — stąd osobny moduł operujący na pliku przez fs, do importu wprost
// w server-side route handlerach. Usunąć razem z resztą lokalnego mocka, gdy podłączymy prawdziwe
// środowisko.
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const STORE_DIR = path.join(process.cwd(), '.dev-orders')
const STORE_FILE = path.join(STORE_DIR, 'orders.json')

export function isSupabasePlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export function readOrders(): any[] {
  if (!fs.existsSync(STORE_FILE)) return []
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) } catch { return [] }
}

export function writeOrders(orders: any[]) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(orders, null, 2))
}

export function insertOrder(fields: Record<string, any>) {
  const order = { id: randomUUID(), created_at: new Date().toISOString(), status: 'new', paid: false, ...fields }
  const orders = readOrders()
  orders.push(order)
  writeOrders(orders)
  return order
}

export function updateOrderById(id: string, updates: Record<string, any>) {
  const orders = readOrders()
  const idx = orders.findIndex(o => o.id === id)
  if (idx === -1) return null
  orders[idx] = { ...orders[idx], ...updates }
  writeOrders(orders)
  return orders[idx]
}

export function getOrderByToken(token: string) {
  return readOrders().find(o => o.review_token === token) || null
}

export function updateOrderByToken(token: string, updates: Record<string, any>) {
  const orders = readOrders()
  const idx = orders.findIndex(o => o.review_token === token)
  if (idx === -1) return null
  orders[idx] = { ...orders[idx], ...updates }
  writeOrders(orders)
  return orders[idx]
}
