import type { CollectionConfig } from 'payload'

export const Gallery: CollectionConfig = {
  slug: 'gallery',
  admin: { useAsTitle: 'alt' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Alt text for accessibility and SEO' },
    },
    { name: 'caption', type: 'text' },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Display order (ascending)' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
