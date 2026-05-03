import type { CollectionConfig } from 'payload'

export const Credits: CollectionConfig = {
  slug: 'credits',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      options: ['Mix', 'Master', 'Mix & Master', 'Producing'],
      required: true,
    },
    { name: 'year', type: 'number' },
    { name: 'spotifyUrl', type: 'text' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured credits appear in the large spotlight grid. Non-featured appear in the compact list below.',
      },
    },
  ],
}
