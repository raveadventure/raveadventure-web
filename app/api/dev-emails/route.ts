import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { deleteEmailsForOrder } from '../../../lib/devEmail'

const DEV_EMAILS_DIR = path.join(process.cwd(), '.dev-emails')

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  if (!fs.existsSync(DEV_EMAILS_DIR)) {
    return NextResponse.json({ emails: [] })
  }

  const files = fs.readdirSync(DEV_EMAILS_DIR).filter(f => f.endsWith('.json'))
  const emails = files
    .map(f => JSON.parse(fs.readFileSync(path.join(DEV_EMAILS_DIR, f), 'utf-8')))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return NextResponse.json({ emails })
}

// Kasuje podglądy maili powiązane z danym zamówieniem — wywoływane przy usuwaniu zamówienia
// w panelu admina, żeby nie zostawały "osierocone" maile po skasowanym zleceniu.
export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  deleteEmailsForOrder(orderId)
  return NextResponse.json({ ok: true })
}
