"use client"

import React, { useState, useEffect, useRef } from 'react';
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

interface Project {
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
}

interface ProjectMappingProps {
  projects?: Project[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  className?: string;
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

  // Create custom marker icon
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
    
    return divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'custom-marker-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Only render markers for the 'projects' layer when it's visible
  const renderProjectMarkers = () => {
    const projectsLayer = overlayLayers.find(layer => layer.id === 'projects');
    if (!projectsLayer || !projectsLayer.visible) return null;
    
    return projects.map(project => (
      <Marker
        key={project.id}
        position={[project.latitude, project.longitude]}
        icon={getMarkerIcon(project.status)}
      >
        <Popup>
          <div>
            <h3 className="font-bold">{project.name}</h3>
            {project.address && <p className="text-sm">{project.address}</p>}
            <p className="text-sm mt-1">Status: <span className="font-medium">{project.status}</span></p>
            {project.description && <p className="text-sm mt-1">{project.description}</p>}
          </div>
        </Popup>
      </Marker>
    ));
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
        {/* Add attribution control explicitly */}
        <AttributionControl position="bottomright" />
        
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
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            <LayerSelector
              baseMaps={baseMaps}
              overlayLayers={overlayLayers}
              onBaseMapChange={handleBaseMapChange}
              onOverlayToggle={handleOverlayToggle}
              className="w-[200px]"
            />
          </div>
          
          <div className="absolute top-3 left-3 z-[1000] flex gap-2">
            <SearchControl className="w-[250px]" />
            <GeolocateControl />
          </div>
        </>
      )}
    </div>
  );
} 