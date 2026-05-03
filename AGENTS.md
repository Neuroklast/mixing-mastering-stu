# AGENTS.md – Guidelines for AI Agents

## TypeScript
- `npx tsc --noEmit` MUST pass cleanly before every commit.
- Never use direct type assertions (`as string`, `as number`) when types do not overlap. Use `String(value)`, `Number(value)`, or `as unknown as TargetType` instead.
- Supabase rows have untyped fields (no generated `database.types.ts`). Always use `String(row.field ?? '')` when accessing row fields.

## Build
- `npm run build` must succeed locally before opening a PR.
- TypeScript errors in the `scripts/` directory are checked by the Vercel build the same as app code.

## Pre-commit
- The husky pre-commit hook runs `tsc --noEmit`. It must not be bypassed (`--no-verify` is forbidden).

## Pull Requests
- Every PR must pass the Vercel preview build.
- No `@ts-ignore` or `@ts-expect-error` comments without a justification in a comment.

## Architecture
- The project uses **Supabase** as the sole backend (no Payload CMS).
- Services (`services/*.ts`) check `isDev` first and return mock data. In production they use `createClient()` from `@/lib/supabaseServer`.
- Admin area at `/admin/*` — protected by `middleware.ts` (Supabase Auth + `profiles.role = 'admin'`).
- Admin operations use `createAdminClient()` from `@/lib/supabaseAdmin` (service-role key).
- Environment variables are validated in `env.mjs` with Zod. For `tsc --noEmit`, only these are required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Dev Mode
- `NEXT_PUBLIC_DEV_MODE=true` makes all services return mock/demo data with no network calls.
- Set to `false` (or omit) to connect to the real Supabase backend.

## Audio Uploads (TUS Resumable)
- For **audio files (WAVs up to 75 MB)** always use the `useTusUpload` hook from `@/hooks/useTusUpload` — NOT `createSignedUploadUrl`.
- TUS uploads in 6 MB chunks directly from the browser to Supabase Storage (no proxy through Next.js). The Supabase Free Tier supports TUS up to **5 GB per file**.
- `createSignedUploadUrl` is kept for small files (images, documents under 50 MB).
- The `chunkSize` for TUS must be **at least 6 MB** (Supabase requirement, except for the last chunk).
- Database fields store only the **objectPath** (e.g. `track-id/before-1234.wav`), NOT the full URL. The full URL is generated at render time via `createSignedUrl(objectPath, 3600)`.

## Service Result Pattern
- All services return `ServiceResult<T>` (from `@/lib/serviceResult`) for operations that can fail.
- Helpers: `ok(data)` / `err(message)`.
- When Supabase returns an empty array and the table has no real data yet, services fall back to demo/mock data so the public site never looks broken.

## Zod Boundaries
- Use Zod schemas at all service boundaries (`lib/schemas/*.ts`).
- Parse Supabase rows through the relevant schema before returning them to callers.

## Language
- All code, comments, documentation, and admin UI strings must be in **English**.
- No German strings anywhere in the codebase.

## Demo Content Badge
- Set `NEXT_PUBLIC_SHOW_DEMO_BADGE=true` (or deploy to a Vercel preview) to show a "Demo content" badge on sections that are displaying seed data.
