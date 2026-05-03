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

-- ── Storage buckets ───────────────────────────────────────────────────────────

-- Audio-files bucket (client audio uploads for orders)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('audio-files', 'audio-files', false)
  ON CONFLICT DO NOTHING;

-- Media bucket (admin CMS media uploads)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true)
  ON CONFLICT DO NOTHING;

-- ── Storage RLS ───────────────────────────────────────────────────────────────

-- audio-files policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Service role uploads audio'
  ) THEN
    CREATE POLICY "Service role uploads audio"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Order owner can download own files'
  ) THEN
    CREATE POLICY "Order owner can download own files"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'audio-files'
        AND (
          auth.role() = 'service_role'
          OR EXISTS (
            SELECT 1 FROM public.files f
            JOIN public.orders o ON o.id = f.order_id
            WHERE f.storage_path = storage.objects.name
              AND o.client_email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
          )
        )
      );
  END IF;
END $$;

-- media bucket policies (admin uploads, publicly readable)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Public can read media assets'
  ) THEN
    CREATE POLICY "Public can read media assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'media');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated admins can upload media'
  ) THEN
    CREATE POLICY "Authenticated admins can upload media"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'media'
        AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated admins can update media'
  ) THEN
    CREATE POLICY "Authenticated admins can update media"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'media'
        AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Authenticated admins can delete media'
  ) THEN
    CREATE POLICY "Authenticated admins can delete media"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'media'
        AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
      );
  END IF;
END $$;

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
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can read reviews'
  ) THEN
    CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Service role can manage reviews'
  ) THEN
    CREATE POLICY "Service role can manage reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date DESC);

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

COMMIT;
