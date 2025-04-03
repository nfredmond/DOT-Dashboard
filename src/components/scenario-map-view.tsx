'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioDefinition, ScenarioResults, GeoJSONCollection } from '@/types/trend-navigator';
import { fetchZoneGeometry, fetchNetworkGeometry } from '@/lib/map-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import logger from '@/lib/logger';
import MapboxMap from '@/components/ui/mapbox-map';
import { MapboxProvider } from '@/contexts/mapbox-context';
import MapboxSource from '@/components/ui/mapbox-source';
import MapboxLayer from '@/components/ui/mapbox-layer';
import MapboxStyleSwitcher from '@/components/ui/mapbox-style-switcher';
import { getMapboxStyleForMap } from '@/lib/map-config-service';
import mapboxgl from 'mapbox-gl';

// Generate a color scale for choropleth maps
const generateColorScale = (min: number, max: number): [number, string][] => {
  const range = max - min;
  return [
    [min, '#edf8e9'],
    [min + range * 0.25, '#bae4b3'],
    [min + range * 0.5, '#74c476'],
    [min + range * 0.75, '#31a354'],
    [max, '#006d2c'],
  ];
};

interface ScenarioMapViewProps {
  scenario: ScenarioDefinition;
  results?: ScenarioResults;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ScenarioMapView({ results, isLoading = false, onRefresh }: ScenarioMapViewProps) {
  const [activeLayer, setActiveLayer] = useState<string>('zones');
  const [zoneData, setZoneData] = useState<GeoJSONCollection | null>(null);
  const [networkData, setNetworkData] = useState<GeoJSONCollection | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedFeature, setSelectedFeature] = useState<mapboxgl.MapboxGeoJSONFeature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorScale, setColorScale] = useState<[number, string][]>([]);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Load zone geometries
  useEffect(() => {
    const loadZoneGeometry = async () => {
      try {
        const data = await fetchZoneGeometry('default');
        setZoneData(data as GeoJSONCollection);
      } catch (err) {
        setError('Failed to load zone data');
        logger.error('Failed to load zone data', err);
      }
    };

    loadZoneGeometry();
  }, []);

  // Load network geometries
  useEffect(() => {
    const loadNetworkGeometry = async () => {
      try {
        const data = await fetchNetworkGeometry('default');
        setNetworkData(data as GeoJSONCollection);
      } catch (err) {
        setError('Failed to load network data');
        logger.error('Failed to load network data', err);
      }
    };

    loadNetworkGeometry();
  }, []);

  // Generate property options for the active layer
  const propertyOptions = useCallback(() => {
    if (!results || !results.spatialResults) return [];
    
    const layerData = activeLayer === 'zones' 
      ? results.spatialResults.zones
      : activeLayer === 'networks' 
        ? results.spatialResults.networks
        : null;

    if (!layerData || !layerData.features || layerData.features.length === 0) return [];

    // Get all properties from the first feature
    const properties = layerData.features[0].properties || {};
    return Object.keys(properties)
      .filter(key => !['id', 'name', 'geometry'].includes(key) && typeof properties[key] === 'number')
      .map(key => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: key
      }));
  }, [activeLayer, results]);

  // When property selection changes, update the color scale
  useEffect(() => {
    if (!selectedProperty || !results || !results.spatialResults) return;
    
    const layerData = activeLayer === 'zones' 
      ? results.spatialResults.zones
      : activeLayer === 'networks' 
        ? results.spatialResults.networks
        : null;

    if (!layerData || !layerData.features) return;

    // Find min/max values for the selected property
    let min = Infinity;
    let max = -Infinity;
    
    layerData.features.forEach(feature => {
      if (feature.properties && typeof feature.properties[selectedProperty] === 'number') {
        min = Math.min(min, feature.properties[selectedProperty]);
        max = Math.max(max, feature.properties[selectedProperty]);
      }
    });

    if (min !== Infinity && max !== -Infinity) {
      setColorScale(generateColorScale(min, max));
    }
  }, [selectedProperty, activeLayer, results]);

  // Handle feature click on the map
  const handleFeatureClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const features = e.target.queryRenderedFeatures(e.point, {
      layers: [`${activeLayer}-layer`]
    });
    
    if (features.length > 0) {
      setSelectedFeature(features[0]);
    } else {
      setSelectedFeature(null);
    }
  }, [activeLayer]);

  // Map style expression for choropleth coloring
  const getMapFillExpression = useCallback(() => {
    if (!selectedProperty || !colorScale.length) return ['rgba', 200, 200, 200, 0.6];

    return [
      'interpolate',
      ['linear'],
      ['get', selectedProperty],
      ...colorScale.flat()
    ];
  }, [selectedProperty, colorScale]);

  // Prepare layer styles based on the selected property
  const getLayerPaint = useCallback(() => {
    if (activeLayer === 'zones') {
      return {
        'fill-color': getMapFillExpression(),
        'fill-opacity': 0.7,
        'fill-outline-color': '#000'
      };
    }
    
    if (activeLayer === 'networks') {
      return {
        'line-color': getMapFillExpression(),
        'line-width': 3,
        'line-opacity': 0.8
      };
    }
    
    return {};
  }, [activeLayer, getMapFillExpression]);

  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
  }, []);

  // When no results are available
  if (!results) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Scenario Map</CardTitle>
          <CardDescription>
            Visualize scenario metrics on the map
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] relative flex flex-col items-center justify-center">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Results Available</AlertTitle>
            <AlertDescription>
              Run the scenario to view spatial results on the map.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // When results are loading
  if (isLoading) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle>Scenario Map</CardTitle>
          <CardDescription>
            Loading scenario results...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] relative flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading spatial data...</p>
        </CardContent>
      </Card>
    );
  }
  
  const hasZoneData = results.spatialResults?.zones && results.spatialResults.zones.features.length > 0;
  const hasNetworkData = results.spatialResults?.networks && results.spatialResults.networks.features.length > 0;
  
  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scenario Map</CardTitle>
            <CardDescription>
              Visualize scenario metrics on the map
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="w-full sm:w-1/3">
            <Label htmlFor="layer-type">Layer Type</Label>
            <Tabs
              defaultValue={activeLayer}
              className="w-full"
              onValueChange={setActiveLayer}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="zones" disabled={!hasZoneData}>Zones</TabsTrigger>
                <TabsTrigger value="networks" disabled={!hasNetworkData}>Networks</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="w-full sm:w-2/3">
            <Label htmlFor="metric">Metric</Label>
            <Select 
              value={selectedProperty} 
              onValueChange={setSelectedProperty}
              disabled={propertyOptions().length === 0}
            >
              <SelectTrigger id="metric">
                <SelectValue placeholder="Select a metric" />
              </SelectTrigger>
              <SelectContent>
                {propertyOptions().map(option => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="h-[500px] relative">
            <MapboxProvider>
              <MapboxMap 
                initialViewState={{
                  longitude: -122.4194,
                  latitude: 37.7749,
                  zoom: 11
                }}
                mapStyle={getMapboxStyleForMap('streets')}
                onMapLoad={handleMapLoad}
                onMapClick={handleFeatureClick}
              >
                <MapboxStyleSwitcher 
                  position="top-right" 
                  styles={[
                    {id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12'},
                    {id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12'},
                    {id: 'light', name: 'Light', url: 'mapbox://styles/mapbox/light-v11'},
                    {id: 'dark', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11'}
                  ]}
                />
                
                {activeLayer === 'zones' && zoneData && (
                  <>
                    <MapboxSource 
                      id="zones-source"
                      source={{
                        type: 'geojson',
                        data: results.spatialResults?.zones || zoneData
                      }}
                    />
                    <MapboxLayer
                      id="zones-layer"
                      type="fill"
                      source="zones-source"
                      paint={getLayerPaint()}
                    />
                    <MapboxLayer
                      id="zones-outline"
                      type="line"
                      source="zones-source"
                      paint={{
                        'line-color': '#000',
                        'line-width': 1,
                        'line-opacity': 0.5
                      }}
                    />
                  </>
                )}
                
                {activeLayer === 'networks' && networkData && (
                  <>
                    <MapboxSource 
                      id="networks-source"
                      source={{
                        type: 'geojson',
                        data: results.spatialResults?.networks || networkData
                      }}
                    />
                    <MapboxLayer
                      id="networks-layer"
                      type="line"
                      source="networks-source"
                      paint={getLayerPaint()}
                    />
                  </>
                )}
              </MapboxMap>
            </MapboxProvider>
            
            {/* Legend */}
            {selectedProperty && colorScale.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-background/90 p-2 rounded-md shadow z-10">
                <div className="text-xs font-medium mb-1">{selectedProperty.replace(/_/g, ' ')}</div>
                <div className="flex h-2 w-32">
                  {colorScale.map(([_, color], i) => (
                    <div 
                      key={i} 
                      className="flex-1 h-full" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>{colorScale[0][0].toFixed(1)}</span>
                  <span>{colorScale[colorScale.length - 1][0].toFixed(1)}</span>
                </div>
              </div>
            )}
            
            {/* Feature Info */}
            {selectedFeature && (
              <div className="absolute top-4 left-4 bg-background/90 p-2 rounded-md shadow z-10 max-w-xs">
                <div className="text-sm font-medium">
                  {selectedFeature.properties?.name || 'Feature Info'}
                </div>
                <div className="text-xs mt-1">
                  {selectedProperty && selectedFeature.properties?.[selectedProperty] !== undefined && (
                    <Badge>
                      {selectedProperty}: {selectedFeature.properties[selectedProperty].toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 