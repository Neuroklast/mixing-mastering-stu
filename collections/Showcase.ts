import type { CollectionConfig } from 'payload'

export const Showcase: CollectionConfig = {
  slug: 'showcase',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'artist', type: 'text' },
    { name: 'genre', type: 'text' },
    {
      name: 'equipment',
      type: 'array',
      label: 'Equipment / Plugins used',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'labelBefore',
      type: 'text',
      defaultValue: 'Mix',
      admin: { description: 'Button label for the A (before) version, e.g. "Raw Mix"' },
    },
    {
      name: 'labelAfter',
      type: 'text',
      defaultValue: 'Master',
      admin: { description: 'Button label for the B (after) version, e.g. "Zardonic Master"' },
    },
    {
      name: 'startMarker',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Playback start position in seconds (e.g. chorus at 01:24 = 84)' },
    },
    {
      name: 'lufsTarget',
      type: 'number',
      defaultValue: -14,
      admin: { description: 'Target integrated loudness (LUFS), e.g. -14 for Spotify' },
    },
    { name: 'beforeFile', type: 'upload', relationTo: 'media', required: true },
    { name: 'afterFile', type: 'upload', relationTo: 'media', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
