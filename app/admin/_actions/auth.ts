'use server'

import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) redirect('/admin/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as { role?: string }).role !== 'admin') {
      redirect('/admin/login?error=forbidden')
    }

    return user
  } catch (e) {
    // Next.js redirect() throws a special error — always rethrow it so the
    // redirect is honoured and the function does not swallow it.
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    console.error('[auth] requireAdmin check failed:', e)
    redirect('/admin/login')
  }
}
