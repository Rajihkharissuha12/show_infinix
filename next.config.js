/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: "/api/socket/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
