# Cloudflare R2 Storage Integration

SONORATIVA ships with a pluggable storage layer. By default it uses **Supabase Storage**, which requires no extra configuration. This document explains how to switch to **Cloudflare R2** — a cost-effective alternative with a generous free tier.

---

## 1. Why R2?

| | Supabase Storage (Free) | Cloudflare R2 (Free) |
|---|---|---|
| Storage | 1 GB | **10 GB** |
| Egress | 2 GB/month | **Unlimited** |
| Requests | 50k/month | 10 M/month |
| CDN | Via Supabase CDN | Via Cloudflare CDN |

For studios that upload many high-resolution images and audio reference files, R2 dramatically reduces hosting costs.

---

## 2. Setup (step by step)

### 2.1 Create R2 Buckets

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → select your account.
2. In the sidebar, go to **R2 Object Storage** → **Create bucket**.
3. Create two buckets:
   - `sonorativa-media` — for images (public)
   - `sonorativa-audio` — for private audio files

### 2.2 Generate S3-Compatible API Credentials

1. In R2 → **Manage R2 API Tokens** → **Create API Token**.
2. Set permissions: **Object Read & Write** for both buckets.
3. Copy the **Access Key ID** and **Secret Access Key** — you won't see the secret again.
4. Note your **Account ID** (visible in the R2 overview page URL: `dash.cloudflare.com/<account-id>/r2/...`).

### 2.3 Configure CORS on the `sonorativa-media` Bucket

In R2 → `sonorativa-media` → **Settings** → **CORS policy**, paste:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `https://your-domain.com` with your actual Vercel deployment URL.

### 2.4 Enable a Public Custom Domain

1. In R2 → `sonorativa-media` → **Settings** → **Public access**.
2. Enable **Custom domain** and add your subdomain (e.g. `media.your-domain.com`).
3. Follow the DNS instructions (add a CNAME in your DNS provider).
4. Wait for the domain to become active (usually < 5 minutes).

### 2.5 Add Environment Variables

Add these to your `.env.local` (local dev) and **Vercel → Project → Settings → Environment Variables** (production):

```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PUBLIC_HOST=media.your-domain.com
R2_BUCKET_MEDIA=sonorativa-media
R2_BUCKET_AUDIO=sonorativa-audio
```

### 2.6 Re-deploy

Trigger a new Vercel deployment (push a commit, or click **Redeploy** in the Vercel dashboard). The app will now use R2 for image uploads and signed audio download URLs.

---

## 3. Migrating Existing Files from Supabase to R2

Use [rclone](https://rclone.org/) to copy files between providers.

### Configure rclone

```bash
rclone config
```

Add two remotes:
- `supabase-s3` — S3-compatible, endpoint `https://<project>.supabase.co/storage/v1/s3`, your Supabase S3 credentials.
- `r2` — S3-compatible, endpoint `https://<account_id>.r2.cloudflarestorage.com`, your R2 credentials.

### Copy buckets

```bash
# Copy the media bucket
rclone copy supabase-s3:media r2:sonorativa-media --progress

# Copy the audio-files bucket
rclone copy supabase-s3:audio-files r2:sonorativa-audio --progress
```

After migration, update any `image_url` / `photo_url` values in the database that still point to Supabase Storage URLs to use the new R2 public domain.

---

## 4. TUS Limitation

**R2 does not support the TUS resumable upload protocol.**

Chunked audio uploads (WAV files via the `useTusUpload` hook in the admin showcase form) always go through **Supabase Storage** — even when `STORAGE_PROVIDER=r2`. This is because TUS is the only way to reliably upload 75 MB+ files on the Supabase Free Tier without hitting the 50 MB single-PUT limit.

**Impact when `STORAGE_PROVIDER=r2`:**
- ✅ Image uploads (admin media, gallery, member photos) — go to R2.
- ✅ Signed download URLs for private audio — served from R2.
- ⚠️ WAV uploads via the admin Showcase form — still go to Supabase Storage (via TUS).

A future PR will add S3 Multipart Upload support for R2, replacing TUS for audio uploads.

---

## 5. How the Storage Abstraction Works

All storage calls go through `lib/storage/index.ts`:

```ts
import { getStorageProvider } from '@/lib/storage'
const storage = getStorageProvider()
const url = storage.getPublicUrl('sonorativa-media', 'members/photo.jpg')
```

The factory reads `process.env.STORAGE_PROVIDER` at startup and returns either the Supabase or R2 implementation — both satisfy the same `StorageProvider` interface defined in `lib/storage/types.ts`.
