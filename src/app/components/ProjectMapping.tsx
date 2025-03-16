"use client"

// Import full Leaflet library directly
import * as L from 'leaflet';

// Assign to window object to ensure global availability
if (typeof window !== 'undefined') {
  window.L = L;
}

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMapEvents,
  ZoomControl as LeafletZoomControl,
  AttributionControl,
  GeoJSON
} from 'react-leaflet';
import { divIcon } from 'leaflet';
import { SearchControl } from './SearchControl';
import { LayerSelector, BaseMapOption, OverlayLayer } from './LayerSelector';
import { GeolocateControl } from './GeolocateControl';
import { MapControlsComponent, ZoomControl } from './MapControls';
import { cn } from '@/lib/utils';
import { useLeaflet } from '@/hooks/useLeaflet';
import { getMapForUser } from '@/lib/map-config-service';
import { getMapTiles } from '@/lib/map-service';
import { AuthContext } from '@/contexts/AuthContext';
import 'leaflet/dist/leaflet.css';
import { cleanupLeafletMapById, resetLeafletGlobalState, markContainerAsInitialized, isContainerInitialized } from '@/lib/leaflet-cleanup';
import LeafletMapWrapper from '@/lib/LeafletMapWrapper';

// Add the leafletMapInstance property to the Window interface
declare global {
  interface Window {
    leafletMapInstance: any;
  }
}

// Define the possible base maps to select from
const DEFAULT_BASE_MAPS: BaseMapOption[] = [
  {
    name: 'CARTO Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    checked: true,
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    checked: false,
  },
  {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    checked: false,
  }
];

// Export the interface so it can be imported elsewhere
export interface Project {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  address?: string;
  category?: string;
  description?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  geometry?: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
}

interface ProjectMappingProps {
  projects?: any[]; // Make this more flexible
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  className?: string;
  selectedProject?: any; // Make this more flexible
  onMarkerClick?: (project: any) => void;
  testingMode?: boolean;
}

