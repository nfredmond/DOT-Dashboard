# Leaflet.js Integration for Planning Manager App

This document provides an overview of how Leaflet.js has been integrated into the Planning Manager transportation planning application, along with its add-ons and custom components.

## Overview

[Leaflet](https://leafletjs.com/) is a lightweight open-source JavaScript library for interactive maps. In this project, Leaflet is used for:
- Displaying transportation project locations and impact areas
- Enabling community feedback on map locations
- Drawing shapes and annotations for planning purposes
- Creating interactive visualizations of project data
- Supporting geospatial analysis for transportation planning

## Implementation Details

### Core Components

1. **ProjectMap** (`src/app/project-map/page.tsx`)
   - Main map component for viewing and managing transportation projects
   - Includes filtering by project types and visualization controls
   - Supports drawing tools for planning and annotation
   - Uses Next.js 14 App Router architecture

2. **CommunityMapping** (`src/app/(components)/community-mapping.tsx`)
   - Enables community feedback on transportation projects
   - Allows users to add comments, suggestions, and concerns at specific locations
   - Provides drawing and annotation tools for detailed feedback
   - Supports both anonymous and authenticated feedback

3. **EditControl** (`src/app/project-map/components/EditControl.tsx`)
   - Custom React wrapper for Leaflet.Draw functionality
   - Enables drawing polygons, lines, markers, and other shapes on maps
   - Handles creation, editing, and deletion events
   - Compatible with React 18 and Next.js 14

4. **ProjectLayerControl** (`src/components/maps/ProjectLayerControl.tsx`)
   - Manages different map layers for project visualization
   - Allows toggling between different base maps and overlay layers
   - Supports filtering projects by type, status, and other attributes

### Add-ons and Extensions

The following Leaflet add-ons have been integrated into the application:

1. **Leaflet.Draw**
   - Provides drawing tools for creating shapes and annotations on maps
   - Used for both professional planning and community feedback
   - Customized with transportation-specific tools and styles

2. **react-leaflet-cluster**
   - Clusters markers that are close to each other
   - Improves map readability when many projects or feedback points are shown
   - Customized clustering thresholds for different zoom levels

3. **leaflet-defaulticon-compatibility**
   - Fixes issues with marker icons in various environments
   - Ensures consistent icon display across browsers and devices
   - Critical for Next.js integration to handle asset paths correctly

4. **react-leaflet-heatmap-layer**
   - Visualizes density of projects or community feedback
   - Supports weighted heat maps based on project priorities or funding

### Next.js 14 Integration

The Planning Manager app uses Next.js 14 with the App Router architecture. Leaflet integration requires special handling since Leaflet relies on browser APIs that aren't available during server-side rendering:

1. **Client Components**
   - All Leaflet components use the `'use client'` directive
   - Map components are isolated in client-side boundaries
   - Example implementation pattern:
     ```tsx
     // src/components/maps/MapContainer.tsx
     'use client';
     
     import { useEffect, useState } from 'react';
     import { MapContainer, TileLayer } from 'react-leaflet';
     import 'leaflet/dist/leaflet.css';
     
     export default function Map({ children }) {
       const [isMounted, setIsMounted] = useState(false);
       
       useEffect(() => {
         setIsMounted(true);
       }, []);
       
       if (!isMounted) return <div>Loading map...</div>;
       
       return (
         <MapContainer center={[37.7749, -122.4194]} zoom={10}>
           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
           {children}
         </MapContainer>
       );
     }
     ```

2. **Dynamic Imports**
   - Leaflet components are dynamically imported to avoid SSR issues
   - Example:
     ```tsx
     import dynamic from 'next/dynamic';
     
     const DynamicMap = dynamic(
       () => import('@/components/maps/MapContainer'),
       { ssr: false }
     );
     ```

### TypeScript Integration

TypeScript declarations have been added in several files:
1. `src/global.d.ts`: Global declarations for Leaflet objects and CSS modules
2. `src/types/react-leaflet.d.ts`: Type definitions for react-leaflet components
3. `src/app/project-map/components/index.d.ts`: Type definitions for custom components

## Usage Examples

### Basic Map Implementation

```tsx
'use client';
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

export default function MapPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return <div>Loading map...</div>;
  
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={10}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  );
}
```

### Interactive Drawing Tools

```tsx
'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from '@/components/maps/EditControl';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

export default function DrawingMapPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleDrawCreated = (e) => {
    const { layer } = e;
    // Access the drawn shape via layer.toGeoJSON()
    console.log('Shape created:', layer.toGeoJSON());
  };
  
  if (!isMounted) return <div>Loading map...</div>;
  
  return (
    <MapContainer center={[37.7749, -122.4194]} zoom={10}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FeatureGroup>
        <EditControl
          position="topleft"
          onCreated={handleDrawCreated}
          draw={{
            rectangle: true,
            polyline: true,
            polygon: true,
            circle: true,
            marker: true
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
```

### Marker Clustering Implementation

```tsx
'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export default function ProjectMapPage({ projects }) {
  return (
    <MapContainer center={[37.7749, -122.4194]} zoom={10}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup chunkedLoading>
        {projects.map((project) => (
          <Marker 
            key={project.id} 
            position={[project.latitude, project.longitude]}
            icon={getProjectTypeIcon(project.type)}
          >
            <Popup>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <p>Status: {project.status}</p>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

## Styling

Custom styles for Leaflet components are defined in `src/app/globals.css` and component-specific CSS modules. These styles include:
- Custom marker icons for different project types
- Styles for feedback markers and clusters
- Drawing tool customizations
- Popup and tooltip enhancements
- Dark mode support for maps

## Best Practices

1. **Performance Optimization**
   - Use marker clustering for large datasets
   - Implement virtualization for projects outside the viewport
   - Lazy load GeoJSON data when needed

2. **Accessibility Considerations**
   - Provide keyboard navigation for map interactions
   - Include alternative text for map elements
   - Ensure sufficient color contrast for map elements

3. **Mobile Responsiveness**
   - Use responsive container sizes for maps
   - Adjust control positions based on screen size
   - Optimize touch interactions for drawing tools

4. **Data Management**
   - Cache GeoJSON data for frequently accessed projects
   - Use debouncing for map interactions that trigger data fetching
   - Implement pagination for fetching large datasets

## Known Issues and Workarounds

1. **Server-Side Rendering**: Leaflet requires access to the browser's `window` object, which is not available during server-side rendering. We use Next.js dynamic imports with `{ ssr: false }` to avoid these issues.

2. **TypeScript Integration**: Some Leaflet add-ons don't have proper TypeScript definitions. We've added custom type declarations and used `@ts-expect-error` comments where necessary.

3. **Icon Path Issues**: Leaflet has known issues with marker icon paths. We use `leaflet-defaulticon-compatibility` to resolve these problems.

For more detailed troubleshooting information, see the [LEAFLET_TROUBLESHOOTING.md](./LEAFLET_TROUBLESHOOTING.md) document.

## Future Enhancements

Planned improvements for the mapping components include:
1. Adding 3D visualization for project elevation data
2. Implementing timeline sliders for temporal data
3. Enhancing offline support with map caching
4. Adding more advanced GIS analysis tools
5. Integrating with external mapping services (Google Maps, Mapbox, etc.)
6. Supporting real-time project updates on maps

## Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React Leaflet](https://react-leaflet.js.org/)
- [Leaflet.Draw Plugin](https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html)
- [Leaflet Marker Cluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [TypeScript and Leaflet](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/leaflet)

