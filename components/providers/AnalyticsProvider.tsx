'use client'

/**
 * AnalyticsProvider – mounts Vercel Analytics and Speed Insights only when
 * the user has accepted cookies. Re-evaluates on consent change via
 * ConsentChangedEvent.
 */

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useConsent } from '@/hooks/useConsent'

export function AnalyticsProvider(): JSX.Element | null {
  const { analytics } = useConsent()
  if (!analytics) return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
