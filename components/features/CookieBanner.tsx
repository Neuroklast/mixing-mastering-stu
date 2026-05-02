'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COOKIE_CONSENT_KEY } from '@/lib/site'

/**
 * CookieBanner – GDPR-compliant cookie notice.
 *
 * Displays a dismissible banner at the bottom of the viewport on first visit.
 * Consent is persisted in localStorage. The banner is not rendered during SSR.
 */
export const CookieBanner = (): JSX.Element | null => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage may be blocked in private browsing – show banner
      setVisible(true)
    }
  }, [])

  const accept = (): void => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted') } catch { /* ignore */ }
    setVisible(false)
  }

  const decline = (): void => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'declined') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[9000]',
        'border-t border-border bg-card/95 backdrop-blur-md',
        'px-4 py-4 md:py-5',
      )}
    >
      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Text */}
        <p className="flex-1 text-sm font-mono text-muted-foreground leading-relaxed">
          We use essential cookies to operate this site. No tracking or advertising
          cookies are used.{' '}
          <Link
            href="/legal/privacy"
            className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
          >
            Privacy Policy
          </Link>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={accept}
            className="font-mono uppercase tracking-wider min-h-[44px]"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={decline}
            className="font-mono uppercase tracking-wider min-h-[44px]"
          >
            Decline
          </Button>
          <button
            onClick={decline}
            aria-label="Close cookie notice"
            className="ml-1 flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
