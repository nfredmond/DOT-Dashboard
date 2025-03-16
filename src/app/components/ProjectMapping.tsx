"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import L from 'leaflet';
import { SearchControl } from './SearchControl';
import { LayerSelector, BaseMapOption, OverlayLayer } from './LayerSelector';
import { GeolocateControl } from './GeolocateControl';
import { MapControlsComponent, ZoomControl } from './MapControls';
import { cn } from '@/lib/utils';
import { useLeaflet } from '@/hooks/useLeaflet';
import { getMapForUser } from '@/lib/map-config-service';
import { getMapTiles } from '@/lib/map-service';
import { useAuth } from '@/contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

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
  projects?: Project[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  className?: string;
  selectedProject?: Project | null;
  onMarkerClick?: (project: Project) => void;
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
        (window as any).leafletMapInstance = map;
      }
    }
  });

  // Set global map instance on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && map) {
      (window as any).leafletMapInstance = map;
      
      // Signal that the map is ready for components that might need it
      const mapReadyEvent = new CustomEvent('leaflet-map-ready', { detail: { map } });
      window.dispatchEvent(mapReadyEvent);
      console.log('Dispatched leaflet-map-ready event');
    }
    
    return () => {
      // Clean up global reference on unmount
      if (typeof window !== 'undefined') {
        delete (window as any).leafletMapInstance;
      }
    };
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
  initialCenter = [39.8283, -98.5795], // Center of the US
  initialZoom = 4,
  height = '100%',
  width = '100%',
  className = '',
  selectedProject = null,
  onMarkerClick,
}: ProjectMappingProps) {
  const { user } = useAuth();
  const { leafletLoaded, leafletInstance } = useLeaflet();
  const mapRef = useRef(null);
  
  // Track map initialization state
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
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
      const projectData = projects.find(p => p.id === selectedProject.id);
      
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
  }, [selectedProject, projects]);
  
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
    
    // Create an enhanced SVG marker with drop shadow and pulse animation
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
            <feColorMatrix result="matrixOut" in="blurOut" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
            <feBlend in="SourceGraphic" in2="matrixOut" mode="normal" />
          </filter>
          <radialGradient id="grad" cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
            <stop offset="0%" style="stop-color:${color}; stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color}; stop-opacity:0.8" />
          </radialGradient>
        </defs>
        <path d="M16 0C7.2 0 0 7.2 0 16c0 9.6 16 32 16 32s16-22.4 16-32c0-8.8-7.2-16-16-16z" 
          fill="url(#grad)" 
          filter="url(#shadow)" />
        <circle cx="16" cy="16" r="7" fill="white" />
        <circle cx="16" cy="16" r="4" fill="${color}" />
        <circle class="pulse" cx="16" cy="16" r="16" 
          stroke="${color}" 
          stroke-opacity="0.5"
          stroke-width="1.5" 
          fill="none" 
          opacity="0">
          <animate attributeName="r" from="12" to="20" dur="1.5s" begin="0s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
        </circle>
      </svg>
    `;
    
    // Fix btoa encoding issues by properly handling UTF-8
    const encodeSvg = (svg: string) => {
      if (typeof window === 'undefined') return '';
      return window.btoa(unescape(encodeURIComponent(svg)));
    };
    
    // Create a Data URL from the SVG
    const svgDataUrl = `data:image/svg+xml;base64,${encodeSvg(svgIcon)}`;
    
    // Create the icon using the data URL
    return L.icon({
      iconUrl: svgDataUrl,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -42]
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
    
    return projects.map(project => {
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
    <div 
      className={cn("relative overflow-hidden rounded-md border", className)}
      style={{ height, width }}
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
        className="leaflet-container"
        whenReady={() => {
          console.log('MapContainer is ready');
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
        {isMapInitialized && (
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