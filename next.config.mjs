/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Trance-24x7',
  assetPrefix: '/Trance-24x7/',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
