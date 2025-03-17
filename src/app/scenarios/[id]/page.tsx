'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Play, 
  VolumeX, 
  Volume2, 
  Info, 
  BarChart4, 
  MapPin,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { ScenarioDefinition, ScenarioResults, RunOptions } from '@/types/trend-navigator';
import { CAMPModelConfig } from '@/types/camp';
import { getScenario, getScenarioResults, runTrendNavigatorScenario, generateScenarioVoiceExplanation } from '@/lib/trend-navigator-service';
import ScenarioInsights from '@/components/scenario-insights';
import { ScenarioMapView } from '@/components/scenario-map-view';
import { AIAssistant } from '@/components/ai-assistant';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MetricCard } from '@/components/metric-card';
import { ScenarioMetricsChart } from '@/components/charts/scenario-metrics-chart';
import { ScenarioComparison } from '@/components/scenario-comparison';
import { Modal } from '@/components/ui/modal';
import { useSupabase } from '@/lib/supabase/client';
import { runCAMPModel, getModelRun } from '@/lib/camp-runner';

// Create a simple hook for tabs
const useTabs = (defaultTab: string) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return { activeTab, setActiveTab };
};

export default function ScenarioDetailPage({ params }: { params: { id: string } }) {
  const scenarioId = params.id;
  const router = useRouter();
  const { activeTab, setActiveTab } = useTabs('overview');
  
  // State variables
  const [scenario, setScenario] = useState<ScenarioDefinition | null>(null);
  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [audioExplanation, setAudioExplanation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [campModels, setCampModels] = useState<CAMPModelConfig[]>([]);
  const [selectedCAMPModelId, setSelectedCAMPModelId] = useState<string | undefined>(undefined);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedHorizonYear, setSelectedHorizonYear] = useState<number | null>(null);
  
  // Audio player ref
  let audioRef: HTMLAudioElement | null = null;
  
  useEffect(() => {
    // Initialize the client and fetch data
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Initialize Supabase client
        const supabase = createClient();
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Fetch the scenario
        const scenarioData = await getScenario(scenarioId);
        if (!scenarioData) {
          setError('Scenario not found');
          setIsLoading(false);
          return;
        }
        
        setScenario(scenarioData);
        
        if (scenarioData.horizonYears.length > 0) {
          setSelectedHorizonYear(Math.max(...scenarioData.horizonYears));
        }
        
        // Fetch the results, if any
        try {
          const resultsData = await getScenarioResults(scenarioId);
          setResults(resultsData);
        } catch (e) {
          // It's OK if there are no results yet
          console.log('No results available yet');
        }
        
        // Fetch CAMP models
        const { data: campData } = await supabase
          .from('camp_model_configs')
          .select('*')
          .eq('organization_id', session.user.org_id);
          
        if (campData) {
          setCampModels(campData.map((camp: any) => ({
            id: camp.id,
            name: camp.name,
            description: camp.description,
            organizationId: camp.organization_id,
            modelType: camp.model_type,
            parameters: camp.parameters || {},
            connectionDetails: camp.connection_details || {},
            createdAt: new Date(camp.created_at),
            updatedAt: new Date(camp.updated_at),
          })));
          
          // Set the default CAMP model to the one used in the scenario, if any
          if (scenarioData.campModelConfigId) {
            setSelectedCAMPModelId(scenarioData.campModelConfigId);
          } else if (campData.length > 0) {
            setSelectedCAMPModelId(campData[0].id);
          }
        }
        
        // Fetch GeoJSON data
        const { data: geoData } = await supabase
          .from('geo_data')
          .select('*')
          .eq('organization_id', session.user.org_id)
          .single();
          
        if (geoData && geoData.geo_json) {
          setGeoJsonData(geoData.geo_json);
        } else {
          // Load some default GeoJSON if none is available
          try {
            const response = await fetch('/api/default-geojson');
            const defaultGeoJson = await response.json();
            setGeoJsonData(defaultGeoJson);
          } catch (e) {
            console.error('Failed to load default GeoJSON', e);
          }
        }
      } catch (e) {
        console.error('Error loading scenario:', e);
        setError('Failed to load scenario data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [scenarioId, router]);
  
  const handleRunScenario = async () => {
    try {
      setIsRunning(true);
      setError(undefined);
      
      if (!scenario) {
        throw new Error('No scenario loaded');
      }
      
      const options = {
        scenarioId,
        campModelConfigId: selectedCAMPModelId,
        horizonYears: scenario.horizonYears,
        options: {
          runType: 'full',
          includeBaseline: true,
          generateSpatialResults: true
        } as RunOptions
      };
      
      const results = await runTrendNavigatorScenario(options);
      setResults(results);
      
      // Show results tab after successful run
      setActiveTab('results');
    } catch (e) {
      console.error('Error running scenario:', e);
      setError('Failed to run scenario. Please check your inputs and try again.');
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleGenerateVoiceExplanation = async () => {
    try {
      if (!results) {
        throw new Error('No results available');
      }
      
      const audioUrl = await generateScenarioVoiceExplanation(scenarioId);
      if (typeof audioUrl === 'string') {
        setAudioExplanation(audioUrl);
        
        // Create audio element and play
        audioRef = new Audio(audioUrl);
        audioRef.onplay = () => setIsPlaying(true);
        audioRef.onpause = () => setIsPlaying(false);
        audioRef.onended = () => setIsPlaying(false);
        audioRef.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Error generating voice explanation:', e);
      setError('Failed to generate voice explanation. Please try again later.');
    }
  };
  
  const toggleAudioPlayback = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
    }
  };
  
  const handleShareScenario = () => {
    // Copy shareable link to clipboard
    navigator.clipboard.writeText(window.location.href);
    
    // Show toast notification (implementation depends on your UI library)
    alert('Scenario link copied to clipboard');
  };
  
  if (isLoading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/scenarios')}
        >
          Return to Scenarios
        </Button>
      </div>
    );
  }
  
  if (!scenario) {
    return (
      <div className="container py-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Scenario Not Found</AlertTitle>
          <AlertDescription>
            The requested scenario could not be found. It may have been deleted or you may not have permission to view it.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/scenarios')}
        >
          Return to Scenarios
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{scenario.name}</h1>
          <p className="text-muted-foreground">{scenario.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareScenario}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!results}
            onClick={handleGenerateVoiceExplanation}
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <VolumeX className="h-4 w-4" />
                Stop Audio
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Explain Results
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            disabled={isRunning}
            onClick={handleRunScenario}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run Scenario'}
          </Button>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
          <TabsTrigger value="insights" disabled={!results}>AI Insights</TabsTrigger>
          <TabsTrigger value="map" disabled={!results}>Map View</TabsTrigger>
        </TabsList>
        
        {/* Tab content */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          {/* Scenario Overview Components will go here */}
          <div className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Scenario Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Base Year:</span>{' '}
                    {scenario.baseYear}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Horizon Years:</span>{' '}
                    {scenario.horizonYears.join(', ')}
                  </div>
                  {scenario.tags && (
                    <div>
                      <span className="text-muted-foreground">Tags:</span>{' '}
                      {scenario.tags.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Trends:</span>{' '}
                    {scenario.assumptions?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Policy Packages:</span>{' '}
                    {scenario.policyPackages?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground">CAMP Model:</span>{' '}
                    {campModels.find(m => m.id === selectedCAMPModelId)?.name || 'None selected'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6 pt-6">
          {/* Scenario Trends Components will go here */}
          <div className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Trend Assumptions</h2>
            {scenario.assumptions && scenario.assumptions.length > 0 ? (
              <div className="space-y-4">
                {scenario.assumptions.map((assumption, index) => (
                  <div key={index} className="border p-3 rounded-md">
                    <h3 className="font-medium">{assumption.name}</h3>
                    <p className="text-sm text-muted-foreground">{assumption.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No trend assumptions defined for this scenario.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="policies" className="space-y-6 pt-6">
          {/* Scenario Policies Components will go here */}
          <div className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Policy Packages</h2>
            {scenario.policyPackages && scenario.policyPackages.length > 0 ? (
              <div className="space-y-4">
                {scenario.policyPackages.map((policy, index) => (
                  <div key={index} className="border p-3 rounded-md">
                    <h3 className="font-medium">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No policy packages defined for this scenario.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6 pt-6">
          {results ? (
            <div className="space-y-6">
              <div className="border p-4 rounded-md">
                <h2 className="text-xl font-semibold mb-4">Scenario Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(results.aggregateMetrics).map((year) => (
                    <div key={year} className="border p-3 rounded-md">
                      <h3 className="font-medium">Year {year}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm flex justify-between">
                          <span className="text-muted-foreground">VMT:</span>
                          <span>{formatNumber(results.aggregateMetrics[year].vmt as number)}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="text-muted-foreground">GHG Emissions:</span>
                          <span>{formatNumber(results.aggregateMetrics[year].ghg_emissions as number)} tons</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="text-muted-foreground">Transit Share:</span>
                          <span>{((results.aggregateMetrics[year].transit_mode_share as number) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                This scenario has not been run yet. Click the "Run Scenario" button to generate results.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6 pt-6">
          {results ? (
            <ScenarioInsights
              scenarioId={scenarioId}
              scenario={scenario}
              results={results}
              isLoading={false}
            />
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Insights</AlertTitle>
              <AlertDescription>
                Insights will be available after running the scenario. Click the "Run Scenario" button to generate results.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="map" className="space-y-6 pt-6">
          {results && geoJsonData && selectedHorizonYear ? (
            <ScenarioMapView
              scenarioId={scenarioId}
              results={results}
              geoJsonData={geoJsonData}
              spatialResults={results.spatialResults}
              horizonYear={selectedHorizonYear}
              centerCoords={[40, -95]} // Default to US center
              initialZoom={4}
              onZoneClick={(zoneId) => console.log('Zone clicked:', zoneId)}
            />
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Map Data</AlertTitle>
              <AlertDescription>
                GIS visualization will be available after running the scenario. Click the "Run Scenario" button to generate results.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      
      {/* AI Assistant */}
      <div className="fixed bottom-4 right-4 z-50">
        <AIAssistant
          scenarioId={scenarioId}
          scenario={scenario}
          results={results}
          onRunScenario={handleRunScenario}
          onNavigate={(route) => router.push(route)}
        />
      </div>
    </div>
  );
}

// Helper function to format numbers
function formatNumber(value: number): string {
  return value.toLocaleString();
} 