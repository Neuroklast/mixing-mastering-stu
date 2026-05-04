'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

/** Valid site_content keys — prevents arbitrary keys from being upserted */
const VALID_KEYS = new Set([
  'hero_badge', 'hero_title_1', 'hero_title_2', 'hero_title_3',
  'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary',
  'about_title', 'about_body',
  'contact_email', 'contact_phone', 'contact_address',
  'social_instagram', 'social_soundcloud', 'social_spotify',
  'footer_tagline',
])

const MAX_VALUE_LENGTH = 2000

/**
 * Update all site_content key/value pairs from the form.
 * The form sends all keys as individual named inputs.
 */
export async function updateSiteContent(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const updates: Array<{ key: string; value: string; updated_at: string }> = []
  for (const [key, value] of formData.entries()) {
    if (!VALID_KEYS.has(key)) continue
    const safeValue = String(value).slice(0, MAX_VALUE_LENGTH)
    updates.push({ key, value: safeValue, updated_at: new Date().toISOString() })
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
