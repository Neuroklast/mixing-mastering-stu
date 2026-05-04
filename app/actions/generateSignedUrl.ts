'use server'

import { z } from 'zod'
import { getStorageProvider } from '@/lib/storage'

const signedUrlSchema = z.object({
  storagePath: z.string().min(1, 'storagePath is required'),
  expiresInSeconds: z.number().int().min(60).max(86400).default(7200),
  bucket: z.string().default('audio-files'),
})

export type SignedUrlResult =
  | { success: true; signedUrl: string; expiresAt: string }
  | { success: false; error: string }

export const generateSignedUrl = async (
  rawInput: unknown,
): Promise<SignedUrlResult> => {
  const parsed = signedUrlSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { storagePath, expiresInSeconds, bucket } = parsed.data

  try {
    const storage = getStorageProvider()
    const signedUrl = await storage.createSignedDownloadUrl(bucket, storagePath, expiresInSeconds)
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    return { success: true, signedUrl, expiresAt }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate signed URL'
    return { success: false, error: message }
  }
}
