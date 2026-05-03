import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  upload: true,
  fields: [
    { name: 'alt', type: 'text' },
  ],
}
