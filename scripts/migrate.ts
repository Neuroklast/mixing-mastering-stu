import { getPayload } from 'payload'
import config from '../payload.config.js'

console.log('▶ Running Payload migrations...')
const payload = await getPayload({ config })
try {
  await payload.db.migrate()
  console.log('✅ Migrations complete.')
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  if (
    msg.includes('No migrations') ||
    msg.includes('already') ||
    msg.includes('up to date')
  ) {
    console.log('ℹ No pending migrations.')
  } else {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
} finally {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload.db as any).destroy?.()
  process.exit(0)
}
