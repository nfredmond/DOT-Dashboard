'use client';

import MapboxSource from './mapbox-source';
import MapboxLayer from './mapbox-layer';

export interface MapboxHeatmapProps {
  id: string;
  data: GeoJSON.FeatureCollection;
  maxZoom?: number;
  radius?: number;
  intensity?: number;
  weight?: string;
  colorStops?: [number, string][];
  opacity?: number;
}

export function MapboxHeatmap({
  id,
  data,
  maxZoom = 15,
  radius = 30,
  intensity = 0.6,
  weight = '',
  colorStops = [
    [0, 'rgba(33,102,172,0)'],
    [0.2, 'rgb(103,169,207)'],
    [0.4, 'rgb(209,229,240)'],
    [0.6, 'rgb(253,219,199)'],
    [0.8, 'rgb(239,138,98)'],
    [1, 'rgb(178,24,43)'],
  ],
  opacity = 0.9,
}: MapboxHeatmapProps) {
  return (
    <MapboxSource
      id={`${id}-source`}
      source={{
        type: 'geojson',
        data,
      }}
    >
      <MapboxLayer
        id={`${id}-heatmap`}
        type="heatmap"
        source={`${id}-source`}
        maxzoom={maxZoom}
        paint={{
          // Increase weight as diameter breast height increases
          'heatmap-weight': weight
            ? ['interpolate', ['linear'], ['get', weight], 0, 0, 1, 1]
            : 1,
          
          // Increase intensity as zoom level increases
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, intensity, maxZoom, intensity * 1.5],
          
          // Assign color values based on the heatmap-density
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            ...colorStops.flat(),
          ],
          
          // Adjust radius with zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, radius,
            maxZoom, radius * 2,
          ],
          
          // Decrease opacity as zoom increases
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, opacity,
            maxZoom, opacity * 0.5,
          ],
        }}
      />
      
      {/* Optional layer for points below the heatmap when zoomed in beyond maxZoom */}
      <MapboxLayer
        id={`${id}-points`}
        type="circle"
        source={`${id}-source`}
        minzoom={maxZoom}
        paint={{
          'circle-radius': 4,
          'circle-color': colorStops[colorStops.length - 1][1],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.7,
        }}
      />
    </MapboxSource>
  );
}

export default MapboxHeatmap; 