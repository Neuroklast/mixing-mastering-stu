import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── Payload system tables ────────────────────────────────────────────────────

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload_migrations (
      id             serial      PRIMARY KEY,
      name           varchar,
      batch          numeric,
      created_at     timestamptz,
      updated_at     timestamptz
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload_preferences (
      id             serial      PRIMARY KEY,
      key            varchar,
      value          jsonb,
      created_at     timestamptz,
      updated_at     timestamptz
    )
  `)

  // ── Collection tables ────────────────────────────────────────────────────────

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at                  timestamptz DEFAULT now() NOT NULL,
      created_at                  timestamptz DEFAULT now() NOT NULL,
      email                       varchar     UNIQUE NOT NULL,
      reset_password_token        varchar,
      reset_password_expiration   timestamptz,
      salt                        varchar,
      hash                        varchar,
      login_attempts              numeric     DEFAULT 0,
      lock_until                  timestamptz,
      role                        varchar     DEFAULT 'client' NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users_sessions (
      id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      _order       int     NOT NULL,
      _parent_id   uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at   timestamptz,
      expires_at   timestamptz
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at     timestamptz DEFAULT now() NOT NULL,
      created_at     timestamptz DEFAULT now() NOT NULL,
      client_name    varchar     NOT NULL,
      client_email   varchar     NOT NULL,
      service_type   varchar     NOT NULL,
      package_tier   varchar     NOT NULL,
      status         varchar     DEFAULT 'pending' NOT NULL,
      total_price    numeric     DEFAULT 0 NOT NULL,
      notes          text
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS products (
      id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at          timestamptz DEFAULT now() NOT NULL,
      created_at          timestamptz DEFAULT now() NOT NULL,
      name                varchar     NOT NULL,
      description         jsonb,
      product_type        varchar     NOT NULL,
      price_cents         numeric     NOT NULL,
      currency            varchar     DEFAULT 'eur',
      license_type        varchar     DEFAULT 'single' NOT NULL,
      is_active           boolean     DEFAULT true,
      stripe_product_id   varchar,
      stripe_price_id     varchar,
      download_url        varchar
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS media (
      id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at      timestamptz DEFAULT now() NOT NULL,
      created_at      timestamptz DEFAULT now() NOT NULL,
      url             varchar,
      thumbnail_url   varchar,
      filename        varchar,
      mime_type       varchar,
      filesize        numeric,
      width           numeric,
      height          numeric,
      focal_x         numeric,
      focal_y         numeric,
      alt             varchar
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS showcase (
      id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at          timestamptz DEFAULT now() NOT NULL,
      created_at          timestamptz DEFAULT now() NOT NULL,
      slug                varchar     UNIQUE,
      title               varchar     NOT NULL,
      artist              varchar,
      genre               varchar,
      label_before        varchar     DEFAULT 'Mix',
      label_after         varchar     DEFAULT 'Master',
      start_marker        numeric     DEFAULT 0,
      lufs_target         numeric     DEFAULT -14,
      mobile_audio_url    varchar,
      before_url          varchar,
      after_url           varchar,
      waveform_data       jsonb,
      before_file_id      uuid        REFERENCES media(id),
      after_file_id       uuid        REFERENCES media(id),
      "order"             numeric     DEFAULT 0,
      active              boolean     DEFAULT true
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS showcase_equipment (
      id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      _order       int     NOT NULL,
      _parent_id   uuid    NOT NULL REFERENCES showcase(id) ON DELETE CASCADE,
      item         varchar NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS credits (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at       timestamptz DEFAULT now() NOT NULL,
      created_at       timestamptz DEFAULT now() NOT NULL,
      name             varchar     NOT NULL,
      role             varchar     NOT NULL,
      year             numeric,
      spotify_url      varchar,
      cover_image_id   uuid        REFERENCES media(id),
      featured         boolean     DEFAULT false
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at     timestamptz DEFAULT now() NOT NULL,
      created_at     timestamptz DEFAULT now() NOT NULL,
      client_name    varchar     NOT NULL,
      rating         numeric     NOT NULL,
      "text"         text        NOT NULL,
      project_link   varchar,
      service        varchar,
      "date"         timestamp
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS gallery (
      id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at   timestamptz DEFAULT now() NOT NULL,
      created_at   timestamptz DEFAULT now() NOT NULL,
      image_id     uuid        NOT NULL REFERENCES media(id),
      alt          varchar     NOT NULL,
      caption      varchar,
      "order"      numeric     DEFAULT 0,
      active       boolean     DEFAULT true
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS legal (
      id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      updated_at     timestamptz DEFAULT now() NOT NULL,
      created_at     timestamptz DEFAULT now() NOT NULL,
      title          varchar     NOT NULL,
      slug           varchar     UNIQUE NOT NULL,
      content        jsonb       NOT NULL,
      last_updated   timestamp
    )
  `)

  // ── Payload relationship tables ──────────────────────────────────────────────

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload_preferences_rels (
      id          serial  PRIMARY KEY,
      "order"     int,
      parent_id   int     REFERENCES payload_preferences(id) ON DELETE CASCADE,
      path        varchar,
      users_id    uuid    REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload_locked_documents (
      id            serial      PRIMARY KEY,
      global_slug   varchar,
      created_at    timestamptz,
      updated_at    timestamptz
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payload_locked_documents_rels (
      id           serial  PRIMARY KEY,
      "order"      int,
      parent_id    int     REFERENCES payload_locked_documents(id) ON DELETE CASCADE,
      path         varchar,
      users_id     uuid    REFERENCES users(id)    ON DELETE CASCADE,
      orders_id    uuid    REFERENCES orders(id)   ON DELETE CASCADE,
      products_id  uuid    REFERENCES products(id) ON DELETE CASCADE,
      media_id     uuid    REFERENCES media(id)    ON DELETE CASCADE,
      showcase_id  uuid    REFERENCES showcase(id) ON DELETE CASCADE,
      credits_id   uuid    REFERENCES credits(id)  ON DELETE CASCADE,
      reviews_id   uuid    REFERENCES reviews(id)  ON DELETE CASCADE,
      gallery_id   uuid    REFERENCES gallery(id)  ON DELETE CASCADE,
      legal_id     uuid    REFERENCES legal(id)    ON DELETE CASCADE
    )
  `)

  // ── Indexes ──────────────────────────────────────────────────────────────────

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS users_sessions_parent_idx
      ON users_sessions (_parent_id)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS showcase_equipment_parent_idx
      ON showcase_equipment (_parent_id)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS showcase_slug_idx
      ON showcase (slug)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS legal_slug_idx
      ON legal (slug)
  `)

  // Record this migration so Payload does not re-apply it
  await db.execute(sql`
    INSERT INTO payload_migrations (name, batch, created_at, updated_at)
    VALUES ('20250503_000000_initial', 1, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop in reverse dependency order
  await db.execute(sql`DROP TABLE IF EXISTS payload_locked_documents_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS payload_locked_documents CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS payload_preferences_rels CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS showcase_equipment CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS users_sessions CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS gallery CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS credits CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS showcase CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS reviews CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS products CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS legal CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS media CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS payload_preferences CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS payload_migrations CASCADE`)
}
