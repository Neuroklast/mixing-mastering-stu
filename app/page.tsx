import { Navbar } from '@/components/Navbar'
import { VideoBackground } from '@/components/VideoBackground'
import { HeroSection } from '@/components/HeroSection'
import { Footer } from '@/components/Footer'
import { Toaster } from 'sonner'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <VideoBackground />
      <main className="relative z-10 bg-background">
        <HeroSection />
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  )
}
