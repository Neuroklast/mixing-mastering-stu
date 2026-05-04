# Cloudflare R2 Storage

SONORATIVA uses **Cloudflare R2** as the exclusive storage provider for images and audio files.
Supabase Storage is not used. All uploads and downloads go through R2.

---

## 1. Why R2?

| | Cloudflare R2 (Free) | Supabase Storage (Free) |
|---|---|---|
| Storage | **10 GB** | 1 GB |
| Egress | **Unlimited** | 2 GB/month |
| Requests | 10 M/month | 50k/month |
| Audio uploads | **S3 Multipart (any size)** | TUS protocol |
| CDN | Cloudflare CDN | Supabase CDN |

---

## 2. Bucket Layout

| Bucket | Access | Contents |
|---|---|---|
| `sonorativa-media` | Public (custom domain) | Admin images (gallery, members, credits, showcase) |
| `sonorativa-audio` | Private (signed URLs) | Audio files (WAV/MP3 showcase tracks) |

---

## 3. Initial Setup

### 3.1 Create Buckets

**Option A — Automatic (recommended):**

```bash
node scripts/r2-setup.mjs
# or via the install wizard:
npm run install:all
```

**Option B — Manual:**

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → select your account.
2. Go to **R2 Object Storage** → **Create bucket**.
3. Create `sonorativa-media` (leave settings as default — public URL set later).
4. Create `sonorativa-audio` (default — no public access).

### 3.2 Generate S3-Compatible API Credentials

1. R2 → **Manage R2 API Tokens** → **Create API Token**.
2. Permissions: **Object Read & Write** for both buckets.
3. Copy **Account ID**, **Access Key ID**, and **Secret Access Key**.

### 3.3 Configure Environment Variables

Add to `.env.local` (local) and Vercel → Project → Environment Variables (production):

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_HOST=media.your-domain.com      # see §3.4
R2_BUCKET_MEDIA=sonorativa-media
R2_BUCKET_AUDIO=sonorativa-audio
```

### 3.4 Enable a Public Custom Domain for `sonorativa-media`

1. R2 → `sonorativa-media` → **Settings** → **Public Access**.
2. Enable **Custom domain** → add `media.your-domain.com`.
3. Add the CNAME record shown by Cloudflare to your DNS provider.
4. Wait for it to become active (usually < 5 minutes).
5. Set `R2_PUBLIC_HOST=media.your-domain.com` in env.

---

## 4. CORS Configuration

Apply to `sonorativa-media` (needed for the admin image upload flow):

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

The `r2-setup.mjs` script applies this automatically. For manual setup:
Cloudflare Dashboard → R2 → `sonorativa-media` → **Settings** → **CORS policy**.

---

## 5. S3 Multipart Upload (Audio)

Audio files (WAV/MP3) are uploaded using **S3 Multipart Upload** via the
`useR2MultipartUpload` hook. This replaces the previous TUS protocol.

**Flow:**
1. `createMultipartUploadAction()` — initiates upload, returns `uploadId`
2. `signMultipartPartAction()` × N — presigned PUT URL per 5 MB chunk
3. Browser PUTs each chunk directly to R2
4. `completeMultipartUploadAction()` — assembles the file
5. On error/cancel: `abortMultipartUploadAction()` — cleans up

**Resumability:** The hook stores `{ uploadId, completedParts }` in
`sessionStorage` keyed by file hash. A page refresh resumes from the last
completed part.

**Lifecycle rule — ⚠️ MANDATORY:** Abort incomplete multipart uploads after 24h
to prevent orphaned parts from incurring storage costs. Without this rule, a
failed or abandoned upload leaves incomplete multipart parts in the bucket
indefinitely, accumulating storage charges.

```json
{
  "Rules": [
    {
      "ID": "AbortIncompleteMultipart",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 1 }
    }
  ]
}
```

Set in: Cloudflare Dashboard → R2 → `sonorativa-audio` → **Settings** → **Lifecycle**.

> **This rule is the only safety net for orphaned uploads.** Always configure it
> immediately after creating the `sonorativa-audio` bucket. Even with the hook's
> `beforeunload` abort handler, network failures or browser crashes can still
> leave multipart uploads incomplete.

---

## 6. Migrating Existing Files from Supabase Storage to R2

If you have existing files in Supabase Storage, use the migration script:

```bash
# Dry run — shows what would be migrated without touching anything:
node scripts/migrate-supabase-to-r2.mjs

# Write mode — actually migrates files and updates the database:
node scripts/migrate-supabase-to-r2.mjs --write
```

The script:
- Reads all rows from `gallery`, `credits`, `members`, `showcase` tables
- Downloads each Supabase URL → uploads to R2 → rewrites the DB URL
- Is idempotent — skips rows already pointing to `R2_PUBLIC_HOST`

**Alternative for bulk binary copy (rclone):**

```bash
rclone config  # add supabase-s3 and r2 remotes
rclone copy supabase-s3:media r2:sonorativa-media --progress
rclone copy supabase-s3:audio-files r2:sonorativa-audio --progress
```

Then run the migration script in dry-run mode to find any DB rows still
pointing to old Supabase URLs, and update them with `--write`.

---

## 7. How the Storage Abstraction Works

All storage operations go through `lib/storage/index.ts`:

```ts
import { getStorageProvider } from '@/lib/storage'
const storage = getStorageProvider()

// Public URL for images
const url = storage.getPublicUrl('sonorativa-media', 'members/photo.jpg')

// Signed download URL for private audio (60 min TTL)
const signedUrl = await storage.createSignedDownloadUrl('sonorativa-audio', 'track/before.wav', 3600)

// Signed PUT URL for image uploads (< 100 MB)
const { signedUrl } = await storage.createSignedUploadUrl('sonorativa-media', 'gallery/photo.jpg')
```

`getStorageProvider()` always returns the R2 provider. The Supabase Storage
provider (`lib/storage/supabase.ts`) is kept only for the migration script
and is `@deprecated`.
