'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

/** Routine logout must be a deliberate POST action, not a GET page render. */
export async function logoutAdmin(): Promise<never> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw new Error('Could not complete admin logout. Please retry.')
  redirect('/admin/login')
}
