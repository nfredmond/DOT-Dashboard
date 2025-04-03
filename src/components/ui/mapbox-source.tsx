'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useMapbox } from '@/contexts/mapbox-context';
import type { AnySourceData } from 'mapbox-gl';

export interface MapboxSourceProps {
  id: string;
  source: AnySourceData;
  children?: ReactNode;
}

export function MapboxSource({ id, source, children }: MapboxSourceProps) {
  const { map, mapInitialized } = useMapbox();
  const sourceId = useRef(id);

  useEffect(() => {
    if (!map || !mapInitialized) return;

    // Check if source already exists
    if (!map.getSource(sourceId.current)) {
      map.addSource(sourceId.current, source);
    } else {
      // Update the source data if it's a GeoJSON source
      const mapboxSource = map.getSource(sourceId.current);
      if (source.type === 'geojson' && mapboxSource && 'type' in mapboxSource && mapboxSource.type === 'geojson') {
        if (source.data) {
          (mapboxSource as mapboxgl.GeoJSONSource).setData(source.data);
        }
      }
    }

    // Clean up on unmount
    return () => {
      if (map && map.getSource(sourceId.current) && !map.isSourceLoaded(sourceId.current)) {
        // Get all layers that use this source
        const mapStyle = map.getStyle();
        const layers = mapStyle?.layers;
        
        if (layers) {
          layers.forEach(layer => {
            if (layer.source === sourceId.current) {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            }
          });
        }
        
        if (map.getSource(sourceId.current)) {
          map.removeSource(sourceId.current);
        }
      }
    };
  }, [map, mapInitialized, source]);

  // No need to render anything - this is just for managing the source in Mapbox
  return <>{children}</>;
}

export default MapboxSource; 