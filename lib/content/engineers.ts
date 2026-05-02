/**
 * Engineer profile content – moved here from app/page.tsx to keep the page
 * component lean and to make bio/metadata easy to update without touching
 * routing or data-loading code.
 */

import type { Profile } from '@/types/profile'

export const PROFILE_ZARDONIC: Profile = {
  name: 'Federico „Zardonic" Ágreda Álvarez',
  title: 'Mixing & Mastering Engineer · Sound Designer',
  bio: 'Venezuelan-born electronic music producer, DJ, and mixing/mastering engineer with over 20 years of industry experience. Known for his work in industrial metal, drum & bass, and cyberpunk-influenced music, he has collaborated with major artists including Fear Factory, Bullet For My Valentine, Nine Inch Nails, Pop Evil, Sonic Syndicate, The Qemists, and Gorgoroth. His engineering style focuses on extreme clarity, surgical EQ, and cinematic low-end. #1 on Beatport Drum & Bass releases and Amazon Hard Rock & Metal charts with over 100 million streams worldwide. Factory presets for Arturia, Slate Digital, Brainworx, and Baby Audio. First Latin American musician as a playable character in a video game (Warlocks Vs Shadows). Soundtracks: Superhot: Mind Control Delete, Redout 2. DAW: FL Studio. Monitoring: Quested v2108, PMC result6. Synth: Sequential Pro 2.',
  portraitSrc: '/demo/zardonic.jpeg',
  awards: [],
}

export const PROFILE_KAIO: Profile = {
  name: 'Daniel „Kaio" Soto',
  title: 'Mixing & Mastering Engineer · Visual Media Artist',
  bio: 'Venezuelan mixing and mastering engineer specialising in heavy music genres — metal, hardcore, and industrial. Known for precise transient control, tight low-end management, and the ability to translate raw mixes into polished, competitive masters. Founder and head engineer of Mixbucket USA. Delivered full Mix & Master for Necrobeast (albums: Promethean Flame, Iron Baphomet) and created official lyric videos for international metal acts. Technical focus: maximum loudness with full transient dynamics preserved. Works with clients across Latin America and Europe.',
  portraitSrc: '/demo/kaio.jpeg',
  awards: [],
}
