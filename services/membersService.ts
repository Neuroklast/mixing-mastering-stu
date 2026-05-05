import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { memberSchema, type Member } from '@/lib/schemas/member'
import { isDev, hideDemoFallback } from '@/lib/devMode'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'sonorativa-media'

const DEMO_MEMBERS: Member[] = [
  {
    id: 'demo-1',
    name: 'Federico "Zardonic" Ágreda',
    role: 'Lead Mix & Mastering Engineer',
    bio: 'Venezuelan-born electronic music producer with 20+ years of experience. Known for industrial metal, drum & bass, and cyberpunk-influenced music.',
    photo_url: null,
    social_links: { instagram: '', soundcloud: '', spotify: '' },
    display_order: 0,
    active: true,
    featured: true,
  },
  {
    id: 'demo-2',
    name: 'Daniel "Kaio" Soto',
    role: 'Mix & Mastering Engineer',
    bio: 'Venezuelan engineer specialising in heavy music — metal, hardcore, and industrial.',
    photo_url: null,
    social_links: { instagram: '', soundcloud: '', spotify: '' },
    display_order: 1,
    active: true,
    featured: false,
  },
]

export async function getActiveMembers(): Promise<ServiceResult<Member[]>> {
  if (isDev) return ok(DEMO_MEMBERS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error || !data) return ok(hideDemoFallback ? [] : DEMO_MEMBERS)

    const storage = getStorageProvider()
    const members: Member[] = []
    for (const row of data) {
      // R2 photo_storage_path is the source of truth post-migration; prefer it over photo_url
      let photoUrl: string | null = null
      if (row.photo_storage_path) {
        photoUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.photo_storage_path))
      } else if (row.photo_url) {
        photoUrl = String(row.photo_url)
      }

      const parsed = memberSchema.safeParse({
        id: String(row.id ?? ''),
        created_at: String(row.created_at ?? ''),
        name: String(row.name ?? ''),
        role: String(row.role ?? ''),
        bio: row.bio != null ? String(row.bio) : null,
        photo_url: photoUrl,
        photo_storage_path: row.photo_storage_path != null ? String(row.photo_storage_path) : null,
        social_links: (row.social_links as Record<string, unknown>) ?? {},
        display_order: typeof row.display_order === 'number' ? row.display_order : 0,
        active: Boolean(row.active),
        featured: Boolean(row.featured),
      })
      if (parsed.success) members.push(parsed.data)
    }
    // Fall back to demo data when the DB table is empty (unless explicitly disabled)
    if (members.length === 0 && !hideDemoFallback) return ok(DEMO_MEMBERS)
    return ok(members)
  } catch (e) {
    console.error('[membersService] getActiveMembers failed:', e)
    return err('Failed to load members')
  }
}
