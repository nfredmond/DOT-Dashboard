# GIS Features Documentation

This document outlines the Geographic Information System (GIS) features implemented in the Planning Manager application using Mapbox GL JS.js and related technologies.

## Overview

The Planning Manager uses Mapbox GL JS.js as its primary mapping library, chosen for its lightweight performance, extensive plugin ecosystem, and ease of customization. The application integrates Mapbox GL JS maps seamlessly into the Next.js frontend through React-Mapbox GL JS.

## Core Features

### Base Mapping Functionality

1. **Map Controls**
   - Pan/zoom functionality with smooth transitions
   - Scale bar with metric/imperial toggle
   - Layer controls with custom grouping
   - Mini map overview for context
   - Full-screen toggle with keyboard shortcuts

2. **Basemap Options**
   - OpenStreetMap standard
   - Carto Positron (light mode)
   - Carto Dark Matter (dark mode)
   - ESRI World Imagery satellite
   - USGS Topographic maps
   - Custom agency tiles with proxy support
   - ArcGIS service integration

3. **Project Visualization**
   - Point markers with custom icons
   - Polylines for routes with styling options
   - Polygons for project areas with transparency
   - GeoJSON data rendering with custom styling
   - Popup information windows with rich content
   - Tooltips for quick information display

## Advanced Features

### Community Input Tools

1. **Drawing Tools**

   ```typescript
   // src/components/map/DrawingToolbar.tsx
   const drawOptions = {
     position: 'topleft',
     draw: {
       polygon: {
         allowIntersection: false,
         drawError: {
           color: '#e1e100',
           message: 'Self-intersecting polygons not allowed'
         },
         shapeOptions: {
           color: '#3388ff',
           weight: 3,
           opacity: 0.8,
           fillOpacity: 0.3
         }
       },
       polyline: {
         shapeOptions: {
           color: '#3388ff',
           weight: 4,
           opacity: 0.8
         }
       },
       circle: false,
       rectangle: {
         shapeOptions: {
           color: '#3388ff',
           weight: 3,
           opacity: 0.8,
           fillOpacity: 0.3
         }
       },
       marker: {
         icon: new L.Icon.Default()
       },
       circlemarker: false
     },
     edit: {
       featureGroup: editableLayers,
       remove: true,
       edit: true
     }
   };
   ```

2. **Annotation Tools**
   - Text labels with custom formatting
   - Custom markers with categorization
   - Comment attachments linked to locations
   - Image uploads with geo-tagging
   - Voice note attachments for accessibility

3. **Feedback Collection**
   - Location-based comments with categorization
   - Issue reporting with severity levels
   - Survey integration with Form.io
   - Voting/rating mechanisms for proposals
   - Timeline-based feedback tracking

### Data Visualization

1. **Clustering**

   ```typescript
   // src/components/map/ClusterLayer.tsx
   const markerClusterOptions = {
     chunkedLoading: true,
     spiderfyOnMaxZoom: true,
     showCoverageOnHover: true,
     zoomToBoundsOnClick: true,
     maxClusterRadius: 50,
     disableClusteringAtZoom: 18,
     polygonOptions: {
       fillColor: '#3388ff',
       color: '#3388ff',
       weight: 2,
       opacity: 0.5,
       fillOpacity: 0.2
     },
     iconCreateFunction: (cluster) => {
       const count = cluster.getChildCount();
       let className = 'marker-cluster-';
       
       if (count < 10) className += 'small';
       else if (count < 100) className += 'medium';
       else className += 'large';
       
       return new L.DivIcon({
         html: `<div><span>${count}</span></div>`,
         className: `marker-cluster ${className}`,
         iconSize: new L.Point(40, 40)
       });
     }
   };
   ```

2. **Heatmaps**
   - Density visualization based on project concentration
   - Weighted data points based on project criteria
   - Custom color gradients for different metrics
   - Dynamic updating as data changes
   - Configurable radius and blur settings

3. **Thematic Mapping**
   - Choropleth maps for regional data
   - Graduated symbols based on project values
   - Custom styling rules with legend generation
   - Data-driven styling with attribute mapping
   - Time-based styling for temporal data

### Analysis Tools

1. **Measurement Tools**
   - Distance measurement with multiple segments
   - Area calculation for polygons
   - Bearing and heading calculation
   - Coordinate display with format options
   - Elevation profile generation (where data available)

2. **Spatial Analysis**
   - Buffer generation around points/lines/polygons
   - Intersection detection between project areas
   - Proximity analysis for nearby features
   - Simple routing capabilities with turn-by-turn directions
   - Network analysis for connectivity assessment

