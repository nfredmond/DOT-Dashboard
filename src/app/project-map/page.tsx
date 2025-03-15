"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ZoomInIcon,
  ZoomOutIcon,
  HomeIcon,
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  ClockIcon,
  LayersIcon,
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  TriangleIcon,
  SquareIcon,
  CircleIcon,
  MousePointerIcon,
  DatabaseIcon,
  BrainIcon,
  CarIcon,
  AlertTriangleIcon,
  LineChartIcon,
  BringToFrontIcon,
  CircleOff,
  Locate
} from "lucide-react";
import dynamic from "next/dynamic";
import type { Map as LeafletMap } from 'leaflet';
import LeafletErrorBoundary from "@/components/LeafletErrorBoundary";
import '@/lib/leaflet-preload'; // Preload Leaflet synchronously
import { useLeaflet } from "@/hooks/useLeaflet";
import { getEnvVariable, isMapProviderConfigured } from "@/lib/env-service";
import { getMapTiles, getAvailableMapTypes, getDefaultMapType } from "@/lib/map-service";
import { createTransportationMap } from "@/lib/leaflet-extensions";
import { CollisionSeverity } from "@/lib/traffic-service";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CustomMarkerClusterGroup from '@/app/components/MarkerClusterGroup';
import { getMapForUser, getTileLayerForMap, saveMaps, getMaps } from "@/lib/map-config-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { PathOptions, LeafletMouseEvent } from 'leaflet';
import type { Feature } from 'geojson';

// Declare global window type
declare global {
  interface Window {
    captureMapInstance?: (map: any) => void;
    L: any;
  }
}

// Dynamically import Leaflet components with no SSR to avoid issues with window object
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const FeatureGroup = dynamic(
  () => import('react-leaflet').then((mod) => mod.FeatureGroup),
  { ssr: false }
);

// Import EditControl component
const EditControl = dynamic(
  () => import('./components/EditControl').then(mod => {
    return { default: mod.EditControl };
  }),
  { ssr: false }
);

// Import GeoJSON component
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

// Import ZoomControl and LayersControl components
const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
);

// Create a wrapper component for LayersControl
const DynamicLayersControl = dynamic(
  async () => {
    const mod = await import('react-leaflet');
    const Component = mod.LayersControl;
    const BaseLayer = mod.LayersControl.BaseLayer;
    
    return function LayersControlWrapper(props: any) {
      return (
        <Component position="topright">
          <BaseLayer checked name="CARTO Voyager">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
              url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            />
          </BaseLayer>
        </Component>
      );
    };
  },
  { ssr: false }
);

// Define a type for the Leaflet map
type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
};

// Define an interface for the tile options
interface TileLayerOptions {
  url: string;
  attribution: string;
  accessToken?: string;
}

// Add a helper at the top level to provide global access to Leaflet functionality
export function setupGlobalLeafletAccess(map: any) {
  if (typeof window !== 'undefined') {
    (window as any).leafletMapInstance = map;
    (window as any).leafletUtils = {
      zoomIn: () => {
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom + 1);
          console.log('Global zoomIn called, new level:', currentZoom + 1);
          return true;
        } catch (e) {
          console.error('Error in global zoomIn:', e);
          return false;
        }
      },
      zoomOut: () => {
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom - 1);
          console.log('Global zoomOut called, new level:', currentZoom - 1);
          return true;
        } catch (e) {
          console.error('Error in global zoomOut:', e);
          return false;
        }
      },
      resetView: (center: [number, number], zoom: number) => {
        try {
          map.setView(center, zoom);
          console.log('Global resetView called');
          return true;
        } catch (e) {
          console.error('Error in global resetView:', e);
          return false;
        }
      }
    };
    console.log('Global Leaflet utilities initialized');
  }
}

// Create a context for the Leaflet map instance
const MapContext = createContext<LeafletMap | null>(null);

// Custom hook to use the map instance
const useMapInstance = () => useContext(MapContext);

// Fix the import section - add dynamic imports for Leaflet hooks
const useMap = dynamic(
  () => import('react-leaflet').then((mod) => {
    return { default: mod.useMap };
  }),
  { ssr: false }
);

const useMapEvents = dynamic(
  () => import('react-leaflet').then((mod) => {
    return { default: mod.useMapEvents };
  }),
  { ssr: false }
);

