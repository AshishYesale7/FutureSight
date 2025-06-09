/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '/FutureSight',
  assetPrefix: '/FutureSight/',
}

module.exports = nextConfig