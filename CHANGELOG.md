# Changelog

All notable changes to this project are documented in this file.

Format inspired by [Keep a Changelog](https://keepachangelog.com/).  
Agents: add bullets under `[Unreleased]` when product behavior changes (see `docs/agent/workflow.md`).

## [Unreleased]

### Added

- **Partners & Endorsements** public homepage section (logo grids by category; optional white-silhouette processing)
- Admin CMS for partners (`/admin/partners`) — list, create, edit, delete, logo upload
- `getAllPartners()` service + demo data; `partners` table in `init_all.sql`
- Agent documentation suite (`docs/agent/*`, root living docs, PR template)
- Password recovery flow: `/auth/forgot-password`, `/auth/callback` (PKCE), `/auth/reset-password`; login page links to it
- Auth schemas (`lib/schemas/auth.ts`) + unit/E2E coverage for the reset flow

### Changed

- Homepage renders `PartnersSection` after discography credits
- Privacy policy processor list corrected (Supabase = database/auth; added Cloudflare R2, Vercel, Resend; removed Sentry); audio streaming wording + last-updated date

### Fixed

- Showcase audio playback/analysis no longer blocked by CORS: `r2-setup.mjs` applies a CORS policy (incl. `ExposeHeaders: ETag`) to `sonorativa-audio` as well and derives www/apex origins from `NEXT_PUBLIC_SITE_URL`

### Removed

- Sentry stub configs (`sentry.client.config.ts`, `sentry.server.config.ts`) — SDK was never installed
- Unused `DemoBadge` component and `NEXT_PUBLIC_SHOW_DEMO_BADGE` env var

## [0.1.0]

### Added

- Public studio site: hero, showcase player, credits, members, reviews, gallery, contact
- Admin CMS for content, showcase, gallery, members, services, reviews, credits, legal
- Supabase schema bootstrap (`init_all.sql`)
- Cloudflare R2 media + multipart audio uploads
- Vitest + Playwright baseline tests
