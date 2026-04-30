import type { CollectionConfig } from 'payload'

export const Credits: CollectionConfig = {
  slug: 'credits',
  admin: { useAsTitle: 'name' },
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
  ],
}
