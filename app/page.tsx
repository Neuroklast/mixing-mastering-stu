import nextDynamic from 'next/dynamic'
import { ScrollProgressProvider } from '@/contexts/ScrollProgressContext'
import { DynamicHeroScene3D as HeroScene3D } from '@/components/organisms/HeroScene3D/DynamicHeroScene3D'
import { Navbar } from '@/components/features/Navbar'
import { HeroSection } from '@/components/features/HeroSection'
import { Footer } from '@/components/features/Footer'
import { ErrorBoundary } from '@/components/features/ErrorBoundary'
import { ClientMasteringPlayer } from '@/components/features/ClientMasteringPlayer'
import { CookieBanner } from '@/components/features/CookieBanner'
import { Toaster } from 'sonner'
import { getAllShowcaseTracks } from '@/services/showcaseService'
import { getAllCredits } from '@/services/creditsService'
import { getAllReviews } from '@/services/reviewsService'
import { getAllGalleryImages } from '@/services/galleryService'
import { getSiteContent } from '@/services/contentService'
import { getActiveMembers } from '@/services/membersService'

import { SITE_CONTENT_DEFAULTS } from '@/lib/schemas/siteContent'

export const dynamic = 'force-dynamic'

const CreditsSection = nextDynamic(() =>
  import('@/components/features/CreditsSection').then((m) => ({ default: m.CreditsSection }))
)
const ReviewsSection = nextDynamic(() =>
  import('@/components/features/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
)
const GallerySection = nextDynamic(() =>
  import('@/components/features/GallerySection').then((m) => ({ default: m.GallerySection }))
)
const MembersSection = nextDynamic(() =>
  import('@/components/features/MembersSection').then((m) => ({ default: m.MembersSection }))
)

/** Shown when no showcase tracks have been published yet. */
function EmptyShowcaseNotice(): JSX.Element {
  return (
    <section className="flex items-center justify-center px-6 py-20 text-center">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No showcase tracks have been published yet.
      </p>
    </section>
  )
}

export default async function HomePage(): Promise<JSX.Element> {
  const tracksResult = await getAllShowcaseTracks()
  const tracks = tracksResult.success ? tracksResult.data : []

  const creditsResult = await getAllCredits()
  const credits = creditsResult.success ? creditsResult.data : []

  const reviewsResult = await getAllReviews()
  const reviews = reviewsResult.success ? reviewsResult.data : []

  const galleryResult = await getAllGalleryImages()
  const gallery = galleryResult.success ? galleryResult.data : []

  const [siteContentResult, membersResult] = await Promise.all([
    getSiteContent(),
    getActiveMembers(),
  ])
  const siteContent = siteContentResult.success ? siteContentResult.data : SITE_CONTENT_DEFAULTS
  const members = membersResult.success ? membersResult.data : []

  return (
    <ScrollProgressProvider>
      <>
        <Toaster position="top-right" theme="dark" richColors />
        <HeroScene3D modelPath={siteContent.hero_model_url} />
        <Navbar />
        <main id="main-content">
          <div className="relative z-10">
            <ErrorBoundary>
              <HeroSection content={siteContent} />
            </ErrorBoundary>
            <ErrorBoundary>
              {tracks.length > 0 ? (
                <ClientMasteringPlayer tracks={tracks} />
              ) : (
                <EmptyShowcaseNotice />
              )}
            </ErrorBoundary>
            <ErrorBoundary>
              <CreditsSection credits={credits} />
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