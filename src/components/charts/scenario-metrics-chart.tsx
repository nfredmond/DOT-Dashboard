'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioResult } from '@/types/trend-navigator';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export type MetricCategory = 'congestion' | 'emissions' | 'accessibility' | 'equity' | 'safety';

export interface ScenarioMetricsChartProps {
  scenarioResults: ScenarioResult;
  baselineResults?: ScenarioResult;
  className?: string;
  initialCategory?: MetricCategory;
}

// Define color scheme for metrics
const COLORS = {
  scenario: 'rgba(53, 162, 235, 0.8)',
  baseline: 'rgba(210, 210, 210, 0.7)',
  improvement: 'rgba(75, 192, 192, 0.8)',
  worsening: 'rgba(255, 99, 132, 0.8)'
};

// Define metric units and formatting
const METRIC_CONFIG: Record<string, {unit: string, title: string, description: string}> = {
  congestion: {
    unit: 'hours',
    title: 'Congestion Metrics',
    description: 'Average daily delay in vehicle hours'
  },
  emissions: {
    unit: 'tons',
    title: 'Emissions Metrics',
    description: 'Daily CO2 emissions in metric tons'
  },
  accessibility: {
    unit: 'score',
    title: 'Accessibility Metrics',
    description: 'Jobs accessible within 30 minutes by mode'
  },
  equity: {
    unit: 'score',
    title: 'Equity Metrics',
    description: 'Transportation equity index by population group'
  },
  safety: {
    unit: 'incidents',
    title: 'Safety Metrics',
    description: 'Daily predicted safety incidents by type'
  }
};

export function ScenarioMetricsChart({
  scenarioResults,
  baselineResults,
  className = '',
  initialCategory = 'congestion'
}: ScenarioMetricsChartProps) {
  const [category, setCategory] = useState<MetricCategory>(initialCategory);
  const [chartData, setChartData] = useState<ChartData<'bar'>>({ datasets: [], labels: [] });
  
  // Prepare chart data when results or category changes
  useEffect(() => {
    if (!scenarioResults || !scenarioResults.metrics) {
      return;
    }
    
    const metrics = scenarioResults.metrics[category] || {};
    const baselineMetrics = baselineResults?.metrics?.[category] || {};
    
    const labels = Object.keys(metrics);
    
    const datasets = [
      {
        label: 'Scenario',
        data: labels.map(label => metrics[label] || 0),
        backgroundColor: COLORS.scenario
      }
    ];
    
    // Add baseline data if available
    if (baselineResults && Object.keys(baselineMetrics).length > 0) {
      datasets.push({
        label: 'Baseline',
        data: labels.map(label => baselineMetrics[label] || 0),
        backgroundColor: COLORS.baseline
      });
      
      // Add difference/impact dataset
      datasets.push({
        label: 'Impact',
        data: labels.map(label => {
          const diff = (metrics[label] || 0) - (baselineMetrics[label] || 0);
          return diff;
        }),
        backgroundColor: labels.map(label => {
          const metricValue = metrics[label] || 0;
          const baselineValue = baselineMetrics[label] || 0;
          const isImprovement = category === 'accessibility' || category === 'equity'
            ? metricValue > baselineValue  // Higher is better for these metrics
            : metricValue < baselineValue; // Lower is better for congestion, emissions, safety
          return isImprovement ? COLORS.improvement : COLORS.worsening;
        })
      });
    }
    
    setChartData({
      labels,
      datasets
    });
  }, [scenarioResults, baselineResults, category]);
  
  // Chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: METRIC_CONFIG[category]?.unit || ''
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: METRIC_CONFIG[category]?.title || 'Scenario Metrics'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' ' + METRIC_CONFIG[category].unit;
            }
            return label;
          }
        }
      }
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{METRIC_CONFIG[category]?.title || 'Scenario Metrics'}</CardTitle>
        <CardDescription>
          {METRIC_CONFIG[category]?.description || 'Comparison of scenario metrics'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={category} onValueChange={(value) => setCategory(value as MetricCategory)}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="congestion">Congestion</TabsTrigger>
            <TabsTrigger value="emissions">Emissions</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>
          
          {Object.keys(METRIC_CONFIG).map((key) => (
            <TabsContent key={key} value={key} className="pt-4">
              <div className="h-[350px] w-full">
                <Bar options={options} data={chartData} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 