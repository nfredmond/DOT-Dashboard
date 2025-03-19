import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { 
  formatNumber, 
  formatPercentage 
} from '@/lib/utils';
import { 
  ActivitySimulationResults as SimResults,
  ModeSplitItem,
  TripsByPurposeItem,
  TemporalDistributionItem
} from '@/types/camp';

// Define the types for simulation results
interface SimulationResultsSummary {
  total_persons: number;
  total_activities: number;
  total_trips: number;
  peak_hour: {
    hour: number;
    count: number;
  };
}

interface ModeSplitItem {
  mode: string;
  count: number;
  percentage: number;
}

interface TripsByPurposeItem {
  purpose: string;
  count: number;
  percentage: number;
}

interface TemporalDistributionItem {
  hour: number;
  count: number;
  percentage: number;
}

interface SimulationResults {
  summary: SimulationResultsSummary;
  mode_split: ModeSplitItem[];
  trips_by_purpose: TripsByPurposeItem[];
  temporal_distribution: TemporalDistributionItem[];
}

export interface ActivitySimulationRun {
  id: string;
  scenario_id: string;
  name: string;
  description: string | null;
  parameters: any;
  status: 'running' | 'completed' | 'failed';
  results: SimulationResults | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Component properties
 */
interface ActivitySimulationResultsProps {
  results: SimResults;
}

/**
 * Activity Simulation Results Component
 * 
 * Displays the results of an activity-based simulation run.
 */
export function ActivitySimulationResults({ results }: ActivitySimulationResultsProps) {
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Available</CardTitle>
          <CardDescription>
            No simulation results are available yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Travel Mode Split</CardTitle>
          <CardDescription>Distribution of trips by transportation mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Placeholder for mode split chart */}
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-md">
              <p className="text-muted-foreground">Mode Split Visualization</p>
            </div>
          </div>
          <div className="mt-4">
            <ul className="space-y-2">
              {results.mode_split && Object.entries(results.mode_split).map(([mode, percentage]: [string, any]) => (
                <li key={mode} className="flex justify-between">
                  <span className="capitalize">{mode}</span>
                  <span>{formatPercentage(percentage)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trips by Purpose</CardTitle>
          <CardDescription>Distribution of trips by activity purpose</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Placeholder for trips by purpose chart */}
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-md">
              <p className="text-muted-foreground">Trip Purpose Visualization</p>
            </div>
          </div>
          <div className="mt-4">
            <ul className="space-y-2">
              {results.trips_by_purpose && Object.entries(results.trips_by_purpose).map(([purpose, percentage]: [string, any]) => (
                <li key={purpose} className="flex justify-between">
                  <span className="capitalize">{purpose}</span>
                  <span>{formatPercentage(percentage)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Temporal Distribution</CardTitle>
          <CardDescription>Activities and trips by time of day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Placeholder for temporal distribution chart */}
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-md">
              <p className="text-muted-foreground">Temporal Distribution Visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trip Distance Distribution</CardTitle>
          <CardDescription>Distribution of trip distances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Placeholder for trip distance distribution chart */}
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-md">
              <p className="text-muted-foreground">Trip Distance Visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Table showing mode split data
 */
function _ModeSplitTable({ modeSplit }: { modeSplit: ModeSplitItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Mode</th>
            <th className="text-right py-2">Trips</th>
            <th className="text-right py-2">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {modeSplit.map((item) => (
            <tr key={item.mode} className="border-b">
              <td className="py-2 capitalize">{item.mode}</td>
              <td className="text-right py-2">{formatNumber(item.count)}</td>
              <td className="text-right py-2">{formatPercentage(item.percentage)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2">Total</td>
            <td className="text-right py-2">
              {formatNumber(modeSplit.reduce((sum, item) => sum + item.count, 0))}
            </td>
            <td className="text-right py-2">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Table showing trip purpose data
 */
function _PurposeTable({ tripsByPurpose }: { tripsByPurpose: TripsByPurposeItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Purpose</th>
            <th className="text-right py-2">Trips</th>
            <th className="text-right py-2">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {tripsByPurpose.map((item) => (
            <tr key={item.purpose} className="border-b">
              <td className="py-2 capitalize">{item.purpose}</td>
              <td className="text-right py-2">{formatNumber(item.count)}</td>
              <td className="text-right py-2">{formatPercentage(item.percentage)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2">Total</td>
            <td className="text-right py-2">
              {formatNumber(tripsByPurpose.reduce((sum, item) => sum + item.count, 0))}
            </td>
            <td className="text-right py-2">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Bar chart showing temporal distribution
 */
function _TemporalDistributionChart({ data }: { data: TemporalDistributionItem[] }) {
  // Find the max count to scale the bars
  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className="mt-4">
      <div className="flex items-end h-64 gap-1">
        {data.map((item) => (
          <div
            key={item.hour}
            className="relative flex flex-col items-center flex-1 group"
          >
            <div 
              className="w-full bg-primary rounded-t"
              style={{ height: `${(item.count / maxCount) * 100}%` }}
            >
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {formatNumber(item.count)} trips ({formatPercentage(item.percentage)})
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
} 