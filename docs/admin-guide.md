# Admin Guide

This guide is written for the **site owner** — no technical knowledge required.

---

## Logging In

1. Go to `https://your-domain.com/admin/login`
2. Enter your admin email and password
3. You will be redirected to the **Admin Dashboard**

If you see "Forbidden", ask your developer to grant your account the `admin` role in the Supabase database.

---

## Dashboard

The dashboard (`/admin`) shows a quick overview of all content sections. Each card displays how many items are currently in the database and a link to manage that section.

---

## Hero & Site Copy (`/admin/content`)

Edit all user-visible text on the public site:

- **Hero** — badge text, main headings, subtitle, button labels
- **About** — the about section title and body text
- **Contact** — email, phone, address
- **Social links** — Instagram, SoundCloud, Spotify URLs
- **Footer** — tagline

Click **Save all changes** when you are done.

---

## Showcase Tracks (`/admin/showcase`)

Showcase tracks are the before/after audio comparisons on the home page.

### Adding a new track

1. Click **+ New**
2. Fill in:
   - **Title** — track name (e.g. "INCINERATE")
   - **Artist** — artist name
   - **Label Before / Label After** — shown on the player toggle (default: "Demo" / "Final")
   - **Display Order** — lower numbers appear first
3. Upload the **before** and **after** audio files using the TUS upload fields
   - Supported formats: WAV, MP3, FLAC
   - Files up to 5 GB are supported
4. Toggle **Active** to make the track visible on the public site
5. Click **Save**

### Editing or deleting

Click **Edit** next to any track. To delete, click **Delete** (you will be asked to confirm).

---

## Gallery (`/admin/gallery`)

The gallery section shows studio photos on the public site.

### Adding images

1. Click **+ New**
2. Upload an image (JPG or PNG, max 50 MB)
3. Add an **alt text** (description for accessibility)
4. Add an optional **caption**
5. Set **Display Order** and toggle **Active**
6. Click **Save**

> **Tip:** Images are served from Supabase Storage. No external CDN is required.

---

## Members / Team (`/admin/members`)

Manage the team profiles shown on the public site.

### Adding a team member

1. Click **+ New**
2. Fill in **Name**, **Role**, and **Bio**
3. Upload a **profile photo** (square photos work best)
4. Add **social links** (optional): Instagram, SoundCloud, Spotify
5. Set **Display Order** and toggle **Active**
6. Click **Save**

---

## Services & Pricing (`/admin/services`)

Manage the service packages shown in the Services modal.

### Fields

| Field | Description |
|---|---|
| Slug | URL-safe identifier (e.g. `mixing`) |
| Title | Displayed name (e.g. "Mixing") |
| Description | Short tagline |
| Price (cents) | Price in the smallest currency unit (e.g. 45000 = €450) |
| Currency | `eur` or `usd` |
| Duration | Turnaround time (e.g. "3–5 business days") |
| Features | Comma-separated list of included features |
| Display Order | Lower = shown first |
| Active | Toggle visibility |

---

## Reviews (`/admin/reviews`)

Manage client reviews shown on the public site.

### Adding a review manually

1. Click **+ New**
2. Fill in: **Client Name**, **Rating** (1–5), **Review Text**, **Service**, **Date**
3. Toggle **Active** if you want it to appear immediately
4. Click **Save**

> **Note:** Email-based review invitations (invite a past client to submit a review) are planned for a future release.

---

## Credits (`/admin/credits`)

Credits are the discography / client list shown on the site.

### Adding a credit

1. Click **+ New**
2. Fill in **Artist/Band Name**, **Role** (e.g. "Mix & Master"), **Year**
3. Optionally add a **Spotify URL** and upload a **cover image**
4. Toggle **Featured** to highlight the credit

---

## Legal Pages (`/admin/legal`)

Edit the Impressum and Datenschutzerklärung pages.

1. Click the page you want to edit
2. Edit the HTML content directly in the textarea
3. Click **Save**

---

## Media Browser (`/admin/media`)

Browse all files uploaded to Supabase Storage. You can see files in both the `media` (images) and `audio-files` (audio) buckets. Use this page to verify uploads and copy storage paths if needed.

---

## Tips

- Changes are **live immediately** after saving — no cache to clear.
- If a section still shows "Demo content" after you add a row, make sure the new item is marked **Active**.
- To restore demo content for a section, delete all items in that section via the admin.
