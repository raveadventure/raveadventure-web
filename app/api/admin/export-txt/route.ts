// Ręczny eksport zamówienia z panelu admina (przycisk „📄 Eksportuj dane zlecenia") — pobiera
// świeże dane z bazy, buduje treść i wgrywa ją do orders/{id8}/ w Storage (patrz
// lib/orderExportServer.ts), a treść odsyła z powrotem, żeby panel mógł uruchomić też zwykłe
// pobranie pliku na dysk. Server-side (service-role) — klucz anon nie ma uprawnienia UPDATE
// w Storage (blokada RLS), a ten plik trzeba umieć nadpisać przy kolejnych eksportach.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'
import { regenerateOrderTxt } from '../../../../lib/orderExportServer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const result = await regenerateOrderTxt(supabaseAdmin, orderId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}
