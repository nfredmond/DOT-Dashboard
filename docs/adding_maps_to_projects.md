# Adding Maps to Projects

This guide explains how to add interactive maps to your project pages using our Mapbox integration.

## Basic Map Integration

To add a basic project map to your page, follow these steps:

### 1. Import the MapboxProjectMappingWrapper Component

```tsx
import { MapboxProjectMappingWrapper } from '@/app/components/MapboxProjectMappingWrapper';
import { ProjectsProvider, useProjects } from '@/contexts/ProjectsContext';
```

### 2. Use the Component in Your Page

```tsx
"use client";

import { useState, useEffect } from 'react';
import { MapboxProjectMappingWrapper } from '@/app/components/MapboxProjectMappingWrapper';
import { ProjectsProvider, useProjects } from '@/contexts/ProjectsContext';

// Main content component that will have access to the ProjectsContext
function MyProjectMapContent() {
  const [selectedProject, setSelectedProject] = useState(null);
  const { projects } = useProjects();
  
  // Handle project marker click
  const handleMarkerClick = (project) => {
    setSelectedProject(project);
    // Add your custom handling logic here
  };

  return (
    <div className="h-screen relative">
      <MapboxProjectMappingWrapper 
        height="100%"
        width="100%"
        initialMapZoom={12}
        initialMapCenter={[-121.0149, 39.2615]} // Longitude, Latitude
        projects={projects}
        selectedProject={selectedProject}
        onMarkerClick={handleMarkerClick}
      />
      
      {/* Add your UI on top of the map here */}
    </div>
  );
}

// Wrapper component that provides the ProjectsContext
export default function MyProjectMapPage() {
  return (
    <ProjectsProvider>
      <MyProjectMapContent />
    </ProjectsProvider>
  );
}
```

### 3. Add Custom Controls or UI

You can add custom controls or UI layers on top of the map by adding more components inside your page:

```tsx
<div className="h-screen relative">
  <MapboxProjectMappingWrapper 
    height="100%"
    width="100%"
    initialMapZoom={12}
    initialMapCenter={[-121.0149, 39.2615]}
    projects={projects}
    selectedProject={selectedProject}
    onMarkerClick={handleMarkerClick}
  />
  
  {/* Custom control panel */}
  <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-md shadow-md">
    <h3 className="text-lg font-semibold mb-2">Map Controls</h3>
    <button
      className="px-3 py-1 bg-blue-500 text-white rounded-md mb-2 w-full"
      onClick={() => {/* Your logic */}}
    >
      Focus Area
    </button>
    <button
      className="px-3 py-1 bg-green-500 text-white rounded-md w-full"
      onClick={() => {/* Your logic */}}
    >
      Show All Projects
    </button>
  </div>
</div>
```

## Advanced Map Integration

For more advanced map integration, you can use the lower-level Mapbox components:

### Using Direct Mapbox Components

```tsx
"use client";

import { useState } from 'react';
import { MapboxProvider } from '@/contexts/mapbox-context';
import { useMapbox } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import MapboxSource from '@/components/ui/mapbox-source';
import MapboxLayer from '@/components/ui/mapbox-layer';

function MapContent() {
  const { map } = useMapbox();
  
  // Custom GeoJSON data for your map
  const myGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-121.0149, 39.2615]
        },
        properties: {
          id: '1',
          name: 'My Custom Point',
          description: 'This is a custom point on the map'
        }
      }
    ]
  };
  
  return (
    <MapboxMap
      initialViewState={{
        longitude: -121.0149,
        latitude: 39.2615,
        zoom: 12
      }}
      mapStyle={process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12'}
    >
      <MapboxSource
        id="my-data-source"
        source={{
          type: 'geojson',
          data: myGeoJSON
        }}
      >
        <MapboxLayer
          id="my-point-layer"
          type="circle"
          paint={{
            'circle-radius': 8,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }}
          onClick={(e) => {
            // Handle click events
            console.log('Clicked feature:', e.features[0]);
          }}
        />
      </MapboxSource>
    </MapboxMap>
  );
}

export default function MyAdvancedMapPage() {
  return (
    <div className="h-screen">
      <MapboxProvider>
        <MapContent />
      </MapboxProvider>
    </div>
  );
}
```

## Adding Community Input Map

To add a community input map to your page:

```tsx
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapboxCommunityInputMap = dynamic(
  () => import('@/app/components/MapboxCommunityInputMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <div className="mt-2 text-sm text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }
);

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Community Input</h1>
      
      <div className="w-full h-[700px] rounded-md overflow-hidden">
        <MapboxCommunityInputMap />
      </div>
    </div>
  );
}
```

## Handling Map Events

You can handle map events such as clicks, zooms, and movements:

