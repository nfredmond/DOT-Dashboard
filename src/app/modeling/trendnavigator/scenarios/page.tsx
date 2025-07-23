"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeftIcon, 
  FileIcon, 
  MoreHorizontalIcon, 
  PlusIcon, 
  Trash2Icon, 
  EyeIcon,
} from "lucide-react";
import { BarChart4Icon, BrainIcon, SparklesIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "@/components/ui/use-toast";
import { TrendNavigatorEngine, TrendScenario } from "@/lib/trend-navigator/engine";

// New interface for the output metrics from applyTrendsToModel
interface TrendOutputMetric {
  outputMetricId: "VMT_PER_CAPITA_PCT_2019" | "TRANSIT_TRIPS_PER_CAPITA_PCT_2019" | "GHG_EMISSIONS_PCT_CHANGE" | "CONGESTION_LEVEL_PCT_CHANGE" | string; // Allow other string for flexibility
  displayName: string; // e.g., "VMT Per Capita (% of 2019)"
  yearValues: Record<number, number>; // {2025: 95, 2030: 90}
}

// Updated AiInsights to use the new output metric structure
interface AiScenarioAnalysisResults {
  summaryText: string;
  outputMetrics: TrendOutputMetric[];
  equityImpactStatement?: string; // Placeholder for qualitative equity assessment
  safetyConsiderations?: string; // Placeholder for qualitative safety assessment
  recommendations?: string[]; 
}

const engine = new TrendNavigatorEngine();

function RunWithGreenChAMPDialog({ 
  isOpen, 
  onClose, 
  selectedScenario 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedScenario: TrendScenario | null;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AiScenarioAnalysisResults | null>(null);
  
  useEffect(() => {
    if (isOpen && selectedScenario) {
      setIsGenerating(true);
      setProgress(0);
      setAnalysisResults(null);
      
      // Simulate call to engine.applyTrendsToModel and processing
      const performAnalysis = async () => {
        try {
          // Actual call (can be uncommented when ready to test integration)
          // const modelOutputs = await engine.applyTrendsToModel(selectedScenario.id, {}); 
          
          // Mock data for applyTrendsToModel output
          const mockModelOutputs: TrendOutputMetric[] = [
            {
              outputMetricId: "VMT_PER_CAPITA_PCT_2019",
              displayName: "VMT Per Capita (% of 2019)",
              yearValues: { 2025: 95, 2030: 90, 2035: 88, 2040: 85 }
            },
            {
              outputMetricId: "TRANSIT_TRIPS_PER_CAPITA_PCT_2019",
              displayName: "Transit Trips Per Capita (% of 2019)",
              yearValues: { 2025: 105, 2030: 110, 2035: 112, 2040: 115 }
            },
            {
              outputMetricId: "GHG_EMISSIONS_PCT_CHANGE",
              displayName: "GHG Emissions (% Change from Baseline)",
              yearValues: { 2025: -5, 2030: -8, 2035: -10, 2040: -12 }
            },
            {
              outputMetricId: "CONGESTION_LEVEL_PCT_CHANGE",
              displayName: "Congestion Level (% Change from Baseline)",
              yearValues: { 2025: 2, 2030: 5, 2035: 7, 2040: 10 }
            }
          ];

          // Simulate AI processing delay & progress
          let currentProgress = 0;
          const progressInterval = setInterval(() => {
            currentProgress += 10;
            setProgress(currentProgress);
            if (currentProgress >= 100) {
              clearInterval(progressInterval);
              setIsGenerating(false);
              setAnalysisResults({
                summaryText: `Scenario "${selectedScenario.name}" analysis complete. Key transportation metrics have been forecasted across multiple years. Review the detailed metrics below.`,
                outputMetrics: mockModelOutputs, // Use the (mocked) model outputs
                equityImpactStatement: "The configured trends may lead to moderate improvements in accessibility for low-income communities due to enhanced transit options, but potential increases in VMT could disproportionately affect air quality in already burdened areas if not mitigated.",
                safetyConsiderations: "Increased transit usage generally correlates with improved overall system safety. However, changes in VMT and congestion require monitoring for potential impacts on road safety metrics.",
                recommendations: [
                  "Consider infrastructure improvements to support transit growth.",
                  "Evaluate demand management strategies if VMT reduction targets are not met.",
                  "Conduct targeted equity analysis for specific corridors or communities."
                ]
              });
            }
          }, 200); // Faster simulation for dialog

        } catch (error) {
          console.error("Error during scenario analysis:", error);
          setIsGenerating(false);
          toast({
            title: "Analysis Error",
            description: "Could not analyze the scenario with GreenChAMP.",
            variant: "destructive"
          });
          // Potentially call onClose() here if the error is critical
        }
      };

      performAnalysis();

    }
  }, [isOpen, selectedScenario]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BrainIcon className="mr-2 h-5 w-5 text-primary" />
            AI-Powered Analysis with GreenChAMP
          </DialogTitle>
          <DialogDescription>
            {isGenerating ? 
              "Generating comprehensive scenario analysis..." :
              analysisResults ? 
                "Analysis complete. Here are the key insights." :
                "Run this scenario through GreenChAMP for detailed transportation analysis."
            }
          </DialogDescription>
        </DialogHeader>
        
        {isGenerating && (
          <div className="space-y-4 py-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Processing Scenario Data</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center text-sm">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={progress >= 20 ? '' : 'text-muted-foreground'}>Loading scenario parameters</span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={progress >= 40 ? '' : 'text-muted-foreground'}>Running GreenChAMP model</span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={progress >= 60 ? '' : 'text-muted-foreground'}>Calculating benefit-cost metrics</span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={progress >= 80 ? '' : 'text-muted-foreground'}>Generating AI insights</span>
              </div>
            </div>
          </div>
        )}
        
        {!isGenerating && analysisResults && (
          <div className="space-y-4 py-2">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm">{analysisResults.summaryText}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Forecasted Output Metrics</CardTitle>
                <CardDescription>Key performance indicators based on the configured trends for scenario: {selectedScenario?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {/* Dynamically create year headers from the first metric's years */}
                      {analysisResults.outputMetrics[0] && Object.keys(analysisResults.outputMetrics[0].yearValues).map(year => (
                        <TableHead key={year} className="text-right">{year}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResults.outputMetrics.map((metric) => (
                      <TableRow key={metric.outputMetricId}>
                        <TableCell className="font-medium">{metric.displayName}</TableCell>
                        {Object.keys(metric.yearValues).map(year => (
                          <TableCell key={year} className="text-right">{metric.yearValues[parseInt(year)]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResults.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <SparklesIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {analysisResults.equityImpactStatement && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Equity Impact Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{analysisResults.equityImpactStatement}</p>
                </CardContent>
              </Card>
            )}

            {analysisResults.safetyConsiderations && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Safety Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{analysisResults.safetyConsiderations}</p>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <BarChart4Icon className="mr-2 h-4 w-4" />
                View Detailed Results
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TrendNavigatorScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<TrendScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScenarioForDialog, setSelectedScenarioForDialog] = useState<TrendScenario | null>(null);
  const [isDialogRunWithGreenChAMPOpen, setIsDialogRunWithGreenChAMPOpen] = useState(false);

  useEffect(() => {
    async function fetchScenarios() {
      setIsLoading(true);
      try {
        const fetchedScenarios = await engine.listScenarios();
        setScenarios(fetchedScenarios);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        toast({
          title: "Error fetching scenarios",
          description: "Could not load the list of scenarios. Please try again later.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
    fetchScenarios();
  }, []);

  const handleDeleteScenario = async (scenarioId: string) => {
    // Placeholder: Implement actual delete logic with engine.deleteScenario(scenarioId)
    toast({
      title: "Delete Scenario (Not Implemented)",
      description: `Scenario ${scenarioId} would be deleted.`,
    });
    // Refetch or filter list locally
    setScenarios(prev => prev.filter(s => s.id !== scenarioId)); 
  };

  const handleViewScenario = (scenarioId: string) => {
    // Placeholder: Navigate to a scenario detail page or open a view dialog
    toast({
      title: "View Scenario (Not Implemented)",
      description: `Viewing details for scenario ${scenarioId}.`,
    });
    // router.push(`/modeling/trendnavigator/scenarios/${scenarioId}`);
  };

  const handleRunWithGreenChAMP = (scenario: TrendScenario) => {
    setSelectedScenarioForDialog(scenario);
    setIsDialogRunWithGreenChAMPOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Future Scenarios</h1>
          </div>
          <Button onClick={() => router.push("/modeling/trendnavigator/new")}>
            <PlusIcon className="mr-2 h-4 w-4" /> Create New Scenario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scenario Library</CardTitle>
            <CardDescription>
              Manage and analyze your future transportation scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading scenarios...</p>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-8">
                <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new scenario.</p>
                <div className="mt-6">
                  <Button onClick={() => router.push("/modeling/trendnavigator/new")}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Create New Scenario
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Horizon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                        {scenario.description}
                      </TableCell>
                      <TableCell>{scenario.horizonYear}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={scenario.status === "Analyzed" ? "default" : "secondary"}
                          className={scenario.status === "Analyzed" ? "bg-green-100 text-green-700" : ""}
                        >
                          {scenario.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(scenario.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewScenario(scenario.id!)}>
                              <EyeIcon className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRunWithGreenChAMP(scenario)}>
                              <BrainIcon className="mr-2 h-4 w-4" /> Run with GreenChAMP
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteScenario(scenario.id!)} 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" /> Delete Scenario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <RunWithGreenChAMPDialog 
          isOpen={isDialogRunWithGreenChAMPOpen}
          onClose={() => setIsDialogRunWithGreenChAMPOpen(false)}
          selectedScenario={selectedScenarioForDialog}
        />
      </div>
    </ProtectedRoute>
  );
} 