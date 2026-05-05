'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const showcaseInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  artist: z.string().max(300).optional(),
  genre: z.string().max(200).optional(),
  equipment: z.string().max(1000).optional(),
  label_before: z.string().max(100).optional(),
  label_after: z.string().max(100).optional(),
  start_marker: z.coerce.number().min(0).default(0),
  lufs_target: z.coerce.number().default(-14),
  before_storage_path: z.string().max(1000).optional(),
  after_storage_path: z.string().max(1000).optional(),
  active: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createShowcase(formData: FormData) {
  await requireAdmin()

  const input = showcaseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('showcase').insert({
    title: input.data.title,
    artist: input.data.artist || null,
    genre: input.data.genre || null,
    equipment: input.data.equipment || null,
    label_before: input.data.label_before || 'Demo',
    label_after: input.data.label_after || 'Final',
    start_marker: input.data.start_marker,
    lufs_target: input.data.lufs_target,
    before_storage_path: input.data.before_storage_path || null,
    after_storage_path: input.data.after_storage_path || null,
    active: input.data.active === 'true',
    display_order: input.data.display_order,
  })
  if (error) {
    console.error('[showcase] createShowcase DB error:', error.message)
    throw new Error('Failed to save showcase track. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/showcase')
  redirect('/admin/showcase')
}

export async function updateShowcase(id: string, formData: FormData) {
  await requireAdmin()

  const input = showcaseInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('showcase')
    .update({
      title: input.data.title,
      artist: input.data.artist || null,
      genre: input.data.genre || null,
      equipment: input.data.equipment || null,
      label_before: input.data.label_before || 'Demo',
      label_after: input.data.label_after || 'Final',
      start_marker: input.data.start_marker,
      lufs_target: input.data.lufs_target,
      before_storage_path: input.data.before_storage_path || null,
      after_storage_path: input.data.after_storage_path || null,
      active: input.data.active === 'true',
      display_order: input.data.display_order,
    })
    .eq('id', id)
  if (error) {
    console.error('[showcase] updateShowcase DB error:', error.message)
    throw new Error('Failed to update showcase track. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/showcase')
  redirect('/admin/showcase')
}

export async function deleteShowcase(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('showcase').delete().eq('id', id)
  if (error) {
    console.error('[showcase] deleteShowcase DB error:', error.message)
    throw new Error('Failed to delete showcase track. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/showcase')
}
