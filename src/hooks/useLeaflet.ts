import { isLeafletLoaded, ensureLeafletLoaded } from '@/lib/leaflet-preload'; 
import type { Map as LeafletMap } from 'leaflet';
import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/logger';

// Augment window with Leaflet global
declare global {
  interface Window {
    L: any; // Use 'any' for compatibility
    _leaflet?: any;
    leafletMapInstance: any; // Changed from optional to required
    _leaflet_map_instances?: any[]; // Use 'any[]' for compatibility
  }
}

interface UseLeafletReturn {
  map: LeafletMap | null;
  leafletLoaded: boolean;
  leafletInstance: typeof import('leaflet') | null;
  initializeMap: (containerElement: HTMLElement, options?: any) => LeafletMap | null;
}

/**
 * Custom hook to safely load and handle Leaflet
 * Uses multiple strategies to ensure Leaflet is properly loaded
 */
export function useLeaflet(): UseLeafletReturn {
  const [leafletLoaded, setLeafletLoaded] = useState(isLeafletLoaded());
  const [leafletInstance, setLeafletInstance] = useState<typeof import('leaflet') | null>(
    typeof window !== 'undefined' && window.L ? window.L : null
  );
  const [map, setMap] = useState<LeafletMap | null>(null);

  // Function to safely initialize a Leaflet map
  const initializeMap = useCallback((containerElement: HTMLElement, options = {}) => {
    if (!leafletLoaded || !leafletInstance || !window.L) {
      logger.warn('Attempted to initialize map before Leaflet was loaded');
      return null;
    }
    
    // Check if element exists in DOM
    if (!document.body.contains(containerElement)) {
      logger.error('Container element is not in the DOM');
      return null;
    }
    
    // Ensure container has dimensions
    if (containerElement.clientWidth === 0 || containerElement.clientHeight === 0) {
      logger.warn('Container has zero width or height, setting minimum dimensions');
      containerElement.style.minWidth = '300px';
      containerElement.style.minHeight = '300px';
      
      // Force layout recalculation
      containerElement.getBoundingClientRect();
    }
    
    // Ensure container is visible
    containerElement.style.display = 'block';
    containerElement.style.visibility = 'visible';
    
    // Set default options
    const defaultOptions = {
      center: [51.505, -0.09],
      zoom: 13,
      preferCanvas: true,
      zoomControl: false, // We'll add our own zoom control
      attributionControl: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      logger.log('Initializing map with container element:', containerElement);
      logger.log('Container element size:', containerElement.clientWidth, containerElement.clientHeight);
      
      // Clean up any existing map with the same container first
      if (typeof containerElement.id === 'string' && containerElement.id) {
        window._leaflet_map_instances = window._leaflet_map_instances || [];
        const existingMapInstance = window._leaflet_map_instances.find(
          (m: any) => m?._container === containerElement
        );
        
        if (existingMapInstance) {
          logger.warn('Found existing map instance for this container, removing it first');
          try {
            existingMapInstance.remove();
          } catch (e) {
            logger.warn('Error removing existing map:', e);
          }
        }
      }
      
      // Create a new map instance
      const newMap = window.L.map(containerElement, mergedOptions);
      
      // Immediately invalidate size to handle any container dimension issues
      setTimeout(() => {
        try {
          newMap.invalidateSize(true);
          logger.log('Map size invalidated after initialization');
        } catch (e) {
          logger.warn('Error invalidating map size:', e);
        }
      }, 100);
      
      // Try again with longer delay to ensure it takes effect
      setTimeout(() => {
        try {
          newMap.invalidateSize(true);
          logger.log('Map size invalidated second time');
        } catch (e) {
          logger.warn('Error invalidating map size second time:', e);
        }
      }, 500);
      
      setMap(newMap);
      
      // Store in global registry for easier tracking
      window._leaflet_map_instances = window._leaflet_map_instances || [];
      window._leaflet_map_instances.push(newMap);
      window.leafletMapInstance = newMap;
      
      logger.log('Map initialized successfully');
      
      return newMap;
    } catch (error) {
      logger.error('Failed to initialize Leaflet map:', error);
      return null;
    }
  }, [leafletLoaded, leafletInstance]);

  useEffect(() => {
    logger.log('useLeaflet: Loading Leaflet...');
    const loadLeaflet = async () => {
      try {
        // First try to use our preload utility
        logger.log('useLeaflet: Trying preload utility...');
        const loaded = ensureLeafletLoaded();
        
        if (loaded && window.L) {
          logger.log('useLeaflet: Leaflet loaded via preload');
          setLeafletInstance(window.L);
          setLeafletLoaded(true);
          return;
        }
        
        // Fallback: try dynamic import if preload failed
        if (!loaded) {
          logger.warn('useLeaflet: Preload failed, trying dynamic import');
          
          // Only attempt dynamic import if in browser
          if (typeof window !== 'undefined') {
            logger.log('useLeaflet: Importing Leaflet dynamically');
            const L = await import('leaflet');
            window.L = L;
            setLeafletInstance(L);
            setLeafletLoaded(true);
            logger.log('useLeaflet: Leaflet loaded via dynamic import');
            
            // Also try to load CSS
            try {
              // Only add if not already present
              if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
              }
            } catch (err) {
              logger.warn('Dynamic CSS import failed, relying on preloaded CSS');
            }
          }
        }
      } catch (error) {
        logger.error('Failed to load Leaflet:', error);
      }
    };

    if (!leafletLoaded) {
      loadLeaflet();
    } else {
      logger.log('useLeaflet: Leaflet already loaded');
    }
    
    // Cleanup function
    return () => {
      if (map) {
        logger.log('useLeaflet: Cleaning up map instance');
        
        // Make sure to invalidate the map size before removing it
        try {
          map.invalidateSize();
        } catch (e) {
          logger.warn('Error invalidating map size:', e);
        }
        
        // Wait a small amount of time before removing the map
        setTimeout(() => {
          try {
            map.remove();
          } catch (e) {
            logger.warn('Error removing map:', e);
          }
          
          setMap(null);
          
          // Also clean up global references
          if (window.leafletMapInstance === map) {
            window.leafletMapInstance = null;
          }
          
          if (window._leaflet_map_instances) {
            window._leaflet_map_instances = window._leaflet_map_instances.filter(m => m !== map);
          }
        }, 300); // Increased from 100ms to 300ms for more reliable cleanup
      }
    };
  }, [leafletLoaded, map]);

  return { map, leafletLoaded, leafletInstance, initializeMap };
} 