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

-- Media bucket (Payload CMS uploads via @payloadcms/storage-s3)
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

-- media bucket policies (Payload CMS assets — publicly readable)
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
-- NOTE: Payload CMS collections (showcase, gallery, credits, reviews, legal,
-- media, users, orders, products) are managed by Payload's own migration
-- system and enforce access control at the application layer via collection
-- access functions.  Run `npm run payload:init` after this script to create
-- those tables and apply Payload migrations.
-- ─────────────────────────────────────────────────────────────────────────────

COMMIT;
