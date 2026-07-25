import fs from 'fs'
import path from 'path'

// Gdy RESEND_API_KEY jest placeholderem (praca lokalna bez konta Resend), maile nie są
// wysyłane naprawdę — zapisujemy je na dysk (.dev-emails/) i podglądamy przez /dev-emails.
// Usunąć razem z app/dev-emails i app/api/dev-emails, gdy podłączymy prawdziwy Resend.

const DEV_EMAILS_DIR = path.join(process.cwd(), '.dev-emails')

export function isResendPlaceholder(): boolean {
  const key = process.env.RESEND_API_KEY
  return !key || key.includes('placeholder')
}

type EmailPayload = {
  from: string
  to: string[]
  subject: string
  html: string
  reply_to?: string
  orderId?: string // do czego zamówienia należy ten mail — pozwala skasować podgląd razem ze zleceniem
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; json: () => Promise<unknown> }> {
  if (isResendPlaceholder()) {
    fs.mkdirSync(DEV_EMAILS_DIR, { recursive: true })
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    fs.writeFileSync(path.join(DEV_EMAILS_DIR, `${id}.html`), payload.html, 'utf-8')
    fs.writeFileSync(path.join(DEV_EMAILS_DIR, `${id}.json`), JSON.stringify({
      id, to: payload.to, from: payload.from, subject: payload.subject, createdAt: new Date().toISOString(),
      orderId: payload.orderId || null,
    }), 'utf-8')
    console.log(`[dev-email] zapisano podgląd "${payload.subject}" → ${payload.to.join(', ')} (zobacz na /dev-emails)`)
    return { ok: true, json: async () => ({ id, devPreview: true }) }
  }

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  })
}

// Kasuje wszystkie zapisane podglądy maili powiązane z danym zamówieniem (wywoływane przy
// usuwaniu zamówienia w panelu admina) — bez tego usunięte zlecenie zostawiałoby "osierocone"
// maile widoczne na /dev-emails.
export function deleteEmailsForOrder(orderId: string) {
  if (!fs.existsSync(DEV_EMAILS_DIR) || !orderId) return
  const files = fs.readdirSync(DEV_EMAILS_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    const filePath = path.join(DEV_EMAILS_DIR, f)
    try {
      const meta = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      if (meta.orderId === orderId) {
        fs.rmSync(filePath, { force: true })
        fs.rmSync(filePath.replace(/\.json$/, '.html'), { force: true })
      }
    } catch { /* pomiń uszkodzone/niepasujące pliki */ }
  }
}
