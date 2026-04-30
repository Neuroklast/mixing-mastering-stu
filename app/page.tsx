import { Navbar } from '@/components/features/Navbar'
import { HeroSection } from '@/components/features/HeroSection'
import { VideoBackground } from '@/components/features/VideoBackground'
import { Footer } from '@/components/features/Footer'
import { ErrorBoundary } from '@/components/features/ErrorBoundary'
import { CreditsSection } from '@/components/features/CreditsSection'
import { ProfileSection } from '@/components/features/ProfileSection'
import { ReviewsSection, type Review } from '@/components/features/ReviewsSection'
import { GallerySection } from '@/components/features/GallerySection'
import { ClientMasteringPlayer } from '@/components/features/ClientMasteringPlayer'
import { Toaster } from 'sonner'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'
import type { Profile } from '@/types/profile'

const DEMO_TRACK: ShowcaseTrack = {
  title: 'Demo Track',
  artist: 'SONORATIVA',
  genre: 'Electronic',
  equipment: 'SSL 4000',
  beforeUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  afterUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
}

const DEMO_PROFILE: Profile = {
  name: 'Alex Sonorativa',
  title: 'Mixing & Mastering Engineer',
  bio: 'With over 15 years of experience in professional audio engineering, Alex has worked with artists across genres from ambient electronic to heavy metal. Trained at the prestigious SAE Institute and mentored by industry veterans, Alex brings a technical precision and creative sensibility to every project. Specializing in the critical transition from mix to master, Alex ensures every release achieves commercial loudness standards while retaining the dynamic range and emotional impact the music demands.',
  portraitSrc: '/placeholder-portrait.png',
  awards: [
    { name: 'Best Mastering Engineer', year: 2023 },
    { name: 'Platinum Record', year: 2022 },
    { name: 'Industry Excellence', year: 2021 },
  ],
}

const DEMO_REVIEWS: Review[] = []
const DEMO_GALLERY: { src: string; alt: string; width: number; height: number }[] = []

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
          <ErrorBoundary>
            <ClientMasteringPlayer track={DEMO_TRACK} />
          </ErrorBoundary>
          <ErrorBoundary>
            <CreditsSection credits={[]} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ProfileSection profile={DEMO_PROFILE} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ReviewsSection reviews={DEMO_REVIEWS} />
          </ErrorBoundary>
          <ErrorBoundary>
            <GallerySection images={DEMO_GALLERY} />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </>
  )
}
