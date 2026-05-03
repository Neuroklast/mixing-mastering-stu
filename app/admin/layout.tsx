import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

export const metadata = { title: 'Admin – SONORATIVA' }

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/showcase', label: 'Showcase' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/credits', label: 'Credits' },
  { href: '/admin/legal', label: 'Legal' },
  { href: '/admin/media', label: 'Media' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#fff' }}>
        <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: '#111', borderBottom: '1px solid #222' }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem' }}>
              {item.label}
            </Link>
          ))}
          <Link href="/admin/logout" style={{ marginLeft: 'auto', color: '#f87171', textDecoration: 'none', fontSize: '0.9rem' }}>
            Logout
          </Link>
        </nav>
        <main style={{ padding: '2rem' }}>{children}</main>
      </body>
    </html>
  )
}
