/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack(config, { isServer }) {
    config.externals = [...config.externals, 'onnxruntime-node']
    return config
  },
}

export default nextConfig
