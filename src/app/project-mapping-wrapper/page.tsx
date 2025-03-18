"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { cleanupLeafletMaps, resetLeafletGlobalState, cleanupLeafletMapById } from '@/lib/leaflet-cleanup';
import { debugLeafletLoading, fixLeafletContainers } from './debug';
import { AuthProvider } from '@/contexts/AuthContext';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { ProjectsProvider, type Project } from '@/contexts/ProjectsContext';
import L from 'leaflet';
import { syncWithMainMap } from './fallback-map';

// Ensure leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _currentMapId: string | null;
    leafletMapInstance: any | null;
    L: any;
    _leaflet_map_instances?: any[];
  }
}

// Create a loading component to show during suspense
const SuspenseLoading = () => (
  <div className="h-full w-full flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-lg font-medium">Loading map components...</p>
      <p className="mt-2 text-sm text-muted-foreground">This may take a moment</p>
    </div>
  </div>
);

// Create a truly dynamic import with no SSR and a completely new component each time
const _DynamicProjectMapping = dynamic(
  () => import('../project-mapping/page'),
  { ssr: false, loading: () => <SuspenseLoading /> }
);

// Use a consistent map ID generation function
const generateMapId = () => {
  // Use a fixed prefix with either a timestamp or simple counter
  return `map-container-${Date.now()}`;
};

// Store the current map ID globally for reference
if (typeof window !== 'undefined') {
  window._currentMapId = window._currentMapId || null;
}

// Add import for fallback map

// Sample projects data that matches the map markers
const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    name: "Highway 101 Expansion",
    description: "Expansion of Highway 101 to reduce congestion",
    coordinates: { latitude: 34.42083, longitude: -119.698189 },
    status: 'Construction',
    location: "Santa Barbara, CA",
    category: "Highway",
    allocatedBudget: 24000000,
    startDate: "2023-05-15",
    endDate: "2024-12-31",
    geometry: {
      type: 'LineString',
      coordinates: [
        [-119.698189, 34.42083],
        [-119.702, 34.43],
      ]
    }
  },
  {
    id: '2',
    name: "Downtown Light Rail",
    description: "New light rail system connecting downtown area",
    coordinates: { latitude: 34.41889, longitude: -119.694792 },
    status: 'Planning',
    location: "Santa Barbara, CA",
    category: "Transit",
    allocatedBudget: 12000000,
    startDate: "2024-01-10",
    endDate: "2025-06-30",
    geometry: {
      type: 'Point',
      coordinates: [-119.694792, 34.41889]
    }
  },
  {
    id: '3',
    name: "Waterfront Pedestrian Bridge",
    description: "Pedestrian bridge connecting the harbor to downtown",
    coordinates: { latitude: 34.40639, longitude: -119.685278 },
    status: 'Complete',
    location: "Santa Barbara, CA",
    category: "Bicycle",
    allocatedBudget: 5000000,
    startDate: "2022-03-01",
    endDate: "2023-09-15",
    geometry: {
      type: 'LineString',
      coordinates: [
        [-119.685278, 34.40639],
        [-119.691, 34.41],
        [-119.695, 34.415],
      ]
    }
  },
  {
    id: '4',
    name: "Bike Lane Expansion",
    description: "Adding protected bike lanes throughout the city",
    coordinates: { latitude: 34.4275, longitude: -119.713889 },
    status: 'Construction',
    location: "Santa Barbara, CA",
    category: "Bridge",
    allocatedBudget: 35000000,
    startDate: "2023-07-20",
    endDate: "2025-08-01",
    geometry: {
      type: 'LineString',
      coordinates: [
        [-119.713889, 34.4275],
        [-119.72, 34.43],
        [-119.73, 34.435]
      ]
    }
  },
  {
    id: '5',
    name: "Highway 192 Repair",
    description: "Repairing damage from recent storms",
    coordinates: { latitude: 34.455, longitude: -119.746944 },
    status: 'Planning',
    location: "Santa Barbara County, CA",
    category: "Planning Study",
    allocatedBudget: 1200000,
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.746944, 34.455],
        [-119.74, 34.455],
        [-119.74, 34.46],
        [-119.746944, 34.46],
        [-119.746944, 34.455]
      ]]
    }
  },
];

