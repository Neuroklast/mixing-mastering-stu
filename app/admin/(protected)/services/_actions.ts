'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/app/admin/_actions/auth'

// ── Input schema ───────────────────────────────────────────────────────────────

const serviceInputSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(5000).optional(),
  price_cents: z.coerce.number().int().min(0, 'Price must be non-negative'),
  currency: z.string().min(1).max(10).default('eur'),
  duration: z.string().max(200).optional(),
  features: z.string().max(10000).optional(),
  display_order: z.coerce.number().int().default(0),
  active: z.string().optional(),
})

function parseFeatures(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createService(formData: FormData) {
  await requireAdmin()

  const input = serviceInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('services').insert({
    slug: input.data.slug,
    title: input.data.title,
    description: input.data.description || null,
    price_cents: input.data.price_cents,
    currency: input.data.currency,
    duration: input.data.duration || null,
    features: parseFeatures(input.data.features),
    display_order: input.data.display_order,
    active: input.data.active === 'true',
  })
  if (error) {
    console.error('[services] createService DB error:', error.message)
    throw new Error('Failed to save service. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/services')
  redirect('/admin/services')
}

export async function updateService(id: string, formData: FormData) {
  await requireAdmin()

  const input = serviceInputSchema.safeParse(Object.fromEntries(formData))
  if (!input.success) {
    throw new Error(input.error.errors.map((e) => e.message).join(', '))
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('services')
    .update({
      slug: input.data.slug,
      title: input.data.title,
      description: input.data.description || null,
      price_cents: input.data.price_cents,
      currency: input.data.currency,
      duration: input.data.duration || null,
      features: parseFeatures(input.data.features),
      display_order: input.data.display_order,
      active: input.data.active === 'true',
    })
    .eq('id', id)
  if (error) {
    console.error('[services] updateService DB error:', error.message)
    throw new Error('Failed to update service. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/services')
  redirect('/admin/services')
}

export async function deleteService(id: string) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) {
    console.error('[services] deleteService DB error:', error.message)
    throw new Error('Failed to delete service. Please try again.')
  }
  revalidatePath('/')
  revalidatePath('/admin/services')
}
