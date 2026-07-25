import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DEV_EMAILS_DIR = path.join(process.cwd(), '.dev-emails')
const ID_PATTERN = /^[a-z0-9-]+$/i

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  if (!ID_PATTERN.test(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const filePath = path.join(DEV_EMAILS_DIR, `${params.id}.html`)
  if (!filePath.startsWith(DEV_EMAILS_DIR) || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const html = fs.readFileSync(filePath, 'utf-8')
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
