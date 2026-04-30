-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  client_name    TEXT        NOT NULL,
  client_email   TEXT        NOT NULL,
  service_type   TEXT        NOT NULL
    CHECK (service_type IN ('mixing', 'mastering', 'mixing_mastering')),
  package_tier   TEXT        NOT NULL
    CHECK (package_tier IN ('starter', 'professional', 'premium')),
  status         TEXT        NOT NULL    DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  notes          TEXT,
  total_price    NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- ── Files ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  order_id         UUID        NOT NULL    REFERENCES orders(id) ON DELETE CASCADE,
  filename         TEXT        NOT NULL,
  storage_path     TEXT        NOT NULL,
  public_url       TEXT        NOT NULL,
  file_size_bytes  BIGINT      NOT NULL,
  mime_type        TEXT        NOT NULL
    CHECK (mime_type IN ('audio/wav', 'audio/mpeg')),
  type             TEXT        NOT NULL    DEFAULT 'original'
    CHECK (type IN ('original', 'mixed', 'mastered'))
);

-- ── Products (VST-Plugins / digital goods – Stripe-ready) ────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name               TEXT    NOT NULL,
  description        TEXT,
  price_cents        INTEGER NOT NULL,
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

-- ── Licenses (Stripe purchase → license key) ─────────────────────────────────
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

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Orders: public can submit, owners can read their own
CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (client_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Files: anyone can upload; order owner can read
CREATE POLICY "Anyone can insert files"
  ON files FOR INSERT WITH CHECK (true);

-- Products: publicly readable when active
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT USING (is_active = true);

-- Licenses: user can read their own
CREATE POLICY "Users can read own licenses"
  ON licenses FOR SELECT USING (auth.uid() = user_id);

-- ── Storage bucket (run once in Supabase dashboard or via CLI) ────────────────
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('audio-files', 'audio-files', false)
--   ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Authenticated users can upload audio"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'audio-files');
