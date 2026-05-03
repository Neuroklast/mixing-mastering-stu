'use server'

import { createClient } from '@/lib/supabaseServer'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { getStorageProvider } from '@/lib/storage'

/**
 * Creates a signed upload URL so the browser can PUT the file directly to
 * the configured storage provider (Supabase Storage or Cloudflare R2).
 * Use this for small files (images, documents under 50 MB).
 * For large audio files (WAVs >50 MB) use getTusUploadCredentials instead
 * (TUS is only supported on Supabase Storage, not R2).
 *
 * Usage (client component):
 *   const { signedUrl } = await createSignedUploadUrl('media', 'uploads/photo.jpg')
 *   await fetch(signedUrl, { method: 'PUT', body: file })
 */
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ signedUrl: string; token: string; path: string }> {
  await requireAdmin()

  const storage = getStorageProvider()
  return storage.createSignedUploadUrl(bucket, path)
}

/**
 * Returns the auth token + project URL needed by tus-js-client to perform
 * a TUS resumable upload directly to Supabase Storage.
 *
 * Use this for large files (audio WAVs up to 5 GB). The browser uploads
 * in 6 MB chunks directly to Supabase — never through a Next.js route.
 * Supabase Free Tier supports TUS up to 5 GB per file (vs 50 MB for PUT).
 *
 * Note: TUS is not supported on Cloudflare R2. This function always uses
 * Supabase Storage regardless of the STORAGE_PROVIDER setting.
 */
export async function getTusUploadCredentials(): Promise<{
  endpoint: string
  token: string
  bucketName: string
}> {
  await requireAdmin()

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Unauthorized')

  return {
    endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
    token: session.access_token,
    bucketName: 'audio-files',
  }
}
