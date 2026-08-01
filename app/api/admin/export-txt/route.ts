// Wgrywa kopię wyeksportowanego .txt zamówienia do Storage (orders/{id8}/zlecenie-{id8}.txt),
// obok zdjęcia/projektów tego zamówienia — patrz exportOrderAsText w app/admin/page.tsx.
// Server-side (service-role), bo klucz anon może tylko wstawiać NOWE pliki (upsert:false) —
// ten plik trzeba umieć nadpisać przy ponownym kliknięciu eksportu, a upsert:true wymaga
// uprawnienia UPDATE w Storage, którego anon celowo nie ma od blokady RLS (patrz CLAUDE.md).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { orderId, fileName, content } = await req.json()
  if (!orderId || !fileName || typeof content !== 'string') {
    return NextResponse.json({ error: 'Missing orderId, fileName or content' }, { status: 400 })
  }

  const path = `orders/${orderId.slice(0, 8)}/${fileName}`
  const { error } = await supabaseAdmin.storage
    .from('order-photos')
    .upload(path, content, { upsert: true, contentType: 'text/plain;charset=utf-8' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
