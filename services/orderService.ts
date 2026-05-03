import { createClient } from '@/lib/supabaseServer'
import { z } from 'zod'
import type { Order } from '@/types'
import { MOCK_ORDERS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

export { type ServiceResult }

export const createOrderSchema = z.object({
  clientName: z.string().min(1, 'Name is required'),
  clientEmail: z.string().email('Invalid email address'),
  serviceType: z.enum(['mixing', 'mastering', 'mixing_mastering']),
  packageTier: z.enum(['starter', 'professional', 'premium']),
  notes: z.string().optional(),
  totalPrice: z.number().min(0),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const createOrder = async (
  input: CreateOrderInput,
): Promise<ServiceResult<{ orderId: string }>> => {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return err(parsed.error.errors.map((e) => e.message).join(', '))
  }

  if (isDev) {
    await new Promise((res) => setTimeout(res, 500))
    return ok({ orderId: 'mock-order-1' })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_name: parsed.data.clientName,
      client_email: parsed.data.clientEmail,
      service_type: parsed.data.serviceType,
      package_tier: parsed.data.packageTier,
      notes: parsed.data.notes ?? null,
      total_price: parsed.data.totalPrice,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return err(error.message)
  return ok({ orderId: data.id })
}

export const getOrderById = async (orderId: string): Promise<ServiceResult<Order>> => {
  if (!orderId) return err('orderId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0]
    return ok(order)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) return err(error.message)
  // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
  return ok(data as Order)
}

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
): Promise<ServiceResult<void>> => {
  if (!orderId) return err('orderId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    return ok(undefined)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return err(error.message)
  return ok(undefined)
}
