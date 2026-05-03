'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'

function parseFeatures(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export async function createService(formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('services').insert({
    slug: formData.get('slug'),
    title: formData.get('title'),
    description: formData.get('description') || null,
    price_cents: Number(formData.get('price_cents') ?? 0),
    currency: formData.get('currency') || 'eur',
    duration: formData.get('duration') || null,
    features: parseFeatures(formData.get('features') as string | null),
    display_order: Number(formData.get('display_order') ?? 0),
    active: formData.get('active') === 'true',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/services')
  redirect('/admin/services')
}

export async function updateService(id: string, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('services')
    .update({
      slug: formData.get('slug'),
      title: formData.get('title'),
      description: formData.get('description') || null,
      price_cents: Number(formData.get('price_cents') ?? 0),
      currency: formData.get('currency') || 'eur',
      duration: formData.get('duration') || null,
      features: parseFeatures(formData.get('features') as string | null),
      display_order: Number(formData.get('display_order') ?? 0),
      active: formData.get('active') === 'true',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/services')
  redirect('/admin/services')
}

export async function deleteService(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/services')
}