3. **Data Filtering**
   - Spatial queries with geometric operations
   - Attribute filtering with complex expressions
   - Time-based filtering with timeline controls
   - Combined filters with multiple conditions
   - Save/load filter presets for common queries

## Integration Features

### External Data Sources

1. **Real-time Data**

   ```typescript
   // src/lib/map/realtime-layer.ts
   export const createRealtimeLayer = (options: RealtimeOptions) => {
     const { url, interval, attributionText } = options;
     
     return L.realtime({
       url,
       interval: interval * 1000,
       getFeatureId: (f) => f.properties.id,
       cache: true,
       removeMissing: true,
       updateFeature: (feature, oldLayer) => {
         return {
           type: 'Feature',
           properties: { ...feature.properties, updated: new Date().toISOString() },
           geometry: feature.geometry
         };
       }
     }, {
       style: (feature) => {
         return {
           color: getStatusColor(feature.properties.status),
           weight: 3,
           opacity: 0.8
         };
       },
       pointToLayer: (feature, latlng) => {
         return L.marker(latlng, {
           icon: getCustomIcon(feature.properties.type)
         });
       },
       onEachFeature: (feature, layer) => {
         layer.bindPopup(createPopupContent(feature));
       },
       attribution: attributionText
     });
   };
   ```

2. **API Connections**
   - Caltrans PeMS data for traffic information
   - NOAA weather service integration
   - Census API for demographic data
   - EPA environmental data services
   - GTFS transit data integration

3. **File Import/Export**
   - GeoJSON import/export with validation
   - Shapefile import via shp.js
   - KML/KMZ support with styling preservation
   - CSV import with coordinate parsing
   - Export to multiple formats (GeoJSON, KML, CSV)

### Time-based Features

1. **Timeline Controls**
   - Time slider with play/pause functionality
   - Custom date range selection
   - Historical data playback with animation
   - Future projection visualization
   - Time-based filtering of features

2. **Temporal Analysis**
   - Change detection between time periods
   - Trend analysis for project development
   - Pattern recognition in temporal data
   - Time-series visualization with charts
   - Before/after comparison tools

## Mobile and Accessibility Features

### Mobile Optimization

1. **Touch Interactions**
   - Touch-friendly controls with larger hit areas
   - Gesture support (pinch zoom, two-finger pan)
   - Mobile-specific UI adjustments
   - Reduced data mode for limited connections
   - Offline capabilities with local storage

2. **Responsive Design**

   ```typescript
   // src/components/map/ResponsiveMap.tsx
   const ResponsiveMap = ({ children, ...props }) => {
     const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
     const mapContainer = useRef(null);
     
     useEffect(() => {
       if (!mapContainer.current) return;
       
       const updateDimensions = () => {
         if (mapContainer.current) {
           const { width, height } = mapContainer.current.getBoundingClientRect();
           setDimensions({ width, height });
           
           // Adjust controls based on screen size
           if (width < 768) {
             // Mobile layout
             setMobileControls(true);
           } else {
             // Desktop layout
             setMobileControls(false);
           }
         }
       };
       
       updateDimensions();
       window.addEventListener('resize', updateDimensions);
       
       return () => {
         window.removeEventListener('resize', updateDimensions);
       };
     }, []);
     
     return (
       <div 
         ref={mapContainer} 
         className="w-full h-full min-h-[350px]"
       >
         {dimensions.width > 0 && (
           <MapContainer
             {...props}
             style={{ width: '100%', height: '100%' }}
           >
             {children}
           </MapContainer>
         )}
       </div>
     );
   };
   ```

### Accessibility Features

1. **Screen Reader Support**
   - ARIA attributes for map elements
   - Keyboard navigation for map interactions
   - Alternative text for map features
   - Focus management for interactive elements
   - Screen reader announcements for map changes

2. **Color and Contrast**
   - High contrast mode option
   - Color blind friendly palettes
   - Configurable symbol sizes
   - Text alternatives for visual elements
   - Zoom level adjustments for readability

## Performance Optimization

### Data Management

1. **Loading Strategies**

   ```typescript
   // src/lib/map/lazy-loading.ts
   export const createLazyLoader = (options: LazyLoaderOptions) => {
     const { fetchFn, attachPopup, minZoom } = options;
     let currentLayer = null;
     
     return {
       addTo: (map: L.Map) => {
         map.on('moveend', async () => {
           const zoom = map.getZoom();
           const bounds = map.getBounds();
           
           // Only load detailed data at appropriate zoom levels
           if (zoom >= minZoom) {
             if (currentLayer) {
               map.removeLayer(currentLayer);
             }
             
             try {
               const features = await fetchFn(bounds, zoom);
               currentLayer = L.geoJSON(features, {
                 onEachFeature: attachPopup,
                 pointToLayer: (feature, latlng) => {
                   return L.marker(latlng, {
                     icon: getFeatureIcon(feature.properties)
                   });
                 }
               }).addTo(map);
             } catch (error) {
               console.error('Error loading map data:', error);
             }
           }
         });
       },
       remove: (map: L.Map) => {
         map.off('moveend');
         if (currentLayer) {
           map.removeLayer(currentLayer);
         }
       }
     };
   };
   ```

