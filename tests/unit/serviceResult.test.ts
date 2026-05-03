import { describe, it, expect } from 'vitest'
import { ok, err } from '@/lib/serviceResult'

describe('serviceResult helpers', () => {
  it('ok() returns success:true with data', () => {
    const result = ok({ id: '1' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: '1' })
  })

  it('err() returns success:false with error message', () => {
    const result = err('Something went wrong')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Something went wrong')
  })
})
