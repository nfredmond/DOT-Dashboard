/**
 * Integration Service for GreenChAMP, TrendNavigator, and Benefit-Cost Analysis
 * 
 * This service coordinates data flow and operations between different modules:
 * - GreenChAMP (transportation model)
 * - TrendNavigator (scenario planning)
 * - Benefit-Cost Analysis
 * - Mapbox visualization
 */

import { createClient } from '@/lib/supabase/client';
import logger from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import { 
  ScenarioDefinition, 
  ScenarioResults, 
  TrendNavigatorRunRequest 
} from '@/types/trend-navigator';
import { BenefitCostAnalysis } from '@/types/benefit-cost';
import { calculateBenefitCostAnalysis } from '@/lib/benefit-cost-service';

export class IntegrationService {
  private supabase;
  private user: User | null = null;
  private organizationId: string | null = null;
  
  constructor(organizationId?: string, user?: User) {
    this.supabase = createClient();
    this.organizationId = organizationId || null;
    this.user = user || null;
  }
  
  /**
   * Set the current organization
   */
  setOrganization(organizationId: string) {
    this.organizationId = organizationId;
  }
  
  /**
   * Set the current user
   */
  setUser(user: User) {
    this.user = user;
  }
  
  /**
   * Get all scenarios for the current organization
   */
  async getScenarios(): Promise<ScenarioDefinition[]> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required');
    }
    
    try {
      const { data, error } = await this.supabase
        .from('scenarios')
        .select('*')
        .eq('organization_id', this.organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Error getting scenarios:', error);
      throw error;
    }
  }
  
  /**
   * Get scenario by ID
   */
  async getScenario(scenarioId: string): Promise<ScenarioDefinition | null> {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`);
      if (!response.ok) {
        throw new Error(`Failed to get scenario: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error getting scenario:', error);
      throw error;
    }
  }
  
  /**
   * Run GreenChAMP model for a scenario
   */
  async runGreenChampModel(scenarioId: string, options?: Record<string, any>): Promise<ScenarioResults> {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'greenchamp',
          ...options
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run GreenChAMP model: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error running GreenChAMP model:', error);
      throw error;
    }
  }
  
  /**
   * Get scenario results
   */
  async getScenarioResults(scenarioId: string): Promise<ScenarioResults | null> {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/results`);
      if (!response.ok) {
        throw new Error(`Failed to get scenario results: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error getting scenario results:', error);
      throw error;
    }
  }
  
  /**
   * Run TrendNavigator for a scenario
   */
  async runTrendNavigator(request: TrendNavigatorRunRequest): Promise<any> {
    try {
      const response = await fetch(`/api/trendnavigator/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run TrendNavigator: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error running TrendNavigator:', error);
      throw error;
    }
  }
  
  /**
   * Run benefit-cost analysis for a scenario or project
   */
  async runBenefitCostAnalysis(projectId: string, scenarioId?: string, options?: Record<string, any>): Promise<BenefitCostAnalysis> {
    try {
      const response = await fetch(`/api/projects/${projectId}/benefit-cost/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId,
          ...options
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run benefit-cost analysis: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error running benefit-cost analysis:', error);
      throw error;
    }
  }
  
  /**
   * Generate GeoJSON from scenario results for Mapbox visualization
   */
  generateMapboxGeoJSON(scenarioId: string, results: ScenarioResults): GeoJSON.FeatureCollection {
    // Mock implementation - would be replaced with actual data processing
    const features: GeoJSON.Feature[] = [];
    
    // Example: Add zone-based data features
    if (results.zoneData) {
      Object.entries(results.zoneData).forEach(([zoneId, zoneValues]) => {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              // This would be the actual zone geometry
              [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
            ]
          },
          properties: {
            id: zoneId,
            scenarioId,
            ...zoneValues
          }
        });
      });
    }
    
    // Example: Add network links
    if (results.networkData) {
      results.networkData.links.forEach((link) => {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: link.coordinates
          },
          properties: {
            id: link.id,
            scenarioId,
            volume: link.volume,
            speed: link.speed,
            v_c_ratio: link.v_c_ratio
          }
        });
      });
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
  
  /**
   * Generate AI insights for a scenario comparison
   */
  async generateScenarioInsights(scenarioIds: string[]): Promise<any> {
    try {
      const response = await fetch(`/api/scenarios/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioIds
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate scenario insights: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error generating scenario insights:', error);
      throw error;
    }
  }
  
  /**
   * Create a new integrated scenario linking GreenChAMP, TrendNavigator and benefit-cost
   */
  async createIntegratedScenario(data: {
    name: string;
    description: string;
    baseScenarioId?: string;
    trendNavigatorOptions?: Record<string, any>;
    modelOptions?: Record<string, any>;
    benefitCostOptions?: Record<string, any>;
  }): Promise<ScenarioDefinition> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required');
    }
    
    try {
      const response = await fetch(`/api/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organization_id: this.organizationId,
          created_by: this.user?.id
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create scenario: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error creating scenario:', error);
      throw error;
    }
  }
  
  /**
   * Generate data for scenario comparison dashboard
   */
  async generateComparisonData(scenarioIds: string[]): Promise<{
    scenarios: ScenarioDefinition[];
    results: Record<string, ScenarioResults>;
    benefitCostResults?: Record<string, BenefitCostAnalysis>;
    insights?: any;
  }> {
    try {
      const scenarios: ScenarioDefinition[] = [];
      const results: Record<string, ScenarioResults> = {};
      const benefitCostResults: Record<string, BenefitCostAnalysis> = {};
      
      // Fetch all scenarios in parallel
      await Promise.all(
        scenarioIds.map(async (id) => {
          const scenario = await this.getScenario(id);
          if (scenario) {
            scenarios.push(scenario);
            
            // Get scenario results if available
            try {
              const scenarioResults = await this.getScenarioResults(id);
              if (scenarioResults) {
                results[id] = scenarioResults;
              }
            } catch (error) {
              logger.warn(`Could not fetch results for scenario ${id}:`, error);
            }
            
            // Get benefit-cost results if available
            if (scenario.project_id) {
              try {
                const bcResults = await this.runBenefitCostAnalysis(
                  scenario.project_id, 
                  id
                );
                benefitCostResults[id] = bcResults;
              } catch (error) {
                logger.warn(`Could not fetch benefit-cost results for scenario ${id}:`, error);
              }
            }
          }
        })
      );
      
      // Generate insights if we have at least two scenarios
      let insights = null;
      if (scenarios.length >= 2) {
        try {
          insights = await this.generateScenarioInsights(scenarioIds);
        } catch (error) {
          logger.warn('Could not generate scenario insights:', error);
        }
      }
      
      return {
        scenarios,
        results,
        benefitCostResults: Object.keys(benefitCostResults).length > 0 ? benefitCostResults : undefined,
        insights
      };
    } catch (error) {
      logger.error('Error generating comparison data:', error);
      throw error;
    }
  }
  
  /**
   * Get GreenChAMP inputs compatible with Mapbox
   */
  async getGreenChampMapboxInputs(scenarioId: string): Promise<{
    zones: GeoJSON.FeatureCollection;
    network: GeoJSON.FeatureCollection;
  }> {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/map-inputs`);
      if (!response.ok) {
        throw new Error(`Failed to get map inputs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Error getting map inputs:', error);
      throw error;
    }
  }
}

export default IntegrationService; 