// Zwraca tylko podgląd projektu (grafiki) po review_token — używane na /review, żeby klient
// mógł zobaczyć projekt karty na stronie potwierdzenia, bez konieczności wracania do maila.
// Ten sam token co przy /api/approve i /api/reject — nie ujawnia nic ponad to, co już jest w mailu.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isSupabasePlaceholder, getOrderByToken } from '../../../lib/devOrdersStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 })

  let order: any
  if (isSupabasePlaceholder()) {
    order = getOrderByToken(token)
  } else {
    const { data } = await supabase
      .from('orders')
      .select('design_url, design_url_2, design_back_url, approved_design_option, card_type')
      .eq('review_token', token)
      .single()
    order = data
  }
  if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })

  return NextResponse.json({
    design_url: order.design_url || null,
    design_url_2: order.design_url_2 || null,
    design_back_url: order.design_back_url || null,
    approved_design_option: order.approved_design_option ?? null,
    card_type: order.card_type || null,
  })
}
