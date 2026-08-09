# Integration Summary — SONORATIVA

Living product-status snapshot. Architecture and agent rules: `AGENTS.md` + `docs/agent/`. User guides: `README.md`, `ADMIN.md`, `DEPLOYMENT.md`.

**Stack:** Next.js App Router · React 19 · Supabase · Cloudflare R2 · Vercel · Tailwind v4  
**Schema:** `supabase/init_all.sql` · **PRD:** [PRD.md](PRD.md)

---

## Public website

| Area | Status |
|------|--------|
| Hero + 3D scene | ✅ RSC + client scene |
| Before/after player | ✅ Showcase service + signed audio |
| Discography credits | ✅ Filters / featured |
| Partners & endorsements | ✅ Logo grids + white silhouette |
| Members / reviews / gallery | ✅ |
| Services + contact | ✅ Modal + dialog |
| Legal, consent, sitemap | ✅ |

## Admin (`/admin`)

| Area | Status |
|------|--------|
| CMS sections (content, showcase, gallery, members, services, reviews, credits, partners, legal) | ✅ |
| Image signed upload → R2 | ✅ |
| Audio multipart → R2 | ✅ |
| Review invites | ✅ |
| Dashboard counts | ✅ |

## Platform services

| Area | Key paths |
|------|-----------|
| Services / DAL | `services/*` |
| Schemas | `lib/schemas/*` |
| Storage | `lib/storage/r2.ts`, `r2-multipart.ts` |
| Admin uploads | `app/admin/_actions/uploads.ts`, `r2Multipart.ts` |
| Auth | `middleware.ts`, `requireAdmin` |
| Email | `lib/email/*` |
| Dev flags | `lib/devMode.ts` |

---

## Entry-point files

| File | Purpose |
|------|---------|
| `PRD.md` | Product requirements |
| `README.md` | Quick start, stack, setup |
| `DEPLOYMENT.md` | Vercel, Supabase, R2 |
| `ADMIN.md` | Operator guide |
| `AGENTS.md` | Agent index + mandatory checks |
| `docs/agent/*.md` | Topic-specific coding rules |
| `supabase/init_all.sql` | Canonical DB schema |
| `supabase/DB_REQUIREMENTS.md` | Schema rules (3NF, idempotency) |
| `.env.local.example` | Env template |

## Dead code / forbidden restore

Do **not** restore:

- Supabase Storage provider for media
- TUS upload path (`useTusUpload`, `getTusUploadCredentials`)
- Payload CMS

## Quick start

```bash
cp .env.local.example .env.local   # fill Supabase + R2 vars
npm ci && npm run dev
# http://localhost:3000 · /admin
```
