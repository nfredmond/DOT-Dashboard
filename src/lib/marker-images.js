/**
 * This module provides mock exports for marker icon images.
 * It's used as a replacement during build time for image imports that might cause errors.
 * At runtime, these URLs won't actually be used since we're applying fixes to use CDN URLs.
 */

// Mock URLs (these are not actually used at runtime, but satisfy the import)
// If they were used, they would point to CDN versions
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Named exports
export { markerIcon, markerIcon2x, markerShadow };

// Default export for convenience
export default {
  markerIcon,
  markerIcon2x,
  markerShadow
}; 