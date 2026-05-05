'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const creditInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  role: z.enum(['Mix', 'Master', 'Mix & Master', 'Producing'], {
    errorMap: () => ({ message: 'Role must be one of: Mix, Master, Mix & Master, Producing' }),
  }),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
  spotify_url: z.string().url('Invalid Spotify URL').max(500).optional().or(z.literal('')),
  cover_image_url: z.string().url('Invalid cover image URL').max(2000).optional().or(z.literal('')),
  cover_storage_path: z.string().max(1000).optional(),
  featured: z.string().optional(),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createCredit(formData: FormData) {
  await requireAdmin()

  const input = creditInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('credits').insert({
    name: input.data.name,
    role: input.data.role,
    year: input.data.year === '' || input.data.year === undefined ? null : input.data.year,
    spotify_url: input.data.spotify_url || null,
    cover_image_url: input.data.cover_image_url || null,
    cover_storage_path: input.data.cover_storage_path || null,
    featured: input.data.featured === 'true',
  })
  if (error) {
    console.error('[credits] createCredit DB error:', error.message)
    throw new Error('Failed to save credit. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/credits')
  redirect('/admin/credits')
}

export async function updateCredit(id: string, formData: FormData) {
  await requireAdmin()

  const input = creditInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('credits')
    .update({
      name: input.data.name,
      role: input.data.role,
      year: input.data.year === '' || input.data.year === undefined ? null : input.data.year,
      spotify_url: input.data.spotify_url || null,
      cover_image_url: input.data.cover_image_url || null,
      cover_storage_path: input.data.cover_storage_path || null,
      featured: input.data.featured === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[credits] updateCredit DB error:', error.message)
    throw new Error('Failed to update credit. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/credits')
  redirect('/admin/credits')
}

export async function deleteCredit(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('credits').delete().eq('id', id)
  if (error) {
    console.error('[credits] deleteCredit DB error:', error.message)
    throw new Error('Failed to delete credit. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/credits')
}
