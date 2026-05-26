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
   - **Title** *(required)* — track name (e.g. "INCINERATE")
   - **Artist** — artist name
   - **Genre** — musical genre (optional)
   - **Equipment** — gear used (optional)
   - **Label Before / Label After** — shown on the player toggle (default: "Demo" / "Final")
   - **Start Marker (s)** — playback start time in seconds (default: 0)
   - **LUFS Target** — target loudness in LUFS (default: -14)
   - **Display Order** — lower numbers appear first
   - **Active** — set to **Yes** to show on the public site
3. Upload the **Before Audio** and **After Audio** files
   - Supported formats: WAV, MP3, FLAC
   - Files are stored in Cloudflare R2
4. Click **Create**

### Editing or deleting

Click **Edit** next to any track. To delete, click **Delete** (you will be asked to confirm).

---

## Gallery (`/admin/gallery`)

The gallery section shows studio photos on the public site.

### Adding images

1. Click **+ New**
2. Upload an image (JPG or PNG, max 100 MB)
3. Add an **alt text** (description for accessibility)
4. Add an optional **caption**
5. Set **Display Order** and toggle **Active**
6. Click **Save**

> **Tip:** Images are stored in Cloudflare R2 (`sonorativa-media` bucket).

---

## Members / Team (`/admin/members`)

Manage the team profiles shown on the public site.

### Adding a team member

1. Click **+ New**
2. Fill in **Name** *(required)*, **Role** *(required)*, and **Bio**
3. Upload a **profile photo** (square photos work best)
4. Add **social links** (optional): Instagram, SoundCloud, Spotify
5. Set **Display Order** and toggle **Active**
6. Set **Featured**:
   - **No** — member appears in the grid
   - **Yes** — member appears as a full portrait with bio above the grid
7. Click **Create**

---

## Services & Pricing (`/admin/services`)

Manage the service packages shown in the Services modal.

### Fields

| Field | Description |
|---|---|
| Slug | URL-safe identifier (e.g. `mixing`) — must be unique |
| Title | Displayed name (e.g. "Mixing") |
| Description / Tagline | Short description shown under the title |
| Price (cents) | Price in the smallest currency unit (e.g. 20000 = €200) |
| Currency | `eur`, `usd`, etc. |
| Duration | Turnaround time (e.g. "3–5 days") |
| Features | One feature per line — only list what is included |
| Display Order | Lower = shown first |
| Active | Toggle visibility |

---

## Reviews (`/admin/reviews`)

Manage client reviews shown on the public site.

### Adding a review manually

1. Click **+ New**
2. Fill in:
   - **Client Name** *(required)*
   - **Rating (1–5)** *(required)*
   - **Text** *(required)* — the review body
   - **Service** — Mix, Master, Mix & Master, or Producing
   - **Date** — date of the review
   - **Project Link** — optional URL to the project
3. Click **Create**

> **Note:** Reviews must be manually activated — toggle **Active** in the edit view if you want them visible immediately.

---

## Credits (`/admin/credits`)

Credits are the discography / client list shown on the site.

### Adding a credit

1. Click **+ New**
2. Fill in **Name** *(required)* (artist or band)
3. Select **Role** *(required)*: Mix, Master, Mix & Master, or Producing
4. Add **Year** (optional)
5. Optionally add a **Spotify URL** and upload a **cover image**
6. Toggle **Featured** to highlight the credit
7. Click **Create**

---

## Legal Pages (`/admin/legal`)

Edit the Impressum and Datenschutzerklärung pages.

1. Click the page you want to edit
2. Edit the HTML content directly in the textarea
3. Click **Save**

---

## Media Browser (`/admin/media`)

Browse all files stored in Cloudflare R2. Two buckets are shown:

- **sonorativa-media** — images (gallery, member photos, credit covers)
- **sonorativa-audio** — audio files (showcase before/after tracks)

Use this page to verify uploads and copy storage paths if needed.

---

## Tips

- Changes are **live immediately** after saving — no cache to clear.
- If a section still shows "Demo content" after you add a row, make sure the new item is marked **Active**.
- To restore demo content for a section, delete all items in that section via the admin.
