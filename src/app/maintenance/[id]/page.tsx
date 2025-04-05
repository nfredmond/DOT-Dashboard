"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { getAssets, getMaintenancePredictions, getAssetMaintenanceAnalysis, scheduleAssetMaintenance, Asset, MaintenancePrediction } from "@/lib/predictive-maintenance";

// Icons
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  WrenchIcon,
  HistoryIcon,
  AlertTriangleIcon,
  BarChart4Icon,
  FileTextIcon,
  SaveIcon
} from "lucide-react";

export default function AssetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [prediction, setPrediction] = useState<MaintenancePrediction | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [maintenanceDate, setMaintenanceDate] = useState<Date | undefined>(undefined);
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [schedulingMaintenance, setSchedulingMaintenance] = useState(false);
  
  // Fetch asset data
  useEffect(() => {
    async function loadAssetData() {
      try {
        const assets = await getAssets();
        const asset = assets.find(a => a.id === params.id);
        
        if (asset) {
          setAsset(asset);
          
          // Load prediction for this asset
          const predictions = await getMaintenancePredictions([asset.id]);
          if (predictions && predictions.length > 0) {
            setPrediction(predictions[0]);
          }
        }
      } catch (error) {
        console.error("Error loading asset data:", error);
        toast({
          title: "Error",
          description: "Failed to load asset data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadAssetData();
  }, [params.id]);
  
  // Load AI analysis
  const loadAnalysis = async () => {
    if (!asset) return;
    
    try {
      setAnalysisLoading(true);
      const analysisText = await getAssetMaintenanceAnalysis(asset.id);
      setAnalysis(analysisText);
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast({
        title: "Error",
        description: "Failed to generate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  // Handle scheduling maintenance
  const handleScheduleMaintenance = async () => {
    if (!asset || !maintenanceDate) {
      toast({
        title: "Error",
        description: "Please select a maintenance date.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSchedulingMaintenance(true);
      
      // Format date as ISO string
      const dateString = maintenanceDate.toISOString();
      
      // Schedule the maintenance
      const success = await scheduleAssetMaintenance(
        asset.id,
        dateString,
        maintenanceNotes
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "Maintenance has been scheduled successfully.",
        });
        
        // Update prediction status if available
        if (prediction) {
          const updatedPrediction = { ...prediction, status: "scheduled" as const };
          setPrediction(updatedPrediction);
        }
      }
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      toast({
        title: "Error",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSchedulingMaintenance(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  // Get priority badge class
  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-500";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-500";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-500";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-500";
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-500";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-500";
      case "in-progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-500";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-500";
      case "deferred":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-500";
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Asset not found
  if (!asset) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/maintenance")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Asset Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangleIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Asset Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The requested asset could not be found or has been removed.
            </p>
            <Button 
              className="mt-6"
              onClick={() => router.push("/maintenance")}
            >
              Return to Maintenance Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-2"
          onClick={() => router.push("/maintenance")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{asset.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} • ID: {asset.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Description</h3>
                  <p className="text-muted-foreground mt-1">
                    {asset.description || "No description available"}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                      <div className="flex items-center mt-1">
                        <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {asset.location.address || 
                            `${asset.location.latitude.toFixed(4)}, ${asset.location.longitude.toFixed(4)}`}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Installation Date</h4>
                      <div className="flex items-center mt-1">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDate(asset.installedDate)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Inspection</h4>
                      <div className="flex items-center mt-1">
                        <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDate(asset.lastInspection)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Condition</h4>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${
                              asset.condition >= 80 ? "bg-green-500" :
                              asset.condition >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${asset.condition}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {asset.condition}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Maintenance</h4>
                      <div className="flex items-center mt-1">
                        <WrenchIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDate(asset.lastMaintenance)}</span>
                      </div>
                    </div>
                    
                    {prediction && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                        <div className="flex items-center mt-1">
                          <Badge className={getStatusBadgeClass(prediction.status)}>
                            {prediction.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                          
                          {prediction.priority && (
                            <Badge className={`ml-2 ${getPriorityBadgeClass(prediction.priority)}`}>
                              {prediction.priority.charAt(0).toUpperCase() + prediction.priority.slice(1)} Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="prediction">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prediction">Maintenance Prediction</TabsTrigger>
              <TabsTrigger value="analysis">
                AI Analysis
                {analysisLoading && <span className="ml-2 animate-spin">⟳</span>}
              </TabsTrigger>
              <TabsTrigger value="history">Maintenance History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prediction" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Prediction</CardTitle>
                  <CardDescription>
                    AI-powered maintenance predictions for this asset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prediction ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground">Failure Probability</h4>
                          <div className="mt-2 flex items-center">
                            <span className={`text-2xl font-bold ${
                              prediction.failureProbability >= 0.7 ? "text-red-500" :
                              prediction.failureProbability >= 0.4 ? "text-orange-500" :
                              "text-green-500"
                            }`}>
                              {Math.round(prediction.failureProbability * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground">Time to Failure</h4>
                          <div className="mt-2 flex items-center">
                            <ClockIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-2xl font-bold">
                              {prediction.timeToFailure} days
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium text-muted-foreground">Estimated Cost</h4>
                          <div className="mt-2">
                            <span className="text-2xl font-bold">
                              ${prediction.estimatedCost?.toLocaleString() || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Recommended Action</h3>
                        <p className="text-muted-foreground mt-2">
                          {prediction.recommendedAction}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium">Schedule Maintenance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="text-sm font-medium">Maintenance Date</label>
                            <div className="mt-1.5">
                              <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={maintenanceDate ? maintenanceDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => setMaintenanceDate(e.target.value ? new Date(e.target.value) : undefined)}
                                disabled={prediction.status !== "pending"}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea
                              className="mt-1.5"
                              placeholder="Enter any notes for the maintenance team"
                              value={maintenanceNotes}
                              onChange={(e) => setMaintenanceNotes(e.target.value)}
                              disabled={prediction.status !== "pending"}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={handleScheduleMaintenance}
                            disabled={
                              prediction.status !== "pending" ||
                              !maintenanceDate ||
                              schedulingMaintenance
                            }
                          >
                            {schedulingMaintenance ? (
                              <>
                                <span className="mr-2 animate-spin">⟳</span>
                                Scheduling...
                              </>
                            ) : (
                              <>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Schedule Maintenance
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertTriangleIcon className="h-16 w-16 text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold">No Prediction Available</h2>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        There is no maintenance prediction available for this asset.
                        Run predictions from the maintenance dashboard to generate one.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>AI Analysis</CardTitle>
                      <CardDescription>
                        Detailed analysis of asset condition and maintenance needs
                      </CardDescription>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAnalysis}
                      disabled={analysisLoading}
                    >
                      {analysisLoading ? (
                        <>
                          <span className="mr-2 animate-spin">⟳</span>
                          Analyzing...
                        </>
                      ) : analysis ? (
                        <>
                          <FileTextIcon className="mr-2 h-4 w-4" />
                          Refresh Analysis
                        </>
                      ) : (
                        <>
                          <BarChart4Icon className="mr-2 h-4 w-4" />
                          Generate Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="whitespace-pre-line">{analysis}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BarChart4Icon className="h-16 w-16 text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold">No Analysis Available</h2>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        Generate an AI-powered analysis to get detailed insights about
                        this asset's condition and maintenance needs.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={loadAnalysis}
                        disabled={analysisLoading}
                      >
                        {analysisLoading ? "Analyzing..." : "Generate Analysis"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance History</CardTitle>
                  <CardDescription>
                    Past maintenance activities for this asset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {asset.lastMaintenance ? (
                      <div className="border-l-2 border-muted pl-4 space-y-6">
                        <div className="relative">
                          <div className="absolute -left-[25px] rounded-full bg-primary p-1">
                            <WrenchIcon className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-base font-medium">Routine Maintenance</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(asset.lastMaintenance)}</p>
                            <p className="mt-2">
                              Regular maintenance performed including inspection of all components
                              and replacement of worn parts.
                            </p>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <div className="absolute -left-[25px] rounded-full bg-muted p-1">
                            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-base font-medium">Installation</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(asset.installedDate)}</p>
                            <p className="mt-2">
                              Initial installation and configuration completed.
                              Asset added to maintenance tracking system.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold">No History Available</h2>
                        <p className="text-muted-foreground mt-2">
                          There is no maintenance history available for this asset.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    ></circle>
                    <circle
                      className={`stroke-current ${
                        asset.condition >= 80 ? "text-green-500" :
                        asset.condition >= 50 ? "text-yellow-500" :
                        "text-red-500"
                      }`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${asset.condition * 2.51} 251.2`}
                      strokeDashoffset="0"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      transform="rotate(-90 50 50)"
                    ></circle>
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="text-3xl font-bold">{asset.condition}%</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Asset Condition Score
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {prediction && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Risk Assessment</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Failure Risk</span>
                        <span className={
                          prediction.failureProbability >= 0.7 ? "text-red-500" :
                          prediction.failureProbability >= 0.4 ? "text-orange-500" :
                          "text-green-500"
                        }>
                          {prediction.failureProbability >= 0.7 ? "High" :
                           prediction.failureProbability >= 0.4 ? "Medium" :
                           "Low"}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className={
                            prediction.failureProbability >= 0.7 ? "bg-red-500 h-2 rounded-full" :
                            prediction.failureProbability >= 0.4 ? "bg-orange-500 h-2 rounded-full" :
                            "bg-green-500 h-2 rounded-full"
                          }
                          style={{ width: `${prediction.failureProbability * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining Useful Life</span>
                        <span>
                          {prediction.timeToFailure} days
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className={
                            prediction.timeToFailure <= 30 ? "bg-red-500 h-2 rounded-full" :
                            prediction.timeToFailure <= 90 ? "bg-orange-500 h-2 rounded-full" :
                            "bg-green-500 h-2 rounded-full"
                          }
                          style={{ width: `${Math.min(100, (prediction.timeToFailure / 365) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <FileTextIcon className="mr-2 h-3.5 w-3.5" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <SaveIcon className="mr-2 h-3.5 w-3.5" />
                    Save Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                <MapPinIcon className="h-8 w-8 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Map View</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {asset.location.latitude.toFixed(6)}, {asset.location.longitude.toFixed(6)}
                {asset.location.address && (
                  <div className="mt-1">{asset.location.address}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 