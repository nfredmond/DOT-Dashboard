import { isLeafletLoaded, ensureLeafletLoaded } from '@/lib/leaflet-preload'; 
import type { Map as LeafletMap } from 'leaflet';
import { useState, useEffect, useCallback } from 'react';

// Augment window with Leaflet global
declare global {
  interface Window {
    L: typeof import('leaflet');
    _leaflet?: any;
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
      console.warn('Attempted to initialize map before Leaflet was loaded');
      return null;
    }
    
    // Set default options
    const defaultOptions = {
      center: [51.505, -0.09],
      zoom: 13,
      preferCanvas: true,
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Create a new map instance
      const newMap = window.L.map(containerElement, mergedOptions);
      setMap(newMap);
      return newMap;
    } catch (error) {
      console.error('Failed to initialize Leaflet map:', error);
      return null;
    }
  }, [leafletLoaded, leafletInstance]);

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // First try to use our preload utility
        const loaded = ensureLeafletLoaded();
        
        if (loaded && window.L) {
          setLeafletInstance(window.L);
          setLeafletLoaded(true);
          return;
        }
        
        // Fallback: try dynamic import if preload failed
        if (!loaded) {
          console.warn('Preload failed, trying dynamic import');
          
          // Only attempt dynamic import if in browser
          if (typeof window !== 'undefined') {
            const L = await import('leaflet');
            window.L = L;
            setLeafletInstance(L);
            setLeafletLoaded(true);
            
            // Also try to load CSS
            try {
              await import('leaflet/dist/leaflet.css');
            } catch (err) {
              console.warn('Dynamic CSS import failed, relying on preloaded CSS');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    if (!leafletLoaded) {
      loadLeaflet();
    }
    
    // Cleanup function
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [leafletLoaded, map]);

  return { map, leafletLoaded, leafletInstance, initializeMap };
} 