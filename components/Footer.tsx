'use client'

import { Waveform } from '@phosphor-icons/react'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border py-8 bg-card/50 backdrop-blur-sm">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Waveform className="h-5 w-5 text-accent" weight="bold" />
            <span className="font-bold tracking-tighter font-heading">SONORATIVA</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
            © {new Date().getFullYear()} Professional Audio Engineering
          </p>
        </div>
      </div>
    </footer>
  )
}