2. **Caching**
   - Tile caching for basemaps
   - Vector feature caching in IndexedDB
   - Metadata caching for attributes
   - Intelligent cache invalidation
   - Progressive loading with placeholders

3. **Rendering Optimization**
   - Feature simplification at low zoom levels
   - Canvas rendering for large datasets
   - Adaptive clustering thresholds
   - Viewport culling for off-screen features
   - WebGL acceleration for dense point clouds

## User Experience Enhancements

### Advanced Controls

1. **Custom Navigation**
   - Customizable zoom controls
   - Map reset button
   - Geolocation with tracking option
   - Compass indicator for orientation
   - Bookmarkable map states

2. **Selection Tools**
   - Box selection for multiple features
   - Lasso selection for irregular areas
   - Radius selection around points
   - Selection persistence across sessions
   - Bulk operations on selected features

3. **Visual Aids**
   - Grid overlay with coordinates
   - Scale indicators for distance reference
   - North arrow for orientation
   - Minimap for context
   - Custom overlays for specialized information

## Implementation Examples

### Basic Map Setup

```typescript
// src/components/map/BaseMap.tsx
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, ZoomControl, ScaleControl } from 'react-Mapbox GL JS';
import 'Mapbox GL JS/dist/Mapbox GL JS.css';

const { BaseLayer } = LayersControl;

const BaseMap = ({ children, center = [37.7749, -122.4194], zoom = 12 }) => {
  const [mapReady, setMapReady] = useState(false);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      whenReady={() => setMapReady(true)}
    >
      <ZoomControl position="topright" />
      <ScaleControl position="bottomleft" imperial={false} />
      
      <LayersControl position="topright">
        <BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>
        <BaseLayer name="Carto Light">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </BaseLayer>
        <BaseLayer name="Carto Dark">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>
        <BaseLayer name="Topographic">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>
      </LayersControl>
      
      {mapReady && children}
    </MapContainer>
  );
};

export default BaseMap;
```

### Project Layer Implementation

```typescript
// src/components/map/ProjectLayer.tsx
import { useEffect } from 'react';
import { useMap } from 'react-Mapbox GL JS';
import L from 'Mapbox GL JS';
import MarkerClusterGroup from 'react-Mapbox GL JS-cluster';
import { getProjectIcon } from '@/lib/map/icons';
import { createProjectPopup } from '@/lib/map/popups';

interface ProjectLayerProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  selectedId?: string;
}

const ProjectLayer = ({ projects, onProjectSelect, selectedId }: ProjectLayerProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !projects?.length) return;
    
    // Create a reference to store the selected marker
    let selectedMarker: L.Marker | null = null;
    
    // Create GeoJSON from projects
    const projectFeatures = projects.map(project => ({
      type: 'Feature',
      properties: {
        ...project,
        id: project.id
      },
      geometry: {
        type: 'Point',
        coordinates: [project.longitude, project.latitude]
      }
    }));
    
    // Create the GeoJSON layer
    const projectsLayer = L.geoJSON({ type: 'FeatureCollection', features: projectFeatures }, {
      pointToLayer: (feature, latlng) => {
        const isSelected = feature.properties.id === selectedId;
        const icon = getProjectIcon(feature.properties, isSelected);
        
        const marker = L.marker(latlng, { icon });
        
        // Store reference to selected marker
        if (isSelected) {
          selectedMarker = marker;
          // Pan to selected marker
          map.panTo(latlng);
        }
        
        return marker;
      },
      onEachFeature: (feature, layer) => {
        // Create popup
        layer.bindPopup(() => createProjectPopup(feature.properties));
        
        // Add click handler
        layer.on('click', () => {
          onProjectSelect(feature.properties);
        });
      }
    });
    
    // Add to map
    projectsLayer.addTo(map);
    
    // Cleanup
    return () => {
      map.removeLayer(projectsLayer);
    };
  }, [map, projects, selectedId, onProjectSelect]);
  
  return null;
};

export default ProjectLayer;
```

### Draw Tool Implementation

