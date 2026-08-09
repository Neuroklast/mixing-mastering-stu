# Supabase Database Setup

This guide explains how to set up the SONORATIVA database schema in Supabase.

> **Schema conventions and 3NF requirements** are documented in
> [`supabase/DB_REQUIREMENTS.md`](./DB_REQUIREMENTS.md). Read it before making
> any schema changes.

## Prerequisites

- A Supabase project ([app.supabase.com](https://app.supabase.com))
- Access to **SQL Editor** (or Supabase CLI linked to the project)

### Optional: public schema grants (PostgreSQL 15+)

If you hit permission errors creating objects, run once in the SQL Editor:

```sql
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE, CREATE ON SCHEMA public TO authenticated, anon, service_role;
```

## Running the schema

### Recommended — full bootstrap

1. Open Supabase → **SQL Editor** → **New query**
2. Paste the **entire** contents of `supabase/init_all.sql`
3. **Run**

The script is idempotent: safe to re-run on an existing project.

### CLI

```bash
npm run setup:supabase
# or apply with psql using your DATABASE_URL
```

## Idempotency

`init_all.sql` uses:

- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
- Policy creation guarded by `pg_policies` checks
- `CREATE INDEX IF NOT EXISTS`

## First admin user

1. Create a user in Supabase Auth (email/password) or via the install wizard
2. Ensure a `profiles` row exists with `role = 'admin'` for that user id

Without `profiles.role = 'admin'`, middleware blocks `/admin/*`.

## Troubleshooting

### Error: "permission denied for schema public"

Run the optional grants above, then re-run `init_all.sql`.

### Error: "relation does not exist"

Run the **complete** `init_all.sql`, not a partial excerpt (unless you know the dependency order).

### Admin login loops / forbidden

- Confirm user exists in Auth
- Confirm `profiles.role = 'admin'`
- Confirm `NEXT_PUBLIC_SUPABASE_URL` / anon key match the project

## Related

- [DB_REQUIREMENTS.md](./DB_REQUIREMENTS.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [docs/development.md](../docs/development.md)
