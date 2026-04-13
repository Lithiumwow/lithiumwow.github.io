/** @type {import('next').NextConfig} */
/* Keep `basePath` aligned with `siteBasePath` in `lib/site-config.ts`. */
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
