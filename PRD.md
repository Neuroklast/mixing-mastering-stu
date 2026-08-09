# Product Requirements — SONORATIVA

Living product requirements for the mixing & mastering studio website.  
**Stack (SSOT):** Next.js App Router · React 19 · Supabase (PostgreSQL + Auth) · Cloudflare R2 · Vercel · Tailwind v4.  
**Schema SSOT:** `supabase/init_all.sql` + Zod schemas in `lib/schemas/*` (see [supabase/DB_REQUIREMENTS.md](supabase/DB_REQUIREMENTS.md)).

Related docs: [README.md](README.md) · [ADMIN.md](ADMIN.md) · [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md) · [docs/agent/](docs/agent/) · [CHANGELOG.md](CHANGELOG.md)

---

## 1. Product vision

A professional audio engineering brand site that combines:

1. **Public studio site** — immersive dark aesthetic, scroll/3D hero, before/after player, discography credits, partners & endorsements, team, reviews, gallery, services/contact.
2. **Admin CMS** — operators manage all content, media (R2), and review invites without code deploys.

**Experience qualities:** cinematic · precise · high-contrast · technical credibility · conversion-ready contact path.

---

## 2. Surfaces & primary users

| Surface | Route prefix | Primary users | Auth |
|---------|--------------|---------------|------|
| Public site | `/`, `/legal/*` | Artists, labels, fans, SEO | None (consent for analytics) |
| Review invite | `/review/[token]` | Invited clients | Token |
| Admin | `/admin/*` | Studio admins | Supabase Auth + `profiles.role = 'admin'` |

---

## 3. Essential capabilities

### 3.1 Public website

- Hero badge/titles/CTA from `site_content`; optional 3D model path
- Showcase playlist with before/after A/B and analysis meters
- Discography **credits** (role filters, featured grid)
- **Partners & endorsements** logo grids (categories: credit / endorsement / partner / label / sponsor)
- Team members (featured + grid)
- Client reviews (approved/active only)
- Gallery images
- Services packages modal + contact dialog (orders/email)
- Cookie consent banner
- Legal pages (impressum, privacy, terms variants as configured)

### 3.2 Admin (`/admin`)

| Module | Purpose |
|--------|---------|
| Dashboard | Counts + quick links |
| Content | Hero/footer/site strings |
| Showcase | Tracks + multipart audio upload to R2 |
| Gallery / Members / Credits | Image CMS |
| Partners | Endorsement / partner logos + visibility |
| Reviews | CRUD + invite emails |
| Services | Pricing packages |
| Legal | Legal page bodies |
| Media | Browse/helpers for storage |

### 3.3 Platform services

- R2 public media + private audio (signed URLs)
- Resend email (contact / invites) when configured
- Dev mocks + production demo-fallback flags
- Optional Sentry / analytics

---

## 4. Non-functional requirements

| Area | Requirement |
|------|-------------|
| A11y | WCAG 2.1 AA targets on public UI; labels on icon buttons; focus visible |
| Security | RLS on tables; admin middleware + `requireAdmin`; no service role in browser |
| Storage | R2 only; DB stores paths not full URLs |
| Performance | Dynamic import heavy sections; signed audio; no multi-GB through Next body |
| Language | English for code, admin UI, and product docs in repo |
| Schema | Idempotent `init_all.sql`; Zod at service boundaries |
| Types | `tsc --noEmit` clean; husky pre-commit |

---

## 5. Success criteria (product)

- Public site renders without auth; CMS-driven content appears after admin publish.
- Empty CMS tables can show demo content in preview; production can hide demo via env.
- Admins upload images/audio without sending files through Next.js as a proxy body.
- Contact path yields a clear booking/inquiry flow.
- Partners/endorsements logos render cleanly on dark backgrounds (white fill option).

---

## 6. Out of scope (current)

- Multi-tenant artist portal / press dashboard
- Full Stripe checkout storefront (tables reserved; not primary UX)
- i18n locale switcher in app UI
- Reintroducing Payload CMS or Supabase Storage

---

## 7. Design direction (public)

Precision audio studio: near-black surfaces, accent CTAs, mono technical labels, strong contrast. Scroll feels premium (Lenis). Motion supports storytelling; does not block content.

Admin uses denser utilitarian chrome (zinc), not public immersion.

---

## 8. Edge cases

| Case | Behavior |
|------|----------|
| Empty showcase | Empty notice, not broken player |
| Empty CMS + demo fallback on | Demo content |
| Empty CMS + hide demo | Empty sections |
| Missing R2 public host | `next/image` may 400 — ops must set `R2_PUBLIC_HOST` |
| Non-admin session | Redirect login / forbidden |
| Audio private bucket | Signed URLs only |

---

## 9. Traceability

| Requirement area | Implementation anchors |
|------------------|------------------------|
| Public homepage | `app/page.tsx`, `components/features/*` |
| Admin CMS | `app/admin/*`, `ADMIN.md` |
| Schema / services | `supabase/init_all.sql`, `services/*` |
| Storage | `lib/storage/*`, `docs/cloudflare-r2.md` |
| Auth | `middleware.ts`, `app/admin/_actions/auth.ts` |
| QA | `QA_CHECKLIST.md` |
| History | `CHANGELOG.md` `[Unreleased]` |
