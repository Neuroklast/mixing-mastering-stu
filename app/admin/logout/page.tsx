import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function LogoutPage() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
