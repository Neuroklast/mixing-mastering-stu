'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Briefcase } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContactDialog } from '@/components/features/ContactDialog'
import { ServicesModal } from '@/components/features/ServicesModal'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

export const HeroSection = (): JSX.Element => {
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
      <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 px-4 py-1 font-mono uppercase tracking-wider">
              Professional Audio Engineering
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-none tracking-tighter font-heading"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            PRECISION
            <br />
            <span className="text-[--accent] glow-accent">AUDIO</span>
            <br />
            MASTERY
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-[--muted-foreground] mb-10 max-w-2xl mx-auto font-mono"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Industrial-grade mixing and mastering for the modern producer.
            Crafted with technical precision and creative vision.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="font-mono uppercase tracking-wider text-lg px-8 transition-all hover:scale-105 active:scale-95 glow-accent-strong"
              onClick={() => setServicesOpen(true)}
            >
              <Briefcase className="h-5 w-5 mr-2" weight="bold" />
              View Services
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-mono uppercase tracking-wider text-lg px-8"
              onClick={() => setContactOpen(true)}
            >
              <Play className="h-5 w-5 mr-2" weight="fill" />
              Get Started
            </Button>
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
