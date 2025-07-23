"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeftIcon, BarChart3Icon, BoxIcon, CheckCircleIcon, EyeIcon, MoreHorizontalIcon, PlayIcon, RefreshCwIcon, SearchIcon, Trash2Icon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import BaseMap from '@/components/maps/BaseMap';
import { loadGreenChampResults, enable3DTerrain } from '@/lib/map-utils';

export default function GreenChampRunsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  // Load runs
  const loadRuns = async () => {
    setIsLoadingRuns(true);
    
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      
      // Mock data
      const mockRuns = [
        {
          id: '1',
          name: 'Downtown Transit Plan 2023',
          description: 'Travel demand model for downtown transit improvements',
          status: 'completed',
          createdAt: '2023-09-10T14:20:00Z',
          completedAt: '2023-09-10T14:50:00Z',
          baseYear: 2023,
          futureYear: 2030,
          metrics: {
            vmt: 10000000,
            ridershipIncrease: 12.5,
            congestionReduction: 8.2,
            totalTrips: 350000
          }
        },
        {
          id: '2',
          name: 'Highway Expansion Analysis',
          description: 'Travel demand forecasting for highway expansion project',
          status: 'completed',
          createdAt: '2023-09-05T10:15:00Z',
          completedAt: '2023-09-05T10:48:00Z',
          baseYear: 2023,
          futureYear: 2035,
          metrics: {
            vmt: 15000000,
            ridershipIncrease: -2.1,
            congestionReduction: 15.3,
            totalTrips: 420000
          }
        },
        {
          id: '3',
          name: 'Bike Lane Network Model',
          description: 'Analysis of proposed citywide bike lane network',
          status: 'running',
          createdAt: '2023-09-12T08:30:00Z',
          completedAt: null,
          progress: 78,
          baseYear: 2023,
          futureYear: 2030,
          metrics: null
        },
        {
          id: '4',
          name: 'Regional Transit Integration',
          description: 'Model for regional transit coordination',
          status: 'failed',
          createdAt: '2023-09-08T11:45:00Z',
          failedAt: '2023-09-08T11:53:00Z',
          error: 'Data integrity error in zone system',
          baseYear: 2023,
          futureYear: 2040,
          metrics: null
        },
        {
          id: '5',
          name: 'TOD Impact Analysis',
          description: 'Transit-oriented development impact analysis',
          status: 'completed',
          createdAt: '2023-08-28T09:15:00Z',
          completedAt: '2023-08-28T09:45:00Z',
          baseYear: 2023,
          futureYear: 2045,
          metrics: {
            vmt: 8500000,
            ridershipIncrease: 18.7,
            congestionReduction: 5.9,
            totalTrips: 380000
          }
        }
      ];
      
      setRuns(mockRuns);
      
      // Auto-select the first completed run
      const firstCompletedRun = mockRuns.find(run => run.status === 'completed');
      if (firstCompletedRun) {
        setSelectedRun(firstCompletedRun);
      }
    } catch (error) {
      console.error('Error loading runs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load model runs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRuns(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRunAction = (action: string, run: any) => {
    switch (action) {
      case 'view':
        setSelectedRun(run);
        break;
      case 'rerun':
        toast({
          title: 'Model Queued',
          description: `${run.name} has been queued to run again.`,
        });
        break;
      case 'delete':
        toast({
          title: 'Model Deleted',
          description: `${run.name} has been deleted.`,
        });
        // Remove from list
        setRuns(runs.filter(r => r.id !== run.id));
        if (selectedRun?.id === run.id) {
          setSelectedRun(null);
        }
        break;
      default:
        break;
    }
  };

  const filteredRuns = runs.filter(run => {
    const matchesSearch = searchText === '' || 
      run.name.toLowerCase().includes(searchText.toLowerCase()) ||
      run.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'completed' && run.status === 'completed') ||
      (activeTab === 'running' && run.status === 'running') ||
      (activeTab === 'failed' && run.status === 'failed');
    
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-500">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleMapLoad = (map: mapboxgl.Map) => {
    setMapInstance(map);
    setMapLoaded(true);
    
    // Apply 3D terrain if enabled
    if (is3DEnabled) {
      enable3DTerrain(map);
    }
  };

  const toggle3D = () => {
    const newIs3DEnabled = !is3DEnabled;
    setIs3DEnabled(newIs3DEnabled);
    
    if (mapInstance) {
      if (newIs3DEnabled) {
        enable3DTerrain(mapInstance);
      } else {
        mapInstance.setTerrain(null);
      }
    }
  };

  const visualizeOnMap = async () => {
    if (!mapInstance || !selectedRun) return;
    
    setIsVisualizing(true);
    
    try {
      // In a real app, this would use the actual run ID
      const success = await loadGreenChampResults(mapInstance, selectedRun.id);
      
      if (success) {
        toast({
          title: "Visualization Complete",
          description: "Model results have been visualized on the map."
        });
      } else {
        throw new Error("Failed to visualize results");
      }
    } catch (error) {
      console.error("Error visualizing results:", error);
      toast({
        title: "Visualization Error",
        description: "Failed to visualize model results on the map.",
        variant: "destructive"
      });
    } finally {
      setIsVisualizing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-2"
              onClick={() => router.push("/modeling")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">GreenChAMP Model Runs</h1>
          </div>
          <Button onClick={() => router.push("/modeling/greenchamp/new")}>
            Create New Model
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Model Runs</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadRuns}>
                    <RefreshCwIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                <CardDescription>
                  View and manage your travel demand model runs
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div className="relative">
                    <SearchIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      className="pl-9"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="running">Running</TabsTrigger>
                      <TabsTrigger value="failed">Failed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
              
              <div className="p-0">
                {isLoadingRuns ? (
                  <div className="py-8 flex justify-center items-center">
                    <RefreshCwIcon className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading model runs...</span>
                  </div>
                ) : filteredRuns.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <BoxIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No model runs found</p>
                    {searchText && (
                      <p className="text-sm mt-1">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRuns.map((run) => (
                          <TableRow 
                            key={run.id} 
                            className={selectedRun?.id === run.id ? 'bg-muted/50' : ''}
                            onClick={() => setSelectedRun(run)}
                          >
                            <TableCell>
                              <div className="font-medium truncate max-w-[200px]">{run.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {run.description}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(run.status)}</TableCell>
                            <TableCell className="text-xs">
                              {formatDate(run.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-0">
                                  <div className="flex flex-col">
                                    <Button 
                                      variant="ghost" 
                                      className="justify-start px-2 py-1.5 h-9"
                                      onClick={() => handleRunAction('view', run)}
                                    >
                                      <EyeIcon className="h-4 w-4 mr-2" />
                                      View
                                    </Button>
                                    {run.status !== 'running' && (
                                      <Button 
                                        variant="ghost" 
                                        className="justify-start px-2 py-1.5 h-9"
                                        onClick={() => handleRunAction('rerun', run)}
                                      >
                                        <PlayIcon className="h-4 w-4 mr-2" />
                                        Run Again
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      className="justify-start text-red-500 px-2 py-1.5 h-9"
                                      onClick={() => handleRunAction('delete', run)}
                                    >
                                      <Trash2Icon className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-7 space-y-4">
            {selectedRun ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedRun.name}</CardTitle>
                        <CardDescription>{selectedRun.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(selectedRun.status)}
                        {selectedRun.status === 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={visualizeOnMap}
                            disabled={isVisualizing || !mapLoaded}
                          >
                            {isVisualizing ? (
                              <RefreshCwIcon className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <EyeIcon className="h-4 w-4 mr-1" />
                            )}
                            Visualize
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Base Year</div>
                        <div className="text-xl font-semibold">{selectedRun.baseYear}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Future Year</div>
                        <div className="text-xl font-semibold">{selectedRun.futureYear}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Created</div>
                        <div className="text-sm font-medium">{formatDate(selectedRun.createdAt)}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="text-sm font-medium flex items-center">
                          {selectedRun.status === 'completed' ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                              Completed
                            </>
                          ) : selectedRun.status === 'running' ? (
                            <>
                              <RefreshCwIcon className="h-4 w-4 text-blue-500 animate-spin mr-1" />
                              Running ({selectedRun.progress}%)
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                              Failed
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedRun.status === 'completed' && selectedRun.metrics && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Model Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs">Daily VMT</Label>
                              <div className="text-lg font-semibold">
                                {new Intl.NumberFormat().format(selectedRun.metrics.vmt)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Ridership Change</Label>
                              <div className={`text-lg font-semibold ${selectedRun.metrics.ridershipIncrease > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedRun.metrics.ridershipIncrease > 0 ? '+' : ''}
                                {selectedRun.metrics.ridershipIncrease.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Congestion Reduction</Label>
                              <div className="text-lg font-semibold text-green-600">
                                {selectedRun.metrics.congestionReduction.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Total Trips</Label>
                              <div className="text-lg font-semibold">
                                {new Intl.NumberFormat().format(selectedRun.metrics.totalTrips)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedRun.status === 'failed' && (
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start">
                            <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-red-800">Error Details</h4>
                              <p className="text-sm text-red-700">{selectedRun.error}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedRun.status === 'running' && (
                      <Card>
                        <CardContent className="pt-4">
                          <div>
                            <Label className="text-xs mb-2 block">Progress</Label>
                            <div className="bg-muted rounded-full h-2 mb-2">
                              <div 
                                className="bg-primary rounded-full h-2" 
                                style={{ width: `${selectedRun.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{selectedRun.progress}% complete</span>
                              <span>Step 3 of 4: Network assignment</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Spatial Visualization</CardTitle>
                      <Button variant="outline" size="sm" onClick={toggle3D}>
                        {is3DEnabled ? '2D View' : '3D View'}
                      </Button>
                    </div>
                    <CardDescription>
                      View model outputs on an interactive map
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[400px] relative">
                      <BaseMap
                        initialCenter={[-122.4194, 37.7749]} 
                        initialZoom={12}
                        className="h-full w-full rounded-b-lg"
                        onMapLoad={handleMapLoad}
                        enable3D={is3DEnabled}
                      />
                      {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <div className="text-center">
                            <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Model Run Selected</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Select a model run from the list to view details and results, or create a new model to start analyzing transportation patterns.
                  </p>
                  <Button onClick={() => router.push("/modeling/greenchamp/new")}>
                    Create New Model
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 