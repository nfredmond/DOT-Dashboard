'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import { FeatureGroup } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioDefinition, ScenarioResults } from '@/types/trend-navigator';
import { fetchZoneGeometry, fetchNetworkGeometry, getColorForValue } from '@/lib/map-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import L from 'leaflet';
import logger from '../lib/logger';


type MapMode = 'zones' | 'network';
type ScenarioMapMetric = 
  | 'vmt' 
  | 'emissions' 
  | 'congestion' 
  | 'transitShare' 
  | 'accessibility' 
  | 'equity';

interface ScenarioMapViewProps {
  scenario: ScenarioDefinition;
  results: ScenarioResults | null;
  className?: string;
}

// Component to handle map re-centering
function MapController({ focusedZone }: { focusedZone: any | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (focusedZone && focusedZone.geometry) {
      try {
        const layer = new FeatureGroup();
        const geoJson = L.geoJSON(focusedZone);
        geoJson.addTo(layer);
        
        map.fitBounds(layer.getBounds(), { padding: [50, 50] });
      } catch (error) {
        logger.error('Error focusing on zone:', error);
      }
    }
  }, [focusedZone, map]);
  
  return null;
}

export function ScenarioMapView({ scenario, results, className = '' }: ScenarioMapViewProps) {
  const [zoneGeometry, setZoneGeometry] = useState<any[] | null>(null);
  const [networkGeometry, setNetworkGeometry] = useState<any[] | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('zones');
  const [selectedMetric, setSelectedMetric] = useState<ScenarioMapMetric>('vmt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedZone, setFocusedZone] = useState<any | null>(null);
  
  const _mapRef = useRef<L.Map | null>(null);
  const _geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  
  const loadGeoData = useCallback(async () => {
    if (!scenario?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const zones = await fetchZoneGeometry(scenario.id);
      setZoneGeometry(zones);
      
      const network = await fetchNetworkGeometry(scenario.id);
      setNetworkGeometry(network);
    } catch (err) {
      logger.error('Error loading geometry data:', err);
      setError('Failed to load map data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scenario?.id]);
  
  useEffect(() => {
    loadGeoData();
  }, [loadGeoData]);
  
  const getMetricValue = (feature: any): number => {
    if (!results || !feature.properties) return 0;
    
    const zoneId = feature.properties.zone_id || feature.properties.id;
    
    if (!zoneId) return 0;
    
    const horizonYear = results.horizonYears[0];
    
    if (mapMode === 'zones') {
      const zoneMetrics = results.spatialResults?.zoneMetrics?.[horizonYear]?.[zoneId];
      
      if (!zoneMetrics) return 0;
      
      switch (selectedMetric) {
        case 'vmt':
          return zoneMetrics.vmt || 0;
        case 'emissions':
          return zoneMetrics.ghgEmissions || 0;
        case 'congestion':
          return zoneMetrics.congestionIndex || 0;
        case 'transitShare':
          return (zoneMetrics.modeShares?.transit || 0) * 100;
        case 'accessibility':
          return zoneMetrics.accessibilityIndex || 0;
        case 'equity':
          return zoneMetrics.equityScore || 0;
        default:
          return 0;
      }
    } else {
      const linkId = feature.properties.link_id;
      const linkMetrics = results.spatialResults?.linkMetrics?.[horizonYear]?.[linkId];
      
      if (!linkMetrics) return 0;
      
      switch (selectedMetric) {
        case 'vmt':
          return linkMetrics.volume || 0;
        case 'congestion':
          return linkMetrics.congestionRatio || 0;
        case 'transitShare':
          return linkMetrics.transitVolume || 0;
        default:
          return 0;
      }
    }
  };
  
  const zoneStyle = (feature: any) => {
    const value = getMetricValue(feature);
    
    // Get min/max values for current metric for normalization
    let min = Infinity;
    let max = -Infinity;
    
    if (zoneGeometry) {
      zoneGeometry.forEach(zone => {
        const zoneValue = getMetricValue(zone);
        min = Math.min(min, zoneValue);
        max = Math.max(max, zoneValue);
      });
    }
    
    // Use appropriate color scheme based on metric
    let colorScheme: 'red' | 'green' | 'blue' = 'blue';
    
    switch (selectedMetric) {
      case 'vmt':
      case 'emissions':
      case 'congestion':
        colorScheme = 'red'; // Higher is worse
        break;
      case 'transitShare':
      case 'accessibility':
      case 'equity':
        colorScheme = 'green'; // Higher is better
        break;
    }
    
    // Get color based on value
    const fillColor = getColorForValue(value, min, max, colorScheme);
    
    return {
      fillColor,
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };
  
  const linkStyle = (feature: any) => {
    const value = getMetricValue(feature);
    
    // Get min/max values for current metric for normalization
    let min = Infinity;
    let max = -Infinity;
    
    if (networkGeometry) {
      networkGeometry.forEach(link => {
        const linkValue = getMetricValue(link);
        min = Math.min(min, linkValue);
        max = Math.max(max, linkValue);
      });
    }
    
    // Use appropriate color scheme based on metric
    let colorScheme: 'red' | 'green' | 'blue' = 'blue';
    
    switch (selectedMetric) {
      case 'vmt':
      case 'congestion':
        colorScheme = 'red'; // Higher is worse
        break;
      case 'transitShare':
        colorScheme = 'green'; // Higher is better
        break;
      default:
        colorScheme = 'blue';
    }
    
    // Get color based on value
    const color = getColorForValue(value, min, max, colorScheme);
    
    return {
      color,
      weight: 3 + Math.min(value / max * 5, 5), // Width based on value
      opacity: 0.8
    };
  };
  
  const handleZoneClick = (event: any) => {
    const feature = event.target.feature;
    setFocusedZone(feature);
  };
  
  const getFormattedMetricValue = (value: number): string => {
    switch (selectedMetric) {
      case 'vmt':
        return value.toLocaleString() + ' miles';
      case 'emissions':
        return value.toLocaleString() + ' tons';
      case 'congestion':
        return value.toFixed(2) + ' index';
      case 'transitShare':
        return value.toFixed(1) + '%';
      case 'accessibility':
        return value.toFixed(2) + ' index';
      case 'equity':
        return value.toFixed(2) + ' score';
      default:
        return value.toString();
    }
  };
  
  const getMetricName = (metric: ScenarioMapMetric): string => {
    switch (metric) {
      case 'vmt':
        return 'Vehicle Miles Traveled';
      case 'emissions':
        return 'GHG Emissions';
      case 'congestion':
        return 'Congestion Index';
      case 'transitShare':
        return 'Transit Share';
      case 'accessibility':
        return 'Accessibility Index';
      case 'equity':
        return 'Equity Score';
      default:
        return metric;
    }
  };
  
  const handleMapAction = (action: string) => {
    if (action === 'refresh') {
      loadGeoData();
    } else if (action === 'resetView' && zoneGeometry?.length) {
      setFocusedZone(null);
      // Map reset handled by controller
    }
  };
  
  // If no results, show message
  if (!results) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Scenario Map</CardTitle>
          <CardDescription>Run scenario to see spatial results</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Results Available</AlertTitle>
            <AlertDescription>
              Run this scenario to view geographical results
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Check if spatial results are available
  if (results && (!results.spatialResults || (!results.spatialResults.zoneMetrics && !results.spatialResults.linkMetrics))) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Scenario Map</CardTitle>
          <CardDescription>No spatial data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Spatial Data</AlertTitle>
            <AlertDescription>
              This scenario does not include spatial results
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Scenario Map</CardTitle>
            <CardDescription>
              Spatial analysis for {scenario.name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMapAction('refresh')}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="py-2 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="metric-select">Metric</Label>
            <Select
              value={selectedMetric}
              onValueChange={(value) => setSelectedMetric(value as ScenarioMapMetric)}
            >
              <SelectTrigger id="metric-select" className="w-[180px]">
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vmt">Vehicle Miles Traveled</SelectItem>
                <SelectItem value="emissions">GHG Emissions</SelectItem>
                <SelectItem value="congestion">Congestion</SelectItem>
                <SelectItem value="transitShare">Transit Share</SelectItem>
                <SelectItem value="accessibility">Accessibility</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label htmlFor="map-mode">View</Label>
            <Tabs
              value={mapMode}
              onValueChange={(value) => setMapMode(value as MapMode)}
              className="w-[180px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="zones">Zones</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="ml-auto">
            <Badge variant="outline" className="mr-2">
              {results.horizonYears[0]}
            </Badge>
            <Badge variant="outline">
              {mapMode === 'zones' ? `${zoneGeometry?.length || 0} Zones` : `${networkGeometry?.length || 0} Links`}
            </Badge>
          </div>
        </div>
        
        {error && (
          <Alert className="my-2">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="h-[500px] rounded-md overflow-hidden border mt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <MapContainer
                center={[37.7749, -122.4194]} // Default center (San Francisco)
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <LayersControl position="topright">
                  {mapMode === 'zones' && zoneGeometry && (
                    <LayersControl.Overlay checked name="Zones">
                      <GeoJSON
                        data={zoneGeometry}
                        style={zoneStyle}
                        onEachFeature={(feature, layer) => {
                          layer.on({
                            click: handleZoneClick
                          });
                          
                          const metricValue = getMetricValue(feature);
                          const zoneName = feature.properties.name || `Zone ${feature.properties.zone_id || feature.properties.id || 'Unknown'}`;
                          
                          layer.bindPopup(`
                            <div>
                              <h3>${zoneName}</h3>
                              <p><strong>${getMetricName(selectedMetric)}:</strong> ${getFormattedMetricValue(metricValue)}</p>
                            </div>
                          `);
                        }}
                      />
                    </LayersControl.Overlay>
                  )}
                  
                  {mapMode === 'network' && networkGeometry && (
                    <LayersControl.Overlay checked name="Network">
                      <GeoJSON
                        data={networkGeometry}
                        style={linkStyle}
                        onEachFeature={(feature, layer) => {
                          const metricValue = getMetricValue(feature);
                          const linkName = feature.properties.name || `Link ${feature.properties.link_id || 'Unknown'}`;
                          
                          layer.bindPopup(`
                            <div>
                              <h3>${linkName}</h3>
                              <p><strong>${getMetricName(selectedMetric)}:</strong> ${getFormattedMetricValue(metricValue)}</p>
                            </div>
                          `);
                        }}
                      />
                    </LayersControl.Overlay>
                  )}
                </LayersControl>
                
                <MapController focusedZone={focusedZone} />
              </MapContainer>
            </>
          )}
        </div>
        
        {/* Map Legend */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Legend</span>
            <div className="flex items-center gap-1">
              {selectedMetric === 'vmt' || selectedMetric === 'emissions' || selectedMetric === 'congestion' ? (
                <>
                  <div className="w-4 h-4 bg-green-300 rounded-sm"></div>
                  <span className="text-xs">Low</span>
                  <div className="w-4 h-4 bg-yellow-300 rounded-sm ml-2"></div>
                  <span className="text-xs">Medium</span>
                  <div className="w-4 h-4 bg-red-300 rounded-sm ml-2"></div>
                  <span className="text-xs">High</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-red-300 rounded-sm"></div>
                  <span className="text-xs">Low</span>
                  <div className="w-4 h-4 bg-yellow-300 rounded-sm ml-2"></div>
                  <span className="text-xs">Medium</span>
                  <div className="w-4 h-4 bg-green-300 rounded-sm ml-2"></div>
                  <span className="text-xs">High</span>
                </>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Click on map features for detailed information
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 