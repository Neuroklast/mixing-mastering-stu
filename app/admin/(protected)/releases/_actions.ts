'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const releaseInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  artist: z.string().max(300).optional(),
  release_type: z.enum(['album', 'ep', 'single', 'compilation']).default('album'),
  release_date: z.string().optional(),
  label: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  cover_image_url: z.string().url('Invalid cover image URL').max(2000).optional().or(z.literal('')),
  cover_storage_path: z.string().max(1000).optional(),
  spotify_url: z.string().url('Invalid Spotify URL').max(500).optional().or(z.literal('')),
  bandcamp_url: z.string().url('Invalid Bandcamp URL').max(500).optional().or(z.literal('')),
  youtube_url: z.string().url('Invalid YouTube URL').max(500).optional().or(z.literal('')),
  featured: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createRelease(formData: FormData) {
  await requireAdmin()

  const input = releaseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('releases').insert({
    title: input.data.title,
    artist: input.data.artist || null,
    release_type: input.data.release_type,
    release_date: input.data.release_date?.trim() || null,
    label: input.data.label || null,
    description: input.data.description || null,
    cover_image_url: input.data.cover_image_url || null,
    cover_storage_path: input.data.cover_storage_path || null,
    spotify_url: input.data.spotify_url || null,
    bandcamp_url: input.data.bandcamp_url || null,
    youtube_url: input.data.youtube_url || null,
    featured: input.data.featured === 'true',
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[releases] createRelease DB error:', error.message)
    throw new Error('Failed to save release. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/releases')
  redirect('/admin/releases')
}

export async function updateRelease(id: string, formData: FormData) {
  await requireAdmin()

  const input = releaseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('releases')
    .update({
      title: input.data.title,
      artist: input.data.artist || null,
      release_type: input.data.release_type,
      release_date: input.data.release_date?.trim() || null,
      label: input.data.label || null,
      description: input.data.description || null,
      cover_image_url: input.data.cover_image_url || null,
      cover_storage_path: input.data.cover_storage_path || null,
      spotify_url: input.data.spotify_url || null,
      bandcamp_url: input.data.bandcamp_url || null,
      youtube_url: input.data.youtube_url || null,
      featured: input.data.featured === 'true',
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[releases] updateRelease DB error:', error.message)
    throw new Error('Failed to update release. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/releases')
  redirect('/admin/releases')
}

export async function deleteRelease(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('releases').delete().eq('id', id)
  if (error) {
    console.error('[releases] deleteRelease DB error:', error.message)
    throw new Error('Failed to delete release. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/releases')
}
