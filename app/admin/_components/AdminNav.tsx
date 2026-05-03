'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/showcase', label: 'Showcase' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/credits', label: 'Credits' },
  { href: '/admin/legal', label: 'Legal' },
  { href: '/admin/media', label: 'Media' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 2rem',
        background: '#111',
        borderBottom: '1px solid #222',
        flexWrap: 'wrap',
      }}
    >
      {NAV.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: isActive ? '#fff' : '#aaa',
              textDecoration: 'none',
              fontSize: '0.9rem',
              borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
              paddingBottom: '2px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {item.label}
          </Link>
        )
      })}
      <Link
        href="/admin/logout"
        style={{
          marginLeft: 'auto',
          color: '#f87171',
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}
      >
        Logout
      </Link>
    </nav>
  )
}
