import { Navbar } from '@/components/features/Navbar'
import { HeroSection } from '@/components/features/HeroSection'
import { VideoBackground } from '@/components/features/VideoBackground'
import { Footer } from '@/components/features/Footer'
import { ErrorBoundary } from '@/components/features/ErrorBoundary'
import { Toaster } from 'sonner'

export default function HomePage(): JSX.Element {
  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      <Navbar />
      <main>
        <ErrorBoundary>
          <VideoBackground />
        </ErrorBoundary>
        <div className="relative z-10">
          <ErrorBoundary>
            <HeroSection />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </>
  )
}
