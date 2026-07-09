import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, theme, address, phone, cardText, notes, orderId, totalPrice, lang: langRaw } = body
    const lang: 'pl' | 'en' = langRaw === 'en' ? 'en' : 'pl'

    const themeLabels: Record<string, { pl: string; en: string }> = {
      techno_rave: { pl: 'Techno / Rave', en: 'Techno / Rave' },
      festival: { pl: 'Festiwal', en: 'Festival' },
      adventure: { pl: 'Adventure / Travel', en: 'Adventure / Travel' },
      custom: { pl: 'Custom', en: 'Custom' },
    }
    const themeLabel = themeLabels[theme]?.[lang] || theme
    const price = totalPrice || 89

    // ── TEKSTY DWUJĘZYCZNE (mail do klienta) ──────────────────────
    const L = {
      pl: {
        htmlLang: 'pl',
        brandSub: 'personalizowane karty festiwalowe',
        greeting: (firstName: string) => `Hej <strong style="color:#f0eeff;">${firstName}</strong>, dziękujemy za zamówienie.<br>Twoja karta jest już w kolejce do projektu.`,
        confirmed: 'Zamówienie przyjęte!',
        orderDetailsEyebrow: '// twoje zamówienie',
        themeRow: 'Motyw karty',
        cardTextRow: 'Tekst na karcie',
        addressRow: 'Adres wysyłki',
        whatsNext: 'Co dalej?',
        steps: [
          { n: '01', t: 'Projekt w 24h', d: 'Przygotujemy indywidualny projekt Twojej karty i wyślemy go do zatwierdzenia.' },
          { n: '02', t: 'Twoja akceptacja', d: 'Sprawdzasz projekt — jeśli coś nie gra, możesz prosić o poprawki.' },
          { n: '03', t: 'Produkcja i wysyłka', d: 'Po akceptacji drukujemy kartę i wysyłamy. Czas: 3–5 dni roboczych.' },
        ],
        statusPrompt: 'Chcesz sprawdzić status zamówienia w dowolnym momencie?',
        statusBtn: 'Sprawdź status zamówienia →',
        statusNote: 'Link jest przypisany do Twojego zamówienia i zawsze aktualny.',
        toPay: 'Do zapłaty',
        paymentNote: 'Płatność przelewem po zatwierdzeniu projektu. Dane do przelewu wyślemy razem z projektem.',
        questions: 'Masz pytania? Napisz do nas:',
        subject: '✅ Zamówienie przyjęte — Twoja karta RaveAdventure',
      },
      en: {
        htmlLang: 'en',
        brandSub: 'personalized festival cards',
        greeting: (firstName: string) => `Hey <strong style="color:#f0eeff;">${firstName}</strong>, thanks for your order.<br>Your card is now in the design queue.`,
        confirmed: 'Order received!',
        orderDetailsEyebrow: '// your order',
        themeRow: 'Card theme',
        cardTextRow: 'Text on the card',
        addressRow: 'Shipping address',
        whatsNext: "What's next?",
        steps: [
          { n: '01', t: 'Design in 24h', d: "We'll prepare an individual design for your card and send it over for approval." },
          { n: '02', t: 'Your approval', d: "You review the design — if something's off, you can request changes." },
          { n: '03', t: 'Production & shipping', d: "Once approved, we print and ship your card. Time: 3–5 business days." },
        ],
        statusPrompt: 'Want to check your order status anytime?',
        statusBtn: 'Check order status →',
        statusNote: "This link is tied to your order and always up to date.",
        toPay: 'Total due',
        paymentNote: "Payment by bank transfer after the design is approved. We'll send payment details along with the design.",
        questions: 'Questions? Get in touch:',
        subject: '✅ Order received — Your RaveAdventure card',
      },
    }[lang]

    // ── EMAIL DO CIEBIE (zawsze PL, ze znacznikiem EN gdy dotyczy) ─
    const langBadge = lang === 'en'
      ? `<span style="background:rgba(0,240,255,0.15);color:#00f0ff;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;margin-left:8px;">🇬🇧 EN</span>`
      : ''

    const adminEmailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:#13132a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #b44dff;">
          <p style="margin:0;font-size:11px;color:#b44dff;letter-spacing:3px;text-transform:uppercase;font-family:monospace;">// nowe zamówienie${lang === 'en' ? ' · jęz. angielski' : ''}</p>
          <h1 style="margin:8px 0 0;font-size:24px;color:#f0eeff;font-weight:700;">RaveAdventure ${langBadge}</h1>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#0e0e1a;padding:32px;">
          <p style="margin:0 0 24px;font-size:16px;color:#f0eeff;">Masz nowe zlecenie! 🎉</p>

          <!-- ORDER DETAILS -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <tr><td colspan="2" style="padding:14px 20px;border-bottom:1px solid rgba(180,77,255,0.2);">
              <p style="margin:0;font-size:11px;color:#b44dff;letter-spacing:2px;font-family:monospace;">// szczegóły zamówienia</p>
            </td></tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);width:140px;border-bottom:1px solid rgba(255,255,255,0.05);">ID zamówienia</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.05);">${orderId || '—'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Motyw</td>
              <td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="background:rgba(180,77,255,0.15);color:#b44dff;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;">${themeLabel}</span></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Klient</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Email</td>
              <td style="padding:12px 20px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);"><a href="mailto:${email}" style="color:#00f0ff;text-decoration:none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Telefon</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;border-bottom:1px solid rgba(255,255,255,0.05);">${phone || '—'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Adres wysyłki</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;border-bottom:1px solid rgba(255,255,255,0.05);">${address}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Tekst na karcie</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;border-bottom:1px solid rgba(255,255,255,0.05);">${cardText || '—'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);">Uwagi</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;">${notes || '—'}</td>
            </tr>
          </table>

          ${lang === 'en' ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,240,255,0.06);border:1px solid rgba(0,240,255,0.25);border-radius:10px;padding:12px 16px;margin-bottom:24px;">
            <tr><td>
              <p style="margin:0;font-size:12px;color:#00f0ff;">🇬🇧 To zamówienie zostało złożone w wersji angielskiej strony. Pamiętaj, żeby wysłać projekt i wiadomość do klienta po angielsku.</p>
            </td></tr>
          </table>` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://supabase.com/dashboard/project/jhdakluuhjnuyrgxqgxg/editor" 
                style="display:inline-block;background:#b44dff;color:#0a0014;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
                Otwórz zlecenie w Supabase →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#13132a;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(240,238,255,0.3);">RaveAdventure · zamowienia@raveadventure.pl</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    // ── EMAIL DO KLIENTA (PL lub EN wg lang) ──────────────────────
    const clientEmailHtml = `
<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:#13132a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #b44dff;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:#f0eeff;font-weight:700;">Rave<span style="color:#b44dff;">Adventure</span></h1>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(240,238,255,0.5);">${L.brandSub}</p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#0e0e1a;padding:32px;">

          <!-- POTWIERDZENIE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <div style="width:64px;height:64px;background:#00e5a0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#0a0014;line-height:64px;text-align:center;">✓</div>
              <h2 style="margin:16px 0 8px;font-size:22px;color:#f0eeff;">${L.confirmed}</h2>
              <p style="margin:0;font-size:15px;color:rgba(240,238,255,0.6);line-height:1.6;">${L.greeting(name.split(' ')[0])}</p>
            </td></tr>
          </table>

          <!-- SZCZEGÓŁY -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:10px;overflow:hidden;margin-bottom:28px;">
            <tr><td colspan="2" style="padding:14px 20px;border-bottom:1px solid rgba(180,77,255,0.2);">
              <p style="margin:0;font-size:11px;color:#b44dff;letter-spacing:2px;font-family:monospace;">${L.orderDetailsEyebrow}</p>
            </td></tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);width:140px;border-bottom:1px solid rgba(255,255,255,0.05);">${L.themeRow}</td>
              <td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="background:rgba(180,77,255,0.15);color:#b44dff;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;">${themeLabel}</span></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">${L.cardTextRow}</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;border-bottom:1px solid rgba(255,255,255,0.05);">${cardText || '—'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);">${L.addressRow}</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;">${address}</td>
            </tr>
          </table>

          <!-- CO DALEJ -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#f0eeff;">${L.whatsNext}</p>
            </td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${L.steps.map(s => `
                <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:36px;height:36px;background:rgba(180,77,255,0.15);border-radius:50%;text-align:center;vertical-align:middle;font-family:monospace;font-size:11px;color:#b44dff;font-weight:700;">${s.n}</td>
                    <td style="padding-left:14px;">
                      <p style="margin:0;font-size:13px;font-weight:600;color:#f0eeff;">${s.t}</p>
                      <p style="margin:3px 0 0;font-size:12px;color:rgba(240,238,255,0.5);">${s.d}</p>
                    </td>
                  </tr></table>
                </td></tr>`).join('')}
              </table>
            </td></tr>
          </table>

          <!-- STATUS LINK -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(180,77,255,0.06);border:1px solid rgba(180,77,255,0.2);border-radius:10px;padding:16px 20px;margin-bottom:16px;">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 12px;font-size:13px;color:rgba(240,238,255,0.6);">${L.statusPrompt}</p>
              <a href="https://raveadventure.pl/status?token=${orderId}" style="display:inline-block;background:#b44dff;color:#0a0014;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
                ${L.statusBtn}
              </a>
              <p style="margin:10px 0 0;font-size:11px;color:rgba(240,238,255,0.3);">${L.statusNote}</p>
            </td></tr>
          </table>

          <!-- CENA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <tr>
              <td style="font-size:14px;color:rgba(240,238,255,0.5);">${L.toPay}</td>
              <td align="right" style="font-size:18px;font-weight:700;color:#00e5a0;">${price} zł</td>
            </tr>
            <tr><td colspan="2" style="padding-top:8px;font-size:12px;color:rgba(240,238,255,0.3);">${L.paymentNote}</td></tr>
          </table>

          <!-- KONTAKT -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:16px 20px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:rgba(240,238,255,0.7);">${L.questions}</p>
              <a href="mailto:kontakt@raveadventure.pl" style="color:#00f0ff;font-size:14px;font-weight:600;text-decoration:none;">kontakt@raveadventure.pl</a>
            </td></tr>
          </table>

        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#13132a;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#b44dff;">RaveAdventure</p>
          <p style="margin:0;font-size:12px;color:rgba(240,238,255,0.3);">raveadventure.pl · kontakt@raveadventure.pl</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    // ── WYSYŁKA PRZEZ RESEND ─────────────────────────────────────
    const resendApiKey = process.env.RESEND_API_KEY

    const adminSubjectPrefix = lang === 'en' ? '🇬🇧 ' : ''
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: ['michal.koch96@gmail.com'],
        reply_to: email,
        subject: `${adminSubjectPrefix}🎴 Nowe zamówienie — ${name} (${themeLabel})`,
        html: adminEmailHtml,
      }),
    })

    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: [email],
        reply_to: 'kontakt@raveadventure.pl',
        subject: L.subject,
        html: clientEmailHtml,
      }),
    })

    const adminData = await adminRes.json()
    const clientData = await clientRes.json()

    if (!adminRes.ok || !clientRes.ok) {
      console.error('Resend error:', adminData, clientData)
      return NextResponse.json({ error: 'Email error', adminData, clientData }, { status: 500 })
    }

    return NextResponse.json({ success: true, adminData, clientData })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
