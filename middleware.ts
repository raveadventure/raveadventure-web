import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Maintenance mode — blokuje wszystko poza /admin, /login, /maintenance
  const maintenance = process.env.NEXT_PUBLIC_MAINTENANCE === 'true'
  if (maintenance) {
    const allowed = ['/maintenance', '/admin', '/login', '/api']
    const isAllowed = allowed.some(p => pathname.startsWith(p))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  // Chroń /admin
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  const session = req.cookies.get('admin_session')?.value
  if (session === process.env.ADMIN_SESSION_SECRET) return NextResponse.next()
  return NextResponse.redirect(new URL('/login', req.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo_kwadrat.png).*)'],
}
