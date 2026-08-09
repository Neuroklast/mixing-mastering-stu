# Data Layer & Schema

## Single source of truth

| Artefact | Purpose |
|----------|---------|
| `supabase/init_all.sql` | Canonical schema: tables, RLS, indexes, seed keys (idempotent) |
| `lib/schemas/*.ts` | Runtime Zod shapes for app-facing models |
| `services/*.ts` | Data access + path→URL resolution |

⛔ Prefer **not** growing a parallel `supabase/migrations/` tree for app schema. Fold incremental changes into `init_all.sql` with `CREATE … IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` so a fresh project and a live project stay aligned. See [supabase/DB_REQUIREMENTS.md](../../supabase/DB_REQUIREMENTS.md).

`supabase/schema.sql` is a partial/legacy bootstrap (orders/files/products). Prefer `init_all.sql` for full setup.

## Tables (CMS + product)

| Table | Public read | Notes |
|-------|-------------|--------|
| `profiles` | own row | `role`: `admin` \| `user` |
| `showcase` | `active = true` | before/after audio paths |
| `gallery` | `active = true` | media paths |
| `credits` | all | discography cards |
| `partners` | `active = true` | logo grids (credit / endorsement / partner / label / sponsor) |
| `members` | `active = true` | team |
| `reviews` | `active = true` | testimonials |
| `review_invites` | service role | invite tokens |
| `services` | `active = true` | pricing packages |
| `site_content` | all | key-value hero/footer copy |
| `legal` | all | legal pages |
| `orders` | owner / service | contact bookings |
| `files` | service | order attachments (legacy product path) |
| `products` / `licenses` | service | Stripe-ready digital goods (future) |

## Services map

| Service | Function(s) | Schema |
|---------|-------------|--------|
| `showcaseService` | `getAllShowcaseTracks` | `showcase` |
| `creditsService` | `getAllCredits` | `credits` |
| `partnersService` | `getAllPartners` | `partner` |
| `membersService` | `getActiveMembers` | `member` |
| `reviewsService` | `getAllReviews` | `review` |
| `galleryService` | `getAllGalleryImages` | `gallery` |
| `contentService` | `getSiteContent` | `siteContent` |
| `servicesService` | packages | `service` |
| `legalService` | legal pages | `legal` |
| `orderService` / `fileService` / `productService` | orders / files / products | `types/` |

## Storage path priority (post-R2)

When a row has both legacy URL and storage path columns, **always prefer the path**:

```ts
if (row.storage_path) {
  url = storage.getPublicUrl(MEDIA_BUCKET, String(row.storage_path))
} else if (row.image_url) {
  // legacy only; never reintroduce Supabase Storage hosts
}
```

| Entity | Path column | Legacy URL column |
|--------|-------------|-------------------|
| Gallery | `storage_path` | `image_url` |
| Members | `photo_storage_path` | `photo_url` |
| Credits | `cover_storage_path` | `cover_image_url` |
| Partners | `logo_storage_path` | `logo_url` |
| Showcase | `before_storage_path` / `after_storage_path` | (signed at read) |

## R2 object keys

Buckets (env-overridable):

| Bucket env | Default | Access | Contents |
|------------|---------|--------|----------|
| `R2_BUCKET_MEDIA` | `sonorativa-media` | Public (`R2_PUBLIC_HOST`) | Gallery, members, credits, partners logos |
| `R2_BUCKET_AUDIO` | `sonorativa-audio` | Private (signed download) | Showcase WAV/MP3 |

Suggested prefixes:

| Prefix | Use |
|--------|-----|
| `gallery/` | Studio photos |
| `members/` | Portraits |
| `credits/` | Cover art |
| `partners/` | Partner / endorsement logos |
| `{trackId}/before-*.wav` | Showcase before |
| `{trackId}/after-*.wav` | Showcase after |

Store **only** the object path in Postgres. Resolve URLs in services via `getStorageProvider()`.

## Dev mode & demo fallback

| Flag | Effect |
|------|--------|
| `NEXT_PUBLIC_DEV_MODE=true` | Services return mock data; no network |
| `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` | Empty DB → empty UI (no demo) |
| `NEXT_PUBLIC_SHOW_DEMO_BADGE=true` | Badge on seed content sections |

Mocks live in `lib/mockData.ts` (and some service-local `DEMO_*` arrays).

## Schema change checklist

Before committing any schema change:

- [ ] Table/column added to `CREATE TABLE` in `init_all.sql`
- [ ] Idempotent `ADD COLUMN IF NOT EXISTS` (if live DBs exist)
- [ ] RLS enabled + public/admin (service role) policies
- [ ] Index for filter/order columns (`active`, `display_order`)
- [ ] Zod schema + service mapper updated
- [ ] Admin CRUD + public section if user-facing
- [ ] Tests for service dev path + empty fallback
- [ ] Docs: `data-and-schema.md`, `PRD`/`INTEGRATION-SUMMARY` if product-facing, `CHANGELOG` when user-visible
