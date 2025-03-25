"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cleanupLeafletMaps, resetLeafletGlobalState, cleanupLeafletMapById } from '@/lib/leaflet-cleanup';
import { debugLeafletLoading, fixLeafletContainers } from './debug';
import { AuthProvider } from '@/contexts/AuthContext';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { ProjectsProvider } from '@/contexts/ProjectsContext';
import L from 'leaflet';
import { Project as ProjectType } from '@/types/project';
import { Map as LeafletMapType } from 'leaflet';
import { MapBridge } from './components/MapBridge';
import ProjectMapLegend from './components/ProjectMapLegend';
import ProjectList from './components/ProjectList';

// Add proper type declaration for the Window interface
declare global {
  interface Window {
    _currentMapId: string | null;
    leafletMapInstance: any; // Using 'any' type to avoid conflicts with existing declarations
  }
}

// Ensure leaflet CSS is loaded
if (typeof window !== 'undefined') {
  // Create a map ID tracker
  window._currentMapId = window._currentMapId || null;
}

// DirectLeafletMap component logic to safely handle project geometry and map initialization
const DirectLeafletMap: React.FC = () => {
  const [map, setMap] = useState<LeafletMapType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add project markers to map with proper type checking
  const handleProjectAdded = useCallback((project: ProjectType) => {
    if (!map) return;
    
    console.log('Adding project to map:', project.name);
    
    if (project.geometry && project.geometry.type === 'Point') {
      // Add marker for Point geometry
      const [lng, lat] = project.geometry.coordinates as [number, number];
      const marker = L.marker([lat, lng], {
        title: project.name
      }).addTo(map);
      
      marker.bindPopup(`
        <div>
          <h3 class="text-lg font-bold">${project.name}</h3>
          <p>${project.description}</p>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Category:</strong> ${project.category}</p>
          <p><strong>Budget:</strong> $${project.allocatedBudget.toLocaleString()}</p>
        </div>
      `);
    }
    
    // Handle other geometry types as needed
  }, [map]);
  
  // Update project markers
  const handleProjectUpdated = useCallback((project: ProjectType) => {
    if (!map) return;
    
    console.log('Updating project on map:', project.name);
    
    // Implement as needed
  }, [map]);
  
  // Remove project markers
  const handleProjectDeleted = useCallback((projectId: string) => {
    if (!map) return;
    
    console.log('Removing project from map:', projectId);
    
    // Implement as needed
  }, [map]);

  // Clean up function for map
  const cleanupMap = useCallback(() => {
    if (typeof window !== 'undefined') {
      // First remove any existing maps to prevent "Map container is already initialized" error
      if (window.leafletMapInstance) {
        try {
          console.log('Cleaning up existing map instance');
          window.leafletMapInstance.remove();
          window.leafletMapInstance = null;
        } catch (e) {
          console.error('Error cleaning up map instance:', e);
        }
      }
      
      // Also remove any Leaflet elements
      try {
        const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
        leafletElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      } catch (e) {
        console.error('Error removing Leaflet elements:', e);
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    
    // Clean up any existing maps first
    cleanupMap();
    
    if (typeof window !== 'undefined') {
      import('./fallback-map').then(({ initializeDirectMap }) => {
        try {
          // Ensure the container is empty before initialization
          const container = document.getElementById('map-container');
          if (container) {
            // Clean up any existing leaflet elements in the container
            const leafletElements = container.querySelectorAll('[class^="leaflet-"]');
            leafletElements.forEach(el => {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
            });
          }
          
          // The initializeDirectMap function doesn't return the map
          initializeDirectMap('map-container', {
            basemap: {
              url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            },
            initialView: {
              center: [34.45, -119.7],
              zoom: 13
            },
            controls: {
              showZoom: true,
              showGeolocation: true,
              showSearch: true
            }
          });
          
          // Access the map instance from the global variable instead
          if (window.leafletMapInstance) {
            setMap(window.leafletMapInstance);
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error initializing map:', err);
          setError('Failed to initialize map. Please try refreshing the page.');
          setIsLoading(false);
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);

  return (
    <div className="relative flex h-full">
      {/* Map container - removed sidebar */}
      <div className="flex-1 h-full" id="direct-map-container">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading map...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md max-w-md">
              <h3 className="font-bold mb-2">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Map will be initialized in this div */}
        <div id="map-container" className="h-full w-full">
          {/* MapBridge for synchronizing with project context */}
          <MapBridge 
            onProjectAdded={handleProjectAdded}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
          
          {/* Remove the duplicated UI components */}
          {/* ProjectMapLegend and ProjectList components are already rendered in parent */}
        </div>
      </div>
    </div>
  );
};

export default function ProjectMappingWrapper() {
  // Keep the map ID in ref to ensure it's stable
  const mapIdRef = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);
  const [isMounted, setIsMounted] = useState(false);
  
  // Clean up Leaflet when the component unmounts
  useEffect(() => {
    // Reset Leaflet state when component mounts
    resetLeafletGlobalState();
    
    // Add a delay to make sure DOM is fully rendered
    const timer = setTimeout(() => {
      setIsMounted(true);
      console.log('ProjectMappingWrapper mounted, map ID:', mapIdRef.current);
      
      // Debug Leaflet loading
      debugLeafletLoading();
    }, 300);
    
    // Clean up when unmounting to prevent memory leaks
    return () => {
      clearTimeout(timer);
      
      // Reset Leaflet global state and clean up maps
      cleanupLeafletMaps();
      cleanupLeafletMapById(mapIdRef.current);
      resetLeafletGlobalState();
      
      debugLeafletLoading();
      fixLeafletContainers();
    };
  }, []);
  
  // Debug mode - force container dimensions after mount
  useEffect(() => {
    if (!isMounted) return;
    
    // Force a resize event to help Leaflet calculate dimensions properly
    window.dispatchEvent(new Event('resize'));
  }, [isMounted]);

  // Use a data attribute for the map ID instead of a prop
  return (
    <SupabaseProvider>
      <AuthProvider>
        <ProjectsProvider>
          <div className="h-screen w-full flex flex-col overflow-hidden">
            {/* Map Container */}
            <div id={mapIdRef.current} className="flex-1 relative w-full h-full border-0 m-0 p-0">
              {/* Only render UI components when the map is ready */}
              {isMounted && (
                <>
                  {/* Project UI components only rendered here - removed from DirectLeafletMap */}
                  <ProjectList mapRef={{ current: window.leafletMapInstance }} />
                  <ProjectMapLegend />
                </>
              )}
              
              {/* Use the MapBridge component to communicate with the main map */}
              <MapBridge 
                mainMapProjects={[]}
                mainMapConfig={{}}
              />
              
              {/* Use a direct DOM implementation instead of React-Leaflet */}
              <DirectLeafletMap />
            </div>
          </div>
        </ProjectsProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
} 