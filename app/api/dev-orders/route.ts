// Lokalny mock tabeli `orders` — używany TYLKO gdy .env.local ma placeholder Supabase (patrz
// isSupabasePlaceholder() w lib/ordersLocalMock.ts). Trzyma zamówienia w pliku JSON zamiast
// prawdziwej bazy, więc panel admina i formularz zamówienia da się przetestować lokalnie bez
// połączenia z produkcyjnym Supabase. Usunąć razem z lib/ordersLocalMock.ts, gdy podłączymy
// prawdziwe środowisko.
import { NextRequest, NextResponse } from 'next/server'
import { readOrders, writeOrders, insertOrder } from '../../../lib/devOrdersStore'

function blocked() {
  return process.env.NODE_ENV === 'production'
}

export async function GET() {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const orders = readOrders().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const order = insertOrder(body)
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const { id, ...updates } = body
  const orders = readOrders()
  const idx = orders.findIndex(o => o.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  orders[idx] = { ...orders[idx], ...updates }
  writeOrders(orders)
  return NextResponse.json(orders[idx])
}

export async function DELETE(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  const orders = readOrders().filter(o => o.id !== id)
  writeOrders(orders)
  return NextResponse.json({ ok: true })
}
