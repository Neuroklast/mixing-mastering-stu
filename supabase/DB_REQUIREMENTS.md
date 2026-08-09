# SONORATIVA Database Requirements

This document defines the **permanent, non-negotiable** structural requirements
for the SONORATIVA Supabase PostgreSQL database. Any developer or AI agent
modifying the schema **must** verify compliance with all rules below.

---

## 1. Single Source of Truth

| Artefact | Purpose |
|---|---|
| `supabase/init_all.sql` | The primary schema script. Tables, RLS policies, indexes, and seed keys live here (idempotent). |
| `lib/schemas/*.ts` | Runtime Zod models for application boundaries. |
| `services/*.ts` | Data access and path→URL resolution. |

⛔ **Do not invent a long-lived parallel migration tree** for app CMS tables. Incremental SQL patches must be folded into `init_all.sql` as idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS` guards **and** reflected in the `CREATE TABLE` definition.

`supabase/schema.sql` is a **partial** legacy bootstrap (orders/files/products/licenses). Full installs use `init_all.sql`.

---

## 2. Third Normal Form (3NF) — Mandatory

The schema must comply with the **Third Normal Form** at all times:

> Every non-key attribute must depend on **the whole key, and nothing but the key**.

### 2.1 No Redundant Columns (1NF + 2NF foundation)

- Each column stores exactly one atomic value.
- No calculated columns that duplicate data already derivable via query.
- **Exception (migration):** temporary dual `*_url` + `*_storage_path` columns during R2 migration — path is canonical; do not add new dual pairs.

### 2.2 No Transitive Dependencies (3NF)

Do not store denormalized names of related entities when an FK would suffice for admin-only joins. Public services may resolve display fields in application code.

### 2.3 Single Source per Attribute

| Attribute | Canonical store | Notes |
|---|---|---|
| Site copy (hero, footer, social) | `site_content` key-value | Not hardcoded in components for CMS-driven strings |
| Team bios/photos | `members` | |
| Discography work credits | `credits` | Role enum constrained in SQL/Zod |
| Partner / endorsement logos | `partners` | Categories constrained |
| Showcase audio paths | `showcase` | Paths only |
| Admin role | `profiles.role` | `admin` \| `user` |

### 2.4 Junction Tables

Use junction tables for many-to-many when FK integrity is required. Do not store unvalidated array-of-UUIDs for relationships that need cascades.

---

## 3. Referential Integrity

- Foreign keys must cascade or nullify appropriately:
  - **ON DELETE CASCADE** when children are meaningless without parent (e.g. `files.order_id` → `orders`).
  - **ON DELETE SET NULL** when the child can survive.
- Auth-linked rows (`profiles.id`) reference `auth.users`.

---

## 4. Idempotency Requirements

Every schema change in `init_all.sql` must be safe on **fresh** and **existing** databases:

| Object | Idempotent pattern |
|---|---|
| Tables | `CREATE TABLE IF NOT EXISTS` |
| Columns | `ALTER TABLE … ADD COLUMN IF NOT EXISTS` |
| Indexes | `CREATE INDEX IF NOT EXISTS` |
| Policies | `DO $$ … IF NOT EXISTS (SELECT 1 FROM pg_policies …)` then `CREATE POLICY` |
| Functions | `CREATE OR REPLACE FUNCTION` |

---

## 5. Row Level Security (RLS)

- **All public/CMS tables must have RLS enabled.**
- Public policies typically: `SELECT` where `active = true` (or unrestricted read for non-sensitive content).
- Writes: service role (admin actions) and/or authenticated admin checks.
- Never expose service role to the browser.

---

## 6. Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `partners`, `site_content` |
| Columns | `snake_case` | `display_order`, `logo_storage_path` |
| Indexes | `idx_<table>_<columns>` | `idx_partners_active_order` |
| Policies | descriptive English | `"Public can read active partners"` |

Storage columns: `*_storage_path` for R2 keys; avoid new `*_url` as primary.

---

## 7. Media & path rules

- Store **object paths** only (e.g. `partners/logo-123.png`), not full URLs.
- Resolve public URLs with R2 provider + `R2_PUBLIC_HOST`.
- Private audio: signed URLs at read time.

---

## 8. Checklist for Schema Changes

Before committing any schema change, verify:

- [ ] Column/table in `CREATE TABLE` inside `init_all.sql`
- [ ] Idempotent `ADD COLUMN IF NOT EXISTS` where needed
- [ ] Zod schema + service mapper updated
- [ ] No 3NF violations introduced (see § 2)
- [ ] RLS enabled and policies defined
- [ ] Index for FK and common filter columns
- [ ] No forbidden Supabase Storage assumptions
- [ ] `npx tsc --noEmit` and `npm test` pass
- [ ] Docs updated (`docs/agent/data-and-schema.md`, living docs if product-facing)
