'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioGenerator } from '@/components/projects/ScenarioGenerator';
import { ScenarioComparison } from '@/components/projects/ScenarioComparison';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  ChevronLeft, 
  PlusCircle, 
  RefreshCw, 
  Save,
  Trash2,
  Download,
  BarChartHorizontal,
  GitBranch
} from 'lucide-react';
import { Project } from '@/types/project';
import { GeneratedScenario } from '@/lib/analysis/scenario-service';
import Loading from '@/components/ui/loading';

export default function ScenariosPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<GeneratedScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingScenarioId, setDeletingScenarioId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('generator');
  
  const projectId = params.id as string;
  
  useEffect(() => {
    const fetchProjectAndScenarios = async () => {
      setLoading(true);
      try {
        // Check if we're in demo mode by looking for demo project ID
        const _isDemoProject = projectId.startsWith('demo');
        
        // Fetch project data
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project');
        const projectData = await projectResponse.json();
        setProject(projectData);
        
        // Fetch scenarios for this project
        const scenariosResponse = await fetch(`/api/projects/${projectId}/scenarios`);
        if (!scenariosResponse.ok) throw new Error('Failed to fetch scenarios');
        const scenariosData = await scenariosResponse.json();
        
        // Transform the data to match the expected GeneratedScenario format
        const formattedScenarios = scenariosData.map((scenario: any) => ({
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
          projectId: projectId,
          feasibility: scenario.feasibility || 0,
          status: scenario.status || 'Draft',
          cost: scenario.cost || 0,
          timeline: scenario.timeline || '0 months',
          benefits: scenario.benefits || [],
          drawbacks: scenario.drawbacks || [],
          createdAt: scenario.created_at || new Date().toISOString(),
          updatedAt: scenario.updated_at || new Date().toISOString(),
          metrics: scenario.metrics || {}
        }));
        
        setSavedScenarios(formattedScenarios);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project or scenarios',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectAndScenarios();
  }, [projectId, toast]);
  
  const handleSaveScenario = async (scenario: GeneratedScenario) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scenario,
          projectId
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save scenario');
      
      const savedScenario = await response.json();
      
      // Update the saved scenarios list
      setSavedScenarios([...savedScenarios, savedScenario]);
      
      // Switch to the saved tab
      setCurrentTab('saved');
      
      toast({
        title: 'Success',
        description: 'Scenario saved successfully',
      });
      
      return savedScenario;
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scenario',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      setDeletingScenarioId(scenarioId);
      
      const response = await fetch(`/api/projects/${projectId}/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete scenario');
      
      // Update the saved scenarios list
      setSavedScenarios(savedScenarios.filter(s => s.id !== scenarioId));
      
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scenario',
        variant: 'destructive'
      });
    } finally {
      setDeletingScenarioId(null);
    }
  };
  
  const handleExportScenario = (scenario: GeneratedScenario) => {
    try {
      // Create a JSON blob
      const blob = new Blob(
        [JSON.stringify(scenario, null, 2)], 
        { type: 'application/json' }
      );
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scenario-${scenario.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to export scenario',
        variant: 'destructive'
      });
    }
  };
  
  const renderScenarioCard = (scenario: GeneratedScenario) => (
    <Card key={scenario.id} className="mb-4">
      <CardHeader>
        <CardTitle>{scenario.name}</CardTitle>
        <CardDescription>
          {scenario.timeline} • ${scenario.cost.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{scenario.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Benefits</h4>
            <ul className="text-sm list-disc pl-5">
              {scenario.benefits.map((benefit, i) => (
                <li key={i}>{benefit}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Drawbacks</h4>
            <ul className="text-sm list-disc pl-5">
              {scenario.drawbacks.map((drawback, i) => (
                <li key={i}>{drawback}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Feasibility</h4>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${scenario.feasibility * 100}%` }}
            />
          </div>
          <p className="text-xs text-right mt-1">
            {(scenario.feasibility * 100).toFixed(0)}%
          </p>
        </div>
        
        {scenario.impact && (
          <div>
            <h4 className="text-sm font-medium mb-2">Impact Assessment</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(scenario.impact).map(([key, value]) => (
                <div key={key} className="bg-muted rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground capitalize">
                    {key}
                  </div>
                  <div className="font-medium mt-1">{value}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportScenario(scenario)}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDeleteScenario(scenario.id!)}
          disabled={deletingScenarioId === scenario.id}
        >
          {deletingScenarioId === scenario.id ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
          ) : (
            <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
  
  if (loading) {
    return (
      <div className="container py-8 max-w-5xl mx-auto">
        <div className="flex justify-center my-12">
          <Loading size="lg" />
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container py-8 max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p>Project not found or you don't have access to it.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/projects')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (savedScenarios.length === 0 && project) {
    return (
      <div className="container py-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <h1 className="text-2xl font-bold mt-2">
              Scenarios for {project.name}
            </h1>
            <p className="text-muted-foreground">
              Generate and compare alternative project scenarios
            </p>
          </div>
        </div>
        
        <Card className="mt-8 border border-dashed">
          <CardContent className="pt-6 px-6 pb-8 flex flex-col items-center text-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <GitBranch className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Scenarios Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              This project doesn't have any scenarios yet. Use the scenario generator to create alternative scenarios based on different priorities or constraints.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => setCurrentTab('generator')}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Generate Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <h1 className="text-2xl font-bold mt-2">
            Scenarios for {project.name}
          </h1>
          <p className="text-muted-foreground">
            Generate and compare alternative project scenarios
          </p>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="generator">
            <PlusCircle className="h-4 w-4 mr-2" />
            Generate New
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Save className="h-4 w-4 mr-2" />
            Saved Scenarios ({savedScenarios.length})
          </TabsTrigger>
          <TabsTrigger value="compare" disabled={savedScenarios.length < 2}>
            <BarChartHorizontal className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator">
          <ScenarioGenerator 
            project={project} 
            onSaveScenario={handleSaveScenario}
          />
        </TabsContent>
        
        <TabsContent value="saved">
          {savedScenarios.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No saved scenarios yet. Generate and save some scenarios to see them here.
                </p>
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => setCurrentTab('generator')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Generate Scenarios
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {savedScenarios.map(renderScenarioCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="compare">
          {savedScenarios.length < 2 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You need at least two saved scenarios to compare. Generate and save more scenarios.
                </p>
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => setCurrentTab('generator')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Generate Scenarios
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScenarioComparison 
              project={project}
              scenarios={savedScenarios}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 