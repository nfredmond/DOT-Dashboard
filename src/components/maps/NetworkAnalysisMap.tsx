"use client";

import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import BaseMap from '@/components/maps/BaseMap';
import GeoJSONLayer from '@/components/maps/GeoJSONLayer';
import MarkerLayer from '@/components/maps/MarkerLayer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPinIcon, ClockIcon, LoaderIcon, BarChart4 } from 'lucide-react';
import { enable3DTerrain, flyToLocation, loadGreenChampResults, loadTrendNavigatorResults, visualizeBenefitCostOnMap, visualizeScenarioComparison } from '@/lib/map-utils';

interface NetworkAnalysisMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  networkGeoJSONPath?: string;
  className?: string;
  scenarioId?: string;
  greenChampResults?: any;
  trendResults?: any;
}

const NetworkAnalysisMap: React.FC<NetworkAnalysisMapProps> = ({
  initialCenter = [-122.4194, 37.7749], // Default: San Francisco
  initialZoom = 12,
  networkGeoJSONPath = '/data/network.geojson',
  className = 'h-[600px] w-full',
  scenarioId,
  greenChampResults,
  trendResults
}) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const [sourceCoordinates, setSourceCoordinates] = useState<[number, number]>(initialCenter);
  const [timeThresholds, setTimeThresholds] = useState<number[]>([5, 10, 15, 20]); // minutes
  const [maxTime, setMaxTime] = useState<number>(30); // minutes
  const [speed, setSpeed] = useState<number>(5); // km/minute
  const [isochrones, setIsochrones] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // New states for enhanced functionality
  const [enable3D, setEnable3D] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<string>("isochrones");
  const [availableScenarios, setAvailableScenarios] = useState<any[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(scenarioId || null);
  const [metricDisplay, setMetricDisplay] = useState<string>("volume");
  const [currentMetric, setCurrentMetric] = useState<any>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [analysisId, setAnalysisId] = useState<string>("");
  
  // Load available scenarios
  useEffect(() => {
    // This would typically be an API call in a real application
    // Mocked for demonstration purposes
    const mockScenarios = [
      { id: "baseline", name: "Baseline (2023)" },
      { id: "scenario1", name: "2030 High Growth" },
      { id: "scenario2", name: "2030 Sustainable" },
      { id: "scenario3", name: "2040 Autonomous Vehicles" },
    ];
    
    setAvailableScenarios(mockScenarios);
    
    // Set the active scenario if provided
    if (scenarioId) {
      setActiveScenario(scenarioId);
    }
  }, [scenarioId]);

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
    
    // Apply 3D terrain if enabled
    if (enable3D) {
      enable3DTerrain(mapInstance);
    }
  };
  
  // Handle 3D toggle
  useEffect(() => {
    if (map.current) {
      if (enable3D) {
        enable3DTerrain(map.current);
      } else {
        // Reset terrain when disabling 3D
        map.current.setTerrain(null);
      }
    }
  }, [enable3D]);

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
          scenarioId: activeScenario
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
      
      // Set metrics from GreenChAMP results if available
      if (data.metrics) {
        setCurrentMetric(data.metrics);
      }
      
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
      // Error running network analysis
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
  
  // Handle layer selection change
  const handleLayerChange = (value: string) => {
    setSelectedLayer(value);
  };
  
  // Handle scenario change
  const handleScenarioChange = (value: string) => {
    setActiveScenario(value);
    
    // In a real app, we would load scenario-specific data here
    // For now, just update the UI to reflect the change
    
    if (map.current) {
      // Fly to a slightly different view to show the change
      flyToLocation(
        map.current, 
        sourceCoordinates[0], 
        sourceCoordinates[1], 
        map.current.getZoom(),
        enable3D ? 45 : 0 // Apply pitch when 3D is enabled
      );
    }
  };
  
  // Handle metric display change
  const handleMetricDisplayChange = (value: string) => {
    setMetricDisplay(value);
  };

  // Integrate GreenChAMP and TrendNavigator results
  useEffect(() => {
    if (map.current && activeScenario) {
      // Clear any existing layers
      ['greenchamp-network', 'greenchamp-zones', 'trendnav-scenario'].forEach(source => {
        if (map.current?.getSource(source)) {
          // Remove associated layers first
          const layers = ['greenchamp-network-layer', 'greenchamp-zones-layer', 'trendnav-scenario-layer', 'trendnav-labels'];
          layers.forEach(layer => {
            if (map.current?.getLayer(layer)) {
              map.current.removeLayer(layer);
            }
          });
          
          // Then remove the source
          map.current.removeSource(source);
        }
      });
      
      // Load relevant data based on the active scenario
      if (greenChampResults) {
        loadGreenChampResults(map.current, activeScenario)
          .then(success => {
            if (success) {
              // GreenChAMP results loaded successfully
            }
          })
          .catch(error => {
            // Error loading GreenChAMP results
          });
      }
      
      if (trendResults) {
        loadTrendNavigatorResults(map.current, activeScenario)
          .then(success => {
            if (success) {
              console.log('TrendNavigator results loaded successfully');
            }
          })
          .catch(error => {
            console.error('Error loading TrendNavigator results:', error);
          });
      }
    }
  }, [map.current, activeScenario, greenChampResults, trendResults]);
  
  // Function to integrate benefit-cost analysis
  const integrateBenefitCostAnalysis = async (projectId: string, analysisId: string) => {
    if (!map.current) return;
    
    try {
      setIsLoading(true);
      const success = await visualizeBenefitCostOnMap(map.current, projectId, analysisId);
      if (success) {
        console.log('Benefit-cost analysis integrated successfully');
        // Update UI to reflect the benefit-cost data is loaded
        setSelectedLayer('benefit-cost');
      } else {
        console.warn('Failed to integrate benefit-cost analysis');
        setError('Failed to visualize benefit-cost analysis');
      }
    } catch (error) {
      console.error('Error integrating benefit-cost analysis:', error);
      setError('Error visualizing benefit-cost analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to compare scenarios visually
  const compareScenarios = async (scenarioIds: string[]) => {
    if (!map.current || scenarioIds.length < 1) return;
    
    try {
      setIsLoading(true);
      const success = await visualizeScenarioComparison(map.current, scenarioIds, {
        metricType: metricDisplay as 'volume' | 'emissions' | 'vmt' | 'accessibility' | 'equity',
        showDifference: true,
        layer3D: enable3D
      });
      
      if (success) {
        console.log('Scenario comparison visualized successfully');
        // Update UI to reflect the scenario comparison is loaded
        setSelectedLayer('scenario-comparison');
      } else {
        console.warn('Failed to visualize scenario comparison');
        setError('Failed to visualize scenario comparison');
      }
    } catch (error) {
      console.error('Error visualizing scenario comparison:', error);
      setError('Error visualizing scenario comparison');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Analysis</CardTitle>
          <CardDescription>
            Analyze travel times and metrics from a point on the transportation network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="map" className="mb-4">
            <TabsList>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="benefit-cost">Benefit/Cost</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map">
              <div className={className}>
                <BaseMap
                  initialCenter={initialCenter}
                  initialZoom={initialZoom}
                  onMapLoad={handleMapLoad}
                  className="h-full w-full rounded-md border"
                  enable3D={enable3D}
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
                      {isochrones && selectedLayer === "isochrones" && (
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
                      
                      {/* Traffic volume layer from GreenChAMP */}
                      {greenChampResults && selectedLayer === "traffic" && (
                        <GeoJSONLayer
                          map={map.current}
                          sourceId="traffic-network"
                          layerId="traffic-network-layer"
                          data={greenChampResults.network}
                          layerType="line"
                          paint={{
                            'line-color': [
                              'interpolate',
                              ['linear'],
                              ['get', 'volume'],
                              0, '#00ff00',
                              1000, '#ffff00',
                              2000, '#ff8800',
                              5000, '#ff0000'
                            ],
                            'line-width': [
                              'interpolate',
                              ['linear'],
                              ['get', 'volume'],
                              0, 1,
                              5000, 10
                            ],
                            'line-opacity': 0.8
                          }}
                        />
                      )}
                      
                      {/* Mode share layer from TrendNavigator */}
                      {trendResults && selectedLayer === "modes" && (
                        <GeoJSONLayer
                          map={map.current}
                          sourceId="mode-share"
                          layerId="mode-share-layer"
                          data={trendResults.modeShare}
                          layerType="fill"
                          paint={{
                            'fill-color': [
                              'match',
                              ['get', 'dominant_mode'],
                              'car', '#ff0000',
                              'transit', '#0000ff',
                              'bike', '#00ff00',
                              'walk', '#ffff00',
                              '#888888'
                            ],
                            'fill-opacity': 0.5,
                            'fill-outline-color': '#000000'
                          }}
                        />
                      )}
                    </>
                  )}
                </BaseMap>
              </div>
            </TabsContent>
            
            <TabsContent value="metrics">
              <div className="h-[400px] bg-muted/30 rounded-md p-6 flex items-center justify-center">
                {currentMetric ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Vehicle Miles Traveled</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{currentMetric.vmt?.toLocaleString() || "N/A"}</div>
                        <p className="text-sm text-muted-foreground">Daily VMT in analysis area</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">GHG Emissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{currentMetric.emissions?.toLocaleString() || "N/A"}</div>
                        <p className="text-sm text-muted-foreground">CO₂ Equivalent (kg)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Mode Share</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span>Car:</span>
                            <span className="font-medium">{currentMetric.modeShare?.car || "N/A"}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Transit:</span>
                            <span className="font-medium">{currentMetric.modeShare?.transit || "N/A"}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bike:</span>
                            <span className="font-medium">{currentMetric.modeShare?.bike || "N/A"}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Walk:</span>
                            <span className="font-medium">{currentMetric.modeShare?.walk || "N/A"}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <BarChart4 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Run analysis to view metrics</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="scenarios">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label>Compare Scenarios</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableScenarios.map((scenario) => (
                      <Button
                        key={scenario.id}
                        variant={activeScenario === scenario.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleScenarioChange(scenario.id)}
                      >
                        {scenario.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label>Comparison Metrics</Label>
                  <Select value={metricDisplay} onValueChange={handleMetricDisplayChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">Traffic Volume</SelectItem>
                      <SelectItem value="emissions">GHG Emissions</SelectItem>
                      <SelectItem value="vmt">Vehicle Miles Traveled</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                      <SelectItem value="equity">Equity Metrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable3d">Enable 3D Visualization</Label>
                    <Switch
                      id="enable3d"
                      checked={enable3D}
                      onCheckedChange={setEnable3D}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => compareScenarios([...availableScenarios.slice(0, 2).map(s => s.id)])}
                    disabled={availableScenarios.length < 2 || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                        Comparing Scenarios...
                      </>
                    ) : (
                      <>
                        <BarChart4 className="mr-2 h-4 w-4" />
                        Compare Scenarios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="benefit-cost">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Benefit-Cost Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualize benefit-cost analysis results on the map to see the spatial distribution of benefits and costs.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-id">Project ID</Label>
                        <Input id="project-id" placeholder="Enter project ID" onChange={(e) => setProjectId(e.target.value)} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="analysis-id">Analysis ID</Label>
                        <Input id="analysis-id" placeholder="Enter analysis ID" onChange={(e) => setAnalysisId(e.target.value)} />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => integrateBenefitCostAnalysis(projectId, analysisId)}
                      disabled={!projectId || !analysisId || isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          Loading Analysis...
                        </>
                      ) : (
                        <>
                          <BarChart4 className="mr-2 h-4 w-4" />
                          Visualize Benefit-Cost Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="p-4 text-red-500 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

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