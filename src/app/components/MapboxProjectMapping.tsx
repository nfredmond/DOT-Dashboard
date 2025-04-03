'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import MapboxMap from '@/components/ui/mapbox-map';
import MapboxSource from '@/components/ui/mapbox-source';
import MapboxLayer from '@/components/ui/mapbox-layer';
import { useMapbox } from '@/contexts/mapbox-context';
import { Project, ProjectStatus, ProjectCategory, ProjectGeometry } from '@/types/project';
import { projectToGeoJSON } from '@/lib/map/project-map-integration';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define map style options
const MAP_STYLES = [
  {
    id: 'mapboxStreets',
    name: 'Mapbox Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    checked: true,
  },
  {
    id: 'mapboxOutdoors',
    name: 'Mapbox Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v12',
    checked: false,
  },
  {
    id: 'mapboxLight',
    name: 'Mapbox Light',
    url: 'mapbox://styles/mapbox/light-v11',
    checked: false,
  },
  {
    id: 'mapboxDark',
    name: 'Mapbox Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    checked: false,
  },
  {
    id: 'mapboxSatellite',
    name: 'Mapbox Satellite',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    checked: false,
  },
];

interface MapboxProjectMappingProps {
  projects?: Project[];
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
  className?: string;
  selectedProject?: Project | null;
  onMarkerClick?: (project: Project) => void;
  testingMode?: boolean;
  onError?: (error: Error) => void;
}

