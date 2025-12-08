/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  output: 'standalone',
  images: {
    domains: ['localhost', 'competitorlens.com', 'api.competitorlens.com'],
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
      {
        source: '/features-simple',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/features-simple/:id',
        destination: '/features/:id',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
