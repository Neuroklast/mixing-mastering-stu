import type { Metadata } from 'next'
import Link from 'next/link'
import { Waveform } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Legal – SONORATIVA',
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <>
      {/* Minimal navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Waveform className="h-5 w-5 text-[--accent]" weight="bold" />
            <span className="font-bold tracking-tighter font-heading text-sm md:text-base">SONORATIVA</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main id="main-content" className="container max-w-4xl mx-auto px-4 md:px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-4xl mx-auto px-4 md:px-6">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider text-center">
            © {new Date().getFullYear()} SONORATIVA · Professional Audio Engineering
          </p>
        </div>
      </footer>
    </>
  )
}
