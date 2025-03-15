/** @type {import('next').NextConfig} */
const nextConfig = {
  // We need to include some transpilation for the leaflet packages
  transpilePackages: [
    'leaflet',
    'leaflet-draw',
    'react-leaflet',
    '@react-leaflet/core',
    'leaflet-defaulticon-compatibility',
    'react-leaflet-cluster'
  ],
  // Configure webpack for image handling only
  webpack: (config, { webpack, isServer }) => {
    // Define the path to our marker images module
    const markerImagesPath = require.resolve('./src/lib/marker-images.js');

    // Add NormalModuleReplacementPlugin to redirect marker imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-leaflet-cluster[\/\\]dist[\/\\]assets[\/\\]marker-icon-2x\.png$/,
        markerImagesPath
      )
    );

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-leaflet-cluster[\/\\]dist[\/\\]assets[\/\\]marker-icon\.png$/,
        markerImagesPath
      )
    );

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /react-leaflet-cluster[\/\\]dist[\/\\]assets[\/\\]marker-shadow\.png$/,
        markerImagesPath
      )
    );

    // Add aliases for problematic image imports in react-leaflet-cluster
    config.resolve.alias = {
      ...config.resolve.alias,
      // Override react-leaflet-cluster's assets with resolved paths
      './assets/marker-icon-2x.png': markerImagesPath,
      './assets/marker-icon.png': markerImagesPath,
      './assets/marker-shadow.png': markerImagesPath,
    };

    // Add font file handling
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });

    // Ignore specific libraries from server-side rendering (prevents SSR issues)
    if (isServer) {
      config.externals = [...config.externals, 'react-leaflet-cluster', 'leaflet-draw', 'leaflet-defaulticon-compatibility'];
    }

    // Add rule for markdown files to prevent import errors
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
  // Disable image optimizer for marker icons
  images: {
    disableStaticImages: true,
  },
};

module.exports = nextConfig; 