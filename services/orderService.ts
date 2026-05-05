import { createClient } from '@/lib/supabaseServer'
import { z } from 'zod'
import type { Order } from '@/types'
import { MOCK_ORDERS } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { sendEmail } from '@/lib/email'
import {
  orderConfirmationTemplate,
  adminOrderNotificationTemplate,
} from '@/lib/email/templates'

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

  const orderId = data.id
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.CONTACT_FROM_EMAIL

  // Send confirmation to client and notification to admin (best-effort)
  try {
    const { subject: cSubject, html: cHtml, text: cText } = orderConfirmationTemplate({
      clientName: parsed.data.clientName,
      service: parsed.data.serviceType,
      orderId,
      siteUrl,
    })
    await sendEmail({ to: parsed.data.clientEmail, subject: cSubject, html: cHtml, text: cText })
  } catch (emailErr) {
    console.error('[order] Failed to send confirmation email:', emailErr)
  }

  if (adminEmail) {
    try {
      const { subject: aSubject, html: aHtml, text: aText } = adminOrderNotificationTemplate({
        clientName: parsed.data.clientName,
        clientEmail: parsed.data.clientEmail,
        service: parsed.data.serviceType,
        orderId,
        notes: parsed.data.notes,
        adminUrl: `${siteUrl}/admin/orders`,
      })
      await sendEmail({ to: adminEmail, subject: aSubject, html: aHtml, text: aText })
    } catch (emailErr) {
      console.error('[order] Failed to send admin notification:', emailErr)
    }
  }

  return ok({ orderId })
}

export const getOrderById = async (orderId: string): Promise<ServiceResult<Order>> => {
  if (!orderId) return err('orderId is required')

  if (isDev) {
    await new Promise((res) => setTimeout(res, 300))
    const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0]
    return ok(order)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) return err(error.message)
    // Cast needed due to @supabase/ssr generic type incompatibility (see lib/supabaseServer.ts)
    return ok(data as Order)
  } catch (e) {
    console.error('[orderService] getOrderById failed:', e)
    return err('Failed to fetch order')
  }
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

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) return err(error.message)
    return ok(undefined)
  } catch (e) {
    console.error('[orderService] updateOrderStatus failed:', e)
    return err('Failed to update order status')
  }
}
