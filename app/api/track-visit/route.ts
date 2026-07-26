import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Prosty licznik odwiedzin strony głównej — jeden wiersz w tabeli `page_views` na wizytę,
// łączna liczba to `select count(*)`. Wstawianie wierszy zamiast inkrementacji jednego licznika
// unika problemów z równoczesnym nadpisywaniem (race condition) przy kilku odwiedzinach naraz.
// Lokalnie (placeholder Supabase) trzyma prostą liczbę w pliku JSON zamiast prawdziwej tabeli.

const STORE_DIR = path.join(process.cwd(), '.dev-page-views')
const STORE_FILE = path.join(STORE_DIR, 'count.json')

function isSupabasePlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

function readLocalCount(): number {
  if (!fs.existsSync(STORE_FILE)) return 0
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')).count || 0 } catch { return 0 }
}

function writeLocalCount(count: number) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify({ count }))
}

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

export async function POST() {
  try {
    if (isSupabasePlaceholder()) {
      writeLocalCount(readLocalCount() + 1)
      return NextResponse.json({ ok: true })
    }
    await getSupabase().from('page_views').insert([{}])
    return NextResponse.json({ ok: true })
  } catch {
    // Licznik odwiedzin nigdy nie powinien wywrócić ładowania strony klientowi
    return NextResponse.json({ ok: false })
  }
}

export async function GET() {
  try {
    if (isSupabasePlaceholder()) {
      return NextResponse.json({ count: readLocalCount() })
    }
    const { count } = await getSupabase().from('page_views').select('*', { count: 'exact', head: true })
    return NextResponse.json({ count: count || 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
