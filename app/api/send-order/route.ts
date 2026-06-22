import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, theme, address, phone, cardText, notes, orderId } = body

    const themeLabels: Record<string, string> = {
      techno: 'Techno',
      rave: 'Rave',
      festival: 'Festival',
      travel: 'Adventure',
    }
    const themeLabel = themeLabels[theme] || theme

    // ── EMAIL DO CIEBIE ──────────────────────────────────────────
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
          <p style="margin:0;font-size:11px;color:#b44dff;letter-spacing:3px;text-transform:uppercase;font-family:monospace;">// nowe zamówienie</p>
          <h1 style="margin:8px 0 0;font-size:24px;color:#f0eeff;font-weight:700;">RaveAdventure</h1>
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

    // ── EMAIL DO KLIENTA ─────────────────────────────────────────
    const clientEmailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:#13132a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #b44dff;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:#f0eeff;font-weight:700;">Rave<span style="color:#b44dff;">Adventure</span></h1>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(240,238,255,0.5);">personalizowane karty festiwalowe</p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#0e0e1a;padding:32px;">

          <!-- POTWIERDZENIE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <div style="width:64px;height:64px;background:#00e5a0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#0a0014;line-height:64px;text-align:center;">✓</div>
              <h2 style="margin:16px 0 8px;font-size:22px;color:#f0eeff;">Zamówienie przyjęte!</h2>
              <p style="margin:0;font-size:15px;color:rgba(240,238,255,0.6);line-height:1.6;">Hej <strong style="color:#f0eeff;">${name.split(' ')[0]}</strong>, dziękujemy za zamówienie.<br>Twoja karta jest już w kolejce do projektu.</p>
            </td></tr>
          </table>

          <!-- SZCZEGÓŁY -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:10px;overflow:hidden;margin-bottom:28px;">
            <tr><td colspan="2" style="padding:14px 20px;border-bottom:1px solid rgba(180,77,255,0.2);">
              <p style="margin:0;font-size:11px;color:#b44dff;letter-spacing:2px;font-family:monospace;">// twoje zamówienie</p>
            </td></tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);width:140px;border-bottom:1px solid rgba(255,255,255,0.05);">Motyw karty</td>
              <td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="background:rgba(180,77,255,0.15);color:#b44dff;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;">${themeLabel}</span></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);border-bottom:1px solid rgba(255,255,255,0.05);">Tekst na karcie</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;border-bottom:1px solid rgba(255,255,255,0.05);">${cardText || '—'}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:rgba(240,238,255,0.5);">Adres wysyłki</td>
              <td style="padding:12px 20px;font-size:13px;color:#f0eeff;">${address}</td>
            </tr>
          </table>

          <!-- CO DALEJ -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#f0eeff;">Co dalej?</p>
            </td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  { n: '01', t: 'Projekt w 24h', d: 'Przygotujemy indywidualny projekt Twojej karty i wyślemy go do zatwierdzenia.' },
                  { n: '02', t: 'Twoja akceptacja', d: 'Sprawdzasz projekt — jeśli coś nie gra, możesz prosić o poprawki.' },
                  { n: '03', t: 'Produkcja i wysyłka', d: 'Po akceptacji drukujemy kartę i wysyłamy. Czas: 3–5 dni roboczych.' },
                ].map(s => `
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

          <!-- CENA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16162a;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <tr>
              <td style="font-size:14px;color:rgba(240,238,255,0.5);">Do zapłaty</td>
              <td align="right" style="font-size:18px;font-weight:700;color:#00e5a0;">89 zł</td>
            </tr>
            <tr><td colspan="2" style="padding-top:8px;font-size:12px;color:rgba(240,238,255,0.3);">Płatność przelewem po zatwierdzeniu projektu. Dane do przelewu wyślemy razem z projektem.</td></tr>
          </table>

          <!-- KONTAKT -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:16px 20px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:rgba(240,238,255,0.7);">Masz pytania? Napisz do nas:</p>
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

    // Email do admina
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: ['michal.koch96@gmail.com'],
        reply_to: email,
        subject: `🎴 Nowe zamówienie — ${name} (${themeLabel})`,
        html: adminEmailHtml,
      }),
    })

    // Email do klienta
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'RaveAdventure <zamowienia@raveadventure.pl>',
        to: [email],
        reply_to: 'kontakt@raveadventure.pl',
        subject: `✅ Zamówienie przyjęte — Twoja karta RaveAdventure`,
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

