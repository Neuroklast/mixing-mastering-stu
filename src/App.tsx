import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waveform, Play, Briefcase, Envelope, X, List } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ServicePackages } from '@/components/ServicePackages'
import { ContactDialog } from '@/components/ContactDialog'
import { Toaster } from '@/components/ui/sonner'
import { useLenis } from '@/hooks/use-lenis'
import { ScrollVideo } from '@/components/ScrollVideo'

interface DemoTrack {
  id: string
  title: string
  artist: string
  genre: string
  tracks: {
    original: string
    mixed: string
    mastered: string
  }
}

const generateSynthWave = (frequency: number, duration: number, sampleRate: number) => {
  const samples = duration * sampleRate
  const buffer = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
  }
  return buffer
}

const createAudioDataURL = (frequency: number): string => {
  const sampleRate = 44100
  const duration = 30
  const buffer = generateSynthWave(frequency, duration, sampleRate)
  
  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
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

const demoTracks: DemoTrack[] = [
  {
    id: '1',
    title: 'Urban Warfare',
    artist: 'Industrial Demo',
    genre: 'Industrial',
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
    genre: 'Drum & Bass',
    tracks: {
      original: createAudioDataURL(196),
      mixed: createAudioDataURL(220),
      mastered: createAudioDataURL(233),
    },
  },
]

type ModalView = 'none' | 'demo' | 'services' | 'about'

function App() {
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [modalView, setModalView] = useState<ModalView>('none')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useLenis()

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setContactOpen(true)
    setModalView('none')
  }

  const openModal = (view: ModalView) => {
    setModalView(view)
    setMobileMenuOpen(false)
  }

  const closeModal = () => setModalView('none')

  return (
    <div className="min-h-screen bg-background text-foreground vignette scanlines grain">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Waveform className="h-6 w-6 text-accent" weight="bold" />
              <span className="font-bold text-xl tracking-tighter">SONORATIVA</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => openModal('demo')}
                className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors"
              >
                Demo
              </button>
              <button
                onClick={() => openModal('services')}
                className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => openModal('about')}
                className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors"
              >
                About
              </button>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono uppercase tracking-wider"
                onClick={() => setContactOpen(true)}
              >
                <Envelope className="h-4 w-4 mr-2" weight="bold" />
                Contact
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <List className="h-6 w-6 text-accent" weight="bold" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card"
            >
              <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
                <button
                  onClick={() => openModal('demo')}
                  className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors text-left"
                >
                  Demo
                </button>
                <button
                  onClick={() => openModal('services')}
                  className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors text-left"
                >
                  Services
                </button>
                <button
                  onClick={() => openModal('about')}
                  className="text-sm font-mono uppercase tracking-wider hover:text-accent transition-colors text-left"
                >
                  About
                </button>
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono uppercase tracking-wider w-full"
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

      <ScrollVideo />

      <main className="relative z-10 bg-background">
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
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-none tracking-tighter"
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
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono uppercase tracking-wider text-lg px-8 transition-all hover:scale-105 active:scale-95 glow-accent-strong"
                onClick={() => openModal('demo')}
              >
                <Play className="h-5 w-5 mr-2" weight="fill" />
                Experience Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10 font-mono uppercase tracking-wider text-lg px-8"
                onClick={() => openModal('services')}
              >
                <Briefcase className="h-5 w-5 mr-2" weight="bold" />
                View Services
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

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
                  >
                    <X className="h-5 w-5" weight="bold" />
                  </Button>
                </div>

                <div className="bg-card border border-border rounded overflow-hidden">
                  {modalView === 'demo' && (
                    <div className="p-8 md:p-12">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter">
                        BEFORE & AFTER COMPARISON
                      </h2>
                      <p className="text-lg text-muted-foreground mb-8 font-mono">
                        Experience the transformation with real-time A/B comparison.
                      </p>

                      <div className="space-y-8">
                        {demoTracks.map((track) => (
                          <div key={track.id}>
                            <AudioPlayer
                              tracks={track.tracks}
                              title={track.title}
                              artist={track.artist}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalView === 'services' && (
                    <div className="p-8 md:p-12">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter">
                          SERVICE PACKAGES
                        </h2>
                        <p className="text-lg text-muted-foreground font-mono max-w-2xl mx-auto">
                          Professional audio engineering services with dedicated support.
                        </p>
                      </div>
                      <ServicePackages onSelectPackage={handleServiceSelect} />
                    </div>
                  )}

                  {modalView === 'about' && (
                    <div className="p-8 md:p-12">
                      <h2 className="text-3xl md:text-4xl font-bold mb-8 tracking-tighter">
                        ABOUT THE STUDIO
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-secondary/30 border border-border rounded p-6">
                          <h3 className="text-xl font-bold mb-4 text-accent uppercase tracking-wider font-mono">
                            Experience
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Over 10 years of professional audio engineering experience, working with artists across multiple genres. Specialized in modern production techniques and analog warmth.
                          </p>
                        </div>
                        
                        <div className="bg-secondary/30 border border-border rounded p-6">
                          <h3 className="text-xl font-bold mb-4 text-accent uppercase tracking-wider font-mono">
                            Equipment
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            Hybrid analog/digital workflow featuring industry-standard converters, premium plugins, and carefully calibrated monitoring in an acoustically treated environment.
                          </p>
                        </div>
                      </div>

                      <Separator className="my-12" />

                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-8 uppercase tracking-wider font-mono">
                          Why Choose Us?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                            <div className="text-5xl font-bold text-accent mb-2 tracking-tighter">48H</div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">
                              Average Turnaround
                            </p>
                          </div>
                          <div>
                            <div className="text-5xl font-bold text-accent mb-2 tracking-tighter">500+</div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">
                              Tracks Mastered
                            </p>
                          </div>
                          <div>
                            <div className="text-5xl font-bold text-accent mb-2 tracking-tighter">100%</div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">
                              Client Satisfaction
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 text-center">
                        <Button
                          size="lg"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground font-mono uppercase tracking-wider px-10"
                          onClick={() => {
                            setContactOpen(true)
                            closeModal()
                          }}
                        >
                          Start Your Project
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-border py-8 bg-card/50 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Waveform className="h-5 w-5 text-accent" weight="bold" />
              <span className="font-bold tracking-tighter">SONORATIVA</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
              © 2024 Professional Audio Engineering
            </p>
          </div>
        </div>
      </footer>

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultService={selectedService}
      />
      
      <Toaster position="bottom-right" />
    </div>
  )
}

export default App
