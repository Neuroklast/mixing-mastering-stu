'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { InstagramLogo, SoundcloudLogo, SpotifyLogo } from '@phosphor-icons/react'
import type { Member } from '@/lib/schemas/member'

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

interface MembersSectionProps {
  members: Member[]
}

export const MembersSection = ({ members }: MembersSectionProps): JSX.Element | null => {
  if (members.length === 0) return null

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, i) => (
          <MemberCard key={member.id ?? i} member={member} index={i} />
        ))}
      </div>
    </section>
  )
}
