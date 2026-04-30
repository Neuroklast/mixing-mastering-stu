'use server'

import { uploadAudioFile } from '@/services/fileService'

export type UploadAudioResult =
  | { success: true; url: string }
  | { success: false; error: string }

export const uploadAudio = async (formData: FormData): Promise<UploadAudioResult> => {
  const file = formData.get('file')
  const orderId = formData.get('orderId')

  if (!(file instanceof File)) return { success: false, error: 'No file provided' }
  if (typeof orderId !== 'string' || !orderId) {
    return { success: false, error: 'No orderId provided' }
  }

  const serviceResult = await uploadAudioFile(file, orderId)

  if (!serviceResult.success) return { success: false, error: serviceResult.error }
  return { success: true, url: serviceResult.data.publicUrl }
}
