import Link from 'next/link'
import { Waveform } from '@phosphor-icons/react/dist/ssr'

export const Footer = (): JSX.Element => (
  <footer className="relative z-10 border-t border-[--border] py-8 bg-[--card]/50 backdrop-blur-sm">
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Waveform className="h-5 w-5 text-[--accent]" weight="bold" />
          <span className="font-bold tracking-tighter font-heading">SONORATIVA</span>
        </div>

        {/* Legal links */}
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link
            href="/legal/privacy"
            className="text-xs font-mono uppercase tracking-wider text-[--muted-foreground] hover:text-[--accent] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/legal/terms"
            className="text-xs font-mono uppercase tracking-wider text-[--muted-foreground] hover:text-[--accent] transition-colors"
          >
            Terms of Service
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-[--muted-foreground] font-mono uppercase tracking-wider text-center md:text-right">
          © {new Date().getFullYear()} SONORATIVA · Professional Audio Engineering
        </p>

      </div>
    </div>
  </footer>
)
