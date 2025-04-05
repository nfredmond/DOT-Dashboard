"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { initMapboxToken, DEFAULT_MAP_OPTIONS, injectMapboxCustomStyles } from '@/lib/map-utils';

interface UseMapboxOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  style?: string;
  mapOptions?: Partial<mapboxgl.MapOptions>;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  enableGeolocation?: boolean;
}

interface UseMapboxReturn {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
  error: Error | null;
  flyTo: (lng: number, lat: number, zoom?: number, options?: Partial<mapboxgl.FlyToOptions>) => void;
  addMarker: (
    lngLat: [number, number], 
    options?: mapboxgl.MarkerOptions,
    popup?: mapboxgl.PopupOptions & { content: string }
  ) => mapboxgl.Marker;
  addGeoJSONSource: (
    id: string, 
    data: GeoJSON.FeatureCollection,
    options?: Partial<GeoJSON.GeoJsonSource>
  ) => void;
  addLayer: (layer: mapboxgl.AnyLayer, beforeId?: string) => void;
  removeLayer: (id: string) => void;
  removeSource: (id: string) => void;
}

export function useMapbox({
  initialCenter = [-122.4194, 37.7749],
  initialZoom = 12,
  style = DEFAULT_MAP_OPTIONS.style,
  mapOptions = {},
  onMapLoaded,
  enableGeolocation = false,
}: UseMapboxOptions = {}): UseMapboxReturn {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize the Mapbox token
  useEffect(() => {
    try {
      const initialized = initMapboxToken();
      if (!initialized) {
        throw new Error('Failed to initialize Mapbox token');
      }
      
      // Inject custom CSS
      if (typeof window !== 'undefined') {
        injectMapboxCustomStyles();
      }
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError(err instanceof Error ? err : new Error('Unknown error initializing Mapbox'));
    }
  }, []);
  
  // Initialize the map
  useEffect(() => {
    if (!mapboxgl.accessToken || !mapContainer.current || map) return;
    
    try {
      // Create new map instance
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center: initialCenter,
        zoom: initialZoom,
        ...DEFAULT_MAP_OPTIONS,
        ...mapOptions
      });
      
      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add geolocation control if enabled
      if (enableGeolocation) {
        mapInstance.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          }),
          'top-right'
        );
      }
      
      // Add scale control
      mapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      // Handle map load
      mapInstance.on('load', () => {
        setMapLoaded(true);
        if (onMapLoaded) {
          onMapLoaded(mapInstance);
        }
      });
      
      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(new Error(`Mapbox error: ${e.error?.message || 'Unknown error'}`));
      });
      
      // Save map instance to state
      setMap(mapInstance);
      
      // Clean up on unmount
      return () => {
        mapInstance.remove();
        setMap(null);
        setMapLoaded(false);
      };
      
    } catch (err) {
      console.error('Error creating Mapbox map:', err);
      setError(err instanceof Error ? err : new Error('Error creating Mapbox map'));
    }
  }, [initialCenter, initialZoom, style, mapOptions, onMapLoaded, enableGeolocation]);
  
  // Fly to a location
  const flyTo = useCallback((
    lng: number, 
    lat: number, 
    zoom: number = 14, 
    options: Partial<mapboxgl.FlyToOptions> = {}
  ) => {
    if (!map) return;
    
    map.flyTo({
      center: [lng, lat],
      zoom,
      essential: true,
      duration: 2000,
      ...options
    });
  }, [map]);
  
  // Add a marker to the map
  const addMarker = useCallback((
    lngLat: [number, number], 
    options: mapboxgl.MarkerOptions = {},
    popup?: mapboxgl.PopupOptions & { content: string }
  ): mapboxgl.Marker => {
    if (!map) throw new Error('Map not initialized');
    
    // Create the marker
    const marker = new mapboxgl.Marker(options)
      .setLngLat(lngLat);
    
    // Add popup if provided
    if (popup) {
      const popupInstance = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        ...popup
      })
      .setHTML(popup.content);
      
      marker.setPopup(popupInstance);
    }
    
    // Add to map
    marker.addTo(map);
    
    return marker;
  }, [map]);
  
  // Add a GeoJSON source to the map
  const addGeoJSONSource = useCallback((
    id: string, 
    data: GeoJSON.FeatureCollection,
    options: Partial<GeoJSON.GeoJsonSource> = {}
  ) => {
    if (!map) return;
    
    if (map.getSource(id)) {
      (map.getSource(id) as mapboxgl.GeoJSONSource).setData(data);
    } else {
      map.addSource(id, {
        type: 'geojson',
        data,
        ...options,
      });
    }
  }, [map]);
  
  // Add a layer to the map
  const addLayer = useCallback((layer: mapboxgl.AnyLayer, beforeId?: string) => {
    if (!map) return;
    
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer, beforeId);
    }
  }, [map]);
  
  // Remove a layer from the map
  const removeLayer = useCallback((id: string) => {
    if (!map || !map.getLayer(id)) return;
    map.removeLayer(id);
  }, [map]);
  
  // Remove a source from the map
  const removeSource = useCallback((id: string) => {
    if (!map || !map.getSource(id)) return;
    map.removeSource(id);
  }, [map]);
  
  return {
    mapContainer,
    map,
    mapLoaded,
    error,
    flyTo,
    addMarker,
    addGeoJSONSource,
    addLayer,
    removeLayer,
    removeSource
  };
} 