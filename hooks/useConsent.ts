'use client'

/**
 * useConsent hook – reads cookie consent from localStorage and listens for
 * ConsentChangedEvent dispatched by CookieBanner when the user accepts/declines.
 *
 * Usage:
 *   const { analytics } = useConsent()
 *   if (analytics) { ... }
 */

import { useState, useEffect } from 'react'
import { COOKIE_CONSENT_KEY } from '@/lib/site'

export interface ConsentState {
  analytics: boolean
}

function readConsent(): ConsentState {
  if (typeof window === 'undefined') return { analytics: false }
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY)
    return { analytics: value === 'accepted' }
  } catch {
    return { analytics: false }
  }
}

export function useConsent(): ConsentState {
  // Start with analytics:false on both server and client to avoid a hydration
  // mismatch: the server always renders AnalyticsProvider as null, and the
  // first client render must match. The useEffect then reads the real value.
  const [consent, setConsent] = useState<ConsentState>({ analytics: false })

  useEffect(() => {
    // Read localStorage only after mount (client-only), then subscribe.
    setConsent(readConsent())
    const handler = () => setConsent(readConsent())
    window.addEventListener('ConsentChanged', handler)
    // Also check on storage changes from other tabs
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('ConsentChanged', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  return consent
}
