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
import { MOCK_CREDITS, DEMO_REVIEWS, DEMO_GALLERY } from '@/lib/mockData'
import { getActiveShowcaseTrack, getAllShowcaseTracks } from '@/services/showcaseService'
import { getAllCredits } from '@/services/creditsService'
import { getAllReviews } from '@/services/reviewsService'
import { getAllGalleryImages } from '@/services/galleryService'
import { getSiteContent } from '@/services/contentService'
import { getActiveMembers } from '@/services/membersService'

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
const MembersSection = dynamic(() =>
  import('@/components/features/MembersSection').then((m) => ({ default: m.MembersSection }))
)

import { PROFILE_ZARDONIC, PROFILE_KAIO } from '@/lib/content/engineers'

/**
 * Local-file fallback used only when the filesystem song directory, CMS, and
 * active-track sources all return empty. The paths below point to the demo
 * audio files that ship with the project — no external third-party dependency.
 */
const FALLBACK_TRACK: ShowcaseTrack = {
  title: 'Demo Track',
  artist: 'SONORATIVA',
  beforeUrl: '/demo/incinerate-mixdown.wav',
  afterUrl: '/demo/incinerate-master.wav',
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

  const creditsResult = await getAllCredits()
  const credits = creditsResult.success ? creditsResult.data : MOCK_CREDITS

  const reviewsResult = await getAllReviews()
  const reviews = reviewsResult.success ? reviewsResult.data : DEMO_REVIEWS

  const galleryResult = await getAllGalleryImages()
  const gallery = galleryResult.success ? galleryResult.data : DEMO_GALLERY

  const [siteContent, members] = await Promise.all([
    getSiteContent(),
    getActiveMembers(),
  ])

  return (
    <ScrollProgressProvider>
      <>
        <Toaster position="top-right" theme="dark" richColors />
        <HeroScene3D />
        <Navbar />
        <main id="main-content">
          <div className="relative z-10">
            <ErrorBoundary>
              <HeroSection content={siteContent} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ClientMasteringPlayer tracks={tracks} />
            </ErrorBoundary>
            <ErrorBoundary>
              <CreditsSection credits={credits} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ProfileSection profile={PROFILE_ZARDONIC} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ProfileSection profile={PROFILE_KAIO} />
            </ErrorBoundary>
            <ErrorBoundary>
              <MembersSection members={members} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ReviewsSection reviews={reviews} />
            </ErrorBoundary>
            <ErrorBoundary>
              <GallerySection images={gallery} />
            </ErrorBoundary>
          </div>
        </main>
        <Footer siteContent={siteContent} />
        <CookieBanner />
      </>
    </ScrollProgressProvider>
  )
}
