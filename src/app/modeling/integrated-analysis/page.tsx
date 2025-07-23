"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  TrendingUp,
  DollarSign,
  Zap,
  FileText,
  Settings,
  Car,
  Calculator,
  Brain,
  Sparkles,
  Rocket,
  Layers,
  BarChart3,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTitle } from '@/components/ui/alert';

interface IntegrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'ready' | 'configured' | 'running' | 'completed';
  required: boolean;
}

export default function IntegratedAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState<string | null>(
    searchParams?.get('projectId') || null
  );
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    searchParams?.get('scenarioId') || null
  );
  const [projects, setProjects] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  
  const [integrationSteps] = useState<IntegrationStep[]>([
    {
      id: 'project',
      title: 'Select Project',
      description: 'Choose a transportation project to analyze',
      icon: FileText,
      status: selectedProject ? 'configured' : 'ready',
      required: true
    },
    {
      id: 'scenario',
      title: 'Configure Scenario',
      description: 'Set up GreenChAMP model and TrendNavigator assumptions',
      icon: Settings,
      status: selectedScenario ? 'configured' : 'ready',
      required: true
    },
    {
      id: 'greenchamp',
      title: 'Travel Demand Model',
      description: 'Run GreenChAMP activity-based travel forecasting',
      icon: Car,
      status: 'ready',
      required: true
    },
    {
      id: 'trends',
      title: 'Future Trends Analysis',
      description: 'Apply TrendNavigator projections',
      icon: TrendingUp,
      status: 'ready',
      required: true
    },
    {
      id: 'bca',
      title: 'Economic Analysis',
      description: 'Perform integrated benefit-cost analysis',
      icon: Calculator,
      status: 'ready',
      required: true
    },
    {
      id: 'insights',
      title: 'Generate Insights',
      description: 'AI-powered recommendations and insights',
      icon: Brain,
      status: 'ready',
      required: false
    }
  ]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load scenarios when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadScenarios();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadScenarios = async () => {
    if (!selectedProject) return;
    
    setIsLoadingScenarios(true);
    try {
      const response = await fetch(`/api/scenarios?greenchampModelId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to load scenarios');
      
      const data = await response.json();
      setScenarios(data.data || []);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scenarios',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedProject || !selectedScenario) {
      toast({
        title: 'Configuration Required',
        description: 'Please select a project and scenario before starting analysis',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to the dashboard with selected project and scenario
    router.push(`/modeling/integrated-analysis/dashboard?projectId=${selectedProject}&scenarioId=${selectedScenario}`);
  };

  const getStepStatus = (stepId: string) => {
    const step = integrationSteps.find(s => s.id === stepId);
    return step?.status || 'ready';
  };

  const isReadyToStart = selectedProject && selectedScenario;

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrated Analysis</h1>
            <p className="text-muted-foreground">
              Combine GreenChAMP, TrendNavigator, and Benefit-Cost Analysis for comprehensive insights
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/modeling')}
          >
            Back to Modeling
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Configuration</CardTitle>
                <CardDescription>
                  Set up your integrated analysis by selecting a project and scenario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transportation Project</label>
                  <Select 
                    value={selectedProject || undefined} 
                    onValueChange={setSelectedProject}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProject && (
                    <p className="text-sm text-muted-foreground">
                      Analyze transportation impacts and economic benefits
                    </p>
                  )}
                </div>

                {/* Scenario Selection */}
                {selectedProject && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model Scenario</label>
                    <Select 
                      value={selectedScenario || undefined} 
                      onValueChange={setSelectedScenario}
                      disabled={isLoadingScenarios || scenarios.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingScenarios ? "Loading scenarios..." : 
                          scenarios.length === 0 ? "No scenarios available" :
                          "Select a scenario"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {scenarios.map(scenario => (
                          <SelectItem key={scenario.id} value={scenario.id}>
                            {scenario.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedScenario && (
                      <p className="text-sm text-muted-foreground">
                        Includes GreenChAMP model configuration and future trend assumptions
                      </p>
                    )}
                  </div>
                )}

                {/* Create New Scenario Option */}
                {selectedProject && scenarios.length === 0 && (
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>No Scenarios Available</AlertTitle>
                    <AlertDescription>
                      Create a new scenario with GreenChAMP configuration first.
                      <Button
                        variant="link"
                        className="px-0 ml-1"
                        onClick={() => router.push('/modeling/greenchamp/new')}
                      >
                        Create Scenario
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Analysis Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Analysis Options</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="detailed-results"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="detailed-results" className="text-sm">
                        Generate detailed results
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="spatial-analysis"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="spatial-analysis" className="text-sm">
                        Include spatial analysis
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="equity-analysis"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="equity-analysis" className="text-sm">
                        Perform equity analysis
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="monte-carlo"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="monte-carlo" className="text-sm">
                        Run Monte Carlo simulation
                      </label>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <div className="pt-4">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStartAnalysis}
                    disabled={!isReadyToStart}
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Integrated Analysis
                  </Button>
                  {!isReadyToStart && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Select a project and scenario to begin
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How Integrated Analysis Works</CardTitle>
                <CardDescription>
                  Understanding the comprehensive analysis workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">GreenChAMP Travel Demand Modeling</h4>
                      <p className="text-sm text-muted-foreground">
                        Simulates current and future travel patterns using activity-based modeling
                        to understand how people move through the transportation network.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">TrendNavigator Future Projections</h4>
                      <p className="text-sm text-muted-foreground">
                        Applies future trend assumptions like telecommuting, electric vehicles,
                        and shared mobility to project long-term transportation impacts.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Integrated Benefit-Cost Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Combines model outputs to calculate economic benefits including travel time
                        savings, emissions reductions, safety improvements, and health benefits.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">AI-Powered Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Generates strategic recommendations and insights using advanced AI to help
                        you make data-driven decisions about transportation investments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Workflow</CardTitle>
                <CardDescription>
                  Steps in the integrated analysis process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrationSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        step.status === 'configured' ? 'bg-green-50 border-green-200' :
                        step.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        step.status === 'configured' ? 'bg-green-100' :
                        step.status === 'completed' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <step.icon className={`h-4 w-4 ${
                          step.status === 'configured' ? 'text-green-600' :
                          step.status === 'completed' ? 'text-blue-600' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{step.title}</h4>
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Key Benefits</CardTitle>
                <CardDescription>
                  Why use integrated analysis?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Comprehensive multi-dimensional analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Automated data flow between modules</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Unified reporting and visualization</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Stakeholder-ready presentations</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>
                  Your recent integrated analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent analyses yet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 