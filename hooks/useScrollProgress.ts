'use client'

import { useScroll } from 'framer-motion'
import { useRef } from 'react'

/**
 * Returns scrollYProgress (0–1) for the full page or an optional container ref.
 */
export function useScrollProgress(containerRef?: React.RefObject<HTMLElement>) {
  const defaultRef = useRef<HTMLElement>(null)
  const target = containerRef ?? defaultRef

  const { scrollYProgress } = useScroll(
    containerRef
      ? {
          target: target as React.RefObject<HTMLElement>,
          offset: ['start start', 'end end'],
        }
      : {},
  )

  return { scrollYProgress, ref: containerRef ? undefined : defaultRef }
}
