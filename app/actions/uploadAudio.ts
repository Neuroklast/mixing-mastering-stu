'use server'

import { createClient } from '@/lib/supabaseServer'

export async function uploadAudio(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const file = formData.get('file') as File | null
  const orderId = formData.get('orderId') as string | null

  if (!file) return { success: false, error: 'No file provided' }
  if (!orderId) return { success: false, error: 'No orderId provided' }

  const allowedTypes = ['audio/wav', 'audio/mpeg']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only WAV and MP3 files are allowed' }
  }

  const maxBytes = 200 * 1024 * 1024 // 200 MB
  if (file.size > maxBytes) {
    return { success: false, error: 'File exceeds 200 MB limit' }
  }

  const supabase = await createClient()

  const timestamp = Date.now()
  const storagePath = `orders/${orderId}/${timestamp}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('audio-files')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('audio-files').getPublicUrl(storagePath)

  const { error: dbError } = await supabase.from('files').insert({
    order_id: orderId,
    filename: file.name,
    storage_path: storagePath,
    public_url: publicUrl,
    file_size_bytes: file.size,
    mime_type: file.type as 'audio/wav' | 'audio/mpeg',
    type: 'original',
  })

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  return { success: true, url: publicUrl }
}
