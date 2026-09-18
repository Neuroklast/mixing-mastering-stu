import { describe, it, expect } from 'vitest'
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/schemas/auth'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'admin@example.com' }).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an empty email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const valid = {
    password: 'supersecret',
    confirmPassword: 'supersecret',
  }

  it('accepts matching passwords with 8+ characters', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects passwords shorter than 8 characters', () => {
    const r = resetPasswordSchema.safeParse({ password: 'short', confirmPassword: 'short' })
    expect(r.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const r = resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'different' })
    expect(r.success).toBe(false)
  })

  it('rejects an empty confirmation', () => {
    const r = resetPasswordSchema.safeParse({ ...valid, confirmPassword: '' })
    expect(r.success).toBe(false)
  })
})
