"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';
import { MAP_STYLES, initMapboxToken } from '@/lib/map-utils';

import BaseMap from '@/components/maps/BaseMap';
import MarkerLayer, { MarkerData } from '@/components/maps/MarkerLayer';
import GeoJSONLayer from '@/components/maps/GeoJSONLayer';

// Initialize Mapbox token
initMapboxToken();

// Define the possible base maps to select from
export const MAPBOX_BASE_MAPS = [
  {
    name: 'Streets',
    style: MAP_STYLES.STREETS,
    checked: true,
  },
  {
    name: 'Outdoors',
    style: MAP_STYLES.OUTDOORS,
    checked: false,
  },
  {
    name: 'Light',
    style: MAP_STYLES.LIGHT,
    checked: false,
  },
  {
    name: 'Dark',
    style: MAP_STYLES.DARK,
    checked: false,
  },
  {
    name: 'Satellite',
    style: MAP_STYLES.SATELLITE,
    checked: false,
  },
  {
    name: 'Satellite Streets',
    style: MAP_STYLES.SATELLITE_STREETS,
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
  testingMode?: boolean;
  mapStyle?: string;
}

export function MapboxProjectMapping({
  projects = [],
  initialCenter = [-121.0149, 39.2615], // Nevada City, CA (note: Mapbox uses [lng, lat])
  initialZoom = 13,
  height = '100%',
  width = '100%',
  className = '',
  selectedProject = null,
  onMarkerClick,
  testingMode = true,
  mapStyle = MAP_STYLES.STREETS,
}: ProjectMappingProps) {
  // References and state
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [_mapLoaded, setMapLoaded] = useState(false);
  
  // Marker and GeoJSON data
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: []
  });
  
  // Add test projects for Nevada City when in testing mode
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
  
  // Convert projects to markers and GeoJSON features
  useEffect(() => {
    // Create markers for projects without geometry
    const projectMarkers: MarkerData[] = localProjects
      .filter(project => !project.geometry)
      .map(project => ({
        id: project.id,
        longitude: project.longitude,
        latitude: project.latitude,
        title: project.name,
        description: project.description || '',
        color: getStatusColor(project.status),
        type: project.category || 'default',
        properties: {
          status: project.status,
          address: project.address,
          budget: project.budget,
          category: project.category
        }
      }));
    
    setMarkers(projectMarkers);
    
    // Create GeoJSON for projects with geometry
    const features: GeoJSON.Feature[] = localProjects
      .filter(project => project.geometry)
      .map(project => {
        const color = getStatusColor(project.status);
        
        return {
          type: 'Feature',
          geometry: project.geometry as GeoJSON.Geometry,
          properties: {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            address: project.address,
            category: project.category,
            budget: project.budget,
            color
          }
        };
      });
    
    setGeoJsonData({
      type: 'FeatureCollection',
      features
    });
  }, [localProjects]);
  
  // Zoom to selected project when it changes
  useEffect(() => {
    if (selectedProject && mapRef.current) {
      const map = mapRef.current;
      
      if (selectedProject.geometry) {
        // Create GeoJSON feature for fitting bounds
        const _geoJsonFeature = {
          type: 'Feature',
          properties: {},
          geometry: selectedProject.geometry
        };
        
        try {
          // Create bounds from the feature
          const bounds = new mapboxgl.LngLatBounds();
          
          if (selectedProject.geometry.type === 'Point') {
            const coords = selectedProject.geometry.coordinates as [number, number];
            bounds.extend(coords);
          } else if (selectedProject.geometry.type === 'LineString') {
            const coords = selectedProject.geometry.coordinates as [number, number][];
            coords.forEach(coord => bounds.extend(coord));
          } else if (selectedProject.geometry.type === 'Polygon') {
            const coords = selectedProject.geometry.coordinates[0] as [number, number][];
            coords.forEach(coord => bounds.extend(coord));
          }
          
          // Fit bounds with padding
          map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 16
          });
        } catch (error) {
          console.error('Error calculating bounds:', error);
          // Fallback to simple flyTo if error occurs
          map.flyTo({
            center: [selectedProject.longitude, selectedProject.latitude],
            zoom: 14
          });
        }
      } else {
        // For projects without geometry, fly to location
        map.flyTo({
          center: [selectedProject.longitude, selectedProject.latitude],
          zoom: 14,
          essential: true,
          duration: 1000
        });
      }
    }
  }, [selectedProject]);
  
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4caf50'; // Green
      case 'in progress':
        return '#2196f3'; // Blue
      case 'planning':
        return '#ff9800'; // Orange
      case 'completed':
        return '#9c27b0'; // Purple
      case 'rejected':
        return '#f44336'; // Red
      default:
        return '#3388ff'; // Default blue
    }
  };
  
  // Create HTML for popups
  const createPopupContent = (project: Project | MarkerData): string => {
    // Handle both Project and MarkerData types
    const name = 'title' in project ? project.title : (project as Project).name;
    const description = project.description || '';
    const status = 'properties' in project && project.properties?.status 
      ? project.properties.status 
      : 'status' in project ? project.status : '';
    const address = 'properties' in project && project.properties?.address 
      ? project.properties.address 
      : 'address' in project ? project.address : '';
    const budget = 'properties' in project && project.properties?.budget 
      ? project.properties.budget 
      : 'budget' in project ? project.budget : '';
    
    const statusClass = 
      status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
      status.toLowerCase() === 'in progress' ? 'bg-blue-100 text-blue-800' :
      'bg-yellow-100 text-yellow-800';
    
    return `
      <div class="popup-content">
        <h3 class="font-bold text-base border-b pb-2 mb-2">${name}</h3>
        ${address ? `<p class="text-sm mb-1">${address}</p>` : ''}
        <p class="text-sm mb-2">
          <span class="font-medium">Status:</span> 
          <span class="ml-1 px-2 py-0.5 rounded-full text-xs ${statusClass}">
            ${status}
          </span>
        </p>
        ${description ? `<p class="text-sm mt-1 text-gray-600">${description}</p>` : ''}
        ${budget ? `<p class="text-sm mt-2 font-semibold">${budget}</p>` : ''}
      </div>
    `;
  };
  
  // Handle marker click
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    if (!onMarkerClick) return;
    
    // Find the corresponding project
    const project = localProjects.find(p => p.id === marker.id);
    if (project) {
      onMarkerClick(project);
    }
  }, [localProjects, onMarkerClick]);
  
  // Handle GeoJSON feature click
  const handleFeatureClick = (e: mapboxgl.MapLayerMouseEvent) => {
    if (!onMarkerClick || !e.features || e.features.length === 0) return;
    
    const feature = e.features[0];
    const properties = feature.properties;
    if (!properties) return;
    
    // Find the corresponding project
    const project = localProjects.find(p => p.id === properties.id);
    if (project) {
      onMarkerClick(project);
    }
  };
  
  // Handle map load
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
    
    // Add click handler for project features
    map.on('click', 'project-features', handleFeatureClick);
    
    // Change cursor when hovering over features
    map.on('mouseenter', 'project-features', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'project-features', () => {
      map.getCanvas().style.cursor = '';
    });
  };
  
  return (
    <div 
      className={cn("relative", className)} 
      style={{ height, width }}
      data-testid="mapbox-project-mapping"
    >
      <BaseMap
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        style={mapStyle}
        onMapLoad={handleMapLoad}
        className="h-full w-full"
      >
        {/* Project markers for points */}
        {mapRef.current && markers.length > 0 && (
          <MarkerLayer
            map={mapRef.current}
            markers={markers}
            usePopup={true}
            customPopup={(marker) => createPopupContent(marker)}
            onClick={handleMarkerClick}
          />
        )}
        
        {/* Project GeoJSON for lines and polygons */}
        {mapRef.current && geoJsonData.features.length > 0 && (
          <GeoJSONLayer
            map={mapRef.current}
            sourceId="project-features-source"
            layerId="project-features"
            data={geoJsonData}
            layerType="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.8
            }}
            onFeatureClick={handleFeatureClick}
          />
        )}
        
        {/* Project GeoJSON for polygon fills */}
        {mapRef.current && geoJsonData.features.filter(f => f.geometry.type === 'Polygon').length > 0 && (
          <GeoJSONLayer
            map={mapRef.current}
            sourceId="project-polygons-source"
            layerId="project-polygons"
            data={{
              type: 'FeatureCollection',
              features: geoJsonData.features.filter(f => f.geometry.type === 'Polygon')
            }}
            layerType="fill"
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.3
            }}
          />
        )}
      </BaseMap>
    </div>
  );
} 