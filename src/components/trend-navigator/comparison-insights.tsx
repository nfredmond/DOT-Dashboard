'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import logger from '../../lib/logger';


interface ComparisonInsightsProps {
  scenarioIds: string[];
  baselineScenarioId?: string;
  className?: string;
}

export function ComparisonInsights({
  scenarioIds,
  baselineScenarioId,
  className = '',
}: ComparisonInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [_metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInsights = async () => {
      if (!scenarioIds.length) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.set('ids', scenarioIds.join(','));
        if (baselineScenarioId) {
          params.set('baseline', baselineScenarioId);
        }
        
        const response = await fetch(`/api/scenarios/compare/insights?${params.toString()}`);
        
        if (response.status === 404) {
          // No existing insights, but this is not an error
          setInsights(null);
          setMetrics(null);
          setTimestamp(null);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch comparison insights: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInsights(data.insights);
        setMetrics(data.metrics);
        setTimestamp(data.timestamp);
      } catch (err) {
        logger.error('Error fetching comparison insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch comparison insights');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsights();
  }, [scenarioIds, baselineScenarioId]);

  const handleGenerateInsights = async () => {
    if (!scenarioIds.length) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scenarios/compare/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioIds,
          baselineScenarioId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate comparison insights: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInsights(data.insights);
      setMetrics(data.metrics);
      setTimestamp(data.timestamp);
      
      toast({
        title: data.cached ? 'Retrieved cached insights' : 'Generated new insights',
        description: `Successfully ${data.cached ? 'retrieved' : 'generated'} scenario comparison insights.`,
        variant: 'default',
      });
    } catch (err) {
      logger.error('Error generating comparison insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate comparison insights');
      
      toast({
        title: 'Error',
        description: 'Failed to generate scenario comparison insights.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Scenario Comparison Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {insights ? 'Refresh Analysis' : 'Generate Analysis'}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {insights ? (
          <>
            <div className="text-sm mb-6 whitespace-pre-line">
              {insights}
            </div>
            {timestamp && (
              <p className="text-xs text-muted-foreground mt-4">
                Analysis generated {formatDistance(new Date(timestamp), new Date(), { addSuffix: true })}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-muted-foreground mb-4">
              No comparison analysis has been generated yet for these scenarios.
            </p>
            <Button onClick={handleGenerateInsights} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Comparison Analysis'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 