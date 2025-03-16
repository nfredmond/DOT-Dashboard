"use client";

import { useRef, useState, useEffect } from 'react';
import { Map } from 'leaflet';
import { ProjectsProvider } from '@/contexts/ProjectsContext';
import { AddProjectForm } from './AddProjectForm';
import ProjectMapLegend from './ProjectMapLegend';
import ProjectList from './ProjectList';

interface MapIntegrationWrapperProps {
  mapContainer: HTMLElement | null;
}

export default function MapIntegrationWrapper({ mapContainer }: MapIntegrationWrapperProps) {
  const mapRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Set the map reference when the map is initialized
  useEffect(() => {
    if (mapContainer && !mapRef.current) {
      // The map will be set by the parent component
      const checkMapInterval = setInterval(() => {
        // Check if the map has been initialized by the parent
        const mapInstance = (window as any).leafletMap;
        if (mapInstance) {
          mapRef.current = mapInstance;
          setIsMapReady(true);
          clearInterval(checkMapInterval);
        }
      }, 100);

      return () => {
        clearInterval(checkMapInterval);
      };
    }
  }, [mapContainer]);

  if (!mapContainer) {
    return null;
  }

  return (
    <ProjectsProvider>
      {isMapReady && (
        <>
          <AddProjectForm />
          <ProjectList mapRef={mapRef} />
          <ProjectMapLegend />
        </>
      )}
    </ProjectsProvider>
  );
} 