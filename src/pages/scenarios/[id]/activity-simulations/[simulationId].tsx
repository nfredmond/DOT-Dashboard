import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ActivitySimulationResults } from '@/components/ActivitySimulationResults';
import { ActivitySpatialVisualization } from '@/components/ActivitySpatialVisualization';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, RefreshCw, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDateTime, formatNumber } from '@/lib/utils';

export interface ActivitySimulationRun {
  id: string;
  scenario_id: string;
  scenario_name?: string;
  name: string;
  description?: string;
  model_parameters: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  person_count: number;
  activity_count: number;
  trip_count: number;
  results_id?: string;
  results?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
}

export default function ActivitySimulationPage(props) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: scenarioId, simulationId } = router.query;
  
  const [simulation, setSimulation] = useState<ActivitySimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  useEffect(() => {
    if (!scenarioId || !simulationId) return;
    
    const fetchSimulation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/scenarios/${scenarioId}/activity-simulations/${simulationId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch simulation: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSimulation(data);

        // If the simulation has results, fetch them
        if (data.status === 'completed' && data.results_id) {
          const resultsResponse = await fetch(`/api/scenarios/${scenarioId}/activity-simulations/${simulationId}/results`);
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            setResults(resultsData);
          }
        }
      } catch (err) {
        console.error('Error fetching simulation:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch simulation data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSimulation();
    
    // Poll for updates if the simulation is running
    let intervalId: NodeJS.Timeout;
    
    if (simulation?.status === 'running') {
      intervalId = setInterval(fetchSimulation, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [scenarioId, simulationId, simulation?.status]);
  
  const handleDelete = async () => {
    if (!scenarioId || !simulationId) return;
    
    if (!confirm('Are you sure you want to delete this simulation? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/activity-simulations/${simulationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete simulation: ${response.statusText}`);
      }
      
      toast({
        title: 'Simulation deleted',
        description: 'The simulation has been successfully deleted.',
      });
      
      router.push(`/scenarios/${scenarioId}/activity-simulations`);
    } catch (err) {
      console.error('Error deleting simulation:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete the simulation',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };
  
  const refreshSimulation = () => {
    if (!scenarioId || !simulationId) return;
    router.replace(router.asPath);
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center text-amber-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Running</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Completed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1" />
            <span>Failed</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <p>Loading simulation data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  if (!simulation) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested simulation could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  const scenarioName = simulation.scenario_name || 'Scenario';
  
  return (
    <>
      <Head>
        <title>{`${simulation.name || 'Activity Simulation'} | Planning Tool`}</title>
      </Head>
      
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/scenarios">Scenarios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/scenarios/${scenarioId}`}>{scenarioName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/scenarios/${scenarioId}/activity-simulations`}>Activity Simulations</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>{simulation.name || 'Simulation Details'}</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{simulation.name || 'Activity Simulation'}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshSimulation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Simulation Details</CardTitle>
            <CardDescription>Information about this activity-based simulation run</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">{renderStatusBadge(simulation.status)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1">{formatDateTime(simulation.created_at)}</dd>
              </div>
              
              {simulation.completed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed</dt>
                  <dd className="mt-1">{formatDateTime(simulation.completed_at)}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Person Agents</dt>
                <dd className="mt-1">{formatNumber(simulation.person_count) || 'N/A'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Progress</dt>
                <dd className="mt-1">{`${Math.round(simulation.progress * 100)}%`}</dd>
              </div>
              
              {simulation.error_message && (
                <div className="col-span-full">
                  <dt className="text-sm font-medium text-gray-500">Error</dt>
                  <dd className="mt-1 text-red-600">{simulation.error_message}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        {simulation.status === 'running' && (
          <Alert>
            <AlertTitle>Simulation in progress</AlertTitle>
            <AlertDescription>
              The simulation is currently running. Results will be available once it completes.
              Current progress: {Math.round(simulation.progress * 100)}%
            </AlertDescription>
          </Alert>
        )}
        
        {simulation.status === 'completed' && simulation.results && (
          <Tabs defaultValue="charts">
            <TabsList>
              <TabsTrigger value="charts">Charts & Statistics</TabsTrigger>
              <TabsTrigger value="map">Spatial Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="charts">
              <ActivitySimulationResults results={simulation.results} />
            </TabsContent>
            
            <TabsContent value="map">
              <ActivitySpatialVisualization 
                simulationId={simulationId as string} 
                scenarioId={scenarioId as string} 
              />
            </TabsContent>
          </Tabs>
        )}
        
        {simulation.status === 'failed' && (
          <Alert variant="destructive">
            <AlertTitle>Simulation failed</AlertTitle>
            <AlertDescription>
              {simulation.error_message || 'An unknown error occurred during the simulation.'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
} 