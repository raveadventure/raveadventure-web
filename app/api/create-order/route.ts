// Tworzenie nowego zamówienia — jedyny publiczny (bez logowania) punkt zapisu do tabeli `orders`,
// używany przez formularz na stronie głównej. Wcześniej klient robił to wprost przez
// supabase.from('orders').insert() kluczem anon; teraz insert dzieje się server-side kluczem
// service-role, bo RLS na orders jest zamknięte dla ról public/anon (patrz CLAUDE.md — zabezpieczenie
// tabeli orders, wcześniej SELECT/UPDATE/DELETE były otwarte na `true` dla każdego). Zdjęcia nadal
// idą bezpośrednio z przeglądarki do Storage (limit 4.5MB na body API Vercela — Lekcja #3), tylko
// zapis samego pola photo_url na zamówieniu przechodzi przez PATCH tutaj.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const orderFields = await req.json()
  const { data, error } = await supabaseAdmin.from('orders').insert([orderFields]).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

// Tylko photo_url — jedyne pole, które klient musi domalować na własnym, dopiero co utworzonym
// zamówieniu (po uploadzie zdjęcia do Storage), bez żadnego innego dostępu do zamówień.
export async function PATCH(req: NextRequest) {
  const { id, photo_url } = await req.json()
  if (!id || typeof photo_url !== 'string') return NextResponse.json({ error: 'Missing id or photo_url' }, { status: 400 })
  const { error } = await supabaseAdmin.from('orders').update({ photo_url }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
