import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { LenisProvider } from '@/components/providers/LenisProvider'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { getSiteContent } from '@/services/contentService'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sonorativa.com'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  const faviconUrl = content.favicon_url || null

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: 'SONORATIVA – Professional Audio Engineering',
      template: '%s | SONORATIVA',
    },
    description:
      'Industrial-grade mixing and mastering services for the modern producer. Crafted with technical precision.',
    keywords: ['mixing', 'mastering', 'audio engineering', 'music production'],
    openGraph: {
      title: 'SONORATIVA – Professional Audio Engineering',
      description: 'Industrial-grade mixing and mastering for the modern producer.',
      type: 'website',
      url: siteUrl,
      siteName: 'SONORATIVA',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SONORATIVA – Professional Audio Engineering',
      description: 'Industrial-grade mixing and mastering for the modern producer.',
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: faviconUrl ? { icon: faviconUrl } : { icon: '/favicon.ico' },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}> 
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="vignette scanlines grain"> 
        {/* Skip-to-content link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:uppercase focus:tracking-wider focus:text-foreground focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <LenisProvider>
          {children}
        </LenisProvider>
        {/* CRT screen effect: corner vignette + scanline boost + subtle flicker */}
        <div className="crt-overlay" aria-hidden="true" />
        {/* Vercel Analytics — mounted only after cookie consent */}
        <AnalyticsProvider />
      </body>
    </html>
  )
}