/**
 * DemoBadge — shown on sections that are displaying seed/demo content.
 *
 * Renders only when:
 *   - NEXT_PUBLIC_SHOW_DEMO_BADGE=true, OR
 *   - Running on a Vercel preview deployment (NEXT_PUBLIC_VERCEL_ENV === 'preview')
 */

const showDemoBadge =
  process.env.NEXT_PUBLIC_SHOW_DEMO_BADGE === 'true' ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'

interface DemoBadgeProps {
  /** Override the environment-based visibility (useful in tests). */
  force?: boolean
}

export function DemoBadge({ force }: DemoBadgeProps): JSX.Element | null {
  if (!showDemoBadge && !force) return null

  return (
    <span
      aria-label="Demo content"
      className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-400 select-none"
    >
      Demo content
    </span>
  )
}
