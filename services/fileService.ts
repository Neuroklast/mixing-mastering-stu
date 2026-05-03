import { createClient } from '@/lib/supabaseServer'
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

  const supabase = await createClient()
  const storagePath = buildStoragePath(orderId, file.name)

  const { error: storageError } = await supabase.storage
    .from('audio-files')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (storageError) return err(storageError.message)

  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl(storagePath)

  const { error: dbError } = await supabase.from('files').insert({
    order_id: orderId,
    filename: file.name,
    storage_path: storagePath,
    public_url: urlData.publicUrl,
    file_size_bytes: file.size,
    mime_type: file.type as 'audio/wav' | 'audio/mpeg',
    type: 'original',
  })

  if (dbError) return err(dbError.message)

  return ok({ publicUrl: urlData.publicUrl })
}

export const getFilesByOrderId = async (
  orderId: string,
): Promise<ServiceResult<AudioFile[]>> => {
  if (!orderId) return err('orderId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    return ok(MOCK_FILES.filter((f) => f.order_id === orderId))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return err(error.message)
  // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
  return ok(data as AudioFile[])
}
