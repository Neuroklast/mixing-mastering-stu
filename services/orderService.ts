import { createClient } from '@/lib/supabaseServer'
import { z } from 'zod'
import type { Order } from '@/types'
import { MOCK_ORDERS } from '@/lib/mockData'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export const createOrderSchema = z.object({
  clientName: z.string().min(1, 'Name is required'),
  clientEmail: z.string().email('Invalid email address'),
  serviceType: z.enum(['mixing', 'mastering', 'mixing_mastering']),
  packageTier: z.enum(['starter', 'professional', 'premium']),
  notes: z.string().optional(),
  totalPrice: z.number().min(0),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export const createOrder = async (
  input: CreateOrderInput,
): Promise<ServiceResult<{ orderId: string }>> => {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  if (isDev) {
    await new Promise((res) => setTimeout(res, 500))
    return { success: true, data: { orderId: 'mock-order-1' } }
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

  if (error) return { success: false, error: error.message }
  return { success: true, data: { orderId: data.id } }
}

export const getOrderById = async (orderId: string): Promise<ServiceResult<Order>> => {
  if (!orderId) return { success: false, error: 'orderId is required' }

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0]
    return { success: true, data: order }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Order }
}

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
): Promise<ServiceResult<void>> => {
  if (!orderId) return { success: false, error: 'orderId is required' }

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    return { success: true, data: undefined }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}
