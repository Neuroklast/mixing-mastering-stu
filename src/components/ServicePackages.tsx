import { Check, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ServicePackage {
  id: string
  name: string
  tagline: string
  price: string
  turnaround: string
  features: { name: string; included: boolean }[]
  popular?: boolean
}

const packages: ServicePackage[] = [
  {
    id: 'mixing',
    name: 'Mixing',
    tagline: 'Professional mix engineering',
    price: '$200',
    turnaround: '3-5 days',
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
    price: '$100',
    turnaround: '1-2 days',
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
    price: '$275',
    turnaround: '4-7 days',
    popular: true,
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

interface ServicePackagesProps {
  onSelectPackage: (packageId: string) => void
}

export function ServicePackages({ onSelectPackage }: ServicePackagesProps) {
  return (
    <section id="services" className="py-16 md:py-24">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Service Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional audio engineering services tailored to your needs. All packages include high-quality processing and dedicated support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative p-6 md:p-8 bg-card border-border transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 ${
                pkg.popular ? 'border-accent/50 shadow-lg shadow-accent/10' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs font-semibold font-mono">
                  BEST VALUE
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-card-foreground">
                  {pkg.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{pkg.tagline}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-accent">{pkg.price}</span>
                  <span className="text-sm text-muted-foreground">per track</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground mt-2">
                  Turnaround: {pkg.turnaround}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" weight="bold" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-card-foreground' : 'text-muted-foreground/60'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all hover:scale-105 active:scale-95"
                onClick={() => onSelectPackage(pkg.id)}
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
