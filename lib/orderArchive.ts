// Logika przenoszenia plików zakończonych zamówień do closed-orders/ w Storage — wspólna dla
// app/api/admin/orders (archiwizacja przy zmianie statusu na "done") i app/api/admin/archive
// (zbiorczy przycisk "Zarchiwizuj zakończone"). Przeniesione tu z app/admin/page.tsx, bo teraz
// musi działać server-side kluczem service-role (patrz CLAUDE.md — zamknięcie RLS na orders/Storage).
import { SupabaseClient } from '@supabase/supabase-js'

export const STORAGE_BUCKET = 'order-photos'
export const ARCHIVE_PREFIX = 'closed-orders/'
export const ARCHIVABLE_URL_FIELDS = [
  'photo_url', 'design_url', 'design_url_2', 'design_back_url',
  'design_original_url', 'design_original_url_2', 'design_back_original_url',
] as const

export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length)
  const queryIdx = path.indexOf('?')
  return queryIdx === -1 ? path : path.slice(0, queryIdx)
}

export async function archiveOrderFiles(supabaseAdmin: SupabaseClient, order: Record<string, any>): Promise<Record<string, string>> {
  const updates: Record<string, string> = {}
  for (const field of ARCHIVABLE_URL_FIELDS) {
    const path = storagePathFromUrl(order[field])
    if (!path || path.startsWith(ARCHIVE_PREFIX)) continue
    const destPath = ARCHIVE_PREFIX + path
    const { error: moveError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).move(path, destPath)
    if (moveError) {
      console.error(`[archive] ${order.id}: nie udało się przenieść "${field}" (${path} → ${destPath}):`, moveError)
      continue
    }
    const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(destPath)
    updates[field] = data.publicUrl
  }
  return updates
}
