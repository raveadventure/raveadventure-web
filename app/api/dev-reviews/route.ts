// Lokalny mock tabeli `reviews` — TYLKO gdy .env.local ma placeholder Supabase (patrz
// isSupabasePlaceholder() w lib/reviewsLocalMock.ts). Trzyma opinie w pliku JSON, żeby dało się
// przetestować formularz + moderację lokalnie bez połączenia z produkcyjnym Supabase.
// Usunąć razem z lib/devReviewsStore.ts, gdy podłączymy prawdziwe środowisko.
import { NextRequest, NextResponse } from 'next/server'
import { readReviews, insertReview, updateReview, deleteReview } from '../../../lib/devReviewsStore'

function blocked() {
  return process.env.NODE_ENV === 'production'
}

export async function GET() {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const items = readReviews().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const item = insertReview(body)
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const body = await req.json()
  const { id, ...updates } = body
  const item = updateReview(id, updates)
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  if (blocked()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  deleteReview(id)
  return NextResponse.json({ ok: true })
}
