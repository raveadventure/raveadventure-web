// Server-side CRUD tabeli `portfolio` kluczem service-role, chroniony ciasteczkiem admin_session.
// Wcześniej app/admin/portfolio/page.tsx pisało bezpośrednio kluczem anon (INSERT/UPDATE/DELETE
// otwarte na `true` w RLS) — dane portfolio nie są wrażliwe, ale otwarty zapis to ryzyko wandalizmu
// (ktoś mógłby podmienić/skasować całe portfolio bez logowania). SELECT zostaje publiczny i otwarty —
// to dane marketingowe, mają być widoczne dla każdego na /portfolio.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '../../../../lib/adminAuth'
import { storagePathFromUrl } from '../../../../lib/orderArchive'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fields = await req.json()
  const { data, error } = await supabaseAdmin.from('portfolio').insert([fields]).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('portfolio').update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Usuwamy też pliki w Storage (card_url/original_url) — bez tego zostawały tam na zawsze po
  // skasowaniu wiersza z bazy (znalezione 2026-08-02: 44 osierocone pliki po aktualizacji
  // portfolio). Best-effort: błąd usuwania plików nie blokuje skasowania wiersza z bazy.
  const { data: row } = await supabaseAdmin.from('portfolio').select('card_url, original_url').eq('id', id).single()
  const paths = [storagePathFromUrl(row?.card_url), storagePathFromUrl(row?.original_url)].filter((p): p is string => !!p)
  if (paths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage.from('order-photos').remove(paths)
    if (storageError) console.error(`[portfolio delete] ${id}: nie udało się usunąć plików Storage:`, storageError)
  }

  const { error } = await supabaseAdmin.from('portfolio').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
