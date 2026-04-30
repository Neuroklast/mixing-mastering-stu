'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waveform, List, Envelope } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ServicesSection } from '@/components/ServicesSection'
import { ContactDialog } from '@/components/ContactDialog'

type ModalView = 'none' | 'demo' | 'services' | 'about'

export function Navbar() {
  const [modalView, setModalView] = useState<ModalView>('none')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')

  const openModal = (view: ModalView) => {
    setModalView(view)
    setMobileMenuOpen(false)
  }

  const closeModal = () => setModalView('none')

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setContactOpen(true)
    setModalView('none')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Waveform className="h-6 w-6 text-accent" weight="bold" />
              <span className="font-bold text-xl tracking-tighter font-heading">SONORATIVA</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {(['demo', 'services', 'about'] as ModalView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => openModal(view)}
                  className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors"
                >
                  {view}
                </button>
              ))}
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider"
                onClick={() => setContactOpen(true)}
              >
                <Envelope className="h-4 w-4 mr-2" weight="bold" />
                Contact
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <List className="h-6 w-6 text-accent" weight="bold" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card"
            >
              <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
                {(['demo', 'services', 'about'] as ModalView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => openModal(view)}
                    className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors text-left"
                  >
                    {view}
                  </button>
                ))}
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider w-full"
                  onClick={() => {
                    setContactOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <Envelope className="h-4 w-4 mr-2" weight="bold" />
                  Contact
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Modal overlay */}
      <AnimatePresence>
        {modalView !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
            onClick={closeModal}
          >
            <div className="min-h-screen flex items-start justify-center p-4 pt-24">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-6xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full bg-background/50 backdrop-blur-sm border-border hover:border-accent hover:bg-accent/10"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span className="text-lg font-bold">✕</span>
                  </Button>
                </div>

                <div className="bg-card border border-border rounded overflow-hidden">
                  {modalView === 'demo' && <DemoSection />}
                  {modalView === 'services' && (
                    <div className="p-8 md:p-12">
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
                  )}
                  {modalView === 'about' && <AboutSection onContact={() => { setContactOpen(true); closeModal() }} />}
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

/* ── Inline sub-sections ── */

function DemoSection() {
  // Synthetic audio blobs so the demo works without real files
  const demoTracks = generateDemoTracks()

  return (
    <div className="p-8 md:p-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter font-heading">
        BEFORE &amp; AFTER COMPARISON
      </h2>
      <p className="text-lg text-muted-foreground mb-8 font-mono">
        Experience the transformation with real-time A/B comparison.
      </p>
      <div className="space-y-8">
        {demoTracks.map((track) => (
          <AudioPlayer key={track.id} tracks={track.tracks} title={track.title} artist={track.artist} />
        ))}
      </div>
    </div>
  )
}

function AboutSection({ onContact }: { onContact: () => void }) {
  return (
    <div className="p-8 md:p-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 tracking-tighter font-heading">
        ABOUT THE STUDIO
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {[
          {
            title: 'Experience',
            body: 'Over 10 years of professional audio engineering experience, working with artists across multiple genres. Specialized in modern production techniques and analog warmth.',
          },
          {
            title: 'Equipment',
            body: 'Hybrid analog/digital workflow featuring industry-standard converters, premium plugins, and carefully calibrated monitoring in an acoustically treated environment.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="bg-secondary/30 border border-border rounded p-6">
            <h3 className="text-xl font-bold mb-4 text-accent uppercase tracking-wider font-mono">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <hr className="border-border my-12" />

      <div className="text-center">
        <h3 className="text-2xl font-bold mb-8 uppercase tracking-wider font-mono">
          Why Choose Us?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { stat: '48H', label: 'Average Turnaround' },
            { stat: '500+', label: 'Tracks Mastered' },
            { stat: '100%', label: 'Client Satisfaction' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div className="text-5xl font-bold text-accent mb-2 tracking-tighter">{stat}</div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
            </div>
          ))}
        </div>
        <Button
          size="lg"
          className="bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider px-10"
          onClick={onContact}
        >
          Start Your Project
        </Button>
      </div>
    </div>
  )
}

/* ── helpers ── */

function generateSynthWave(freq: number, duration: number, sampleRate: number) {
  const samples = duration * sampleRate
  const buffer = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.3
  }
  return buffer
}

function createAudioDataURL(frequency: number): string {
  const sampleRate = 44100
  const duration = 30
  const buffer = generateSynthWave(frequency, duration, sampleRate)

  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + buffer.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, buffer.length * 2, true)

  const wavData = new Int16Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    wavData[i] = Math.max(-32768, Math.min(32767, buffer[i] * 32767))
  }

  const blob = new Blob([wavHeader, wavData], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

function generateDemoTracks() {
  return [
    {
      id: '1',
      title: 'Urban Warfare',
      artist: 'Industrial Demo',
      tracks: {
        original: createAudioDataURL(220),
        mixed: createAudioDataURL(247),
        mastered: createAudioDataURL(262),
      },
    },
    {
      id: '2',
      title: 'Digital Collapse',
      artist: 'Industrial Demo',
      tracks: {
        original: createAudioDataURL(196),
        mixed: createAudioDataURL(220),
        mastered: createAudioDataURL(233),
      },
    },
  ]
}
