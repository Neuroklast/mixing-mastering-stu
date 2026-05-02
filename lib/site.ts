/**
 * Site-wide constants – single source of truth for brand identity, SLA
 * commitments, and browser storage keys. Import from here instead of
 * scattering string literals throughout components.
 */

// ── Brand ─────────────────────────────────────────────────────────────────────
export const SITE_NAME = 'SONORATIVA'
export const SITE_TAGLINE = 'Professional Audio Engineering'

// ── Response / SLA ────────────────────────────────────────────────────────────
/** Promise shown to clients in the contact form confirmation toast. */
export const CONTACT_RESPONSE_PROMISE = "We'll respond within 24 hours."

// ── Browser storage keys ──────────────────────────────────────────────────────
/** localStorage key for GDPR cookie consent state. */
export const COOKIE_CONSENT_KEY = 'sonorativa-cookie-consent'

/** sessionStorage key for the iOS silent-switch audio hint dismissal. */
export const IOS_AUDIO_HINT_KEY = 'ios-audio-hint-dismissed'
