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
    const { token, notes } = await req.json()
    if (!token) return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 })

    let order: any
    if (isSupabasePlaceholder()) {
      order = updateOrderByToken(token, { status: 'in_project', review_notes: notes })
    } else {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'in_project', review_notes: notes })
        .eq('review_token', token)
        .select('*')
        .single()
      order = error ? null : data
    }

    if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })

    // Powiadom admina z uwagami
    await sendEmail({
      from: 'RaveAdventure <zamowienia@raveadventure.pl>',
      to: ['michal.koch96@gmail.com'],
      reply_to: order.email,
      orderId: order.id,
      subject: `🔄 Projekt odrzucony — ${order.name} — potrzebne poprawki`,
      html: `<div style="font-family:sans-serif;background:#0a0a14;color:#f0eeff;padding:32px;border-radius:12px;">
          <h2 style="color:#ff4d6d;">🔄 Klient ma uwagi do projektu</h2>
          <p><strong>Klient:</strong> ${order.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${order.email}" style="color:#00f0ff;">${order.email}</a></p>
          <p><strong>Motyw:</strong> ${order.theme}</p>
          <div style="background:#16162a;border-left:3px solid #ff4d6d;padding:16px;border-radius:0 8px 8px 0;margin-top:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(240,238,255,0.4);text-transform:uppercase;letter-spacing:1px;">Uwagi klienta</p>
            <p style="margin:0;color:#f0eeff;line-height:1.7;">${notes || 'Brak uwag — klient nie wpisał szczegółów.'}</p>
          </div>
          <p style="color:rgba(240,238,255,0.5);margin-top:20px;">Status zmieniony na: <strong style="color:#3b82f6;">W projekcie</strong></p>
        </div>`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
