"use client"

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export interface GeoJSONLayerProps {
  map: mapboxgl.Map | null;
  sourceId: string;
  layerId: string;
  data: GeoJSON.FeatureCollection | GeoJSON.Feature | object | string;
  layerType: 'fill' | 'line' | 'circle' | 'symbol' | 'heatmap' | 'fill-extrusion';
  paint?: mapboxgl.AnyPaint;
  layout?: mapboxgl.AnyLayout;
  filter?: any[];
  beforeId?: string;
  onFeatureClick?: (e: mapboxgl.MapLayerMouseEvent) => void;
  onFeatureHover?: (e: mapboxgl.MapLayerMouseEvent) => void;
  sourceOptions?: Partial<mapboxgl.GeoJSONSourceOptions>;
}

const GeoJSONLayer: React.FC<GeoJSONLayerProps> = ({
  map,
  sourceId,
  layerId,
  data,
  layerType,
  paint,
  layout,
  filter,
  beforeId,
  onFeatureClick,
  onFeatureHover,
  sourceOptions = {}
}) => {
  const layerInitializedRef = useRef(false);
  
  // Add GeoJSON source and layer when map is loaded
  useEffect(() => {
    if (!map) return;
    
    // Function to create/update the source and layer
    const updateSourceAndLayer = () => {
      // Add or update source
      if (map.getSource(sourceId)) {
        // Update existing source
        const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
        source.setData(data);
      } else {
        // Add new source
        map.addSource(sourceId, {
          type: 'geojson',
          data,
          ...sourceOptions
        });
      }
      
      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: layerType,
          source: sourceId,
          paint: paint || {},
          layout: layout || {},
          filter: filter
        }, beforeId);
        
        layerInitializedRef.current = true;
        
        // Add event listeners
        if (onFeatureClick) {
          map.on('click', layerId, onFeatureClick);
        }
        
        if (onFeatureHover) {
          map.on('mouseenter', layerId, onFeatureHover);
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        }
        
        // Set cursor to pointer when hovering over interactive layers
        if (onFeatureClick || onFeatureHover) {
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        }
      } else {
        // Update existing layer
        if (paint) {
          Object.entries(paint).forEach(([key, value]) => {
            map.setPaintProperty(layerId, key, value);
          });
        }
        
        if (layout) {
          Object.entries(layout).forEach(([key, value]) => {
            map.setLayoutProperty(layerId, key, value);
          });
        }
        
        if (filter) {
          map.setFilter(layerId, filter);
        }
      }
    };
    
    // Wait for map to be loaded before adding or updating
    if (map.loaded()) {
      updateSourceAndLayer();
    } else {
      map.once('load', updateSourceAndLayer);
    }
    
    // Cleanup on unmount
    return () => {
      if (map.loaded() && layerInitializedRef.current) {
        // Remove event listeners
        if (onFeatureClick) {
          map.off('click', layerId, onFeatureClick);
        }
        
        if (onFeatureHover) {
          map.off('mouseenter', layerId, onFeatureHover);
          map.off('mouseleave', layerId);
        }
        
        // Remove cursor events
        if (onFeatureClick || onFeatureHover) {
          map.off('mouseenter', layerId);
          map.off('mouseleave', layerId);
        }
        
        // Remove layer and source
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        
        layerInitializedRef.current = false;
      }
    };
  }, [
    map, 
    sourceId, 
    layerId, 
    data, 
    layerType, 
    paint, 
    layout, 
    filter, 
    beforeId, 
    onFeatureClick, 
    onFeatureHover,
    sourceOptions
  ]);
  
  return null;
};

export default GeoJSONLayer; 