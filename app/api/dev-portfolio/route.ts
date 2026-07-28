// Lokalny mock tabeli `portfolio` — używany TYLKO gdy .env.local ma placeholder Supabase (patrz
// isSupabasePlaceholder() w lib/portfolioLocalMock.ts). Trzyma karty portfolio w pliku JSON, żeby
// panel admina (app/admin/portfolio/page.tsx) dało się przetestować lokalnie bez połączenia z
// produkcyjnym Supabase/Storage. Usunąć razem z lib/devPortfolioStore.ts, gdy podłączymy
// prawdziwe środowisko.
import { NextRequest, NextResponse } from 'next/server'
import { readPortfolio, writePortfolio, insertPortfolioItem, updatePortfolioItem, deletePortfolioItem } from '../../../lib/devPortfolioStore'

function blocked() {
  return process.env.NODE_ENV === 'production'
}

export async function GET() {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const items = readPortfolio().sort((a, b) => a.sort_order - b.sort_order)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const item = insertPortfolioItem(body)
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const { id, ...updates } = body
  const item = updatePortfolioItem(id, updates)
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  deletePortfolioItem(id)
  return NextResponse.json({ ok: true })
}
