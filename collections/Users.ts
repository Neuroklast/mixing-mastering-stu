import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'client',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Engineer', value: 'engineer' },
        { label: 'Client', value: 'client' },
      ],
    },
  ],
}
