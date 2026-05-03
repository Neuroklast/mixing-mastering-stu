'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  House,
  TextAlignLeft,
  Waveform,
  Images,
  Users,
  Briefcase,
  Star,
  Trophy,
  Scales,
  FolderOpen,
  SignOut,
  List,
  X,
} from '@phosphor-icons/react'

const NAV = [
  { href: '/admin',          label: 'Dashboard',   icon: House,        exact: true },
  { href: '/admin/content',  label: 'Content',     icon: TextAlignLeft },
  { href: '/admin/showcase', label: 'Showcase',    icon: Waveform },
  { href: '/admin/gallery',  label: 'Gallery',     icon: Images },
  { href: '/admin/members',  label: 'Members',     icon: Users },
  { href: '/admin/services', label: 'Services',    icon: Briefcase },
  { href: '/admin/reviews',  label: 'Reviews',     icon: Star },
  { href: '/admin/credits',  label: 'Credits',     icon: Trophy },
  { href: '/admin/legal',    label: 'Legal',       icon: Scales },
  { href: '/admin/media',    label: 'Media',       icon: FolderOpen },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const navLinks = (
    <nav className="flex flex-col gap-1 flex-1">
      {NAV.map((item) => {
        const active = isActive(item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={[
              'flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent',
            ].join(' ')}
          >
            <Icon weight={active ? 'fill' : 'regular'} className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-zinc-950 border-r border-zinc-800 min-h-screen sticky top-0 h-screen">
        <div className="p-4 border-b border-zinc-800">
          <span className="font-heading font-bold tracking-widest text-sm text-white uppercase">
            Sonorativa
          </span>
          <span className="ml-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Admin</span>
        </div>
        <div className="flex flex-col flex-1 p-3 overflow-y-auto">
          {navLinks}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              href="/admin/logout"
              className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 border border-transparent transition-colors"
            >
              <SignOut className="h-4 w-4 shrink-0" />
              Logout
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar + drawer ───────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <span className="font-heading font-bold tracking-widest text-sm text-white uppercase">
          Sonorativa <span className="text-zinc-500 text-[10px] font-mono">Admin</span>
        </span>
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
          className="text-zinc-400 hover:text-white p-1"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={[
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800',
          'transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-heading font-bold tracking-widest text-sm text-white uppercase">Admin</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col flex-1 p-3 overflow-y-auto">
          {navLinks}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              href="/admin/logout"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 border border-transparent transition-colors"
            >
              <SignOut className="h-4 w-4 shrink-0" />
              Logout
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
