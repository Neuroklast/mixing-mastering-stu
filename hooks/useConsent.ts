'use client'

/**
 * Cookie-consent store – reads the persisted choice from localStorage and
 * notifies subscribers when it changes (same tab via `ConsentChanged`, other
 * tabs via `storage`).
 *
 * Implemented with `useSyncExternalStore` so both hooks are hydration-safe:
 * the server snapshot is always "no analytics / unknown", and React re-renders
 * with the real value after hydration. Reading localStorage inside an effect
 * with setState is intentionally avoided (react-hooks/set-state-in-effect).
 *
 * Usage:
 *   const { analytics } = useConsent()
 *   if (analytics) { ... }
 */

import { useSyncExternalStore } from 'react'
import { COOKIE_CONSENT_KEY } from '@/lib/site'

export interface ConsentState {
  analytics: boolean
}

/** `unknown` during SSR/hydration, then `stored` or `missing` on the client. */
export type ConsentStatus = 'unknown' | 'stored' | 'missing'

const NO_CONSENT: ConsentState = { analytics: false }

// ── Snapshot caches (referential stability for useSyncExternalStore) ──────────

let cachedConsentRaw: string | null | undefined
let cachedConsent: ConsentState = NO_CONSENT

let cachedStatusRaw: string | null | undefined
let cachedStatus: ConsentStatus = 'unknown'

function readRaw(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // Use window.localStorage explicitly: Node >= 25 exposes a global
    // localStorage that can shadow jsdom's implementation in tests.
    return window.localStorage.getItem(COOKIE_CONSENT_KEY)
  } catch {
    // localStorage blocked (private browsing) — treat as no stored consent
    return null
  }
}

function getConsentSnapshot(): ConsentState {
  const raw = readRaw()
  if (raw !== cachedConsentRaw) {
    cachedConsentRaw = raw
    cachedConsent = { analytics: raw === 'accepted' }
  }
  return cachedConsent
}

function getServerConsentSnapshot(): ConsentState {
  return NO_CONSENT
}

function getStatusSnapshot(): ConsentStatus {
  const raw = readRaw()
  if (raw !== cachedStatusRaw) {
    cachedStatusRaw = raw
    cachedStatus = raw === null ? 'missing' : 'stored'
  }
  return cachedStatus
}

function getServerStatusSnapshot(): ConsentStatus {
  return 'unknown'
}

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== COOKIE_CONSENT_KEY) return
    onStoreChange()
  }
  window.addEventListener('ConsentChanged', onStoreChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('ConsentChanged', onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** Analytics consent — false until the stored choice is known on the client. */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getConsentSnapshot, getServerConsentSnapshot)
}

/** Whether a consent choice has been persisted (see `ConsentStatus`). */
export function useConsentStatus(): ConsentStatus {
  return useSyncExternalStore(subscribe, getStatusSnapshot, getServerStatusSnapshot)
}
