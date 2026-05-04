/** @type {import('next').NextConfig} */

// Derive hostname from R2_PUBLIC_HOST (e.g. "pub-abc123.r2.dev" or a custom domain)
// Used to whitelist R2 media images for next/image optimisation.
function r2PublicHostname() {
  const host = process.env.R2_PUBLIC_HOST
  if (!host) return null
  try {
    return new URL(host.startsWith('http') ? host : `https://${host}`).hostname
  } catch {
    return null
  }
}

const r2Hostname = r2PublicHostname()

const nextConfig = {
  outputFileTracingExcludes: {
    '*': [
      'node_modules/three/**',
      'node_modules/@react-three/**',
      'node_modules/postprocessing/**',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Legacy Supabase Storage URLs (kept for any remaining rows that haven't been re-uploaded to R2)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Demo / placeholder images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Cloudflare R2 default S3 endpoint (covers any bucket/account without a custom domain)
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // Cloudflare R2 public dev URLs (pub-xxx.r2.dev) — fallback when R2_PUBLIC_HOST is not set
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // Cloudflare R2 custom domain — read from env so each environment whitelists its own host.
      // R2_PUBLIC_HOST must be set on Vercel for <Image> optimisation to work with R2 media.
      ...(r2Hostname
        ? [{ protocol: /** @type {'https'} */ ('https'), hostname: r2Hostname }]
        : []),
    ],
  },
}

export default nextConfig
