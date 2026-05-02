'use client'

import { useLenis } from '@/hooks/useLenis'

/**
 * Global Lenis smooth-scroll provider.
 * Mount once at the root layout so Lenis is active on every page.
 */
export function LenisProvider({ children }: { children: React.ReactNode }): JSX.Element {
  useLenis()
  return <>{children}</>
}