'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Briefcase } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ServicesSection } from '@/components/ServicesSection'
import { ContactDialog } from '@/components/ContactDialog'

export function HeroSection() {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setContactOpen(true)
    setServicesOpen(false)
  }

  return (
    <>
      <section className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/50 px-4 py-1 font-mono uppercase tracking-wider">
              Professional Audio Engineering
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-none tracking-tighter font-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            PRECISION
            <br />
            <span className="text-accent glow-accent">AUDIO</span>
            <br />
            MASTERY
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-mono"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Industrial-grade mixing and mastering services for the modern producer.
            Crafted with technical precision and creative vision.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider text-lg px-8 transition-all hover:scale-105 active:scale-95 glow-accent-strong"
              onClick={() => setServicesOpen(true)}
            >
              <Briefcase className="h-5 w-5 mr-2" weight="bold" />
              View Services
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10 font-mono uppercase tracking-wider text-lg px-8"
              onClick={() => setContactOpen(true)}
            >
              <Play className="h-5 w-5 mr-2" weight="fill" />
              Get Started
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services modal */}
      <AnimatePresence>
        {servicesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
            onClick={() => setServicesOpen(false)}
          >
            <div className="min-h-screen flex items-start justify-center p-4 pt-24">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-6xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-card border border-border rounded overflow-hidden p-8 md:p-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter font-heading">
                      SERVICE PACKAGES
                    </h2>
                    <p className="text-lg text-muted-foreground font-mono max-w-2xl mx-auto">
                      Professional audio engineering services with dedicated support.
                    </p>
                  </div>
                  <ServicesSection onSelectPackage={handleServiceSelect} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultService={selectedService}
      />
    </>
  )
}
