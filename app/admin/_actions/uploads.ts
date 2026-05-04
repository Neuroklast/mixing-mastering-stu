'use server'

import { requireAdmin } from '@/app/admin/_actions/auth'
import { getStorageProvider } from '@/lib/storage'

/**
 * Creates a signed upload URL so the browser can PUT the file directly to
 * Cloudflare R2. Use this for images and small files (≤ 100 MB).
 * For large audio files (WAV/MP3), use the S3 multipart upload flow via
 * useR2MultipartUpload hook and app/admin/_actions/r2Multipart.ts.
 *
 * Usage (client component):
 *   const { signedUrl } = await createSignedUploadUrl('sonorativa-media', 'uploads/photo.jpg')
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
 * Returns the public URL for an object in a public R2 bucket.
 * Call this after a successful upload to get the URL to display/store.
 */
export async function getPublicStorageUrl(bucket: string, path: string): Promise<string> {
  await requireAdmin()

  const storage = getStorageProvider()
  return storage.getPublicUrl(bucket, path)
}

