/**
 * Storage provider factory.
 *
 * Always returns the Cloudflare R2 provider (r2StorageProvider).
 * Supabase Storage is no longer used — see docs/cloudflare-r2.md.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID          – Cloudflare account ID
 *   R2_ACCESS_KEY_ID       – R2 S3-compatible access key ID
 *   R2_SECRET_ACCESS_KEY   – R2 S3-compatible secret access key
 *   R2_PUBLIC_HOST         – Public custom domain for sonorativa-media
 *   R2_BUCKET_MEDIA        – Media bucket name (default: sonorativa-media)
 *   R2_BUCKET_AUDIO        – Audio bucket name (default: sonorativa-audio)
 *
 * Usage (server-side only):
 *   import { getStorageProvider } from '@/lib/storage'
 *   const storage = getStorageProvider()
 *   const url = storage.getPublicUrl('sonorativa-media', 'uploads/photo.jpg')
 *
 * See docs/cloudflare-r2.md for full setup instructions.
 */

import type { StorageProvider } from './types'
import { r2StorageProvider } from './r2'

export type { StorageProvider, StorageObject } from './types'

let _instance: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (_instance) return _instance
  _instance = r2StorageProvider
  return _instance
}

/** Reset the singleton – intended for tests only. */
export function _resetStorageProvider(): void {
  _instance = null
}
