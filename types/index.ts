export interface Order {
  id: string
  created_at: string
  client_name: string
  client_email: string
  service_type: 'mixing' | 'mastering' | 'mixing_mastering'
  package_tier: 'starter' | 'professional' | 'premium'
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  notes: string | null
  total_price: number
}

export interface AudioFile {
  id: string
  created_at: string
  order_id: string
  filename: string
  storage_path: string
  public_url: string
  file_size_bytes: number
  mime_type: 'audio/wav' | 'audio/mpeg'
  type: 'original' | 'mixed' | 'mastered'
}

/** VST-Plugin / digital product – prepared for Stripe */
export interface Product {
  id: string
  name: string
  description: string
  price_cents: number
  currency: string
  product_type: 'vst_plugin' | 'sample_pack' | 'preset_bank'
  stripe_product_id: string | null
  stripe_price_id: string | null
  is_active: boolean
  download_url: string | null
  license_type: 'single' | 'commercial' | 'unlimited'
}

export interface License {
  id: string
  created_at: string
  user_id: string
  product_id: string
  order_reference: string
  license_key: string
  activated_at: string | null
  expires_at: string | null
  stripe_payment_intent_id: string | null
}

/** A single image in the studio gallery. Re-exported from lib/schemas/gallery for backwards compatibility. */
export type { GalleryImage } from '@/lib/schemas/gallery'
