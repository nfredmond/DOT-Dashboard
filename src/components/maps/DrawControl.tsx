"use client"

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

interface DrawControlProps {
  map: mapboxgl.Map | null;
  onChange?: (geojson: any) => void;
  controls?: {
    point?: boolean;
    line_string?: boolean;
    polygon?: boolean;
    trash?: boolean;
    combine_features?: boolean;
    uncombine_features?: boolean;
  };
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  drawOptions?: any;
}

const DrawControl: React.FC<DrawControlProps> = ({ 
  map, 
  onChange,
  controls = {
    point: true,
    line_string: true,
    polygon: true,
    trash: true
  },
  position = 'top-left',
  drawOptions = {}
}) => {
  const drawRef = useRef<MapboxDraw | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Wait until map is loaded to add controls
    const addDrawControl = () => {
      // Initialize the drawing tool
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls,
        ...drawOptions
      });
      
      // Add the draw control to the map
      map.addControl(drawRef.current, position);
      
      // Set up event handlers
      const handleUpdate = () => {
        if (onChange && drawRef.current) {
          const data = drawRef.current.getAll();
          onChange(data);
        }
      };
      
      // Add event listeners for drawing events
      map.on('draw.create', handleUpdate);
      map.on('draw.update', handleUpdate);
      map.on('draw.delete', handleUpdate);
    };
    
    if (map.loaded()) {
      addDrawControl();
    } else {
      map.once('load', addDrawControl);
    }
    
    // Clean up on unmount
    return () => {
      if (map && drawRef.current) {
        map.off('draw.create', drawRef.current.getAll);
        map.off('draw.update', drawRef.current.getAll);
        map.off('draw.delete', drawRef.current.getAll);
        
        if (map.getStyle()) {
          map.removeControl(drawRef.current);
        }
        
        drawRef.current = null;
      }
    };
  }, [map, onChange, controls, position, drawOptions]);

  return null;
};

export default DrawControl; 