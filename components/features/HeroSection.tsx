'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase } from '@phosphor-icons/react'
import { ContactDialog } from '@/components/features/ContactDialog'
import { ServicesModal } from '@/components/features/ServicesModal'
import type { SiteContent } from '@/lib/schemas/siteContent'
import { SITE_CONTENT_DEFAULTS } from '@/lib/schemas/siteContent'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

// ── Targeting Brackets ────────────────────────────────────────────────────────
// Thin L-shaped corners that frame the AUDIO word instead of a solid box.
const TargetBrackets = ({ text }: { text: string }): JSX.Element => (
    <span className="inline-block relative px-5 py-1" aria-hidden="true">
    {/* top-left */}
    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent" />
    {/* top-right */}
    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-accent" />
    {/* bottom-left */}
    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-accent" />
    {/* bottom-right */}
    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent" />
    {/* Text */}
    <span className="relative text-accent text-glow-accent">
      {text}
    </span>
  </span>
)

// ── Technical data overlays ───────────────────────────────────────────────────
const TechOverlay = (): JSX.Element => (
  <>
    <span className="absolute top-8 left-4 md:left-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/10 pointer-events-none select-none">
      96KHZ / 24BIT
    </span>
    <span className="absolute top-8 right-4 md:right-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/10 pointer-events-none select-none">
      R128 COMPLIANT
    </span>
    <span className="absolute bottom-8 left-4 md:left-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/10 pointer-events-none select-none">
      ITU-R BS.1770-4
    </span>
    <span className="absolute bottom-8 right-4 md:right-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/10 pointer-events-none select-none">
      LUFS · DBFS · RMS
    </span>
  </>
)

interface HeroSectionProps {
  content?: SiteContent
}

export const HeroSection = ({ content = SITE_CONTENT_DEFAULTS }: HeroSectionProps): JSX.Element => {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')

  const handleServiceSelect = (serviceId: string): void => {
    setSelectedService(serviceId)
    setContactOpen(true)
    setServicesOpen(false)
  }

  return (
    <>
      {/*
       * Hero section wrapper – dark grid texture + deep red radial glow.
       * The grid is a repeating SVG-based CSS background drawn at very low opacity.
       * The glow is a centered radial gradient in a pseudo-element.
       */}
      <section
        className="relative container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-24 md:py-36 overflow-hidden"
      >
        {/* Dark grid texture */}
        <div className="absolute inset-0 pointer-events-none hero-grid" />

        {/* Deep red atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none hero-glow" />

        {/* Technical data overlays */}
        <TechOverlay />

        <div className="relative text-center">
          {/* Badge */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-block mb-8 px-4 py-1 font-mono text-xs uppercase tracking-[0.25em] border border-white/15 text-muted-foreground rounded-sm">
              {content.hero_badge ?? SITE_CONTENT_DEFAULTS.hero_badge}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl mb-8 leading-[0.95] tracking-tighter font-heading"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* First line – thin weight for lightness / precision feeling */}
            <span className="block text-white/90 font-light">
              {content.hero_title_1 ?? SITE_CONTENT_DEFAULTS.hero_title_1}
            </span>
            {/* Second line – targeting-bracket frame + chromatic aberration accent */}
            <span
              className="block my-2"
              style={{
                filter: 'drop-shadow(1px 0 0 rgba(217,72,72,0.5)) drop-shadow(-1px 0 0 rgba(72,128,217,0.3))',
              }}
            >
              <TargetBrackets text={content.hero_title_2 ?? SITE_CONTENT_DEFAULTS.hero_title_2} />
            </span>
            {/* Third line – extra bold for contrast and weight */}
            <span className="block text-white font-bold">
              {content.hero_title_3 ?? SITE_CONTENT_DEFAULTS.hero_title_3}
            </span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-[var(--color-muted-foreground)] mb-12 max-w-xl mx-auto font-mono leading-relaxed tracking-wide"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {content.hero_subtitle ?? SITE_CONTENT_DEFAULTS.hero_subtitle}
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Primary – glowing red block, scanline shimmer on hover */}
            <button
              className="group relative overflow-hidden font-mono uppercase tracking-[0.15em] text-sm px-10 py-4 bg-[var(--color-accent)] text-white rounded-sm
                         shadow-[0_0_30px_rgba(217,72,72,0.5),0_0_60px_rgba(217,72,72,0.2)]
                         hover:shadow-[0_0_40px_rgba(217,72,72,0.7),0_0_80px_rgba(217,72,72,0.35)]
                         active:translate-y-[2px] active:shadow-none
                         transition-all duration-150"
              onClick={() => setServicesOpen(true)}
            >
              {/* Scanline shimmer sweep */}
              <span
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                  animation: 'hero-scanline 0.6s linear',
                }}
              />
              <span className="relative flex items-center gap-2">
                <Briefcase className="h-4 w-4" weight="bold" />
                {content.hero_cta_primary ?? SITE_CONTENT_DEFAULTS.hero_cta_primary}
              </span>
            </button>

            {/* Secondary – ghost / arrow only */}
            <button
              className="group font-mono uppercase tracking-[0.15em] text-sm px-10 py-4 bg-transparent text-white/70
                         border border-white/20
                         hover:border-white/50 hover:text-white
                         active:translate-y-[2px]
                         transition-all duration-150 rounded-sm"
              onClick={() => setContactOpen(true)}
            >
              <span className="flex items-center gap-2">
                {content.hero_cta_secondary ?? SITE_CONTENT_DEFAULTS.hero_cta_secondary}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  weight="bold"
                />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      <ServicesModal
        open={servicesOpen}
        onOpenChange={setServicesOpen}
        onSelectPackage={handleServiceSelect}
      />
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultService={selectedService}
      />
    </>
  )
}
