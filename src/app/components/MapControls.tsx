"use client"

import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { ZoomInIcon, ZoomOutIcon, HomeIcon } from 'lucide-react';

interface MapControlsProps {
  mapCenter?: [number, number];
  defaultZoom?: number;
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

export function MapControlsComponent({
  mapCenter = [39.8283, -98.5795],  // Default center of US
  defaultZoom = 4,
  position = 'topleft'
}: MapControlsProps) {
  const map = useMap();
  const [mounted, setMounted] = useState(false);
  
  // Use effect to ensure we're mounted in client
  useEffect(() => {
    setMounted(true);
    
    // Store map reference globally
    if (typeof window !== 'undefined' && map) {
      (window as any).leafletMapInstance = map;
      
      // Set up utility functions
      (window as any).leafletUtils = {
        zoomIn: () => {
          if (!map) return false;
          map.zoomIn(1, { animate: true });
          return true;
        },
        
        zoomOut: () => {
          if (!map) return false;
          map.zoomOut(1, { animate: true });
          return true;
        },
        
        resetView: () => {
          if (!map) return false;
          map.setView(mapCenter, defaultZoom, { animate: true });
          return true;
        }
      };
    }
    
    return () => {
      // Cleanup global references
      if (typeof window !== 'undefined') {
        delete (window as any).leafletUtils;
      }
    };
  }, [map, mapCenter, defaultZoom]);
  
  // Don't render anything if not mounted
  if (!mounted) return null;
  
  // Not rendering actual UI elements since we're using custom UI elsewhere
  // Just a utility component to provide global map access
  return null;
}

export function ZoomControl({
  mapCenter = [39.8283, -98.5795],
  defaultZoom = 4
}: {
  mapCenter: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();
  
  const handleZoomIn = () => {
    if (map) {
      // Use map.zoomIn() instead of setZoom to preserve center point
      map.zoomIn(1, { animate: true });
    }
  };
  
  const handleZoomOut = () => {
    if (map) {
      // Use map.zoomOut() instead of setZoom to preserve center point
      map.zoomOut(1, { animate: true });
    }
  };
  
  const handleReset = () => {
    if (map) {
      map.setView(mapCenter, defaultZoom, { animate: true });
    }
  };
  
  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-left">
        <div className="leaflet-control leaflet-bar shadow-md">
          <a
            href="#"
            title="Zoom in"
            onClick={(e) => {
              e.preventDefault();
              handleZoomIn();
            }}
            className="leaflet-control-zoom-in"
            aria-label="Zoom in"
          >
            <div className="flex items-center justify-center h-full w-full">
              <ZoomInIcon className="h-4 w-4" />
            </div>
          </a>
          <a
            href="#"
            title="Zoom out"
            onClick={(e) => {
              e.preventDefault();
              handleZoomOut();
            }}
            className="leaflet-control-zoom-out"
            aria-label="Zoom out"
          >
            <div className="flex items-center justify-center h-full w-full">
              <ZoomOutIcon className="h-4 w-4" />
            </div>
          </a>
          <a
            href="#"
            title="Reset view"
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}
            aria-label="Reset view"
          >
            <div className="flex items-center justify-center h-full w-full">
              <HomeIcon className="h-4 w-4" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
} 