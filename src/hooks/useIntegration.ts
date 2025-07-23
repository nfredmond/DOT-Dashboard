import { useEffect, useMemo, useState } from 'react';
import IntegrationService from '@/lib/camp/integration-service';
import { useAuth } from '@/hooks/useAuth';
import logger from '@/lib/logger';
import { 
  ScenarioDefinition, 
  ScenarioResults 
} from '@/types/trend-navigator';
import { BenefitCostAnalysis } from '@/types/benefit-cost';
import { visualizeIntegratedAnalysis } from '@/lib/map-utils';
import { getClient } from '@/lib/supabase-service';

// Define simple organization type matching what we need
interface Organization {
  id: string;
}

/**
 * Hook to access the integration service for GreenChAMP, 
 * TrendNavigator, and benefit-cost analysis functionality
 */
export function useIntegration() {
  const { user } = useAuth();
  // Instead of importing from a non-existent context, we'll mock it
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a memoized instance of the integration service
  const integrationService = useMemo(() => {
    return new IntegrationService(
      organization?.id
      // Don't pass user to avoid type conflicts
    );
  }, [organization?.id]);
  
  // Update the service when organization or user changes
  useEffect(() => {
    if (organization?.id) {
      integrationService.setOrganization(organization.id);
    }
    
    // Only set user if we have one, and use type assertion if needed
    if (user) {
      try {
        // @ts-ignore - Ignoring type mismatch for now
        integrationService.setUser(user);
      } catch (err) {
        logger.error('Error setting user in integration service:', err);
      }
    }
  }, [organization?.id, user, integrationService]);
  
  /**
   * Set the current organization
   */
  const setCurrentOrganization = (org: Organization) => {
    setOrganization(org);
  };
  
  /**
   * Get all scenarios for the current organization
   */
  const getScenarios = async (): Promise<ScenarioDefinition[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const scenarios = await integrationService.getScenarios();
      return scenarios;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error getting scenarios:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Run GreenChAMP model for a scenario
   */
  const runGreenChampModel = async (
    scenarioId: string, 
    options?: Record<string, any>
  ): Promise<ScenarioResults | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await integrationService.runGreenChampModel(scenarioId, options);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error running GreenChAMP model:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Run TrendNavigator for a scenario
   */
  const runTrendNavigator = async (
    scenarioId: string,
    options?: Record<string, any>
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await integrationService.runTrendNavigator({
        scenarioId,
        ...options
      });
      return results;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error running TrendNavigator:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Run benefit-cost analysis
   */
  const runBenefitCostAnalysis = async (
    projectId: string,
    scenarioId?: string,
    options?: Record<string, any>
  ): Promise<BenefitCostAnalysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await integrationService.runBenefitCostAnalysis(
        projectId,
        scenarioId,
        options
      );
      return results;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error running benefit-cost analysis:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Create a new integrated scenario
   */
  const createIntegratedScenario = async (data: {
    name: string;
    description: string;
    baseScenarioId?: string;
    trendNavigatorOptions?: Record<string, any>;
    modelOptions?: Record<string, any>;
    benefitCostOptions?: Record<string, any>;
  }): Promise<ScenarioDefinition | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const scenario = await integrationService.createIntegratedScenario(data);
      return scenario;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error creating integrated scenario:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Generate comparison data for multiple scenarios
   */
  const generateComparisonData = async (
    scenarioIds: string[]
  ): Promise<{
    scenarios: ScenarioDefinition[];
    results: Record<string, ScenarioResults>;
    benefitCostResults?: Record<string, BenefitCostAnalysis>;
    insights?: any;
  } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await integrationService.generateComparisonData(scenarioIds);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error generating comparison data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get GeoJSON data for Mapbox visualization
   */
  const getMapboxGeoJSON = async (
    scenarioId: string
  ): Promise<GeoJSON.FeatureCollection | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to get scenario results
      const results = await integrationService.getScenarioResults(scenarioId);
      
      if (results) {
        // Generate GeoJSON from results
        return integrationService.generateMapboxGeoJSON(scenarioId, results);
      }
      
      // If no results yet, try to get map inputs
      const mapInputs = await integrationService.getGreenChampMapboxInputs(scenarioId);
      return mapInputs.network; // Return the network layer
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error getting Mapbox GeoJSON:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Generate AI insights for scenarios
   */
  const generateScenarioInsights = async (
    scenarioIds: string[]
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const insights = await integrationService.generateScenarioInsights(scenarioIds);
      return insights;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error generating scenario insights:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Visualize integrated analysis on a Mapbox map
   * @param map The Mapbox map instance
   * @param modelId The GreenChAMP model ID
   * @param scenarioId The TrendNavigator scenario ID
   * @param analysisId The Benefit-Cost analysis ID
   * @returns Promise resolving to success status
   */
  const visualizeOnMap = async (map: mapboxgl.Map, modelId: string, scenarioId: string, analysisId: string): Promise<boolean> => {
    if (!organization?.id) {
      console.error('Organization not set for integrated analysis visualization');
      return false;
    }
    
    try {
      // Log the integration action
      const supabase = getClient(organization.id);
      await supabase.from('integration_actions').insert({
        organization_id: organization.id,
        user_id: user?.id || null,
        action_type: 'INTEGRATED_VISUALIZATION',
        parameters: {
          modelId,
          scenarioId,
          analysisId
        },
        timestamp: new Date().toISOString()
      });
      
      return await visualizeIntegratedAnalysis(map, modelId, scenarioId, analysisId);
    } catch (error) {
      console.error('Error in integration visualization:', error);
      return false;
    }
  };

  /**
   * Run a complete integrated analysis including GreenChAMP modeling, 
   * TrendNavigator scenario projection, and Benefit-Cost calculation
   * @param parameters Analysis parameters
   * @returns Results of the integrated analysis 
   */
  const runIntegratedAnalysis = async (parameters: any) => {
    if (!organization?.id) {
      console.error('Organization not set for integrated analysis');
      return { success: false, error: 'No organization set' };
    }
    
    try {
      setLoading(true);
      
      // Start all three analysis components in parallel
      const [greenChampResults, trendResults, benefitCostResults] = await Promise.all([
        runGreenChampModel(parameters.scenarioId, parameters.modelOptions),
        runTrendNavigator(parameters.scenarioId, parameters.trendNavigatorOptions),
        runBenefitCostAnalysis(parameters.projectId, parameters.scenarioId, parameters.benefitCostOptions)
      ]);
      
      // Process combined results
      return {
        success: true,
        greenChamp: greenChampResults,
        trendNavigator: trendResults,
        benefitCost: benefitCostResults,
        combinedScore: calculateCombinedScore(greenChampResults, trendResults, benefitCostResults)
      };
    } catch (error) {
      console.error('Error in integrated analysis:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to calculate a combined score
  const calculateCombinedScore = (greenChamp: any, trend: any, benefitCost: any) => {
    // This would be a more sophisticated algorithm in production
    // Combining the different analysis outputs with appropriate weights
    const greenChampScore = greenChamp?.success ? 
      calculateGreenChampScore(greenChamp) : 0;
      
    const trendScore = trend?.success ? 
      calculateTrendScore(trend) : 0;
      
    const bcScore = benefitCost?.success ? 
      calculateBCScore(benefitCost) : 0;
    
    // Combined weighted score
    return {
      total: (greenChampScore * 0.3) + (trendScore * 0.3) + (bcScore * 0.4),
      components: {
        greenChamp: greenChampScore,
        trendNavigator: trendScore,
        benefitCost: bcScore
      }
    };
  };
  
  // Helper functions for specific score calculations
  const calculateGreenChampScore = (results: any) => {
    // Example scoring algorithm - would be more complex in production
    return results.metrics?.congestionReduction || 0.5;
  };
  
  const calculateTrendScore = (results: any) => {
    // Example scoring algorithm
    return results.metrics?.sustainability || 0.5;
  };
  
  const calculateBCScore = (results: any) => {
    // Example scoring algorithm
    return results.bcr > 1 ? 0.7 : 0.3;
  };

  return {
    loading,
    error,
    organization,
    setOrganization: setCurrentOrganization,
    getScenarios,
    runGreenChampModel,
    runTrendNavigator,
    runBenefitCostAnalysis,
    createIntegratedScenario,
    generateComparisonData,
    getMapboxGeoJSON,
    generateScenarioInsights,
    service: integrationService,
    visualizeOnMap,
    runIntegratedAnalysis
  };
} 