// Import the MapBridge component
import { MapBridge } from './components/MapBridge';

// Import the AddProjectForm component

// Import the ProjectMapLegend component
import ProjectMapLegend from './components/ProjectMapLegend';

// Import the ProjectList component
import ProjectList from './components/ProjectList';

// Import the MapIntegrationWrapper component

export default function ProjectMappingWrapper() {
  // Keep the map ID in a ref to ensure it's stable
  const mapIdRef = useRef(typeof window !== 'undefined' ? (window._currentMapId || generateMapId()) : generateMapId());
  
  // Store map ID globally for reference
  if (typeof window !== 'undefined') {
    window._currentMapId = mapIdRef.current;
  }
  
  const [isMounted, setIsMounted] = useState(false);
  const [mainMapProjects, setMainMapProjects] = useState<any[]>([]);
  // Use Record<string, any> to avoid type issues with nested properties
  const [mainMapConfig, setMainMapConfig] = useState<Record<string, any> | null>(null);
  
  // Function to handle updates from the main map
  const _handleMainMapProjectsUpdate = useCallback((projects: any[]) => {
    console.log('Main map projects updated:', projects.length);
    setMainMapProjects(projects);
    
    // Sync with fallback map
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      console.log('Syncing projects with fallback map');
      if (typeof syncWithMainMap === 'function') {
        syncWithMainMap(projects);
      }
    }
  }, []);
  
  // Function to handle updates from the fallback map
  const handleFallbackMapProjectsUpdate = useCallback((projects: any[]) => {
    console.log('Fallback map projects updated:', projects.length);
    // If needed, we could update the main map with these projects
  }, []);
  
  // useEffect to fetch current projects from the main mapping page
  useEffect(() => {
    // In a real implementation, this would fetch projects from the main map
    // For now, we'll just use our sample data
    
    // Simulate fetching main map data
    const fetchMainMapData = async () => {
      try {
        // This would be an API call in a real implementation
        // Convert SAMPLE_PROJECTS to the format expected by the main map
        // Use any type to avoid type errors with geometryType properties
        const sampleMainMapProjects = SAMPLE_PROJECTS.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          category: p.category,
          allocatedBudget: p.budget,
          // Convert to GeoJSON format that the main map would use
          geometry: p.geometryType === 'point' && p.latitude && p.longitude 
            ? { 
                type: 'Point', 
                coordinates: [p.longitude, p.latitude] 
              }
            : p.geometryType === 'line' && p.path 
            ? { 
                type: 'LineString', 
                coordinates: p.path.map((coord: [number, number]) => [coord[1], coord[0]]) 
              }
            : p.geometryType === 'polygon' && p.polygon 
            ? { 
                type: 'Polygon', 
                coordinates: [p.polygon.map((coord: [number, number]) => [coord[1], coord[0]])]
              }
            : undefined
        }));
        
        // Create a properly typed config
        const centerCoords: [number, number] = [39.2615, -121.0149];
        
        const sampleMainMapConfig = {
          basemap: {
            id: 'carto-voyager',
            name: 'CARTO Voyager',
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          },
          initialView: {
            center: centerCoords,
            zoom: 13
          },
          controls: {
            showZoom: true,
            showGeolocation: true,
            showSearch: true
          }
        };
        
        setMainMapProjects(sampleMainMapProjects);
        setMainMapConfig(sampleMainMapConfig);
      } catch (error) {
        console.error('Error fetching main map data:', error);
      }
    };
    
    if (isMounted) {
      fetchMainMapData();
    }
  }, [isMounted]);

  useEffect(() => {
    // Function to ensure Leaflet CSS is loaded
    const ensureLeafletCSS = () => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        console.log('Loading Leaflet CSS from ProjectMappingWrapper');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
    };
    
    // Function to ensure Leaflet JS is loaded
    const ensureLeafletJS = async () => {
      if (typeof window === 'undefined') return;
      
      if (!window.L) {
        console.log('Loading Leaflet JS from ProjectMappingWrapper');
        try {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = false;
          
          // Create a promise that resolves when the script loads
          const loadPromise = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          document.head.appendChild(script);
          await loadPromise;
          
          console.log('Leaflet JS loaded successfully:', !!window.L);
        } catch (error) {
          console.error('Error loading Leaflet JS:', error);
        }
      } else {
        console.log('Leaflet JS already loaded');
      }
    };
    
    // Load CSS first
    ensureLeafletCSS();
    
    // Then load JS
    ensureLeafletJS().then(() => {
      console.log('Leaflet initialization complete, window.L:', !!window.L);
    });
    
    const cleanupMaps = () => {
      // Always try to clean up using the current map ID first
      if (typeof window !== 'undefined' && mapIdRef.current) {
        try {
          console.log(`Cleaning up map using ID: ${mapIdRef.current}`);
          cleanupLeafletMapById(mapIdRef.current);
        } catch (e) {
          console.warn(`Error cleaning up specific map ID: ${e}`);
        }
      }
      
      if (typeof window !== 'undefined') {
        console.log('Running aggressive map cleanup');
        
        // First, try to properly remove map instances
        if (window.leafletMapInstance) {
          try {
            window.leafletMapInstance.remove();
          } catch (e) {
            console.warn('Error removing leaflet map instance:', e);
          }
          window.leafletMapInstance = null;
        }
        
        // Next, clean up map instances through our utility
        try {
          cleanupLeafletMaps();
          resetLeafletGlobalState();
        } catch (e) {
          console.warn('Error in cleanup utilities:', e);
        }
        
        // Clear any existing leaflet stylesheet to avoid style conflicts
        try {
          const existingLinks = document.querySelectorAll('link[href*="leaflet"]');
          existingLinks.forEach(link => {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
          });
        } catch (e) {
          console.warn('Error cleaning up CSS links:', e);
        }
        
        // Finally, brute force DOM cleanup
        try {
          // Remove all Leaflet elements
          const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
          leafletElements.forEach(el => {
            if (el.parentNode) {
              try {
                el.parentNode.removeChild(el);
              } catch (e) {
                // Ignore errors
              }
            }
          });
          
          // Remove all map containers
          const containers = document.querySelectorAll('.leaflet-container');
          containers.forEach(container => {
            if (container.parentNode) {
              try {
                container.parentNode.removeChild(container);
              } catch (e) {
                // Ignore errors
              }
            }
          });
        } catch (e) {
          console.warn('Error in DOM cleanup:', e);
        }
        
        // Reset global Leaflet state
        if (window.L) {
          try {
            window.L._leafletMapContainer = null;
            
            // Also remove any custom properties added to L
            Object.keys(window.L).forEach(key => {
              if (key.startsWith('_')) {
                try {
                  delete window.L[key];
                } catch (e) {
                  // Ignore errors
                }
              }
            });
          } catch (e) {
            // Ignore errors
          }
        }
      }
    };
    
    // Run cleanup
    cleanupMaps();
    
    // Run debug to check Leaflet state before loading CSS
    if (typeof window !== 'undefined') {
      debugLeafletLoading();
    }
    
    // Load CSS again after cleanup
    ensureLeafletCSS();
    
    // Only set mounted after cleanup with a longer delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMounted(true);
      console.log('Map wrapper component mounted after cleanup');
      console.log(`Current map ID: ${mapIdRef.current}`);
      
      // After mounting, run the debug and fix utilities again
      if (typeof window !== 'undefined') {
        debugLeafletLoading();
        
        // Add a bit more delay before running container fixes
        setTimeout(() => {
          fixLeafletContainers();
        }, 1000);
      }
    }, 1000); // Increased from 800ms to 1000ms
    
    return () => {
      clearTimeout(timer);
      // Run cleanup on unmount
      cleanupMaps();
      
      // Clear the current map ID on unmount
      if (typeof window !== 'undefined') {
        window._currentMapId = null;
      }
    };
  }, []);

  // Only render the map after mounting and cleanup
  if (!isMounted) {
    return <SuspenseLoading />;
  }

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
                mainMapProjects={mainMapProjects}
                mainMapConfig={mainMapConfig}
                onFallbackMapProjects={handleFallbackMapProjectsUpdate}
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

