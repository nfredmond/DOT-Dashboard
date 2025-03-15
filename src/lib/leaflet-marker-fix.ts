/**
 * Fix for Leaflet marker icons in Next.js
 * 
 * This module provides a solution for the common issue with Leaflet marker icons
 * not loading properly in Next.js applications, especially during build time.
 */

import L from 'leaflet';

/**
 * Fixes Leaflet marker icon paths to use CDN URLs instead of local files
 * which might not be properly handled by Next.js
 */
export function fixLeafletMarker() {
  // Skip if not in browser environment
  if (typeof window === 'undefined') return;
  
  // Set a timeout to allow Leaflet to load
  setTimeout(() => {
    // Check if Leaflet is available
    if (!L || !L.Icon || !L.Icon.Default) {
      console.warn('Leaflet not loaded yet, cannot fix marker icons');
      return;
    }
    
    try {
      // Remove default icon settings to prevent partial loads
      delete L.Icon.Default.prototype._getIconUrl;
      
      // Set new icon paths using absolute CDN URLs
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });
      
      console.log('Successfully fixed Leaflet marker icons with CDN URLs');
    } catch (error) {
      console.error('Error fixing Leaflet marker icons:', error);
    }
  }, 100);
}

// Listen for Leaflet to become available
if (typeof window !== 'undefined') {
  // Set up listener to apply fix when Leaflet becomes available
  if (typeof L === 'undefined' || !L.Icon) {
    const checkInterval = setInterval(() => {
      if (typeof L !== 'undefined' && L.Icon) {
        fixLeafletMarker();
        clearInterval(checkInterval);
      }
    }, 100);
    
    // Don't check forever
    setTimeout(() => clearInterval(checkInterval), 10000);
  } else {
    // Leaflet already available, apply fix now
    fixLeafletMarker();
  }
} 