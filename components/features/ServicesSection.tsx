'use client'

import { Check, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SERVICES_CONFIG, type ServicePackage } from '@/lib/services-config'

interface ServiceCardProps {
  pkg: ServicePackage
  onSelect: (packageId: string) => void
}

const ServiceCard = ({ pkg, onSelect }: ServiceCardProps): JSX.Element => (
  <div
    className={cn(
      'relative p-6 md:p-8 bg-secondary/30 border border-border rounded transition-all',
      'hover:border-accent/50 hover:glow-accent',
      pkg.isBestValue && 'border-accent/50 glow-accent',
    )}
  >
    {pkg.isBestValue && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider">
        Best Value
      </div>
    )}

    <div className="mb-6">
      <h3 className="text-2xl font-bold mb-2 tracking-tight uppercase font-heading">{pkg.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 font-mono">{pkg.tagline}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-accent tracking-tighter">{pkg.displayPrice}</span>
        <span className="text-sm text-muted-foreground font-mono uppercase">per track</span>
      </div>
      <p className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-wider">
        Turnaround: {pkg.turnaround}
      </p>
    </div>

    <ul className="space-y-3 mb-8">
      {pkg.features.map((feature) => (
        <li key={feature.name} className="flex items-start gap-3">
          {feature.included
            ? <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" weight="bold" />
            : <X className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
          <span className={cn('text-sm', feature.included ? 'text-foreground' : 'text-muted-foreground/60')}>
            {feature.name}
          </span>
        </li>
      ))}
    </ul>

    <Button
      className="w-full bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
      onClick={() => onSelect(pkg.id)}
    >
      Get Started
    </Button>
  </div>
)

interface ServicesSectionProps {
  onSelectPackage: (packageId: string) => void
}

export const ServicesSection = ({ onSelectPackage }: ServicesSectionProps): JSX.Element => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {SERVICES_CONFIG.map((pkg) => (
      <ServiceCard key={pkg.id} pkg={pkg} onSelect={onSelectPackage} />
    ))}
  </div>
)
