'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MusicNote } from '@phosphor-icons/react'
import { type Credit } from '@/lib/schemas/credits'
import { cn } from '@/lib/utils'

interface CreditsSectionProps {
  credits: Credit[]
}

interface CreditCardProps {
  credit: Credit
}

// ── CreditCard ─────────────────────────────────────────────────────────────────

const CreditCard = ({ credit }: CreditCardProps): JSX.Element => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative aspect-square rounded overflow-hidden bg-card border border-border cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {credit.coverImage?.url ? (
        <Image
          src={credit.coverImage.url}
          alt={credit.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary">
          <MusicNote weight="bold" className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      {/* Overlay: always visible on touch devices, hover-gated on desktop */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-black/60 p-4 [@media(hover:none)]:opacity-100"
          >
            <p className="font-bold text-foreground font-heading truncate">{credit.name}</p>
            {credit.year && (
              <p className="text-muted-foreground font-mono text-xs">{credit.year}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--color-accent)] text-white font-mono text-xs uppercase tracking-wider">
                {credit.role}
              </span>
              {credit.spotifyUrl && (
                <a
                  href={credit.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 rounded border border-green-500 text-green-400 font-mono text-xs hover:bg-green-500/10 transition-colors"
                >
                  Spotify
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile: always-visible overlay (touch devices have no hover) */}
      <div className="[@media(hover:hover)]:hidden absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-black/60 p-4">
        <p className="font-bold text-foreground font-heading truncate text-sm">{credit.name}</p>
        {credit.year && (
          <p className="text-muted-foreground font-mono text-xs">{credit.year}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[var(--color-accent)] text-white font-mono text-xs uppercase tracking-wider">
            {credit.role}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── LogoMarquee ────────────────────────────────────────────────────────────────

const LogoMarquee = ({ credits }: { credits: Credit[] }): JSX.Element => {
  // Duplicate items for seamless infinite loop
  const items = [...credits, ...credits]

  return (
    <div className="relative overflow-hidden py-3 mb-10 border-y border-border [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul
        className="flex gap-8 w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]"
        aria-hidden="true"
      >
        {items.map((credit, i) => (
          <li
            key={`${credit.id ?? credit.name}-${i}`}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap select-none flex items-center gap-2"
          >
            <span className="h-1 w-1 rounded-full bg-[var(--color-accent)] inline-block" />
            {credit.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Tab definitions ────────────────────────────────────────────────────────────

type TabValue = 'all' | 'mastering' | 'mixing' | 'remixes' | 'sound-design' | 'producing'

const TABS: { label: string; value: TabValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mastering', value: 'mastering' },
  { label: 'Mixing', value: 'mixing' },
  { label: 'Remixes', value: 'remixes' },
  { label: 'Producing', value: 'producing' },
]

// ── Filter helpers ─────────────────────────────────────────────────────────────

function filterByTab(credits: Credit[], tab: TabValue): Credit[] {
  if (tab === 'all') return credits
  return credits.filter((c) => c.role.toLowerCase().includes(tab.replace('-', ' ')))
}

function filterBySearch(credits: Credit[], query: string): Credit[] {
  if (!query.trim()) return credits
  const q = query.toLowerCase()
  return credits.filter((c) => c.name.toLowerCase().includes(q))
}

// ── FeaturedGrid ───────────────────────────────────────────────────────────────

const FeaturedGrid = ({ credits }: { credits: Credit[] }): JSX.Element | null => {
  if (credits.length === 0) return null

  return (
    <div className="mb-10">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Featured
      </p>
      {/* Desktop: 3-column grid */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit, i) => (
          <CreditCard key={credit.id ?? i} credit={credit} />
        ))}
      </div>
      {/* Mobile: horizontal snap slider */}
      <div className="flex sm:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scroll-smooth">
        {credits.map((credit, i) => (
          <div key={credit.id ?? i} className="snap-center flex-shrink-0 w-72">
            <CreditCard credit={credit} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CompactList ────────────────────────────────────────────────────────────────

const COMPACT_PAGE_SIZE = 10

const CompactList = ({ credits }: { credits: Credit[] }): JSX.Element | null => {
  const [expanded, setExpanded] = useState(false)

  if (credits.length === 0) return null

  const visible = expanded ? credits : credits.slice(0, COMPACT_PAGE_SIZE)

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
        All Credits
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
        {visible.map((credit, i) => (
          <div
            key={credit.id ?? i}
            className="flex items-center gap-2 py-2 border-b border-border/50 font-mono text-sm"
          >
            <span className="truncate text-foreground flex-1">{credit.name}</span>
            <span className="text-muted-foreground text-xs shrink-0">{credit.role}</span>
            {credit.year && (
              <span className="text-muted-foreground text-xs shrink-0">{credit.year}</span>
            )}
          </div>
        ))}
      </div>
      {credits.length > COMPACT_PAGE_SIZE && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-6 px-4 py-2.5 min-h-[44px] border border-border rounded font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${credits.length} credits`}
        </button>
      )}
    </div>
  )
}

// ── CreditsSection ─────────────────────────────────────────────────────────────

export const CreditsSection = ({ credits }: CreditsSectionProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return filterBySearch(filterByTab(credits, activeTab), searchQuery)
  }, [credits, activeTab, searchQuery])

  const featured = useMemo(() => filtered.filter((c) => c.featured === true), [filtered])
  const nonFeatured = useMemo(() => filtered.filter((c) => c.featured !== true), [filtered])

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          CREDITS
        </h2>
        <div className="h-0.5 w-16 bg-[var(--color-accent)] mt-2" />
      </div>

      {credits.length === 0 ? (
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
          No credits available yet.
        </p>
      ) : (
        <>
          {/* Marquee */}
          <LogoMarquee credits={credits} />

          {/* Tab bar */}
          <div className="flex gap-2 flex-wrap mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-2 min-h-[44px] rounded font-mono text-xs uppercase tracking-wider border transition-colors',
                  activeTab === tab.value
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'bg-transparent border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-8">
            <input
              type="search"
              placeholder="Search credits…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 min-h-[44px] rounded border border-border bg-secondary text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
              No credits found.
            </p>
          ) : (
            <>
              {/* Featured spotlight grid */}
              <FeaturedGrid credits={featured} />

              {/* Compact list */}
              <CompactList credits={nonFeatured} />
            </>
          )}
        </>
      )}
    </section>
  )
}

