import { Navbar } from '@/components/features/Navbar'
import { HeroSection } from '@/components/features/HeroSection'
import { VideoBackground } from '@/components/features/VideoBackground'
import { Footer } from '@/components/features/Footer'
import { ErrorBoundary } from '@/components/features/ErrorBoundary'
import { CreditsSection } from '@/components/features/CreditsSection'
import { ProfileSection } from '@/components/features/ProfileSection'
import { ReviewsSection } from '@/components/features/ReviewsSection'
import { GallerySection } from '@/components/features/GallerySection'
import { ClientMasteringPlayer } from '@/components/features/ClientMasteringPlayer'
import { Toaster } from 'sonner'
import type { ShowcaseTrack } from '@/lib/schemas/showcase'
import type { Profile } from '@/types/profile'
import { MOCK_CREDITS, DEMO_REVIEWS, DEMO_GALLERY } from '@/lib/mockData'
import { getActiveShowcaseTrack, getAllShowcaseTracks } from '@/services/showcaseService'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const FALLBACK_TRACK: ShowcaseTrack = {
  title: 'Demo Track',
  artist: 'SONORATIVA',
  genre: 'Electronic',
  equipment: 'SSL 4000',
  beforeUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  afterUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
}

const PROFILE_ZARDONIC: Profile = {
  name: 'Federico „Zardonic" Ágreda Álvarez',
  title: 'Mixing & Mastering Engineer · Sound Designer',
  bio: 'Venezuelan-born electronic music producer, DJ, and mixing/mastering engineer with over 20 years of industry experience. Known for his work in industrial metal, drum & bass, and cyberpunk-influenced music, he has collaborated with major artists including Fear Factory, Bullet For My Valentine, Nine Inch Nails, Pop Evil, Sonic Syndicate, The Qemists, and Gorgoroth. His engineering style focuses on extreme clarity, surgical EQ, and cinematic low-end. #1 on Beatport Drum & Bass releases and Amazon Hard Rock & Metal charts with over 100 million streams worldwide. Factory presets for Arturia, Slate Digital, Brainworx, and Baby Audio. First Latin American musician as a playable character in a video game (Warlocks Vs Shadows). Soundtracks: Superhot: Mind Control Delete, Redout 2. DAW: FL Studio. Monitoring: Quested v2108, PMC result6. Synth: Sequential Pro 2.',
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
  bio: 'Venezuelan mixing and mastering engineer specialising in heavy music genres — metal, hardcore, and industrial. Known for precise transient control, tight low-end management, and the ability to translate raw mixes into polished, competitive masters. Founder and head engineer of Mixbucket USA. Delivered full Mix & Master for Necrobeast (albums: Promethean Flame, Iron Baphomet) and created official lyric videos for international metal acts. Technical focus: maximum loudness with full transient dynamics preserved. Works with clients across Latin America and Europe.',
  portraitSrc: isDev ? '/demo/kaio.png' : '/placeholder-portrait.png',
  awards: [],
}

export default async function HomePage(): Promise<JSX.Element> {
  const allTracks = await getAllShowcaseTracks()
  // Fall back to the single active track if getAllShowcaseTracks returns nothing,
  // then to the hard-coded fallback
  const tracks =
    allTracks.length > 0
      ? allTracks
      : await getActiveShowcaseTrack().then((t) => (t ? [t] : [FALLBACK_TRACK]))

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
            <ClientMasteringPlayer tracks={tracks} />
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
            <ReviewsSection reviews={isDev ? DEMO_REVIEWS : []} />
          </ErrorBoundary>
          <ErrorBoundary>
            <GallerySection images={isDev ? DEMO_GALLERY : []} />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </>
  )
}
