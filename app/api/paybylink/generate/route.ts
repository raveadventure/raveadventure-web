import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paybylinkSignature } from '../../../../lib/paybylink'
import { isSupabasePlaceholder, getOrderByToken, updateOrderByToken } from '../../../../lib/devOrdersStore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Publiczny, token-based endpoint (jak /api/approve) — klient woła go z /review po zaakceptowaniu
// projektu, żeby dostać URL do hostowanej strony płatności Paybylink (BLIK / Przelewy Online).
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 })

    let order: any
    if (isSupabasePlaceholder()) {
      order = getOrderByToken(token)
    } else {
      const { data } = await supabase.from('orders').select('*').eq('review_token', token).single()
      order = data
    }
    if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })
    if (order.paid) return NextResponse.json({ error: 'Zamówienie jest już opłacone' }, { status: 400 })
    if (!order.total_price) return NextResponse.json({ error: 'Brak kwoty do zapłaty' }, { status: 400 })

    const shopId = process.env.ID_Sklepu
    const secretKey = process.env.PAYBYLINK_API_KEY
    if (!shopId || !secretKey) {
      console.error('Paybylink: brak ID_Sklepu lub PAYBYLINK_API_KEY w środowisku')
      return NextResponse.json({ error: 'Płatność online chwilowo niedostępna' }, { status: 503 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raveadventure.pl'
    const price = Number(order.total_price).toFixed(2)
    const control = order.id
    const description = `RaveAdventure - zamowienie ${String(order.id).slice(0, 8)}`
    const email = order.email
    const notifyURL = `${baseUrl}/api/paybylink/notify`
    const returnUrlSuccess = `${baseUrl}/review?token=${token}&paid=1`

    const signature = paybylinkSignature(secretKey, [shopId, price, control, description, email, notifyURL, returnUrlSuccess])

    const pblRes = await fetch('https://secure.paybylink.pl/api/v1/transfer/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: Number(shopId),
        price: Number(price),
        control,
        description,
        email,
        notifyURL,
        returnUrlSuccess,
        signature,
      }),
    })

    const data = await pblRes.json().catch(() => ({}))
    if (!pblRes.ok || !data.url) {
      console.error('Paybylink generate error:', pblRes.status, data)
      return NextResponse.json({ error: 'Nie udało się wygenerować płatności' }, { status: 502 })
    }

    if (isSupabasePlaceholder()) {
      updateOrderByToken(token, { paybylink_transaction_id: data.transactionId })
    } else {
      await supabase.from('orders').update({ paybylink_transaction_id: data.transactionId }).eq('id', order.id)
    }

    return NextResponse.json({ url: data.url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
