/** Single source of truth for DEV_MODE flag. */
export const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

/**
 * When true, all `return X.length > 0 ? X : DEMO_X` fallbacks in services are
 * disabled. Set `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` on Vercel to make every
 * section render real data only — an empty table produces an empty section
 * instead of demo content.
 */
export const hideDemoFallback = process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK === 'true'
