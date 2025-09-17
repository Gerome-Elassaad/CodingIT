/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:events": false,
        "node:process": false,
        "node:util": false
      };
      config.resolve.fallback = {
        "child_process": false,
        "fs": false,
        "net": false,
        "tls": false,
        "events": false,
        "process": false,
        "util": false
      };
    }
    return config;
  }
}

export default nextConfig
