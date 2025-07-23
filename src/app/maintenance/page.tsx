"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircleIcon,
  ClipboardCheckIcon,
  ClockIcon,
  DollarSignIcon,
  FilterIcon,
  SearchIcon,
  SettingsIcon,
  WrenchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAssets, getMaintenancePredictions, Asset, MaintenancePrediction } from "@/lib/predictive-maintenance";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  
  // Load assets and predictions
  useEffect(() => {
    async function loadData() {
      try {
        const assetsData = await getAssets();
        const predictionsData = await getMaintenancePredictions();
        
        setAssets(assetsData);
        setPredictions(predictionsData);
      } catch (error) {
        console.error("Error loading maintenance data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Filter predictions
  const filteredPredictions = predictions.filter((prediction) => {
    // Filter by search query
    const matchesSearch = 
      !searchQuery || 
      prediction.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prediction.recommendedAction?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by asset type
    const matchesType = 
      selectedAssetType === "all" ||
      prediction.assetType === selectedAssetType;
    
    // Filter by priority
    const matchesPriority = 
      selectedPriority === "all" ||
      prediction.priority === selectedPriority;
    
    // Filter by tab (status)
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "pending" && prediction.status === "pending") ||
      (activeTab === "scheduled" && prediction.status === "scheduled") ||
      (activeTab === "in-progress" && prediction.status === "in-progress") ||
      (activeTab === "completed" && prediction.status === "completed");
    
    return matchesSearch && matchesType && matchesPriority && matchesTab;
  });
  
  // Helper to get the asset
  const _getAsset = (assetId: string): Asset | undefined => {
    return assets.find(a => a.id === assetId);
  };
  
  // Helper for priority badge color
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
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-500";
    }
  };
  
  // Helper for status badge color
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
  
  // Format date for display
  const _formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Format cost for display
  const formatCost = (cost: number | undefined): string => {
    if (!cost && cost !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cost);
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
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive Maintenance</h1>
          <p className="text-muted-foreground">
            Analyze and manage infrastructure maintenance needs proactively
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <Tabs
            defaultValue="all"
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button>
              <WrenchIcon className="mr-2 h-4 w-4" />
              Run Predictions
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Maintenance Predictions</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <SearchIcon
                      className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search assets..."
                      className="pl-8 w-full sm:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select 
                    value={selectedAssetType} 
                    onValueChange={setSelectedAssetType}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Asset Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bridge">Bridges</SelectItem>
                      <SelectItem value="road">Roads</SelectItem>
                      <SelectItem value="signal">Signals</SelectItem>
                      <SelectItem value="culvert">Culverts</SelectItem>
                      <SelectItem value="bike-lane">Bike Lanes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedPriority} 
                    onValueChange={setSelectedPriority}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Asset</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Time to Failure</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPredictions.map((prediction) => {
                    const asset = _getAsset(prediction.assetId);
                    
                    return (
                      <TableRow key={prediction.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{prediction.assetName}</span>
                            <span className="text-sm text-muted-foreground">
                              {asset?.description?.substring(0, 60) || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={
                              prediction.failureProbability >= 0.7 ? "text-red-500" :
                              prediction.failureProbability >= 0.4 ? "text-orange-500" :
                              "text-green-500"
                            }>
                              {Math.round(prediction.failureProbability * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{prediction.timeToFailure} days</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getPriorityBadgeClass(prediction.priority)}
                          >
                            {prediction.priority.charAt(0).toUpperCase() + prediction.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeClass(prediction.status)}
                          >
                            {prediction.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCost(prediction.estimatedCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {filteredPredictions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <AlertCircleIcon className="h-12 w-12 mb-4" />
                          <p className="font-medium">No maintenance predictions found</p>
                          <p className="text-sm">Try changing your filters or search query</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredPredictions.length} of {predictions.length} predictions
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Summary</CardTitle>
                <CardDescription>Overview of asset conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Assets</div>
                    <div className="text-2xl font-bold">{assets.length}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Critical Issues</div>
                    <div className="text-2xl font-bold text-red-500">
                      {predictions.filter(p => p.priority === "critical" || p.priority === "high").length}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Avg Condition</div>
                    <div className="text-2xl font-bold">
                      {Math.round(assets.reduce((sum, asset) => sum + asset.condition, 0) / assets.length)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Pending Maintenance</div>
                    <div className="text-2xl font-bold">
                      {predictions.filter(p => p.status === "pending").length}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Estimated Maintenance Costs</div>
                  <div className="text-3xl font-bold">
                    {formatCost(predictions.reduce((sum, p) => sum + (p.estimatedCost || 0), 0))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>High Risk Assets</CardTitle>
                <CardDescription>Assets needing immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions
                  .filter(p => p.failureProbability >= 0.6 && p.status !== "completed")
                  .sort((a, b) => b.failureProbability - a.failureProbability)
                  .slice(0, 3)
                  .map((prediction) => {
                    const asset = _getAsset(prediction.assetId);
                    
                    return (
                      <div key={prediction.id} className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{prediction.assetName}</div>
                          <Badge className={getPriorityBadgeClass(prediction.priority)}>
                            {prediction.priority.charAt(0).toUpperCase() + prediction.priority.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {prediction.recommendedAction}
                        </div>
                        
                        <div className="flex items-center text-sm space-x-4">
                          <div className="flex items-center">
                            <ClockIcon className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>{prediction.timeToFailure} days</span>
                          </div>
                          
                          <div className="flex items-center">
                            <DollarSignIcon className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>{formatCost(prediction.estimatedCost)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button variant="outline" size="sm">Analyze</Button>
                          <Button size="sm">Schedule</Button>
                        </div>
                      </div>
                    );
                  })}
                
                {predictions.filter(p => p.failureProbability >= 0.6 && p.status !== "completed").length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <ClipboardCheckIcon className="h-12 w-12 mb-2" />
                    <p>No high risk assets detected</p>
                    <p className="text-sm">All assets are in good condition</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 