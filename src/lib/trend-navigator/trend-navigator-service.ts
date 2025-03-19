import { supabase } from '../supabase-client';
import { CAMPRunner } from '../camp/camp-runner';
import { generateInsights } from './scenario-insights-service';
import { compareScenarios } from './scenario-comparison-service';
import { ScenarioDefinition } from '@/types/trend-navigator-types';
import TrendDefinition from '@/types/trend-definition';
import logger from '../logger';

/**
 * TrendNavigator Service
 * 
 * Manages scenarios, trend analysis, and integration with the CAMP model
 * for transportation planning.
 */
export class TrendNavigatorService {
  private organizationId: string;
  private campRunner: CAMPRunner;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.campRunner = new CAMPRunner(organizationId);
  }

  /**
   * Get the TrendNavigator configuration for an organization
   */
  public async getConfig() {
    const { data, error } = await supabase
      .from('trend_navigator_configs')
      .select('*')
      .eq('organization_id', this.organizationId)
      .single();

    if (error) {
      console.error('Error fetching TrendNavigator config:', error);
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }

    return data;
  }

  /**
   * Update the TrendNavigator configuration
   */
  public async updateConfig(config: any) {
    const { data, error } = await supabase
      .from('trend_navigator_configs')
      .update(config)
      .eq('organization_id', this.organizationId)
      .single();

    if (error) {
      console.error('Error updating TrendNavigator config:', error);
      throw new Error(`Failed to update configuration: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all scenarios for an organization
   */
  public async getScenarios(filters?: any) {
    let query = supabase
      .from('scenarios')
      .select('*, camp_model_runs(*)')
      .eq('organization_id', this.organizationId);

    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scenarios:', error);
      throw new Error(`Failed to fetch scenarios: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a specific scenario by ID
   */
  public async getScenario(scenarioId: string): Promise<ScenarioDefinition> {
    try {
      logger.info(`Fetching scenario ${scenarioId} for org ${this.organizationId}`);
      
      const { data, error } = await supabase
        .from('scenarios')
        .select('*, camp_model_runs(*), scenario_results(*), scenario_insights(*)')
        .eq('id', scenarioId)
        .eq('organization_id', this.organizationId)
        .single();

      if (error) {
        console.error(`Error fetching scenario ${scenarioId}:`, error);
        throw new Error(`Failed to fetch scenario: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching scenario:', error);
      throw new Error('Failed to fetch scenario');
    }
  }

  /**
   * Create a new scenario
   */
  public async createScenario(scenarioData: any) {
    // Ensure organization ID is set
    const scenario = {
      ...scenarioData,
      organization_id: this.organizationId,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('scenarios')
      .insert(scenario)
      .select()
      .single();

    if (error) {
      console.error('Error creating scenario:', error);
      throw new Error(`Failed to create scenario: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a scenario
   */
  public async updateScenario(scenarioId: string, scenarioData: any) {
    // Prevent changing organization ID
    delete scenarioData.organization_id;

    // Add updated timestamp
    const updatedScenario = {
      ...scenarioData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('scenarios')
      .update(updatedScenario)
      .eq('id', scenarioId)
      .eq('organization_id', this.organizationId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating scenario ${scenarioId}:`, error);
      throw new Error(`Failed to update scenario: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a scenario
   */
  public async deleteScenario(scenarioId: string) {
    // Delete related data first
    await supabase
      .from('scenario_insights')
      .delete()
      .eq('scenario_id', scenarioId);

    await supabase
      .from('scenario_results')
      .delete()
      .eq('scenario_id', scenarioId);

    await supabase
      .from('camp_model_runs')
      .delete()
      .eq('scenario_id', scenarioId);

    // Delete the scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('organization_id', this.organizationId);

    if (error) {
      console.error(`Error deleting scenario ${scenarioId}:`, error);
      throw new Error(`Failed to delete scenario: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Clone a scenario
   */
  public async cloneScenario(scenarioId: string, newName: string) {
    // Get the source scenario
    const { data: sourceScenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('organization_id', this.organizationId)
      .single();

    if (fetchError || !sourceScenario) {
      console.error(`Error fetching source scenario ${scenarioId}:`, fetchError);
      throw new Error(`Failed to find source scenario: ${fetchError?.message || 'Not found'}`);
    }

    // Create a new scenario based on the source
    const newScenario = {
      ...sourceScenario,
      id: undefined,
      name: newName || `Copy of ${sourceScenario.name}`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: null
    };

    const { data: clonedScenario, error: createError } = await supabase
      .from('scenarios')
      .insert(newScenario)
      .select()
      .single();

    if (createError) {
      console.error('Error cloning scenario:', createError);
      throw new Error(`Failed to clone scenario: ${createError.message}`);
    }

    return clonedScenario;
  }

  /**
   * Run a scenario model
   */
  public async runScenario(scenarioId: string, modelParameters: any = {}) {
    // First check if the scenario exists and belongs to this organization
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('organization_id', this.organizationId)
      .single();

    if (scenarioError || !scenario) {
      console.error(`Error fetching scenario ${scenarioId}:`, scenarioError);
      throw new Error(`Failed to find scenario: ${scenarioError?.message || 'Not found'}`);
    }

    // Update scenario status to processing
    await this.updateScenario(scenarioId, { status: 'processing' });

    try {
      // Run the CAMP model
      const result = await this.campRunner.runModel(scenarioId, modelParameters);

      if (!result.success) {
        // Update scenario status to error
        await this.updateScenario(scenarioId, { status: 'error' });
        throw new Error(result.message || 'Model execution failed');
      }

      // Update scenario status to completed
      await this.updateScenario(scenarioId, { status: 'completed' });

      return { success: true, resultId: result.resultId };
    } catch (error: any) {
      console.error(`Error running scenario ${scenarioId}:`, error);

      // Update scenario status to error
      await this.updateScenario(scenarioId, { status: 'error' });

      throw new Error(`Failed to run scenario: ${error.message}`);
    }
  }

  /**
   * Get the status of a scenario model run
   */
  public async getScenarioStatus(scenarioId: string) {
    return await this.campRunner.getModelRunStatus(scenarioId);
  }

  /**
   * Generate insights for a scenario
   */
  public async generateScenarioInsights(scenarioId: string) {
    // Check if the scenario exists and has results
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*, scenario_results(*)')
      .eq('id', scenarioId)
      .eq('organization_id', this.organizationId)
      .single();

    if (scenarioError || !scenario) {
      console.error(`Error fetching scenario ${scenarioId}:`, scenarioError);
      throw new Error(`Failed to find scenario: ${scenarioError?.message || 'Not found'}`);
    }

    if (!scenario.scenario_results || scenario.scenario_results.length === 0) {
      throw new Error('Cannot generate insights: Scenario has no model results');
    }

    // Generate insights using AI
    const insights = await generateInsights(scenario, scenario.scenario_results[0]);

    // Store insights in the database
    const { data: storedInsights, error: insightsError } = await supabase
      .from('scenario_insights')
      .upsert({
        scenario_id: scenarioId,
        insights: insights.insights,
        key_findings: insights.key_findings,
        recommendations: insights.recommendations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insightsError) {
      console.error(`Error storing insights for scenario ${scenarioId}:`, insightsError);
      throw new Error(`Failed to store insights: ${insightsError.message}`);
    }

    return storedInsights;
  }

  /**
   * Compare multiple scenarios
   */
  public async compareScenarios(scenarioIds: string[], baselineScenarioId?: string) {
    // Ensure all scenarios exist and belong to this organization
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*, scenario_results(*)')
      .in('id', scenarioIds)
      .eq('organization_id', this.organizationId);

    if (scenariosError || !scenarios || scenarios.length === 0) {
      console.error('Error fetching scenarios for comparison:', scenariosError);
      throw new Error(`Failed to find scenarios: ${scenariosError?.message || 'Not found'}`);
    }

    if (scenarios.length !== scenarioIds.length) {
      const foundIds = scenarios.map(s => s.id);
      const missingIds = scenarioIds.filter(id => !foundIds.includes(id));
      throw new Error(`Some scenarios not found or not accessible: ${missingIds.join(', ')}`);
    }

    // Check if all scenarios have results
    const scenariosWithoutResults = scenarios.filter(s => !s.scenario_results || s.scenario_results.length === 0);
    if (scenariosWithoutResults.length > 0) {
      const missingResultsIds = scenariosWithoutResults.map(s => s.id);
      throw new Error(`Some scenarios have no model results: ${missingResultsIds.join(', ')}`);
    }

    // Determine baseline scenario
    let baselineScenario = null;
    if (baselineScenarioId) {
      baselineScenario = scenarios.find(s => s.id === baselineScenarioId);
      if (!baselineScenario) {
        throw new Error(`Baseline scenario not found: ${baselineScenarioId}`);
      }
    } else {
      // Use the first scenario as baseline if not specified
      baselineScenario = scenarios[0];
    }

    // Generate comparison using AI
    const comparison = await compareScenarios(scenarios, baselineScenario);

    // Store comparison in the database
    const { data: storedComparison, error: comparisonError } = await supabase
      .from('scenario_comparisons')
      .insert({
        scenario_ids: scenarioIds,
        baseline_scenario_id: baselineScenario.id,
        comparison_insights: comparison.insights,
        metrics_data: comparison.metrics,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (comparisonError) {
      console.error('Error storing scenario comparison:', comparisonError);
      throw new Error(`Failed to store comparison: ${comparisonError.message}`);
    }

    return storedComparison;
  }

  /**
   * Get available trends for scenario planning
   */
  public async getAvailableTrends(): Promise<TrendDefinition[]> {
    try {
      logger.info(`Fetching available trends for org ${this.organizationId}`);
      
      const config = await this.getConfig();
      return (config.available_trends || []).map((t: any) => t);
    } catch (error) {
      logger.error('Error fetching available trends:', error);
      throw new Error('Failed to fetch available trends');
    }
  }

  /**
   * Apply a trend to create a new scenario or modify an existing one
   */
  public async applyTrend(trendKey: string, scenarioId?: string, parameters?: any) {
    // Get the trend definition from the config
    const config = await this.getConfig();
    const trend = (config.available_trends || []).find((t: any) => t.key === trendKey);

    if (!trend) {
      throw new Error(`Trend not found: ${trendKey}`);
    }

    // If scenarioId is provided, modify that scenario, otherwise create a new one
    if (scenarioId) {
      // Get the existing scenario
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('organization_id', this.organizationId)
        .single();

      if (scenarioError || !scenario) {
        console.error(`Error fetching scenario ${scenarioId}:`, scenarioError);
        throw new Error(`Failed to find scenario: ${scenarioError?.message || 'Not found'}`);
      }

      // Apply trend modifications based on parameters or defaults
      const modifiedAssumptions = this.applyTrendModifications(scenario.assumptions, trend, parameters);

      // Update the scenario with modified assumptions
      return await this.updateScenario(scenarioId, {
        assumptions: modifiedAssumptions,
        tags: [...(scenario.tags || []), trendKey]
      });
    } else {
      // Create a new scenario with the trend applied
      const baseAssumptions = trend.default_assumptions || {};
      const modifiedAssumptions = this.applyTrendModifications(baseAssumptions, trend, parameters);

      // Get default values from config
      const defaultBaseYear = config.default_base_year || new Date().getFullYear();
      const defaultHorizonYears = config.default_horizon_years || [defaultBaseYear + 20];

      // Create the new scenario
      return await this.createScenario({
        name: `${trend.name} Scenario`,
        description: trend.description,
        base_year: defaultBaseYear,
        horizon_years: defaultHorizonYears,
        assumptions: modifiedAssumptions,
        policy_packages: [],
        tags: [trendKey]
      });
    }
  }

  /**
   * Apply trend modifications to a set of assumptions
   */
  private applyTrendModifications(baseAssumptions: any, trend: any, parameters?: any) {
    // Clone the base assumptions
    const modifiedAssumptions = { ...baseAssumptions };

    // Apply the modifications defined by the trend
    const modifications = trend.modifications || {};
    
    // Apply parameters or default values
    Object.entries(modifications).forEach(([path, modification]: [string, any]) => {
      // Get the parameter value or use the default
      const paramValue = parameters?.[path] !== undefined 
        ? parameters[path] 
        : modification.default_value;
      
      // Apply the value using the path
      this.setNestedValue(modifiedAssumptions, path.split('.'), paramValue);
    });

    return modifiedAssumptions;
  }

  /**
   * Set a nested value in an object using a path array
   */
  private setNestedValue(obj: any, pathArray: string[], value: any) {
    if (pathArray.length === 1) {
      obj[pathArray[0]] = value;
      return;
    }

    const currentKey = pathArray[0];
    if (!obj[currentKey]) {
      obj[currentKey] = {};
    }

    this.setNestedValue(obj[currentKey], pathArray.slice(1), value);
  }

  // Save a scenario
  async saveScenario(scenarioData: Partial<ScenarioDefinition>): Promise<ScenarioDefinition> {
    try {
      logger.info(`Saving scenario for org ${this.organizationId}`);
      
      // This would typically be an API call to save the scenario
      const savedScenario: ScenarioDefinition = {
        id: scenarioData.id || `scenario-${Date.now()}`,
        name: scenarioData.name || 'Untitled Scenario',
        description: scenarioData.description || '',
        baseYear: scenarioData.baseYear || new Date().getFullYear(),
        horizonYears: scenarioData.horizonYears || [new Date().getFullYear() + 10],
        assumptions: scenarioData.assumptions || [],
        policyPackages: scenarioData.policyPackages || [],
        tags: scenarioData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: this.organizationId
      };
      
      return savedScenario;
    } catch (error) {
      logger.error('Error saving scenario:', error);
      throw new Error('Failed to save scenario');
    }
  }
}

export default TrendNavigatorService; 