/**
 * Storage provider factory.
 *
 * Returns the configured StorageProvider singleton based on the
 * STORAGE_PROVIDER environment variable:
 *   'supabase' (default) – Supabase Storage (lib/storage/supabase.ts)
 *   'r2'                 – Cloudflare R2   (lib/storage/r2.ts)
 *
 * Usage (server-side only):
 *   import { getStorageProvider } from '@/lib/storage'
 *   const storage = getStorageProvider()
 *   const url = storage.getPublicUrl('media', 'uploads/photo.jpg')
 *
 * See docs/cloudflare-r2.md for R2 setup instructions.
 */

import type { StorageProvider } from './types'
import { supabaseStorageProvider } from './supabase'
import { r2StorageProvider } from './r2'

export type { StorageProvider, StorageObject } from './types'

let _instance: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (_instance) return _instance

  const provider = process.env.STORAGE_PROVIDER ?? 'supabase'

  if (provider === 'r2') {
    _instance = r2StorageProvider
  } else {
    _instance = supabaseStorageProvider
  }

  return _instance
}

/** Reset the singleton – intended for tests only. */
export function _resetStorageProvider(): void {
  _instance = null
}