// Component to handle map events and set up global map instance
function MapEventHandler() {
  // @ts-expect-error - Using dynamically imported useMapEvents
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

// Add a new component for directly controlling the map
function MapControlsComponent({ mapCenter, defaultZoom }: { mapCenter: [number, number], defaultZoom: number }) {
  // @ts-expect-error - Using dynamically imported useMap
  const map = useMap();
  
  // Use the map reference when available
  useEffect(() => {
    if (map) {
      // Store map reference globally for direct access
      if (typeof window !== 'undefined') {
        (window as any).leafletMapInstance = map;
        console.log("Map instance stored globally in MapControlsComponent");
      }
    }
  }, [map]);

  // Return null as this is just for functionality, not rendering
  return null;
}

// Fix the syntax error in MapZoomControls component
function MapZoomControls({ mapCenter, defaultZoom }: { mapCenter: [number, number], defaultZoom: number }) {
  // @ts-expect-error - Using dynamically imported useMap
  const map = useMap();

  const handleZoomIn = () => {
    if (map) {
      try {
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
        console.log("Direct zoom in to level:", currentZoom + 1);
      } catch (err) {
        console.error("Error zooming in:", err);
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      try {
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
        console.log("Direct zoom out to level:", currentZoom - 1);
      } catch (err) {
        console.error("Error zooming out:", err);
      }
    }
  };

  const handleResetView = () => {
    if (map) {
      try {
        map.setView(mapCenter, defaultZoom);
        console.log("Direct reset view to center:", mapCenter, "zoom:", defaultZoom);
      } catch (err) {
        console.error("Error resetting view:", err);
      }
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <a href="#" title="Zoom in" onClick={(e) => { e.preventDefault(); handleZoomIn(); }} className="leaflet-control-zoom-in">+</a>
        <a href="#" title="Zoom out" onClick={(e) => { e.preventDefault(); handleZoomOut(); }} className="leaflet-control-zoom-out">-</a>
        <a href="#" title="Reset view" onClick={(e) => { e.preventDefault(); handleResetView(); }} style={{ fontSize: '16px' }}>⌂</a>
      </div>
    </div>
  );
}

// Create a native Leaflet custom control class for map buttons
function createMapControls(L: any, mapCenter: [number, number], defaultZoom: number) {
  if (!L) return null;

  // Create custom Leaflet control for map buttons
  const CustomMapControls = L.Control.extend({
    options: {
      position: 'topright'
    },

    onAdd: function(map: any) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.style.backgroundColor = 'white';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.opacity = '0.9';
      
      // Create zoom in button
      const zoomInBtn = L.DomUtil.create('a', 'custom-map-control', container);
      zoomInBtn.href = '#';
      zoomInBtn.title = 'Zoom In';
      zoomInBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
      zoomInBtn.style.display = 'flex';
      zoomInBtn.style.alignItems = 'center';
      zoomInBtn.style.justifyContent = 'center';
      zoomInBtn.style.width = '30px';
      zoomInBtn.style.height = '30px';
      zoomInBtn.style.borderBottom = '1px solid #ccc';

      // Create zoom out button
      const zoomOutBtn = L.DomUtil.create('a', 'custom-map-control', container);
      zoomOutBtn.href = '#';
      zoomOutBtn.title = 'Zoom Out';
      zoomOutBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
      zoomOutBtn.style.display = 'flex';
      zoomOutBtn.style.alignItems = 'center';
      zoomOutBtn.style.justifyContent = 'center';
      zoomOutBtn.style.width = '30px';
      zoomOutBtn.style.height = '30px';
      zoomOutBtn.style.borderBottom = '1px solid #ccc';

      // Create home button
      const homeBtn = L.DomUtil.create('a', 'custom-map-control', container);
      homeBtn.href = '#';
      homeBtn.title = 'Reset View';
      homeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
      homeBtn.style.display = 'flex';
      homeBtn.style.alignItems = 'center';
      homeBtn.style.justifyContent = 'center';
      homeBtn.style.width = '30px';
      homeBtn.style.height = '30px';

      // Add event listeners
      L.DomEvent.on(zoomInBtn, 'click', function(e: Event) {
        L.DomEvent.preventDefault(e);
        console.log('Native Leaflet zoom in clicked');
        map.setZoom(map.getZoom() + 1);
      });

      L.DomEvent.on(zoomOutBtn, 'click', function(e: Event) {
        L.DomEvent.preventDefault(e);
        console.log('Native Leaflet zoom out clicked');
        map.setZoom(map.getZoom() - 1);
      });

      L.DomEvent.on(homeBtn, 'click', function(e: Event) {
        L.DomEvent.preventDefault(e);
        console.log('Native Leaflet home clicked');
        map.setView(mapCenter, defaultZoom);
      });

      // Prevent map click events from propagating
      L.DomEvent.disableClickPropagation(container);
      
      return container;
    }
  });

  return new CustomMapControls();
}

// Add this helper function at the top of the file
function registerDOMMapButtons(map: any, mapCenter: [number, number], defaultZoom: number) {
  if (!map || typeof window === 'undefined') return;
  
  // Store map globally so it's accessible from everywhere
  (window as any)._leafletMapInstance = map;
  
  // Wait a short time to ensure DOM is ready
  setTimeout(() => {
    // Find buttons by their IDs and attach event handlers directly
    const zoomInBtn = document.getElementById('map-zoom-in-btn');
    const zoomOutBtn = document.getElementById('map-zoom-out-btn');
    const homeBtn = document.getElementById('map-home-btn');
    
    if (zoomInBtn) {
      zoomInBtn.onclick = (e) => {
        e.preventDefault();
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
        console.log('DOM button: zoomed in to level:', currentZoom + 1);
      };
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.onclick = (e) => {
        e.preventDefault();
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
        console.log('DOM button: zoomed out to level:', currentZoom - 1);
      };
    }
    
    if (homeBtn) {
      homeBtn.onclick = (e) => {
        e.preventDefault();
        map.setView(mapCenter, defaultZoom);
        console.log('DOM button: reset view to default');
      };
    }
    
    console.log('Map buttons registered with direct DOM handlers');
  }, 1000);
}

export default function ProjectMap() {
  // Dynamic import components as needed
  const [mapType, setMapType] = useState(getDefaultMapType());
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [mapCenter] = useState<[number, number]>([39.2615, -121.0165]);
  const [zoom] = useState(13);
  const mapRef = useRef<LeafletMap | null>(null);
  // Add global map state to track if it's ready
  const [mapReady, setMapReady] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  
  // Use our custom hook for Leaflet initialization
  const { leafletLoaded, leafletInstance } = useLeaflet();

  // Mock projects for the map
  const [allProjects, setAllProjects] = useState([
    {
      id: '1',
      name: "Highway 101 Expansion",
      lat: 34.42083,
      lng: -119.698189,
      type: "highway",
      status: "in-progress",
      budget: "$24M",
      startDate: "2023-05-15",
      endDate: "2024-12-31",
      description: "Expansion of Highway 101 to reduce congestion",
      intensity: 0.8,
      organizationId: "1",
      organizationName: "Example Organization",
      isPublic: true
    },
    {
      id: '2',
      name: "Downtown Transit Center",
      lat: 38.581572,
      lng: -121.4944,
      type: "transit",
      status: "planned",
      budget: "$12M",
      startDate: "2024-01-10",
      endDate: "2025-06-30",
      description: "New transit center to improve public transportation access",
      intensity: 0.7,
      organizationId: "2",
      organizationName: "Partner Agency",
      isPublic: false
    },
    {
      id: '3',
      name: "Bike Lane Network",
      lat: 37.774929,
      lng: -122.419418,
      type: "active",
      status: "completed",
      budget: "$5M",
      startDate: "2022-03-01",
      endDate: "2023-09-15",
      description: "Network of protected bike lanes throughout the city",
      intensity: 0.9,
      organizationId: "1",
      organizationName: "Example Organization",
      isPublic: true
    },
    {
      id: '4',
      name: "Bridge Retrofit Project",
      lat: 37.82604,
      lng: -122.4225,
      type: "bridge",
      status: "in-progress",
      budget: "$35M",
      startDate: "2023-07-20",
      endDate: "2025-08-01",
      description: "Seismic retrofit of major bridge",
      intensity: 0.6,
      organizationId: "2",
      organizationName: "Partner Agency",
      isPublic: false
    },
  ]);

  // Filtered projects based on user's organization and selected layer
  const projects = allProjects.filter(project => {
    // Only show public projects and projects from the user's organization
    const organizationMatch = !user || project.organizationId === user.id || project.isPublic;
    const layerMatch = selectedLayer === "all" || project.type === selectedLayer;
    return organizationMatch && layerMatch;
  });

  // Map Control Component that doesn't use any Leaflet hooks directly
  function MapControls() {
    // Instead of trying to use useMap directly, we'll set up a DOM mutation observer
    // to detect when the map is available in the DOM
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      // Function to find map instance through DOM
      const findAndSetMapRef = () => {
        const container = document.querySelector('.leaflet-container');
        if (!container) return false;
        
        // We need to access the Leaflet instance
        try {
          // Find map instance through the Leaflet global
          if (window.L && window.L.map) {
            // Try to get the map instance - it might be stored in different ways
            // Check for various ways the map instance might be available
            const mapInstance = (window as any)._mapInstance;
            
            if (mapInstance) {
              mapRef.current = mapInstance;
              console.log("Map reference obtained from _mapInstance");
              return true;
            }

            // Fallback to Leaflet's internal structures
            const leafletContainer = document.querySelector('.leaflet-container') as HTMLElement & { _leaflet_id?: number };
            const altMapInstance = window.L.map._mapInstances?.[0] || 
                                 (leafletContainer?._leaflet_id && 
                                 window.L.map._layers?.[leafletContainer._leaflet_id]);
            
            if (altMapInstance) {
              mapRef.current = altMapInstance;
              console.log("Map reference obtained from Leaflet internals");
              return true;
            }
          }
        } catch (err) {
          console.error("Error finding map:", err);
        }
        
        return false;
      };
      
      // Try immediately
      if (findAndSetMapRef()) return;
      
      // Set up an interval to check for the map
      const checkInterval = setInterval(() => {
        if (findAndSetMapRef()) {
          clearInterval(checkInterval);
        }
      }, 200);
      
      // Clean up
      return () => clearInterval(checkInterval);
    }, []);

    // This component doesn't render anything visual
    return null;
  }

  // Map tile layers from map service
  const mapTiles = getMapTiles();

  // Functions for map interactions
  const handleZoomIn = () => {
    if (typeof window === 'undefined') return;
    
    // Try using the global utilities first
    if ((window as any).leafletUtils?.zoomIn) {
      return (window as any).leafletUtils.zoomIn();
    }
    
    // Fallback to direct instance
    const mapInstance = (window as any).leafletMapInstance;
    if (mapInstance) {
      try {
        const currentZoom = mapInstance.getZoom();
        mapInstance.setZoom(currentZoom + 1);
        console.log("Zoomed in to level:", currentZoom + 1);
      } catch (err) {
        console.error("Error zooming in:", err);
      }
    } else {
      console.warn("Map reference not available for zoom in");
    }
  };

  const handleZoomOut = () => {
    if (typeof window === 'undefined') return;
    
    // Try using the global utilities first
    if ((window as any).leafletUtils?.zoomOut) {
      return (window as any).leafletUtils.zoomOut();
    }
    
    // Fallback to direct instance
    const mapInstance = (window as any).leafletMapInstance;
    if (mapInstance) {
      try {
        const currentZoom = mapInstance.getZoom();
        mapInstance.setZoom(currentZoom - 1);
        console.log("Zoomed out to level:", currentZoom - 1);
      } catch (err) {
        console.error("Error zooming out:", err);
      }
    } else {
      console.warn("Map reference not available for zoom out");
    }
  };

  const handleResetView = () => {
    if (typeof window === 'undefined') return;
    
    // Try using the global utilities first
    if ((window as any).leafletUtils?.resetView) {
      return (window as any).leafletUtils.resetView(mapCenter, zoom);
    }
    
    // Fallback to direct instance
    const mapInstance = (window as any).leafletMapInstance;
    if (mapInstance) {
      try {
        mapInstance.setView(mapCenter, zoom);
        console.log("Reset view to center:", mapCenter, "zoom:", zoom);
      } catch (err) {
        console.error("Error resetting view:", err);
      }
    } else {
      console.warn("Map reference not available for reset view");
    }
  };

  // Function to handle editing events
  const handleEdit = (e: unknown) => {
    console.log('Edit event:', e);
  };

  // Component for rendering project markers
  function ProjectMarkers() {
    // Safety check - only render when all dependencies are loaded and map is initialized
    if (!leafletLoaded || !mapRef.current) return null;
    
    try {
      return (
        <FeatureGroup>
          <CustomMarkerClusterGroup>
            {projects.map(project => (
              <Marker 
                key={project.id} 
                position={[project.lat, project.lng]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{project.name}</h3>
                    <p className="text-sm">{project.description}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <span>Type: {project.type}</span>
                      <span>Status: {project.status}</span>
                      <span>Budget: {project.budget}</span>
                      <span>Timeline: {project.startDate} - {project.endDate}</span>
                      <span>Organization: {project.organizationName}</span>
                    </div>
                    <div className="mt-3 text-right">
                      <button 
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </CustomMarkerClusterGroup>
        </FeatureGroup>
      );
    } catch (error) {
      console.error("Error rendering project markers:", error);
      return null;
    }
  }

  // Component for drawing tools
  function DrawingTools() {
    // Only render when Leaflet is fully loaded
    if (!leafletLoaded || !mapRef.current) return null;
    
    try {
      return (
        <FeatureGroup>
          {/* EditControl is a third-party component with correct props at runtime */}
          <EditControl
            position="topleft"
            onCreated={handleEdit}
            onEdited={handleEdit}
            onDeleted={handleEdit}
            draw={{
              rectangle: true,
              polyline: true,
              polygon: true,
              circle: true,
              marker: true
            }}
          />
        </FeatureGroup>
      );
    } catch (error) {
      console.error("Error rendering drawing tools:", error);
      return null;
    }
  }

  const [mapConfig, setMapConfig] = useState(() => getMapForUser(user?.id || 'all'));
  const [mapTileConfig, setMapTileConfig] = useState(() => getTileLayerForMap(mapConfig.id));
  const [layerData, setLayerData] = useState<Record<string, any>>({});
  
  // Update map configuration when user changes
  useEffect(() => {
    if (user) {
      const newMapConfig = getMapForUser(user.id);
      setMapConfig(newMapConfig);
      setMapTileConfig(getTileLayerForMap(newMapConfig.id));
    }
  }, [user]);

  // Load layer data when config changes
  useEffect(() => {
    const loadLayerData = async () => {
      const newLayerData: Record<string, any> = {};
      
      for (const layer of mapConfig.layers) {
        if (layer.type === 'kmz' && layer.fileInfo) {
          try {
            const response = await fetch(`/api/layers/${layer.fileInfo.name}`);
            const data = await response.json();
            newLayerData[layer.id] = data;
          } catch (error) {
            console.error(`Error loading layer ${layer.id}:`, error);
          }
        }
      }
      
      setLayerData(newLayerData);
    };
    
    loadLayerData();
  }, [mapConfig]);

  // Handler to toggle layer visibility
  const handleToggleLayer = (layerId: string) => {
    const allMaps = getMaps();
    const updatedMaps = allMaps.map(map => 
      map.id === mapConfig.id 
        ? { 
            ...map, 
            layers: map.layers.map(layer => 
              layer.id === layerId 
                ? { ...layer, visible: !layer.visible }
                : layer
            ) 
          } 
        : map
    );
    
    saveMaps(updatedMaps);
    setMapConfig(updatedMaps.find(m => m.id === mapConfig.id) || mapConfig);
  };

  // Function to style GeoJSON features
  const geoJSONStyle: PathOptions = {
    color: '#3388ff',
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.2,
    fillColor: '#3388ff'
  };

  // GeoJSON event handlers
  const geoJSONEventHandlers = {
    click: (e: LeafletMouseEvent) => {
      const layer = e.target;
      const feature = layer.feature as Feature;
      if (feature?.properties) {
        layer.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${feature.properties.name || 'Unnamed Feature'}</h3>
            <p>${feature.properties.type || 'No type specified'}</p>
          </div>
        `).openPopup();
      }
    }
  };

  // Function to check and update map reference
  const updateMapRef = () => {
    // First try to get from our ref
    if (mapRef.current) {
      return true;
    }
    
    // Then try to get from window
    if ((window as any).leafletMapInstance) {
      mapRef.current = (window as any).leafletMapInstance;
      setMapReady(true);
      return true;
    }

    // Additional fallback check - try to find the map instance through Leaflet's internals
    try {
      if (window.L && window.L.map) {
        // Try other ways Leaflet might store map instances
        const leafletMapInstances = (window.L.map as any)._mapInstances;
        if (leafletMapInstances && leafletMapInstances.length > 0) {
          mapRef.current = leafletMapInstances[0];
          setMapReady(true);
          console.log("Map reference obtained from Leaflet internals");
          return true;
        }

        // Try to get through DOM
        const container = document.querySelector('.leaflet-container') as HTMLElement & { _leaflet_id?: number };
        if (container && container._leaflet_id && (window.L.map as any)._layers) {
          const mapInstance = (window.L.map as any)._layers[container._leaflet_id];
          if (mapInstance) {
            mapRef.current = mapInstance;
            setMapReady(true);
            console.log("Map reference obtained through DOM and Leaflet internals");
            return true;
          }
        }
      }
    } catch (err) {
      console.error("Error finding map through Leaflet internals:", err);
    }
    
    return false;
  };

  // Function to handle search with improved map reference handling
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search triggered for:", searchQuery);
    if (!searchQuery.trim() || isSearching) return;
    
    // Ensure we have a valid map reference
    let mapInstance = mapRef.current || (window as any).leafletMapInstance;
    if (!mapInstance) {
      console.log("Map reference not found immediately, attempting to locate...");
      // Try to find the map through other methods
      try {
        if (window.L && window.L.map) {
          const maps = (window.L.map as any)._instances || [];
          if (maps.length > 0) {
            mapInstance = maps[0];
            mapRef.current = mapInstance;
            console.log("Map reference found through Leaflet internals");
          } else {
            // Try to find through DOM
            const container = document.querySelector('.leaflet-container');
            if (container && (container as any)._leaflet_id && (window.L.map as any)._layers) {
              const leafletId = (container as any)._leaflet_id;
              mapInstance = (window.L.map as any)._layers[leafletId];
              if (mapInstance) {
                mapRef.current = mapInstance;
                console.log("Map reference found through DOM");
              }
            }
          }
        }
        
        // Get it from the global object if someone else set it
        if (!mapInstance) {
          mapInstance = (window as any).leafletMapInstance;
          if (mapInstance) {
            mapRef.current = mapInstance;
            console.log("Map reference found through global variable");
          }
        }
      } catch (err) {
        console.error("Error finding map reference:", err);
      }
    }
    
    // If we still don't have a map reference, delay and try the search later
    if (!mapInstance) {
      console.warn("Map reference not available for search, will retry once");
      // Wait and try one more time
      setTimeout(() => {
        const retryMap = mapRef.current || (window as any).leafletMapInstance;
        if (retryMap) {
          console.log("Map reference acquired on retry, proceeding with search");
          performSearchWithMap(retryMap);
        } else {
          console.error("Failed to get map reference after retry, search cannot proceed");
        }
      }, 3000);
      return;
    }
    
    // Proceed with search using the found map instance
    performSearchWithMap(mapInstance);
  };
  
  // Modified search function that takes an explicit map instance
  const performSearchWithMap = async (mapInstance: any) => {
    if (!searchQuery.trim() || isSearching) return;
    
    setIsSearching(true);
    try {
      console.log("Searching for location:", searchQuery);
      // Use Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TransportationPlanner/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        console.log("Found location:", data[0].display_name, "at coordinates:", lat, lon);
        
        if (mapInstance && typeof mapInstance.setView === 'function') {
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          
          console.log("Setting view to search result:", latitude, longitude);
          mapInstance.setView([latitude, longitude], 14);
          
          // Optional: add a temporary marker at the searched location
          if (window.L) {
            try {
              const marker = window.L.marker([latitude, longitude])
                .addTo(mapInstance);
                
              if (marker && typeof marker.bindPopup === 'function') {
                marker.bindPopup(`<b>${searchQuery}</b><br>${data[0].display_name}`)
                .openPopup();
              }
              
              // Remove marker after some time
              setTimeout(() => {
                try {
                  if (marker && typeof marker.remove === 'function') {
                    marker.remove();
                  } else if (mapInstance && typeof mapInstance.removeLayer === 'function') {
                    mapInstance.removeLayer(marker);
                  }
                } catch (err) {
                  console.error("Error removing marker:", err);
                }
              }, 10000); // Remove after 10 seconds
            } catch (err) {
              console.error("Error creating marker:", err);
            }
          }
        } else {
          console.error("Map setView method not available");
        }
      } else {
        console.log("Location not found for query:", searchQuery);
        // Could add toast notification here
      }
    } catch (error) {
      console.error("Error during geocoding search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle geolocation with improved map reference handling
  const handleGeolocation = () => {
    console.log("Geolocation requested");
    
    // Get the map instance using all available methods
    const mapInstance = mapRef.current || (window as any).leafletMapInstance;
    if (!mapInstance || typeof mapInstance.setView !== 'function') {
      console.error("Map reference not available for geolocation");
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          console.log("Current location detected:", latitude, longitude);
          mapInstance.setView([latitude, longitude], 15);
          
          // Add a temporary marker at the user's location
          if (window.L) {
            try {
              const marker = window.L.marker([latitude, longitude])
                .addTo(mapInstance);
                
              if (marker && typeof marker.bindPopup === 'function') {
                marker.bindPopup("Your location")
                  .openPopup();
              }
              
              // Remove marker after some time
              setTimeout(() => {
                try {
                  if (marker && typeof marker.remove === 'function') {
                    marker.remove();
                  } else if (mapInstance && typeof mapInstance.removeLayer === 'function') {
                    mapInstance.removeLayer(marker);
                  }
                } catch (err) {
                  console.error("Error removing marker:", err);
                }
              }, 10000); // Remove after 10 seconds
            } catch (err) {
              console.error("Error creating marker:", err);
            }
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          // Could add toast notification here
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser");
      // Could add toast notification here
    }
  };

  // When the component loads, we need to initialize a global helper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create global helper methods for map operations
      (window as any).leafletMapOperations = {
        setMapInstance: (map: any) => {
          (window as any).leafletMapInstance = map;
          mapRef.current = map;
          setMapReady(true);
          console.log("Map instance explicitly set via global helper");
        }
      };
      
      return () => {
        delete (window as any).leafletMapOperations;
        delete (window as any).leafletMapInstance;
      };
    }
  }, []);

  // Function to add custom controls directly in the map initialization
  const addDirectMapControls = (map: any) => {
    try {
      // First, remove any existing custom controls
      document.querySelectorAll('.custom-map-controls').forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Create the control container
      const controlDiv = document.createElement('div');
      controlDiv.className = 'custom-map-controls';
      controlDiv.style.position = 'absolute';
      controlDiv.style.top = '20px';
      controlDiv.style.left = '20px';
      controlDiv.style.zIndex = '10000'; // Very high z-index to ensure visibility
      
      // Create the control buttons
      controlDiv.innerHTML = `
        <div style="background: white; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.4);">
          <button id="zoom-in-btn" style="display: block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 20px; font-weight: bold; border: none; background: none; cursor: pointer; padding: 0;">+</button>
          <button id="zoom-out-btn" style="display: block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; font-weight: bold; border: none; background: none; cursor: pointer; padding: 0; border-top: 1px solid #ccc;">−</button>
          <button id="home-btn" style="display: block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 18px; font-weight: bold; border: none; background: none; cursor: pointer; padding: 0; border-top: 1px solid #ccc;">⌂</button>
        </div>
      `;
      
      // Add the control div directly to the document body to avoid any z-index issues
      document.body.appendChild(controlDiv);
      
      // Position correctly relative to the map
      const updatePosition = () => {
        if (!map || !map.getContainer) return;
        const mapContainer = map.getContainer();
        if (!mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        controlDiv.style.top = `${rect.top + 20}px`;
        controlDiv.style.left = `${rect.left + 20}px`;
      };
      
      // Update position initially and on window resize
      updatePosition();
      window.addEventListener('resize', updatePosition);
      
      // Add the event listeners
      document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
        console.log('Zoom in clicked');
        if (map && typeof map.getZoom === 'function' && typeof map.setZoom === 'function') {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom + 1);
          console.log('Zoomed in to level:', currentZoom + 1);
        }
      });
      
      document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
        console.log('Zoom out clicked');
        if (map && typeof map.getZoom === 'function' && typeof map.setZoom === 'function') {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom - 1);
          console.log('Zoomed out to level:', currentZoom - 1);
        }
      });
      
      document.getElementById('home-btn')?.addEventListener('click', () => {
        console.log('Home button clicked');
        if (map && typeof map.setView === 'function') {
          map.setView(mapCenter, zoom);
          console.log('Reset view to center:', mapCenter, 'zoom:', zoom);
        }
      });
      
      console.log('Direct map controls added successfully');
      
      // Return a cleanup function
      return () => {
        if (controlDiv.parentNode) {
          controlDiv.parentNode.removeChild(controlDiv);
        }
        window.removeEventListener('resize', updatePosition);
      };
    } catch (error) {
      console.error('Error adding direct map controls:', error);
      return () => {};
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <LeafletErrorBoundary>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            console.log("Map initialized in whenCreated");
            
            // Store map in window for global access
            if (typeof window !== 'undefined') {
              (window as any).leafletMapInstance = map;
              (window as any)._leafletMapInstance = map;
              
              // Add custom controls after a short delay to ensure DOM is ready
              setTimeout(() => {
                addDirectMapControls(map);
              }, 100);
              
              // Store directly in React ref for direct component access
              mapRef.current = map;
              setMapReady(true);
              
              // Set map options
              map.setMaxZoom(18);
              map.setMinZoom(3);
            }
            
            // Return cleanup function
            return () => {
              if (typeof window !== 'undefined') {
                delete (window as any).leafletMapInstance;
                delete (window as any)._leafletMapInstance;
                delete (window as any).leafletUtils;
              }
              mapRef.current = null;
              setMapReady(false);
              
              // Clean up custom controls
              document.querySelectorAll('.custom-map-controls').forEach(el => {
                if (el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });
              
              map.remove();
            };
          }}
          zoomControl={false}  // Disable default zoom control
          maxBoundsViscosity={1.0}
          boundsOptions={{ padding: [50, 50] }}
        >
          {/* Default CARTO Voyager base layer to ensure map has tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {/* Map Layers from Configuration */}
          {mapConfig.layers.filter(layer => layer.visible).map(layer => {
            if (layer.type === 'kmz' && layer.fileInfo && layerData[layer.id]) {
              return (
                <GeoJSON
                  key={layer.id}
                  data={layerData[layer.id]}
                  pathOptions={geoJSONStyle}
                  eventHandlers={geoJSONEventHandlers}
                />
              );
            } else if (layer.type === 'external' && layer.url) {
              return (
                <TileLayer
                  key={layer.id}
                  url={layer.url}
                  attribution={layer.description}
                />
              );
            }
            return null;
          })}
          
          {/* We only add these components after ensuring MapContainer is rendered */}
          <MapEventHandler />
          <MapControls />
          <ProjectMarkers />
          {drawingMode && <DrawingTools />}
        </MapContainer>
      </LeafletErrorBoundary>

      {/* Project Title */}
      <div className="absolute top-4 left-4 z-[9000]">
        <Card className="bg-background/95 backdrop-blur-sm shadow-md">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">{mapConfig.name || 'Transportation Projects Map'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Replace the buttons with a loading indicator that disappears when native controls are added */}
      <div className="absolute top-4 right-4 z-[9000] flex flex-col gap-2">
        {/* Layer Control */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="bg-background shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <LayersIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {mapConfig.layers.map(layer => (
              <DropdownMenuItem
                key={layer.id}
                className="flex items-center justify-between"
                onClick={() => handleToggleLayer(layer.id)}
              >
                <span>{layer.name}</span>
                {layer.visible ? <EyeIcon className="h-4 w-4" /> : <CircleOff className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Timeline Controls */}
        <Button
          variant="secondary"
          size="icon"
          id="map-timeline-btn"
          onClick={() => {
            setShowTimeline(!showTimeline);
            console.log("Timeline toggled:", !showTimeline);
          }}
          className="bg-background shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <ClockIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Bar and Geolocation - moved to bottom left with higher z-index */}
      <div className="absolute bottom-8 left-4 z-[10000] w-80">
        <Card className="bg-background/95 backdrop-blur-sm shadow-md">
          <CardContent className="p-3">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search location..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                variant="secondary" 
                size="icon"
                disabled={isSearching}
                className="bg-background shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleGeolocation}
                className="bg-background shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Locate className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
