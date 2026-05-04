# Operations Guide

Operational procedures for running SONORATIVA in production.

---

## 1. Database Backups

### Manual backup

```bash
npm run backup:db
# or directly:
node scripts/backup-db.mjs
```

Requires `pg_dump` and `DATABASE_URL` env var (Supabase non-pooling connection string):

```bash
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Backups are written to `./backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`.
The `./backups/` directory is git-ignored.

### Automated daily cron

Add to your crontab (`crontab -e`):

```cron
# Daily database backup at 03:00
0 3 * * * /usr/bin/node /path/to/sonorativa/scripts/backup-db.mjs >> /var/log/sonorativa-backup.log 2>&1
```

Or use a GitHub Actions scheduled workflow:

```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 3 * * *'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/backup-db.mjs
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: db-backup-${{ github.run_id }}
          path: backups/*.sql.gz
          retention-days: 30
```

### Restoring a backup

```bash
# Decompress and restore:
gunzip -c backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz | psql "$DATABASE_URL"
```

---

## 2. Deployment

The app deploys to **Vercel** automatically on push to `main`.

### Environment variables

All required env vars must be set in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose to client) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://sonorativa.com`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret key |
| `R2_PUBLIC_HOST` | Public domain for sonorativa-media bucket |
| `R2_BUCKET_MEDIA` | Media bucket name (default: `sonorativa-media`) |
| `R2_BUCKET_AUDIO` | Audio bucket name (default: `sonorativa-audio`) |
| `RESEND_API_KEY` | Resend email API key |
| `CONTACT_FROM_EMAIL` | From address for transactional emails |
| `ADMIN_EMAIL` | Admin notification email (defaults to `CONTACT_FROM_EMAIL`) |

### Manual redeploy

```bash
# Trigger redeploy via Vercel CLI:
vercel --prod
# or push an empty commit:
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## 3. Secret Rotation

### Rotating Supabase service role key

1. Supabase Dashboard → Project Settings → API → Reveal service role key.
2. Generate a new key (or revoke and recreate the project — last resort).
3. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel and re-deploy.

### Rotating R2 API credentials

1. Cloudflare Dashboard → R2 → Manage R2 API Tokens.
2. Create a new token → copy credentials.
3. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel.
4. Delete the old token.
5. Trigger a redeploy.

### Rotating Resend API key

1. Resend Dashboard → API Keys → Create new key.
2. Update `RESEND_API_KEY` in Vercel.
3. Delete the old key.
4. Re-deploy.

---

## 4. R2 Storage Maintenance

See [docs/cloudflare-r2.md](./cloudflare-r2.md) for full R2 documentation.

### Check bucket usage

Cloudflare Dashboard → R2 → select bucket → Metrics.

### Migrate files from Supabase Storage to R2

```bash
node scripts/migrate-supabase-to-r2.mjs          # dry-run
node scripts/migrate-supabase-to-r2.mjs --write  # apply
```

---

## 5. Monitoring

- **Vercel Analytics** — available on the Vercel dashboard for the project.
- **Supabase** — monitor DB usage at app.supabase.com → Project → Reports.
- **Cloudflare** — R2 metrics in the Cloudflare Dashboard under R2.
