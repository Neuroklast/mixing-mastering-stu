import type { ShowcaseTrack } from '@/lib/schemas/showcase'
import type { Credit } from '@/lib/schemas/credits'
import type { Order, AudioFile, Product } from '@/types'

export const MOCK_SHOWCASE_TRACK: ShowcaseTrack = {
  title: 'Neuroklast – INCINERATE',
  artist: 'NEUROKLAST',
  genre: 'Metal',
  equipment: 'FL Studio · Quested v2108',
  beforeUrl: '/demo/incinerate-mixdown.wav',
  afterUrl: '/demo/incinerate-master.wav',
}

export const MOCK_CREDITS: Credit[] = [
  { id: '1', name: 'Bullet For My Valentine', role: 'Mix & Master', year: 2022 },
  { id: '2', name: 'Fear Factory', role: 'Mix & Master', year: 2021 },
  { id: '3', name: 'Nine Inch Nails', role: 'Producing', year: 2020 },
  { id: '4', name: 'Smash Into Pieces – Boomerang (Zardonic Remix)', role: 'Mix & Master', year: 2019 },
  { id: '5', name: 'Smash Into Pieces – Higher (Zardonic Remix)', role: 'Mix & Master', year: 2018 },
  { id: '6', name: 'Necrobeast – Iron Baphomet', role: 'Mix & Master', year: 2023 },
  { id: '7', name: 'Necrobeast – Promethean Flame', role: 'Mix & Master', year: 2022 },
  { id: '8', name: 'Pop Evil', role: 'Mix', year: 2021 },
  { id: '9', name: 'Gorgoroth', role: 'Master', year: 2020 },
  { id: '10', name: 'Kernel Breaker feat. Noisesmith', role: 'Mix & Master', year: 2026 },
]

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
