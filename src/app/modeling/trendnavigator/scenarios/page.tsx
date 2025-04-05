"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeftIcon, 
  BarChart3Icon, 
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
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "@/components/ui/use-toast";

interface BenefitCostResult {
  bcr: number;
  npv: number;
  benefits: { category: string; value: number }[];
  costs: { category: string; value: number }[];
}

interface AiInsights {
  summary: string;
  benefitCost: BenefitCostResult;
  recommendations: string[];
}

interface ScenarioData {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

function RunWithGreenChAMPDialog({ 
  isOpen, 
  onClose, 
  selectedScenario 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedScenario: ScenarioData | null;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  
  useState(() => {
    if (isOpen && selectedScenario) {
      // Simulate a progressive AI analysis
      setIsGenerating(true);
      setProgress(0);
      setAiInsights(null);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsGenerating(false);
            
            // Generate mock insights
            setAiInsights({
              summary: `Analysis of "${selectedScenario.name}" shows significant changes in travel patterns with a 12.3% reduction in VMT and 15.7% decrease in emissions compared to baseline.`,
              benefitCost: {
                bcr: 2.4,
                npv: 183500000,
                benefits: [
                  { category: "Travel Time Savings", value: 124000000 },
                  { category: "Vehicle Operating Costs", value: 47000000 },
                  { category: "Emissions Reduction", value: 31000000 },
                  { category: "Safety Improvements", value: 35000000 }
                ],
                costs: [
                  { category: "Capital Costs", value: 75000000 },
                  { category: "Operations & Maintenance", value: 28000000 }
                ]
              },
              recommendations: [
                "Increase transit investment to further improve mode share in urban areas",
                "Implement coordinated traffic signal timing along congested corridors",
                "Focus on first/last mile connections to increase transit effectiveness"
              ]
            });
          }
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 400);
      
      return () => clearInterval(interval);
    }
  });
  
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
              aiInsights ? 
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
        
        {!isGenerating && aiInsights && (
          <div className="space-y-4 py-2">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm">{aiInsights.summary}</p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Benefit-Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Benefit-Cost Ratio:</span>
                    <span className="text-lg font-bold text-green-600">{aiInsights.benefitCost.bcr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Present Value:</span>
                    <span className="text-lg font-bold">${(aiInsights.benefitCost.npv / 1000000).toFixed(1)}M</span>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Key Benefits:</div>
                    {aiInsights.benefitCost.benefits.map((benefit, i) => (
                      <div key={i} className="flex justify-between text-sm mb-1">
                        <span>{benefit.category}</span>
                        <span>${(benefit.value / 1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <SparklesIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Add dialog state for GreenChAMP integration
  const [runWithGreenChAMPOpen, setRunWithGreenChAMPOpen] = useState(false);

  // Mock data for scenarios
  const mockScenarios: ScenarioData[] = [
    {
      id: "scenario1",
      name: "Future Growth - 2035",
      status: "completed",
      description: "Base scenario for 2035 planning horizon",
      createdAt: "2023-05-15T10:30:00Z",
    },
    {
      id: "scenario2",
      name: "High Transit Investment",
      status: "draft",
      description: "Increased transit funding and service improvements",
      createdAt: "2023-06-22T14:15:00Z",
    },
    {
      id: "scenario3",
      name: "Autonomous Vehicle Adoption",
      status: "in_progress",
      description: "Rapid AV adoption with mobility as a service",
      createdAt: "2023-07-10T09:45:00Z",
    }
  ];

  const handleRunWithGreenChAMP = (scenario: ScenarioData) => {
    setSelectedScenario(scenario);
    setRunWithGreenChAMPOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">TrendNavigator Scenarios</h1>
            <p className="text-muted-foreground">
              Manage and compare scenario plans
            </p>
          </div>
          <Button onClick={() => router.push("/modeling/trendnavigator/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scenarios</CardTitle>
            <CardDescription>
              Your created scenarios for future planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockScenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell>
                        <Badge variant={scenario.status === 'completed' ? 'default' : 
                                        scenario.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {scenario.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(scenario.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => router.push(`/modeling/trendnavigator/scenarios/${scenario.id}`)}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/modeling/trendnavigator/scenarios/${scenario.id}/edit`)}>
                              <FileIcon className="mr-2 h-4 w-4" />
                              Edit Scenario
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRunWithGreenChAMP(scenario)}
                            >
                              <BarChart3Icon className="mr-2 h-4 w-4" />
                              Run with GreenChAMP
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedScenario(scenario);
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2Icon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Scenario</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedScenario?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                toast({
                  title: "Scenario deleted",
                  description: "The scenario has been permanently deleted.",
                });
                setDeleteDialogOpen(false);
              }}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <RunWithGreenChAMPDialog 
          isOpen={runWithGreenChAMPOpen}
          onClose={() => setRunWithGreenChAMPOpen(false)}
          selectedScenario={selectedScenario}
        />
      </div>
    </ProtectedRoute>
  );
} 