import { z } from 'zod'

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  // Postgres non-pooling connection string used by Payload CMS migrations
  // Format: postgresql://postgres.PROJECT_REF:PASSWORD@host:5432/postgres?sslmode=require
  // Find in: Supabase dashboard → Project Settings → Database → Connection string → URI (non-pooling)
  POSTGRES_URL_NON_POOLING: z.string().min(1, 'POSTGRES_URL_NON_POOLING (Supabase Postgres) is required for Payload CMS'),
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_SERVER_URL: z.string().url('NEXT_PUBLIC_SERVER_URL must be a valid URL').optional().default('http://localhost:3000'),
  // ── Dev/Prototype mode ────────────────────────────────────────────────────────
  NEXT_PUBLIC_DEV_MODE: z.enum(['true', 'false']).optional().default('false'),
  // ── Supabase S3 / Payload media storage ──────────────────────────────────────
  // Find these in the Supabase dashboard → Storage → S3 Connection
  // All four vars are optional: when absent the S3 plugin is simply disabled.
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL (e.g. https://<project>.supabase.co/storage/v1/s3)').optional(),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required').optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required').optional(),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required (name of the Supabase storage bucket)').optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SERVER_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_DEV_MODE: z.enum(['true', 'false']).optional().default('false'),
})

const parseEnv = () => {
  const isServer = typeof window === 'undefined'
  const schema = isServer ? serverEnvSchema : clientEnvSchema

  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.errors
      .map((err) => `  ${err.path.join('.')}: ${err.message}`)
      .join('\n')
    throw new Error(`\n❌ Invalid environment variables:\n${missing}\n`)
  }

  return parsed.data
}

export const env = parseEnv()
