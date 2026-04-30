import type { CollectionConfig } from 'payload'

export const Showcase: CollectionConfig = {
  slug: 'showcase',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'artist', type: 'text' },
    { name: 'genre', type: 'text' },
    { name: 'equipment', type: 'text' },
    { name: 'beforeFile', type: 'upload', relationTo: 'media', required: true },
    { name: 'afterFile', type: 'upload', relationTo: 'media', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
