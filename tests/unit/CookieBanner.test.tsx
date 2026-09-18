// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { COOKIE_CONSENT_KEY } from '@/lib/site'

// ---------------------------------------------------------------------------
// We stub out Next.js Link and the icon + button components so the test does
// not need the full Next.js rendering pipeline.
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))
vi.mock('@phosphor-icons/react', () => ({ X: () => React.createElement('span', null, 'X') }))
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement('button', { onClick }, children),
}))
vi.mock('@/lib/utils', () => ({ cn: (...c: string[]) => c.filter(Boolean).join(' ') }))

// Import the component AFTER mocks are set up.
const { CookieBanner } = await import('@/components/features/CookieBanner')

// ---------------------------------------------------------------------------

describe('CookieBanner hydration safety', () => {
  beforeEach(() => {
    // Use window.localStorage: Node >= 25 exposes a global localStorage that
    // can shadow jsdom's implementation.
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders empty output in SSR context — no SSR/client mismatch', () => {
    // Use React's server renderer (no effects run) to simulate what the server
    // produces.  useConsentStatus() returns the server snapshot `unknown`, so
    // the component returns null → SSR emits no HTML for the banner.  The first
    // hydration render uses the same snapshot, so the markup matches.
    const html = renderToStaticMarkup(React.createElement(CookieBanner))
    expect(html).toBe('')
  })

  it('shows the banner after mount when no consent has been stored', async () => {
    // localStorage has no COOKIE_CONSENT_KEY → status flips to `missing` on the client
    const { container } = render(React.createElement(CookieBanner))

    // Flush effects
    await act(async () => {})

    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('does not show the banner after mount when consent is already stored', async () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')

    const { container } = render(React.createElement(CookieBanner))
    await act(async () => {})

    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('persists the choice and hides the banner when Accept is clicked', async () => {
    const { container } = render(React.createElement(CookieBanner))
    await act(async () => {})

    const accept = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Accept',
    )
    expect(accept).toBeDefined()

    await act(async () => { accept?.click() })

    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
