import { useState } from 'react'
import { Waveform, Briefcase, Envelope, MusicNotes } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ServicePackages } from '@/components/ServicePackages'
import { ContactDialog } from '@/components/ContactDialog'
import { Toaster } from '@/components/ui/sonner'

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
    title: 'Urban Rhythm',
    artist: 'Demo Artist',
    genre: 'Hip-Hop',
    tracks: {
      original: createAudioDataURL(220),
      mixed: createAudioDataURL(247),
      mastered: createAudioDataURL(262),
    },
  },
  {
    id: '2',
    title: 'Electric Pulse',
    artist: 'Demo Producer',
    genre: 'Electronic',
    tracks: {
      original: createAudioDataURL(196),
      mixed: createAudioDataURL(220),
      mastered: createAudioDataURL(233),
    },
  },
]

function App() {
  const [contactOpen, setContactOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setContactOpen(true)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Waveform className="h-6 w-6 text-accent" weight="bold" />
              <span className="font-bold text-xl">StudioMix</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm hover:text-accent transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="text-sm hover:text-accent transition-colors"
              >
                Demo
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-sm hover:text-accent transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-sm hover:text-accent transition-colors"
              >
                About
              </button>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setContactOpen(true)}
              >
                <Envelope className="h-4 w-4 mr-2" weight="bold" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section
          id="hero"
          className="py-24 md:py-32 relative overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, oklch(0.25 0.05 240) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, oklch(0.25 0.05 220) 0%, transparent 50%),
              oklch(0.15 0.01 240)
            `,
          }}
        >
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  oklch(0.20 0.01 240) 2px,
                  oklch(0.20 0.01 240) 4px
                )`,
              }}
            />
          </div>

          <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 bg-accent/20 text-accent border-accent/50 px-4 py-1">
                Professional Audio Engineering
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Elevate Your Music with{' '}
                <span className="text-accent">Studio-Grade</span> Mixing & Mastering
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Transform your tracks into polished, radio-ready productions. Professional mixing and mastering services with fast turnaround and unlimited revisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-8 transition-all hover:scale-105 active:scale-95"
                  onClick={() => scrollToSection('demo')}
                >
                  <MusicNotes className="h-5 w-5 mr-2" weight="bold" />
                  Hear the Difference
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 font-semibold text-lg px-8"
                  onClick={() => scrollToSection('services')}
                >
                  <Briefcase className="h-5 w-5 mr-2" weight="bold" />
                  View Packages
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Before & After Comparison
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the transformation. Switch between Original, Mixed, and Mastered versions in real-time with our interactive audio player.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {demoTracks.map((track) => (
                <div key={track.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="outline" className="border-accent text-accent">
                      {track.genre}
                    </Badge>
                  </div>
                  <AudioPlayer
                    tracks={track.tracks}
                    title={track.title}
                    artist={track.artist}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <ServicePackages onSelectPackage={handleServiceSelect} />

        <section id="about" className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                About the Studio
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-accent">Experience</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Over 10 years of professional audio engineering experience, working with artists across multiple genres. Specialized in modern production techniques and analog warmth.
                  </p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-accent">Equipment</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Hybrid analog/digital workflow featuring industry-standard converters, premium plugins, and carefully calibrated monitoring in an acoustically treated environment.
                  </p>
                </div>
              </div>

              <Separator className="my-12" />

              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-6">Why Choose Us?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-4xl font-bold text-accent mb-2">48h</div>
                    <p className="text-sm text-muted-foreground">Average Turnaround</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-accent mb-2">500+</div>
                    <p className="text-sm text-muted-foreground">Tracks Mastered</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-accent mb-2">100%</div>
                    <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's bring your music to life. Get in touch today for a free consultation.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-10 transition-all hover:scale-105 active:scale-95"
              onClick={() => setContactOpen(true)}
            >
              Start Your Project
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 bg-card">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Waveform className="h-5 w-5 text-accent" weight="bold" />
              <span className="font-bold">StudioMix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 StudioMix. Professional Mixing & Mastering Services.
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
