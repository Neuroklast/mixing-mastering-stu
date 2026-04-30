'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabaseServer'

const orderSchema = z.object({
  client_name: z.string().min(1, 'Name is required'),
  client_email: z.string().email('Invalid email'),
  service_type: z.enum(['mixing', 'mastering', 'mixing_mastering']),
  package_tier: z.enum(['starter', 'professional', 'premium']),
  notes: z.string().optional(),
  total_price: z.number().min(0),
})

export async function createOrder(
  input: z.infer<typeof orderSchema>,
): Promise<{ success: true; orderId: string } | { success: false; error: string }> {
  const parsed = orderSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      service_type: parsed.data.service_type,
      package_tier: parsed.data.package_tier,
      notes: parsed.data.notes ?? null,
      total_price: parsed.data.total_price,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, orderId: data.id }
}
