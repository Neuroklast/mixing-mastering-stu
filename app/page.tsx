import * as fs from 'node:fs'
import * as path from 'node:path'
import dynamic from 'next/dynamic'
import { ScrollProgressProvider } from '@/contexts/ScrollProgressContext'
import { DynamicHeroScene3D as HeroScene3D } from '@/components/organisms/HeroScene3D/DynamicHeroScene3D'
import { Navbar } from '@/components/features/Navbar'
import { HeroSection } from '@/components/features/HeroSection'
import { Footer } from '@/components/features/Footer'
import { ErrorBoundary } from '@/components/features/ErrorBoundary'
import { ClientMasteringPlayer } from '@/components/features/ClientMasteringPlayer'
import { CookieBanner } from '@/components/features/CookieBanner'
import { Toaster } from 'sonner'
import { showcaseTrackSchema, type ShowcaseTrack } from '@/lib/schemas/showcase'
import type { Profile } from '@/types/profile'
import { MOCK_CREDITS, DEMO_REVIEWS, DEMO_GALLERY } from '@/lib/mockData'
import { getActiveShowcaseTrack, getAllShowcaseTracks } from '@/services/showcaseService'

const CreditsSection = dynamic(() =>
  import('@/components/features/CreditsSection').then((m) => ({ default: m.CreditsSection }))
)
const ProfileSection = dynamic(() =>
  import('@/components/features/ProfileSection').then((m) => ({ default: m.ProfileSection }))
)
const ReviewsSection = dynamic(() =>
  import('@/components/features/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
)
const GallerySection = dynamic(() =>
  import('@/components/features/GallerySection').then((m) => ({ default: m.GallerySection }))
)

const FALLBACK_TRACK: ShowcaseTrack = {
  title: 'Demo Track',
  artist: 'SONORATIVA',
  beforeUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  afterUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  labelBefore: 'DEMO',
  labelAfter: 'FINAL',
}

/**
 * Scan public/player/songs/ for track folders.
 * Each folder must contain both a *_demo.* and *_final.* file to be included.
 * Folder name pattern: "ARTIST -- TITLE"
 */
function loadPlayerSongs(): ShowcaseTrack[] {
  const SONGS_DIR = path.join(process.cwd(), 'public', 'player', 'songs')
  if (!fs.existsSync(SONGS_DIR)) return []

  const tracks: ShowcaseTrack[] = []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(SONGS_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const dirs = entries.filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))

  for (const dir of dirs) {
    const folderName = dir.name
    const folderPath = path.join(SONGS_DIR, folderName)

    let files: string[]
    try {
      files = fs.readdirSync(folderPath)
    } catch {
      continue
    }

    // Find the demo and final files (case-insensitive suffix match)
    const demoFile  = files.find((f) => /[_-]demo\.(wav|mp3|flac|ogg)$/i.test(f)) ?? null
    const finalFile = files.find((f) => /[_-]final\.(wav|mp3|flac|ogg)$/i.test(f)) ?? null

    // Only include folders that have BOTH files
    if (!demoFile || !finalFile) continue

    // Parse "ARTIST -- TITLE" from the folder name
    const separatorIdx = folderName.indexOf(' -- ')
    const artist = separatorIdx !== -1 ? folderName.slice(0, separatorIdx).trim() : 'UNKNOWN'
    const title  = separatorIdx !== -1 ? folderName.slice(separatorIdx + 4).trim() : folderName

    // Build root-relative URLs (encode each path segment)
    const beforeUrl = `/player/songs/${encodeURIComponent(folderName)}/${encodeURIComponent(demoFile)}`
    const afterUrl  = `/player/songs/${encodeURIComponent(folderName)}/${encodeURIComponent(finalFile)}`

    const result = showcaseTrackSchema.safeParse({
      title,
      artist,
      beforeUrl,
      afterUrl,
      labelBefore: 'DEMO',
      labelAfter: 'FINAL',
    })

    if (result.success) tracks.push(result.data)
  }

  return tracks
}

const PROFILE_ZARDONIC: Profile = {
  name: 'Federico „Zardonic" Ágreda Álvarez',
  title: 'Mixing & Mastering Engineer · Sound Designer',
  bio: 'Venezuelan-born electronic music producer, DJ, and mixing/mastering engineer with over 20 years of industry experience. Known for his work in industrial metal, drum & bass, and cyberpunk-influenced music, he has collaborated with major artists including Fear Factory, Bullet For My Valentine, Nine Inch Nails, Pop Evil, Sonic Syndicate, The Qemists, and Gorgoroth. His engineering style focuses on extreme clarity, surgical EQ, and cinematic low-end. #1 on Beatport Drum & Bass releases and Amazon Hard Rock & Metal charts with over 100 million streams worldwide. Factory presets for Arturia, Slate Digital, Brainworx, and Baby Audio. First Latin American musician as a playable character in a video game (Warlocks Vs Shadows). Soundtracks: Superhot: Mind Control Delete, Redout 2. DAW: FL Studio. Monitoring: Quested v2108, PMC result6. Synth: Sequential Pro 2.',
  portraitSrc: '/demo/zardonic.jpeg',
  awards: [],
}

const PROFILE_KAIO: Profile = {
  name: 'Daniel „Kaio" Soto',
  title: 'Mixing & Mastering Engineer · Visual Media Artist',
  bio: 'Venezuelan mixing and mastering engineer specialising in heavy music genres — metal, hardcore, and industrial. Known for precise transient control, tight low-end management, and the ability to translate raw mixes into polished, competitive masters. Founder and head engineer of Mixbucket USA. Delivered full Mix & Master for Necrobeast (albums: Promethean Flame, Iron Baphomet) and created official lyric videos for international metal acts. Technical focus: maximum loudness with full transient dynamics preserved. Works with clients across Latin America and Europe.',
  portraitSrc: '/demo/kaio.jpeg',
  awards: [],
}

export default async function HomePage(): Promise<JSX.Element> {
  // 1. Try filesystem songs (public/player/songs/) — primary source
  const fsSongs = loadPlayerSongs()

  // 2. Fall back to Payload CMS tracks, then single active track, then hard-coded fallback
  const tracks =
    fsSongs.length > 0
      ? fsSongs
      : await getAllShowcaseTracks().then(async (all) =>
          all.length > 0
            ? all
            : await getActiveShowcaseTrack().then((t) => (t ? [t] : [FALLBACK_TRACK])),
        )

  return (
    <ScrollProgressProvider>
      <>
        <Toaster position="top-right" theme="dark" richColors />
        <Navbar />
        <main id="main-content">
          <div className="relative z-10">
            <ErrorBoundary>
              <HeroSection />
            </ErrorBoundary>
            <ErrorBoundary>
              <ClientMasteringPlayer tracks={tracks} />
            </ErrorBoundary>
            <ErrorBoundary>
              <CreditsSection credits={MOCK_CREDITS} />
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
        <CookieBanner />
      </>
    </ScrollProgressProvider>
  )
}
