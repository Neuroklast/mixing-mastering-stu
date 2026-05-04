-- ─────────────────────────────────────────────────────────────────────────────
-- SONORATIVA — init_all.sql
-- Idempotent master setup script.  Safe to run multiple times.
--
-- Usage
--   Pro:   bash bin/setup-supabase.sh
--   Noob:  paste this file into Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ    NOT NULL    DEFAULT NOW(),
  client_name    TEXT           NOT NULL,
  client_email   TEXT           NOT NULL,
  service_type   TEXT           NOT NULL
    CHECK (service_type IN ('mixing', 'mastering', 'mixing_mastering')),
  package_tier   TEXT           NOT NULL
    CHECK (package_tier IN ('starter', 'professional', 'premium')),
  status         TEXT           NOT NULL    DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  notes          TEXT,
  total_price    NUMERIC(10, 2) NOT NULL    DEFAULT 0
);

-- ── Files ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  order_id         UUID        NOT NULL    REFERENCES orders(id) ON DELETE CASCADE,
  filename         TEXT        NOT NULL,
  storage_path     TEXT        NOT NULL    UNIQUE,
  public_url       TEXT        NOT NULL,
  file_size_bytes  BIGINT      NOT NULL,
  mime_type        TEXT        NOT NULL
    CHECK (mime_type IN ('audio/wav', 'audio/mpeg')),
  type             TEXT        NOT NULL    DEFAULT 'original'
    CHECK (type IN ('original', 'mixed', 'mastered'))
);

-- ── Products (VST / digital goods – Stripe-ready) ─────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name               TEXT    NOT NULL,
  description        TEXT,
  price_cents        INTEGER NOT NULL CHECK (price_cents >= 0),
  currency           TEXT    NOT NULL DEFAULT 'eur',
  product_type       TEXT    NOT NULL
    CHECK (product_type IN ('vst_plugin', 'sample_pack', 'preset_bank')),
  stripe_product_id  TEXT    UNIQUE,
  stripe_price_id    TEXT    UNIQUE,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  download_url       TEXT,
  license_type       TEXT    NOT NULL DEFAULT 'single'
    CHECK (license_type IN ('single', 'commercial', 'unlimited'))
);

-- ── Licenses (Stripe purchase → license key) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id                  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id               UUID        NOT NULL REFERENCES products(id),
  order_reference          TEXT        NOT NULL,
  license_key              TEXT        NOT NULL UNIQUE
    DEFAULT encode(gen_random_bytes(32), 'hex'),
  activated_at             TIMESTAMPTZ,
  expires_at               TIMESTAMPTZ,
  stripe_payment_intent_id TEXT        UNIQUE
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_client_email ON orders(client_email);
CREATE INDEX IF NOT EXISTS idx_files_order_id      ON files(order_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id    ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products(is_active);

-- ── Row Level Security — Supabase tables ──────────────────────────────────────
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can submit orders'
  ) THEN
    CREATE POLICY "Public can submit orders"
      ON orders FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Order owner can read own order'
  ) THEN
    CREATE POLICY "Order owner can read own order"
      ON orders FOR SELECT
      USING (
        client_email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Service role can manage all orders'
  ) THEN
    CREATE POLICY "Service role can manage all orders"
      ON orders FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Service role can insert files'
  ) THEN
    CREATE POLICY "Service role can insert files"
      ON files FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Order owner can read own files'
  ) THEN
    CREATE POLICY "Order owner can read own files"
      ON files FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders o
          WHERE o.id = files.order_id
            AND o.client_email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'Service role can manage all files'
  ) THEN
    CREATE POLICY "Service role can manage all files"
      ON files FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Active products are publicly readable'
  ) THEN
    CREATE POLICY "Active products are publicly readable"
      ON products FOR SELECT USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Service role can manage products'
  ) THEN
    CREATE POLICY "Service role can manage products"
      ON products FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Licenses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'licenses' AND policyname = 'Users can read own licenses'
  ) THEN
    CREATE POLICY "Users can read own licenses"
      ON licenses FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'licenses' AND policyname = 'Service role can manage licenses'
  ) THEN
    CREATE POLICY "Service role can manage licenses"
      ON licenses FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── Helper: is_admin() ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  )
$$;

-- Storage handled by Cloudflare R2 (see docs/cloudflare-r2.md). No Supabase Storage policies needed.

