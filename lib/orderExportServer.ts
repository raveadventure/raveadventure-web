// Pobiera zamówienie z bazy, buduje treść eksportu (lib/orderExportText.ts) i wgrywa ją do
// Storage jako orders/{id8}/zlecenie-{id8}.txt (upsert — bezpieczne tylko server-side kluczem
// service-role, patrz CLAUDE.md o blokadzie RLS). Używane przez /api/admin/export-txt (ręczny
// eksport z panelu) i /api/generate-order-txt (automatycznie, zaraz po złożeniu zamówienia).
import { SupabaseClient } from '@supabase/supabase-js'
import { buildOrderExportLines } from './orderExportText'

export async function regenerateOrderTxt(supabaseAdmin: SupabaseClient, orderId: string): Promise<{ content: string; fileName: string } | { error: string }> {
  const { data: order, error: fetchError } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
  if (fetchError || !order) return { error: fetchError?.message || 'Order not found' }

  const content = buildOrderExportLines(order).join('\n')
  const fileName = `zlecenie-${orderId.slice(0, 8)}.txt`
  const path = `orders/${orderId.slice(0, 8)}/${fileName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('order-photos')
    .upload(path, content, { upsert: true, contentType: 'text/plain;charset=utf-8' })
  if (uploadError) return { error: uploadError.message }

  return { content, fileName }
}
