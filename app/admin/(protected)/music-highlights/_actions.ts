'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const highlightInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  artist: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  image_url: z.string().url('Invalid image URL').max(2000).optional().or(z.literal('')),
  image_storage_path: z.string().max(1000).optional(),
  spotify_url: z.string().url('Invalid Spotify URL').max(500).optional().or(z.literal('')),
  youtube_url: z.string().url('Invalid YouTube URL').max(500).optional().or(z.literal('')),
  bandcamp_url: z.string().url('Invalid Bandcamp URL').max(500).optional().or(z.literal('')),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createHighlight(formData: FormData) {
  await requireAdmin()

  const input = highlightInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').insert({
    title: input.data.title,
    artist: input.data.artist || null,
    description: input.data.description || null,
    image_url: input.data.image_url || null,
    image_storage_path: input.data.image_storage_path || null,
    spotify_url: input.data.spotify_url || null,
    youtube_url: input.data.youtube_url || null,
    bandcamp_url: input.data.bandcamp_url || null,
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[music_highlights] createHighlight DB error:', error.message)
    throw new Error('Failed to save highlight. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/music-highlights')
  redirect('/admin/music-highlights')
}

export async function updateHighlight(id: string, formData: FormData) {
  await requireAdmin()

  const input = highlightInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('music_highlights')
    .update({
      title: input.data.title,
      artist: input.data.artist || null,
      description: input.data.description || null,
      image_url: input.data.image_url || null,
      image_storage_path: input.data.image_storage_path || null,
      spotify_url: input.data.spotify_url || null,
      youtube_url: input.data.youtube_url || null,
      bandcamp_url: input.data.bandcamp_url || null,
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[music_highlights] updateHighlight DB error:', error.message)
    throw new Error('Failed to update highlight. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/music-highlights')
  redirect('/admin/music-highlights')
}

export async function deleteHighlight(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').delete().eq('id', id)
  if (error) {
    console.error('[music_highlights] deleteHighlight DB error:', error.message)
    throw new Error('Failed to delete highlight. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/music-highlights')
}
