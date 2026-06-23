import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET

  if (username === validUser && password === validPass) {
    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_session', sessionSecret!, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 dni
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'Nieprawidłowy login lub hasło' }, { status: 401 })
}
