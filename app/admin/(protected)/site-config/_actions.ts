'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const KNOWN_KEYS = [
  'site_name',
  'tagline',
  'booking_email',
  'merch_shop_url',
  'bandcamp_url',
  'spotify_artist_url',
  'youtube_channel_url',
  'soundcloud_url',
  'facebook_url',
  'instagram_url',
  'meta_description',
] as const

const siteConfigSchema = z.object({
  site_name: z.string().max(300).optional(),
  tagline: z.string().max(1000).optional(),
  booking_email: z.string().email('Invalid email').max(300).optional().or(z.literal('')),
  merch_shop_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  bandcamp_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  spotify_artist_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  youtube_channel_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  soundcloud_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  facebook_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  instagram_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  meta_description: z.string().max(500).optional(),
})

export async function saveSiteConfig(formData: FormData) {
  await requireAdmin()

  const raw: Record<string, string> = {}
  for (const key of KNOWN_KEYS) {
    raw[key] = String(formData.get(key) ?? '')
  }

  const input = siteConfigSchema.safeParse(raw)
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()

  const upserts = KNOWN_KEYS.map((key) => ({
    key,
    value: String((input.data as Record<string, string | undefined>)[key] ?? ''),
  }))

  const { error } = await supabase
    .from('site_config')
    .upsert(upserts, { onConflict: 'key' })

  if (error) {
    console.error('[site_config] saveSiteConfig DB error:', error.message)
    throw new Error('Failed to save site config. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/site-config')
  redirect('/admin/site-config')
}
