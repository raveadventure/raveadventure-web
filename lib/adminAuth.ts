// Sprawdzenie ciasteczka admin_session w API route'ach pod /api/admin/* — middleware.ts chroni
// tylko strony /admin/* (przekierowaniem), nie trasy API wywoływane przez fetch(), więc każdy
// endpoint server-side operujący na service-role kluczu musi sam zweryfikować to samo ciasteczko.
import { NextRequest } from 'next/server'

export function isAdminRequest(req: NextRequest): boolean {
  const session = req.cookies.get('admin_session')?.value
  return !!session && session === process.env.ADMIN_SESSION_SECRET
}
