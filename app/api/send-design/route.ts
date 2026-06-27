import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const file = formData.get('design') as File
    const adminNote = (formData.get('note') as string) || ''

    if (!orderId || !file) {
      return NextResponse.json({ error: 'Brak danych' }, { status: 400 })
    }

    // 1. Upload grafiki do Supabase Storage
    // Timestamp w nazwie pliku = zawsze unikalny URL, brak problemów z cache
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg'
    const timestamp = Date.now()
    const fileName = `designs/${orderId}-${timestamp}.${safeExt}`

    const { error: uploadError } = await supabase.storage
      .from('order-photos')
      .upload(fileName, file, { upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Błąd uploadu: ' + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(fileName)
    // Dodaj cache-buster do URL żeby maile zawsze pokazywały świeżą grafikę
    const designUrl = urlData.publicUrl + `?v=${timestamp}`

    // 2. Generuj unikalny token do zatwierdzenia
    const token = crypto.randomBytes(32).toString('hex')

    // 3. Zapisz design_url, token i zmień status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ design_url: designUrl, review_token: token, status: 'approval' })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError || !order) {
      return NextResponse.json({ error: 'Błąd zapisu: ' + updateError?.message }, { status: 500 })
    }

    // 4. Wyślij email do klienta
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raveadventure.pl'
    const approveUrl = `${baseUrl}/review?token=${token}&action=approve`
    const rejectUrl = `${baseUrl}/review?token=${token}&action=reject`

    const emailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#13132a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #b44dff;text-align:center;">
    <h1 style="margin:0;font-size:26px;color:#f0eeff;font-weight:700;">Rave<span style="color:#b44dff;">Adventure</span></h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(240,238,255,0.5);">projekt Twojej karty gotowy</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#0e0e1a;padding:32px;">
    <p style="font-size:16px;color:#f0eeff;margin:0 0 8px;">Hej <strong>${order.name.split(' ')[0]}</strong>! 👋</p>
    <p style="font-size:15px;color:rgba(240,238,255,0.7);margin:0 0 ${adminNote ? "16px" : "28px"};line-height:1.7;">Przygotowaliśmy indywidualny projekt Twojej karty. Sprawdź jak wygląda i daj nam znać czy wszystko gra.</p>

    ${adminNote ? `
    <!-- NOTATKA OD NAS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;color:#f59e0b;letter-spacing:2px;font-family:monospace;">// wiadomosc od nas</p>
        <p style="margin:0;font-size:14px;color:#f0eeff;line-height:1.7;">${adminNote.split('\n').join('<br>')}</p>
      </td></tr>
    </table>
    ` : ''}

    <!-- PODGLĄD GRAFIKI -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#16162a;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#b44dff;letter-spacing:2px;font-family:monospace;">// podgląd projektu</p>
        <img src="${designUrl}" alt="Projekt karty" style="max-width:100%;border-radius:8px;border:1px solid rgba(180,77,255,0.3);" />
      </td></tr>
    </table>

    <!-- PRZYCISKI -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="48%" align="center" style="padding-right:8px;">
          <a href="${approveUrl}" style="display:block;background:#00e5a0;color:#0a0014;padding:16px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">
            ✓ Zatwierdzam projekt
          </a>
        </td>
        <td width="48%" align="center" style="padding-left:8px;">
          <a href="${rejectUrl}" style="display:block;background:transparent;color:#ff4d6d;padding:15px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;text-align:center;border:2px solid #ff4d6d;">
            ✗ Mam uwagi
          </a>
        </td>
      </tr>
    </table>

    <!-- INFO -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:16px 20px;">
      <tr><td>
        <p style="margin:0 0 6px;font-size:13px;color:#f0eeff;font-weight:600;">Co się stanie po kliknięciu?</p>
        <p style="margin:0;font-size:13px;color:rgba(240,238,255,0.6);line-height:1.6;">
          <strong style="color:#00e5a0;">Zatwierdzam</strong> — projekt trafia do druku, wyślemy Ci kartę w ciągu 3–5 dni roboczych.<br>
          <strong style="color:#ff4d6d;">Mam uwagi</strong> — możesz opisać co chcesz zmienić, a my przygotujemy poprawiony projekt.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#13132a;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#b44dff;">RaveAdventure</p>
    <p style="margin:0;font-size:12px;color:rgba(240,238,255,0.3);">raveadventure.pl · kontakt@raveadventure.pl</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: [order.email],
        reply_to: 'kontakt@raveadventure.pl',
        subject: '🎴 Twój projekt karty RaveAdventure — sprawdź i zatwierdź',
        html: emailHtml,
      }),
    })

    if (!emailRes.ok) {
      const emailErr = await emailRes.json()
      console.error('Email error:', emailErr)
      return NextResponse.json({ error: 'Błąd wysyłki maila' }, { status: 500 })
    }

    return NextResponse.json({ success: true, designUrl })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
