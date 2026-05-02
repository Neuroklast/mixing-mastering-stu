import type { ShowcaseTrack } from '@/lib/schemas/showcase'
import type { Credit } from '@/lib/schemas/credits'
import type { Order, AudioFile, Product } from '@/types'
import type { Review } from '@/components/features/ReviewsSection'

export const MOCK_SHOWCASE_TRACK: ShowcaseTrack = {
  title: 'Neuroklast – INCINERATE',
  artist: 'NEUROKLAST',
  beforeUrl: '/demo/incinerate-mixdown.wav',
  afterUrl: '/demo/incinerate-master.wav',
  labelBefore: 'DEMO',
  labelAfter: 'FINAL',
}

// Multiple tracks for playlist navigation in dev mode
export const MOCK_SHOWCASE_TRACKS: ShowcaseTrack[] = [
  MOCK_SHOWCASE_TRACK,
  {
    title: 'Kernel Breaker – FRAGMENT',
    artist: 'KERNEL BREAKER',
    beforeUrl: '/demo/incinerate-mixdown.wav',
    afterUrl: '/demo/incinerate-master.wav',
    labelBefore: 'DEMO',
    labelAfter: 'FINAL',
  },
]

export const MOCK_CREDITS: Credit[] = [
  { id: '1', name: 'Bullet For My Valentine', role: 'Mix & Master', year: 2022, featured: true },
  { id: '2', name: 'Fear Factory', role: 'Mix & Master', year: 2021, featured: true },
  { id: '3', name: 'Nine Inch Nails', role: 'Producing', year: 2020, featured: true },
  { id: '4', name: 'Smash Into Pieces – Boomerang (Zardonic Remix)', role: 'Mix & Master', year: 2019 },
  { id: '5', name: 'Smash Into Pieces – Higher (Zardonic Remix)', role: 'Mix & Master', year: 2018 },
  { id: '6', name: 'Necrobeast – Iron Baphomet', role: 'Mix & Master', year: 2023, featured: true },
  { id: '7', name: 'Necrobeast – Promethean Flame', role: 'Mix & Master', year: 2022 },
  { id: '8', name: 'Pop Evil', role: 'Mix', year: 2021 },
  { id: '9', name: 'Gorgoroth', role: 'Master', year: 2020 },
  { id: '10', name: 'Kernel Breaker feat. Noisesmith', role: 'Mix & Master', year: 2026, featured: true },
]

export const DEMO_REVIEWS: Review[] = [
  {
    id: 'r1',
    clientName: 'Marcus T.',
    rating: 5,
    text: 'Absolute killer mastering job. My track went from "sounding good" to "sounding like a major-label release" overnight. Zardonic heard details I had completely missed.',
    service: 'Master',
    date: '2025-11-12',
  },
  {
    id: 'r2',
    clientName: 'Sofia K.',
    rating: 5,
    text: 'Daniel Kaio mixed our entire EP in one week without sacrificing a single detail. The low end is tighter than anything I have ever heard. 10/10.',
    service: 'Mix',
    date: '2025-10-03',
  },
  {
    id: 'r3',
    clientName: 'Thrash United (band)',
    rating: 5,
    text: 'We sent a rough mix with 48 tracks and got back a master that destroyed us emotionally – in the best way possible. Will never go anywhere else.',
    service: 'Mix & Master',
    date: '2025-09-18',
  },
  {
    id: 'r4',
    clientName: 'Alex H.',
    rating: 4.5,
    text: 'Fast turnaround, honest feedback and an ear for dynamics that most engineers simply do not have. The A/B player on the site already sold me before I even contacted them.',
    service: 'Master',
    date: '2025-08-27',
  },
  {
    id: 'r5',
    clientName: 'Ironclad Records',
    rating: 5,
    text: 'We send every release through Sonorativa now. Consistency, tone and loudness are always on point across the whole roster.',
    service: 'Mix & Master',
    date: '2025-07-14',
  },
  {
    id: 'r6',
    clientName: 'DJ Blacksun',
    rating: 5,
    text: 'Zardonic remixed and mastered my EP. The energy is insane. Beatport chart position #3 in the first week.',
    service: 'Mix & Master',
    date: '2025-06-30',
  },
  {
    id: 'r7',
    clientName: 'Noisesmith',
    rating: 5,
    text: 'Industrial/Noise is a notoriously difficult genre to mix. Daniel just "got it". No back-and-forth revisions needed.',
    service: 'Mix',
    date: '2025-05-22',
  },
  {
    id: 'r8',
    clientName: 'Velvet Void',
    rating: 4.5,
    text: 'Stunning spatial mixing on our Black Metal record. Rare to find someone who can balance raw atmosphere with technical precision.',
    service: 'Mix & Master',
    date: '2025-04-10',
  },
]

import type { GalleryImage } from '@/types'

/**
 * Gallery images are loaded from the CMS in production.  The DEMO_GALLERY is
 * intentionally empty so that the GallerySection renders its empty-state UI
 * rather than serving external images that may carry ToS restrictions.
 * Add real images via the Payload CMS Gallery collection.
 */
export const DEMO_GALLERY: GalleryImage[] = []

export const MOCK_ORDERS: Order[] = [
  {
    id: 'mock-order-1',
    created_at: '2025-01-15T10:00:00Z',
    client_name: 'Demo Client',
    client_email: 'demo@example.com',
    service_type: 'mixing_mastering',
    package_tier: 'professional',
    status: 'completed',
    notes: null,
    total_price: 450,
  },
]

export const MOCK_FILES: AudioFile[] = [
  {
    id: 'mock-file-1',
    created_at: '2025-01-15T10:05:00Z',
    order_id: 'mock-order-1',
    filename: 'demo-track.wav',
    storage_path: 'orders/mock-order-1/demo-track.wav',
    public_url: '/demo/incinerate-mixdown.wav',
    file_size_bytes: 54_000_000,
    mime_type: 'audio/wav',
    type: 'original',
  },
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-product-1',
    name: 'Zardonic Metal Bass Presets',
    description: 'Professional preset bank for Metal & Bass production. Factory presets used for Arturia, Slate Digital, Brainworx and Baby Audio.',
    price_cents: 2900,
    currency: 'EUR',
    product_type: 'preset_bank',
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    download_url: null,
    license_type: 'single',
  },
  {
    id: 'mock-product-2',
    name: 'Industrial Thrash Sample Pack',
    description: 'High-quality samples for Black Metal, Thrash and Industrial production by Daniel Kaio.',
    price_cents: 1900,
    currency: 'EUR',
    product_type: 'sample_pack',
    stripe_product_id: null,
    stripe_price_id: null,
    is_active: true,
    download_url: null,
    license_type: 'single',
  },
]
