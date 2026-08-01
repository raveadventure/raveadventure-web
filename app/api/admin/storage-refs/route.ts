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

  // Nowa struktura (od 2026-08-01) — orders/{id8}/custom.ext i orders/{id8}/ref-back.ext.
  const orderFolder = `orders/${orderId.slice(0, 8)}`
  const { data: folderData } = await supabaseAdmin.storage.from('order-photos').list(orderFolder)
  let front = folderData?.find(f => f.name.startsWith('custom.'))
  let back = folderData?.find(f => f.name.startsWith('ref-back.'))
  let frontPath = front ? `${orderFolder}/${front.name}` : null
  let backPath = back ? `${orderFolder}/${back.name}` : null

  // Stara, płaska struktura (zamówienia sprzed folderów per-zlecenie) — fallback.
  if (!frontPath || !backPath) {
    const { data: flatData } = await supabaseAdmin.storage.from('order-photos').list('', { search: orderId })
    if (!frontPath) {
      const flatFront = flatData?.find(f => f.name.includes(orderId + '-custom'))
      frontPath = flatFront ? flatFront.name : null
    }
    if (!backPath) {
      const flatBack = flatData?.find(f => f.name.includes(orderId + '-ref-back'))
      backPath = flatBack ? flatBack.name : null
    }
  }

  return NextResponse.json({
    refFrontUrl: frontPath ? `${supabaseUrl}/storage/v1/object/public/order-photos/${frontPath}` : null,
    refBackUrl: backPath ? `${supabaseUrl}/storage/v1/object/public/order-photos/${backPath}` : null,
  })
}
