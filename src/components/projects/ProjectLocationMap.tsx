"use client"

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ProjectLocationMapProps {
  latitude: number;
  longitude: number;
  projectName: string;
  zoom?: number;
}

const ProjectLocationMap: React.FC<ProjectLocationMapProps> = ({
  latitude,
  longitude,
  projectName,
  zoom = 13,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    setIsMounted(true);
    
    if (!mapContainer.current) return;
    
    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add a marker
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div>
          <strong>${projectName}</strong>
          <div>Lat: ${latitude.toFixed(6)}</div>
          <div>Lng: ${longitude.toFixed(6)}</div>
        </div>
      `);
      
    new mapboxgl.Marker()
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(map.current);
      
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [latitude, longitude, projectName, zoom]);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-full w-full" />;
};

export default ProjectLocationMap; 