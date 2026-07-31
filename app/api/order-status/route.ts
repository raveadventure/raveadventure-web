// Publiczny odczyt statusu zamówienia po id (token w /status?token=<uuid>) — bez logowania,
// tak jak dotychczas, ale teraz server-side kluczem service-role zamiast wprost z przeglądarki
// kluczem anon (RLS na orders jest zamknięte dla ról public/anon, patrz CLAUDE.md). Zwraca
// wyłącznie ten sam wąski zestaw pól co wcześniej — żadnych danych kontaktowych klienta.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id,created_at,approved_at,shipped_at,status,name,theme,card_type,quantity,total_price')
    .eq('id', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order: data })
}