```tsx
function MapWithEvents() {
  const { map } = useMapbox();
  
  useEffect(() => {
    if (!map) return;
    
    // Handle map click events
    const handleClick = (e) => {
      console.log('Map clicked at:', e.lngLat);
    };
    
    // Handle map move events
    const handleMove = (e) => {
      console.log('Map center:', map.getCenter());
    };
    
    map.on('click', handleClick);
    map.on('moveend', handleMove);
    
    // Clean up event listeners
    return () => {
      map.off('click', handleClick);
      map.off('moveend', handleMove);
    };
  }, [map]);
  
  return (
    <MapboxMap
      initialViewState={{
        longitude: -121.0149,
        latitude: 39.2615,
        zoom: 12
      }}
      mapStyle={process.env.NEXT_PUBLIC_MAPBOX_STYLE}
    />
  );
}
```

## Custom Map Controls

You can add custom controls to the map:

```tsx
function MapWithCustomControls() {
  const { map, flyTo } = useMapbox();
  
  const flyToLocation = (location) => {
    flyTo({
      lng: location.lng,
      lat: location.lat,
      zoom: 14
    });
  };
  
  return (
    <div className="relative w-full h-full">
      <MapboxMap
        initialViewState={{
          longitude: -121.0149,
          latitude: 39.2615,
          zoom: 12
        }}
        mapStyle={process.env.NEXT_PUBLIC_MAPBOX_STYLE}
      />
      
      {/* Custom location buttons */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white"
          onClick={() => flyToLocation({ lng: -121.0149, lat: 39.2615 })}
        >
          Location 1
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white"
          onClick={() => flyToLocation({ lng: -122.4194, lat: 37.7749 })}
        >
          Location 2
        </Button>
      </div>
    </div>
  );
}
```

## Working with Project Geometries

Projects can have different geometry types:

1. **Point**: Single coordinates
2. **LineString**: A series of connected points
3. **Polygon**: A closed shape

```tsx
// Example of creating a project with geometry
const projectWithPoint = {
  id: '1',
  name: 'Point Project',
  // ... other project fields
  coordinates: { latitude: 39.2615, longitude: -121.0149 }
};

const projectWithLine = {
  id: '2',
  name: 'Line Project',
  // ... other project fields
  geometry: {
    type: 'LineString',
    coordinates: [
      [-121.0299, 39.2515],
      [-121.0199, 39.2525],
      [-121.0099, 39.2545]
    ]
  }
};

const projectWithPolygon = {
  id: '3',
  name: 'Polygon Project',
  // ... other project fields
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-121.0249, 39.2715],
      [-121.0229, 39.2715],
      [-121.0229, 39.2735],
      [-121.0249, 39.2735],
      [-121.0249, 39.2715]
    ]]
  }
};
```

## Frequently Asked Questions

### How do I change the map style?

You can change the map style by setting the `mapStyle` prop:

```tsx
<MapboxMap
  mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
  // ... other props
/>
```

Common styles include:
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/satellite-streets-v12`

### How do I add a custom style from Mapbox Studio?

1. Create a custom style in [Mapbox Studio](https://studio.mapbox.com/)
2. Get the style URL (format: `mapbox://styles/username/style-id`)
3. Use it in your component:

```tsx
<MapboxMap
  mapStyle="mapbox://styles/yourusername/yourstyleid"
  // ... other props
/>
```

### How do I add markers to the map?

You can add markers as a GeoJSON source with a circle layer:

```tsx
<MapboxSource
  id="markers-source"
  source={{
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-121.0149, 39.2615]
          },
          properties: {
            title: 'Marker 1'
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-121.0249, 39.2715]
          },
          properties: {
            title: 'Marker 2'
          }
        }
      ]
    }
  }}
>
  <MapboxLayer
    id="markers-layer"
    type="circle"
    paint={{
      'circle-radius': 8,
      'circle-color': '#ff0000',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }}
  />
</MapboxSource>
```

### How do I handle large datasets?

For large datasets, use clustering:

```tsx
<MapboxSource
  id="clustered-points"
  source={{
    type: 'geojson',
    data: largeGeoJSON,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  }}
>
  <MapboxLayer
    id="clusters"
    type="circle"
    paint={{
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40
      ]
    }}
  />
  <MapboxLayer
    id="cluster-count"
    type="symbol"
    layout={{
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }}
  />
  <MapboxLayer
    id="unclustered-point"
    type="circle"
    filter={['!', ['has', 'point_count']]}
    paint={{
      'circle-color': '#11b4da',
      'circle-radius': 6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }}
  />
</MapboxSource>
```

### How do I add a heatmap?

For heatmaps, use the 'heatmap' layer type:

```tsx
<MapboxSource
  id="heatmap-source"
  source={{
    type: 'geojson',
    data: pointsGeoJSON
  }}
>
  <MapboxLayer
    id="heatmap-layer"
    type="heatmap"
    paint={{
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, 0,
        10, 1
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 1,
        9, 3
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 2,
        9, 20
      ],
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 1,
        9, 0.5
      ]
    }}
  />
</MapboxSource>
```

For more advanced mapping techniques, refer to the [Mapbox GL JS documentation](https://docs.mapbox.com/mapbox-gl-js/api/). 