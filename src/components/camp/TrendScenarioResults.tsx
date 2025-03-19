import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  PlayIcon, 
  RefreshCw, 
  AlertTriangle, 
  Loader2,
  Share2
} from 'lucide-react';
import { TrendScenario } from '@/types/trend-navigator';
import { formatRelative } from 'date-fns';

interface TrendScenarioResultsProps {
  scenario: TrendScenario;
  onRunScenario: () => void;
  isRunning: boolean;
}

/**
 * Component to display the results of a trend scenario run
 */
export default function TrendScenarioResults({ 
  scenario, 
  onRunScenario,
  isRunning 
}: TrendScenarioResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [formattedTime, setFormattedTime] = useState<string | null>(null);
  
  // Format the last run time relative to now
  useEffect(() => {
    if (scenario.last_run_at) {
      const lastRunDate = new Date(scenario.last_run_at);
      setFormattedTime(formatRelative(lastRunDate, new Date()));
    } else {
      setFormattedTime(null);
    }
  }, [scenario.last_run_at]);
  
  // Get scenario results and metrics
  const getScenarioResults = () => {
    try {
      if (!scenario.result_id || !scenario.custom_data) {
        return null;
      }
      
      // eslint-disable-next-line no-console
      console.log('Displaying results for scenario:', scenario.id);
      
      // In a real application, we would fetch the results from the database
      // using scenario.result_id. For now, we'll use placeholder data.
      return {
        metrics: {
          vmt: 1250000,
          vht: 42500,
          transit_share: 0.12,
          walk_share: 0.08,
          bike_share: 0.04,
          auto_share: 0.76,
          congestion: 0.78,
          emissions: 12450,
          accessibility: 0.68
        },
        zones: scenario.custom_data.zoneData || [],
        // More results data would go here...
      };
    } catch (error) {
      return null;
    }
  };

  // Get status badge based on scenario run status
  const getStatusBadge = () => {
    switch (scenario.run_status) {
      case 'running':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatRelative(new Date(dateString), new Date());
    } catch (e) {
      return dateString;
    }
  };

  // Export results to CSV
  const handleExportResults = () => {
    // Implementation for exporting results would go here
  };

  // Share results
  const handleShareResults = () => {
    // Implementation for sharing results would go here
  };

  const renderSummaryTab = () => {
    // Implementation of renderSummaryTab
  };

  const renderAccessibilityTab = () => {
    // Implementation of renderAccessibilityTab
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{scenario.name}</h2>
          {scenario.description && (
            <p className="text-muted-foreground">{scenario.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">Status:</span>
            {getStatusBadge()}
            {scenario.last_run_at && (
              <span className="text-sm text-muted-foreground">
                Last run: {formatDate(scenario.last_run_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onRunScenario} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Run Scenario
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportResults}
            disabled={!scenario.result_id}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={handleShareResults}
            disabled={!scenario.result_id}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {scenario.error_message && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-800">Error Running Scenario</h3>
                <p className="text-red-700">{scenario.error_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="trends">Trend Impacts</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {renderSummaryTab()}
        </TabsContent>

        <TabsContent value="accessibility">
          {renderAccessibilityTab()}
        </TabsContent>

        <TabsContent value="trends">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Trend Impacts</h3>
            {scenario.trendImpacts.length === 0 ? (
              <p>No trends configured for this scenario</p>
            ) : (
              <div className="space-y-4">
                {scenario.trendImpacts.map((impact) => (
                  <Card key={impact.trendId}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{impact.trendId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Intensity: {impact.intensity}%
                          </p>
                        </div>
                        <div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${impact.intensity}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Raw Data</h3>
            {!scenario.result_id ? (
              <p>No data available</p>
            ) : (
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {JSON.stringify(getScenarioResults(), null, 2)}
              </pre>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 