export function MapboxProjectMapping({
  projects = [],
  initialCenter = [-121.0149, 39.2615], // Nevada City, CA (note: Mapbox uses [lng, lat] unlike Leaflet)
  initialZoom = 13,
  height = '100%',
  width = '100%',
  className = '',
  selectedProject = null,
  onMarkerClick,
  testingMode = true,
  onError,
}: MapboxProjectMappingProps) {
  // State for projects
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  
  // State for map styles and layers
  const [mapStyles, setMapStyles] = useState(MAP_STYLES);
  const [selectedMapStyle, setSelectedMapStyle] = useState(() => 
    MAP_STYLES.find(style => style.checked)?.url || MAP_STYLES[0].url
  );
  
  // Layer visibility state
  const [showProjects, setShowProjects] = useState(true);
  
  // Get Mapbox context
  const { map, flyTo, fitBounds } = useMapbox(); // eslint-disable-line no-unused-vars
  
  // Add test projects in testing mode
  useEffect(() => {
    if (testingMode && projects.length === 0) {
      // Add sample projects if needed for testing
      const testProjects = generateTestProjects();
      setLocalProjects(testProjects);
    } else {
      setLocalProjects(projects);
    }
  }, [projects, testingMode]);
  
  // Handle selected project changes
  useEffect(() => {
    if (selectedProject && map) {
      // Find the project in our local projects
      const project = localProjects.find(p => p.id === selectedProject.id) || selectedProject;
      
      // If project has geometry, fit bounds to it
      if (project.geometry) {
        // Create GeoJSON feature for the project
        const feature = projectToGeoJSON(project);
        if (feature) {
          // Use Mapbox's fitBounds to focus on the geometry
          try {
            // Get coordinates from the GeoJSON feature
            const coordinates = getAllCoordinates(project.geometry);
            if (coordinates.length > 0) {
              // Calculate bounds
              const bounds = getBoundsFromCoordinates(coordinates);
              // Fit map to bounds with padding
              fitBounds([
                [bounds.west, bounds.south],
                [bounds.east, bounds.north]
              ], { padding: 50 });
            }
          } catch (error) {
            console.error('Error fitting bounds to project geometry:', error);
            // Fallback to flyTo if bounds calculation fails
            if (project.coordinates) {
              flyTo({ 
                lng: project.coordinates.longitude, 
                lat: project.coordinates.latitude,
                zoom: 14
              });
            }
          }
        }
      } else if (project.coordinates) {
        // For point projects without geometry, just fly to the coordinates
        flyTo({ 
          lng: project.coordinates.longitude, 
          lat: project.coordinates.latitude,
          zoom: 14
        });
      }
    }
  }, [selectedProject, localProjects, map, flyTo, fitBounds]);
  
  // Handle marker click event from the map
  const handleFeatureClick = useCallback((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const projectId = feature.properties?.id;
      
      if (projectId && onMarkerClick) {
        const project = localProjects.find(p => p.id === projectId);
        if (project) {
          onMarkerClick(project);
        }
      }
    }
  }, [localProjects, onMarkerClick]);
  
  // Convert projects to GeoJSON
  const projectsGeoJSON = {
    type: 'FeatureCollection',
    features: localProjects
      .map(project => projectToGeoJSON(project))
      .filter(Boolean) as GeoJSON.Feature[]
  };
  
  // Handle map style changes
  const handleMapStyleChange = (styleId: string) => {
    const style = MAP_STYLES.find(s => s.id === styleId);
    if (style) {
      setMapStyles(prev => 
        prev.map(s => ({
          ...s,
          checked: s.id === styleId
        }))
      );
      setSelectedMapStyle(style.url);
    }
  };
  
  // Create color expressions for different project statuses
  const getStatusColorExpression = () => [
    'match',
    ['get', 'status'],
    'Planning', '#ff9800',
    'Design', '#2196f3',
    'Environmental', '#009688',
    'RightOfWay', '#9c27b0',
    'Construction', '#ff5722',
    'Complete', '#4caf50',
    'Cancelled', '#f44336',
    'On Hold', '#9e9e9e',
    '#3388ff' // default color
  ];

  return (
    <div className={cn("relative w-full", className)} style={{ height, width }}>
      {/* Main Mapbox component */}
      <MapboxMap
        initialViewState={{
          longitude: initialCenter[0],
          latitude: initialCenter[1],
          zoom: initialZoom,
        }}
        mapStyle={selectedMapStyle}
        className="h-full w-full"
        onMapLoad={(map) => {
          // Map loaded successfully
        }}
        onError={(error: Error) => {
          console.error('Mapbox initialization error:', error);
          if (onError) onError(error);
        }}
      >
        {/* Project data source and layers */}
        {showProjects && localProjects.length > 0 && (
          <>
            <MapboxSource
              id="projects-source"
              source={{
                type: 'geojson',
                data: projectsGeoJSON as GeoJSON.FeatureCollection,
              }}
            >
              {/* Point layer for point geometries */}
              <MapboxLayer
                id="project-points"
                type="circle"
                filter={['==', ['geometry-type'], 'Point']}
                paint={{
                  'circle-radius': 8,
                  'circle-color': getStatusColorExpression(),
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 0.8,
                }}
                onClick={handleFeatureClick}
              />
              
              {/* Line layer for LineString geometries */}
              <MapboxLayer
                id="project-lines"
                type="line"
                filter={['==', ['geometry-type'], 'LineString']}
                paint={{
                  'line-color': getStatusColorExpression(),
                  'line-width': 4,
                  'line-opacity': 0.8,
                }}
                onClick={handleFeatureClick}
              />
              
              {/* Fill layer for Polygon geometries */}
              <MapboxLayer
                id="project-polygons-fill"
                type="fill"
                filter={['==', ['geometry-type'], 'Polygon']}
                paint={{
                  'fill-color': getStatusColorExpression(),
                  'fill-opacity': 0.3,
                }}
                onClick={handleFeatureClick}
              />
              
              {/* Outline layer for Polygon geometries */}
              <MapboxLayer
                id="project-polygons-outline"
                type="line"
                filter={['==', ['geometry-type'], 'Polygon']}
                paint={{
                  'line-color': getStatusColorExpression(),
                  'line-width': 2,
                  'line-opacity': 0.8,
                }}
                onClick={handleFeatureClick}
              />
            </MapboxSource>
          </>
        )}
      </MapboxMap>
      
      {/* UI Controls - Map Style Selector */}
      <div className="absolute top-3 right-3 z-[1000]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white shadow-md">
              <Layers className="h-4 w-4 mr-2" />
              Layers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Map Style</DropdownMenuLabel>
            {mapStyles.map(style => (
              <DropdownMenuCheckboxItem
                key={style.id}
                checked={style.checked}
                onCheckedChange={() => handleMapStyleChange(style.id)}
              >
                {style.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Layers</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showProjects}
              onCheckedChange={setShowProjects}
            >
              Projects
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search Button (placeholder for future implementation) */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <Button variant="outline" size="sm" className="bg-white shadow-md">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      
      {/* Locate Button (placeholder for future implementation) */}
      <div className="absolute bottom-3 left-24 z-[1000]">
        <Button variant="outline" size="sm" className="bg-white shadow-md">
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper function to generate test projects
function generateTestProjects(): Project[] {
  const defaultProject = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    estimatedCost: 0,
    allocatedBudget: 0,
    pseBudget: 0,
    ceBudget: 0,
    environmentalDocumentation: { leadAgency: 'Caltrans' },
    nepaStatus: 'Not Started' as const,
    ceqaStatus: 'Not Started' as const,
    environmentalDocumentType: 'None' as const,
    environmentalClearanceDate: '',
    phases: [],
    milestones: [],
    scores: {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0,
      environmental: 0,
      economic: 0,
      feasibility: 0,
      overall: 0
    },
    benefits: {
      vmtReduction: 0,
      ghgReduction: 0,
      jobsCreated: 0,
      safetyImprovement: 0,
      congestionReduction: 0,
      benefitCostRatio: 0,
      economicBenefitEstimate: 0,
      improvedAccessibility: 0
    },
    leadAgency: 'Nevada County',
    partners: [],
    fundingSources: [],
    tags: [],
    attachments: [],
    isPublic: true,
    accessControl: [],
    organizationId: 'demo-org',
    createdBy: 'demo-user',
    mapType: 'streets',
    location: 'Nevada City, CA',
    priority: 'Medium' as const
  };

  return [
    {
      ...defaultProject,
      id: '1',
      name: 'Nevada City Downtown Revitalization',
      description: 'Renovating the historic downtown area',
      status: 'Construction' as ProjectStatus,
      coordinates: { latitude: 39.2615, longitude: -121.0149 },
      category: 'Infrastructure Improvement' as ProjectCategory
    },
    {
      ...defaultProject,
      id: '2',
      name: 'Deer Creek Trail Extension',
      description: 'Extending the trail by 2 miles',
      status: 'Planning' as ProjectStatus,
      coordinates: { latitude: 39.2525, longitude: -121.0199 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-121.0299, 39.2515],
          [-121.0199, 39.2525],
          [-121.0099, 39.2545]
        ]
      } as ProjectGeometry,
      category: 'Bicycle' as ProjectCategory
    },
    {
      ...defaultProject,
      id: '3',
      name: 'Pioneer Park Improvements',
      description: 'Renovating facilities at Pioneer Park',
      status: 'Design' as ProjectStatus,
      coordinates: { latitude: 39.2715, longitude: -121.0249 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-121.0249, 39.2715],
          [-121.0229, 39.2715],
          [-121.0229, 39.2735],
          [-121.0249, 39.2735],
          [-121.0249, 39.2715]
        ]]
      } as ProjectGeometry,
      category: 'Pedestrian' as ProjectCategory
    }
  ];
}

// Helper function to extract all coordinates from a GeoJSON geometry
function getAllCoordinates(geometry: ProjectGeometry): [number, number][] {
  const coordinates: [number, number][] = [];
  
  if (!geometry) return coordinates;
  
  if (geometry.type === 'Point') {
    coordinates.push(geometry.coordinates as [number, number]);
  } 
  else if (geometry.type === 'LineString') {
    geometry.coordinates.forEach((coord: any) => {
      coordinates.push(coord as [number, number]);
    });
  }
  else if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach((coord: any) => {
      coordinates.push(coord as [number, number]);
    });
  }
  
  return coordinates;
}

// Helper function to calculate bounds from coordinates
function getBoundsFromCoordinates(coords: [number, number][]): { north: number, south: number, east: number, west: number } {
  if (!coords.length) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  
  let north = coords[0][1];
  let south = coords[0][1];
  let east = coords[0][0];
  let west = coords[0][0];
  
  coords.forEach((coord: [number, number]) => {
    north = Math.max(north, coord[1]);
    south = Math.min(south, coord[1]);
    east = Math.max(east, coord[0]);
    west = Math.min(west, coord[0]);
  });
  
  return { north, south, east, west };
} 