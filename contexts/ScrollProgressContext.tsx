'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

interface ScrollProgressContextValue {
  /** Mutable ref holding page scroll progress [0, 1]. Read in useFrame without causing re-renders. */
  progressRef: React.MutableRefObject<number>
  /**
   * Mutable ref for a callback that signals the R3F renderer to produce one
   * more frame (used with `frameloop="demand"`).  Populated by the
   * `InvalidateOnScroll` component that lives inside the Canvas.
   */
  invalidateRef: React.MutableRefObject<(() => void) | null>
}

const ScrollProgressContext = createContext<ScrollProgressContextValue | null>(null)

export function ScrollProgressProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const progressRef   = useRef(0)
  const invalidateRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const update = (): void => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progressRef.current = max > 0 ? window.scrollY / max : 0
      invalidateRef.current?.()
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <ScrollProgressContext.Provider value={{ progressRef, invalidateRef }}>
      {children}
    </ScrollProgressContext.Provider>
  )
}

/** Returns the scroll-progress ref for use in animation loops (e.g. useFrame). */
export function useScrollProgressRef(): React.MutableRefObject<number> {
  const ctx = useContext(ScrollProgressContext)
  if (!ctx) throw new Error('useScrollProgressRef must be used inside <ScrollProgressProvider>')
  return ctx.progressRef
}

/** Returns the invalidate ref so R3F components can register their `invalidate` callback. */
export function useScrollInvalidateRef(): React.MutableRefObject<(() => void) | null> {
  const ctx = useContext(ScrollProgressContext)
  if (!ctx) throw new Error('useScrollInvalidateRef must be used inside <ScrollProgressProvider>')
  return ctx.invalidateRef
}
