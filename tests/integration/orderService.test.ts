import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrderSchema } from '@/services/orderService'

describe('createOrderSchema', () => {
  it('accepts valid order input', () => {
    const validInput = {
      clientName: 'Max Mustermann',
      clientEmail: 'max@example.com',
      serviceType: 'mixing' as const,
      packageTier: 'starter' as const,
      totalPrice: 200,
    }
    const result = createOrderSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects empty client name', () => {
    const result = createOrderSchema.safeParse({
      clientName: '',
      clientEmail: 'test@example.com',
      serviceType: 'mixing',
      packageTier: 'starter',
      totalPrice: 200,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Name is required')
    }
  })

  it('rejects invalid email', () => {
    const result = createOrderSchema.safeParse({
      clientName: 'Test User',
      clientEmail: 'not-an-email',
      serviceType: 'mastering',
      packageTier: 'professional',
      totalPrice: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid service type', () => {
    const result = createOrderSchema.safeParse({
      clientName: 'Test',
      clientEmail: 'test@example.com',
      serviceType: 'invalid_service',
      packageTier: 'starter',
      totalPrice: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = createOrderSchema.safeParse({
      clientName: 'Test',
      clientEmail: 'test@example.com',
      serviceType: 'mixing',
      packageTier: 'starter',
      totalPrice: -50,
    })
    expect(result.success).toBe(false)
  })
})
