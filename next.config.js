/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',           value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          // Referrer policy — don't leak URL to 3rd parties
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection',            value: '1; mode=block' },
          // Disable sensitive browser features
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Force HTTPS (production only — Vercel handles TLS)
          { key: 'Strict-Transport-Security',   value: 'max-age=63072000; includeSubDomains; preload' },
          // DNS prefetch control
          { key: 'X-DNS-Prefetch-Control',      value: 'on' },
        ],
      },
      {
        // API routes — add CORS lock-down (same origin only)
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control',           value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = nextConfig