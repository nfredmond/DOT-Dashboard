import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ActivitySimulationRun } from '@/types/camp';

export default function ActivitySimulationsPage(props) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: scenarioId } = router.query;
  
  const [simulations, setSimulations] = useState<ActivitySimulationRun[]>([]);
  const [scenarioName, setScenarioName] = useState('Scenario');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (!scenarioId) return;
    
    const fetchSimulations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/scenarios/${scenarioId}/activity-simulations`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch simulations: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSimulations(data.simulations || []);
        setScenarioName(data.scenario?.name || 'Scenario');
      } catch (err) {
        console.error('Error fetching simulations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch simulation data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchSimulations();
  }, [scenarioId]);
  
  const refreshSimulations = () => {
    if (!scenarioId) return;
    setRefreshing(true);
    router.replace(router.asPath);
  };
  
  const createNewSimulation = () => {
    router.push(`/scenarios/${scenarioId}/activity-simulations/new`);
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
  
  const getRunningSimulations = () => {
    return simulations.filter(sim => sim.status === 'running');
  };
  
  const getCompletedSimulations = () => {
    return simulations.filter(sim => sim.status === 'completed');
  };
  
  const getFailedSimulations = () => {
    return simulations.filter(sim => sim.status === 'failed');
  };
  
  const renderSimulationTable = (filteredSimulations: ActivitySimulationRun[]) => {
    if (filteredSimulations.length === 0) {
      return <p className="text-muted-foreground py-4">No simulations found.</p>;
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Person Agents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSimulations.map((simulation) => (
            <TableRow key={simulation.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/scenarios/${scenarioId}/activity-simulations/${simulation.id}`)}>
              <TableCell className="font-medium">{simulation.name || 'Unnamed Simulation'}</TableCell>
              <TableCell>{renderStatusBadge(simulation.status)}</TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(simulation.created_at)}</div>
                <div className="text-xs text-muted-foreground">{formatRelativeTime(simulation.created_at)}</div>
              </TableCell>
              <TableCell>
                {simulation.status === 'running' ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(simulation.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap">{Math.round(simulation.progress * 100)}%</span>
                  </div>
                ) : (
                  <span>{simulation.status === 'completed' ? '100%' : '--'}</span>
                )}
              </TableCell>
              <TableCell className="text-right">{simulation.person_count || '--'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  if (loading && !refreshing) {
    return (
      <div className="container mx-auto py-6">
        <p>Loading simulations...</p>
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
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{`Activity Simulations | ${scenarioName} | Planning Tool`}</title>
      </Head>
      
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/scenarios">Scenarios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/scenarios/${scenarioId}`}>{scenarioName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>Activity Simulations</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activity-Based Simulations</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshSimulations} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={createNewSimulation}>
              <Plus className="h-4 w-4 mr-2" />
              New Simulation
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Simulations</CardTitle>
            <CardDescription>
              Activity-based simulation runs for this scenario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({simulations.length})
                </TabsTrigger>
                <TabsTrigger value="running">
                  Running ({getRunningSimulations().length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({getCompletedSimulations().length})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({getFailedSimulations().length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {renderSimulationTable(simulations)}
              </TabsContent>
              
              <TabsContent value="running" className="mt-4">
                {renderSimulationTable(getRunningSimulations())}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-4">
                {renderSimulationTable(getCompletedSimulations())}
              </TabsContent>
              
              <TabsContent value="failed" className="mt-4">
                {renderSimulationTable(getFailedSimulations())}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Activity-Based Simulations</CardTitle>
            <CardDescription>
              Understanding agent-based activity simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                Activity-based simulations model the behavior of individual agents (people) throughout a day, 
                generating realistic activity patterns and travel behaviors based on demographic characteristics 
                and environmental factors.
              </p>
              <p>
                The simulation process consists of three main steps:
              </p>
              <ol>
                <li>
                  <strong>Population Synthesis</strong> - Creates a synthetic population of person agents with 
                  demographic attributes matching control totals for the study area.
                </li>
                <li>
                  <strong>Activity Generation</strong> - Assigns daily activities to each person based on their 
                  demographics, preferences, and the available activity locations.
                </li>
                <li>
                  <strong>Travel Itinerary Generation</strong> - Determines how people travel between activities, 
                  including mode choice, route selection, and travel times.
                </li>
              </ol>
              <p>
                The results provide detailed insights into travel patterns, mode choices, and activity distributions, 
                allowing planners to evaluate transportation policies and infrastructure investments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 