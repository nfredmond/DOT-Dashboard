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

/**
 * Mapbox utility functions
 */
import mapboxgl from 'mapbox-gl';

// Initialize Mapbox token from environment variable or user preferences
export const initMapboxToken = (userToken?: string): boolean => {
  // First try user-provided token if available
  const token = userToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!token) {
    console.error("Missing Mapbox access token. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.");
    return false;
  }
  
  mapboxgl.accessToken = token;
  return true;
};

// Get user-specific map preferences
export const getUserMapPreferences = (userId: string): any => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // Try to get user-specific preferences from localStorage
    const prefsString = localStorage.getItem(`map_prefs_${userId}`);
    if (prefsString) {
      return JSON.parse(prefsString);
    }
    
    // If not found, check for any serialized prefs in the DOM
    // This allows server-rendered preferences to be used
    const prefsElement = document.getElementById(`map_prefs_data_${userId}`);
    if (prefsElement && prefsElement.textContent) {
      const prefs = JSON.parse(prefsElement.textContent);
      // Cache in localStorage for future use
      localStorage.setItem(`map_prefs_${userId}`, JSON.stringify(prefs));
      return prefs;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving user map preferences:', error);
    return null;
  }
};

// Save user-specific map preferences
export const saveUserMapPreferences = (userId: string, preferences: any): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(`map_prefs_${userId}`, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving user map preferences:', error);
    return false;
  }
};

// Map style constants
export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1'
};

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  style: MAP_STYLES.STREETS,
  center: [-122.4194, 37.7749], // San Francisco by default
  zoom: 12,
  minZoom: 2,
  maxZoom: 18,
  pitch: 0, // For 3D view
  bearing: 0,
  attributionControl: true,
  logoPosition: 'bottom-left' as const
};

// Helper to create marker element with custom CSS
export const createCustomMarker = (
  type: string, 
  color: string = '#FF0000', 
  size: number = 30
): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = `custom-marker ${type}`;
  el.style.backgroundColor = color;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.justifyContent = 'center';
  el.style.alignItems = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
  
  return el;
};

// Helper to create a pulsing dot (useful for current location)
export const createPulsingDot = (color: string = '#3FB1CE'): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'pulsing-dot';
  el.style.backgroundColor = color;
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.boxShadow = '0 0 0 rgba(0, 0, 0, 0.2)';
  el.style.border = '2px solid white';
  el.style.animation = 'pulse 1.5s infinite';

  // Add the animation keyframes
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      70% { transform: scale(1.5); opacity: 0; }
      100% { transform: scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  return el;
};

// Helper to fly to a location with animation
export const flyToLocation = (
  map: mapboxgl.Map,
  lng: number,
  lat: number,
  zoom: number = 15,
  pitch: number = 0,
  bearing: number = 0,
  duration: number = 2000
): void => {
  map.flyTo({
    center: [lng, lat],
    zoom,
    pitch,
    bearing,
    essential: true,
    duration
  });
};

// Helper to create a geolocation control
export const addGeolocationControl = (
  map: mapboxgl.Map, 
  onSuccess?: (position: GeolocationPosition) => void
): mapboxgl.GeolocateControl => {
  const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  });
  
  map.addControl(geolocateControl, 'top-right');
  
  if (onSuccess) {
    map.on('geolocate', (e: any) => {
      if (e && e.coords) {
        onSuccess(e);
      }
    });
  }
  
  return geolocateControl;
};

// Helper to fit map to a GeoJSON bounds
export const fitMapToBounds = (
  map: mapboxgl.Map,
  geojson: GeoJSON.FeatureCollection,
  padding: number = 50
): void => {
  // Create a 'LngLatBounds' with both corners at the first coordinate
  if (!geojson.features || geojson.features.length === 0) return;
  
  const bounds = new mapboxgl.LngLatBounds();
  
  // Extend the bounds to include all coordinates in all features
  geojson.features.forEach(feature => {
    if (feature.geometry) {
      if (feature.geometry.type === 'Point') {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      } else if (
        feature.geometry.type === 'LineString' ||
        feature.geometry.type === 'MultiPoint'
      ) {
        (feature.geometry.coordinates as [number, number][]).forEach(coord => {
          bounds.extend(coord);
        });
      } else if (
        feature.geometry.type === 'Polygon' ||
        feature.geometry.type === 'MultiLineString'
      ) {
        (feature.geometry.coordinates as [number, number][][]).forEach(line => {
          line.forEach(coord => {
            bounds.extend(coord);
          });
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        (feature.geometry.coordinates as [number, number][][][]).forEach(polygon => {
          polygon.forEach(line => {
            line.forEach(coord => {
              bounds.extend(coord);
            });
          });
        });
      }
    }
  });
  
  // Only fit bounds if we have coordinates
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding,
      maxZoom: 15
    });
  }
};

// Enable 3D terrain
export const enable3DTerrain = (map: mapboxgl.Map, exaggeration: number = 1.5): void => {
  map.on('load', () => {
    map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    });
    
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': exaggeration });
  });
};

// Add 3D building layer
export const add3DBuildings = (map: mapboxgl.Map): void => {
  map.on('load', () => {
    // Check if the style has a "building" layer
    const layers = map.getStyle().layers;
    if (layers && layers.find(layer => layer.id === 'building')) {
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
    }
  });
};

// Helper to create a debug layer for development
export const addDebugLayer = (map: mapboxgl.Map): void => {
  map.showTileBoundaries = true;
  map.showCollisionBoxes = true;
  map.showTerrainWireframe = true;
};

// Injects mapbox custom styles into the page
export const injectMapboxCustomStyles = (): void => {
  // Check if styles already exist
  if (document.getElementById('mapbox-custom-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'mapbox-custom-styles';
  style.innerHTML = `
    /* Custom marker styles */
    .mapboxgl-marker {
      cursor: pointer;
    }
    
    /* Custom pulsing dot animation */
    .pulsing-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(0, 0, 0, 0.2);
      border: 2px solid white;
    }
    
    /* Custom popup styles */
    .mapboxgl-popup-content {
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);
    }
    
    .mapboxgl-popup-close-button {
      font-size: 16px;
      color: #666;
      right: 8px;
      top: 8px;
    }
    
    /* Marker type styles */
    .custom-marker.project {
      background-color: #3b82f6;
    }
    
    .custom-marker.issue {
      background-color: #ef4444;
    }
    
    .custom-marker.suggestion {
      background-color: #22c55e;
    }
    
    .custom-marker.comment {
      background-color: #f59e0b;
    }
  `;
  
  document.head.appendChild(style);
}; 