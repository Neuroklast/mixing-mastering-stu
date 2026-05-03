import type { CollectionConfig } from 'payload'

export const Legal: CollectionConfig = {
  slug: 'legal',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Legal pages: Impressum, Datenschutzerklärung, etc.',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Page Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'URL Slug',
      admin: {
        description: 'e.g. "impressum" or "datenschutz". Used to build the /legal/<slug> URL.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Page Content',
    },
    {
      name: 'lastUpdated',
      type: 'date',
      label: 'Last Updated Date',
      admin: { description: 'Displayed at the top of the page.' },
    },
  ],
  timestamps: true,
}
