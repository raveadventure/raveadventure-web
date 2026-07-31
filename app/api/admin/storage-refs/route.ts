// Wyszukanie grafik referencyjnych klienta (custom front/back) dla jednego zamówienia —
// używane przez ClientMaterials w panelu admina. Wcześniej robione bezpośrednio z przeglądarki
// przez supabase.storage.list() (kluczem anon) — przeniesione server-side, żeby dało się zamknąć
// publiczne listowanie plików w buckecie order-photos (patrz CLAUDE.md, zabezpieczenie Storage).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const { data } = await supabaseAdmin.storage.from('order-photos').list('', { search: orderId })
  const front = data?.find(f => f.name.includes(orderId + '-custom'))
  const back = data?.find(f => f.name.includes(orderId + '-ref-back'))

  return NextResponse.json({
    refFrontUrl: front ? `${supabaseUrl}/storage/v1/object/public/order-photos/${front.name}` : null,
    refBackUrl: back ? `${supabaseUrl}/storage/v1/object/public/order-photos/${back.name}` : null,
  })
}
