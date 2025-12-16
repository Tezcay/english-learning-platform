/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize undici for server-side code to avoid webpack bundling issues
      config.externals.push('undici')
    }
    return config
  },
}

module.exports = nextConfig