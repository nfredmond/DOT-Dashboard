# Mapbox Integration in Planning Manager

This document provides an overview of the Mapbox integration in the Planning Manager application and instructions for developers and administrators.

## Overview

Planning Manager uses Mapbox GL JS for all mapping functionality, providing high-performance, customizable maps with 3D terrain, custom styling, and interactive features. The application supports user-specific map preferences and configurations.

## Key Features

- **Interactive maps** with support for markers, GeoJSON layers, and drawing tools
- **User-specific preferences** for map style, default location, and 3D settings
- **Admin configuration panel** for managing map providers and user settings
- **Component-based architecture** with reusable map components
- **3D terrain support** for enhanced visualization
- **Custom styling** with multiple built-in themes and custom styles

## Getting Started

### Prerequisites

- Mapbox access token (set in `.env.local`)
- Node.js and npm/yarn 

### Setting Up Your Mapbox Token

1. Create a `.env.local` file in the root directory if it doesn't exist
2. Add your Mapbox token:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Python Integration for Data Processing

Planning Manager includes Python-based data processing capabilities for advanced geospatial analysis, machine learning, and optimization tasks.

### Prerequisites

- Python 3.8 or higher
- [Optional] CUDA-capable GPU for accelerated processing

### Installation

1. Install Python dependencies:
   ```bash
   python setup_python.py
   ```
   
   Or manually:
   ```bash
   pip install -r requirements.txt
   ```

### Python Libraries

The following Python libraries are available for data processing and analysis:

- **Math and Scientific**: NumPy, SymPy, mpmath, numba
- **Network Analysis**: NetworkX
- **Machine Learning**: PyTorch, openai-whisper
- **Data Processing**: more-itertools, fsspec, filelock
- **Templating**: Jinja2, MarkupSafe

### Integration with Map Components

Python-processed data can be visualized using the Mapbox components. Common workflows include:

1. Process network data with NetworkX
2. Convert results to GeoJSON format
3. Visualize results using GeoJSONLayer component

Example:
```jsx
// In your React component
const [networkData, setNetworkData] = useState(null);

useEffect(() => {
  // Fetch processed data from Python backend
  fetch('/api/process-network-data')
    .then(response => response.json())
    .then(data => setNetworkData(data));
}, []);

return (
  <BaseMap initialCenter={[-122.4194, 37.7749]} initialZoom={12}>
    {map && networkData && (
      <GeoJSONLayer
        map={map}
        sourceId="network-analysis"
        layerId="network-lines"
        data={networkData}
        layerType="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width']
        }}
      />
    )}
  </BaseMap>
);
```

## Core Components

### BaseMap Component

The foundation for all maps in the application:

```jsx
import BaseMap from '@/components/maps/BaseMap';

<BaseMap
  initialCenter={[-122.4194, 37.7749]}
  initialZoom={12}
  style="mapbox://styles/mapbox/streets-v12"
  className="h-96 w-full"
  useUserPreferences={true}
  enable3D={false}
/>
```

### MarkerLayer Component

Add markers to your maps:

```jsx
import MarkerLayer from '@/components/maps/MarkerLayer';

{map && (
  <MarkerLayer
    map={map}
    markers={[
      {
        id: "1",
        longitude: -122.4194,
        latitude: 37.7749,
        title: "San Francisco",
        description: "A beautiful city",
        color: "#3b82f6"
      }
    ]}
    onClick={handleMarkerClick}
  />
)}
```

### GeoJSONLayer Component

Display GeoJSON data:

```jsx
import GeoJSONLayer from '@/components/maps/GeoJSONLayer';

{map && (
  <GeoJSONLayer
    map={map}
    sourceId="boundaries"
    layerId="boundary-lines"
    data={geojsonData}
    layerType="line"
    paint={{
      'line-color': '#FF0000',
      'line-width': 2
    }}
  />
)}
```

### DrawControl Component

Add drawing capabilities:

```jsx
import DrawControl from '@/components/maps/DrawControl';

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

## Administrator Guide

### Accessing Map Settings

1. Log in as an administrator
2. Navigate to the Admin Panel
3. Click on the "Map Settings" tab

### Managing Map Providers

In the Map Provider Configuration section:

1. Enable/disable providers (Mapbox, MapTiler, CARTO, etc.)
2. Set API keys for each provider
3. Configure default provider for new users

### Creating Map Configurations

Map configurations can be assigned to specific users or agencies:

1. Click "Create Map" button
2. Enter name and description
3. Select base map provider and style
4. Assign to users/agencies
5. Save the configuration

### Managing User-Specific Preferences

In the User Map Preferences section:

1. Click "Add User Preference" 
2. Select a user
3. Configure default map, style, center, zoom
4. Enable/disable 3D terrain
5. Save preferences

## Developer Guide

### Using the Map Hooks

The application provides hooks for Mapbox integration:

```jsx
import { useMapbox } from '@/hooks/useMapbox';

function MyMapComponent() {
  const {
    mapContainer, 
    map,
    mapLoaded,
    flyTo,
    addMarker,
    addGeoJSONSource,
  } = useMapbox({
    initialCenter: [-122.4194, 37.7749],
    initialZoom: 12,
    style: 'mapbox://styles/mapbox/streets-v12',
    enableGeolocation: true
  });

  // Use map functions here

  return <div ref={mapContainer} className="h-96 w-full" />;
}
```

### Map Utilities

The `map-utils.ts` file provides helpful functions:

```typescript
import { 
  initMapboxToken, 
  flyToLocation,
  fitMapToBounds, 
  enable3DTerrain,
  getUserMapPreferences
} from '@/lib/map-utils';

// Initialize token
initMapboxToken();

// Get user preferences
const userPrefs = getUserMapPreferences(userId);

// Fly to location
flyToLocation(map, lng, lat, zoom);
```

### User-Specific Settings

To apply user-specific settings:

```typescript
import { getUserMapPreferences } from '@/lib/map-utils';

// Get user preferences
const userPrefs = getUserMapPreferences(userId);

// Apply to map
if (userPrefs && map) {
  if (userPrefs.mapStyle) {
    map.setStyle(userPrefs.mapStyle);
  }
  
  if (userPrefs.defaultCenter && userPrefs.defaultZoom) {
    map.setCenter(userPrefs.defaultCenter);
    map.setZoom(userPrefs.defaultZoom);
  }
  
  if (userPrefs.enable3D) {
    enable3DTerrain(map);
  }
}
```

## Troubleshooting

### Common Issues

1. **Map not displaying**: Check if your Mapbox token is set correctly in `.env.local`
2. **No 3D terrain**: Ensure the map style supports 3D terrain (not all styles do)
3. **Component errors**: Verify that the map instance is loaded before rendering child components

### Getting Help

For more information, refer to:
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [MAPBOX-MIGRATION.md](./MAPBOX-MIGRATION.md) - Details on the migration from Leaflet 