import { createClient } from '@/lib/supabaseServer'
import { z } from 'zod'
import type { AudioFile } from '@/types'

const ALLOWED_MIME_TYPES = ['audio/wav', 'audio/mpeg'] as const
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024

export const uploadFileSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Only WAV and MP3 files are supported' }),
  }),
  fileSizeBytes: z.number().max(MAX_FILE_SIZE_BYTES, 'File must not exceed 200 MB'),
})

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

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
    return {
      success: false,
      error: validationResult.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()
  const storagePath = buildStoragePath(orderId, file.name)

  const { error: storageError } = await supabase.storage
    .from('audio-files')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (storageError) return { success: false, error: storageError.message }

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

  if (dbError) return { success: false, error: dbError.message }

  return { success: true, data: { publicUrl: urlData.publicUrl } }
}

export const getFilesByOrderId = async (
  orderId: string,
): Promise<ServiceResult<AudioFile[]>> => {
  if (!orderId) return { success: false, error: 'orderId is required' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as AudioFile[] }
}