```typescript
// src/components/map/DrawToolbar.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-Mapbox GL JS';
import L from 'Mapbox GL JS';
import 'Mapbox GL JS-draw';
import 'Mapbox GL JS-draw/dist/Mapbox GL JS.draw.css';

interface DrawToolbarProps {
  onGeometryCreated?: (geojson: GeoJSON.GeoJSON) => void;
  onGeometryEdited?: (geojson: GeoJSON.GeoJSON) => void;
  onGeometryDeleted?: () => void;
  initialGeometry?: GeoJSON.GeoJSON;
}

const DrawToolbar = ({ 
  onGeometryCreated, 
  onGeometryEdited, 
  onGeometryDeleted,
  initialGeometry 
}: DrawToolbarProps) => {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Initialize the FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;
    
    // Add initial geometry if provided
    if (initialGeometry) {
      const layer = L.geoJSON(initialGeometry);
      layer.eachLayer(l => {
        drawnItems.addLayer(l);
      });
      
      // Fit map to initial geometry
      map.fitBounds(drawnItems.getBounds(), { padding: [50, 50] });
    }
    
    // Configure the draw control
    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polyline: {
          shapeOptions: {
            color: '#3388ff',
            weight: 4,
            opacity: 0.7
          }
        },
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3388ff',
            weight: 3,
            opacity: 0.7,
            fillOpacity: 0.2
          }
        },
        circle: false,
        rectangle: {
          shapeOptions: {
            color: '#3388ff',
            weight: 3,
            opacity: 0.7,
            fillOpacity: 0.2
          }
        },
        marker: true,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    
    map.addControl(drawControl);
    drawControlRef.current = drawControl;
    
    // Event Handlers
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      // Convert to GeoJSON and call handler
      if (onGeometryCreated) {
        const geojson = drawnItems.toGeoJSON();
        onGeometryCreated(geojson);
      }
    });
    
    map.on(L.Draw.Event.EDITED, (e: any) => {
      if (onGeometryEdited) {
        const geojson = drawnItems.toGeoJSON();
        onGeometryEdited(geojson);
      }
    });
    
    map.on(L.Draw.Event.DELETED, (e: any) => {
      if (onGeometryDeleted) {
        onGeometryDeleted();
      }
    });
    
    // Cleanup
    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, initialGeometry, onGeometryCreated, onGeometryEdited, onGeometryDeleted]);
  
  return null;
};

export default DrawToolbar;
```

## Integration with Next.js App Router

The map components are fully integrated with Next.js 14 App Router, with special considerations for server components, client components, and hydration:

```typescript
// src/app/project-map/page.tsx
'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useProjects } from '@/hooks/useProjects';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectFilterPanel from '@/components/projects/ProjectFilterPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Dynamically import the map component with no SSR
// This prevents hydration issues with Mapbox GL JS
const ProjectMapComponent = dynamic(
  () => import('@/components/map/ProjectMapComponent'),
  { ssr: false }
);

export default function ProjectMapPage() {
  const { projects, isLoading, error } = useProjects();
  const [filteredProjects, setFilteredProjects] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');
  
  // Handle filter changes
  const handleFilterChange = (filtered) => {
    setFilteredProjects(filtered);
  };
  
  // Handle project selection
  const handleProjectSelect = (project) => {
    router.push(`/project-map?id=${project.id}`);
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading projects: {error.message}</div>;
  
  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/4 p-4 overflow-auto border-r">
        <ProjectFilterPanel 
          projects={projects} 
          onFilterChange={handleFilterChange} 
        />
      </div>
      <div className="w-full md:w-3/4 h-full">
        <ProjectMapComponent 
          projects={filteredProjects}
          selectedId={selectedId}
          onProjectSelect={handleProjectSelect}
        />
      </div>
    </div>
  );
}
```

## Best Practices for GIS Implementation

1. **Performance Considerations**
   - Use clustering for datasets with >100 points
   - Implement lazy loading for large datasets
   - Optimize vector geometries for web display
   - Use appropriate max zoom levels for each layer
   - Consider WebGL rendering for very large datasets

2. **Mobile Optimization**
   - Simplify UI controls on small screens
   - Provide touch-friendly interaction targets
   - Implement responsive legends and information panels
   - Optimize tile loading for mobile networks
   - Test thoroughly on various mobile devices

3. **Accessibility**
   - Provide keyboard navigation alternatives
   - Include ARIA labels for map elements
   - Ensure sufficient color contrast
   - Provide text alternatives to visual information
   - Support screen readers for important map features

4. **Data Management**
   - Implement proper error handling for data loading
   - Cache geographic data appropriately
   - Use progressive loading for large datasets
   - Consider data sharing limitations across users
   - Implement proper validation for user-submitted geometries
