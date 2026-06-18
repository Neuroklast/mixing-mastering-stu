'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

const soundpackInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().max(5000).optional(),
  price_cents: z.coerce.number().int().min(0, 'Price must be non-negative'),
  currency: z.string().min(1).max(10).default('eur'),
  genre: z.string().max(200).optional(),
  bpm_range: z.string().max(100).optional(),
  sample_count: z.coerce.number().int().min(0).optional().or(z.literal('')),
  cover_image_url: z.string().url('Invalid cover image URL').max(2000).optional().or(z.literal('')),
  cover_storage_path: z.string().max(1000).optional(),
  preview_storage_path: z.string().max(1000).optional(),
  shop_url: z.string().url('Invalid shop URL').max(500).optional().or(z.literal('')),
  featured: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

export async function createSoundpack(formData: FormData) {
  await requireAdmin()

  const input = soundpackInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('soundpacks').insert({
    name: input.data.name,
    description: input.data.description || null,
    price_cents: input.data.price_cents,
    currency: input.data.currency,
    genre: input.data.genre || null,
    bpm_range: input.data.bpm_range || null,
    sample_count: input.data.sample_count === '' || input.data.sample_count === undefined ? null : input.data.sample_count,
    cover_image_url: input.data.cover_image_url || null,
    cover_storage_path: input.data.cover_storage_path || null,
    preview_storage_path: input.data.preview_storage_path || null,
    shop_url: input.data.shop_url || null,
    featured: input.data.featured === 'true',
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[soundpacks] createSoundpack DB error:', error.message)
    throw new Error('Failed to save soundpack. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/soundpacks')
  redirect('/admin/soundpacks')
}

export async function updateSoundpack(id: string, formData: FormData) {
  await requireAdmin()

  const input = soundpackInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('soundpacks')
    .update({
      name: input.data.name,
      description: input.data.description || null,
      price_cents: input.data.price_cents,
      currency: input.data.currency,
      genre: input.data.genre || null,
      bpm_range: input.data.bpm_range || null,
      sample_count: input.data.sample_count === '' || input.data.sample_count === undefined ? null : input.data.sample_count,
      cover_image_url: input.data.cover_image_url || null,
      cover_storage_path: input.data.cover_storage_path || null,
      preview_storage_path: input.data.preview_storage_path || null,
      shop_url: input.data.shop_url || null,
      featured: input.data.featured === 'true',
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[soundpacks] updateSoundpack DB error:', error.message)
    throw new Error('Failed to update soundpack. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/soundpacks')
  redirect('/admin/soundpacks')
}

export async function deleteSoundpack(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('soundpacks').delete().eq('id', id)
  if (error) {
    console.error('[soundpacks] deleteSoundpack DB error:', error.message)
    throw new Error('Failed to delete soundpack. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/soundpacks')
}
