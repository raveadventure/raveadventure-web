import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 })

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'production' })
      .eq('review_token', token)
      .select('*')
      .single()

    if (error || !order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })

    // Powiadom admina
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: ['michal.koch96@gmail.com'],
        subject: `✅ Projekt zatwierdzony — ${order.name}`,
        html: `<div style="font-family:sans-serif;background:#0a0a14;color:#f0eeff;padding:32px;border-radius:12px;">
          <h2 style="color:#00e5a0;">✅ Klient zatwierdził projekt!</h2>
          <p><strong>Klient:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Motyw:</strong> ${order.theme}</p>
          <p><strong>Adres wysyłki:</strong> ${order.address}</p>
          <p style="color:rgba(240,238,255,0.5);margin-top:20px;">Status zmieniony na: <strong style="color:#f97316;">Produkcja</strong></p>
        </div>`,
      }),
    })

    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
