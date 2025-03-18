'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ScenariosComparisonDashboard } from '@/components/trend-navigator/scenarios-comparison-dashboard';
import { ScenarioDefinition } from '@/types/trend-navigator';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComparisonInsights } from '@/components/trend-navigator/comparison-insights';

export default function ScenarioComparisonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [baselineScenarioId, setBaselineScenarioId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const _supabase = createClient();

  // Parse query params on page load
  useEffect(() => {
    const ids = searchParams.get('ids');
    const baseline = searchParams.get('baseline');
    
    if (ids) {
      const scenarioIds = ids.split(',');
      setSelectedScenarioIds(scenarioIds);
    }
    
    if (baseline) {
      setBaselineScenarioId(baseline);
    }
  }, [searchParams]);

  // Load all available scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/scenarios');
        if (!response.ok) {
          throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
        }
        
        const data = await response.json();
        setScenarios(data.scenarios || []);
      } catch (err) {
        console.error('Error loading scenarios:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scenarios');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadScenarios();
  }, []);

  // Update URL when selection changes
  useEffect(() => {
    if (selectedScenarioIds.length > 0) {
      const params = new URLSearchParams();
      params.set('ids', selectedScenarioIds.join(','));
      
      if (baselineScenarioId) {
        params.set('baseline', baselineScenarioId);
      }
      
      router.replace(`/scenarios/compare?${params.toString()}`);
    }
  }, [selectedScenarioIds, baselineScenarioId, router]);

  const handleScenarioSelection = (selectedIds: string[]) => {
    setSelectedScenarioIds(selectedIds);
    
    // If baseline is no longer in selection, reset it
    if (baselineScenarioId && !selectedIds.includes(baselineScenarioId)) {
      setBaselineScenarioId(undefined);
    }
  };

  const handleBaselineSelection = (id: string) => {
    setBaselineScenarioId(id);
    
    // If selected baseline is not in selected scenarios, add it
    if (!selectedScenarioIds.includes(id)) {
      setSelectedScenarioIds([...selectedScenarioIds, id]);
    }
  };

  if (isLoading && scenarios.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-64 h-8" />
        </div>
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-[600px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/scenarios')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Compare Scenarios</h1>
        </div>
        <Button onClick={() => router.push('/scenarios')}>
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Scenarios to Compare</label>
          <MultiSelect
            value={selectedScenarioIds}
            onChange={handleScenarioSelection}
            options={scenarios.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select scenarios..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Baseline Scenario (Optional)</label>
          <Select value={baselineScenarioId} onValueChange={handleBaselineSelection}>
            <SelectTrigger>
              <SelectValue placeholder="Select baseline scenario..." />
            </SelectTrigger>
            <SelectContent>
              {selectedScenarioIds.length > 0 ? (
                selectedScenarioIds.map(id => {
                  const scenario = scenarios.find(s => s.id === id);
                  return scenario ? (
                    <SelectItem key={id} value={id}>{scenario.name}</SelectItem>
                  ) : null;
                })
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Select scenarios to compare first
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedScenarioIds.length > 0 ? (
        <>
          <ComparisonInsights 
            scenarioIds={selectedScenarioIds}
            baselineScenarioId={baselineScenarioId}
            className="mb-8"
          />
          
          <ScenariosComparisonDashboard 
            scenarioIds={selectedScenarioIds}
            baselineScenarioId={baselineScenarioId}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg border-gray-300 bg-gray-50">
          <p className="text-muted-foreground mb-4">Select at least one scenario to begin comparison</p>
          <Button onClick={() => router.push('/scenarios')}>
            Browse Scenarios
          </Button>
        </div>
      )}
    </div>
  );
} 