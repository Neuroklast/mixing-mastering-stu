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

### Changed

- Homepage renders `PartnersSection` after discography credits

## [0.1.0]

### Added

- Public studio site: hero, showcase player, credits, members, reviews, gallery, contact
- Admin CMS for content, showcase, gallery, members, services, reviews, credits, legal
- Supabase schema bootstrap (`init_all.sql`)
- Cloudflare R2 media + multipart audio uploads
- Vitest + Playwright baseline tests
