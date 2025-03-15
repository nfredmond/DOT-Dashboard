/**
 * This file preloads Leaflet resources synchronously to avoid context issues.
 * It should be imported at the top of any file that uses Leaflet components.
 */

// Import our fallback CSS
const loadFallbackCSS = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!document.querySelector('link[href="/leaflet-fallback.css"]')) {
      const fallbackLink = document.createElement('link');
      fallbackLink.rel = 'stylesheet';
      fallbackLink.href = '/leaflet-fallback.css';
      document.head.appendChild(fallbackLink);
      console.log('Added fallback CSS for Leaflet via preload');
    }
  } catch (error) {
    console.error('Error loading fallback CSS:', error);
  }
};

// Load the public preload script
const loadPreloadScript = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!document.querySelector('script[src="/leaflet-preload.js"]')) {
      const preloadScript = document.createElement('script');
      preloadScript.src = '/leaflet-preload.js';
      preloadScript.async = true;
      preloadScript.onerror = (error) => {
        console.error('Failed to load leaflet-preload.js:', error);
      };
      document.head.appendChild(preloadScript);
      console.log('Added leaflet-preload.js via preload');
    }
  } catch (error) {
    console.error('Error loading preload script:', error);
  }
};

// Only run in browser environment with proper DOM
const runPreload = () => {
  if (typeof window === 'undefined' || !document || !document.head) return;

  try {
    // Load Leaflet synchronously if it's not already loaded
    if (!window.L) {
      // First load the fallback CSS as a safety measure
      loadFallbackCSS();
      
      // Then try to load the preload script 
      loadPreloadScript();
    }
  } catch (error) {
    console.error('Error in Leaflet preload:', error);
  }
};

// Execute preload when imported
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after component mounting
  setTimeout(() => {
    runPreload();
  }, 0);
}

// Create a global initialization function that components can call directly
export const ensureLeafletLoaded = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    runPreload();
    return !!window.L;
  } catch (error) {
    console.error('Error ensuring Leaflet is loaded:', error);
    return false;
  }
};

// Export a check function to verify Leaflet is available
export const isLeafletLoaded = () => {
  if (typeof window === 'undefined') return false;
  return !!window.L;
};

// Export default for named imports
export default {
  ensureLeafletLoaded,
  isLeafletLoaded
};

// Export utility functions for use in other files
export { loadFallbackCSS, loadPreloadScript };

/**
 * This file is imported synchronously to ensure Leaflet CSS is loaded
 * before any Leaflet components are rendered
 */

// Only run on client side
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
    console.log('Leaflet CSS preloaded');
  }
} 