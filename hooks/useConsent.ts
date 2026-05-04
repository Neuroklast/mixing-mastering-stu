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
  const [consent, setConsent] = useState<ConsentState>(readConsent)

  useEffect(() => {
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
