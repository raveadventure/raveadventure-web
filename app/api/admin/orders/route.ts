// Server-side dostęp do tabeli `orders` kluczem service-role, chroniony ciasteczkiem admin_session
// (patrz lib/adminAuth.ts). Zastępuje bezpośrednie zapytania supabase.from('orders') z przeglądarki
// w app/admin/page.tsx, które wcześniej działały kluczem anon i RLS otwartym na `true` — każdy
// znający publiczny klucz anon mógł czytać/zmieniać/kasować wszystkie zamówienia z pominięciem
// logowania do panelu. Po tej zmianie RLS na orders jest zamknięte dla ról public/anon (patrz
// migracja lock_down_orders_rls), a jedyny dostęp idzie przez te route'y.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'
import { archiveOrderFiles, STORAGE_BUCKET } from '../../../../lib/orderArchive'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, updates } = await req.json()
  if (!id || !updates) return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })

  const finalUpdates = { ...updates }
  if (updates.status === 'done') {
    const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', id).single()
    if (order) Object.assign(finalUpdates, await archiveOrderFiles(supabaseAdmin, order))
  }

  const { data, error } = await supabaseAdmin.from('orders').update(finalUpdates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'pdf']
  const filesToDelete: string[] = []
  exts.forEach(ext => filesToDelete.push(`${id}-front.${ext}`))
  exts.forEach(ext => filesToDelete.push(`${id}-custom.${ext}`))
  exts.forEach(ext => filesToDelete.push(`${id}-ref-back.${ext}`))

  const { data: designFiles } = await supabaseAdmin.storage.from(STORAGE_BUCKET).list('designs')
  if (designFiles) {
    designFiles.filter(f => f.name.startsWith(id)).forEach(f => filesToDelete.push(`designs/${f.name}`))
  }

  const unique = filesToDelete.filter((v, i, a) => a.indexOf(v) === i)
  if (unique.length > 0) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(unique)
  }

  const { error } = await supabaseAdmin.from('orders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
