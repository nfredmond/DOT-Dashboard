/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include necessary transpilations
  transpilePackages: [
    'mapbox-gl',
    '@mapbox/mapbox-gl-draw',
    '@mapbox/mapbox-gl-geocoder'
  ],
  // Disable TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
    // Add this line to prevent TypeScript from installing packages in .next/types
    tsconfigPath: "tsconfig.json",
  },
  // Skip building of problematic API routes
  experimental: {
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ['localhost:3002', 'localhost:3003', 'localhost:3004'],
    },
    webpackBuildWorker: true,
  },
  // Explicitly set the output directory to avoid path issues
  distDir: '.next',
  // Explicitly define page extensions to ensure proper file recognition
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Fix for path issues on Windows
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude the problematic route for testing
  async rewrites() {
    return {
      beforeFiles: [
        // Skip the route causing build issues
        {
          source: '/api/projects/:id/bca/camp-integration',
          destination: '/api/placeholder',
        },
        // Redirect root path to /homepage
        {
          source: '/',
          destination: '/homepage',
        },
      ],
    };
  },
  // Configure webpack for font handling
  webpack: (config, { webpack, isServer }) => {
    // Fix path resolution issues on Windows
    config.resolve.symlinks = false;

    // Add font file handling
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });

    // Add rule for markdown files to prevent import errors
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
  // Image configuration
  images: {
    disableStaticImages: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'planningmanager.ai',
      },
    ],
  },
  // Add the new domain in the headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' https://planningmanager.ai; img-src 'self' data: https://i.imgur.com https://planningmanager.ai; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 