import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { Toaster } from 'sonner'
import AdminNav from '@/app/admin/_components/AdminNav'

export const metadata = { title: 'Admin – SONORATIVA' }

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as { role?: string }).role !== 'admin') {
    redirect('/admin/login?error=forbidden')
  }

  return (
    <div style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <Toaster position="top-right" theme="dark" richColors />
      <AdminNav />
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  )
}
