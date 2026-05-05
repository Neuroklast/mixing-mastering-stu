import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { z } from 'zod'
import type { AudioFile } from '@/types'
import { MOCK_FILES } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

export { type ServiceResult }

const ALLOWED_MIME_TYPES = ['audio/wav', 'audio/mpeg'] as const
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024

export const uploadFileSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Only WAV and MP3 files are supported' }),
  }),
  fileSizeBytes: z.number().max(MAX_FILE_SIZE_BYTES, 'File must not exceed 200 MB'),
})

const AUDIO_BUCKET = process.env.R2_BUCKET_AUDIO ?? 'sonorativa-audio'

const buildStoragePath = (orderId: string, fileName: string): string =>
  `orders/${orderId}/${Date.now()}-${fileName}`

export const uploadAudioFile = async (
  file: File,
  orderId: string,
): Promise<ServiceResult<{ publicUrl: string }>> => {
  const validationResult = uploadFileSchema.safeParse({
    orderId,
    mimeType: file.type,
    fileSizeBytes: file.size,
  })

  if (!validationResult.success) {
    return err(validationResult.error.errors.map((e) => e.message).join(', '))
  }

  if (isDev) {
    await new Promise((res) => setTimeout(res, 800))
    return ok({ publicUrl: '/demo/incinerate-mixdown.wav' })
  }

  const storage = getStorageProvider()
  const storagePath = buildStoragePath(orderId, file.name)

  try {
    await storage.uploadObject(AUDIO_BUCKET, storagePath, Buffer.from(await file.arrayBuffer()), file.type)
  } catch (storageError) {
    return err(storageError instanceof Error ? storageError.message : 'Upload failed')
  }

  // Audio files are private — return the storage path for later signed-URL generation
  const publicUrl = storage.getPublicUrl(AUDIO_BUCKET, storagePath)

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('files').insert({
    order_id: orderId,
    filename: file.name,
    storage_path: storagePath,
    public_url: publicUrl,
    file_size_bytes: file.size,
    mime_type: file.type as 'audio/wav' | 'audio/mpeg',
    type: 'original',
  })

  if (dbError) return err(dbError.message)

  return ok({ publicUrl })
}

export const getFilesByOrderId = async (
  orderId: string,
): Promise<ServiceResult<AudioFile[]>> => {
  if (!orderId) return err('orderId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    return ok(MOCK_FILES.filter((f) => f.order_id === orderId))
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) return err(error.message)
    // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
    return ok(data as AudioFile[])
  } catch (e) {
    console.error('[fileService] getFilesByOrderId failed:', e)
    return err('Failed to load files')
  }
}
