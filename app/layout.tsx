import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SONORATIVA – Professional Audio Engineering',
  description:
    'Industrial-grade mixing and mastering services for the modern producer. Crafted with technical precision.',
  keywords: ['mixing', 'mastering', 'audio engineering', 'music production'],
  openGraph: {
    title: 'SONORATIVA – Professional Audio Engineering',
    description: 'Industrial-grade mixing and mastering for the modern producer.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="vignette scanlines grain">
        {/* Skip-to-content link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:uppercase focus:tracking-wider focus:text-foreground focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
