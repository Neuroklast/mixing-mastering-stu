'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Medal } from '@phosphor-icons/react'
import { type Profile } from '@/types/profile'

interface ProfileSectionProps {
  profile: Profile
}

export const ProfileSection = ({ profile }: ProfileSectionProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const BIO_PREVIEW_LENGTH = 200

  const isLong = profile.bio.length > BIO_PREVIEW_LENGTH
  const bioPreview = isLong ? profile.bio.slice(0, BIO_PREVIEW_LENGTH) + '…' : profile.bio

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Portrait */}
        <div className="relative aspect-[3/4] rounded overflow-hidden bg-secondary border border-border">
          <Image
            src={profile.portraitSrc ?? '/placeholder-portrait.png'}
            alt={profile.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Bio */}
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-1">
            {profile.name}
          </h2>
          <p className="text-[var(--color-accent)] font-mono text-sm uppercase tracking-widest mb-6">
            {profile.title}
          </p>

          <div className="relative overflow-hidden">
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.p
                  key="full"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="text-muted-foreground leading-relaxed overflow-hidden"
                >
                  {profile.bio}
                </motion.p>
              ) : (
                <motion.p
                  key="preview"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="text-muted-foreground leading-relaxed overflow-hidden"
                >
                  {bioPreview}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-[var(--color-accent)] font-mono text-xs uppercase tracking-wider hover:underline transition-colors"
            >
              {expanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      </div>

      {/* Awards Strip */}
      {profile.awards.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-bold tracking-tight font-heading mb-6">Awards</h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {profile.awards.map((award, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex-shrink-0 flex flex-col items-center gap-2 bg-card border border-border rounded p-4 min-w-[120px]"
              >
                <Medal weight="bold" className="h-8 w-8 text-[var(--color-accent)]" />
                <p className="text-xs font-bold text-center text-foreground leading-tight">
                  {award.name}
                </p>
                <p className="text-xs font-mono text-muted-foreground">{award.year}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
