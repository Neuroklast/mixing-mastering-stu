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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster position="top-right" theme="dark" richColors />
      <AdminNav />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Breadcrumb / email bar */}
        <header className="hidden md:flex items-center justify-end px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
          <span className="text-xs text-zinc-500 font-mono">{user.email}</span>
        </header>
        {/* pt-14 on mobile compensates for the sticky top nav bar (~48 px) */}
        <main className="flex-1 px-4 pt-14 pb-6 md:p-8 overflow-auto">{children}</main>
      </div>
      {/* Subtle CRT overlay — same phosphor flicker used on the public site */}
      <div className="crt-overlay" aria-hidden="true" />
    </div>
  )
}
