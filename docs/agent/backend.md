# Backend, Admin & Ops Integrations

## Admin route auth

| Layer | Mechanism |
|-------|-----------|
| Edge | `middleware.ts` — only `/admin/*` (except `/admin/login`); requires Supabase session + `profiles.role = 'admin'` |
| Server Actions | `requireAdmin()` in `app/admin/_actions/auth.ts` at the top of every mutation |
| Data writes | `createAdminClient()` from `@/lib/supabaseAdmin` (service-role key; bypasses RLS) |

Fail closed: missing env, auth error, or non-admin → redirect to `/admin/login`.

Public site does not require auth. Contact/order flows are public server actions with validation.

## Supabase clients

| Client | Module | Use |
|--------|--------|-----|
| Server (user session) | `lib/supabaseServer.ts` | RSC services, route handlers, middleware-compatible cookies |
| Browser | `lib/supabaseClient.ts` | Client auth (login, password reset) |
| Admin (service role) | `lib/supabaseAdmin.ts` | Admin mutations only |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Password recovery

Public routes (not behind `middleware.ts`, which only matches `/admin/:path*`):

| Route | File | Role |
|-------|------|------|
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Email form → `resetPasswordForEmail` with `redirectTo` |
| `/auth/callback` | `app/auth/callback/route.ts` | PKCE `code` → `exchangeCodeForSession`; validates `next` (no `//`) |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | `updateUser({ password })`, then sign out → `/admin/login?reset=success` |

Two link styles must keep working:

1. **App-sent** (forgot-password page): PKCE flow, `redirectTo` = `<origin>/auth/callback?next=/auth/reset-password`.
2. **Dashboard-sent** (Supabase → Users → Send recovery): implicit flow, tokens in the URL hash. `@supabase/ssr` is PKCE-only and rejects implicit callbacks, so the reset page parses the hash and calls `setSession` manually.

Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://sonorativa.com/auth/reset-password` (dashboard links land directly on the form)
- Redirect URLs: `https://sonorativa.com/**`, `http://localhost:3000/**`

Schemas: `lib/schemas/auth.ts` (`forgotPasswordSchema`, `resetPasswordSchema`).

## Image uploads (admin)

Flow for images ≤ ~100 MB:

1. Client calls `createSignedUploadUrl(bucket, path)` (`app/admin/_actions/uploads.ts`)
2. Browser `PUT`s bytes directly to R2
3. Form saves **object path** in `*_storage_path`
4. Display URL from `getPublicStorageUrl` / `storage.getPublicUrl`

UI helper: `ImageUploadField` (`pathName` + `urlName` + `pathPrefix`).

## Audio uploads (showcase)

Large WAVs use **R2 S3 Multipart** (not TUS, not Supabase Storage):

| Piece | Location |
|-------|----------|
| Hook | `hooks/useR2MultipartUpload.ts` |
| Actions | `app/admin/_actions/r2Multipart.ts` (`createMultipartUpload`, `signMultipartPart`, `completeMultipartUpload`, `abortMultipartUpload`) |
| Field UI | `app/admin/_components/AudioUploadField.tsx` |

Chunks (~6 MB) go browser → R2. Next.js only signs. Persist path on `showcase.before_storage_path` / `after_storage_path`. Playback uses **signed download URLs**.

## Email

`lib/email/` + Resend. Contact form / review invites when `RESEND_API_KEY` + from/to emails configured. Optional — app must not hard-crash if unset.

## Contact & orders

- Public contact dialog → server action validates with Zod → may insert `orders` and/or send email
- Rate-limit / honeypot: keep any existing guards; do not remove spam protections without replacement

## Env validation

`env.mjs` Zod schemas:

- Server requires Supabase URL/anon, service role, site URL
- Client only sees `NEXT_PUBLIC_*`
- R2 secrets are read by storage modules; set them in Vercel for production

## robots / sitemap

- `app/robots.ts`, `app/sitemap.ts` use `NEXT_PUBLIC_SITE_URL`

## Error logging

Optional Sentry (`sentry.client.config.ts` / `sentry.server.config.ts`). Prefer structured `console.error('[area] …')` with context when Sentry is off.

## Forbidden patterns

- Reintroducing Supabase Storage or `useTusUpload` / `getTusUploadCredentials`
- Passing full R2/Supabase URLs into DB columns as the primary media reference
- Using service role in client components
- Bypassing `requireAdmin` on admin mutations
- Setting `NEXT_PUBLIC_DEV_MODE=true` in production env
