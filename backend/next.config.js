/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001'],
    },
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig