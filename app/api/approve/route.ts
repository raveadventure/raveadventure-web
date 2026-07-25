import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../../lib/devEmail'
import { isSupabasePlaceholder, updateOrderByToken } from '../../../lib/devOrdersStore'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
export async function POST(req: NextRequest) {
  try {
    const { token, option } = await req.json()
    if (!token) return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 })
    const approvedOption = option ? Number(option) : null
    const updates = { status: 'awaiting_payment', approved_design_option: approvedOption }
    let order: any
    if (isSupabasePlaceholder()) {
      order = updateOrderByToken(token, updates)
    } else {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('review_token', token)
        .select('*')
        .single()
      order = error ? null : data
    }
    if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })
    // Powiadom admina
    await sendEmail({
      from: 'RaveAdventure <zamowienia@raveadventure.pl>',
      to: ['michal.koch96@gmail.com'],
      orderId: order.id,
      subject: `✅ Projekt zatwierdzony — ${order.name} (czeka na płatność)`,
      html: `<div style="font-family:sans-serif;background:#0a0a14;color:#f0eeff;padding:32px;border-radius:12px;">
          <h2 style="color:#ec4899;">✅ Klient zatwierdził projekt!</h2>
          <p><strong>Klient:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Motyw:</strong> ${order.theme}</p>
          ${approvedOption ? `<p><strong>Zatwierdzony wariant:</strong> ${approvedOption}</p>` : ''}
          <p><strong>Kwota:</strong> ${order.total_price ? order.total_price + ' zł' : '—'}</p>
          <p><strong>Adres wysyłki:</strong> ${order.address}</p>
          <p style="color:rgba(240,238,255,0.5);margin-top:20px;">Status zmieniony na: <strong style="color:#ec4899;">Do opłacenia</strong></p>
          <p style="color:rgba(240,238,255,0.5);">Klient otrzymał dane do płatności (BLIK / przelew) z prośbą o podanie pierwszych 8 znaków ID zamówienia w tytule. Sprawdź wpłatę i oznacz zlecenie jako opłacone w panelu — status przeskoczy automatycznie na "Produkcja".</p>
        </div>`,
    })
    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