// Component to handle map events and set up global map instance
function MapEventHandler() {
  const map = useMapEvents({
    click: (e) => {
      console.log('Map clicked at:', e.latlng);
    },
    load: () => {
      console.log('Map loaded');
      // Store map reference globally for utility functions
      if (typeof window !== 'undefined') {
        window.leafletMapInstance = map;
        
        // Store the map element's ID for easier cleanup
        if (map && map.getContainer()) {
          const container = map.getContainer();
          const parent = container.closest('[data-map-id]') as HTMLElement;
          
          if (parent && parent.dataset.mapId) {
            console.log(`Map associated with container ID: ${parent.dataset.mapId}`);
            // Store the ID for cleanup reference
            (map as any)._parentContainerId = parent.dataset.mapId;
          }
        }
      }
    },
    // Add these events to debug map loading
    tileerror: (e) => {
      console.error('Tile loading error:', e);
    },
    tileload: () => {
      console.log('Tiles loaded successfully');
    }
  });

  // Set global map instance on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && map) {
      window.leafletMapInstance = map;
      
      // Try to find and associate the container ID
      try {
        const container = map.getContainer();
        const parent = container.closest('[data-map-id]') as HTMLElement;
        
        if (parent && parent.dataset.mapId) {
          console.log(`Map associated with container ID: ${parent.dataset.mapId}`);
          // Store the ID for cleanup reference
          (map as any)._parentContainerId = parent.dataset.mapId;
        }
      } catch (e) {
        console.warn('Error finding map container ID:', e);
      }
      
      // Return cleanup function
      return () => {
        console.log('MapEventHandler unmounting, cleaning up references');
        if (window.leafletMapInstance === map) {
          window.leafletMapInstance = null;
        }
      };
    }
  }, [map]);

  // Add useEffect to check map size after it's mounted
  useEffect(() => {
    if (!map) return;
    
    console.log('Map container size:', 
      map.getContainer().clientWidth,
      map.getContainer().clientHeight
    );
    
    // Force map to update its size
    setTimeout(() => {
      map.invalidateSize();
      console.log('Map size invalidated');
    }, 100);
    
    // Update map when window resizes
    const handleResize = () => {
      map.invalidateSize();
      console.log('Map size updated on resize');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

// GeoJSON Layer component for map overlays
function GeoJSONLayer({ url, visible }: { url: string, visible: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!visible) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load layer data: ${response.statusText}`);
        }
        const geoJson = await response.json();
        setData(geoJson);
        setError(null);
      } catch (err) {
        console.error('Error loading layer:', err);
        setError(err instanceof Error ? err.message : 'Unknown error loading layer');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url, visible]);
  
  if (!visible || !data) return null;
  
  // Use pathOptions prop instead of style for GeoJSON
  return (
    <GeoJSON 
      data={data}
      pathOptions={{
        color: '#3388ff',
        weight: 2,
        opacity: 0.65,
        fillOpacity: 0.2,
        fillColor: '#3388ff'
      }}
    />
  );
}

export function ProjectMapping({
  projects = [],
  initialCenter = [39.2615, -121.0149], // Nevada City, CA
  initialZoom = 13, // Higher zoom level for city view
  height = '100%',
  width = '100%',
  className = '',
  selectedProject = null,
  onMarkerClick,
  testingMode = true, // Default to testing mode
}: ProjectMappingProps) {
  // Update how we access AuthContext to avoid warning
  // Get auth context via useContext but with safe fallback
  const authContext = useContext(AuthContext);
  // Set safe default if context is missing
  const user = authContext?.user || null;
  
  const { leafletLoaded, leafletInstance } = useLeaflet();
  const mapRef = useRef(null);
  
  // Track map initialization state
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // Add test projects for Nevada City when in testing mode
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  
  // Create a unique ID for the map container
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  // State
  const [activeBasemap, setActiveBasemap] = useState<BaseMapOption>(DEFAULT_BASE_MAPS[0]);
  const [availableBasemaps, setAvailableBasemaps] = useState<BaseMapOption[]>(DEFAULT_BASE_MAPS);
  const [activeOverlays, setActiveOverlays] = useState<OverlayLayer[]>([]);
  const [availableOverlays, setAvailableOverlays] = useState<OverlayLayer[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showAttribution, setShowAttribution] = useState(true);

  // Import LeafletMapWrapper dynamically to prevent SSR issues
  const LeafletMapWrapper = useMemo(() => 
    dynamic(() => import('@/lib/LeafletMapWrapper'), { ssr: false }),
  []);
  
  // Add cleanup logic to ensure the map is properly destroyed when the component unmounts
  useEffect(() => {
    // Generate a fixed mapId for this component instance
    if (!mapId.current) {
      mapId.current = `map-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add a timeout to force invalidate the map size after it has loaded
    const invalidateSizeTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.leafletMapInstance) {
        try {
          window.leafletMapInstance.invalidateSize();
          console.log('Map size invalidated after initial load');
        } catch (e) {
          console.warn('Error invalidating map size:', e);
        }
      }
    }, 500);

    // Cleanup function to properly destroy the Leaflet map when component unmounts
    return () => {
      clearTimeout(invalidateSizeTimer);
      // Clean up this specific map
      cleanupLeafletMapById(mapId.current);
      resetLeafletGlobalState();
    };
  }, []);

  useEffect(() => {
    if (testingMode) {
      // Add test Nevada City projects if in testing mode
      const nevadaCityProjects: Project[] = [
        {
          id: 'test-1',
          name: 'Nevada City Downtown Improvement',
          description: 'Sidewalk and streetscape improvements in downtown area',
          latitude: 39.2617,
          longitude: -121.0176,
          status: 'in progress',
          category: 'Infrastructure',
        },
        {
          id: 'test-2',
          name: 'Deer Creek Trail Extension',
          description: 'Extending the Deer Creek Trail by 1.5 miles',
          latitude: 39.2585,
          longitude: -121.0122,
          status: 'planning',
          category: 'Recreation',
        },
        {
          id: 'test-3',
          name: 'Highway 49 Intersection Upgrade',
          description: 'Safety improvements at Coyote Street intersection',
          latitude: 39.2546,
          longitude: -121.0254,
          status: 'approved',
          category: 'Highway',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-121.0254, 39.2546],
              [-121.0264, 39.2556],
              [-121.0274, 39.2566],
            ]
          }
        },
      ];
      
      // Combine existing projects with test projects
      setLocalProjects([...projects, ...nevadaCityProjects]);
    } else {
      setLocalProjects(projects);
    }
  }, [projects, testingMode]);
  
  // Listen for map initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMapReady = () => {
      console.log('Map is initialized and ready');
      setIsMapInitialized(true);
    };
    
    window.addEventListener('leaflet-map-ready', handleMapReady);
    
    // Check if map already exists when this effect runs
    if ((window as any).leafletMapInstance) {
      handleMapReady();
    }
    
    return () => {
      window.removeEventListener('leaflet-map-ready', handleMapReady);
    };
  }, []);

  // Zoom to selected project when it changes
  useEffect(() => {
    if (selectedProject && (window as any).leafletMapInstance) {
      const map = (window as any).leafletMapInstance;
      const projectData = localProjects.find(p => p.id === selectedProject.id);
      
      if (projectData) {
        // If the project has geometry, use it to calculate bounds
        if (projectData.geometry) {
          try {
            // Create a GeoJSON object for Leaflet to use
            const geoJsonFeature = {
              type: 'Feature',
              properties: {},
              geometry: projectData.geometry
            };
            
            // Create a temporary GeoJSON layer to calculate bounds
            const geoJsonLayer = L.geoJSON(geoJsonFeature as any);
            const bounds = geoJsonLayer.getBounds();
            
            // Add padding and animate to the bounds
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 16,
              animate: true,
              duration: 1
            });
          } catch (error) {
            console.error('Error calculating bounds:', error);
            // Fallback to simple setView if error occurs
            map.setView([projectData.latitude, projectData.longitude], 14, {
              animate: true,
              duration: 1
            });
          }
        } else {
          // For projects without geometry, use a closer zoom level
          map.setView([projectData.latitude, projectData.longitude], 14, {
            animate: true,
            duration: 1
          });
        }
      }
    }
  }, [selectedProject, localProjects]);
  
  // Get map configuration from map-config-service
  const [mapConfig, setMapConfig] = useState(() => {
    try {
      return getMapForUser(user?.id || 'all');
    } catch (error) {
      console.error('Error loading map configuration:', error);
      return {
        id: 'default',
        name: 'Default Map',
        description: 'Default map configuration',
        baseMap: 'cartoVoyager',
        isDefault: true,
        assignedTo: [{ id: 'all', name: 'All Users', type: 'user' }],
        layers: []
      };
    }
  });
  
  // Initialize base maps from configuration
  const [selectedBaseMap, setSelectedBaseMap] = useState<BaseMapOption>(() => {
    const configBaseMap = mapConfig.baseMap || 'cartoVoyager';
    const baseMapUrl = getBasemapUrlFromConfig(configBaseMap);
    
    return {
      name: getBaseMapNameFromConfig(configBaseMap),
      url: baseMapUrl.url,
      attribution: baseMapUrl.attribution,
      checked: true
    };
  });
  
  const [baseMaps, setBaseMaps] = useState<BaseMapOption[]>(() => {
    const configBaseMap = mapConfig.baseMap || 'cartoVoyager';
    return DEFAULT_BASE_MAPS.map(map => ({
      ...map,
      checked: map.name === getBaseMapNameFromConfig(configBaseMap)
    }));
  });
  
  // Create overlay layers from map configuration
  const [overlayLayers, setOverlayLayers] = useState<OverlayLayer[]>(() => {
    // Start with projects layer
    const layers: OverlayLayer[] = [
      { id: 'projects', name: 'Projects', visible: true },
    ];
    
    // Add layers from configuration
    if (mapConfig.layers) {
      mapConfig.layers.forEach(layer => {
        layers.push({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          url: layer.fileInfo ? `/api/layers/${layer.fileInfo.name}` : layer.url
        });
      });
    }
    
    return layers;
  });
  
  // Function to get basemap URL from configuration ID
  function getBasemapUrlFromConfig(baseMapId: string): { url: string, attribution: string } {
    const mapTilesConfig = getMapTiles();
    if (mapTilesConfig && baseMapId in mapTilesConfig) {
      const config = mapTilesConfig[baseMapId as keyof typeof mapTilesConfig];
      return {
        url: config.url,
        attribution: config.attribution
      };
    }
    
    // Default to CARTO Voyager if not found
    return {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    };
  }
  
  // Function to get base map name from configuration ID
  function getBaseMapNameFromConfig(baseMapId: string): string {
    const nameMapping: Record<string, string> = {
      'cartoVoyager': 'CARTO Voyager',
      'cartoPositron': 'CARTO Positron',
      'cartoDarkMatter': 'CARTO Dark Matter',
      'mapboxStreets': 'Mapbox Streets',
      'mapboxSatellite': 'Mapbox Satellite',
      'osm': 'OpenStreetMap'
    };
    
    return nameMapping[baseMapId] || 'CARTO Voyager';
  }

  // Handler for changing the base map
  const handleBaseMapChange = (baseMap: BaseMapOption) => {
    setBaseMaps(prev => 
      prev.map(map => ({
        ...map,
        checked: map.name === baseMap.name
      }))
    );
    setSelectedBaseMap(baseMap);
  };

  // Handler for toggling overlay layers
  const handleOverlayToggle = (layerId: string, visible: boolean) => {
    setOverlayLayers(prev => 
      prev.map(layer => 
        layer.id === layerId ? { ...layer, visible } : layer
      )
    );
  };

  // Create custom marker icon with improved styling
  const getMarkerIcon = (status: string) => {
    let color = '#3388ff'; // Default blue
    
    switch (status.toLowerCase()) {
      case 'approved':
        color = '#4caf50'; // Green
        break;
      case 'in progress':
        color = '#2196f3'; // Blue
        break;
      case 'planning':
        color = '#ff9800'; // Orange
        break;
      case 'completed':
        color = '#9c27b0'; // Purple
        break;
      case 'rejected':
        color = '#f44336'; // Red
        break;
    }
    
    // Create a simpler SVG marker that's more compatible with Leaflet
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12z" 
          fill="${color}" />
        <circle cx="12" cy="12" r="5" fill="white" />
      </svg>
    `;
    
    // Fix btoa encoding issues by properly handling UTF-8
    const encodeSvg = (svg: string) => {
      if (typeof window === 'undefined') return '';
      
      try {
        return window.btoa(unescape(encodeURIComponent(svg)));
      } catch (error) {
        console.error('SVG encoding error:', error);
        // Fallback to a simple marker if encoding fails
        return window.btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><circle cx="12" cy="12" r="10" fill="red"/></svg>');
      }
    };
    
    // Create a Data URL from the SVG
    const svgDataUrl = `data:image/svg+xml;base64,${encodeSvg(svgIcon)}`;
    
    // Create the icon with simpler sizing
    return L.icon({
      iconUrl: svgDataUrl,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36]
    });
  };

  // Handle marker click
  const handleMarkerClick = useCallback((project: Project) => {
    if (onMarkerClick) {
      onMarkerClick(project);
    }
  }, [onMarkerClick]);

  // Only render markers for the 'projects' layer when it's visible
  const renderProjectMarkers = () => {
    const projectsLayer = overlayLayers.find(layer => layer.id === 'projects');
    if (!projectsLayer || !projectsLayer.visible) return null;
    
    return localProjects.map(project => {
      // If project has geometry, use it to render the appropriate feature
      if (project.geometry) {
        // Create GeoJSON structure for the project
        const geoJson = {
          type: 'Feature',
          properties: {
            id: project.id,
            name: project.name,
            status: project.status,
            description: project.description,
            address: project.address,
            category: project.category,
            budget: project.budget
          },
          geometry: project.geometry
        };
        
        // Style based on project status
        const getGeoJSONStyle = (status: string) => {
          let color;
          switch (status.toLowerCase()) {
            case 'approved':
              color = '#4caf50'; // Green
              break;
            case 'in progress':
              color = '#2196f3'; // Blue
              break;
            case 'planning':
              color = '#ff9800'; // Orange
              break;
            case 'completed':
              color = '#9c27b0'; // Purple
              break;
            case 'rejected':
              color = '#f44336'; // Red
              break;
            default:
              color = '#3388ff'; // Default blue
          }
          
          return {
            color: color,
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3,
            fillColor: color
          };
        };
        
        // Create a popup for the geometry feature
        const createPopup = (feature: any) => {
          if (!feature || !feature.properties) return;
          
          const properties = feature.properties;
          return (
            <Popup>
              <div className="popup-content dark:bg-gray-800 dark:text-white">
                <h3 className="font-bold text-base border-b pb-2 mb-2 dark:border-gray-700">{properties.name}</h3>
                {properties.address && <p className="text-sm mb-1 dark:text-gray-300">{properties.address}</p>}
                <p className="text-sm mb-2">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    properties.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    properties.status.toLowerCase() === 'in progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {properties.status}
                  </span>
                </p>
                {properties.description && (
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{properties.description}</p>
                )}
                {properties.budget && (
                  <p className="text-sm mt-2 font-semibold">{properties.budget}</p>
                )}
              </div>
            </Popup>
          );
        };
        
        // Event handlers for GeoJSON features
        const eventHandlers = {
          click: () => {
            if (onMarkerClick) {
              onMarkerClick(project);
            }
          }
        };
        
        return (
          <GeoJSON 
            key={`geojson-${project.id}`}
            data={geoJson as any}
            pathOptions={getGeoJSONStyle(project.status)}
            eventHandlers={eventHandlers}
          >
            {createPopup(geoJson)}
          </GeoJSON>
        );
      }
      
      // Default to markers for projects without geometry
      return (
        <Marker
          key={`marker-${project.id}`}
          position={[project.latitude, project.longitude]}
          icon={getMarkerIcon(project.status)}
          eventHandlers={{
            click: () => handleMarkerClick(project)
          }}
        >
          <Popup>
            <div className="popup-content dark:bg-gray-800 dark:text-white">
              <h3 className="font-bold text-base border-b pb-2 mb-2 dark:border-gray-700">{project.name}</h3>
              {project.address && <p className="text-sm mb-1 dark:text-gray-300">{project.address}</p>}
              <p className="text-sm mb-2">
                <span className="font-medium">Status:</span> 
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  project.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  project.status.toLowerCase() === 'in progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </p>
              {project.description && (
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{project.description}</p>
              )}
              {project.budget && (
                <p className="text-sm mt-2 font-semibold">{project.budget}</p>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <div className={cn("relative w-full h-full", className)} style={{ height, width }}>
      {/* Only render map once ready - this prevents double initialization */}
      {leafletLoaded && (
        <LeafletMapWrapper id={mapId.current}>
          <MapContainer
            key={`leaflet-map-${mapId.current}`}
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%', minHeight: '600px' }}
            zoomControl={false}
            attributionControl={showAttribution}
            whenReady={() => {
              console.log('MapContainer is ready');
              // Mark this container as initialized
              markContainerAsInitialized(mapId.current);
              setMapReady(true);
              
              // Dispatch a custom event to notify the map is ready
              const event = new CustomEvent('leaflet-map-ready');
              window.dispatchEvent(event);
              
              // Store reference to map in window
              if (typeof window !== 'undefined') {
                window.leafletMapInstance = (window as any).leafletMapInstance || null;
              }
            }}
          >
            {/* Base maps */}
            <TileLayer
              url={selectedBaseMap.url}
              attribution={selectedBaseMap.attribution}
            />
            
            {/* Map event handling and global setup - This MUST come before other components */}
            <MapEventHandler />
            
            {/* Only add controls once map is initialized */}
            {mapReady && (
              <>
                <MapControlsComponent 
                  mapCenter={initialCenter}
                  defaultZoom={initialZoom}
                />
                
                {/* Project markers */}
                {renderProjectMarkers()}
                
                {/* GeoJSON layers from configuration */}
                {overlayLayers
                  .filter(layer => layer.id !== 'projects' && layer.visible && layer.url)
                  .map(layer => (
                    <GeoJSONLayer 
                      key={layer.id} 
                      url={layer.url || ''} 
                      visible={layer.visible} 
                    />
                  ))}
                
                {/* Custom zoom control - using our own component instead of Leaflet's */}
                <ZoomControl 
                  mapCenter={initialCenter}
                  defaultZoom={initialZoom}
                />
              </>
            )}
          </MapContainer>
        </LeafletMapWrapper>
      )}
      
      {/* UI Controls - positioned above the map - ONLY show when map is initialized */}
      {isMapInitialized && (
        <>
          {/* Layer selector - top right */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            <LayerSelector
              baseMaps={baseMaps}
              overlayLayers={overlayLayers}
              onBaseMapChange={handleBaseMapChange}
              onOverlayToggle={handleOverlayToggle}
              className="w-[200px]"
            />
          </div>
          
          {/* Search and geolocation controls positioned in bottom left */}
          <div className="absolute bottom-3 left-3 z-[1010] map-ui-container">
            <SearchControl placeholder="Search location..." />
            <GeolocateControl />
          </div>
        </>
      )}
    </div>
  );
} 