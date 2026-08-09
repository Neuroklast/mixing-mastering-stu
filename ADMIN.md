# SONORATIVA Admin Panel

Operator guide for `/admin`. For agent/implementation rules see `AGENTS.md` and `docs/agent/backend.md`.

## Access

1. Configure Supabase Auth user
2. Set `profiles.role = 'admin'` for that user
3. Open `/admin/login` and sign in

Middleware blocks non-admins. Sessions use Supabase cookies.

## Setup

### 1. Database

Apply `supabase/init_all.sql` (see [supabase/SETUP.md](supabase/SETUP.md)).

### 2. Environment

See [DEPLOYMENT.md](DEPLOYMENT.md) and `.env.local.example`. Minimum for admin media:

- Supabase URL, anon key, service role
- R2 account + keys + `R2_PUBLIC_HOST`
- `NEXT_PUBLIC_SITE_URL`

### 3. First login

Create Auth user → ensure profile role `admin` → login at `/admin/login`.

## Modules

| Module | Route | What to manage |
|--------|-------|----------------|
| Dashboard | `/admin` | Counts + shortcuts |
| Content | `/admin/content` | Hero titles, CTAs, footer, social URLs, model path |
| Showcase | `/admin/showcase` | Before/after tracks; multipart WAV upload |
| Gallery | `/admin/gallery` | Studio photos |
| Members | `/admin/members` | Team profiles, photos, socials, featured |
| Services | `/admin/services` | Packages, prices, features |
| Reviews | `/admin/reviews` | Testimonials; send invite links |
| Credits | `/admin/credits` | Discography cards (cover, role, year, Spotify) |
| Partners | `/admin/partners` | Endorsement / partner logos for the public grids |
| Legal | `/admin/legal` | Legal page content |
| Media | `/admin/media` | Media browser helpers |

## Partners & endorsements

1. **Admin → Partners → + New**
2. Name, optional website URL
3. **Section**: Credit | Endorsement | Partner | Label | Sponsor (controls which public grid)
4. Upload logo (PNG/WebP with transparency preferred)
5. **White logo fill**: Yes for dark-site silhouette (recommended)
6. Active = visible on public homepage

## Showcase audio

1. Create track metadata
2. Upload before/after via multipart field (large WAVs supported)
3. Paths stored on `showcase`; public player uses signed URLs

## Images

- Use the image upload field (signed PUT to R2)
- Confirm preview after upload
- Never paste only a temporary signed URL into path fields as permanent storage

## Reviews invites

1. Create invite from Reviews admin (if enabled)
2. Client opens `/review/[token]`
3. Submitted review appears when active/approved per workflow

## Permissions

| Role | Capability |
|------|------------|
| `admin` | Full CMS |
| `user` / none | No admin access |

There is no separate editor role in this product (unlike multi-surface label platforms).

## Development notes

- Local: `NEXT_PUBLIC_DEV_MODE=true` serves mock public data; admin still needs real Supabase for mutations
- After content changes, public pages revalidate via `revalidatePath` in actions
- Language: admin UI is English only

## Related

- [docs/admin-guide.md](docs/admin-guide.md) (extended human guide)
- [docs/cloudflare-r2.md](docs/cloudflare-r2.md)
- [SECURITY.md](SECURITY.md)
