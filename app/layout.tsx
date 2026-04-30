import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SONORATIVA – Professional Audio Engineering',
  description:
    'Industrial-grade mixing and mastering services for the modern producer. Crafted with technical precision and creative vision.',
  keywords: ['mixing', 'mastering', 'audio engineering', 'music production', 'studio'],
  openGraph: {
    title: 'SONORATIVA – Professional Audio Engineering',
    description: 'Industrial-grade mixing and mastering services for the modern producer.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        {/* Google Fonts – loaded at runtime, falls back to system fonts in this environment */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="vignette scanlines grain">{children}</body>
    </html>
  )
}
