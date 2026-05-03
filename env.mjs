import { z } from 'zod'

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_SERVER_URL: z.string().url('NEXT_PUBLIC_SERVER_URL must be a valid URL').optional().default('http://localhost:3000'),
  NEXT_PUBLIC_DEV_MODE: z.enum(['true', 'false']).optional().default('false'),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.string().email().optional(),
  CONTACT_FROM_EMAIL: z.string().email().optional(),
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
