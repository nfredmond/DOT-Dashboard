"use client"

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export interface MarkerData {
  id: string | number;
  longitude: number;
  latitude: number;
  title?: string;
  description?: string;
  color?: string;
  type?: string;
  icon?: string;
  properties?: Record<string, any>;
}

interface MarkerLayerProps {
  map: mapboxgl.Map | null;
  markers: MarkerData[];
  onClick?: (marker: MarkerData) => void;
  usePopup?: boolean;
  customPopup?: (marker: MarkerData) => string;
  customMarker?: (marker: MarkerData) => HTMLElement | null;
}

const MarkerLayer: React.FC<MarkerLayerProps> = ({
  map,
  markers,
  onClick,
  usePopup = true,
  customPopup,
  customMarker
}) => {
  // Reference to track created markers for cleanup
  const createdMarkersRef = useRef<mapboxgl.Marker[]>([]);
  
  useEffect(() => {
    if (!map) return;
    
    // Remove previous markers
    createdMarkersRef.current.forEach(marker => marker.remove());
    createdMarkersRef.current = [];
    
    // Create new markers
    markers.forEach(marker => {
      let popup: mapboxgl.Popup | undefined;
      
      if (usePopup) {
        popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(
            customPopup 
              ? customPopup(marker) 
              : `
                <div class="p-2">
                  <h3 class="font-bold">${marker.title || ''}</h3>
                  <p>${marker.description || ''}</p>
                </div>
              `
          );
      }
      
      // Create marker options
      const markerOptions: mapboxgl.MarkerOptions = {
        color: marker.color || '#FF0000',
      };
      
      // Use custom element if provided
      if (customMarker) {
        const element = customMarker(marker);
        if (element) {
          markerOptions.element = element;
        }
      }
      
      // Create marker
      const mapMarker = new mapboxgl.Marker(markerOptions)
        .setLngLat([marker.longitude, marker.latitude]);
      
      // Add popup if enabled
      if (popup) {
        mapMarker.setPopup(popup);
      }
      
      // Add marker to map
      mapMarker.addTo(map);
      
      // Handle click events
      if (onClick) {
        mapMarker.getElement().addEventListener('click', () => {
          onClick(marker);
        });
      }
      
      // Store marker for cleanup
      createdMarkersRef.current.push(mapMarker);
    });
    
    // Cleanup function
    return () => {
      createdMarkersRef.current.forEach(marker => marker.remove());
      createdMarkersRef.current = [];
    };
  }, [map, markers, onClick, usePopup, customPopup, customMarker]);

  return null;
};

export default MarkerLayer; 