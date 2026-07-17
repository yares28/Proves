/** @type {import('next').NextConfig} */
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
}

export default nextConfig
