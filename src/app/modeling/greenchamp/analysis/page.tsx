"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  AlertCircleIcon,
  ArrowLeftIcon, 
  BarChart3Icon, 
  LineChartIcon, 
  MapIcon, 
  TableIcon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Add Mapbox components import
import { MapboxProvider } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import { MapboxSource } from '@/components/ui/mapbox-source';
import { MapboxLayer } from '@/components/ui/mapbox-layer';

export default function GreenChampAnalysisPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("corridor");
  const [_corridor, setCorridor] = useState<string>('corridor1');
  const [_scenario, setScenario] = useState<string>('scenario1');
  const [isLoading, setIsLoading] = useState(false);

  const handleRunAnalysis = (analysisType) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Analysis Complete",
        description: `${analysisType} analysis has been completed.`,
      });
    }, 2000);
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/modeling")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">GreenChAMP Analysis Tools</h1>
            <p className="text-muted-foreground">
              Advanced analysis tools for transportation planning
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="corridor" className="py-2">
              Corridor Analysis
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="py-2">
              Accessibility Analysis
            </TabsTrigger>
            <TabsTrigger value="emissions" className="py-2">
              Emissions Analysis
            </TabsTrigger>
            <TabsTrigger value="scenario" className="py-2">
              Scenario Comparison
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="corridor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Corridor Analysis</CardTitle>
                <CardDescription>
                  Analyze traffic patterns and performance for specific corridors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Corridor</Label>
                  <Select defaultValue="corridor1" onValueChange={setCorridor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select corridor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corridor1">Main Street</SelectItem>
                      <SelectItem value="corridor2">Broadway Avenue</SelectItem>
                      <SelectItem value="corridor3">Park Boulevard</SelectItem>
                      <SelectItem value="corridor4">River Road</SelectItem>
                      <SelectItem value="corridor5">Central Avenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Analysis Scenario</Label>
                  <Select defaultValue="scenario1" onValueChange={setScenario}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scenario1">Base Year (2023)</SelectItem>
                      <SelectItem value="scenario2">Future No Build (2035)</SelectItem>
                      <SelectItem value="scenario3">Future Build (2035)</SelectItem>
                      <SelectItem value="scenario4">Alternative 1 (2035)</SelectItem>
                      <SelectItem value="scenario5">Alternative 2 (2035)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Analysis Metrics</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="volume" defaultChecked />
                      <label htmlFor="volume" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Traffic Volume
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="speed" defaultChecked />
                      <label htmlFor="speed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Average Speed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="delay" defaultChecked />
                      <label htmlFor="delay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Delay
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vc" defaultChecked />
                      <label htmlFor="vc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        V/C Ratio
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="los" defaultChecked />
                      <label htmlFor="los" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Level of Service
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="transit" />
                      <label htmlFor="transit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Transit Performance
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Time Period</Label>
                  <RadioGroup defaultValue="pm-peak" className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="am-peak" id="am-peak" />
                      <Label htmlFor="am-peak">AM Peak (7-9 AM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pm-peak" id="pm-peak" />
                      <Label htmlFor="pm-peak">PM Peak (4-6 PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="midday" id="midday" />
                      <Label htmlFor="midday">Midday (10 AM-2 PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => handleRunAnalysis('Corridor')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run Analysis'}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Corridor Map</CardTitle>
                  <CardDescription>Map-based visualization</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <MapIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Corridor Map Visualization</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Chart</CardTitle>
                  <CardDescription>Travel time and speed by segment</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <LineChartIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Performance Chart Visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="accessibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Analysis</CardTitle>
                <CardDescription>
                  Analyze accessibility to key destinations for different population groups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Analysis Scenario</Label>
                    <Select defaultValue="scenario1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scenario1">Base Year (2023)</SelectItem>
                        <SelectItem value="scenario2">Future No Build (2035)</SelectItem>
                        <SelectItem value="scenario3">Future Build (2035)</SelectItem>
                        <SelectItem value="scenario4">Alternative 1 (2035)</SelectItem>
                        <SelectItem value="scenario5">Alternative 2 (2035)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Transportation Mode</Label>
                    <Select defaultValue="transit">
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automobile</SelectItem>
                        <SelectItem value="transit">Transit</SelectItem>
                        <SelectItem value="bike">Bicycle</SelectItem>
                        <SelectItem value="walk">Walking</SelectItem>
                        <SelectItem value="multimodal">Multimodal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Destination Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="jobs" defaultChecked />
                      <label htmlFor="jobs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Jobs
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="healthcare" defaultChecked />
                      <label htmlFor="healthcare" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Healthcare Facilities
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="groceries" defaultChecked />
                      <label htmlFor="groceries" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Grocery Stores
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="schools" />
                      <label htmlFor="schools" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Schools
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="parks" />
                      <label htmlFor="parks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Parks & Recreation
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="services" />
                      <label htmlFor="services" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Government Services
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Travel Time Thresholds</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minThreshold" className="text-sm text-muted-foreground">Minimum (minutes)</Label>
                      <Input
                        id="minThreshold"
                        type="number"
                        defaultValue="0"
                        min="0"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxThreshold" className="text-sm text-muted-foreground">Maximum (minutes)</Label>
                      <Input
                        id="maxThreshold"
                        type="number"
                        defaultValue="45"
                        min="1"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Demographic Analysis</Label>
                  <div className="text-sm text-muted-foreground mb-2">Select demographic groups for equity analysis</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="low-income" defaultChecked />
                      <label htmlFor="low-income" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Low-Income Households
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="minority" defaultChecked />
                      <label htmlFor="minority" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Minority Populations
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="zero-car" defaultChecked />
                      <label htmlFor="zero-car" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Zero-Car Households
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="seniors" />
                      <label htmlFor="seniors" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Senior Population
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => handleRunAnalysis('Accessibility')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run Analysis'}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Heat Map</CardTitle>
                  <CardDescription>Spatial distribution of accessibility</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] relative rounded-md overflow-hidden">
                  <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 p-2 rounded shadow-md text-xs space-y-1">
                    <div className="font-medium">Accessibility Score</div>
                    <div className="flex items-center">
                      <div className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <span>Poor</span>
                      <span>Good</span>
                    </div>
                  </div>
                  <MapboxProvider>
                    <MapboxMap 
                      initialViewState={{
                        longitude: -122.4194,
                        latitude: 37.7749,
                        zoom: 10.5
                      }}
                      mapStyle="mapbox://styles/mapbox/light-v11"
                      className="w-full h-full"
                    >
                      <MapboxSource
                        id="accessibility-data"
                        source={{
                          type: 'geojson',
                          data: {
                            type: 'FeatureCollection',
                            features: Array.from({ length: 20 }).map((_, i) => {
                              // Create random polygon for demo
                              const centerLon = -122.4194 + (Math.random() * 0.1 - 0.05);
                              const centerLat = 37.7749 + (Math.random() * 0.1 - 0.05);
                              const size = 0.01 + Math.random() * 0.01;
                              
                              return {
                                type: 'Feature',
                                properties: {
                                  accessibility: Math.random(),
                                  name: `Zone ${i + 1}`
                                },
                                geometry: {
                                  type: 'Polygon',
                                  coordinates: [[
                                    [centerLon - size, centerLat - size],
                                    [centerLon + size, centerLat - size],
                                    [centerLon + size, centerLat + size],
                                    [centerLon - size, centerLat + size],
                                    [centerLon - size, centerLat - size]
                                  ]]
                                }
                              };
                            })
                          }
                        }}
                      />
                      <MapboxLayer
                        id="accessibility-fill"
                        type="fill"
                        source="accessibility-data"
                        paint={{
                          'fill-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'accessibility'],
                            0, '#ef4444',
                            0.5, '#eab308',
                            1, '#22c55e'
                          ],
                          'fill-opacity': 0.7
                        }}
                      />
                      <MapboxLayer
                        id="accessibility-line"
                        type="line"
                        source="accessibility-data"
                        paint={{
                          'line-color': '#374151',
                          'line-width': 1,
                          'line-opacity': 0.5
                        }}
                      />
                      <MapboxLayer
                        id="accessibility-labels"
                        type="symbol"
                        source="accessibility-data"
                        layout={{
                          'text-field': ['get', 'name'],
                          'text-size': 10,
                          'text-allow-overlap': false
                        }}
                        paint={{
                          'text-color': '#000000',
                          'text-halo-color': '#ffffff',
                          'text-halo-width': 1
                        }}
                      />
                    </MapboxMap>
                  </MapboxProvider>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Demographic Analysis</CardTitle>
                  <CardDescription>Accessibility by demographic group</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <BarChart3Icon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Demographic Analysis Visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="emissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emissions Analysis</CardTitle>
                <CardDescription>
                  Analyze transportation emissions and air quality impacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Analysis Scenario</Label>
                    <Select defaultValue="scenario3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scenario1">Base Year (2023)</SelectItem>
                        <SelectItem value="scenario2">Future No Build (2035)</SelectItem>
                        <SelectItem value="scenario3">Future Build (2035)</SelectItem>
                        <SelectItem value="scenario4">Alternative 1 (2035)</SelectItem>
                        <SelectItem value="scenario5">Alternative 2 (2035)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Analysis Type</Label>
                    <Select defaultValue="region">
                      <SelectTrigger>
                        <SelectValue placeholder="Select analysis type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="region">Regional Analysis</SelectItem>
                        <SelectItem value="corridor">Corridor Analysis</SelectItem>
                        <SelectItem value="project">Project-Level Analysis</SelectItem>
                        <SelectItem value="census">Census Tract Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Emission Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="co2" defaultChecked />
                      <label htmlFor="co2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        CO2 (Greenhouse Gas)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nox" defaultChecked />
                      <label htmlFor="nox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        NOx (Nitrogen Oxides)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pm" defaultChecked />
                      <label htmlFor="pm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        PM2.5 (Particulate Matter)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="co" />
                      <label htmlFor="co" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        CO (Carbon Monoxide)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="voc" />
                      <label htmlFor="voc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        VOC (Volatile Organic Compounds)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="so2" />
                      <label htmlFor="so2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        SO2 (Sulfur Dioxide)
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Vehicle Fleet Assumptions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evShare" className="text-sm text-muted-foreground">Electric Vehicle Share (%)</Label>
                      <Input
                        id="evShare"
                        type="number"
                        defaultValue="15"
                        min="0"
                        max="100"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fleetAge" className="text-sm text-muted-foreground">Average Fleet Age (years)</Label>
                      <Input
                        id="fleetAge"
                        type="number"
                        defaultValue="8"
                        min="1"
                        max="20"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-md flex items-start gap-4">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Emissions Modeling Notice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Emissions calculations use MOVES3 emission rates adjusted for regional conditions. Results may vary based on fleet composition, driving patterns, and other factors.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => handleRunAnalysis('Emissions')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run Analysis'}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Emissions by Source</CardTitle>
                  <CardDescription>Breakdown of emissions by source type</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <BarChart3Icon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Emissions Source Visualization</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Spatial Distribution</CardTitle>
                  <CardDescription>Geographic distribution of emissions</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] relative rounded-md overflow-hidden">
                  <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 p-2 rounded shadow-md text-xs space-y-1">
                    <div className="font-medium">Emissions Intensity</div>
                    <div className="flex items-center">
                      <div className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <MapboxProvider>
                    <MapboxMap 
                      initialViewState={{
                        longitude: -122.4194,
                        latitude: 37.7749,
                        zoom: 10.5
                      }}
                      mapStyle="mapbox://styles/mapbox/dark-v11"
                      className="w-full h-full"
                    >
                      <MapboxSource
                        id="emissions-data"
                        source={{
                          type: 'geojson',
                          data: {
                            type: 'FeatureCollection',
                            features: Array.from({ length: 25 }).map((_, i) => {
                              // Create random polygon for demo
                              const centerLon = -122.4194 + (Math.random() * 0.1 - 0.05);
                              const centerLat = 37.7749 + (Math.random() * 0.1 - 0.05);
                              const size = 0.01 + Math.random() * 0.01;
                              
                              return {
                                type: 'Feature',
                                properties: {
                                  emissions: Math.random(),
                                  name: `Zone ${i + 1}`,
                                  pollutant: ['CO2', 'NOx', 'PM2.5'][Math.floor(Math.random() * 3)]
                                },
                                geometry: {
                                  type: 'Polygon',
                                  coordinates: [[
                                    [centerLon - size, centerLat - size],
                                    [centerLon + size, centerLat - size],
                                    [centerLon + size, centerLat + size],
                                    [centerLon - size, centerLat + size],
                                    [centerLon - size, centerLat - size]
                                  ]]
                                }
                              };
                            })
                          }
                        }}
                      />
                      <MapboxLayer
                        id="emissions-fill"
                        type="fill"
                        source="emissions-data"
                        paint={{
                          'fill-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'emissions'],
                            0, '#22c55e',
                            0.5, '#eab308',
                            1, '#ef4444'
                          ],
                          'fill-opacity': 0.8
                        }}
                      />
                      <MapboxLayer
                        id="emissions-line"
                        type="line"
                        source="emissions-data"
                        paint={{
                          'line-color': '#6b7280',
                          'line-width': 1,
                          'line-opacity': 0.5
                        }}
                      />
                      <MapboxLayer
                        id="emissions-labels"
                        type="symbol"
                        source="emissions-data"
                        layout={{
                          'text-field': ['concat', ['get', 'name'], ' (', ['get', 'pollutant'], ')'],
                          'text-size': 10,
                          'text-allow-overlap': false
                        }}
                        paint={{
                          'text-color': '#ffffff',
                          'text-halo-color': '#000000',
                          'text-halo-width': 1
                        }}
                      />
                    </MapboxMap>
                  </MapboxProvider>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="scenario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
                <CardDescription>
                  Compare multiple scenarios side by side
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Scenarios to Compare</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="base" defaultChecked />
                      <label htmlFor="base" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Base Year (2023)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="no-build" defaultChecked />
                      <label htmlFor="no-build" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Future No Build (2035)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="build" defaultChecked />
                      <label htmlFor="build" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Future Build (2035)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="alt1" />
                      <label htmlFor="alt1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Alternative 1 (2035)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="alt2" />
                      <label htmlFor="alt2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Alternative 2 (2035)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="high-growth" />
                      <label htmlFor="high-growth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        High Growth (2035)
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Comparison Metrics</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vmt" defaultChecked />
                      <label htmlFor="vmt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vehicle Miles Traveled
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vht" defaultChecked />
                      <label htmlFor="vht" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vehicle Hours Traveled
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="transit-share" defaultChecked />
                      <label htmlFor="transit-share" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Transit Mode Share
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="emissions-comp" defaultChecked />
                      <label htmlFor="emissions-comp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Emissions
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="access-comp" />
                      <label htmlFor="access-comp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Accessibility
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="equity-comp" />
                      <label htmlFor="equity-comp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Equity Metrics
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Comparison Area</Label>
                  <RadioGroup defaultValue="region" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="region" id="region-compare" />
                      <Label htmlFor="region-compare">Entire Region</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="study-area" id="study-area" />
                      <Label htmlFor="study-area">Study Area Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="corridor-compare" id="corridor-compare" />
                      <Label htmlFor="corridor-compare">Selected Corridor</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => handleRunAnalysis('Scenario Comparison')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run Comparison'}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="h-[400px] grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Scenario Comparison Chart</CardTitle>
                  <CardDescription>Side-by-side comparison of key metrics</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <BarChart3Icon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Side-by-Side Comparison Visualization</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Matrix</CardTitle>
                  <CardDescription>Metrics comparison table</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <TableIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Comparison Matrix Visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>
                  AI-powered analysis of scenario comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md space-y-4">
                  <p className="text-sm">
                    <span className="font-medium">Key Findings:</span> The Future Build scenario shows a 12% reduction in VMT compared to the No Build scenario, primarily due to increased transit mode share (+5.3 percentage points) and improved accessibility to jobs and services.
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Environmental Impacts:</span> CO2 emissions are projected to decrease by 15.7% in the Build scenario compared to No Build, with the largest reductions occurring in urban core areas with improved transit service.
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Equity Considerations:</span> The Build scenario provides greater accessibility improvements for low-income areas (+18%) compared to the regional average (+12%), helping to address existing transportation equity gaps.
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Recommendation:</span> Consider incorporating elements from Alternative 1, which shows stronger performance for active transportation metrics, into the preferred Build alternative to further enhance sustainability outcomes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 