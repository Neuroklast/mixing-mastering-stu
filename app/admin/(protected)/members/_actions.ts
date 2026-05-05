'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const memberInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  role: z.string().min(1, 'Role is required').max(300),
  bio: z.string().max(5000).optional(),
  photo_url: z.string().url('Invalid photo URL').max(2000).optional().or(z.literal('')),
  photo_storage_path: z.string().max(1000).optional(),
  social_instagram: z.string().max(500).optional(),
  social_soundcloud: z.string().max(500).optional(),
  social_spotify: z.string().max(500).optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
  featured: z.string().optional(),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createMember(formData: FormData) {
  await requireAdmin()

  const input = memberInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('members').insert({
    name: input.data.name,
    role: input.data.role,
    bio: input.data.bio || null,
    photo_url: input.data.photo_url || null,
    photo_storage_path: input.data.photo_storage_path || null,
    social_links: {
      instagram: input.data.social_instagram ?? '',
      soundcloud: input.data.social_soundcloud ?? '',
      spotify: input.data.social_spotify ?? '',
    },
    display_order: input.data.display_order,
    active: input.data.active === 'true',
    featured: input.data.featured === 'true',
  })
  if (error) {
    console.error('[members] createMember DB error:', error.message)
    throw new Error('Failed to save member. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function updateMember(id: string, formData: FormData) {
  await requireAdmin()

  const input = memberInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('members')
    .update({
      name: input.data.name,
      role: input.data.role,
      bio: input.data.bio || null,
      photo_url: input.data.photo_url || null,
      photo_storage_path: input.data.photo_storage_path || null,
      social_links: {
        instagram: input.data.social_instagram ?? '',
        soundcloud: input.data.social_soundcloud ?? '',
        spotify: input.data.social_spotify ?? '',
      },
      display_order: input.data.display_order,
      active: input.data.active === 'true',
      featured: input.data.featured === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[members] updateMember DB error:', error.message)
    throw new Error('Failed to update member. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function deleteMember(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) {
    console.error('[members] deleteMember DB error:', error.message)
    throw new Error('Failed to delete member. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/members')
}
