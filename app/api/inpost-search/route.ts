import { NextRequest, NextResponse } from 'next/server'

// Serwerowy proxy do darmowego, publicznego API InPost (te same dane co oficjalna wyszukiwarka
// paczkomatów na inpost.pl) — używane do podpowiedzi w formularzu, gdy nie ma jeszcze prawdziwego
// tokenu Geowidget (patrz components/InpostGeowidget.tsx). Musi iść przez serwer: API blokuje
// żądania z nagłówkiem Origin (CORS z przeglądarki), ale odpowiada normalnie server-to-server.
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 3) return NextResponse.json({ points: [] })

  try {
    const res = await fetch(
      `https://api-pl-points.easypack24.net/v1/points?query=${encodeURIComponent(q)}&type=parcel_locker&limit=8`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return NextResponse.json({ points: [] })
    const data = await res.json()
    const points = (data.items || []).map((p: any) => ({
      id: p.name,
      address: `${p.name} — ${p.address?.line1 || ''}, ${p.address_details?.city || p.address?.line2 || ''}`,
    }))
    return NextResponse.json({ points })
  } catch {
    return NextResponse.json({ points: [] })
  }
}