// Replace or update the DirectLeafletMap component
// Direct DOM implementation of Leaflet map
const DirectLeafletMap: React.FC = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add project markers to map
  const handleProjectAdded = useCallback((project: Project) => {
    if (!map) return;
    
    console.log('Adding project to map:', project.name);
    
    if (project.geometry.type === 'Point') {
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
    else if (project.geometry.type === 'LineString') {
      // Add polyline for LineString geometry
      const coordinates = project.geometry.coordinates as [number, number][];
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng]);
      
      const polyline = L.polyline(latLngs as L.LatLngExpression[], {
        color: getColorForCategory(project.category),
        weight: 5,
        opacity: 0.7
      }).addTo(map);
      
      polyline.bindPopup(`
        <div>
          <h3 class="text-lg font-bold">${project.name}</h3>
          <p>${project.description}</p>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Category:</strong> ${project.category}</p>
          <p><strong>Budget:</strong> $${project.allocatedBudget.toLocaleString()}</p>
        </div>
      `);
    }
    else if (project.geometry.type === 'Polygon') {
      // Add polygon for Polygon geometry
      const coordinates = project.geometry.coordinates as [number, number][][];
      const latLngs = coordinates[0].map(([lng, lat]) => [lat, lng]);
      
      const polygon = L.polygon(latLngs as L.LatLngExpression[], {
        color: getColorForCategory(project.category),
        fillOpacity: 0.4
      }).addTo(map);
      
      polygon.bindPopup(`
        <div>
          <h3 class="text-lg font-bold">${project.name}</h3>
          <p>${project.description}</p>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Category:</strong> ${project.category}</p>
          <p><strong>Budget:</strong> $${project.allocatedBudget.toLocaleString()}</p>
        </div>
      `);
    }
  }, [map]);
  
  // Handle project updates
  const handleProjectUpdated = useCallback((project: Project) => {
    if (!map) return;
    
    // In a real implementation, you'd need to track markers by project ID
    // and update or replace them. For simplicity, we could clear and re-add all.
    console.log('Project updated:', project.name);
    
    // Clear the map layers and re-add all markers
    // This is a simple approach - in production you'd want to update specific markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });
    
    // Fake a re-add of all projects by dispatching custom events
    const event = new CustomEvent('refresh-map-projects');
    window.dispatchEvent(event);
  }, [map]);
  
  // Handle project deletion
  const handleProjectDeleted = useCallback((project: Project) => {
    if (!map) return;
    
    console.log('Project deleted:', project.name);
    
    // Similar to updates, in a simple implementation we'll just refresh all markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });
    
    // Fake a re-add of all projects by dispatching custom events
    const event = new CustomEvent('refresh-map-projects');
    window.dispatchEvent(event);
  }, [map]);
  
  // Helper function to get colors based on project category
  const getColorForCategory = (category: string): string => {
    switch (category) {
      case 'Highway':
        return '#ff6b6b';
      case 'Transit':
        return '#48dbfb';
      case 'Bridge':
        return '#feca57';
      case 'Bicycle':
        return '#1dd1a1';
      case 'Planning Study':
        return '#5f27cd';
      default:
        return '#01a3a4';
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      import('./fallback-map').then(({ initializeDirectMap }) => {
        try {
          const newMap = initializeDirectMap('map-container', {
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
          
          // Set map in window for global access
          if (typeof window !== 'undefined') {
            window.leafletMapInstance = newMap;
          }
          
          setMap(newMap);
          setIsLoading(false);
        } catch (err) {
          console.error('Error initializing map:', err);
          setError('Failed to initialize map. Please try refreshing the page.');
          setIsLoading(false);
        }
      });
    }
  }, []);

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