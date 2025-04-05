"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  ArrowLeftIcon,
  BarChart2Icon, 
  BarChartIcon,
  CarIcon,
  ClockIcon,
  CloudIcon,
  DownloadIcon,
  FileDownIcon,
  FileTextIcon,
  HeartIcon,
  MapIcon,
  SaveIcon,
  TableIcon,
  TrainIcon,
  UserIcon
} from "lucide-react";
import { MapboxProvider } from '@/contexts/mapbox-context';
import MapboxMap from '@/components/ui/mapbox-map';
import { MapboxSource } from '@/components/ui/mapbox-source';
import { MapboxLayer } from '@/components/ui/mapbox-layer';

// Mock model data
const mockModel = {
  id: "model1",
  name: "Downtown Transportation Plan 2024",
  status: "completed",
  createdAt: "2024-03-15T10:30:00Z",
  createdBy: "John Smith",
  baseYear: 2023,
  region: "Metro County",
  lastRun: "2024-03-15T14:45:00Z",
  description: "Comprehensive model for downtown transportation planning",
  results: {
    summary: {
      totalTrips: 158426,
      vehicleMilesTraveled: 783542,
      vehicleHoursTraveled: 24356,
      averageSpeed: 32.2,
      congestionHours: 5628,
      transitRidership: 31685,
      bikeTrips: 8452,
      walkTrips: 14236,
      co2Emissions: 342.8, // tons
      timeOfDayDistribution: {
        amPeak: 28,
        midday: 36,
        pmPeak: 31,
        other: 5
      }
    },
    modeShare: {
      car: 65.2,
      transit: 20.0,
      bike: 5.3,
      walk: 9.0,
      other: 0.5
    },
    tripPurpose: {
      work: 31.5,
      school: 13.8,
      shopping: 26.3,
      recreation: 17.7,
      other: 10.7
    },
    environmentalImpact: {
      co2: 342.8,
      nox: 1.2,
      pm25: 0.3,
      energyConsumption: 3428, // gallons
    },
    equity: {
      accessibilityScores: {
        lowIncome: 72,
        mediumIncome: 85,
        highIncome: 92
      },
      transitAccess: {
        lowIncome: 68,
        mediumIncome: 58,
        highIncome: 42
      }
    },
    networkPerformance: {
      congestion: {
        severelyCongestedMiles: 28,
        moderatelyCongestedMiles: 87,
        freeFlowingMiles: 412
      },
      topCongestedCorridors: [
        { id: "c1", name: "Main St", vic: 1.2, delay: 342 },
        { id: "c2", name: "Broadway", vic: 1.1, delay: 267 },
        { id: "c3", name: "Park Ave", vic: 1.0, delay: 218 },
        { id: "c4", name: "Oak St", vic: 0.95, delay: 186 },
        { id: "c5", name: "River Rd", vic: 0.9, delay: 143 }
      ]
    }
  }
};

