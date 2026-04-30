import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Singleton Supabase browser client for use in Client Components.
 * Untyped by design – see lib/supabaseServer.ts for rationale.
 */
export const getSupabaseBrowserClient = (): ReturnType<typeof createBrowserClient> => {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return browserClient
}
