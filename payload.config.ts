import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from '@/collections/Users'
import { Orders } from '@/collections/Orders'
import { Products } from '@/collections/Products'
import { Showcase } from '@/collections/Showcase'
import { Credits } from '@/collections/Credits'
import { Reviews } from '@/collections/Reviews'
import { Media } from '@/collections/Media'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  collections: [Users, Orders, Products, Media, Showcase, Credits, Reviews],
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
