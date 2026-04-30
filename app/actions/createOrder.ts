'use server'

import { createOrder as createOrderInDb, createOrderSchema } from '@/services/orderService'

export type CreateOrderActionResult =
  | { success: true; orderId: string }
  | { success: false; error: string }

export const createOrderAction = async (
  rawInput: unknown,
): Promise<CreateOrderActionResult> => {
  const parsed = createOrderSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const result = await createOrderInDb(parsed.data)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, orderId: result.data.orderId }
}
