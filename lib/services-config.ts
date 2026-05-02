/**
 * Service package definitions – single source of truth for all pricing,
 * turnaround times, features, and identifiers.
 *
 * Used by:
 *   - components/features/ServicesSection.tsx  (display cards)
 *   - components/features/ContactDialog.tsx     (select options, price lookup,
 *                                                package-tier mapping)
 */

export type ServiceId = 'mixing' | 'mastering' | 'bundle'
export type PackageTier = 'starter' | 'professional' | 'premium'

export interface ServiceFeature {
  name: string
  included: boolean
}

export interface ServicePackage {
  id: ServiceId
  name: string
  tagline: string
  /** Numeric price in USD, used for order creation. */
  priceUsd: number
  /** Human-readable price string shown in the UI. */
  displayPrice: string
  turnaround: string
  packageTier: PackageTier
  features: ServiceFeature[]
  isBestValue?: boolean
}

export const SERVICES_CONFIG: ServicePackage[] = [
  {
    id: 'mixing',
    name: 'Mixing',
    tagline: 'Professional mix engineering',
    priceUsd: 200,
    displayPrice: '$200',
    turnaround: '3-5 days',
    packageTier: 'professional',
    features: [
      { name: 'Stereo mix', included: true },
      { name: 'Level balancing', included: true },
      { name: 'EQ & compression', included: true },
      { name: 'Effects & reverb', included: true },
      { name: 'Automation', included: true },
      { name: 'Up to 3 revisions', included: true },
      { name: 'Mastering', included: false },
      { name: 'Stems delivery', included: false },
    ],
  },
  {
    id: 'mastering',
    name: 'Mastering',
    tagline: 'Final polish for distribution',
    priceUsd: 100,
    displayPrice: '$100',
    turnaround: '1-2 days',
    packageTier: 'starter',
    features: [
      { name: 'Stereo mastering', included: true },
      { name: 'Loudness optimization', included: true },
      { name: 'EQ & compression', included: true },
      { name: 'Stereo enhancement', included: true },
      { name: 'Format delivery (WAV/MP3)', included: true },
      { name: 'Up to 2 revisions', included: true },
      { name: 'Mixing included', included: false },
      { name: 'Stem mastering', included: false },
    ],
  },
  {
    id: 'bundle',
    name: 'Mix + Master',
    tagline: 'Complete production package',
    priceUsd: 275,
    displayPrice: '$275',
    turnaround: '4-7 days',
    packageTier: 'professional',
    isBestValue: true,
    features: [
      { name: 'Full mixing service', included: true },
      { name: 'Professional mastering', included: true },
      { name: 'Priority turnaround', included: true },
      { name: 'Unlimited revisions', included: true },
      { name: 'Stems delivery', included: true },
      { name: 'Multiple formats', included: true },
      { name: 'Before/after comparison', included: true },
      { name: 'Free consultation call', included: true },
    ],
  },
]

/** Lookup a service package by ID. Returns undefined if not found. */
export function getServiceById(id: string): ServicePackage | undefined {
  return SERVICES_CONFIG.find((s) => s.id === id)
}
