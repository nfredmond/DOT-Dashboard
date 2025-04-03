'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ScenarioMetricsChart } from '@/components/charts/scenario-metrics-chart';
import { createClient } from '@/lib/supabase/client';
import { Scenario } from '@/types/trend-navigator';
import type { ScenarioResults } from '@/types/trend-navigator';
import { RunStatus } from '@/types/camp';
import logger from '../lib/logger';

// Extended types to handle database schema differences
interface ExtendedScenarioResults extends ScenarioResults {
  metrics?: Record<string, any>;
}

interface ScenarioResultsProps {
  scenarioId: string;
  showBaselineComparison?: boolean;
}

export function ScenarioResults({
  scenarioId,
  showBaselineComparison = true
}: ScenarioResultsProps) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [results, setResults] = useState<ExtendedScenarioResults | null>(null);
  const [baselineResults, setBaselineResults] = useState<ExtendedScenarioResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  
  const supabase = createClient();
  
  // Helper to load scenario and results
  const loadScenarioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch scenario data
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*, baseline_scenario_id')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError) {
        throw new Error(`Error fetching scenario: ${scenarioError.message}`);
      }
      
      // Use proper type assertion pattern: first to unknown, then to the target type
      setScenario(scenarioData as unknown as Scenario);
      
      // Fetch latest model run status
      const { data: runData, error: runError } = await supabase
        .from('camp_model_runs')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (runError && runError.code !== 'PGRST116') { // Ignore "no rows returned" error
        logger.warn(`Error fetching model run: ${runError.message}`);
      } else if (runData) {
        setRunStatus(runData.status as RunStatus);
      }
      
      // Fetch scenario results
      const { data: resultsData, error: resultsError } = await supabase
        .from('scenario_results')
        .select('*')
        .eq('scenario_id', scenarioId)
        .single();
      
      if (resultsError && resultsError.code !== 'PGRST116') { // Ignore "no rows returned" error
        logger.warn(`Error fetching scenario results: ${resultsError.message}`);
      } else if (resultsData) {
        setResults(resultsData as unknown as ExtendedScenarioResults);
      }
      
      // If baseline scenario exists and we should show comparison, fetch baseline results
      if (showBaselineComparison && scenarioData.baseline_scenario_id) {
        const baselineId = typeof scenarioData.baseline_scenario_id === 'string' 
          ? scenarioData.baseline_scenario_id 
          : String(scenarioData.baseline_scenario_id);
        
        const { data: baselineResultsData, error: baselineResultsError } = await supabase
          .from('scenario_results')
          .select('*')
          .eq('scenario_id', baselineId)
          .single();
        
        if (baselineResultsError && baselineResultsError.code !== 'PGRST116') {
          logger.warn(`Error fetching baseline results: ${baselineResultsError.message}`);
        } else if (baselineResultsData) {
          setBaselineResults(baselineResultsData as unknown as ExtendedScenarioResults);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Fix the logger.error call by ensuring err is converted to a string
      logger.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Load scenario data on mount
  useEffect(() => {
    loadScenarioData();
  }, [scenarioId, showBaselineComparison]);
  
  // Refresh data manually
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadScenarioData();
  };
  
  // Poll for results if status is 'running'
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (runStatus === 'running') {
      interval = setInterval(() => {
        loadScenarioData();
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [runStatus]);
  
  // Determine view content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading scenario results...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (runStatus === 'running') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            The model is currently running. Results will be available soon.
          </p>
        </div>
      );
    }
    
    if (!results || !results.metrics) {
      return (
        <Alert className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No results available for this scenario yet. Run the scenario to generate results.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-6">
        <ScenarioMetricsChart 
          scenarioResults={results}
          baselineResults={baselineResults || undefined}
          className="w-full"
        />
        
        {runStatus === 'failed' && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The model run failed. Please check the scenario configuration and try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {scenario?.name || 'Scenario'} Results
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
} 