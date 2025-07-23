'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lightbulb, 
  ArrowDown, 
  ArrowUp, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ComparisonInsightsProps {
  scenarios: any[];
  organizationId: string;
}

/**
 * AI-powered insights for scenario comparison
 */
export function ComparisonInsights({ 
  scenarios,
  organizationId
}: ComparisonInsightsProps) {
  const { toast } = useToast();
  const [insights, setInsights] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (scenarios.length >= 2) {
      generateInsights();
    }
  }, [scenarios]);
  
  const generateInsights = async () => {
    if (scenarios.length < 2) {
      setError('At least two scenarios are required for comparison');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would call an API
      // Simulating API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sample insights (in a real app, these would come from the API)
      const mockInsights = [
        {
          type: 'summary',
          title: 'Executive Summary',
          content: `The ${scenarios[1].name} scenario shows significant improvements in emissions reduction (${Math.round(Math.random() * 25 + 5)}% lower) and transit mode share (${Math.round(Math.random() * 15 + 5)} percentage points higher) compared to the ${scenarios[0].name} scenario. However, it requires ${Math.round(Math.random() * 100 + 50)}% more capital investment.`
        },
        {
          type: 'emissions',
          title: 'Emissions Analysis',
          content: `All scenarios show reduced emissions compared to the baseline, with ${scenarios.find(s => s.name.toLowerCase().includes('transit'))?.name || scenarios[1].name} performing best with a ${Math.round(Math.random() * 30 + 10)}% reduction. This is attributed to higher transit usage and reduced vehicle miles traveled.`,
          trend: 'decreasing'
        },
        {
          type: 'modeshare',
          title: 'Mode Share Shifts',
          content: `The most notable shift is in the ${scenarios[1].name} scenario, which shows a ${Math.round(Math.random() * 10 + 5)}-point increase in transit mode share and a ${Math.round(Math.random() * 6 + 2)}-point increase in active transportation compared to baseline.`,
          highlights: [
            { mode: 'transit', change: '+7%' },
            { mode: 'walking', change: '+3%' },
            { mode: 'driving', change: '-10%' }
          ]
        },
        {
          type: 'costBenefit',
          title: 'Cost-Benefit Insights',
          content: `The ${scenarios.find(s => s.name.toLowerCase().includes('transit'))?.name || scenarios[1].name} scenario has the highest benefit-cost ratio at ${(Math.random() * 2 + 1.5).toFixed(1)}:1, suggesting strong economic returns. Time savings account for ${Math.round(Math.random() * 30 + 40)}% of total benefits.`
        },
        {
          type: 'congestion',
          title: 'Congestion Analysis',
          content: `The ${scenarios.find(s => s.name.toLowerCase().includes('road'))?.name || scenarios[2]?.name || scenarios[1].name} scenario shows a ${Math.round(Math.random() * 15 + 5)}% reduction in congested lane-miles initially, but by 2035, congestion returns to baseline levels due to induced demand. Transit investments provide more sustainable congestion relief.`,
          trend: 'mixed'
        },
        {
          type: 'recommendation',
          title: 'AI Recommendation',
          content: `Based on comprehensive analysis across metrics, the ${scenarios.find(s => s.name.toLowerCase().includes('transit'))?.name || scenarios[1].name} scenario offers the most balanced approach with sustainable emissions reductions, mode shift, and economic benefits. Consider increasing transit frequency by an additional 15% to achieve mode share targets.`
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      // Error generating insights
      setError('Failed to generate insights');
      toast({
        title: 'Error',
        description: 'Failed to generate scenario insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Lightbulb className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Analyzing scenarios with AI...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-destructive/10 p-3 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!insights || insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Lightbulb className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Select at least two scenarios to generate insights</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {insights.map((insight, index) => (
        <Card key={index} className={`${insight.type === 'recommendation' ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className={`rounded-full p-2 mr-3 ${
                insight.type === 'recommendation' 
                  ? 'bg-primary/10' 
                  : 'bg-muted'
              }`}>
                {insight.type === 'emissions' && insight.trend === 'decreasing' ? (
                  <ArrowDown className="h-4 w-4 text-green-500" />
                ) : insight.type === 'emissions' && insight.trend === 'increasing' ? (
                  <ArrowUp className="h-4 w-4 text-red-500" />
                ) : insight.type === 'recommendation' ? (
                  <Lightbulb className="h-4 w-4 text-primary" />
                ) : insight.type === 'congestion' && insight.trend === 'mixed' ? (
                  <ArrowRight className="h-4 w-4 text-amber-500" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className={`font-medium ${
                  insight.type === 'recommendation' ? 'text-primary' : ''
                }`}>
                  {insight.title}
                </h3>
                <p className="mt-1 text-sm">{insight.content}</p>
                
                {insight.type === 'modeshare' && insight.highlights && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {insight.highlights.map((highlight, i) => (
                      <div key={i} className="bg-muted rounded-md px-3 py-1.5 text-center">
                        <div className="text-xs text-muted-foreground capitalize">{highlight.mode}</div>
                        <div className={`text-sm font-medium ${
                          highlight.change.startsWith('+') 
                            ? 'text-green-500' 
                            : highlight.change.startsWith('-') 
                              ? 'text-red-500' 
                              : ''
                        }`}>
                          {highlight.change}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 