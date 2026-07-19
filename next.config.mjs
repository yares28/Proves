/** @type {import('next').NextConfig} */

// Supabase project origin (REST + realtime websocket) the browser talks to.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co'

// Content-Security-Policy. 'unsafe-inline' is required for scripts because Next
// injects inline hydration/bootstrap scripts (and we render inline JSON-LD), and
// for styles because Tailwind/Framer Motion emit inline styles. It still blocks
// loading executable script from any third-party origin, which is the main XSS
// lever. connect-src is scoped to Supabase (incl. websocket) and Vercel's
// analytics beacon.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://va.vercel-scripts.com https://vercel.live`,
  `frame-src 'self'`,
  `upgrade-insecure-requests`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  eslint: {
    // Surface lint problems during builds instead of hiding them.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Fail the build on type errors instead of shipping them.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
