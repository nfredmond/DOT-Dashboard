'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapbox } from '@/contexts/mapbox-context';
import logger from '@/lib/logger';

// Types
export interface MapboxMapProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
  mapStyle?: string;
  mapboxAccessToken?: string;
  children?: ReactNode;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapClick?: (e: mapboxgl.MapMouseEvent) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface MapboxMapRef {
  getMap: () => mapboxgl.Map | null;
}

// Default map style uses CARTO's Voyager which is similar to what we had with Leaflet
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>(
  (
    {
      initialViewState = {
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
      },
      mapStyle = DEFAULT_MAP_STYLE,
      mapboxAccessToken,
      children,
      onMapLoad,
      onMapClick,
      onError,
      className = 'h-[600px] w-full',
    }: MapboxMapProps,
    ref
  ) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { registerMap } = useMapbox();

    // Set access token if provided or use default from environment
    useEffect(() => {
      if (mapboxAccessToken) {
        mapboxgl.accessToken = mapboxAccessToken;
      } else if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      }
    }, [mapboxAccessToken]);

    useImperativeHandle(ref, () => ({
      getMap: () => mapInstance.current,
    }));

    // Initialize map when component mounts
    useEffect(() => {
      if (!mapContainer.current) return;
      
      // Clean up existing map if it exists
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          logger.error('Error removing existing map:', e);
        }
        mapInstance.current = null;
      }

      let observer: ResizeObserver | null = null;

      try {
        // Check if we need to use Mapbox style URLs
        let styleUrl = mapStyle;
        
        // If trying to use mapbox:// styles but no token, fallback to CARTO
        if (mapStyle.startsWith('mapbox://styles/') && !mapboxgl.accessToken) {
          styleUrl = DEFAULT_MAP_STYLE;
          logger.warn('No Mapbox token available. Using default style instead.');
        }

        // Create new map with safer loading of the style
        const createMap = async () => {
          try {
            // Try to pre-fetch the style to verify it's accessible
            if (!styleUrl.startsWith('mapbox://')) {
              try {
                const response = await fetch(styleUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json'
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`Failed to fetch map style: ${response.status} ${response.statusText}`);
                }
                
                // Verify it's valid JSON
                await response.json();
              } catch (error) {
                const fetchError = error instanceof Error ? error : new Error(String(error));
                logger.error('Error fetching map style:', fetchError);
                
                // Fall back to a basic Mapbox style if available, otherwise show error
                if (mapboxgl.accessToken) {
                  styleUrl = 'mapbox://styles/mapbox/streets-v12';
                  logger.info('Falling back to mapbox streets style');
                } else {
                  if (onError) {
                    onError(new Error(`Failed to fetch map style: ${fetchError.message}`));
                  }
                  return null;
                }
              }
            }
            
            // Now create the map with the verified or fallback style
            const mapOptions: mapboxgl.MapOptions = {
              container: mapContainer.current as HTMLElement,
              style: styleUrl,
              center: [initialViewState.longitude, initialViewState.latitude],
              zoom: initialViewState.zoom,
              pitch: initialViewState.pitch || 0,
              bearing: initialViewState.bearing || 0,
              transformRequest: (url, resourceType) => {
                if (resourceType === 'Style' && !url.startsWith('mapbox://')) {
                  return {
                    url,
                    headers: {
                      'Accept': 'application/json'
                    }
                  };
                }
                return { url };
              }
            };
            
            return new mapboxgl.Map(mapOptions);
          } catch (error) {
            const mapError = error instanceof Error ? error : new Error(String(error));
            logger.error('Error creating Mapbox map:', mapError);
            if (onError) {
              onError(new Error(`Failed to create map: ${mapError.message}`));
            }
            return null;
          }
        };
        
        // Create the map
        const mapPromise = createMap();
        
        // Handle the async map creation
        mapPromise.then(map => {
          if (!map) {
            logger.error('Map creation failed - map is null');
            return;
          }
          
          logger.info('Mapbox map created successfully');
          
          // Add navigation controls
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Set up event handlers
          map.on('load', () => {
            logger.info('Mapbox map load event fired');
            setMapLoaded(true);
            if (onMapLoad) onMapLoad(map);
          });
          
          // Catch any map errors
          map.on('error', (e) => {
            logger.error('Mapbox error event:', e);
            logger.error('Mapbox error:', e);
          });
          
          // Catch style data events to debug style loading
          map.on('styledata', () => {
            logger.info('Mapbox style data loaded');
          });
          
          // Catch style image missing events
          map.on('styleimagemissing', (e) => {
            logger.warn('Mapbox style image missing:', e.id);
          });
          
          if (onMapClick) {
            map.on('click', onMapClick);
          }
          
          // Resize map when container size changes
          if (mapContainer.current) {
            observer = new ResizeObserver(() => {
              map.resize();
            });
            observer.observe(mapContainer.current);
          }
          
          // Save reference and register with context
          mapInstance.current = map;
          registerMap(map, mapContainer);
        });
      } catch (err) {
        logger.error('Error initializing Mapbox map:', err);
        // Attempt to clean up any Leaflet elements
        try {
          const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
          leafletElements.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (cleanupError) {
          logger.error('Error cleaning up Leaflet elements:', cleanupError);
        }
        
        // Delete any global Leaflet references
        if (typeof window !== 'undefined') {
          if ('L' in window) delete (window as any).L;
          if ('leafletMapInstance' in window) delete (window as any).leafletMapInstance;
        }
        
        // Call onError callback if provided
        if (onError) {
          const error = err instanceof Error ? err : new Error('Failed to initialize Mapbox map');
          onError(error);
        }
      }
      
      return () => {
        if (observer) {
          observer.disconnect();
        }
        
        // Safely remove the map instance
        if (mapInstance.current) {
          try {
            // First remove event listeners to prevent callback errors during destruction
            if (onMapClick) {
              mapInstance.current.off('click', onMapClick);
            }
            
            // Sometimes the map's internal state can be corrupted, so we need to check properties before removal
            if (mapInstance.current._loaded) {
              mapInstance.current.remove();
            }
          } catch (e) {
            logger.error('Error during map cleanup:', e);
            // If an error occurs, try to clean up the DOM elements manually
            try {
              const mapContainer = document.querySelector('.mapboxgl-map');
              if (mapContainer && mapContainer.parentNode) {
                mapContainer.parentNode.removeChild(mapContainer);
              }
            } catch (domError) {
              logger.error('Failed to manually clean up map DOM elements:', domError);
            }
          } finally {
            mapInstance.current = null;
          }
        }
      };
    }, [mapStyle, mapboxAccessToken, initialViewState, onMapLoad, onMapClick, registerMap]);

    return (
      <div ref={mapContainer} className={className}>
        {/* Child components will be rendered via React Context in child components */}
        {mapLoaded && children}
      </div>
    );
  }
);

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap; 