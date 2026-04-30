import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: { useAsTitle: 'clientName' },
  fields: [
    { name: 'clientName', type: 'text', required: true },
    { name: 'rating', type: 'number', min: 1, max: 5, required: true },
    { name: 'text', type: 'textarea', required: true },
    { name: 'projectLink', type: 'text' },
    {
      name: 'service',
      type: 'select',
      options: ['Mix', 'Master', 'Mix & Master', 'Producing'],
    },
    { name: 'date', type: 'date' },
  ],
}
