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
    <section id="services" className="py-0">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative p-6 md:p-8 bg-secondary/30 border-border transition-all hover:border-accent/50 hover:glow-accent ${
                pkg.popular ? 'border-accent/50 glow-accent' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider">
                  Best Value
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-card-foreground tracking-tight uppercase">
                  {pkg.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-mono">{pkg.tagline}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-accent tracking-tighter">{pkg.price}</span>
                  <span className="text-sm text-muted-foreground font-mono uppercase">per track</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-wider">
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
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-mono uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
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
