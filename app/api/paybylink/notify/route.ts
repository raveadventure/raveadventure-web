import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paybylinkSignature } from '../../../../lib/paybylink'
import { sendEmail } from '../../../../lib/devEmail'
import { isSupabasePlaceholder, readOrders, updateOrderById } from '../../../../lib/devOrdersStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const okText = () => new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })

// Webhook wołany przez Paybylink po zaksięgowaniu płatności (notifyURL z /api/paybylink/generate).
// Musi odpowiedzieć dokładnie 200 + body "OK" + Content-Type text/plain, inaczej Paybylink
// dobija do 241 retry z rosnącym odstępem. `control` = orders.id (ustawione przy generowaniu
// transakcji), więc nie potrzebujemy osobnej tabeli mapującej.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transactionId, control, email, amountPaid, notificationAttempt, paymentType, apiVersion, signature } = body

    const secretKey = process.env.PAYBYLINK_API_KEY
    if (!secretKey) {
      console.error('Paybylink notify: brak PAYBYLINK_API_KEY w środowisku — nie mogę zweryfikować podpisu')
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
    }

    const priceStr = Number(amountPaid).toFixed(2)
    const expectedSignature = paybylinkSignature(secretKey, [transactionId, control, email, priceStr, notificationAttempt, paymentType, apiVersion])
    if (String(signature).toLowerCase() !== expectedSignature.toLowerCase()) {
      console.error('Paybylink notify: nieprawidłowy podpis dla control=', control)
      return NextResponse.json({ error: 'invalid signature' }, { status: 403 })
    }

    let order: any
    if (isSupabasePlaceholder()) {
      order = readOrders().find(o => o.id === control) || null
    } else {
      const { data } = await supabase.from('orders').select('*').eq('id', control).single()
      order = data
    }
    if (!order) {
      console.error('Paybylink notify: nie znaleziono zamówienia dla control=', control)
      return NextResponse.json({ error: 'order not found' }, { status: 404 })
    }

    // Idempotencja — notyfikacje mogą przyjść wielokrotnie (retry Paybylink), nie duplikujemy
    // przejścia statusu ani maila do admina, jeśli zamówienie jest już opłacone.
    if (order.paid) return okText()

    const expectedTotal = Number(order.total_price) || 0
    const paidAmount = Number(amountPaid) || 0
    if (paidAmount + 0.01 < expectedTotal) {
      console.error(`Paybylink notify: kwota niezgodna dla zamówienia ${order.id} — oczekiwano ${expectedTotal}, otrzymano ${paidAmount}`)
      await sendEmail({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: ['michal.koch96@gmail.com'],
        orderId: order.id,
        subject: `⚠️ Paybylink: niezgodna kwota — ${order.name}`,
        html: `<div style="font-family:sans-serif;background:#0a0a14;color:#f0eeff;padding:32px;border-radius:12px;">
            <h2 style="color:#f59e0b;">⚠️ Kwota wpłaty niezgodna z zamówieniem</h2>
            <p><strong>Zamówienie:</strong> ${order.name} (${String(order.id).slice(0, 8)})</p>
            <p><strong>Oczekiwano:</strong> ${expectedTotal} zł</p>
            <p><strong>Otrzymano:</strong> ${paidAmount} zł</p>
            <p style="color:rgba(240,238,255,0.5);margin-top:16px;">Nie oznaczono automatycznie jako opłacone — sprawdź ręcznie w panelu.</p>
          </div>`,
      })
      // Notyfikację potwierdzamy (dotarła poprawnie i ma ważny podpis) — problem jest biznesowy,
      // nie techniczny, więc retry ze strony Paybylink niczego by nie naprawił.
      return okText()
    }

    const updates: Record<string, any> = { paid: true, paybylink_transaction_id: transactionId }
    if (order.status === 'awaiting_payment') {
      updates.status = 'production'
      updates.approved_at = new Date().toISOString()
    }

    if (isSupabasePlaceholder()) {
      updateOrderById(order.id, updates)
    } else {
      await supabase.from('orders').update(updates).eq('id', order.id)
    }

    await sendEmail({
      from: 'RaveAdventure <zamowienia@raveadventure.pl>',
      to: ['michal.koch96@gmail.com'],
      orderId: order.id,
      subject: `💳 Płatność otrzymana automatycznie — ${order.name}`,
      html: `<div style="font-family:sans-serif;background:#0a0a14;color:#f0eeff;padding:32px;border-radius:12px;">
          <h2 style="color:#00e5a0;">💳 Paybylink: płatność zaksięgowana</h2>
          <p><strong>Klient:</strong> ${order.name}</p>
          <p><strong>Kwota:</strong> ${paidAmount} zł (${paymentType})</p>
          <p><strong>ID transakcji:</strong> ${transactionId}</p>
          <p style="color:rgba(240,238,255,0.5);margin-top:20px;">Status zmieniony automatycznie na: <strong style="color:#00e5a0;">Produkcja</strong></p>
        </div>`,
    })

    return okText()
  } catch (err) {
    console.error('Paybylink notify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
