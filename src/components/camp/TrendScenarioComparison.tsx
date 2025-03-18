import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendScenario, TrendScenarioComparison as ComparisonData } from '@/types/trend-navigator';
import { TrendNavigator } from '@/lib/camp/trend-navigator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, RefreshCw, Download, BarChart2 } from 'lucide-react';

// Import chart components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TrendScenarioComparisonProps {
  scenarioIds: string[];
  scenarios: TrendScenario[];
  trendNavigator: TrendNavigator | null;
}

export default function TrendScenarioComparison({
  scenarioIds,
  scenarios,
  trendNavigator,
}: TrendScenarioComparisonProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (trendNavigator && scenarioIds.length > 0) {
      loadComparisonData();
    }
  }, [scenarioIds, trendNavigator]);

  const loadComparisonData = async () => {
    if (!trendNavigator) return;

    setLoading(true);
    setError(null);

    try {
      const comparison = await trendNavigator.compareScenarios(scenarioIds);
      setComparisonData(comparison as ComparisonData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading comparison data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      toast({
        title: 'Comparison Error',
        description: 'Failed to load scenario comparison data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format percentage change value with + or - sign
  const formatPercentChange = (value: number) => {
    const formattedValue = value.toFixed(1);
    return value > 0 ? `+${formattedValue}%` : `${formattedValue}%`;
  };

  // Get color class based on value and metric type (positive is good for some metrics, bad for others)
  const getChangeColorClass = (value: number, metricType: string) => {
    // For emissions, vmt, vht - negative is good
    const negativeIsGood = ['emissions', 'vmt', 'vht', 'congestion'];
    const isGoodMetric = negativeIsGood.some(metric => metricType.includes(metric));

    if (value === 0) return 'text-gray-500';

    if (isGoodMetric) {
      return value < 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return value > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  // Get scenario name by ID
  const getScenarioName = (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario?.name || 'Unknown Scenario';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center flex-col text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Comparison</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadComparisonData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center flex-col text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Comparison Data</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't generate comparison data for the selected scenarios.
              Make sure all scenarios have been run successfully.
            </p>
            <Button onClick={loadComparisonData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Scenario Comparison</h2>
          <p className="text-muted-foreground">
            Comparing {comparisonData.scenarios.length + 1} scenarios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart2 className="h-4 w-4 mr-2" />
            Visualize
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="emissions">Emissions</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Metric</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Reference
                          <Badge variant="outline" className="ml-2">
                            {getScenarioName(comparisonData.reference.id)}
                          </Badge>
                        </div>
                      </TableHead>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableHead key={scenario.id}>
                          <div className="flex items-center">
                            {getScenarioName(scenario.id)}
                            <Badge variant="outline" className="ml-2">
                              Δ Change
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">VMT</TableCell>
                      <TableCell>{comparisonData.reference.metrics.vmt?.toLocaleString()}</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-vmt`} className={getChangeColorClass(scenario.metrics.vmt_change, 'vmt')}>
                          {formatPercentChange(scenario.metrics.vmt_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">VHT</TableCell>
                      <TableCell>{comparisonData.reference.metrics.vht?.toLocaleString()}</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-vht`} className={getChangeColorClass(scenario.metrics.vht_change, 'vht')}>
                          {formatPercentChange(scenario.metrics.vht_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Congestion</TableCell>
                      <TableCell>{comparisonData.reference.metrics.congestion?.toLocaleString()}</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-congestion`} className={getChangeColorClass(scenario.metrics.congestion_change, 'congestion')}>
                          {formatPercentChange(scenario.metrics.congestion_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Emissions (CO2)</TableCell>
                      <TableCell>{comparisonData.reference.metrics.emissions?.toLocaleString()} tonnes</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-emissions`} className={getChangeColorClass(scenario.metrics.emissions_change, 'emissions')}>
                          {formatPercentChange(scenario.metrics.emissions_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Accessibility</TableCell>
                      <TableCell>{comparisonData.reference.metrics.accessibility?.toLocaleString()}</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-accessibility`} className={getChangeColorClass(scenario.metrics.accessibility_change, 'accessibility')}>
                          {formatPercentChange(scenario.metrics.accessibility_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Transit Share</TableCell>
                      <TableCell>{(comparisonData.reference.metrics.transit_share * 100).toFixed(1)}%</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-transit`} className={getChangeColorClass(scenario.metrics.transit_share_change, 'transit')}>
                          {formatPercentChange(scenario.metrics.transit_share_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Walk Share</TableCell>
                      <TableCell>{(comparisonData.reference.metrics.walk_share * 100).toFixed(1)}%</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-walk`} className={getChangeColorClass(scenario.metrics.walk_share_change, 'walk')}>
                          {formatPercentChange(scenario.metrics.walk_share_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bike Share</TableCell>
                      <TableCell>{(comparisonData.reference.metrics.bike_share * 100).toFixed(1)}%</TableCell>
                      {comparisonData.scenarios.map((scenario) => (
                        <TableCell key={`${scenario.id}-bike`} className={getChangeColorClass(scenario.metrics.bike_share_change, 'bike')}>
                          {formatPercentChange(scenario.metrics.bike_share_change)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Reference', ...comparisonData.scenarios.map(s => getScenarioName(s.id))],
                    datasets: [{
                      label: 'Accessibility Index',
                      data: [
                        comparisonData.reference.metrics.accessibility,
                        ...comparisonData.scenarios.map(s => s.absolute_metrics.accessibility)
                      ],
                      backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        ...comparisonData.scenarios.map(() => 'rgba(54, 162, 235, 0.7)')
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Accessibility Index'
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emissions">
          <Card>
            <CardHeader>
              <CardTitle>Emissions Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Reference', ...comparisonData.scenarios.map(s => getScenarioName(s.id))],
                    datasets: [{
                      label: 'CO2 Emissions (tonnes)',
                      data: [
                        comparisonData.reference.metrics.emissions,
                        ...comparisonData.scenarios.map(s => s.absolute_metrics.emissions)
                      ],
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        ...comparisonData.scenarios.map(() => 'rgba(255, 159, 64, 0.7)')
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'CO2 Emissions (tonnes)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Reference', ...comparisonData.scenarios.map(s => getScenarioName(s.id))],
                    datasets: [
                      {
                        label: 'VMT',
                        data: [
                          comparisonData.reference.metrics.vmt,
                          ...comparisonData.scenarios.map(s => s.absolute_metrics.vmt)
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                      },
                      {
                        label: 'VHT',
                        data: [
                          comparisonData.reference.metrics.vht,
                          ...comparisonData.scenarios.map(s => s.absolute_metrics.vht)
                        ],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)'
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Value'
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 