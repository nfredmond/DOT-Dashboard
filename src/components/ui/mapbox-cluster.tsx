'use client';

import { useMapbox } from '@/contexts/mapbox-context';
import MapboxSource from './mapbox-source';
import MapboxLayer from './mapbox-layer';

export interface MapboxClusterProps {
  id: string;
  data: GeoJSON.FeatureCollection;
  radius?: number;
  maxZoom?: number;
  clusterColors?: string[];
  clusterSteps?: number[];
  pointColor?: string;
  pointRadius?: number;
  onClick?: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
}

export function MapboxCluster({
  id,
  data,
  radius = 50,
  maxZoom = 14,
  clusterColors = ['#51bbd6', '#f1f075', '#f28cb1'],
  clusterSteps = [10, 100, 750],
  pointColor = '#11b4da',
  pointRadius = 4,
  onClick,
}: MapboxClusterProps) {
  const { map } = useMapbox();

  // Handle clicking on a cluster to zoom in
  const handleClusterClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    if (!map || !e.features || e.features.length === 0) return;

    const feature = e.features[0];
    if (!feature || !feature.properties || !feature.properties.cluster_id) return;

    const clusterId = feature.properties.cluster_id as number;
    const source = map.getSource(`${id}-source`) as mapboxgl.GeoJSONSource;

    if (source && typeof source.getClusterExpansionZoom === 'function') {
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !zoom || !feature.geometry || feature.geometry.type !== 'Point') return;

        const coordinates = feature.geometry.coordinates.slice() as [number, number];
        
        // Fly to the cluster
        map.flyTo({
          center: coordinates,
          zoom: zoom,
          speed: 0.5,
          curve: 1.5,
        });
      });
    }
  };

  // Handle clicking on individual points
  const handlePointClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    if (onClick && e.features && e.features[0]) {
      onClick(e);
    }
  };

  // Create cluster layers when data changes
  return (
    <>
      <MapboxSource
        id={`${id}-source`}
        source={{
          type: 'geojson',
          data,
          cluster: true,
          clusterMaxZoom: maxZoom,
          clusterRadius: radius,
        }}
      >
        {/* Layer for clusters */}
        <MapboxLayer
          id={`${id}-clusters`}
          type="circle"
          source={`${id}-source`}
          filter={['has', 'point_count']}
          paint={{
            'circle-color': [
              'step',
              ['get', 'point_count'],
              clusterColors[0],
              clusterSteps[0],
              clusterColors[1],
              clusterSteps[1],
              clusterColors[2],
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              clusterSteps[0],
              30,
              clusterSteps[1],
              40,
            ],
            'circle-opacity': 0.85,
          }}
          onClick={handleClusterClick}
        />

        {/* Layer for cluster counts */}
        <MapboxLayer
          id={`${id}-cluster-count`}
          type="symbol"
          source={`${id}-source`}
          filter={['has', 'point_count']}
          layout={{
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          }}
          paint={{
            'text-color': '#ffffff',
          }}
        />

        {/* Layer for individual points */}
        <MapboxLayer
          id={`${id}-unclustered-point`}
          type="circle"
          source={`${id}-source`}
          filter={['!', ['has', 'point_count']]}
          paint={{
            'circle-color': pointColor,
            'circle-radius': pointRadius,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          }}
          onClick={handlePointClick}
        />
      </MapboxSource>
    </>
  );
}

export default MapboxCluster; 