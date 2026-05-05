'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const galleryInputSchema = z.object({
  image_url: z.string().url('Invalid image URL').max(2000).optional().or(z.literal('')),
  storage_path: z.string().max(1000).optional(),
  alt: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createGallery(formData: FormData) {
  await requireAdmin()

  const input = galleryInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').insert({
    image_url: input.data.image_url || null,
    storage_path: input.data.storage_path || null,
    alt: input.data.alt || null,
    caption: input.data.caption || null,
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[gallery] createGallery DB error:', error.message)
    throw new Error('Failed to save gallery image. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gallery')
  redirect('/admin/gallery')
}

export async function updateGallery(id: string, formData: FormData) {
  await requireAdmin()

  const input = galleryInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gallery')
    .update({
      image_url: input.data.image_url || null,
      storage_path: input.data.storage_path || null,
      alt: input.data.alt || null,
      caption: input.data.caption || null,
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[gallery] updateGallery DB error:', error.message)
    throw new Error('Failed to update gallery image. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gallery')
  redirect('/admin/gallery')
}

export async function deleteGallery(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) {
    console.error('[gallery] deleteGallery DB error:', error.message)
    throw new Error('Failed to delete gallery image. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/gallery')
}
