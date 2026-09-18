import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

const RESET_PATH = '/auth/reset-password'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const callbackError = searchParams.get('error_description') ?? searchParams.get('error')

  const requestedNext = searchParams.get('next') ?? RESET_PATH
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : RESET_PATH

  if (!code || callbackError) {
    return NextResponse.redirect(new URL(`${RESET_PATH}?error=invalid_link`, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth] recovery code exchange failed:', error.message)
    return NextResponse.redirect(new URL(`${RESET_PATH}?error=invalid_link`, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
