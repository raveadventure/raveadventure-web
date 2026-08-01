// Automatyczne wygenerowanie pliku .txt (ten sam format co ręczny eksport z panelu, patrz
// lib/orderExportServer.ts) zaraz po złożeniu zamówienia — trafia do orders/{id8}/ w Storage,
// obok zdjęcia klienta, żeby folder zamówienia był kompletny bez konieczności ręcznego klikania
// eksportu w panelu (patrz CLAUDE.md). Publiczny/bez logowania — tak jak /api/create-order,
// wywoływany automatycznie z przeglądarki klienta zaraz po zapisaniu zamówienia i zdjęcia.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { regenerateOrderTxt } from '../../../lib/orderExportServer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const result = await regenerateOrderTxt(supabaseAdmin, orderId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
