import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { Users } from './collections/Users'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Showcase } from './collections/Showcase'
import { Credits } from './collections/Credits'
import { Reviews } from './collections/Reviews'
import { Gallery } from './collections/Gallery'
import { Media } from './collections/Media'
import { Legal } from './collections/Legal'
import path from 'path'

// process.cwd() is the project root in all execution contexts (tsx CJS, Vercel, local).
// Do NOT use import.meta.url here — that ESM-only syntax forces tsx into ESM mode,
// where Node 24's strict resolver rejects extensionless TypeScript imports.
const dirname = process.cwd()

// Only enable S3 storage when all required credentials are present.
// This allows `payload generate:types` to run without S3 credentials
// and lets the app start in dev mode without a Supabase S3 bucket.
const s3Configured =
  !!process.env.S3_ENDPOINT &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY &&
  !!process.env.S3_BUCKET

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '– SONORATIVA CMS',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Orders, Products, Media, Showcase, Credits, Reviews, Gallery, Legal],
  plugins: [
    ...(s3Configured
      ? [
          s3Storage({
            collections: {
              media: true,
            },
            bucket: process.env.S3_BUCKET as string,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
              },
              // Supabase S3 is hosted in a single region; force-path-style is required
              // because bucket names are not valid DNS hostnames on the Supabase endpoint.
              forcePathStyle: true,
              region: 'auto',
            },
          }),
        ]
      : []),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    disable: true,
  },
})