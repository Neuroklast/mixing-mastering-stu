import { describe, it, expect } from 'vitest'
import { SITE_CONTENT_DEFAULTS } from '@/lib/schemas/siteContent'

describe('SITE_CONTENT_DEFAULTS', () => {
  it('has hero_model_url defaulting to the bundled GLB path', () => {
    expect(SITE_CONTENT_DEFAULTS.hero_model_url).toBe('/video/3d_hero_model.glb')
  })

  it('has favicon_url defaulting to an empty string', () => {
    expect(SITE_CONTENT_DEFAULTS.favicon_url).toBe('')
  })

  it('has all required hero keys', () => {
    const requiredKeys = [
      'hero_badge', 'hero_title_1', 'hero_title_2', 'hero_title_3',
      'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary', 'hero_model_url',
    ]
    for (const key of requiredKeys) {
      expect(Object.prototype.hasOwnProperty.call(SITE_CONTENT_DEFAULTS, key)).toBe(true)
    }
  })
})