-- ─────────────────────────────────────────────────────────────────────────────
-- CMS tables (showcase, gallery, credits, reviews, legal, profiles)
-- Managed directly via Supabase (no external CMS).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles (for admin role assignment) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role  TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Service role can manage profiles'
  ) THEN
    CREATE POLICY "Service role can manage profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── Showcase ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS showcase (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title                TEXT        NOT NULL,
  artist               TEXT,
  genre                TEXT,
  equipment            TEXT,
  label_before         TEXT        NOT NULL DEFAULT 'Demo',
  label_after          TEXT        NOT NULL DEFAULT 'Final',
  start_marker         NUMERIC     NOT NULL DEFAULT 0,
  lufs_target          NUMERIC     NOT NULL DEFAULT -14,
  before_storage_path  TEXT,
  after_storage_path   TEXT,
  before_url           TEXT,
  after_url            TEXT,
  active               BOOLEAN     NOT NULL DEFAULT true,
  display_order        INTEGER     NOT NULL DEFAULT 0
);
ALTER TABLE showcase ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'showcase' AND policyname = 'Public can read active showcase'
  ) THEN
    CREATE POLICY "Public can read active showcase" ON showcase FOR SELECT USING (active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'showcase' AND policyname = 'Service role can manage showcase'
  ) THEN
    CREATE POLICY "Service role can manage showcase" ON showcase FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_showcase_active_order ON showcase(active, display_order);

-- ── Gallery ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url     TEXT,
  storage_path  TEXT,
  alt           TEXT,
  caption       TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT true
);
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gallery' AND policyname = 'Public can read active gallery'
  ) THEN
    CREATE POLICY "Public can read active gallery" ON gallery FOR SELECT USING (active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gallery' AND policyname = 'Service role can manage gallery'
  ) THEN
    CREATE POLICY "Service role can manage gallery" ON gallery FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gallery_active_order ON gallery(active, display_order);

-- ── Credits ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credits (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name                TEXT        NOT NULL,
  role                TEXT        NOT NULL CHECK (role IN ('Mix', 'Master', 'Mix & Master', 'Producing')),
  year                INTEGER,
  spotify_url         TEXT,
  cover_image_url     TEXT,
  cover_storage_path  TEXT,
  featured            BOOLEAN     NOT NULL DEFAULT false
);
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'credits' AND policyname = 'Public can read credits'
  ) THEN
    CREATE POLICY "Public can read credits" ON credits FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'credits' AND policyname = 'Service role can manage credits'
  ) THEN
    CREATE POLICY "Service role can manage credits" ON credits FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credits_featured ON credits(featured DESC);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_name   TEXT        NOT NULL,
  rating        INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text          TEXT        NOT NULL,
  service       TEXT        CHECK (service IN ('Mix', 'Master', 'Mix & Master', 'Producing')),
  date          DATE,
  project_link  TEXT
);

-- Add active column for admin approval workflow (idempotent)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can read active reviews'
  ) THEN
    CREATE POLICY "Public can read active reviews" ON reviews FOR SELECT USING (active = true);
  END IF;
END $$;

-- Drop legacy permissive policy if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can read reviews'
  ) THEN
    DROP POLICY "Public can read reviews" ON reviews;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Service role can manage reviews'
  ) THEN
    CREATE POLICY "Service role can manage reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Allow inserting reviews via invite token (anonymous public submit)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can submit reviews via invite'
  ) THEN
    CREATE POLICY "Public can submit reviews via invite" ON reviews FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_date   ON reviews(date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON reviews(active);

-- ── Review invites ────────────────────────────────────────────────────────────
-- Stores one-time tokens sent to clients so they can submit a review without
-- needing a login.  The token is included in the invite link URL.
CREATE TABLE IF NOT EXISTS review_invites (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  client_name  TEXT        NOT NULL,
  client_email TEXT        NOT NULL,
  service      TEXT        CHECK (service IN ('Mix', 'Master', 'Mix & Master', 'Producing')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);
ALTER TABLE review_invites ENABLE ROW LEVEL SECURITY;

-- Service role (admin actions) can manage all invites
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_invites' AND policyname = 'Service role can manage review invites'
  ) THEN
    CREATE POLICY "Service role can manage review invites" ON review_invites FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Public can read a single invite by token to render the review form
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_invites' AND policyname = 'Public can read invite by token'
  ) THEN
    CREATE POLICY "Public can read invite by token" ON review_invites FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_review_invites_token ON review_invites(token);

-- ── Legal ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title         TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  content       TEXT        NOT NULL,
  last_updated  DATE
);
ALTER TABLE legal ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal' AND policyname = 'Public can read legal pages'
  ) THEN
    CREATE POLICY "Public can read legal pages" ON legal FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal' AND policyname = 'Service role can manage legal'
  ) THEN
    CREATE POLICY "Service role can manage legal" ON legal FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_legal_slug ON legal(slug);

