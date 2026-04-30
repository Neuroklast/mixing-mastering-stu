'use client'

import { useState } from 'react'
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

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-black/60 p-4"
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
    </div>
  )
}

export const CreditsSection = ({ credits }: CreditsSectionProps): JSX.Element => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit, i) => (
          <CreditCard key={credit.id ?? i} credit={credit} />
        ))}
      </div>
    )}
  </section>
)
