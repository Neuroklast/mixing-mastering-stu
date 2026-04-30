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
import { MOCK_SHOWCASE_TRACK, MOCK_CREDITS } from '@/lib/mockData'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const FALLBACK_TRACK: ShowcaseTrack = {
  title: 'Demo Track',
  artist: 'SONORATIVA',
  genre: 'Electronic',
  equipment: 'SSL 4000',
  beforeUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  afterUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
}

const showcaseTrack: ShowcaseTrack = isDev ? MOCK_SHOWCASE_TRACK : FALLBACK_TRACK

const PROFILE_ZARDONIC: Profile = {
  name: 'Federico „Zardonic" Ágreda Álvarez',
  title: 'Mixing & Mastering Engineer · Sound Designer',
  bio: 'Pionier des Genres „Metal & Bass" mit über 20 Jahren Branchenerfahrung. Geboren in Venezuela, ansässig in Deutschland. Über 100 Millionen Streams weltweit. Platz 1 in den Beatport Drum & Bass Releases und Amazon Hard Rock & Metal Bestsellern. Remixes und Produktionen für Nine Inch Nails, Bullet For My Valentine, Fear Factory, Pop Evil, Sonic Syndicate, The Qemists und Gorgoroth. Erster lateinamerikanischer Musiker als spielbarer Charakter in einem Videospiel (Warlocks Vs Shadows). Soundtracks für Superhot: Mind Control Delete und Redout 2. Factory Presets für Arturia, Slate Digital, Brainworx und Baby Audio. DAW: FL Studio. Monitoring: Quested v2108, PMC result6. Synth: Sequential Pro 2.',
  portraitSrc: isDev ? '/demo/zardonic.jpg' : '/placeholder-portrait.png',
  awards: [
    { name: 'Artist Of The Year', year: 2016 },
    { name: 'Best DJ Award', year: 2015 },
    { name: 'Best Keyboardist (Metal Hecho en Venezuela)', year: 2014 },
  ],
}

const PROFILE_KAIO: Profile = {
  name: 'Daniel „Kaio" Soto',
  title: 'Mixing & Mastering Engineer · Visual Media Artist',
  bio: 'Spezialist für Mixing, High-End Mastering und visuelle Medienkunst. Gründer und Chef-Engineer von Mixbucket USA. Spezialisiert auf extreme Genres: Black Metal, Thrash und Industrial. Full Mixing & Mastering für Necrobeast (Alben: Promethean Flame, Iron Baphomet). Ersteller offizieller Lyric Videos für internationale Metal-Acts, darunter Necrobeast – „In Communion with Satan". Technischer Fokus: Maximale Lautheit bei Erhalt der transienten Dynamik (Loudness Management). Zusatzleistungen: Professionelles Video-Design und Lyric Video-Produktion.',
  portraitSrc: isDev ? '/demo/kaio.png' : '/placeholder-portrait.png',
  awards: [],
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
            <ClientMasteringPlayer track={showcaseTrack} />
          </ErrorBoundary>
          <ErrorBoundary>
            <CreditsSection credits={isDev ? MOCK_CREDITS : []} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ProfileSection profile={PROFILE_ZARDONIC} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ProfileSection profile={PROFILE_KAIO} />
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
