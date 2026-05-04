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
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders empty output in SSR context — no SSR/client mismatch', () => {
    // Use React's server renderer (no effects run) to simulate what the server
    // produces.  The component initialises visible=false so it must return null
    // → SSR emits no HTML for the banner.  This proves the first client render
    // (also visible=false before useEffect fires) matches the server output.
    const html = renderToStaticMarkup(React.createElement(CookieBanner))
    expect(html).toBe('')
  })

  it('shows the banner after mount when no consent has been stored', async () => {
    // localStorage has no COOKIE_CONSENT_KEY → banner should appear after useEffect
    const { container } = render(React.createElement(CookieBanner))

    // Flush effects
    await act(async () => {})

    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('does not show the banner after mount when consent is already stored', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')

    const { container } = render(React.createElement(CookieBanner))
    await act(async () => {})

    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
