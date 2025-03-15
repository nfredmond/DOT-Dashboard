/**
 * Utility to fix common Leaflet issues in Next.js
 */

/**
 * Fixes Leaflet's default icon paths which can break in Next.js
 * Should be called before using any Leaflet markers
 */
export function fixLeafletIcon() {
  if (typeof window !== 'undefined') {
    // Try to import Leaflet as a module
    try {
      // Dynamic import to avoid SSR issues
      import('leaflet').then(L => {
        // Fix the icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/images/marker-icon-2x.png',
          iconUrl: '/images/marker-icon.png',
          shadowUrl: '/images/marker-shadow.png',
        });
        
        console.log('Leaflet icon paths fixed');
      }).catch(err => {
        console.error('Failed to import Leaflet:', err);
      });
    } catch (error) {
      console.error('Error fixing Leaflet icons:', error);
    }
  }
}

/**
 * Fix missing CSS for Leaflet on first load
 */
export function ensureLeafletCSS() {
  if (typeof window !== 'undefined') {
    // Check if Leaflet CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    
    if (!existingLink) {
      // Add the Leaflet CSS link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      
      document.head.appendChild(link);
      console.log('Leaflet CSS added to document');
    }
  }
} 