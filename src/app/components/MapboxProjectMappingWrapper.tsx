"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapboxProvider } from '@/contexts/mapbox-context';

// Dynamically import the MapboxProjectMapping component to avoid SSR issues
const MapboxProjectMapping = dynamic(
  () => import('./MapboxProjectMapping').then(mod => mod.MapboxProjectMapping),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] w-full border rounded-md bg-slate-50">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading map...</div>
        </div>
      </div>
    )
  }
);

interface MapboxProjectMappingWrapperProps {
  height?: string;
  width?: string;
  className?: string;
  initialMapZoom?: number;
  initialMapCenter?: [number, number];
  projects?: any[];
  selectedProject?: any;
  onMarkerClick?: (project: any) => void;
}

export function MapboxProjectMappingWrapper({
  height = '100%',
  width = '100%',
  className = '',
  initialMapZoom = 13,
  initialMapCenter = [-121.0149, 39.2615], // Nevada City, CA (longitude, latitude for Mapbox)
  projects = [],
  selectedProject = null,
  onMarkerClick,
}: MapboxProjectMappingWrapperProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up any old Leaflet references when component mounts or unmounts
  useEffect(() => {
    // Ensure there's no lingering Leaflet state
    const cleanupLeafletReferences = () => {
      if (typeof window !== 'undefined') {
        // Remove any lingering Leaflet global variables
        if ('L' in window) delete (window as any).L;
        if ('leafletMapInstance' in window) {
          delete (window as any).leafletMapInstance;
        }
        
        // Remove any Leaflet-specific DOM elements
        try {
          const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
          leafletElements.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (err) {
          console.error('Error cleaning up Leaflet elements:', err);
        }
      }
    };
    
    cleanupLeafletReferences();
    
    return () => {
      // Cleanup on unmount
      cleanupLeafletReferences();
    };
  }, []);
  
  // Wait for client-side rendering to complete
  useEffect(() => {
    setReady(true);
  }, []);

  // Error handling for Mapbox initialization
  const handleMapError = (err: Error) => {
    console.error('Mapbox initialization error:', err);
    setError('Failed to initialize map. Please check your browser compatibility and try again.');
  };

  if (error) {
    return (
      <div style={{ width, height }} className={className || "flex items-center justify-center bg-gray-100 rounded-md"}>
        <div className="p-4 max-w-md text-center">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
          <p className="mb-4 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className={className}>
      {ready && (
        <MapboxProvider>
          <MapboxProjectMapping
            height={height}
            width={width}
            initialZoom={initialMapZoom}
            initialCenter={initialMapCenter}
            projects={projects}
            selectedProject={selectedProject}
            onMarkerClick={onMarkerClick}
            onError={handleMapError}
          />
        </MapboxProvider>
      )}
    </div>
  );
}

export default MapboxProjectMappingWrapper; 