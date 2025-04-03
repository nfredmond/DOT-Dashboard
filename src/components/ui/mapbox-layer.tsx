'use client';

import { useEffect, useRef } from 'react';
import { useMapbox } from '@/contexts/mapbox-context';

export interface MapboxLayerProps {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap' | 'fill-extrusion' | 'raster' | 'hillshade' | 'background' | 'sky';
  source?: string;
  sourceLayer?: string;
  layout?: any;
  paint?: any;
  filter?: any[];
  minzoom?: number;
  maxzoom?: number;
  beforeId?: string;
  onClick?: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
  onMouseEnter?: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
  onMouseLeave?: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
}

export function MapboxLayer({
  id,
  type,
  source,
  sourceLayer,
  layout,
  paint,
  filter,
  minzoom,
  maxzoom,
  beforeId,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MapboxLayerProps) {
  const { map, mapInitialized } = useMapbox();
  const layerId = useRef(id);

  // Add or update layer when component mounts or dependencies change
  useEffect(() => {
    if (!map || !mapInitialized) return;

    // Create the layer configuration object
    const layer: any = {
      id: layerId.current,
      type,
    };
    
    // Only add source if provided (background layers don't need a source)
    if (source) {
      layer.source = source;
    }
    
    // Add layout and paint if provided
    if (layout) {
      layer.layout = layout;
    }
    
    if (paint) {
      layer.paint = paint;
    }

    // Add optional properties if provided
    if (sourceLayer) {
      layer['source-layer'] = sourceLayer;
    }
    
    if (filter) {
      layer.filter = filter;
    }
    
    if (minzoom !== undefined) {
      layer.minzoom = minzoom;
    }
    
    if (maxzoom !== undefined) {
      layer.maxzoom = maxzoom;
    }

    // Check if layer exists and remove it to update
    if (map.getLayer(layerId.current)) {
      map.removeLayer(layerId.current);
    }

    // Add layer to the map
    if (beforeId && map.getLayer(beforeId)) {
      map.addLayer(layer, beforeId);
    } else {
      map.addLayer(layer);
    }

    // Set up event handlers if provided
    if (onClick) {
      map.on('click', layerId.current, onClick);
    }
    
    if (onMouseEnter) {
      map.on('mouseenter', layerId.current, onMouseEnter);
      // Change cursor to pointer when hovering over interactive layer
      map.on('mouseenter', layerId.current, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
    }
    
    if (onMouseLeave) {
      map.on('mouseleave', layerId.current, onMouseLeave);
      // Change cursor back to default when leaving interactive layer
      map.on('mouseleave', layerId.current, () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // Clean up on unmount
    return () => {
      if (!map || !map.getLayer(layerId.current)) return;
      
      // Remove event handlers
      if (onClick) {
        map.off('click', layerId.current, onClick);
      }
      
      if (onMouseEnter) {
        map.off('mouseenter', layerId.current, onMouseEnter);
        map.off('mouseenter', layerId.current, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
      }
      
      if (onMouseLeave) {
        map.off('mouseleave', layerId.current, onMouseLeave);
        map.off('mouseleave', layerId.current, () => {
          map.getCanvas().style.cursor = '';
        });
      }
      
      // Remove the layer
      map.removeLayer(layerId.current);
    };
  }, [
    map, 
    mapInitialized, 
    type, 
    source, 
    sourceLayer, 
    layout, 
    paint, 
    filter, 
    minzoom, 
    maxzoom, 
    beforeId, 
    onClick, 
    onMouseEnter, 
    onMouseLeave
  ]);

  // This component doesn't render anything visible
  return null;
}

export default MapboxLayer; 