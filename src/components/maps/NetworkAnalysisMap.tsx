"use client";

import React, { useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import BaseMap from '@/components/maps/BaseMap';
import GeoJSONLayer from '@/components/maps/GeoJSONLayer';
import MarkerLayer from '@/components/maps/MarkerLayer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPinIcon, ClockIcon, LoaderIcon } from 'lucide-react';

interface NetworkAnalysisMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  networkGeoJSONPath?: string;
  className?: string;
}

const NetworkAnalysisMap: React.FC<NetworkAnalysisMapProps> = ({
  initialCenter = [-122.4194, 37.7749], // Default: San Francisco
  initialZoom = 12,
  networkGeoJSONPath = '/data/network.geojson',
  className = 'h-[600px] w-full'
}) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const [sourceCoordinates, setSourceCoordinates] = useState<[number, number]>(initialCenter);
  const [timeThresholds, setTimeThresholds] = useState<number[]>([5, 10, 15, 20]); // minutes
  const [maxTime, setMaxTime] = useState<number>(30); // minutes
  const [speed, setSpeed] = useState<number>(5); // km/minute
  const [isochrones, setIsochrones] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle map click and set source coordinates
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    const lngLat = e.lngLat;
    setSourceCoordinates([lngLat.lng, lngLat.lat]);
  };

  // Function to handle map load
  const handleMapLoad = (mapInstance: mapboxgl.Map) => {
    map.current = mapInstance;
    
    // Add click handler
    mapInstance.on('click', handleMapClick);
  };

  // Function to run analysis
  const runAnalysis = async () => {
    if (!sourceCoordinates) {
      setError('Please set a source location by clicking on the map');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/network-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceCoordinates,
          timeThresholds: timeThresholds,
          networkFile: networkGeoJSONPath,
          speed: speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setIsochrones(data.isochrones);
      
      // If the map is available, fit to bounds of the isochrones
      if (map.current && data.isochrones && data.isochrones.features.length > 0) {
        // For simplicity, we're just going to zoom out a bit
        map.current.flyTo({
          center: sourceCoordinates,
          zoom: Math.max(initialZoom - 2, 8),
          essential: true,
        });
      }
    } catch (error) {
      console.error('Error running network analysis:', error);
      setError((error as Error).message || 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changes to time thresholds
  const handleMaxTimeChange = (value: number) => {
    setMaxTime(value);
    // Update time thresholds based on max time
    const intervals = 4; // Number of thresholds
    const newThresholds: number[] = [];
    for (let i = 1; i <= intervals; i++) {
      newThresholds.push(Math.round((value * i) / intervals));
    }
    setTimeThresholds(newThresholds);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Analysis</CardTitle>
          <CardDescription>
            Analyze travel times from a point on the transportation network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={className}>
            <BaseMap
              initialCenter={initialCenter}
              initialZoom={initialZoom}
              onMapLoad={handleMapLoad}
              className="h-full w-full rounded-md border"
            >
              {map.current && (
                <>
                  {/* Source marker */}
                  <MarkerLayer
                    map={map.current}
                    markers={[
                      {
                        id: "source",
                        longitude: sourceCoordinates[0],
                        latitude: sourceCoordinates[1],
                        color: "#FF0000",
                      }
                    ]}
                  />
                  
                  {/* Isochrones layer */}
                  {isochrones && (
                    <GeoJSONLayer
                      map={map.current}
                      sourceId="isochrones"
                      layerId="isochrones-fill"
                      data={isochrones}
                      layerType="fill"
                      paint={{
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.5,
                        'fill-outline-color': '#000000'
                      }}
                    />
                  )}
                </>
              )}
            </BaseMap>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source-coords">Source Location</Label>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="source-coords"
                    value={`${sourceCoordinates[0].toFixed(6)}, ${sourceCoordinates[1].toFixed(6)}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click on the map to set the source location
                </p>
              </div>
              
              <div>
                <Label htmlFor="speed">Travel Speed (km/min)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="speed"
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value) || 5)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {(speed * 60).toFixed(1)} km/h
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 inline-block">
                Max Travel Time: {maxTime} minutes
              </Label>
              <Slider
                value={[maxTime]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value) => handleMaxTimeChange(value[0])}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">5 min</span>
                <span className="text-xs text-muted-foreground">60 min</span>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 inline-block">Time Thresholds</Label>
              <div className="flex flex-wrap gap-2">
                {timeThresholds.map((threshold) => (
                  <div
                    key={threshold}
                    className="flex items-center gap-1 rounded-full px-3 py-1 bg-muted"
                  >
                    <ClockIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">{threshold} min</span>
                  </div>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <Button
              onClick={runAnalysis}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run Analysis'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkAnalysisMap; 