/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hrms/db', '@hrms/types', '@hrms/ui', '@hrms/email'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    outputFileTracingExcludes: {
      '**': [
        '.next/server/app/**/page_client-reference-manifest.js',
        '.next/server/app/polyfills.js',
      ],
    },
  },
}

export default nextConfig
