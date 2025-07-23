'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Globe, 
  FileBarChart, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Train, 
  Bike, 
  Users,
  Zap,
  TreePine,
  Building2,
  Activity
} from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { ComparisonInsights } from './comparison-insights';
import mapboxgl from 'mapbox-gl';

// Import Mapbox components
import BaseMap from '@/components/maps/BaseMap';
import GeoJSONLayer from '@/components/maps/GeoJSONLayer';
import { enable3DTerrain } from '@/lib/map-utils';

interface ScenarioComparisonProps {
  scenarios: any[];
  scenarioResults?: Record<string, any>;
  organizationId: string;
  onRegenerateInsights?: () => Promise<void>;
  onExportPDF?: () => Promise<string>;
  onExportExcel?: () => Promise<string>;
  className?: string;
}

export default function ScenariosComparisonDashboard({
  scenarios = [],
  scenarioResults = {},
  organizationId,
  onRegenerateInsights,
  onExportPDF,
  onExportExcel,
  className = ''
}: ScenarioComparisonProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [enable3D, setEnable3D] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['emissions', 'modeshare', 'vmt']);
  const [chartData, setChartData] = useState<any>(null);
  const [benefitCostResults, setBenefitCostResults] = useState<any>(null);
  const [isLoadingBenefitCost, setIsLoadingBenefitCost] = useState(false);
  const [greenChampResults, setGreenChampResults] = useState<any>(null);
  const [isRunningModel, setIsRunningModel] = useState(false);
  
  // Handle map load
  const handleMapLoad = (map: mapboxgl.Map) => {
    setMapInstance(map);
    setIsMapLoaded(true);
    
    if (enable3D) {
      enable3DTerrain(map);
    }
  };
  
  // Toggle 3D terrain
  useEffect(() => {
    if (mapInstance) {
      if (enable3D) {
        enable3DTerrain(mapInstance);
      } else {
        mapInstance.setTerrain(null);
      }
    }
  }, [enable3D, mapInstance]);
  
  // Process scenario data for charts when scenarios change
  useEffect(() => {
    if (scenarios.length > 0 && Object.keys(scenarioResults).length > 0) {
      processChartData();
    }
  }, [scenarios, scenarioResults]);
  
  // Process chart data from scenario results
  const processChartData = () => {
    // Example processing of emissions data
    const emissionsData = scenarios.map(scenario => {
      const result = scenarioResults[scenario.id] || {};
      return {
        name: scenario.name,
        emissions: result.emissions?.total || 0,
        vmt: result.vmt?.total || 0,
        vht: result.vht?.total || 0,
        modeshare: {
          car: result.modeshare?.car || 0,
          transit: result.modeshare?.transit || 0,
          bike: result.modeshare?.bike || 0,
          walk: result.modeshare?.walk || 0
        }
      };
    });
    
    setChartData(emissionsData);
  };
  
  // Run benefit-cost analysis
  const runBenefitCostAnalysis = async () => {
    setIsLoadingBenefitCost(true);
    
    try {
      // This would be an API call in a real application
      // Mocked for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock benefit-cost results
      const results = scenarios.map(scenario => {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          netPresentValue: Math.random() * 1000000 - 200000,
          benefitCostRatio: 1 + Math.random() * 3,
          internalRateOfReturn: Math.random() * 0.15,
          paybackPeriod: 5 + Math.random() * 10,
          totalBenefits: Math.random() * 2000000,
          totalCosts: Math.random() * 1000000,
          benefits: {
            travelTime: Math.random() * 500000,
            emissions: Math.random() * 300000,
            safety: Math.random() * 400000,
            maintenance: Math.random() * 200000
          },
          costs: {
            capital: Math.random() * 800000,
            operations: Math.random() * 200000
          }
        };
      });
      
      setBenefitCostResults(results);
      
      toast({
        title: "Analysis Complete",
        description: "Benefit-cost analysis results are ready",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to run benefit-cost analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBenefitCost(false);
    }
  };
  
  // Run GreenChAMP model
  const runGreenChampModel = async () => {
    setIsRunningModel(true);
    
    try {
      // This would be an API call in a real application
      // Mocked for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock GreenChAMP results with GeoJSON for the map
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: scenarios.flatMap((scenario, scenarioIndex) => {
          // Generate some random links for each scenario
          return Array.from({ length: 20 }).map((_, i) => {
            const startLng = -122.4194 - 0.02 + (Math.random() * 0.04);
            const startLat = 37.7749 - 0.02 + (Math.random() * 0.04);
            const endLng = startLng + (Math.random() * 0.02 - 0.01);
            const endLat = startLat + (Math.random() * 0.02 - 0.01);
            
            // Volume increases with scenario index (future scenarios have more traffic)
            const baseVolume = 500 + (i * 200);
            const scenarioFactor = 1 + (scenarioIndex * 0.2);
            
            return {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [startLng, startLat],
                  [endLng, endLat]
                ]
              },
              properties: {
                id: `link-${scenarioIndex}-${i}`,
                scenarioId: scenario.id,
                volume: baseVolume * scenarioFactor,
                v_c_ratio: (baseVolume * scenarioFactor) / 2000,
                speed: 60 - (baseVolume * scenarioFactor) / 200
              }
            };
          });
        })
      };
      
      setGreenChampResults({
        network: mockGeoJSON,
        metrics: scenarios.reduce((acc, scenario) => {
          acc[scenario.id] = {
            vmt: 1000000 + (Math.random() * 500000),
            vht: 20000 + (Math.random() * 10000),
            emissions: 50000 + (Math.random() * 20000),
            congestion: {
              freeFlow: 30 + (Math.random() * 20),
              congested: 50 + (Math.random() * 30)
            }
          };
          return acc;
        }, {})
      });
      
      toast({
        title: "Model Run Complete",
        description: "GreenChAMP model results are ready for visualization",
      });
    } catch (error) {
      toast({
        title: "Model Run Failed",
        description: "Failed to run GreenChAMP model",
        variant: "destructive"
      });
    } finally {
      setIsRunningModel(false);
    }
  };
  
  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format number with commas
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Export comparison data
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const url = format === 'pdf' 
        ? await onExportPDF?.() 
        : await onExportExcel?.();
        
      if (url) {
        window.open(url, '_blank');
      }
      
      toast({
        title: "Export Successful",
        description: `Your comparison has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  // Early return if no scenarios
  if (scenarios.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <FileBarChart className="mx-auto h-12 w-12 mb-4 opacity-40" />
            <p>Select scenarios to compare</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <div>
              <CardTitle>Scenario Comparison</CardTitle>
              <CardDescription>
                Comparing {scenarios.length} scenarios
              </CardDescription>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setEnable3D(!enable3D)}
              >
                <Globe className="mr-1 h-4 w-4" />
                {enable3D ? '3D On' : '3D Off'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('excel')}
              >
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {scenarios.map((scenario) => (
              <Badge key={scenario.id} variant="outline" className="bg-background">
                {scenario.name}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="overview" 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="charts">
                <span className="hidden md:inline">Charts</span>
                <BarChart3 className="md:hidden h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="costbenefit">
                <span className="hidden md:inline">Cost/Benefit</span>
                <Calculator className="md:hidden h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="insights">
                <span className="hidden md:inline">AI Insights</span>
                <Sparkles className="md:hidden h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scenarios.map((scenario) => (
                    <Card key={scenario.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                        <CardDescription>
                          Created: {formatDate(scenario.created_at || scenario.createdAt || new Date().toISOString())}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm grid grid-cols-2 gap-2">
                          <div className="font-medium">Timeline:</div>
                          <div>{scenario.horizonYear || '2030'}</div>
                          
                          <div className="font-medium">Key Trends:</div>
                          <div>
                            {scenario.trends?.length 
                              ? scenario.trends.slice(0, 2).map((t: any) => t.name || t).join(', ') 
                              : 'None'}
                          </div>
                          
                          <div className="font-medium">Policies:</div>
                          <div>
                            {scenario.policies?.length 
                              ? scenario.policies.slice(0, 2).map((p: any) => p.name || p).join(', ')
                              : 'None'}
                          </div>
                        </div>
                        
                        {scenarioResults[scenario.id] && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>VMT Change:</span>
                                <span className="font-medium">
                                  {(scenarioResults[scenario.id].vmt?.percentChange || 0).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Emissions:</span>
                                <span className="font-medium">
                                  {formatNumber(scenarioResults[scenario.id].emissions?.total || 0)} kg CO₂e
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Transit Share:</span>
                                <span className="font-medium">
                                  {(scenarioResults[scenario.id].modeshare?.transit || 0).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GreenChAMP Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {greenChampResults ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            GreenChAMP model has been run for all scenarios. View results in the Map
                            and Charts tabs.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedTab('map')}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              View on Map
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedTab('charts')}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Charts
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Route className="h-12 w-12 mb-2 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-4">No GreenChAMP results yet</p>
                          <Button 
                            onClick={runGreenChampModel}
                            disabled={isRunningModel}
                          >
                            {isRunningModel ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <Cpu className="mr-2 h-4 w-4" />
                                Run GreenChAMP
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Benefit-Cost Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {benefitCostResults ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            Benefit-cost analysis has been run for all scenarios. View detailed 
                            results in the Cost/Benefit tab.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedTab('costbenefit')}
                            >
                              <Calculator className="mr-2 h-4 w-4" />
                              View Benefit-Cost Analysis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Calculator className="h-12 w-12 mb-2 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-4">No benefit-cost analysis yet</p>
                          <Button 
                            onClick={runBenefitCostAnalysis}
                            disabled={isLoadingBenefitCost}
                          >
                            {isLoadingBenefitCost ? (
                              <>Calculating...</>
                            ) : (
                              <>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Run Analysis
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-[500px] rounded-md overflow-hidden border">
                      <BaseMap
                        initialCenter={[-122.4194, 37.7749]}
                        initialZoom={12}
                        onMapLoad={handleMapLoad}
                        className="h-full w-full"
                        enable3D={enable3D}
                      >
                        {mapInstance && isMapLoaded && greenChampResults && (
                          <GeoJSONLayer
                            map={mapInstance}
                            sourceId="scenario-network"
                            layerId="scenario-network-layer"
                            data={greenChampResults.network}
                            layerType="line"
                            paint={{
                              'line-color': [
                                'match',
                                ['get', 'scenarioId'],
                                scenarios[0]?.id, '#3b82f6',
                                scenarios[1]?.id, '#ef4444',
                                scenarios[2]?.id, '#22c55e',
                                scenarios[3]?.id, '#eab308',
                                '#888888'
                              ],
                              'line-width': [
                                'interpolate',
                                ['linear'],
                                ['get', 'volume'],
                                0, 1,
                                5000, 8
                              ],
                              'line-opacity': 0.7
                            }}
                          />
                        )}
                      </BaseMap>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {scenarios.map((scenario, index) => (
                        <div
                          key={scenario.id}
                          className="flex items-center gap-1"
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: index === 0 
                                ? '#3b82f6' 
                                : index === 1 
                                  ? '#ef4444' 
                                  : index === 2 
                                    ? '#22c55e' 
                                    : '#eab308' 
                            }}
                          ></div>
                          <span className="text-sm">{scenario.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Traffic Volume Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {greenChampResults ? (
                        <div className="space-y-4">
                          <p className="text-sm">
                            The map shows traffic volume differences between scenarios. 
                            Line thickness indicates volume.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {scenarios.map(scenario => {
                              const metrics = greenChampResults.metrics[scenario.id];
                              if (!metrics) return null;
                              
                              return (
                                <Card key={scenario.id} className="border-0 shadow-none">
                                  <CardHeader className="p-3">
                                    <CardTitle className="text-base">{scenario.name}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0">
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span>Daily VMT:</span>
                                        <span className="font-medium">
                                          {formatNumber(metrics.vmt)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Daily VHT:</span>
                                        <span className="font-medium">
                                          {formatNumber(metrics.vht)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Avg. Speed:</span>
                                        <span className="font-medium">
                                          {(metrics.vmt / metrics.vht).toFixed(1)} mph
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-muted-foreground">
                          No GreenChAMP results available yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Congestion Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {greenChampResults ? (
                        <div className="space-y-4">
                          <p className="text-sm">
                            Compare congestion levels across scenarios.
                          </p>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {scenarios.map(scenario => {
                              const metrics = greenChampResults.metrics[scenario.id];
                              if (!metrics?.congestion) return null;
                              
                              const congestion = metrics.congestion;
                              const congestionRatio = congestion.congested / congestion.freeFlow;
                              
                              return (
                                <div key={scenario.id} className="flex justify-between items-center">
                                  <div className="w-1/4">
                                    <span className="text-sm font-medium">{scenario.name}</span>
                                  </div>
                                  <div className="w-2/3">
                                    <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full" 
                                        style={{ 
                                          width: `${Math.min(congestionRatio * 50, 100)}%`,
                                          background: congestionRatio < 1.2 
                                            ? '#22c55e' 
                                            : congestionRatio < 1.5 
                                              ? '#eab308' 
                                              : '#ef4444'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="w-1/6 text-right">
                                    <span className="text-sm font-medium">
                                      {congestionRatio.toFixed(2)}x
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-muted-foreground">
                          No congestion analysis available yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="charts" className="mt-4">
              {chartData ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['emissions', 'vmt', 'modeshare'].map(metric => (
                      <Button
                        key={metric}
                        variant={selectedMetrics.includes(metric) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedMetrics.includes(metric)) {
                            setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                          } else {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          }
                        }}
                        className="capitalize"
                      >
                        {metric === 'vmt' ? 'VMT' : metric}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMetrics.includes('emissions') && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Emissions Comparison</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                          <div className="w-full text-center">
                            {/* Mock chart - would be replaced with actual chart component */}
                            <div className="flex h-52 items-end justify-around">
                              {chartData.map((item: any, index: number) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div 
                                    className="w-10 bg-primary rounded-t-sm mx-2"
                                    style={{ 
                                      height: `${(item.emissions / Math.max(...chartData.map((d: any) => d.emissions))) * 200}px`,
                                      backgroundColor: index === 0 
                                        ? '#3b82f6' 
                                        : index === 1 
                                          ? '#ef4444' 
                                          : index === 2 
                                            ? '#22c55e' 
                                            : '#eab308'
                                    }}
                                  ></div>
                                  <div className="mt-2 text-xs font-medium truncate max-w-24">
                                    {item.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedMetrics.includes('vmt') && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">VMT Comparison</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                          <div className="w-full text-center">
                            {/* Mock chart - would be replaced with actual chart component */}
                            <div className="flex h-52 items-end justify-around">
                              {chartData.map((item: any, index: number) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div 
                                    className="w-10 bg-primary rounded-t-sm mx-2"
                                    style={{ 
                                      height: `${(item.vmt / Math.max(...chartData.map((d: any) => d.vmt))) * 200}px`,
                                      backgroundColor: index === 0 
                                        ? '#3b82f6' 
                                        : index === 1 
                                          ? '#ef4444' 
                                          : index === 2 
                                            ? '#22c55e' 
                                            : '#eab308'
                                    }}
                                  ></div>
                                  <div className="mt-2 text-xs font-medium truncate max-w-24">
                                    {item.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedMetrics.includes('modeshare') && (
                      <Card className="md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Mode Share Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {chartData.map((item: any, index: number) => (
                              <Card key={index} className="border-0 shadow-none">
                                <CardHeader className="p-3">
                                  <CardTitle className="text-base">{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  {/* Mock stacked bar chart */}
                                  <div className="w-full h-6 flex rounded-full overflow-hidden mb-2">
                                    <div 
                                      style={{ 
                                        width: `${item.modeshare.car}%`,
                                        backgroundColor: '#ef4444' 
                                      }}
                                    ></div>
                                    <div 
                                      style={{ 
                                        width: `${item.modeshare.transit}%`,
                                        backgroundColor: '#3b82f6' 
                                      }}
                                    ></div>
                                    <div 
                                      style={{ 
                                        width: `${item.modeshare.bike}%`,
                                        backgroundColor: '#22c55e' 
                                      }}
                                    ></div>
                                    <div 
                                      style={{ 
                                        width: `${item.modeshare.walk}%`,
                                        backgroundColor: '#eab308' 
                                      }}
                                    ></div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-[#ef4444] mr-1"></div>
                                      <span>Car: {item.modeshare.car}%</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-[#3b82f6] mr-1"></div>
                                      <span>Transit: {item.modeshare.transit}%</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-[#22c55e] mr-1"></div>
                                      <span>Bike: {item.modeshare.bike}%</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-[#eab308] mr-1"></div>
                                      <span>Walk: {item.modeshare.walk}%</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No chart data available yet</p>
                      {scenarios.length > 0 && (
                        <Button 
                          className="mt-4"
                          variant="outline"
                          onClick={processChartData}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Generate Charts
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="costbenefit" className="mt-4">
              {benefitCostResults ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {benefitCostResults.map((result: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{result.scenarioName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-y-2">
                              <div className="font-medium">Benefit-Cost Ratio:</div>
                              <div className={`font-bold ${result.benefitCostRatio >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                                {result.benefitCostRatio.toFixed(2)}
                              </div>
                              
                              <div className="font-medium">Net Present Value:</div>
                              <div className={`font-bold ${result.netPresentValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {formatCurrency(result.netPresentValue)}
                              </div>
                              
                              <div className="font-medium">IRR:</div>
                              <div className="font-bold">
                                {(result.internalRateOfReturn * 100).toFixed(1)}%
                              </div>
                              
                              <div className="font-medium">Payback Period:</div>
                              <div className="font-bold">
                                {result.paybackPeriod.toFixed(1)} years
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Benefits and Costs</h4>
                              
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                  <span>Total Benefits:</span>
                                  <span className="font-medium">{formatCurrency(result.totalBenefits)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Total Costs:</span>
                                  <span className="font-medium">{formatCurrency(result.totalCosts)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <h4 className="text-sm font-medium mb-2">Benefit Breakdown</h4>
                              {/* Simple bar chart for benefits */}
                              {Object.entries(result.benefits).map(([key, value]) => (
                                <div key={key} className="mb-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="capitalize">{key}:</span>
                                    <span>{formatCurrency(value as number)}</span>
                                  </div>
                                  <div className="w-full bg-muted h-1.5 rounded-full">
                                    <div 
                                      className="h-full bg-primary rounded-full"
                                      style={{ 
                                        width: `${((value as number) / result.totalBenefits) * 100}%`,
                                        backgroundColor: key === 'travelTime' 
                                          ? '#3b82f6' 
                                          : key === 'emissions' 
                                            ? '#22c55e' 
                                            : key === 'safety' 
                                              ? '#ef4444' 
                                              : '#eab308'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Comparison Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm">
                          Based on the benefit-cost analysis, we recommend the scenario with the highest 
                          benefit-cost ratio:
                        </p>
                        
                        {(() => {
                          // Find best scenario
                          const bestScenarioIndex = benefitCostResults.reduce(
                            (bestIndex, current, index, array) => 
                              current.benefitCostRatio > array[bestIndex].benefitCostRatio ? index : bestIndex, 
                            0
                          );
                          
                          const bestScenario = benefitCostResults[bestScenarioIndex];
                          
                          return (
                            <div className="bg-muted/30 p-4 rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-bold">{bestScenario.scenarioName}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    BCR: <span className="font-medium">{bestScenario.benefitCostRatio.toFixed(2)}</span> | 
                                    NPV: <span className="font-medium">{formatCurrency(bestScenario.netPresentValue)}</span>
                                  </p>
                                </div>
                                <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full text-sm font-medium">
                                  Recommended
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-2">BCR Comparison</h4>
                          <div className="space-y-2">
                            {benefitCostResults.map((result: any, index: number) => (
                              <div key={index} className="flex items-center">
                                <div className="w-1/3 text-sm truncate">{result.scenarioName}</div>
                                <div className="w-2/3">
                                  <div className="w-full bg-muted h-4 rounded-full">
                                    <div 
                                      className="h-full rounded-full flex items-center px-2 text-xs text-white font-medium"
                                      style={{ 
                                        width: `${Math.min(result.benefitCostRatio / 4, 1) * 100}%`,
                                        backgroundColor: result.benefitCostRatio >= 1 
                                          ? '#22c55e' 
                                          : '#ef4444'
                                      }}
                                    >
                                      {result.benefitCostRatio.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No benefit-cost analysis data available yet</p>
                      {scenarios.length > 0 && (
                        <Button 
                          className="mt-4"
                          onClick={runBenefitCostAnalysis}
                          disabled={isLoadingBenefitCost}
                        >
                          {isLoadingBenefitCost ? (
                            <>Calculating...</>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-4 w-4" />
                              Run Benefit-Cost Analysis
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      AI-Powered Scenario Insights
                    </CardTitle>
                    {scenarios.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRegenerateInsights}
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Regenerate
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <ComparisonInsights 
                      scenarios={scenarios}
                      organizationId={organizationId}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 