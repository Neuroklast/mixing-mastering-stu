'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

/** Valid site_content keys — prevents arbitrary keys from being upserted */
const VALID_KEYS = new Set([
  'hero_badge', 'hero_title_1', 'hero_title_2', 'hero_title_3',
  'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary',
  'about_title', 'about_body',
  'contact_email', 'contact_phone', 'contact_address',
  'social_instagram', 'social_soundcloud', 'social_spotify',
  'footer_tagline',
])

/**
 * Update all site_content key/value pairs from the form.
 * The form sends all keys as individual named inputs.
 */
export async function updateSiteContent(formData: FormData) {
  const supabase = createAdminClient()

  const updates: Array<{ key: string; value: string; updated_at: string }> = []
  for (const [key, value] of formData.entries()) {
    if (!VALID_KEYS.has(key)) continue
    updates.push({ key, value: String(value), updated_at: new Date().toISOString() })
  }

  if (updates.length === 0) redirect('/admin/content')

  const { error } = await supabase
    .from('site_content')
    .upsert(updates, { onConflict: 'key' })

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/content')
  redirect('/admin/content?saved=1')
}
