# Changelog

All notable changes to this project are documented in this file.

Format inspired by [Keep a Changelog](https://keepachangelog.com/).  
Agents: add bullets under `[Unreleased]` when product behavior changes (see `docs/agent/workflow.md`).

## [Unreleased]

### Added

- **Partners & Endorsements** public homepage section only (logo grids by category; optional white-silhouette processing)
- `getAllPartners()` service + demo data; optional `partners` table in `init_all.sql` for DB-backed logos (no admin CMS UI)
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
