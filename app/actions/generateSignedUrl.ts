'use server'

import { createClient } from '@/lib/supabaseServer'
import { z } from 'zod'

const signedUrlSchema = z.object({
  storagePath: z.string().min(1, 'storagePath is required'),
  expiresInSeconds: z.number().int().min(60).max(86400).default(7200),
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

  const { storagePath, expiresInSeconds } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    return { success: false, error: error?.message ?? 'Failed to generate signed URL' }
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  return { success: true, signedUrl: data.signedUrl, expiresAt }
}
