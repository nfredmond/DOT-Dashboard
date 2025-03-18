import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/contexts/organization-context';
import { TrendNavigator } from '@/lib/camp/trend-navigator';
import { TrendDefinition, TrendScenario } from '@/types/trend-navigator';
import TrendsList from './TrendsList';
import TrendScenariosList from './TrendScenariosList';
import TrendScenarioForm from './TrendScenarioForm';
import TrendScenarioResults from './TrendScenarioResults';
import TrendScenarioComparison from './TrendScenarioComparison';
import TrendForm from './TrendForm';
import { Loader2 } from 'lucide-react';

/**
 * TrendNavigatorDashboard component
 * Provides a UI for managing trends, scenarios, and viewing results
 */
export default function TrendNavigatorDashboard() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('trends');
  const [trendNavigator, setTrendNavigator] = useState<TrendNavigator | null>(null);
  const [trends, setTrends] = useState<TrendDefinition[]>([]);
  const [scenarios, setScenarios] = useState<TrendScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TrendScenario | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingTrend, setIsCreatingTrend] = useState(false);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [isRunningScenario, setIsRunningScenario] = useState(false);

  // Initialize TrendNavigator when organization is available
  useEffect(() => {
    if (organization?.id) {
      const navigator = new TrendNavigator(organization.id);
      setTrendNavigator(navigator);
      
      // Load initial data
      loadData(navigator);
    }
  }, [organization?.id]);

  // Load trends and scenarios
  const loadData = async (navigator: TrendNavigator) => {
    setLoading(true);
    try {
      // Load trends
      const trendsData = await navigator.loadTrends();
      setTrends(trendsData);
      
      // Load scenarios
      const scenariosData = await navigator.loadScenarios();
      setScenarios(scenariosData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trends and scenarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset form states when changing tabs
    setIsCreatingTrend(false);
    setIsCreatingScenario(false);
    setSelectedScenario(null);
  };

  // Handle trend creation
  const handleCreateTrend = async (trendData: Partial<TrendDefinition>) => {
    if (!trendNavigator) return;
    
    try {
      const newTrend = await trendNavigator.createTrend(trendData);
      setTrends([...trends, newTrend]);
      setIsCreatingTrend(false);
      
      toast({
        title: 'Success',
        description: 'Trend created successfully',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating trend:', error);
      toast({
        title: 'Error',
        description: 'Failed to create trend',
        variant: 'destructive',
      });
    }
  };

  // Handle trend deletion
  const handleDeleteTrend = async (trendId: string) => {
    if (!trendNavigator) return;
    
    try {
      await trendNavigator.deleteTrend(trendId);
      setTrends(trends.filter(t => t.id !== trendId));
      
      toast({
        title: 'Success',
        description: 'Trend deleted successfully',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting trend:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete trend',
        variant: 'destructive',
      });
    }
  };

  // Handle scenario creation
  const handleCreateScenario = async (scenarioData: Partial<TrendScenario>) => {
    if (!trendNavigator) return;
    
    try {
      const newScenario = await trendNavigator.createScenario(scenarioData);
      setScenarios([...scenarios, newScenario]);
      setIsCreatingScenario(false);
      
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scenario',
        variant: 'destructive',
      });
    }
  };

  // Handle scenario deletion
  const handleDeleteScenario = async (scenarioId: string) => {
    if (!trendNavigator) return;
    
    try {
      await trendNavigator.deleteScenario(scenarioId);
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
      
      // Reset selection if it was the deleted scenario
      if (selectedScenario?.id === scenarioId) {
        setSelectedScenario(null);
      }
      
      // Remove from comparison selection if selected
      if (selectedScenarios.includes(scenarioId)) {
        setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
      }
      
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scenario',
        variant: 'destructive',
      });
    }
  };

  // Handle scenario run
  const handleRunScenario = async (scenarioId: string) => {
    if (!trendNavigator) return;
    
    setIsRunningScenario(true);
    try {
      const success = await trendNavigator.runTrendScenario(scenarioId);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Scenario run completed successfully',
        });
        
        // Reload scenarios to get updated status
        const updatedScenarios = await trendNavigator.loadScenarios();
        setScenarios(updatedScenarios);
        
        // Update selected scenario if it was the one that ran
        if (selectedScenario?.id === scenarioId) {
          const updatedScenario = updatedScenarios.find(s => s.id === scenarioId);
          if (updatedScenario) {
            setSelectedScenario(updatedScenario);
          }
        }
      } else {
        toast({
          title: 'Error',
          description: 'Scenario run failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error running scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to run scenario',
        variant: 'destructive',
      });
    } finally {
      setIsRunningScenario(false);
    }
  };

  // Handle scenario selection for viewing results
  const handleSelectScenario = (scenario: TrendScenario) => {
    setSelectedScenario(scenario);
    setActiveTab('results');
  };

  // Handle scenario selection for comparison
  const handleToggleScenarioComparison = (scenarioId: string) => {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    }
  };

  // View comparison of selected scenarios
  const handleViewComparison = () => {
    if (selectedScenarios.length > 0) {
      setActiveTab('comparison');
    }
  };

  if (!organization?.id) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please select an organization to use TrendNavigator.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trend Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="results" disabled={!selectedScenario}>Results</TabsTrigger>
              <TabsTrigger value="comparison" disabled={selectedScenarios.length < 1}>Comparison</TabsTrigger>
            </TabsList>
            
            {/* Trends Tab */}
            <TabsContent value="trends">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Transportation Trends</h3>
                <Button onClick={() => setIsCreatingTrend(true)} disabled={isCreatingTrend}>
                  Create New Trend
                </Button>
              </div>
              
              {isCreatingTrend ? (
                <TrendForm onSubmit={handleCreateTrend} onCancel={() => setIsCreatingTrend(false)} />
              ) : (
                <TrendsList 
                  trends={trends} 
                  onDelete={handleDeleteTrend} 
                  loading={loading} 
                />
              )}
            </TabsContent>
            
            {/* Scenarios Tab */}
            <TabsContent value="scenarios">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Trend Scenarios</h3>
                <div className="space-x-2">
                  <Button 
                    onClick={handleViewComparison} 
                    disabled={selectedScenarios.length < 1}
                    variant="outline"
                  >
                    Compare Selected ({selectedScenarios.length})
                  </Button>
                  <Button onClick={() => setIsCreatingScenario(true)} disabled={isCreatingScenario}>
                    Create New Scenario
                  </Button>
                </div>
              </div>
              
              {isCreatingScenario ? (
                <TrendScenarioForm 
                  onSubmit={handleCreateScenario} 
                  onCancel={() => setIsCreatingScenario(false)}
                  availableTrends={trends}
                />
              ) : (
                <TrendScenariosList 
                  scenarios={scenarios} 
                  selectedScenarios={selectedScenarios}
                  onSelect={handleSelectScenario}
                  onToggleCompare={handleToggleScenarioComparison}
                  onDelete={handleDeleteScenario}
                  onRun={handleRunScenario}
                  isRunning={isRunningScenario}
                  loading={loading} 
                />
              )}
            </TabsContent>
            
            {/* Results Tab */}
            <TabsContent value="results">
              {selectedScenario ? (
                <TrendScenarioResults
                  scenario={selectedScenario}
                  onRunScenario={() => handleRunScenario(selectedScenario.id)}
                  isRunning={isRunningScenario}
                />
              ) : (
                <p>Select a scenario to view results</p>
              )}
            </TabsContent>
            
            {/* Comparison Tab */}
            <TabsContent value="comparison">
              {selectedScenarios.length > 0 ? (
                <TrendScenarioComparison
                  scenarioIds={selectedScenarios}
                  trendNavigator={trendNavigator}
                  scenarios={scenarios.filter(s => selectedScenarios.includes(s.id))}
                />
              ) : (
                <p>Select scenarios to compare from the Scenarios tab</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Card className="w-[300px]">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 