'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabaseAdmin'

/**
 * Update all site_content key/value pairs from the form.
 * The form sends all keys as individual named inputs.
 */
export async function updateSiteContent(formData: FormData) {
  const supabase = createAdminClient()

  const updates: Array<{ key: string; value: string; updated_at: string }> = []
  for (const [key, value] of formData.entries()) {
    updates.push({ key, value: String(value), updated_at: new Date().toISOString() })
  }

  const { error } = await supabase
    .from('site_content')
    .upsert(updates, { onConflict: 'key' })

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/content')
}
