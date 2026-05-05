'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const legalInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string().min(1, 'Content is required'),
  last_updated: z.string().optional(),
})

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createLegal(formData: FormData) {
  await requireAdmin()

  const input = legalInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('legal').insert({
    title: input.data.title,
    slug: input.data.slug,
    content: input.data.content,
    last_updated: input.data.last_updated?.trim() || new Date().toISOString().slice(0, 10),
  })
  if (error) {
    console.error('[legal] createLegal DB error:', error.message)
    throw new Error('Failed to save legal page. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/legal')
  redirect('/admin/legal')
}

export async function updateLegal(id: string, formData: FormData) {
  await requireAdmin()

  const input = legalInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('legal')
    .update({
      title: input.data.title,
      slug: input.data.slug,
      content: input.data.content,
      last_updated: input.data.last_updated?.trim() || new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
  if (error) {
    console.error('[legal] updateLegal DB error:', error.message)
    throw new Error('Failed to update legal page. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/legal')
  redirect('/admin/legal')
}

export async function deleteLegal(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('legal').delete().eq('id', id)
  if (error) {
    console.error('[legal] deleteLegal DB error:', error.message)
    throw new Error('Failed to delete legal page. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/legal')
}