-- ── Seed legal placeholder pages ─────────────────────────────────────────────
-- IMPORTANT: Replace these placeholders with your actual legal content
-- before going live. Failure to do so may create legal liability.
INSERT INTO legal (slug, title, content, last_updated) VALUES
  (
    'impressum',
    'Imprint',
    '<p><strong>⚠️ PLACEHOLDER — Replace with your actual imprint before going live.</strong></p>
<h2>Information according to § 5 TMG</h2>
<p>Company Name<br>Street Address<br>City, Country</p>
<h2>Contact</h2>
<p>E-mail: hello@your-domain.com</p>
<h2>Responsible for content</h2>
<p>Your Name</p>',
    CURRENT_DATE
  ),
  (
    'privacy',
    'Privacy Policy',
    '<p><strong>⚠️ PLACEHOLDER — Replace with your actual privacy policy before going live.</strong></p>
<h2>1. Introduction</h2>
<p>This is a placeholder privacy policy for SONORATIVA. Please replace this with your actual privacy policy before going live.</p>
<h2>2. Data Controller</h2>
<p>Company Name, Address, Email</p>
<h2>3. Data We Collect</h2>
<p>Contact form submissions: name, email, service request details.</p>',
    CURRENT_DATE
  ),
  (
    'terms',
    'Terms of Service',
    '<p><strong>⚠️ PLACEHOLDER — Replace with your actual terms of service before going live.</strong></p>
<h2>1. Acceptance</h2>
<p>By using this website you agree to these placeholder terms. Replace with real terms before launch.</p>',
    CURRENT_DATE
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Site content (key/value for hero, about, footer, contact info) ────────────
CREATE TABLE IF NOT EXISTS site_content (
  key          TEXT        PRIMARY KEY,
  value        TEXT        NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_content' AND policyname = 'Public can read site content'
  ) THEN
    CREATE POLICY "Public can read site content" ON site_content FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_content' AND policyname = 'Service role can manage site content'
  ) THEN
    CREATE POLICY "Service role can manage site content" ON site_content FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── Members / team ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name                 TEXT        NOT NULL,
  role                 TEXT        NOT NULL,
  bio                  TEXT,
  photo_url            TEXT,
  photo_storage_path   TEXT,
  social_links         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  display_order        INTEGER     NOT NULL DEFAULT 0,
  active               BOOLEAN     NOT NULL DEFAULT true
);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Add featured column if it doesn't exist yet (idempotent)
ALTER TABLE members ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'Public can read active members'
  ) THEN
    CREATE POLICY "Public can read active members" ON members FOR SELECT USING (active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'Service role can manage members'
  ) THEN
    CREATE POLICY "Service role can manage members" ON members FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_members_active_order ON members(active, display_order);

-- ── Services (replaces lib/services-config.ts) ───────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug            TEXT        NOT NULL UNIQUE,
  title           TEXT        NOT NULL,
  description     TEXT,
  price_cents     INTEGER     NOT NULL CHECK (price_cents >= 0),
  currency        TEXT        NOT NULL DEFAULT 'eur',
  duration        TEXT,
  features        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  active          BOOLEAN     NOT NULL DEFAULT true
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Public can read active services'
  ) THEN
    CREATE POLICY "Public can read active services" ON services FOR SELECT USING (active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Service role can manage services'
  ) THEN
    CREATE POLICY "Service role can manage services" ON services FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_services_active_order ON services(active, display_order);

-- ── Seed site_content defaults ────────────────────────────────────────────────
INSERT INTO site_content (key, value) VALUES
  ('hero_badge',          'Professional Audio Engineering'),
  ('hero_title_1',        'PRECISION'),
  ('hero_title_2',        'AUDIO'),
  ('hero_title_3',        'ENGINEERING'),
  ('hero_subtitle',       'Mixing & mastering for artists who care about every dB.'),
  ('hero_cta_primary',    'Book a session'),
  ('hero_cta_secondary',  'Hear the difference'),
  ('about_title',         'Studio'),
  ('about_body',          ''),
  ('contact_email',       ''),
  ('contact_phone',       ''),
  ('contact_address',     ''),
  ('footer_tagline',      'SONORATIVA — Professional Audio Engineering'),
  ('social_instagram',    ''),
  ('social_soundcloud',   ''),
  ('social_spotify',      '')
ON CONFLICT (key) DO NOTHING;

COMMIT;
