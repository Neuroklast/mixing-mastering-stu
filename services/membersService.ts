import { createClient } from '@/lib/supabaseServer'
import { memberSchema, type Member } from '@/lib/schemas/member'
import { isDev } from '@/lib/devMode'

const DEMO_MEMBERS: Member[] = [
  {
    id: 'demo-1',
    name: 'Federico "Zardonic" Ágreda',
    role: 'Lead Mix & Mastering Engineer',
    bio: 'Venezuelan-born electronic music producer with 20+ years of experience. Known for industrial metal, drum & bass, and cyberpunk-influenced music.',
    photo_url: '/demo/zardonic.jpeg',
    social_links: { instagram: '', soundcloud: '', spotify: '' },
    display_order: 0,
    active: true,
  },
  {
    id: 'demo-2',
    name: 'Daniel "Kaio" Soto',
    role: 'Mix & Mastering Engineer',
    bio: 'Venezuelan engineer specialising in heavy music — metal, hardcore, and industrial.',
    photo_url: '/demo/kaio.jpeg',
    social_links: { instagram: '', soundcloud: '', spotify: '' },
    display_order: 1,
    active: true,
  },
]

export async function getActiveMembers(): Promise<Member[]> {
  if (isDev) return DEMO_MEMBERS

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error || !data) return DEMO_MEMBERS

    const members: Member[] = []
    for (const row of data) {
      const parsed = memberSchema.safeParse({
        id: String(row.id ?? ''),
        created_at: String(row.created_at ?? ''),
        name: String(row.name ?? ''),
        role: String(row.role ?? ''),
        bio: row.bio != null ? String(row.bio) : null,
        photo_url: row.photo_url != null ? String(row.photo_url) : null,
        photo_storage_path: row.photo_storage_path != null ? String(row.photo_storage_path) : null,
        social_links: (row.social_links as Record<string, unknown>) ?? {},
        display_order: typeof row.display_order === 'number' ? row.display_order : 0,
        active: Boolean(row.active),
      })
      if (parsed.success) members.push(parsed.data)
    }
    // Fall back to demo data when the DB table is empty
    return members.length > 0 ? members : DEMO_MEMBERS
  } catch (e) {
    console.error('[membersService] getActiveMembers failed:', e)
    return []
  }
}
