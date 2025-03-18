import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast
} from '@/components/ui';
import { Loader2, Play, ListIcon, Activity, AlertTriangle, Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ActivitySimulationResults from '@/components/ActivitySimulationResults';
import SimulationParametersForm from '@/components/SimulationParametersForm';
import { ActivitySimulationRun } from '@/types/camp';

export default function ActivitySimulationPage(props) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const { id: scenarioId } = router.query;
  
  const [scenario, setScenario] = useState<any>(null);
  const [simulationRuns, setSimulationRuns] = useState<ActivitySimulationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<ActivitySimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [activeTab, setActiveTab] = useState('runs');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);
  
  // Fetch scenario and simulation runs
  useEffect(() => {
    if (!scenarioId || !session) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch scenario
        const scenarioRes = await fetch(`/api/scenarios/${scenarioId}`);
        if (!scenarioRes.ok) throw new Error('Failed to fetch scenario');
        const scenarioData = await scenarioRes.json();
        setScenario(scenarioData);
        
        // Fetch simulation runs
        const runsRes = await fetch(`/api/scenarios/${scenarioId}/activity-simulation`);
        if (!runsRes.ok) throw new Error('Failed to fetch simulation runs');
        const runsData = await runsRes.json();
        setSimulationRuns(runsData);
        
        // If runs exist, select the most recent one
        if (runsData.length > 0) {
          setSelectedRunId(runsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scenario data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [scenarioId, session, toast]);
  
  // Fetch details of selected run
  useEffect(() => {
    if (!selectedRunId) {
      setSelectedRun(null);
      return;
    }
    
    const fetchRunDetails = async () => {
      try {
        const res = await fetch(`/api/scenarios/${scenarioId}/activity-simulation?runId=${selectedRunId}`);
        if (!res.ok) throw new Error('Failed to fetch simulation run');
        const data = await res.json();
        setSelectedRun(data);
      } catch (error) {
        console.error('Error fetching run details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load simulation details',
          variant: 'destructive',
        });
      }
    };
    
    fetchRunDetails();
  }, [selectedRunId, scenarioId, toast]);
  
  // Start a new simulation
  const runSimulation = async (parameters: any) => {
    setRunningSimulation(true);
    
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/activity-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: parameters.name || `Activity Simulation ${new Date().toLocaleString()}`,
          description: parameters.description || 'Activity-based simulation run',
          parameters: {
            activity_based: parameters.activityParams
          },
          config: parameters.config
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to start simulation');
      }
      
      // Refresh the list of simulation runs
      const runsRes = await fetch(`/api/scenarios/${scenarioId}/activity-simulation`);
      const runsData = await runsRes.json();
      setSimulationRuns(runsData);
      
      // Select the newly created run (which should be the first one)
      if (runsData.length > 0) {
        setSelectedRunId(runsData[0].id);
      }
      
      toast({
        title: 'Success',
        description: 'Simulation started successfully',
      });
      
      // Switch to runs tab
      setActiveTab('runs');
    } catch (error: any) {
      console.error('Error starting simulation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start simulation',
        variant: 'destructive',
      });
    } finally {
      setRunningSimulation(false);
    }
  };
  
  // Delete a simulation run
  const deleteRun = async () => {
    if (!runToDelete) return;
    
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/activity-simulation?runId=${runToDelete}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete simulation');
      }
      
      // Remove the deleted run from the list
      setSimulationRuns(simulationRuns.filter(run => run.id !== runToDelete));
      
      // If the deleted run was selected, clear the selection
      if (selectedRunId === runToDelete) {
        setSelectedRunId(null);
      }
      
      toast({
        title: 'Success',
        description: 'Simulation deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting simulation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete simulation',
        variant: 'destructive',
      });
    } finally {
      setRunToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  
  // Open delete confirmation dialog
  const confirmDeleteRun = (runId: string) => {
    setRunToDelete(runId);
    setDeleteDialogOpen(true);
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  
  if (!scenario) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Scenario Not Found</h2>
            <p className="text-muted-foreground">The requested scenario could not be found.</p>
            <Button
              variant="outline"
              onClick={() => router.push('/scenarios')}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity-Based Simulations</h1>
            <p className="text-muted-foreground">{scenario.name}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => setActiveTab('new')}
              variant={activeTab === 'new' ? 'default' : 'outline'}
            >
              <Play className="h-4 w-4 mr-2" />
              New Simulation
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="runs">
              <ListIcon className="h-4 w-4 mr-2" />
              Simulation Runs
            </TabsTrigger>
            <TabsTrigger value="new">
              <Play className="h-4 w-4 mr-2" />
              New Simulation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="runs" className="space-y-4">
            {simulationRuns.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Simulations</CardTitle>
                  <CardDescription>
                    There are no activity-based simulations for this scenario yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('new')}>
                    <Play className="h-4 w-4 mr-2" />
                    Run a New Simulation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Runs</CardTitle>
                    <CardDescription>
                      Select a simulation run to view its results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="simulation-select">Select Simulation</Label>
                      <div className="flex">
                        <Select 
                          value={selectedRunId || ''} 
                          onValueChange={setSelectedRunId}
                        >
                          <SelectTrigger id="simulation-select" className="flex-1">
                            <SelectValue placeholder="Select a simulation run" />
                          </SelectTrigger>
                          <SelectContent>
                            {simulationRuns.map(run => (
                              <SelectItem key={run.id} value={run.id}>
                                {run.name} ({run.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedRunId && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="ml-2"
                            onClick={() => confirmDeleteRun(selectedRunId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedRun && (
                  <ActivitySimulationResults simulationRun={selectedRun} />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>New Activity-Based Simulation</CardTitle>
                <CardDescription>
                  Configure and run a new activity-based simulation for this scenario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimulationParametersForm 
                  onSubmit={runSimulation}
                  isLoading={runningSimulation}
                  scenarioData={scenario}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Simulation Run</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this simulation run? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRun}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
} 