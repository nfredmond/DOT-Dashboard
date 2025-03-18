'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertTriangle, RefreshCw, Lightbulb, TrendingUp, Scale, Target } from 'lucide-react';

import { analyzeScenarioResults } from '@/lib/ai-agent-service';
import { ScenarioDefinition, ScenarioResults } from '@/types/trend-navigator';
import { 
  generateScenarioInsights, 
  analyzeScenarioAspect 
} from '@/lib/scenario-insights-service';
import { useToast } from '@/components/ui/use-toast';

interface ScenarioInsightsProps {
  scenarioId: string;
  scenario: ScenarioDefinition | null;
  results: ScenarioResults | null;
  isLoading?: boolean;
  className?: string;
  isBaseline?: boolean;
  onRegenerateRequest?: () => void;
}

export default function ScenarioInsights({ 
  scenarioId, 
  scenario, 
  results, 
  isLoading = false,
  className = '',
  isBaseline = false,
  onRegenerateRequest 
}: ScenarioInsightsProps) {
  const [insightsTab, setInsightsTab] = useState('overview');
  const [insights, setInsights] = useState<any | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [_keyMetrics, setKeyMetrics] = useState<{
    vmtChange: number;
    ghgChange: number;
    transitShare: number;
    activeModeShare: number;
    congestionChange: number;
    accessibilityScore: number;
    equityScore: number;
  }>({
    vmtChange: 0,
    ghgChange: 0,
    transitShare: 0,
    activeModeShare: 0,
    congestionChange: 0,
    accessibilityScore: 0,
    equityScore: 0
  });
  const [aspectAnalysis, setAspectAnalysis] = useState<Record<string, string | null>>({});
  const [aspectLoading, setAspectLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate key metrics and load insights when results are available
  useEffect(() => {
    if (results && !isLoading) {
      calculateKeyMetrics();
      loadInsightsForTab(insightsTab);
    }
  }, [results, isLoading, scenario, insightsTab]);

  // Load new insights when tab changes
  useEffect(() => {
    if (results && !isLoading) {
      loadInsightsForTab(insightsTab);
    }
  }, [insightsTab, results, isLoading]);

  // Calculate key metrics from scenario results
  const calculateKeyMetrics = () => {
    if (!results || !results.comparisonToBaseline) return;

    // Extract key metrics from results
    const horizonYear = results.horizonYears[0];
    const metrics = results.aggregateMetrics[horizonYear];
    const comparison = results.comparisonToBaseline;

    setKeyMetrics({
      vmtChange: comparison.vmtChange || 0,
      ghgChange: comparison.ghgEmissionsChange || 0,
      transitShare: metrics?.modeShares?.transit || 0,
      activeModeShare: (metrics?.modeShares?.walk || 0) + (metrics?.modeShares?.bike || 0),
      congestionChange: comparison.congestionIndexChange || 0,
      accessibilityScore: metrics?.accessibilityIndex || 0,
      equityScore: metrics?.equityIndex || 0
    });
  };

  // Load AI-generated insights for the selected tab
  const loadInsightsForTab = async (tab: string) => {
    if (!results || !scenario || loadingInsights) return;

    setLoadingInsights(true);

    try {
      const focusArea = tab === 'overview' 
        ? 'overall' 
        : (tab as 'emissions' | 'mode_share' | 'congestion' | 'equity');

      const response = await analyzeScenarioResults(
        scenarioId,
        results,
        scenario,
        {
          focusArea,
          compareToBaseline: true,
          detailLevel: tab === 'overview' ? 'summary' : 'detailed'
        }
      );

      setInsights(response);
    } catch (error) {
      logger.error(`Error loading insights for ${tab}:`, error);
      setInsights(null);
      toast({
        title: 'Error loading insights',
        description: `Could not load AI insights for this tab. Please try again later.`,
        variant: 'destructive',
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Handle refresh of insights
  const _handleRefreshInsights = () => {
    loadInsightsForTab(insightsTab);
  };

  const generateNewInsights = async () => {
    if (!scenario?.id || !results) return;
    
    setLoadingInsights(true);
    
    try {
      const newInsights = await generateScenarioInsights(scenario.id, {
        detailLevel: 'detailed',
        includeCharts: true,
        compareToBaseline: !isBaseline && !!scenario.baselineScenarioId
      });
      
      if (newInsights) {
        setInsights(newInsights);
        toast({
          title: 'Insights generated',
          description: 'AI analysis of scenario results completed',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to generate insights');
      }
    } catch (error) {
      logger.error('Error generating insights:', error);
      toast({
        title: 'Error generating insights',
        description: 'Could not generate AI insights for this scenario',
        variant: 'destructive',
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadAspectAnalysis = async (aspect: string) => {
    if (!scenario?.id || !results) return;
    
    // Skip if already loaded
    if (aspectAnalysis[aspect] !== undefined && !loadingInsights) return;
    
    setAspectLoading(aspect);
    
    try {
      const analysis = await analyzeScenarioAspect(
        scenario.id, 
        aspect as any,
        scenario.baselineScenarioId
      );
      
      setAspectAnalysis(prev => ({
        ...prev,
        [aspect]: analysis
      }));
    } catch (error) {
      logger.error(`Error analyzing ${aspect}:`, error);
      toast({
        title: `Analysis Error`,
        description: `Could not analyze ${aspect.replace('_', ' ')} for this scenario`,
        variant: 'destructive',
      });
    } finally {
      setAspectLoading(null);
    }
  };

  const handleTabChange = (tab: string) => {
    setInsightsTab(tab);
    
    // Pre-load analysis when tab changes
    if (tab !== 'overview' && tab !== 'recommendations') {
      loadAspectAnalysis(tab);
    }
  };

  // Metric card component
  const _MetricCard = ({ 
    title, 
    value, 
    change, 
    format = 'number', 
    inverseColors = false,
    icon: Icon
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    format?: 'number' | 'percent'; 
    inverseColors?: boolean;
    icon: React.ElementType;
  }) => {
    const formattedValue = format === 'percent'
      ? `${(value * 100).toFixed(1)}%`
      : value.toLocaleString();

    const formattedChange = change !== undefined
      ? format === 'percent'
        ? `${Math.abs(change * 100).toFixed(1)}%`
        : Math.abs(change).toLocaleString()
      : null;

    // For some metrics (like emissions), a negative change is good
    const isPositiveChange = inverseColors 
      ? change !== undefined && change < 0 
      : change !== undefined && change > 0;
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{formattedValue}</p>
            </div>
            <div className="rounded-full p-2 bg-muted">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          
          {formattedChange && change !== undefined && (
            <div className="mt-3 flex items-center">
              {isPositiveChange ? (
                <ArrowUpRight className={`h-4 w-4 mr-1 ${inverseColors ? 'text-destructive' : 'text-green-500'}`} />
              ) : (
                <ArrowDownRight className={`h-4 w-4 mr-1 ${inverseColors ? 'text-green-500' : 'text-destructive'}`} />
              )}
              <span className={`text-sm font-medium ${
                isPositiveChange 
                  ? inverseColors ? 'text-destructive' : 'text-green-500' 
                  : inverseColors ? 'text-green-500' : 'text-destructive'
              }`}>
                {formattedChange} {change > 0 ? 'increase' : 'decrease'} from baseline
import logger from '../lib/logger';

              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Loading scenario results...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-muted mb-4"></div>
            <div className="h-4 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-36 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Run the scenario to generate insights</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Results Available</AlertTitle>
            <AlertDescription>
              Run this scenario to get AI-powered insights about the results.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your scenario results
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={generateNewInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {loadingInsights ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">
              Analyzing scenario results...
            </p>
          </div>
        ) : insights ? (
          <Tabs value={insightsTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="emissions">Emissions</TabsTrigger>
              <TabsTrigger value="equity">Equity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <p>{insights.summary}</p>
                
                <h3 className="text-lg font-medium mb-2 mt-4">Key Findings</h3>
                <ul className="space-y-2">
                  {insights.keyFindings.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center"
                  onClick={() => handleTabChange('emissions')}
                >
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Emissions Analysis</span>
                  </div>
                  <Badge variant="outline">
                    {results.comparisonToBaseline?.ghgEmissionsChange < 0 ? 'Improved' : 'Needs Work'}
                  </Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center"
                  onClick={() => handleTabChange('congestion')}
                >
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Congestion Analysis</span>
                  </div>
                  <Badge variant="outline">
                    {(results.aggregateMetrics?.[results.horizonYears?.[0]]?.congestionIndex ?? 0) < 0.6 ? 'Good' : 'Moderate'}
                  </Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center"
                  onClick={() => handleTabChange('transit')}
                >
                  <div className="flex items-center">
                    <span className="mr-2">🚌</span>
                    <span>Transit Analysis</span>
                  </div>
                  <Badge variant="outline">
                    {(results.aggregateMetrics?.[results.horizonYears?.[0]]?.modeShares?.transit ?? 0) > 0.15 ? 'Strong' : 'Moderate'}
                  </Badge>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center"
                  onClick={() => handleTabChange('equity')}
                >
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Equity Analysis</span>
                  </div>
                  <Badge variant="outline">
                    {(results.aggregateMetrics?.[results.horizonYears?.[0]]?.equityIndex ?? 0) > 0.7 ? 'Good' : 'Needs Focus'}
                  </Badge>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-4">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="space-y-4">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start bg-secondary/30 p-3 rounded-md">
                      <Target className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="emissions">
              {aspectLoading === 'emissions' ? (
                <div className="py-6 flex justify-center">
                  <Spinner />
                </div>
              ) : aspectAnalysis.emissions ? (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-2">Emissions Analysis</h3>
                  <div className="flex items-center mb-3">
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      GHG Emissions: {results.aggregateMetrics?.[results.horizonYears?.[0]]?.ghgEmissions?.toLocaleString() || 0} tons
                    </Badge>
                    {results.comparisonToBaseline && (
                      <Badge className={`ml-2 ${results.comparisonToBaseline?.ghgEmissionsChange && results.comparisonToBaseline.ghgEmissionsChange < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:bg-green-100`}>
                        {results.comparisonToBaseline?.ghgEmissionsChange && results.comparisonToBaseline.ghgEmissionsChange < 0 ? '↓' : '↑'} 
                        {Math.abs(results.comparisonToBaseline?.ghgEmissionsChange || 0).toFixed(1)}% vs Baseline
                      </Badge>
                    )}
                  </div>
                  <p>{aspectAnalysis.emissions}</p>
                </div>
              ) : (
                <Button onClick={() => loadAspectAnalysis('emissions')} variant="outline">
                  Load Emissions Analysis
                </Button>
              )}
            </TabsContent>
            
            <TabsContent value="equity">
              {aspectLoading === 'equity' ? (
                <div className="py-6 flex justify-center">
                  <Spinner />
                </div>
              ) : aspectAnalysis.equity ? (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-2">Equity Analysis</h3>
                  <div className="flex items-center mb-3">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                      Equity Index: {results.aggregateMetrics?.[results.horizonYears?.[0]]?.equityIndex?.toFixed(2) || '0.00'}
                    </Badge>
                  </div>
                  <p>{aspectAnalysis.equity}</p>
                </div>
              ) : (
                <Button onClick={() => loadAspectAnalysis('equity')} variant="outline">
                  Load Equity Analysis
                </Button>
              )}
            </TabsContent>
            
            <TabsContent value="congestion">
              {aspectLoading === 'congestion' ? (
                <div className="py-6 flex justify-center">
                  <Spinner />
                </div>
              ) : aspectAnalysis.congestion ? (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-2">Congestion Analysis</h3>
                  <div className="flex items-center mb-3">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      Congestion Index: {results.aggregateMetrics?.[results.horizonYears?.[0]]?.congestionIndex?.toFixed(2) || '0.00'}
                    </Badge>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                      VMT: {results.aggregateMetrics?.[results.horizonYears?.[0]]?.totalVmt?.toLocaleString() || 0}
                    </Badge>
                  </div>
                  <p>{aspectAnalysis.congestion}</p>
                </div>
              ) : (
                <Button onClick={() => loadAspectAnalysis('congestion')} variant="outline">
                  Load Congestion Analysis
                </Button>
              )}
            </TabsContent>
            
            <TabsContent value="transit">
              {aspectLoading === 'transit' ? (
                <div className="py-6 flex justify-center">
                  <Spinner />
                </div>
              ) : aspectAnalysis.transit ? (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-2">Transit Analysis</h3>
                  <div className="flex items-center mb-3">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Transit Mode Share: {((results.aggregateMetrics?.[results.horizonYears?.[0]]?.modeShares?.transit ?? 0) * 100).toFixed(1)}%
                    </Badge>
                    {results.comparisonToBaseline && (
                      <Badge className={`ml-2 ${results.comparisonToBaseline?.transitShareChange && results.comparisonToBaseline.transitShareChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:bg-green-100`}>
                        {results.comparisonToBaseline?.transitShareChange && results.comparisonToBaseline.transitShareChange > 0 ? '↑' : '↓'} 
                        {Math.abs(results.comparisonToBaseline?.transitShareChange || 0).toFixed(1)} pts vs Baseline
                      </Badge>
                    )}
                  </div>
                  <p>{aspectAnalysis.transit}</p>
                </div>
              ) : (
                <Button onClick={() => loadAspectAnalysis('transit')} variant="outline">
                  Load Transit Analysis
                </Button>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Insights Available</AlertTitle>
            <AlertDescription>
              Click "Regenerate" to analyze this scenario with AI.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 pb-3">
        <p className="text-xs text-muted-foreground">
          AI insights are generated based on scenario results. The analysis may not capture all nuances and should be used as a starting point for further investigation.
        </p>
      </CardFooter>
    </Card>
  );
} 