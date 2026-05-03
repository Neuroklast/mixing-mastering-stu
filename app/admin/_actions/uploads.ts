'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'

export async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<{ storagePath: string } | { error: string }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (error) return { error: error.message }
    return { storagePath: data.path }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed' }
  }
}
