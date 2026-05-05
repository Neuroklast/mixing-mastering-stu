'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getStorageProvider } from '@/lib/storage'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Allowed buckets whitelist ──────────────────────────────────────────────────
const ALLOWED_BUCKETS = new Set([
  process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media',
  process.env.R2_BUCKET_AUDIO ?? 'sonorativa-audio',
])

// ── Input validation ───────────────────────────────────────────────────────────
const deleteMediaSchema = z.object({
  bucket: z.string().refine((b) => ALLOWED_BUCKETS.has(b), {
    message: 'Invalid bucket',
  }),
  path: z
    .string()
    .min(1, 'Path is required')
    .max(1000)
    // Prevent path traversal: no ".." segments, no leading slash
    .refine((p) => !p.includes('..'), { message: 'Invalid path' })
    .refine((p) => !p.startsWith('/'), { message: 'Invalid path' }),
})

// ── Action ─────────────────────────────────────────────────────────────────────

export async function deleteMediaFile(bucket: string, path: string) {
  await requireAdmin()

  const input = deleteMediaSchema.safeParse({ bucket, path })
  if (!input.success) {
    throw new Error('Invalid request: ' + input.error.errors.map((e) => e.message).join(', '))
  }

  const storage = getStorageProvider()
  try {
    await storage.deleteObject(input.data.bucket, input.data.path)
  } catch (e) {
    console.error('[media] deleteMediaFile failed:', e)
    throw new Error('Failed to delete file. Please try again.')
  }

  revalidatePath('/admin/media')
}
