# Leaflet to Mapbox Migration Guide

This document outlines the process for migrating map components from Leaflet to Mapbox GL JS in the Planning Manager application.

## Key Components

We've created several reusable components to facilitate this migration:

1. `/src/components/maps/BaseMap.tsx` - Core map component
2. `/src/components/maps/MarkerLayer.tsx` - Component for rendering markers
3. `/src/components/maps/GeoJSONLayer.tsx` - Component for rendering GeoJSON data
4. `/src/components/maps/DrawControl.tsx` - Component for drawing features

## Migration Steps

### 1. Dependencies

```json
{
  "dependencies": {
    "@mapbox/mapbox-gl-draw": "^1.5.0",
    "@mapbox/mapbox-gl-geocoder": "^5.0.3",
    "@mapbox/togeojson": "^0.16.2",
    "@turf/turf": "^6.5.0",
    "@types/mapbox-gl": "^3.4.1",
    "mapbox-gl": "^3.10.0"
  },
  "devDependencies": {
    "@types/mapbox__mapbox-gl-draw": "^1.4.8"
  }
}
```

### 2. Environment Setup

Create a `.env.local` file with the following:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 3. Import Changes

Replace Leaflet imports with Mapbox imports:

```typescript
// Before (Leaflet)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useLeaflet } from '@/hooks/useLeaflet';
import 'leaflet/dist/leaflet.css';

// After (Mapbox)
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapbox } from '@/hooks/useMapbox';
import BaseMap from '@/components/maps/BaseMap';
```

### 4. Component Replacement

#### Basic Map

```tsx
// Before (Leaflet)
<MapContainer
  center={[37.7749, -122.4194]}
  zoom={12}
  style={{ height: "100%", width: "100%" }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  />
</MapContainer>

// After (Mapbox)
<BaseMap
  initialCenter={[-122.4194, 37.7749]}
  initialZoom={12}
  className="h-full w-full"
/>
```

#### Markers

```tsx
// Before (Leaflet)
<Marker position={[37.7749, -122.4194]}>
  <Popup>
    <div>San Francisco</div>
  </Popup>
</Marker>

// After (Mapbox)
{map && (
  <MarkerLayer
    map={map}
    markers={[
      {
        id: "1",
        longitude: -122.4194,
        latitude: 37.7749,
        title: "San Francisco",
        description: "City by the Bay",
        color: "#3b82f6"
      }
    ]}
  />
)}
```

#### GeoJSON Data

```tsx
// Before (Leaflet)
<GeoJSON
  data={geoJsonData}
  style={() => ({
    color: '#ff7800',
    weight: 2,
    opacity: 0.65
  })}
/>

// After (Mapbox)
{map && (
  <GeoJSONLayer
    map={map}
    sourceId="my-data"
    layerId="my-layer"
    data={geoJsonData}
    layerType="fill"
    paint={{
      'fill-color': '#ff7800',
      'fill-opacity': 0.65,
      'fill-outline-color': '#f86c30'
    }}
  />
)}
```

#### Drawing Tools

```tsx
// Before (Leaflet)
<FeatureGroup>
  <EditControl
    position="topright"
    onCreated={handleDrawCreated}
    draw={{
      rectangle: false,
      circle: false,
      marker: true,
      polyline: true,
      polygon: true
    }}
  />
</FeatureGroup>

// After (Mapbox)
{map && (
  <DrawControl
    map={map}
    onChange={handleDrawChange}
    controls={{
      point: true,
      line_string: true,
      polygon: true,
      trash: true
    }}
  />
)}
```

### 5. Event Handling

#### Map Click Events

```typescript
// Before (Leaflet)
const MapClickHandler = () => {
  useMapEvents({
    click: (e) => {
      console.log(`Clicked at ${e.latlng.lat}, ${e.latlng.lng}`);
    }
  });
  return null;
};

// After (Mapbox)
map.on('click', (e) => {
  console.log(`Clicked at ${e.lngLat.lat}, ${e.lngLat.lng}`);
});
```

#### Feature Click Events

```typescript
// Before (Leaflet)
<GeoJSON
  data={data}
  onEachFeature={(feature, layer) => {
    layer.on({
      click: (e) => {
        console.log('Feature clicked', feature.properties);
      }
    });
  }}
/>

// After (Mapbox)
<GeoJSONLayer
  map={map}
  sourceId="features"
  layerId="features-layer"
  data={data}
  layerType="fill"
  onFeatureClick={(e) => {
    console.log('Feature clicked', e.features[0].properties);
  }}
/>
```

### 6. Cleanup and Disposal

```typescript
// Before (Leaflet)
// Cleanup happens automatically with react-leaflet

// After (Mapbox)
useEffect(() => {
  // Initialize map...
  
  return () => {
    // Clean up map instance
    if (map.current) {
      map.current.remove();
    }
  };
}, []);
```

## Common Gotchas

1. **Coordinate Order**: Leaflet uses [lat, lng] while Mapbox uses [lng, lat]
2. **Styling**: Leaflet uses simple JS objects, Mapbox uses paint/layout properties
3. **Popups**: In Leaflet, popups are child components; in Mapbox, they're created programmatically
4. **Events**: Leaflet uses a more React-like event system; Mapbox uses direct listeners
5. **Zoom Levels**: Mapbox has different default zoom levels than Leaflet

## Best Practices

1. Always clean up map resources in your useEffect return function
2. Use the provided utility components for consistency
3. Consider performance - use clustering for large datasets
4. For drawing features, remember to clean up the draw control when finished
5. Test on mobile devices - Mapbox has better touch support than Leaflet
6. Use the map utility functions in `/src/lib/map-utils.ts` for common operations

## Advanced Features

Mapbox supports several advanced features not easily available in Leaflet:

1. 3D terrain and buildings
2. Custom layer styling with expressions
3. Advanced animations and transitions
4. Vector tiles for improved performance
5. Data-driven styling

See examples in the updated components for usage of these features.

## Testing

After migration, verify:

1. Maps render correctly
2. Markers and popups work
3. GeoJSON rendering is accurate
4. Drawing tools function properly
5. Events are handled correctly
6. Performance is acceptable 