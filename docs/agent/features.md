# Public Site & Admin Features

Living inventory of product surfaces. For operator how-to see [ADMIN.md](../../ADMIN.md). For PRD see [PRD.md](../../PRD.md).

## Public website (`/`)

| Feature | Status | Notes |
|---------|--------|-------|
| Hero + scroll 3D scene | ✅ | Model path from `site_content.hero_model_url` |
| Before/after mastering player | ✅ | Playlist, spectrum/LUFS tooling |
| Discography credits | ✅ | Role tabs, featured grid, search |
| Partners & endorsements | ✅ | Logo grids by category; white silhouette option |
| Team members | ✅ | Featured portrait + grid |
| Client reviews | ✅ | Active reviews only |
| Gallery | ✅ | Studio photos |
| Services modal + contact | ✅ | Packages from `services` / config |
| Cookie banner | ✅ | Consent-gated analytics |
| Legal pages | ✅ | `/legal/*` routes |
| Sitemap / robots | ✅ | |

## Admin CMS (`/admin`)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard counts |
| `/admin/content` | Hero/footer/site copy (`site_content`) |
| `/admin/showcase` | Before/after tracks + multipart audio |
| `/admin/gallery` | Photos |
| `/admin/members` | Team |
| `/admin/services` | Pricing packages |
| `/admin/reviews` | Testimonials + invite flow |
| `/admin/credits` | Discography credits |
| `/admin/partners` | Endorsements / partner logos |
| `/admin/legal` | Legal documents |
| `/admin/media` | Media browser helpers |
| `/admin/login` | Supabase email/password |

### Partners & endorsements (public section only)

| `category` | Public grid heading |
|------------|---------------------|
| `credit` | Credits (logo strip — not the same as discography `credits` table) |
| `endorsement` | Endorsements |
| `partner` / `label` / `sponsor` | Partners |

Admin CRUD at `/admin/partners`. Data: demo fallback or `partners` table rows. `logo_white` (default true) runs canvas white-silhouette processing on the public site.

### Reviews invites

Admins can send invite links (`review_invites`). Public form at `/review/[token]` creates/activates reviews after validation.

## Platform services

| Concern | Location |
|---------|----------|
| Storage abstraction | `lib/storage/*` (R2 only) |
| Multipart audio | `hooks/useR2MultipartUpload`, `r2Multipart` actions |
| Email | `lib/email/*` |
| Dev flags | `lib/devMode.ts` |
| Env | `env.mjs` |

## Out of scope (this product)

- Artist multi-tenant portal
- Press / journalist dashboard
- Label SOS / settlements accounting
- i18n locale switcher (English-only product copy)

If a darkTunes-style surface is requested, treat it as a **new product** and update PRD before building.
