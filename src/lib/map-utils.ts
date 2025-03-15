/**
 * Map utilities that provide a global access point for Leaflet map instances
 * This helps solve cross-component access to map instances
 */

// MapInstance interface with minimal required operations
export interface MapInstance {
  setView: (center: [number, number], zoom: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  remove: () => void;
}

// Global store for map instances
let globalMapInstance: MapInstance | null = null;

/**
 * Register a map instance globally
 */
export function registerMapInstance(map: MapInstance): void {
  globalMapInstance = map;
  
  // Also register in window for direct script access
  if (typeof window !== 'undefined') {
    (window as any).leafletMapInstance = map;
    
    // Set up utility functions on window
    (window as any).leafletUtils = {
      zoomIn: () => {
        if (!map) return;
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom + 1);
          return true;
        } catch (error) {
          console.error('Error in zoomIn:', error);
          return false;
        }
      },
      
      zoomOut: () => {
        if (!map) return;
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom - 1);
          return true;
        } catch (error) {
          console.error('Error in zoomOut:', error);
          return false;
        }
      },
      
      resetView: (center: [number, number], zoom: number) => {
        if (!map) return;
        try {
          map.setView(center, zoom);
          return true;
        } catch (error) {
          console.error('Error in resetView:', error);
          return false;
        }
      }
    };
    
    console.log('Map instance and utilities registered globally');
  }
}

/**
 * Get the current map instance
 */
export function getMapInstance(): MapInstance | null {
  // First try our internal reference
  if (globalMapInstance) {
    return globalMapInstance;
  }
  
  // Then try window properties if we're in browser
  if (typeof window !== 'undefined') {
    const windowAny = window as any;
    
    // Try different ways the map instance might be stored
    if (windowAny.leafletMapInstance) {
      globalMapInstance = windowAny.leafletMapInstance;
      return globalMapInstance;
    }
    
    if (windowAny._mapInstance) {
      globalMapInstance = windowAny._mapInstance;
      return globalMapInstance;
    }
    
    // Try to get from Leaflet's internal structures
    if (window.L?.map) {
      try {
        // Try map instances array
        if (window.L.map._mapInstances?.[0]) {
          globalMapInstance = window.L.map._mapInstances[0];
          return globalMapInstance;
        }
        
        // Try through container element
        const container = document.querySelector('.leaflet-container');
        if (container) {
          const leafletId = (container as any)._leaflet_id;
          if (leafletId && window.L.map._layers?.[leafletId]) {
            globalMapInstance = window.L.map._layers[leafletId];
            return globalMapInstance;
          }
        }
      } catch (error) {
        console.error('Error accessing Leaflet instance:', error);
      }
    }
  }
  
  return null;
}

/**
 * Helper function to zoom in
 */
export function zoomIn(): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for zoom in');
    return false;
  }
  
  try {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + 1);
    console.log('Zoomed in to level:', currentZoom + 1);
    return true;
  } catch (error) {
    console.error('Error zooming in:', error);
    return false;
  }
}

/**
 * Helper function to zoom out
 */
export function zoomOut(): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for zoom out');
    return false;
  }
  
  try {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom - 1);
    console.log('Zoomed out to level:', currentZoom - 1);
    return true;
  } catch (error) {
    console.error('Error zooming out:', error);
    return false;
  }
}

/**
 * Helper function to reset view
 */
export function resetView(center: [number, number], zoom: number): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for reset view');
    return false;
  }
  
  try {
    map.setView(center, zoom);
    console.log('Reset view to center:', center, 'zoom:', zoom);
    return true;
  } catch (error) {
    console.error('Error resetting view:', error);
    return false;
  }
}

/**
 * Clean up map instance and utilities
 */
export function cleanupMapInstance(): void {
  globalMapInstance = null;
  
  if (typeof window !== 'undefined') {
    delete (window as any).leafletMapInstance;
    delete (window as any).leafletUtils;
  }
} 