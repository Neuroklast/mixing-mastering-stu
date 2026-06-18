import Link from 'next/link'
import { createAdminClient } from '@/lib/supabaseAdmin'

interface CountCard {
  label: string
  href: string
  newHref?: string
  count: number
  description: string
}

async function getCounts(): Promise<CountCard[]> {
  const supabase = createAdminClient()

  const tables = [
    { table: 'releases',          label: 'Releases',         href: '/admin/releases',         newHref: '/admin/releases/new',         description: 'Albums, EPs & singles' },
    { table: 'gigs',              label: 'Gigs',             href: '/admin/gigs',             newHref: '/admin/gigs/new',             description: 'Live shows & events' },
    { table: 'merchandise',       label: 'Merchandise',      href: '/admin/merchandise',      newHref: '/admin/merchandise/new',      description: 'Merch items' },
    { table: 'soundpacks',        label: 'Soundpacks',       href: '/admin/soundpacks',       newHref: '/admin/soundpacks/new',       description: 'Sample & sound packs' },
    { table: 'music_highlights',  label: 'Highlights',       href: '/admin/music-highlights', newHref: '/admin/music-highlights/new', description: 'Featured tracks' },
    { table: 'partners',          label: 'Partners',         href: '/admin/partners',         newHref: '/admin/partners/new',         description: 'Sponsors & partners' },
  ]

  const results = await Promise.all(
    tables.map(async ({ table, label, href, newHref, description }) => {
      const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
      return { label, href, newHref, count: count ?? 0, description }
    }),
  )

  return results
}

export default async function AdminDashboard() {
  const cards = await getCounts()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Overview of all content sections</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.href}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">{card.description}</p>
                <p className="text-3xl font-bold tabular-nums mt-1">{card.count}</p>
                <p className="text-sm text-zinc-300 font-medium mt-0.5">{card.label}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-auto pt-2 border-t border-zinc-800">
              <Link
                href={card.href}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                View all →
              </Link>
              {card.newHref && (
                <Link
                  href={card.newHref}
                  className="ml-auto text-xs bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded transition-colors font-medium"
                >
                  + New
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/bio" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors">
            Edit Bio
          </Link>
          <Link href="/admin/releases/new" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded text-sm font-medium transition-colors text-white">
            + Release
          </Link>
          <Link href="/admin/gigs/new" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors">
            + Gig
          </Link>
          <Link href="/admin/merchandise/new" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors">
            + Merch
          </Link>
          <Link href="/admin/site-config" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors">
            Site Config
          </Link>
        </div>
      </div>
    </div>
  )
}
