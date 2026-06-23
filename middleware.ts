import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Chroń tylko /admin
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Sprawdź sesję z cookie
  const session = req.cookies.get('admin_session')?.value
  if (session === process.env.ADMIN_SESSION_SECRET) return NextResponse.next()

  // Przekieruj na stronę logowania
  return NextResponse.redirect(new URL('/login', req.url))
}

export const config = {
  matcher: ['/admin/:path*'],
}
