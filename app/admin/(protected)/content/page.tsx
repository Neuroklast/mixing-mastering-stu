import { createAdminClient } from '@/lib/supabaseAdmin'
import { SITE_CONTENT_DEFAULTS } from '@/lib/schemas/siteContent'
import FormField from '@/app/admin/_components/FormField'
import FileUploadField from '@/app/admin/_components/FileUploadField'
import ImageUploadField from '@/app/admin/_components/ImageUploadField'
import { updateSiteContent } from './_actions'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

const SECTIONS: Array<{ title: string; keys: string[] }> = [
  {
    title: 'Hero',
    keys: ['hero_badge', 'hero_title_1', 'hero_title_2', 'hero_title_3', 'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary'],
  },
  {
    title: 'About',
    keys: ['about_title', 'about_body'],
  },
  {
    title: 'Contact',
    keys: ['contact_email', 'contact_phone', 'contact_address'],
  },
  {
    title: 'Social',
    keys: ['social_instagram', 'social_soundcloud', 'social_spotify'],
  },
  {
    title: 'Footer',
    keys: ['footer_tagline'],
  },
]

function labelFromKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function ContentAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const saved = params.saved === '1'

  const supabase = createAdminClient()
  const { data } = await supabase.from('site_content').select('key, value')

  const current: Record<string, string> = { ...SITE_CONTENT_DEFAULTS }
  for (const row of data ?? []) {
    current[String(row.key ?? '')] = String(row.value ?? '')
  }

  const mediaBucket = MEDIA_BUCKET

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Site Content</h1>
      <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Edit all user-visible copy, contact details, and social links.
      </p>
      {saved && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#052e16', border: '1px solid #166534', borderRadius: '6px', color: '#4ade80', fontSize: '0.9rem' }}>
          ✓ Changes saved successfully.
        </div>
      )}
      <form action={updateSiteContent}>
        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#7c3aed', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {section.title}
            </h2>
            {section.keys.map((key) => {
              const isLong = key === 'about_body'
              return (
                <FormField
                  key={key}
                  label={labelFromKey(key)}
                  name={key}
                  defaultValue={current[key] ?? ''}
                  as={isLong ? 'textarea' : 'input'}
                />
              )
            })}
          </div>
        ))}

        {/* 3D Hero Model */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#7c3aed', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            3D Hero Model
          </h2>
          <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Upload a <code>.glb</code> or <code>.gltf</code> file (max 50 MB). Leave blank to use
            the default bundled model.
          </p>
          <FileUploadField
            label="Hero Model File (.glb / .gltf)"
            urlName="hero_model_url"
            defaultUrl={current['hero_model_url'] ?? ''}
            bucket={mediaBucket}
            pathPrefix="hero-model"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            maxBytes={50 * 1024 * 1024}
          />
          <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '-0.5rem' }}>
            Default: <code>/video/3d_hero_model.glb</code> (served from <code>/public</code>)
          </p>
        </div>

        {/* Favicon */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#7c3aed', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Favicon
          </h2>
          <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Upload a <code>.ico</code>, <code>.png</code>, or <code>.svg</code> file (max 1 MB).
            Leave blank to use the static <code>/favicon.ico</code>.
          </p>
          <ImageUploadField
            label="Favicon Image"
            urlName="favicon_url"
            defaultUrl={current['favicon_url'] ?? ''}
            bucket={mediaBucket}
            pathPrefix="branding/favicon"
            accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
          />
        </div>

        <button
          type="submit"
          style={{ padding: '0.75rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          Save all changes
        </button>
      </form>
    </div>
  )
}
