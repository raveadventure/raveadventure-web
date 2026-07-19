import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── DANE DO PŁATNOŚCI — PODMIEŃ NA SWOJE ──────────────────────
const BLIK_PHONE = '[785259525]'
const BANK_ACCOUNT = '[91102033520000110201566306]'
const BANK_RECIPIENT = '[MICHAŁ KOCH]'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, designUrl, designBackUrl, designOriginalUrl, designBackOriginalUrl, note } = body
    const adminNote = note || ''

    if (!orderId || !designUrl) {
      return NextResponse.json({ error: 'Brak danych' }, { status: 400 })
    }

    // Pliki są już wgrane do Storage bezpośrednio z przeglądarki (patrz panel admina) —
    // tutaj tylko zapisujemy linki, generujemy token i wysyłamy maila.

    // 1. Generuj unikalny token do zatwierdzenia
    const token = crypto.randomBytes(32).toString('hex')

    // 2. Zapisz design_url, token i zmień status — pobierz też lang zamówienia
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        design_url: designUrl,
        design_back_url: designBackUrl || null,
        design_original_url: designOriginalUrl || null,
        design_back_original_url: designBackOriginalUrl || null,
        review_token: token,
        status: 'approval',
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError || !order) {
      return NextResponse.json({ error: 'Błąd zapisu: ' + updateError?.message }, { status: 500 })
    }

    const lang: 'pl' | 'en' = order.lang === 'en' ? 'en' : 'pl'

    // ── TEKSTY DWUJĘZYCZNE ─────────────────────────────────────
    const L = {
      pl: {
        htmlLang: 'pl',
        brandSub: 'projekt Twojej karty gotowy',
        hey: (firstName: string) => `Hej <strong>${firstName}</strong>! 👋`,
        intro: 'Przygotowaliśmy indywidualny projekt Twojej karty. Sprawdź jak wygląda i daj nam znać czy wszystko gra.',
        noteEyebrow: '// wiadomosc od nas',
        previewEyebrow: '// podgląd projektu',
        backEyebrow: '// tył karty',
        cardTypePvc: 'Karta PVC',
        cardTypeLaminated: 'Wizytówka (100 szt.)',
        nfcActiveText: '📲 z programowaniem NFC/RFID',
        approveBtn: '✓ Zatwierdzam projekt',
        rejectBtn: '✗ Mam uwagi',
        infoTitle: 'Co się stanie po kliknięciu?',
        infoApprove: 'Zatwierdzam',
        infoApproveDesc: 'projekt czeka na Twoją płatność — po jej zaksięgowaniu przekazujemy kartę do druku i wysyłamy w ciągu 3–5 dni roboczych.',
        infoReject: 'Mam uwagi',
        infoRejectDesc: 'możesz opisać co chcesz zmienić, a my przygotujemy poprawiony projekt.',
        statusPrompt: 'Chcesz sprawdzić status zamówienia?',
        statusBtn: 'Sprawdź status zamówienia →',
        subject: '🎴 Twój projekt karty RaveAdventure — sprawdź i zatwierdź',
        paymentEyebrow: '// dane do płatności',
        paymentIntro: 'Jeśli projekt Ci się podoba i klikniesz "Zatwierdzam", prosimy o dokonanie płatności jedną z poniższych metod:',
        paymentTitleImportant: 'Ważne',
        paymentTitleCode: 'W tytule przelewu / opisie BLIK koniecznie podaj numer zamówienia:',
        blikLabel: 'Opcja 1 — BLIK na numer telefonu',
        bankLabel: 'Opcja 2 — Przelew tradycyjny',
        bankAccountLabel: 'Numer konta',
        bankRecipientLabel: 'Odbiorca',
        amountLabel: 'Kwota',
      },
      en: {
        htmlLang: 'en',
        brandSub: 'your card design is ready',
        hey: (firstName: string) => `Hey <strong>${firstName}</strong>! 👋`,
        intro: "We've prepared an individual design for your card. Take a look and let us know if everything looks good.",
        noteEyebrow: '// a note from us',
        previewEyebrow: '// design preview',
        backEyebrow: '// card back',
        cardTypePvc: 'PVC Card',
        cardTypeLaminated: 'Business Card (100 pcs)',
        nfcActiveText: '📲 with NFC/RFID programming',
        approveBtn: '✓ Approve design',
        rejectBtn: '✗ I have feedback',
        infoTitle: 'What happens after you click?',
        infoApprove: 'Approve',
        infoApproveDesc: "the design goes to payment — once we receive it, we'll print and ship your card within 3–5 business days.",
        infoReject: 'I have feedback',
        infoRejectDesc: "you can describe what you'd like changed, and we'll prepare a revised design.",
        statusPrompt: 'Want to check your order status?',
        statusBtn: 'Check order status →',
        subject: '🎴 Your RaveAdventure card design — review and approve',
        paymentEyebrow: '// payment details',
        paymentIntro: 'If you like the design and click "Approve design", please complete the payment using one of the methods below:',
        paymentTitleImportant: 'Important',
        paymentTitleCode: 'Please include the order number in the transfer title / BLIK description:',
        blikLabel: 'Option 1 — BLIK to phone number',
        bankLabel: 'Option 2 — Bank transfer',
        bankAccountLabel: 'Account number',
        bankRecipientLabel: 'Recipient',
        amountLabel: 'Amount',
      },
    }[lang]

    // Typ karty + NFC — dane już mamy w `order` (select('*') przy update wyżej)
    const cardTypeLabel = order.card_type === 'laminated' ? L.cardTypeLaminated : L.cardTypePvc
    const nfcBadge = order.nfc_enabled
      ? `<span style="background:rgba(0,229,160,0.15);color:#00e5a0;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;margin-left:6px;">${L.nfcActiveText}</span>`
      : ''

    // 4. Wyślij email do klienta
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raveadventure.pl'
    const approveUrl = `${baseUrl}/review?token=${token}&action=approve`
    const rejectUrl = `${baseUrl}/review?token=${token}&action=reject`

    const emailHtml = `
<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#13132a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #b44dff;text-align:center;">
    <h1 style="margin:0;font-size:26px;color:#f0eeff;font-weight:700;">Rave<span style="color:#b44dff;">Adventure</span></h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(240,238,255,0.5);">${L.brandSub}</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#0e0e1a;padding:32px;">
    <p style="font-size:16px;color:#f0eeff;margin:0 0 8px;">${L.hey(order.name.split(' ')[0])}</p>
    <p style="font-size:15px;color:rgba(240,238,255,0.7);margin:0 0 14px;line-height:1.7;">${L.intro}</p>

    <!-- TYP KARTY / NFC -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${adminNote ? "16px" : "28px"};">
      <tr><td>
        <span style="background:rgba(180,77,255,0.15);color:#b44dff;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;">${cardTypeLabel}</span>${nfcBadge}
      </td></tr>
    </table>

    ${adminNote ? `
    <!-- NOTATKA OD NAS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;color:#f59e0b;letter-spacing:2px;font-family:monospace;">${L.noteEyebrow}</p>
        <p style="margin:0;font-size:14px;color:#f0eeff;line-height:1.7;">${adminNote.split('\n').join('<br>')}</p>
      </td></tr>
    </table>
    ` : ''}

    <!-- PODGLĄD GRAFIKI -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#16162a;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#b44dff;letter-spacing:2px;font-family:monospace;">${L.previewEyebrow}</p>
        <img src="${designUrl}" alt="Card design" style="max-width:100%;border-radius:8px;border:1px solid rgba(180,77,255,0.3);" />
      </td></tr>
    </table>

    ${designBackUrl ? `
    <!-- PODGLĄD TYŁU KARTY -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td style="background:#16162a;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#00f0ff;letter-spacing:2px;font-family:monospace;">${L.backEyebrow}</p>
        <img src="${designBackUrl}" alt="Card back" style="max-width:100%;border-radius:8px;border:1px solid rgba(0,240,255,0.3);" />
      </td></tr>
    </table>
    ` : ''}

    <!-- PRZYCISKI -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="48%" align="center" style="padding-right:8px;">
          <a href="${approveUrl}" style="display:block;background:#00e5a0;color:#0a0014;padding:16px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">
            ${L.approveBtn}
          </a>
        </td>
        <td width="48%" align="center" style="padding-left:8px;">
          <a href="${rejectUrl}" style="display:block;background:transparent;color:#ff4d6d;padding:15px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;text-align:center;border:2px solid #ff4d6d;">
            ${L.rejectBtn}
          </a>
        </td>
      </tr>
    </table>

    <!-- INFO -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:16px 20px;margin-bottom:16px;">
      <tr><td>
        <p style="margin:0 0 6px;font-size:13px;color:#f0eeff;font-weight:600;">${L.infoTitle}</p>
        <p style="margin:0;font-size:13px;color:rgba(240,238,255,0.6);line-height:1.6;">
          <strong style="color:#00e5a0;">${L.infoApprove}</strong> — ${L.infoApproveDesc}<br>
          <strong style="color:#ff4d6d;">${L.infoReject}</strong> — ${L.infoRejectDesc}
        </p>
      </td></tr>
    </table>

    <!-- DANE DO PŁATNOŚCI -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;color:#ec4899;letter-spacing:2px;font-family:monospace;">${L.paymentEyebrow}</p>
        <p style="margin:0 0 16px;font-size:13px;color:rgba(240,238,255,0.7);line-height:1.6;">${L.paymentIntro}</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,77,109,0.06);border:1px solid rgba(255,77,109,0.25);border-radius:8px;padding:12px 16px;margin-bottom:16px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:12px;color:#ff4d6d;font-weight:700;">⚠ ${L.paymentTitleImportant}</p>
            <p style="margin:0 0 6px;font-size:12px;color:#f0eeff;">${L.paymentTitleCode}</p>
            <p style="margin:0;font-size:16px;color:#ff4d6d;font-weight:700;font-family:monospace;letter-spacing:2px;">${order.id.slice(0, 8).toUpperCase()}</p>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr><td style="background:rgba(180,77,255,0.06);border:1px solid rgba(180,77,255,0.2);border-radius:8px;padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:13px;color:#b44dff;font-weight:700;">📱 ${L.blikLabel}</p>
            <p style="margin:0 0 4px;font-size:18px;color:#f0eeff;font-weight:700;font-family:monospace;">${BLIK_PHONE}</p>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr><td style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.2);border-radius:8px;padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:13px;color:#00f0ff;font-weight:700;">🏦 ${L.bankLabel}</p>
            <p style="margin:0 0 3px;font-size:11px;color:rgba(240,238,255,0.5);">${L.bankAccountLabel}</p>
            <p style="margin:0 0 8px;font-size:16px;color:#f0eeff;font-weight:700;font-family:monospace;">${BANK_ACCOUNT}</p>
            <p style="margin:0 0 3px;font-size:11px;color:rgba(240,238,255,0.5);">${L.bankRecipientLabel}</p>
            <p style="margin:0;font-size:14px;color:#f0eeff;font-weight:600;">${BANK_RECIPIENT}</p>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:rgba(240,238,255,0.5);">${L.amountLabel}</td>
            <td align="right" style="font-size:18px;font-weight:700;color:#00e5a0;">${order.total_price ? order.total_price + ' zł' : '—'}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- STATUS LINK -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(180,77,255,0.06);border:1px solid rgba(180,77,255,0.2);border-radius:10px;padding:14px 20px;text-align:center;">
      <tr><td>
        <p style="margin:0 0 10px;font-size:12px;color:rgba(240,238,255,0.5);">${L.statusPrompt}</p>
        <a href="${baseUrl}/status?token=${order.id}" style="display:inline-block;color:#b44dff;font-size:13px;font-weight:600;text-decoration:none;border:1px solid rgba(180,77,255,0.4);padding:8px 20px;border-radius:6px;">
          ${L.statusBtn}
        </a>
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
        subject: L.subject,
        html: emailHtml,
      }),
    })

    if (!emailRes.ok) {
      const emailErr = await emailRes.json()
      console.error('Email error:', emailErr)
      return NextResponse.json({ error: 'Błąd wysyłki maila' }, { status: 500 })
    }

    return NextResponse.json({ success: true, designUrl, designBackUrl, designOriginalUrl, designBackOriginalUrl })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
