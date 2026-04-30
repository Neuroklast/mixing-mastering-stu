import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Shop',
    description: 'VST plugins, sample packs, and preset banks for sale.',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'productType',
      type: 'select',
      required: true,
      label: 'Product Type',
      options: [
        { label: 'VST Plugin', value: 'vst_plugin' },
        { label: 'Sample Pack', value: 'sample_pack' },
        { label: 'Preset Bank', value: 'preset_bank' },
      ],
    },
    {
      name: 'priceCents',
      type: 'number',
      required: true,
      label: 'Price (cents)',
      min: 0,
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'eur',
      options: [
        { label: 'EUR', value: 'eur' },
        { label: 'USD', value: 'usd' },
      ],
    },
    {
      name: 'licenseType',
      type: 'select',
      required: true,
      defaultValue: 'single',
      label: 'License Type',
      options: [
        { label: 'Single Use', value: 'single' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Unlimited', value: 'unlimited' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active (visible in shop)',
    },
    {
      name: 'stripeProductId',
      type: 'text',
      label: 'Stripe Product ID',
      admin: { description: 'Set after creating product in Stripe Dashboard.' },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      label: 'Stripe Price ID',
    },
    {
      name: 'downloadUrl',
      type: 'text',
      label: 'Download URL',
      admin: { description: 'Signed URL or protected path for digital delivery.' },
    },
  ],
  timestamps: true,
}
