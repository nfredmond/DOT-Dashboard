'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, RefObject } from 'react';
import mapboxgl from 'mapbox-gl';

// Define point-like geometry type more explicitly to match overloads
type MapboxPointLike = mapboxgl.PointLike | [mapboxgl.PointLike, mapboxgl.PointLike] | undefined;

interface MapboxContextState {
  map: mapboxgl.Map | null;
  mapInitialized: boolean;
  mapContainer: RefObject<HTMLDivElement> | null;
  selectedFeature: mapboxgl.MapboxGeoJSONFeature | null;
  setSelectedFeature: (feature: mapboxgl.MapboxGeoJSONFeature | null) => void;
  flyTo: (location: { lng: number; lat: number; zoom?: number }) => void;
  fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => void;
  addPopup: (lngLat: mapboxgl.LngLatLike, html: string) => mapboxgl.Popup;
  removePopups: () => void;
  getCurrentBounds: () => mapboxgl.LngLatBounds | null;
  queryRenderedFeatures: (
    pointOrBox?: MapboxPointLike,
    options?: { layers?: string[] }
  ) => mapboxgl.MapboxGeoJSONFeature[];
  registerMap: (mapInstance: mapboxgl.Map, container: RefObject<HTMLDivElement>) => void;
  loadMapboxToken: () => string | null;
  hasError: boolean;
  errorMessage: string | null;
  resetError: () => void;
}

const MapboxContext = createContext<MapboxContextState | undefined>(undefined);

interface MapboxProviderProps {
  children: ReactNode;
}

export function MapboxProvider({ children }: MapboxProviderProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapContainer, setMapContainer] = useState<RefObject<HTMLDivElement> | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<mapboxgl.MapboxGeoJSONFeature | null>(null);
  const [popups, setPopups] = useState<mapboxgl.Popup[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Mapbox token from environment
  const loadMapboxToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (token) {
        mapboxgl.accessToken = token;
        return token;
      } else {
        console.error('Mapbox token not found in environment variables');
        return null;
      }
    }
    return null;
  }, []);

  // Initialize Mapbox token
  useEffect(() => {
    loadMapboxToken();
  }, [loadMapboxToken]);

  // Cleanup popups when component unmounts
  useEffect(() => {
    return () => {
      removePopups();
    };
  }, []);

  // Register the map instance
  const registerMap = useCallback((mapInstance: mapboxgl.Map, container: RefObject<HTMLDivElement>) => {
    setMap(mapInstance);
    setMapContainer(container);
    
    // Set the map as initialized when it's loaded
    if (!mapInstance.loaded()) {
      mapInstance.on('load', () => {
        setMapInitialized(true);
      });
    } else {
      setMapInitialized(true);
    }
    
    // Clean up on map removal
    mapInstance.on('remove', () => {
      setMap(null);
      setMapInitialized(false);
      setMapContainer(null);
      removePopups();
    });
  }, []);

  // Fly to a location
  const flyTo = useCallback((location: { lng: number; lat: number; zoom?: number }) => {
    if (!map) return;
    
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: location.zoom || map.getZoom(),
      essential: true,
    });
  }, [map]);

  // Fit bounds with options
  const fitBounds = useCallback((bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => {
    if (!map) return;
    
    map.fitBounds(bounds, {
      padding: 40,
      ...options,
    });
  }, [map]);

  // Add a popup to the map
  const addPopup = useCallback((lngLat: mapboxgl.LngLatLike, html: string) => {
    if (!map) throw new Error('Map is not initialized');
    
    const popup = new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);
    
    setPopups((prev) => [...prev, popup]);
    return popup;
  }, [map]);

  // Remove all popups
  const removePopups = useCallback(() => {
    popups.forEach((popup) => popup.remove());
    setPopups([]);
  }, [popups]);

  // Get current map bounds
  const getCurrentBounds = useCallback(() => {
    if (!map) return null;
    return map.getBounds();
  }, [map]);

  // Query rendered features
  const queryRenderedFeatures = useCallback(
    (
      pointOrBox?: MapboxPointLike,
      options?: { layers?: string[] }
    ): mapboxgl.MapboxGeoJSONFeature[] => {
      if (!map) return [];
      
      // Handle the case when pointOrBox is undefined
      if (pointOrBox === undefined) {
        return map.queryRenderedFeatures();
      }
      
      return map.queryRenderedFeatures(pointOrBox, options);
    },
    [map]
  );

  const resetError = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const value = {
    map,
    mapInitialized,
    mapContainer,
    selectedFeature,
    setSelectedFeature,
    flyTo,
    fitBounds,
    addPopup,
    removePopups,
    getCurrentBounds,
    queryRenderedFeatures,
    registerMap,
    loadMapboxToken,
    hasError,
    errorMessage,
    resetError,
  };

  return <MapboxContext.Provider value={value}>{children}</MapboxContext.Provider>;
}

export const useMapbox = () => {
  const context = useContext(MapboxContext);
  if (context === undefined) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
};

// Register the map with the context
export function useRegisterMapWithContext() {
  const context = useContext(MapboxContext);
  if (!context) {
    throw new Error('useRegisterMapWithContext must be used within a MapboxProvider');
  }

  return context.registerMap;
} 