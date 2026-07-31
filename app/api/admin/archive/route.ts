// Zbiorcza archiwizacja plików wszystkich zakończonych ("done") zamówień do closed-orders/ —
// przycisk "Zarchiwizuj zakończone" w panelu admina. Przeniesione server-side (service-role key)
// z tego samego powodu co app/api/admin/orders (patrz komentarz tam).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'
import { archiveOrderFiles } from '../../../../lib/orderArchive'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: doneOrders, error } = await supabaseAdmin.from('orders').select('*').eq('status', 'done')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let archivedCount = 0
  let filesMoved = 0
  for (const order of doneOrders || []) {
    const fileUpdates = await archiveOrderFiles(supabaseAdmin, order)
    filesMoved += Object.keys(fileUpdates).length
    if (Object.keys(fileUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin.from('orders').update(fileUpdates).eq('id', order.id)
      if (updateError) {
        console.error(`[archive] ${order.id}: przeniesiono pliki, ale nie udało się zaktualizować zamówienia:`, updateError)
      } else {
        archivedCount++
      }
    }
  }

  return NextResponse.json({ archivedCount, filesMoved, total: (doneOrders || []).length })
}
