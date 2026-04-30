import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'clientName',
    group: 'Studio',
    defaultColumns: ['clientName', 'serviceType', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    create: () => true,
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'engineer',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
      label: 'Client Name',
    },
    {
      name: 'clientEmail',
      type: 'email',
      required: true,
      label: 'Client Email',
    },
    {
      name: 'serviceType',
      type: 'select',
      required: true,
      label: 'Service Type',
      options: [
        { label: 'Mixing', value: 'mixing' },
        { label: 'Mastering', value: 'mastering' },
        { label: 'Mix + Master', value: 'mixing_mastering' },
      ],
    },
    {
      name: 'packageTier',
      type: 'select',
      required: true,
      label: 'Package Tier',
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Professional', value: 'professional' },
        { label: 'Premium', value: 'premium' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Review', value: 'review' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'totalPrice',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Total Price (EUR)',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
    },
  ],
  timestamps: true,
}
