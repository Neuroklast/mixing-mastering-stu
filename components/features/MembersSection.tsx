'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { InstagramLogo, SoundcloudLogo, SpotifyLogo } from '@phosphor-icons/react'
import type { Member } from '@/lib/schemas/member'

// ── MemberFeature – full-width portrait + bio for a "featured" engineer ──────

interface MemberFeatureProps {
  member: Member
  index: number
}

const MemberFeature = ({ member, index }: MemberFeatureProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const BIO_PREVIEW_LENGTH = 200
  const bio = member.bio ?? ''
  const isLong = bio.length > BIO_PREVIEW_LENGTH
  const bioPreview = isLong ? bio.slice(0, BIO_PREVIEW_LENGTH) + '…' : bio
  const social = member.social_links ?? {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-20"
    >
      {/* Portrait */}
      <div className="relative aspect-[3/4] rounded overflow-hidden bg-secondary border border-border">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No Portrait
            </span>
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <h3 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase mb-1">
          {member.name}
        </h3>
        <p className="text-accent font-mono text-sm uppercase tracking-widest mb-6">
          {member.role}
        </p>

        {bio && (
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
                  {bio}
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

            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-accent font-mono text-xs uppercase tracking-wider hover:underline transition-colors"
              >
                {expanded ? 'Show Less' : 'Read More'}
              </button>
            )}
          </div>
        )}

        {/* Social icons */}
        {(social.instagram || social.soundcloud || social.spotify) && (
          <div className="flex gap-3 mt-6">
            {social.instagram && (
              <a
                href={String(social.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label={`${member.name} on Instagram`}
              >
                <InstagramLogo className="h-5 w-5" weight="fill" />
              </a>
            )}
            {social.soundcloud && (
              <a
                href={String(social.soundcloud)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label={`${member.name} on SoundCloud`}
              >
                <SoundcloudLogo className="h-5 w-5" weight="fill" />
              </a>
            )}
            {social.spotify && (
              <a
                href={String(social.spotify)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label={`${member.name} on Spotify`}
              >
                <SpotifyLogo className="h-5 w-5" weight="fill" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── MemberCard – compact card for grid layout ────────────────────────────────

interface MemberCardProps {
  member: Member
  index: number
}

const MemberCard = ({ member, index }: MemberCardProps): JSX.Element => {
  const social = member.social_links ?? {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-secondary/30 border border-border rounded p-6 flex flex-col items-center text-center"
    >
      {/* Photo */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border border-border mb-4 flex-shrink-0">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="text-lg font-bold tracking-tight font-heading mb-1">{member.name}</h3>
      <p className="text-accent font-mono text-xs uppercase tracking-widest mb-3">{member.role}</p>

      {member.bio && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {member.bio}
        </p>
      )}

      {/* Social icons */}
      {(social.instagram || social.soundcloud || social.spotify) && (
        <div className="flex gap-3 mt-auto pt-2">
          {social.instagram && (
            <a
              href={String(social.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label={`${member.name} on Instagram`}
            >
              <InstagramLogo className="h-5 w-5" weight="fill" />
            </a>
          )}
          {social.soundcloud && (
            <a
              href={String(social.soundcloud)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label={`${member.name} on SoundCloud`}
            >
              <SoundcloudLogo className="h-5 w-5" weight="fill" />
            </a>
          )}
          {social.spotify && (
            <a
              href={String(social.spotify)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label={`${member.name} on Spotify`}
            >
              <SpotifyLogo className="h-5 w-5" weight="fill" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── MembersSection ────────────────────────────────────────────────────────────

interface MembersSectionProps {
  members: Member[]
}

export const MembersSection = ({ members }: MembersSectionProps): JSX.Element | null => {
  if (members.length === 0) return null

  const featuredMembers = members.filter((m) => m.featured)
  const regularMembers = members.filter((m) => !m.featured)

  return (
    <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading uppercase mb-3">
          The Team
        </h2>
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          Engineers behind the sound
        </p>
      </motion.div>

      {/* Featured members – full-width portrait + bio */}
      {featuredMembers.map((member, i) => (
        <MemberFeature key={member.id ?? i} member={member} index={i} />
      ))}

      {/* Regular members – card grid */}
      {regularMembers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularMembers.map((member, i) => (
            <MemberCard key={member.id ?? i} member={member} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
