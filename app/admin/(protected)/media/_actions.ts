'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function deleteMediaFile(bucket: string, path: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/media')
}
