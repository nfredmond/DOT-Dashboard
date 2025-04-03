'use client';

import { useEffect, useRef } from 'react';
import MapboxDrawLib from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useMapbox } from '@/contexts/mapbox-context';
import * as turf from '@turf/turf';
import logger from '@/lib/logger';

// Define event types to handle 
interface DrawEvent {
  type: 'draw.create' | 'draw.update' | 'draw.delete' | 'draw.selectionchange';
  features: GeoJSON.Feature[];
}

export interface MapboxDrawProps {
  onDrawCreate?: (e: GeoJSON.Feature[]) => void;
  onDrawUpdate?: (e: GeoJSON.Feature[]) => void;
  onDrawDelete?: (e: GeoJSON.Feature[]) => void;
  onDrawSelectionChange?: (e: GeoJSON.Feature[]) => void;
  onDrawModeChange?: (mode: string) => void;
  displayControlsDefault?: boolean;
  controls?: {
    point?: boolean;
    line_string?: boolean;
    polygon?: boolean;
    trash?: boolean;
    combine_features?: boolean;
    uncombine_features?: boolean;
  };
  defaultFeatures?: GeoJSON.Feature[];
  boxSelect?: boolean;
  styles?: any[];
}

export function MapboxDraw({
  onDrawCreate,
  onDrawUpdate,
  onDrawDelete,
  onDrawSelectionChange,
  onDrawModeChange,
  displayControlsDefault = true,
  controls,
  defaultFeatures,
  boxSelect = true,
  styles,
}: MapboxDrawProps) {
  const { map, mapInitialized } = useMapbox();
  const drawRef = useRef<MapboxDrawLib | null>(null);
  
  // Set up the draw control on mount or when map is initialized
  useEffect(() => {
    if (!map || !mapInitialized) return;

    // Create draw instance if it doesn't exist
    if (!drawRef.current) {
      drawRef.current = new MapboxDrawLib({
        displayControlsDefault,
        controls,
        boxSelect,
        styles,
      });
      
      // Add it to the map
      map.addControl(drawRef.current);
      
      // Add default features if provided
      if (defaultFeatures && defaultFeatures.length > 0 && drawRef.current) {
        drawRef.current.add({
          type: 'FeatureCollection',
          features: defaultFeatures
        });
      }
    }

    // Set up event handlers
    function handleDrawEvent(e: DrawEvent) {
      switch (e.type) {
        case 'draw.create':
          if (onDrawCreate) onDrawCreate(e.features);
          break;
        case 'draw.update':
          if (onDrawUpdate) onDrawUpdate(e.features);
          break;
        case 'draw.delete':
          if (onDrawDelete) onDrawDelete(e.features);
          break;
        case 'draw.selectionchange':
          if (onDrawSelectionChange) onDrawSelectionChange(e.features);
          
          // Calculate and show geometry measurements for selection
          if (e.features.length > 0) {
            const feature = e.features[0];
            
            // Different calculation based on geometry type
            if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
              const length = turf.length(feature, { units: 'kilometers' });
              logger.info(`Length: ${length.toFixed(2)} km`);
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              const area = turf.area(feature);
              const areaInKm = area / 1000000; // Convert from m² to km²
              logger.info(`Area: ${areaInKm.toFixed(2)} km²`);
            }
          }
          
          break;
      }
    }

    // Add event listeners
    map.on('draw.create', handleDrawEvent as any);
    map.on('draw.update', handleDrawEvent as any);
    map.on('draw.delete', handleDrawEvent as any);
    map.on('draw.selectionchange', handleDrawEvent as any);
    
    if (onDrawModeChange) {
      map.on('draw.modechange', (e: any) => {
        onDrawModeChange(e.mode);
      });
    }

    // Clean up on unmount
    return () => {
      if (map && drawRef.current) {
        map.off('draw.create', handleDrawEvent as any);
        map.off('draw.update', handleDrawEvent as any);
        map.off('draw.delete', handleDrawEvent as any);
        map.off('draw.selectionchange', handleDrawEvent as any);
        
        if (onDrawModeChange) {
          map.off('draw.modechange', onDrawModeChange as any);
        }
        
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, mapInitialized, controls, displayControlsDefault, boxSelect, styles, defaultFeatures, 
       onDrawCreate, onDrawUpdate, onDrawDelete, onDrawSelectionChange, onDrawModeChange]);

  // This component doesn't render anything visible
  return null;
}

export default MapboxDraw; 