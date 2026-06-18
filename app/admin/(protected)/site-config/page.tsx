import FormField from '@/app/admin/_components/FormField'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { saveSiteConfig } from './_actions'

const KNOWN_KEYS = [
  'site_name',
  'tagline',
  'booking_email',
  'merch_shop_url',
  'bandcamp_url',
  'spotify_artist_url',
  'youtube_channel_url',
  'soundcloud_url',
  'facebook_url',
  'instagram_url',
  'meta_description',
] as const

type SiteConfigKey = typeof KNOWN_KEYS[number]

const FIELD_META: Record<SiteConfigKey, { label: string; type?: string; as?: 'textarea' }> = {
  site_name: { label: 'Site Name' },
  tagline: { label: 'Tagline' },
  booking_email: { label: 'Booking Email', type: 'email' },
  merch_shop_url: { label: 'Merch Shop URL', type: 'url' },
  bandcamp_url: { label: 'Bandcamp URL', type: 'url' },
  spotify_artist_url: { label: 'Spotify Artist URL', type: 'url' },
  youtube_channel_url: { label: 'YouTube Channel URL', type: 'url' },
  soundcloud_url: { label: 'SoundCloud URL', type: 'url' },
  facebook_url: { label: 'Facebook URL', type: 'url' },
  instagram_url: { label: 'Instagram URL', type: 'url' },
  meta_description: { label: 'Meta Description', as: 'textarea' },
}

export default async function SiteConfigAdminPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('site_config').select('key, value')

  const config: Record<string, string> = {}
  for (const row of data ?? []) {
    config[String(row.key ?? '')] = String(row.value ?? '')
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Site Config</h1>
      <form action={saveSiteConfig}>
        {KNOWN_KEYS.map((key) => {
          const meta = FIELD_META[key]
          return (
            <FormField
              key={key}
              label={meta.label}
              name={key}
              type={meta.type as 'text' | 'email' | 'url' | undefined}
              as={meta.as}
              defaultValue={config[key] ?? ''}
            />
          )
        })}
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
      </form>
    </div>
  )
}
