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

    // Disable webpack filesystem cache to prevent serialization issues with large strings
    config.cache = false;

    // Configure webpack optimizations for better cache performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };

    return config;
  }
}

export default nextConfig
