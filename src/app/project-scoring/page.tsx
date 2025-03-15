"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts";
import {
  BarChart3Icon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  AlertCircleIcon,
  MoreHorizontalIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarChart2Icon,
  TrafficConeIcon,
  BusIcon,
  BikeIcon,
  TreesIcon,
  SaveIcon,
  HardHatIcon,
  TruckIcon,
  LandmarkIcon,
  PercentIcon,
  DollarSignIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  BarChart4Icon,
  LineChartIcon,
  PieChartIcon,
  LayoutDashboardIcon,
  SlidersHorizontal,
  Settings2Icon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/lib/project-service";
import { 
  ProjectScoreSummary, 
  PrioritizationScenario, 
  WeightedScore,
  getCriteria, 
  getProjectScores, 
  calculateProjectScore,
  createPrioritizationScenario, 
  runPrioritizationScenario,
  getPrioritizedProjects,
  getScoringTemplates,
  analyzeProjectAcrossScenarios,
  getProjectGrantAlignment,
  Criterion,
  Score,
  ScoringTemplate,
  GrantAlignment
} from "@/lib/scoring-service";
import { Project } from "@/types/project";

export default function ProjectScoring() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { projects, loading: loadingProjects } = useProjects();
  const [sortBy, setSortBy] = useState("score");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [projectScores, setProjectScores] = useState<Record<string, ProjectScoreSummary>>({});
  const [prioritizationScenarios, setPrioritizationScenarios] = useState<PrioritizationScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioResults, setScenarioResults] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [grantAlignments, setGrantAlignments] = useState<GrantAlignment[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>({});
  const [scoringTemplates, setScoringTemplates] = useState<ScoringTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (!user?.agencyId) return;
      
      try {
        // Load criteria
        const criteriaData = await getCriteria(user.agencyId);
        setCriteria(criteriaData);
        
        // Set initial criteria weights
        const initialWeights = criteriaData.reduce((acc, criterion) => {
          acc[criterion.id] = criterion.weight;
          return acc;
        }, {});
        setCriteriaWeights(initialWeights);
        
        // Load scoring templates
        const templates = await getScoringTemplates(user.agencyId);
        setScoringTemplates(templates);
        
        // Load project scores
        await loadProjectScores();
        
        // Load existing prioritization scenarios
        await loadScenarios();
      } catch (error) {
        console.error('Error loading scoring data:', error);
        toast({
          title: "Error",
          description: "Failed to load scoring data. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, [user]);
  
  const loadProjectScores = async () => {
    if (!projects || projects.length === 0) return;
    
    setLoadingScores(true);
    const scores = {};
    
    try {
      for (const project of projects) {
        const projectScore = await calculateProjectScore(project.id);
        scores[project.id] = projectScore;
      }
      
      setProjectScores(scores);
    } catch (error) {
      console.error('Error loading project scores:', error);
      toast({
        title: "Error",
        description: "Failed to load project scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingScores(false);
    }
  };
  
  const loadScenarios = async () => {
    if (!user?.agencyId) return;
    
    try {
      const response = await fetch(`/api/scoring/scenarios?agencyId=${user.agencyId}`);
      const data = await response.json();
      
      if (data.success && data.scenarios) {
        setPrioritizationScenarios(data.scenarios);
        
        // If there's at least one scenario, set it as active
        if (data.scenarios.length > 0 && !activeScenario) {
          setActiveScenario(data.scenarios[0].id);
          await loadScenarioResults(data.scenarios[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };
  
  const loadScenarioResults = async (scenarioId) => {
    if (!scenarioId) return;
    
    setLoadingScenarios(true);
    try {
      const response = await fetch(`/api/scoring/scenario-results?scenarioId=${scenarioId}`);
      const data = await response.json();
      
      if (data.success && data.results) {
        setScenarioResults(data.results);
      }
    } catch (error) {
      console.error('Error loading scenario results:', error);
      toast({
        title: "Error",
        description: "Failed to load prioritization results.",
        variant: "destructive",
      });
    } finally {
      setLoadingScenarios(false);
    }
  };
  
  const handleCreateScenario = async () => {
    if (!user?.agencyId || !scenarioName.trim()) return;
    
    setCreatingScenario(true);
    try {
      const newScenario: Omit<PrioritizationScenario, 'id' | 'createdBy' | 'createdAt'> = {
        name: scenarioName,
        description: scenarioDescription,
        criteriaWeights: criteriaWeights,
        filterSettings: {
          projectTypes: [],
          minBudget: 0,
          maxBudget: null
        },
        agencyId: user.agencyId
      };
      
      const createdScenario = await createPrioritizationScenario(newScenario, user.id);
      setPrioritizationScenarios(prev => [...prev, createdScenario]);
      setActiveScenario(createdScenario.id);
      
      // Run the scenario immediately
      const results = await runPrioritizationScenario(createdScenario.id);
      setScenarioResults(results);
      
      // Reset form
      setScenarioName("");
      setScenarioDescription("");
      
      toast({
        title: "Success",
        description: "Prioritization scenario created and executed.",
      });
    } catch (error) {
      console.error('Error creating scenario:', error);
      toast({
        title: "Error",
        description: "Failed to create prioritization scenario.",
        variant: "destructive",
      });
    } finally {
      setCreatingScenario(false);
    }
  };
  
  // Type conversions for scores
  const updateProjectDetails = (projectData: Project, scoreSummary: ProjectScoreSummary, analysisResults?: Record<string, any>, alignments?: any[]) => {
    // Convert ProjectScoreSummary to ProjectScores format if needed
    const convertedScores = {
      safety: scoreSummary.categoryScores['safety'] || 0,
      equity: scoreSummary.categoryScores['equity'] || 0,
      climate: scoreSummary.categoryScores['climate'] || 0,
      congestion: scoreSummary.categoryScores['congestion'] || 0,
      costEffectiveness: scoreSummary.categoryScores['costEffectiveness'] || 0,
      multimodal: scoreSummary.categoryScores['multimodal'] || 0,
      ...scoreSummary.categoryScores
    };
    
    return {
      ...projectData,
      scores: convertedScores,
      totalScore: scoreSummary.totalScore,
      weightedScores: scoreSummary.weightedScores,
      scenarioAnalysis: analysisResults,
      grantAlignments: alignments
    };
  };
  
  // Use this in handleViewProjectDetails
  const handleViewProjectDetails = async (projectId) => {
    setSelectedProject(projectId);
    
    try {
      // Load detailed project info
      const projectData = projects.find(p => p.id === projectId);
      
      if (!projectData) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Load grant alignments for this project
      const alignments = await getProjectGrantAlignment(projectId);
      setGrantAlignments(alignments);
      
      // Analyze project across all scenarios
      if (prioritizationScenarios.length > 0) {
        const scenarioIds = prioritizationScenarios.map(s => s.id);
        const analysisResults = await analyzeProjectAcrossScenarios(projectId, scenarioIds);
        
        setProjectDetails(updateProjectDetails(
          projectData,
          projectScores[projectId],
          analysisResults,
          alignments
        ));
      } else {
        setProjectDetails(updateProjectDetails(
          projectData,
          projectScores[projectId],
          undefined,
          alignments
        ));
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    }
  };
  
  // Prepare data for visualization
  const getProjectsWithScores = () => {
    if (!projects || projects.length === 0) return [];
    
    // If we're viewing scenario results
    if (viewMode === 'scenario' && activeScenario && scenarioResults.length > 0) {
      return projects
        .filter(p => scenarioResults.some(r => r.projectId === p.id))
        .map(project => {
          const resultData = scenarioResults.find(r => r.projectId === project.id);
          return {
            ...project,
            totalScore: resultData ? resultData.normalizedScore : 0,
            rank: resultData ? resultData.rank : null,
            categoryScores: resultData ? resultData.categoryScores : {}
          };
        })
        .sort((a, b) => {
          // Sort by rank if available, otherwise by score
          if (a.rank !== null && b.rank !== null) {
            return a.rank - b.rank;
          }
          return b.totalScore - a.totalScore;
        });
    }
    
    // Regular view - using project scores
    return projects
      .filter(p => projectScores[p.id]) // Only include projects with scores
      .map(project => ({
        ...project,
        totalScore: projectScores[project.id]?.totalScore || 0,
        categoryScores: projectScores[project.id]?.categoryScores || {}
      }))
      .sort((a, b) => {
        if (sortBy === "score") {
          return b.totalScore - a.totalScore;
        } else if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  };
  
  // Filter projects by category
  const getFilteredProjects = () => {
    const projectsWithScores = getProjectsWithScores();
    if (filterCategory === "all") {
      return projectsWithScores;
    }
    return projectsWithScores.filter(p => {
      // Handle undefined type safely
      if (!p.type) return false;
      return p.type.toLowerCase() === filterCategory.toLowerCase();
    });
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-slate-500";
    
    const categoryColors = {
      highway: "bg-amber-500",
      transit: "bg-purple-500",
      "active transportation": "bg-green-500",
      bridge: "bg-blue-500",
      safety: "bg-red-500",
      multimodal: "bg-indigo-500",
      other: "bg-slate-500",
    };
    
    return categoryColors[category.toLowerCase()] || "bg-slate-500";
  };
  
  const getCategoryIcon = (category?: string) => {
    if (!category) return <HardHatIcon className="h-4 w-4" />;
    
    switch (category.toLowerCase()) {
      case "highway":
        return <TrafficConeIcon className="h-4 w-4" />;
      case "transit":
        return <BusIcon className="h-4 w-4" />;
      case "active transportation":
        return <BikeIcon className="h-4 w-4" />;
      case "bridge":
        return <LandmarkIcon className="h-4 w-4" />;
      case "multimodal":
        return <TruckIcon className="h-4 w-4" />;
      default:
        return <HardHatIcon className="h-4 w-4" />;
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };
  
  const renderPrioritizationControls = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <SlidersHorizontal className="mr-2 h-5 w-5" />
              Prioritization Controls
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode(viewMode === 'list' ? 'scenario' : 'list')}
              >
                {viewMode === 'list' ? 'View Prioritization Scenarios' : 'View Basic Scoring'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Create and run prioritization scenarios to rank projects based on custom criteria weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'scenario' ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-grow">
                  <Label htmlFor="scenario-select">Active Scenario</Label>
                  <Select 
                    value={activeScenario || ''} 
                    onValueChange={(value) => {
                      setActiveScenario(value);
                      loadScenarioResults(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioritizationScenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      New Scenario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Prioritization Scenario</DialogTitle>
                      <DialogDescription>
                        Define custom weights for criteria to generate a prioritized list of projects.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="scenario-name">Scenario Name</Label>
                        <Input
                          id="scenario-name"
                          value={scenarioName}
                          onChange={(e) => setScenarioName(e.target.value)}
                          placeholder="e.g., Equity-focused prioritization"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="scenario-description">Description</Label>
                        <Input
                          id="scenario-description"
                          value={scenarioDescription}
                          onChange={(e) => setScenarioDescription(e.target.value)}
                          placeholder="Briefly describe the purpose of this scenario"
                        />
                      </div>
                      
                      <div className="grid gap-4 mt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Criteria Weights</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Normalize weights to sum to 100
                              const total = Object.values(criteriaWeights).reduce((sum, weight) => sum + Number(weight), 0);
                              if (total === 0) return;
                              
                              const normalized = {};
                              for (const [id, weight] of Object.entries(criteriaWeights)) {
                                normalized[id] = Math.round((Number(weight) / total) * 100);
                              }
                              setCriteriaWeights(normalized);
                            }}
                          >
                            Normalize Weights
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[200px] pr-4">
                          {criteria.map((criterion) => (
                            <div key={criterion.id} className="flex items-center justify-between mb-4">
                              <div className="w-1/2">
                                <Label htmlFor={`weight-${criterion.id}`} className="text-sm">
                                  {criterion.name}
                                </Label>
                                <div className="text-xs text-muted-foreground">
                                  {criterion.category}
                                </div>
                              </div>
                              <div className="w-1/3 flex-1 flex items-center gap-2">
                                <Slider
                                  id={`weight-${criterion.id}`}
                                  value={[criteriaWeights[criterion.id] || 0]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={(values) => {
                                    setCriteriaWeights({
                                      ...criteriaWeights,
                                      [criterion.id]: values[0]
                                    });
                                  }}
                                />
                                <div className="w-12 text-right">
                                  {criteriaWeights[criterion.id] || 0}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleCreateScenario}
                        disabled={creatingScenario || !scenarioName.trim()}
                      >
                        {creatingScenario ? 
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            Creating...
                          </div> : 
                          'Create & Run'
                        }
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {activeScenario && (
                <div>
                  {loadingScenarios ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Top Ranked Project</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {scenarioResults.length > 0 ? (
                              <div>
                                <div className="text-2xl font-bold">
                                  {projects.find(p => p.id === scenarioResults[0]?.projectId)?.name || 'N/A'}
                                </div>
                                <div className="flex items-center mt-1">
                                  <Badge variant="outline" className="mr-2">
                                    Rank #1
                                  </Badge>
                                  <div className="text-sm">
                                    Score: {scenarioResults[0]?.normalizedScore.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No results available</div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Top Project Type</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {scenarioResults.length > 0 ? (
                              <div>
                                {(() => {
                                  // Get the most common project type in top 3
                                  const top3 = scenarioResults.slice(0, 3);
                                  const projectTypes = top3.map(r => 
                                    projects.find(p => p.id === r.projectId)?.type || 'Unknown'
                                  );
                                  
                                  const typeCounts = {};
                                  let maxCount = 0;
                                  let topType = 'Unknown';
                                  
                                  for (const type of projectTypes) {
                                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                                    if (typeCounts[type] > maxCount) {
                                      maxCount = typeCounts[type];
                                      topType = type;
                                    }
                                  }
                                  
                                  return (
                                    <>
                                      <div className="text-2xl font-bold capitalize">
                                        {topType}
                                      </div>
                                      <div className="text-sm mt-1">
                                        {maxCount} of top 3 projects
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No results available</div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {scenarioResults.length > 0 ? (
                              <div>
                                <div className="text-2xl font-bold">
                                  {(scenarioResults.reduce((sum, r) => sum + r.normalizedScore, 0) / scenarioResults.length).toFixed(2)}
                                </div>
                                <div className="text-sm mt-1">
                                  Across {scenarioResults.length} projects
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No results available</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={scenarioResults.slice(0, 10).map(result => {
                              const project = projects.find(p => p.id === result.projectId);
                              return {
                                name: project?.name || 'Unknown',
                                score: result.normalizedScore,
                                rank: result.rank
                              };
                            })} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  This is the basic scoring view. Switch to the prioritization scenario view to create and run
                  custom scenarios with different criteria weights.
                </p>
              </div>
              <Button variant="outline" onClick={() => setViewMode('scenario')}>
                Switch to Prioritization View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderProjectDetails = () => {
    if (!selectedProject || !projectDetails) {
      return null;
    }
    
    const project = projectDetails;
    
    return (
      <Dialog open={!!selectedProject} onOpenChange={(open) => {
        if (!open) setSelectedProject(null);
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project.name}</DialogTitle>
            <DialogDescription>
              Detailed scoring and prioritization analysis
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Project Information</h4>
                <div className="text-sm">
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="font-medium">Type:</div>
                    <div className="col-span-2 capitalize">{project.type || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="font-medium">Location:</div>
                    <div className="col-span-2">{project.location || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="font-medium">Status:</div>
                    <div className="col-span-2 capitalize">{project.status || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="font-medium">Budget:</div>
                    <div className="col-span-2">
                      ${project.metadata?.budget?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Overall Score</h4>
                <div className="flex flex-col items-center">
                  <div className={`text-4xl font-bold ${getScoreColor(project.totalScore || 0)}`}>
                    {project.totalScore?.toFixed(1) || 'N/A'}
                  </div>
                  <Progress 
                    value={project.totalScore || 0} 
                    className="h-2 w-full mt-2" 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Detailed Scores</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterion</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Raw Score</TableHead>
                    <TableHead>Weighted Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.weightedScores?.map((score: WeightedScore) => (
                    <TableRow key={score.criterionId}>
                      <TableCell className="font-medium">{score.criterionName}</TableCell>
                      <TableCell className="capitalize">{score.category}</TableCell>
                      <TableCell>{score.weight}%</TableCell>
                      <TableCell>{score.rawScore.toFixed(1)}</TableCell>
                      <TableCell className={getScoreColor(score.weightedScore)}>
                        {score.weightedScore.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {project.scenarioAnalysis && Object.keys(project.scenarioAnalysis).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Prioritization Analysis</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Comparison</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(project.scenarioAnalysis).map(([scenarioId, result]) => {
                      const scenario = prioritizationScenarios.find(s => s.id === scenarioId);
                      return (
                        <TableRow key={scenarioId}>
                          <TableCell className="font-medium">{scenario?.name || 'Unknown'}</TableCell>
                          <TableCell>#{result.rank}</TableCell>
                          <TableCell>{result.normalizedScore.toFixed(1)}</TableCell>
                          <TableCell>
                            {(() => {
                              const avgScore = scenarioResults.reduce((sum, r) => sum + r.normalizedScore, 0) / 
                                             scenarioResults.length;
                              const diff = result.normalizedScore - avgScore;
                              
                              if (diff > 5) {
                                return <Badge className="bg-green-100 text-green-800">Above Average (+{diff.toFixed(1)})</Badge>;
                              } else if (diff < -5) {
                                return <Badge className="bg-red-100 text-red-800">Below Average ({diff.toFixed(1)})</Badge>;
                              } else {
                                return <Badge className="bg-gray-100 text-gray-800">Average</Badge>;
                              }
                            })()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {project.grantAlignments && project.grantAlignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Grant Alignment</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grant Program</TableHead>
                      <TableHead>Alignment Score</TableHead>
                      <TableHead>Key Strengths</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.grantAlignments.map((alignment) => (
                      <TableRow key={alignment.grantId}>
                        <TableCell className="font-medium">
                          {alignment.grantName || 'Unknown Grant'}
                        </TableCell>
                        <TableCell className={getScoreColor(alignment.alignmentScore)}>
                          {alignment.alignmentScore.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {alignment.recommendations.slice(0, 2).map((rec, i) => (
                              <Badge key={i} className="bg-blue-100 text-blue-800" variant="outline">
                                {rec}
                              </Badge>
                            ))}
                            {alignment.recommendations.length > 2 && (
                              <Badge variant="outline">+{alignment.recommendations.length - 2} more</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Scoring & Prioritization</h1>
          <p className="text-muted-foreground">
            Score projects, run prioritization scenarios, and optimize your investment strategy
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/project-scoring/admin')}
          className="flex items-center gap-2"
        >
          <Settings2Icon className="h-4 w-4" />
          Scoring Admin
        </Button>
      </div>

      {renderPrioritizationControls()}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3Icon className="mr-2 h-5 w-5" />
                Project Scores
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search projects..."
                    className="pl-8"
                  />
                </div>
                <Select defaultValue="all" onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="highway">Highway</SelectItem>
                    <SelectItem value="transit">Transit</SelectItem>
                    <SelectItem value="active transportation">Active Transportation</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <FilterIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <CheckCircleIcon className="mr-2 h-4 w-4" /> Show only high-scoring
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <DollarSignIcon className="mr-2 h-4 w-4" /> Filter by budget
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CalendarIcon className="mr-2 h-4 w-4" /> Filter by timeline
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon">
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {viewMode === 'scenario' && activeScenario ? 
                `Viewing prioritized projects based on "${prioritizationScenarios.find(s => s.id === activeScenario)?.name}" scenario` :
                "Compare project scores based on defined criteria"
              }
            </CardDescription>
          </CardHeader>
  
          <CardContent>
            {loadingProjects || loadingScores ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-[30%]" />
                    <Skeleton className="h-12 w-[15%]" />
                    <Skeleton className="h-12 w-[15%]" />
                    <Skeleton className="h-12 w-[20%]" />
                    <Skeleton className="h-12 w-[20%]" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      Project Name
                      {viewMode === 'scenario' && <div className="text-xs font-normal text-muted-foreground">Rank</div>}
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        <span>Total Score</span>
                        <ArrowUpDownIcon
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={() =>
                            setSortBy(sortBy === "score" ? "name" : "score")
                          }
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredProjects().map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {viewMode === 'scenario' && project.rank !== null && (
                            <Badge variant="outline" className="mr-2">
                              #{project.rank}
                            </Badge>
                          )}
                          <div>{project.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge className={`mr-2 ${getCategoryColor(project.type)}`}>
                            {getCategoryIcon(project.type)}
                          </Badge>
                          <span className="capitalize">{project.type || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.location || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {project.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${getScoreColor(project.totalScore || 0)}`}>
                          {(project.totalScore || 0).toFixed(1)}
                        </div>
                        <Progress value={project.totalScore || 0} className="h-1 mt-1" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewProjectDetails(project.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {renderProjectDetails()}
    </div>
  );
}
