'use server'

import { createClient } from '@/lib/supabaseServer'
import { requireAdmin } from '@/app/admin/_actions/auth'

/**
 * Creates a signed upload URL so the browser can PUT the file directly to
 * Supabase Storage.  Audio files (≤75 MB) never pass through a Next.js route.
 *
 * Usage (client component):
 *   const { signedUrl } = await createSignedUploadUrl('audio-files', 'tracks/my-song.wav')
 *   await fetch(signedUrl, { method: 'PUT', body: file })
 */
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
): Promise<{ signedUrl: string; token: string; path: string }> {
  await requireAdmin()

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create signed upload URL')
  }

  return data
}
