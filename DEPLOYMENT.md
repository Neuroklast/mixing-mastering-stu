# Deployment Guide — SONORATIVA

## Vercel deployment

### Prerequisites

- GitHub repo connected to Vercel
- Supabase project with `init_all.sql` applied
- Cloudflare R2 buckets + API token
- Env vars set for Production / Preview as needed

### Steps

1. Import project in Vercel (Next.js defaults)
2. Set environment variables (below)
3. Deploy `main` (or open PR for preview)
4. Confirm `/` loads and `/admin/login` works
5. Confirm R2 images render (`R2_PUBLIC_HOST` critical for `next/image`)

### Automatic deployments

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| PR branches | Preview |

## Supabase setup

1. Create project
2. Apply schema — [supabase/SETUP.md](supabase/SETUP.md) (`init_all.sql`)
3. Create admin Auth user + `profiles.role = 'admin'`
4. Copy URL, anon key, service role key into Vercel

## Cloudflare R2 setup

Full detail: [docs/cloudflare-r2.md](docs/cloudflare-r2.md)

1. Create buckets: `sonorativa-media` (public), `sonorativa-audio` (private)
2. Create R2 API token (Object Read & Write)
3. Attach custom domain / r2.dev public access for media bucket → set `R2_PUBLIC_HOST`
4. Optional: `npm run r2:setup`

CORS: browser PUT for signed uploads must be allowed on the buckets (see R2 docs / setup script).

## Environment variables

### Client-safe (`NEXT_PUBLIC_*`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key (RLS) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site URL |
| `NEXT_PUBLIC_SERVER_URL` | Optional | Local default `http://localhost:3000` |
| `NEXT_PUBLIC_DEV_MODE` | Optional | `true` = mocks (**never in production**) |
| `NEXT_PUBLIC_HIDE_DEMO_FALLBACK` | Optional | `true` = no demo content when empty |
| `NEXT_PUBLIC_SHOW_DEMO_BADGE` | Optional | Badge demo sections |

### Server-only (never `NEXT_PUBLIC_`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Admin mutations |
| `R2_ACCOUNT_ID` | ✅ prod | Cloudflare account |
| `R2_ACCESS_KEY_ID` | ✅ prod | R2 S3 key |
| `R2_SECRET_ACCESS_KEY` | ✅ prod | R2 S3 secret |
| `R2_PUBLIC_HOST` | ✅ prod | Media CDN host (build-time images) |
| `R2_BUCKET_MEDIA` | Optional | Default `sonorativa-media` |
| `R2_BUCKET_AUDIO` | Optional | Default `sonorativa-audio` |
| `RESEND_API_KEY` | Optional | Transactional email |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | Optional | Contact routing |
| `DATABASE_URL` | Optional | `pg_dump` backups |
| Sentry DSN vars | Optional | Error tracking |

Template: `.env.local.example`.

## Post-deployment checklist

- [ ] Homepage 200; no console spam
- [ ] `R2_PUBLIC_HOST` set; sample gallery/member image loads via `next/image`
- [ ] Admin login + role check
- [ ] Upload one image to R2 via admin; path stored; public URL works
- [ ] Upload small showcase audio (or verify multipart credentials)
- [ ] `NEXT_PUBLIC_DEV_MODE` is **not** `true` in production
- [ ] Consider `NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true` once real content exists
- [ ] Contact email path verified if Resend configured
- [ ] Legal pages linked in footer

## Maintenance

### Database backups

```bash
DATABASE_URL=postgresql://… npm run backup:db
```

See [docs/operations.md](docs/operations.md).

### Monitoring

- Vercel deployment logs
- Supabase Auth / API logs
- Optional Sentry

### Secret rotation

Rotate R2 keys and Supabase service role carefully; update Vercel env and redeploy.
