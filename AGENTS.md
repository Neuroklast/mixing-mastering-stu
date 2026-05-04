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

## Storage
- All file storage uses **Cloudflare R2 only**. Supabase Storage is no longer used.
- `lib/storage/index.ts` always returns the R2 provider (`r2StorageProvider`). Do not restore the Supabase storage provider.
- Two buckets:
  - `sonorativa-media` — public (gallery images, member photos, credit covers). Use `getPublicUrl()`.
  - `sonorativa-audio` — private (showcase WAV files). Use `createSignedDownloadUrl()`.
- Database columns store only the **object path** (e.g. `gallery/image-1234.jpg`), **not** a full URL. The URL is derived at render time via `storage.getPublicUrl(bucket, path)` or `storage.createSignedDownloadUrl(bucket, path, ttlSeconds)`.

## Image Uploads (Admin)
- Small files (images ≤ 100 MB): use `createSignedUploadUrl(bucket, path)` server action → browser PUT directly to R2 → save `storage_path` column in DB.
- After upload, `getPublicStorageUrl(bucket, path)` returns the public URL for display in the admin.
- **Never** pass the full URL to the DB. Store only the object path.

## Audio Uploads (R2 S3 Multipart)
- For **audio files (WAVs up to several GB)** use the `useR2MultipartUpload` hook from `@/hooks/useR2MultipartUpload`.
- Uploads in 6 MB chunks directly from the browser to Cloudflare R2 via S3 Multipart API. Files never pass through Next.js.
- Server actions in `app/admin/_actions/r2Multipart.ts`: `createMultipartUpload`, `signMultipartPart`, `completeMultipartUpload`, `abortMultipartUpload`.
- On completion the object path (e.g. `track-id/before-1234567890.wav`) is saved to `before_storage_path` / `after_storage_path` in the `showcase` table.
- **TUS / Supabase Storage is gone.** Do not reference `useTusUpload` or `getTusUploadCredentials`.

## Dev Mode
- `NEXT_PUBLIC_DEV_MODE=true` makes all services return mock/demo data with no network calls.
- Set to `false` (or omit) to connect to the real Supabase + R2 backend.
- **Must never be `true` in production.**

## Demo Fallback Toggle
- Services fall back to demo/mock data when the DB table is empty, so the public site never looks broken during development.
- Set `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` on Vercel to disable this fallback: an empty table produces an empty section, not demo content.
- `hideDemoFallback` is exported from `lib/devMode.ts`. All services that have a `DEMO_*` fallback must check it.

## Service Result Pattern
- All services return `ServiceResult<T>` (from `@/lib/serviceResult`) for operations that can fail.
- Helpers: `ok(data)` / `err(message)`.
- Services that return raw arrays (e.g. `membersService`) use an empty array on error, not `ServiceResult`.

## Storage Path Priority (post-R2 migration)
When a DB row has both a legacy `*_url` column and a newer `*_storage_path` column, **always prefer the storage path**:
```ts
if (row.storage_path) {
  url = storage.getPublicUrl(MEDIA_BUCKET, String(row.storage_path))
} else if (row.image_url) {
  // warn and skip if it's a legacy Supabase host URL
}
```
Affected columns: `gallery.storage_path` vs `gallery.image_url`, `members.photo_storage_path` vs `members.photo_url`, `credits.cover_storage_path` vs `credits.cover_image_url`.

## Zod Boundaries
- Use Zod schemas at all service boundaries (`lib/schemas/*.ts`).
- Parse Supabase rows through the relevant schema before returning them to callers.

## Language
- All code, comments, documentation, and admin UI strings must be in **English**.
- No German strings anywhere in the codebase.

## Demo Content Badge
- Set `NEXT_PUBLIC_SHOW_DEMO_BADGE=true` (or deploy to a Vercel preview) to show a "Demo content" badge on sections that are displaying seed data.