export default function ModelResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [model, setModel] = useState(mockModel); // In a real app, this would be loaded from API
  const [activeTab, setActiveTab] = useState("summary");

  // In a real implementation, we would fetch the model data
  useEffect(() => {
    // Simulating API call
    const fetchModelData = async () => {
      // This would be an API call with the model ID
      // For now, just using mock data
      if (params && params.id) {
        // setModel(await getModelData(params.id));
      }
    };

    fetchModelData();
  }, [params]);

  const formatNumber = (num, decimals = 0) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/modeling/greenchamp/runs")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{model.name}</h1>
              {getStatusBadge(model.status)}
            </div>
            <p className="text-muted-foreground">{model.description}</p>
          </div>
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Export Results
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model Run Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-lg font-medium">
                <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                {formatDate(model.lastRun)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Base Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-lg font-medium">
                <TableIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                {model.baseYear}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-lg font-medium">
                <MapIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                {model.region}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="summary" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Summary
            </TabsTrigger>
            <TabsTrigger value="mode-share" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Mode Share
            </TabsTrigger>
            <TabsTrigger value="congestion" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Congestion
            </TabsTrigger>
            <TabsTrigger value="environment" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Environment
            </TabsTrigger>
            <TabsTrigger value="equity" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Equity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>
                  Summary of key travel demand metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.totalTrips)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Vehicle Miles Traveled</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.vehicleMilesTraveled)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Transit Ridership</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.transitRidership)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Average Speed (mph)</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.averageSpeed, 1)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Bike Trips</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.bikeTrips)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Walk Trips</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.walkTrips)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">CO2 Emissions (tons)</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.co2Emissions, 1)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Vehicle Hours Traveled</p>
                    <p className="text-2xl font-bold">{formatNumber(model.results.summary.vehicleHoursTraveled)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trip Purpose Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of trips by purpose
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                    <div className="text-center">
                      <BarChartIcon className="h-12 w-12 mx-auto text-primary/30" />
                      <p className="mt-2 text-sm text-muted-foreground">Trip Purpose Visualization</p>
                      <p className="text-xs text-muted-foreground">
                        Work: {model.results.tripPurpose.work}%,
                        School: {model.results.tripPurpose.school}%,
                        Shopping: {model.results.tripPurpose.shopping}%,
                        Recreation: {model.results.tripPurpose.recreation}%,
                        Other: {model.results.tripPurpose.other}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Time of Day Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of trips by time of day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                    <div className="text-center">
                      <BarChart2Icon className="h-12 w-12 mx-auto text-primary/30" />
                      <p className="mt-2 text-sm text-muted-foreground">Time of Day Visualization</p>
                      <p className="text-xs text-muted-foreground">
                        AM Peak: {model.results.summary.timeOfDayDistribution.amPeak}%,
                        Midday: {model.results.summary.timeOfDayDistribution.midday}%,
                        PM Peak: {model.results.summary.timeOfDayDistribution.pmPeak}%,
                        Other: {model.results.summary.timeOfDayDistribution.other}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="mode-share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mode Share Analysis</CardTitle>
                <CardDescription>
                  Breakdown of trips by transportation mode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <BarChartIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Mode Share Visualization</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                  <Card className="bg-transparent">
                    <CardContent className="p-4 text-center">
                      <CarIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-lg font-bold">{model.results.modeShare.car}%</p>
                      <p className="text-sm text-muted-foreground">Automobile</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-transparent">
                    <CardContent className="p-4 text-center">
                      <TrainIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-lg font-bold">{model.results.modeShare.transit}%</p>
                      <p className="text-sm text-muted-foreground">Transit</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-transparent">
                    <CardContent className="p-4 text-center">
                      <div className="mx-auto mb-2 text-orange-500 h-8 w-8 flex items-center justify-center">
                        🚲
                      </div>
                      <p className="text-lg font-bold">{model.results.modeShare.bike}%</p>
                      <p className="text-sm text-muted-foreground">Bicycle</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-transparent">
                    <CardContent className="p-4 text-center">
                      <div className="mx-auto mb-2 text-purple-500 h-8 w-8 flex items-center justify-center">
                        🚶
                      </div>
                      <p className="text-lg font-bold">{model.results.modeShare.walk}%</p>
                      <p className="text-sm text-muted-foreground">Walking</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-transparent">
                    <CardContent className="p-4 text-center">
                      <div className="mx-auto mb-2 text-gray-500 h-8 w-8 flex items-center justify-center">
                        🔄
                      </div>
                      <p className="text-lg font-bold">{model.results.modeShare.other}%</p>
                      <p className="text-sm text-muted-foreground">Other</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transit Ridership</CardTitle>
                  <CardDescription>Key transit performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 text-center space-y-4">
                    <div className="text-4xl font-bold">{formatNumber(model.results.summary.transitRidership)}</div>
                    <p className="text-sm text-muted-foreground">Daily Transit Trips</p>
                    
                    <div className="flex justify-center mt-4">
                      <div className="w-full max-w-md h-4 bg-gray-200 rounded-full">
                        <div 
                          className="h-4 bg-blue-500 rounded-full" 
                          style={{ width: `${model.results.modeShare.transit}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {model.results.modeShare.transit}% of all trips use transit
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Transportation</CardTitle>
                  <CardDescription>Walking and biking metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4">
                      <div className="text-3xl font-bold">{formatNumber(model.results.summary.bikeTrips)}</div>
                      <p className="text-sm text-muted-foreground">Daily Bike Trips</p>
                      <div className="mt-2 text-orange-500">{model.results.modeShare.bike}% of all trips</div>
                    </div>
                    
                    <div className="text-center p-4">
                      <div className="text-3xl font-bold">{formatNumber(model.results.summary.walkTrips)}</div>
                      <p className="text-sm text-muted-foreground">Daily Walk Trips</p>
                      <div className="mt-2 text-purple-500">{model.results.modeShare.walk}% of all trips</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-center">
                    <div className="text-xl font-bold">{formatNumber(model.results.summary.bikeTrips + model.results.summary.walkTrips)}</div>
                    <p className="text-sm text-muted-foreground">Total Active Transportation Trips</p>
                    <div className="mt-2 text-green-500">{model.results.modeShare.bike + model.results.modeShare.walk}% of all trips</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="congestion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Congestion Analysis</CardTitle>
                <CardDescription>
                  Detailed analysis of roadway congestion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[300px] relative rounded-md overflow-hidden">
                  <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 p-2 rounded shadow-md">
                    <div className="text-xs font-medium">Congestion Levels</div>
                    <div className="flex items-center mt-1 space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs">Severe (V/C > 1.0)</span>
                    </div>
                    <div className="flex items-center mt-1 space-x-1">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-xs">Moderate (V/C 0.8-1.0)</span>
                    </div>
                    <div className="flex items-center mt-1 space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Free-Flow (V/C &lt; 0.8)</span>
                    </div>
                  </div>
                  <MapboxProvider>
                    <MapboxMap 
                      initialViewState={{
                        longitude: -122.4194,
                        latitude: 37.7749,
                        zoom: 11,
                        pitch: 30
                      }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      className="w-full h-full"
                    >
                      <MapboxSource
                        id="congestion-data"
                        source={{
                          type: 'geojson',
                          data: {
                            type: 'FeatureCollection',
                            features: model.results.networkPerformance.topCongestedCorridors.map(corridor => ({
                              type: 'Feature',
                              properties: {
                                name: corridor.name,
                                vic: corridor.vic,
                                delay: corridor.delay,
                                congestionLevel: corridor.vic > 1.0 ? 'severe' : corridor.vic > 0.8 ? 'moderate' : 'low'
                              },
                              geometry: {
                                type: 'LineString',
                                // For demo purposes, we create a simple line around the center
                                coordinates: [
                                  [-122.4194 - 0.01, 37.7749 - 0.01],
                                  [-122.4194, 37.7749],
                                  [-122.4194 + 0.01, 37.7749 + 0.01]
                                ]
                              }
                            }))
                          }
                        }}
                      />
                      <MapboxLayer
                        id="congestion-lines"
                        type="line"
                        source="congestion-data"
                        paint={{
                          'line-color': [
                            'match',
                            ['get', 'congestionLevel'],
                            'severe', '#ef4444',
                            'moderate', '#f59e0b',
                            '#22c55e'
                          ],
                          'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            8, 1,
                            12, 3,
                            16, 7
                          ],
                          'line-opacity': 0.8
                        }}
                        layout={{
                          'line-cap': 'round',
                          'line-join': 'round'
                        }}
                      />
                      <MapboxLayer
                        id="congestion-labels"
                        type="symbol"
                        source="congestion-data"
                        paint={{
                          'text-color': '#374151',
                          'text-halo-color': '#ffffff',
                          'text-halo-width': 1
                        }}
                        layout={{
                          'text-field': ['get', 'name'],
                          'text-font': ['Open Sans Regular'],
                          'text-size': 12,
                          'text-offset': [0, 1],
                          'text-anchor': 'top',
                          'text-allow-overlap': false
                        }}
                        minzoom={10}
                      />
                    </MapboxMap>
                  </MapboxProvider>
                </div>
                 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card className="bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{formatNumber(model.results.networkPerformance.congestion.severelyCongestedMiles)}</p>
                      <p className="text-sm text-muted-foreground">Severely Congested Miles</p>
                      <p className="text-xs text-red-500 mt-1">(V/C &gt; 1.0)</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{formatNumber(model.results.networkPerformance.congestion.moderatelyCongestedMiles)}</p>
                      <p className="text-sm text-muted-foreground">Moderately Congested Miles</p>
                      <p className="text-xs text-amber-500 mt-1">(V/C 0.8-1.0)</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold">{formatNumber(model.results.networkPerformance.congestion.freeFlowingMiles)}</p>
                      <p className="text-sm text-muted-foreground">Free-Flowing Miles</p>
                      <p className="text-xs text-green-500 mt-1">(V/C &lt; 0.8)</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Congested Corridors</CardTitle>
                <CardDescription>
                  Most congested roadways in the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Corridor</TableHead>
                      <TableHead>V/C Ratio</TableHead>
                      <TableHead>Delay (hours)</TableHead>
                      <TableHead>Congestion Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.results.networkPerformance.topCongestedCorridors.map((corridor) => (
                      <TableRow key={corridor.id}>
                        <TableCell className="font-medium">{corridor.name}</TableCell>
                        <TableCell>{corridor.vic.toFixed(2)}</TableCell>
                        <TableCell>{formatNumber(corridor.delay)}</TableCell>
                        <TableCell>
                          {corridor.vic > 1.0 ? (
                            <Badge className="bg-red-500">Severe</Badge>
                          ) : corridor.vic > 0.8 ? (
                            <Badge className="bg-amber-500">Moderate</Badge>
                          ) : (
                            <Badge className="bg-green-500">Low</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="environment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact Analysis</CardTitle>
                <CardDescription>
                  Environmental impacts of transportation patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <CloudIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Emissions Visualization</p>
                  </div>
                </div>

                <div className="h-[300px] relative rounded-md overflow-hidden">
                  <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/80 p-2 rounded shadow-md">
                    <div className="text-xs font-medium">Emissions Intensity</div>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full mr-2"></div>
                      <span className="text-xs">High</span>
                    </div>
                  </div>
                  <MapboxProvider>
                    <MapboxMap 
                      initialViewState={{
                        longitude: -122.4194,
                        latitude: 37.7749,
                        zoom: 11
                      }}
                      mapStyle="mapbox://styles/mapbox/light-v11"
                      className="w-full h-full"
                    >
                      <MapboxSource
                        id="emissions-data"
                        source={{
                          type: 'geojson',
                          data: {
                            type: 'FeatureCollection',
                            features: Array.from({ length: 50 }).map((_, i) => ({
                              type: 'Feature',
                              properties: {
                                intensity: Math.random(),
                                emissions: Math.random() * 100
                              },
                              geometry: {
                                type: 'Point',
                                coordinates: [
                                  -122.4194 + (Math.random() * 0.1 - 0.05),
                                  37.7749 + (Math.random() * 0.1 - 0.05)
                                ]
                              }
                            }))
                          }
                        }}
                      />
                      <MapboxLayer
                        id="emissions-heatmap"
                        type="heatmap"
                        source="emissions-data"
                        paint={{
                          'heatmap-weight': ['get', 'intensity'],
                          'heatmap-intensity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 1,
                            15, 3
                          ],
                          'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(33,102,172,0)',
                            0.2, 'rgb(103,169,207)',
                            0.4, 'rgb(209,229,240)',
                            0.6, 'rgb(253,219,199)',
                            0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                          ],
                          'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2,
                            9, 20
                          ],
                          'heatmap-opacity': 0.8
                        }}
                      />
                    </MapboxMap>
                  </MapboxProvider>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">CO2 Emissions</p>
                      <p className="text-2xl font-bold">{formatNumber(model.results.environmentalImpact.co2, 1)}</p>
                      <p className="text-xs text-muted-foreground">tons per day</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">NOx Emissions</p>
                      <p className="text-2xl font-bold">{formatNumber(model.results.environmentalImpact.nox, 1)}</p>
                      <p className="text-xs text-muted-foreground">tons per day</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">PM2.5 Emissions</p>
                      <p className="text-2xl font-bold">{formatNumber(model.results.environmentalImpact.pm25, 1)}</p>
                      <p className="text-xs text-muted-foreground">tons per day</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">Fuel Consumption</p>
                      <p className="text-2xl font-bold">{formatNumber(model.results.environmentalImpact.energyConsumption)}</p>
                      <p className="text-xs text-muted-foreground">gallons per day</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Emissions Reduction Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm">
                        The mode share in this scenario results in <span className="font-bold text-green-600">12.5%</span> fewer CO2 emissions compared to the regional average, owing to higher transit usage and active transportation mode shares.
                      </p>
                      <p className="text-sm mt-2">
                        This represents a reduction of approximately <span className="font-bold text-green-600">49 tons</span> of CO2 emissions per day.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Health Benefits</CardTitle>
                <CardDescription>
                  Health impacts of active transportation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex flex-col items-center text-center space-y-2">
                    <HeartIcon className="h-8 w-8 text-red-500" />
                    <h3 className="text-lg font-medium">Physical Activity Benefits</h3>
                    <p className="text-sm text-muted-foreground">
                      The active transportation in this scenario provides the equivalent of 28,500 hours of physical activity per day, contributing to reduced risk of cardiovascular disease, diabetes, and other health conditions.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 flex flex-col items-center text-center space-y-2">
                    <CloudIcon className="h-8 w-8 text-green-500" />
                    <h3 className="text-lg font-medium">Air Quality Improvements</h3>
                    <p className="text-sm text-muted-foreground">
                      Reduced vehicle emissions contribute to improved air quality, with an estimated 0.8 tons reduction in criteria pollutants per day, which helps reduce respiratory illnesses in the region.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="equity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transportation Equity Analysis</CardTitle>
                <CardDescription>
                  Analysis of transportation equity across demographic groups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[300px] flex items-center justify-center bg-muted rounded-md">
                  <div className="text-center">
                    <UserIcon className="h-12 w-12 mx-auto text-primary/30" />
                    <p className="mt-2 text-sm text-muted-foreground">Equity Analysis Visualization</p>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Accessibility Score by Income Group</CardTitle>
                    <CardDescription>Higher scores indicate better access to jobs, services, and amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Low-Income Areas</span>
                          <span className="font-medium">{model.results.equity.accessibilityScores.lowIncome}/100</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${model.results.equity.accessibilityScores.lowIncome}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Medium-Income Areas</span>
                          <span className="font-medium">{model.results.equity.accessibilityScores.mediumIncome}/100</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${model.results.equity.accessibilityScores.mediumIncome}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>High-Income Areas</span>
                          <span className="font-medium">{model.results.equity.accessibilityScores.highIncome}/100</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-orange-500 rounded-full" 
                            style={{ width: `${model.results.equity.accessibilityScores.highIncome}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Transit Access by Income Group</CardTitle>
                    <CardDescription>Percentage of population with high-quality transit access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-transparent">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold">{model.results.equity.transitAccess.lowIncome}%</p>
                          <p className="text-sm text-muted-foreground">Low-Income Areas</p>
                          {model.results.equity.transitAccess.lowIncome > 50 ? (
                            <Badge className="mt-2 bg-green-500">Good Access</Badge>
                          ) : (
                            <Badge className="mt-2 bg-amber-500">Limited Access</Badge>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-transparent">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold">{model.results.equity.transitAccess.mediumIncome}%</p>
                          <p className="text-sm text-muted-foreground">Medium-Income Areas</p>
                          {model.results.equity.transitAccess.mediumIncome > 50 ? (
                            <Badge className="mt-2 bg-green-500">Good Access</Badge>
                          ) : (
                            <Badge className="mt-2 bg-amber-500">Limited Access</Badge>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-transparent">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold">{model.results.equity.transitAccess.highIncome}%</p>
                          <p className="text-sm text-muted-foreground">High-Income Areas</p>
                          {model.results.equity.transitAccess.highIncome > 50 ? (
                            <Badge className="mt-2 bg-green-500">Good Access</Badge>
                          ) : (
                            <Badge className="mt-2 bg-amber-500">Limited Access</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Equity Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-sm">
                        This scenario shows a <span className="font-bold text-blue-600">lower equity gap</span> than the regional baseline, with accessibility scores for low-income areas only 20 points below high-income areas (compared to 30 points in the baseline).
                      </p>
                      <p className="text-sm mt-2">
                        Transit access is <span className="font-bold text-green-600">significantly higher in low-income areas</span>, which helps improve mobility for transit-dependent populations. However, further improvements are needed to reach equity targets.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 