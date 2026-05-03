import { z } from 'zod'

export const siteContentSchema = z.record(z.string(), z.string())

export type SiteContent = z.infer<typeof siteContentSchema>

/** Default content values — matches the seed data in init_all.sql */
export const SITE_CONTENT_DEFAULTS: SiteContent = {
  hero_badge: 'Professional Audio Engineering',
  hero_title_1: 'PRECISION',
  hero_title_2: 'AUDIO',
  hero_title_3: 'ENGINEERING',
  hero_subtitle: 'Mixing & mastering for artists who care about every dB.',
  hero_cta_primary: 'Book a session',
  hero_cta_secondary: 'Hear the difference',
  about_title: 'Studio',
  about_body: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  footer_tagline: 'SONORATIVA — Professional Audio Engineering',
  social_instagram: '',
  social_soundcloud: '',
  social_spotify: '',
}
