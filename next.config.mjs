/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/tranceradio',
  assetPrefix: '/tranceradio/',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
