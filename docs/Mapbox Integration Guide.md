# Mapbox GL JS Integration Guide

This document provides an overview of the Planning Manager's implementation of Mapbox GL JS for interactive maps and spatial visualization.

## Overview

Planning Manager uses Mapbox GL JS as the core mapping library, providing high-performance vector rendering, 3D capabilities, and advanced visualization options. The implementation follows a component-based architecture that makes it easy to add maps and various visualization layers throughout the application.

## Key Components

### MapboxProvider & Context

The `MapboxProvider` creates a context that ensures the map instance is accessible to all child components. This allows for efficient rendering and event handling.

```jsx
import { MapboxProvider } from '@/contexts/mapbox-context';

function MyPage() {
  return (
    <MapboxProvider>
      <MapboxMap 
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Map components go here */}
      </MapboxMap>
    </MapboxProvider>
  );
}
```

### MapboxMap

The core component that renders the Mapbox GL JS map. It handles initialization, cleanup, and provides a container for other map components.

```jsx
<MapboxMap 
  initialViewState={{
    longitude: -100,
    latitude: 40,
    zoom: 3.5,
    pitch: 0,
    bearing: 0
  }}
  mapStyle="mapbox://styles/mapbox/streets-v12"
  onMapLoad={(map) => console.log('Map loaded')}
  onMapClick={handleMapClick}
  className="h-[500px] w-full"
/>
```

### MapboxSource

Manages data sources for the map. Can be used with various source types including GeoJSON, vector tiles, and raster tiles.

```jsx
<MapboxSource 
  id="my-source"
  source={{
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [/* GeoJSON features */]
    }
  }}
/>
```

### MapboxLayer

Renders a specific layer type (circle, line, fill, symbol, etc.) using data from a source.

```jsx
<MapboxLayer
  id="points-layer"
  type="circle"
  source="my-source"
  paint={{
    'circle-color': '#3887be',
    'circle-radius': 5,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }}
  onClick={handleLayerClick}
/>
```

### MapboxCluster

Creates point clustering for large datasets, with customizable appearance and behavior.

```jsx
<MapboxCluster
  id="clusters"
  data={pointsData}
  radius={50}
  maxZoom={14}
  clusterColors={['#51bbd6', '#f1f075', '#f28cb1']}
  clusterSteps={[10, 100, 750]}
  pointColor="#11b4da"
  pointRadius={4}
  onClick={handleClusterClick}
/>
```

### MapboxHeatmap

Visualizes point density using heatmaps with customizable colors and intensities.

```jsx
<MapboxHeatmap
  id="heatmap"
  data={pointsData}
  radiusPixels={30}
  intensity={1}
  colorStops={[
    [0, 'rgba(33,102,172,0)'],
    [0.2, 'rgb(103,169,207)'],
    [0.4, 'rgb(209,229,240)'],
    [0.6, 'rgb(253,219,199)'],
    [0.8, 'rgb(239,138,98)'],
    [1, 'rgb(178,24,43)']
  ]}
/>
```

### MapboxStyleSwitcher

Provides a UI for switching between different map styles.

```jsx
<MapboxStyleSwitcher 
  position="top-right" 
  styles={[
    {id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12'},
    {id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12'},
    {id: 'light', name: 'Light', url: 'mapbox://styles/mapbox/light-v11'},
    {id: 'dark', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11'}
  ]}
/>
```

### MapboxDraw

Enables drawing and editing of features on the map.

```jsx
<MapboxDraw
  onDrawCreate={handleCreate}
  onDrawUpdate={handleUpdate}
  onDrawDelete={handleDelete}
  controls={{
    point: true,
    line_string: true,
    polygon: true,
    trash: true
  }}
/>
```

## Configuration

To use Mapbox GL JS, you need to set up your Mapbox access token in the environment variables:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Benefits over Leaflet

The migration from Leaflet to Mapbox GL JS provides several key advantages:

1. **WebGL-powered rendering**: Much better performance for large datasets
2. **Vector tile support**: Efficient loading and rendering of map data
3. **3D visualization**: Support for extrusions, terrain, and 3D buildings
4. **Flexible styling**: Style expressions allow data-driven visualization
5. **Better mobile support**: Optimized touch interactions and performance
6. **Advanced visualizations**: Improved heatmaps, clusters, and symbol layers

## Common Usage Patterns

### Creating a Basic Map with Data

```jsx
import { MapboxProvider } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import MapboxSource from '@/components/ui/mapbox-source';
import MapboxLayer from '@/components/ui/mapbox-layer';

function MyMap() {
  return (
    <MapboxProvider>
      <MapboxMap 
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <MapboxSource 
          id="projects-source"
          source={{
            type: 'geojson',
            data: projectsData // Your GeoJSON data
          }}
        >
          <MapboxLayer
            id="projects-layer"
            type="circle"
            source="projects-source"
            paint={{
              'circle-color': '#3887be',
              'circle-radius': 5,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff'
            }}
            onClick={handleProjectClick}
          />
        </MapboxSource>
      </MapboxMap>
    </MapboxProvider>
  );
}
```

### Choropleth Map

```jsx
<MapboxSource 
  id="zones-source"
  source={{
    type: 'geojson',
    data: zonesData
  }}
>
  <MapboxLayer
    id="zones-layer"
    type="fill"
    source="zones-source"
    paint={{
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, '#edf8e9',
        25, '#bae4b3',
        50, '#74c476',
        75, '#31a354',
        100, '#006d2c'
      ],
      'fill-opacity': 0.7,
      'fill-outline-color': '#000'
    }}
  />
</MapboxSource>
```

## Troubleshooting

### Map Not Displaying

1. Check that your Mapbox token is correctly set in environment variables
2. Ensure the map container has a specified height (maps with 0 height will not display)
3. Verify that the `MapboxProvider` is wrapping your map components

### Performance Issues

1. Use clustering for large point datasets
2. Consider vector tiles for very large GeoJSON datasets
3. Limit the number of features rendered at once
4. Use filter expressions to show only relevant data

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Expression Reference](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/) 