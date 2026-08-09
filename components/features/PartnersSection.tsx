'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Partner } from '@/lib/schemas/partner'
import {
  loadLogoImageForCanvas,
  processLogoToWhiteSilhouette,
} from '@/lib/partner-logo-white'

interface PartnersSectionProps {
  partners: Partner[]
}

/**
 * Partner / credit logo in white mode.
 * Canvas-processes the PNG so alpha is real (transparent stays transparent)
 * and baked white backgrounds are stripped.
 */
function PartnerLogoWhite({
  src,
  name,
  brightness,
}: {
  src: string
  name: string
  brightness: number
}): JSX.Element {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setFailed(false)
      setProcessedSrc(null)
      try {
        const img = await loadLogoImageForCanvas(src)
        if (cancelled) return

        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        if (!w || !h) throw new Error('empty logo')

        const maxDim = 512
        const scale = Math.min(1, maxDim / Math.max(w, h))
        const cw = Math.max(1, Math.round(w * scale))
        const ch = Math.max(1, Math.round(h * scale))

        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('no canvas')

        ctx.clearRect(0, 0, cw, ch)
        ctx.drawImage(img, 0, 0, cw, ch)
        const raw = ctx.getImageData(0, 0, cw, ch)
        const processed = processLogoToWhiteSilhouette(raw)
        const out = ctx.createImageData(processed.width, processed.height)
        out.data.set(processed.data)
        ctx.putImageData(out, 0, 0)

        const dataUrl = canvas.toDataURL('image/png')
        if (!cancelled) setProcessedSrc(dataUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [src])

  if (failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- processed/fallback external logos
      <motion.img
        src={src}
        alt={name}
        className="h-12 w-auto max-w-[8.5rem] object-contain opacity-80 md:h-16 md:max-w-[10rem]"
        style={{ opacity: brightness, filter: 'none', background: 'transparent' }}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: brightness, y: 0 }}
        whileHover={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        loading="lazy"
        decoding="async"
      />
    )
  }

  if (!processedSrc) {
    return (
      <span
        className="inline-block h-12 w-28 animate-pulse rounded-sm bg-secondary md:h-16 md:w-32"
        aria-label={name}
        role="img"
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- canvas data URL for white silhouette
    <motion.img
      src={processedSrc}
      alt={name}
      className="h-12 w-auto max-w-[8.5rem] object-contain md:h-16 md:max-w-[10rem]"
      style={{ opacity: brightness, background: 'transparent', filter: 'none' }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: brightness, y: 0 }}
      whileHover={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      decoding="async"
    />
  )
}

function PartnerLogo({ item }: { item: Partner }): JSX.Element {
  if (!item.logoUrl) {
    return (
      <motion.span
        className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {item.name}
      </motion.span>
    )
  }

  const useWhite = item.logoWhite !== false
  const brightness = 0.92

  if (useWhite) {
    return <PartnerLogoWhite src={item.logoUrl} name={item.name} brightness={brightness} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external partner logos
    <motion.img
      src={item.logoUrl}
      alt={item.name}
      className="h-12 w-auto max-w-[8.5rem] object-contain transition-opacity hover:opacity-100 md:h-16 md:max-w-[10rem]"
      style={{ opacity: brightness }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: brightness, y: 0 }}
      whileHover={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      loading="lazy"
      decoding="async"
    />
  )
}

function LogoGrid({ items, heading }: { items: Partner[]; heading: string }): JSX.Element | null {
  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {heading}
      </p>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => {
          const content = <PartnerLogo item={item} />
          const wrapperClassName =
            'flex min-h-28 items-center justify-center bg-transparent p-3 transition-opacity hover:opacity-100'

          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={wrapperClassName}
              aria-label={item.name}
            >
              {content}
            </a>
          ) : (
            <div key={item.id} className={wrapperClassName}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const PartnersSection = ({ partners }: PartnersSectionProps): JSX.Element => {
  const { credits, endorsements, partnersOnly } = useMemo(() => {
    const creditsList: Partner[] = []
    const endorsementsList: Partner[] = []
    const partnersList: Partner[] = []

    for (const p of partners) {
      if (p.category === 'credit') {
        creditsList.push(p)
      } else if (p.category === 'endorsement') {
        endorsementsList.push(p)
      } else {
        // partner | label | sponsor → Partners grid
        partnersList.push(p)
      }
    }

    return {
      credits: creditsList,
      endorsements: endorsementsList,
      partnersOnly: partnersList,
    }
  }, [partners])

  const hasAny = credits.length > 0 || endorsements.length > 0 || partnersOnly.length > 0

  return (
    <section
      id="partners"
      className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32"
    >
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-mono uppercase inline-block">
          Partners &amp; Endorsements
        </h2>
        <div className="h-0.5 w-16 bg-accent mt-2" />
      </div>

      {hasAny ? (
        <div className="space-y-12">
          <LogoGrid items={credits} heading="Credits" />
          <LogoGrid items={endorsements} heading="Endorsements" />
          <LogoGrid items={partnersOnly} heading="Partners" />
        </div>
      ) : (
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
          No partners available yet.
        </p>
      )}
    </section>
  )
}
