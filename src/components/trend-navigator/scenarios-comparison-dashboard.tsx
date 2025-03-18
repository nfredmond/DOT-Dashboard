'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart4, Map, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { ScenarioDefinition, ScenarioResults } from '@/types/trend-navigator';
import { ScenarioMetricsChart } from '@/components/charts/scenario-metrics-chart';
import { ScenarioMapView } from '@/components/scenario-map-view';
import { useToast } from '@/components/ui/use-toast';
import logger from '../../lib/logger';


interface ScenariosComparisonDashboardProps {
  scenarioIds: string[];
  baselineScenarioId?: string;
}

export function ScenariosComparisonDashboard({ 
  scenarioIds, 
  baselineScenarioId 
}: ScenariosComparisonDashboardProps) {
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [scenarioResults, setScenarioResults] = useState<Record<string, ScenarioResults>>({});
  const [selectedTab, setSelectedTab] = useState<string>('charts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const _supabase = createClient();

  // Load all scenarios and their results
  useEffect(() => {
    const loadScenarios = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all scenarios data
        const scenariosData: ScenarioDefinition[] = [];
        const resultsData: Record<string, ScenarioResults> = {};
        
        for (const id of scenarioIds) {
          const response = await fetch(`/api/scenarios/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch scenario ${id}: ${response.statusText}`);
          }
          
          const scenarioData = await response.json();
          scenariosData.push(scenarioData);
          
          // Get results for this scenario
          const resultsResponse = await fetch(`/api/scenarios/${id}/results`);
          if (resultsResponse.ok) {
            const scenarioResultsData = await resultsResponse.json();
            resultsData[id] = scenarioResultsData;
          }
        }
        
        setScenarios(scenariosData);
        setScenarioResults(resultsData);
      } catch (err) {
        logger.error('Error loading scenarios:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scenarios');
        toast({
          title: 'Error',
          description: 'Failed to load scenarios for comparison',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (scenarioIds.length > 0) {
      loadScenarios();
    }
  }, [scenarioIds, toast]);

  // Get baseline scenario result
  const baselineResult = baselineScenarioId && scenarioResults[baselineScenarioId] 
    ? scenarioResults[baselineScenarioId] 
    : undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scenario Comparison</h2>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="charts">
              <BarChart4 className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="maps">
              <Map className="h-4 w-4 mr-2" />
              Maps
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TabsContent value="charts" className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(scenarioResults).map(([scenarioId, results]) => {
            const scenario = scenarios.find(s => s.id === scenarioId);
            if (!scenario || !results) return null;
            
            return (
              <Card key={scenarioId} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle>{scenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScenarioMetricsChart 
                    scenarioResults={results}
                    baselineResults={baselineResult}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="maps" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map(scenario => (
            <Card key={scenario.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle>{scenario.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 h-[500px]">
                {scenarioResults[scenario.id] ? (
                  <ScenarioMapView 
                    scenarioId={scenario.id} 
                    results={scenarioResults[scenario.id]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No results available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="metrics" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map(scenario => {
            const results = scenarioResults[scenario.id];
            if (!results) return null;
            
            return (
              <React.Fragment key={scenario.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{scenario.name} - Congestion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {results.congestion ? `${(results.congestion * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {baselineResult ? 
                        `${((results.congestion / baselineResult.congestion - 1) * 100).toFixed(1)}% vs baseline` : 
                        'No baseline for comparison'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{scenario.name} - Emissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {results.emissions ? `${results.emissions.toLocaleString()} tons` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {baselineResult ? 
                        `${((results.emissions / baselineResult.emissions - 1) * 100).toFixed(1)}% vs baseline` : 
                        'No baseline for comparison'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{scenario.name} - Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {results.accessibility ? results.accessibility.toFixed(2) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {baselineResult ? 
                        `${((results.accessibility / baselineResult.accessibility - 1) * 100).toFixed(1)}% vs baseline` : 
                        'No baseline for comparison'}
                    </p>
                  </CardContent>
                </Card>
              </React.Fragment>
            );
          })}
        </div>
      </TabsContent>
    </div>
  );
} 