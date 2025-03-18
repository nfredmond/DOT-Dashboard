import { supabase } from "../supabase-client";
import { TrendDefinition, TrendImpact, TrendScenario } from "@/types/trend-navigator";
import { CAMPRunner } from "./camp-runner";
import { TrendNavigatorZoneMetrics } from "@/types/camp";

/**
 * TrendNavigator class for managing transportation trends and their impacts on scenarios
 */
export class TrendNavigator {
  private organizationId: string;
  // Cache for trend definitions
  private trendDefinitions: TrendDefinition[] = [];
  
  /**
   * Initialize TrendNavigator
   */
  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Load all available trend definitions
   * 
   * @returns Array of trend definitions
   */
  async loadTrends(): Promise<TrendDefinition[]> {
    try {
      // First check if we already have trends loaded
      if (this.trendDefinitions.length > 0) {
        return this.trendDefinitions;
      }

      // Fetch trends from the database
      const { data, error } = await supabase
        .from('trend_definitions')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (error) {
        console.error('Error loading trends:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('No trend definitions found for organization:', this.organizationId);
        return [];
      }

      // Store trends in the class instance for later use
      this.trendDefinitions = data as TrendDefinition[];
      
      console.log(`Loaded ${this.trendDefinitions.length} trend definitions`);
      return this.trendDefinitions;
    } catch (error) {
      console.error('Error in loadTrends:', error);
      return [];
    }
  }

  /**
   * Get a trend definition by ID
   * 
   * @param trendId ID of the trend to retrieve
   * @returns Trend definition or null if not found
   */
  async getTrendById(trendId: string): Promise<TrendDefinition | null> {
    try {
      // First try to find it in the cached definitions
      let trend = this.trendDefinitions.find(t => t.id === trendId);
      
      if (trend) {
        return trend;
      }
      
      // If not found in cache, try to load from database
      if (this.trendDefinitions.length === 0) {
        await this.loadTrends();
        
        // Check again in the newly loaded definitions
        trend = this.trendDefinitions.find(t => t.id === trendId);
        
        if (trend) {
          return trend;
        }
      }
      
      // If still not found, fetch specifically this trend
      const { data, error } = await supabase
        .from('trend_definitions')
        .select('*')
        .eq('id', trendId)
        .eq('organization_id', this.organizationId)
        .single();
      
      if (error) {
        console.error(`Error fetching trend ${trendId}:`, error);
        return null;
      }
      
      if (!data) {
        console.warn(`Trend with ID ${trendId} not found`);
        return null;
      }
      
      // Add to cache to avoid future database calls
      const fetchedTrend = data as TrendDefinition;
      if (!this.trendDefinitions.some(t => t.id === fetchedTrend.id)) {
        this.trendDefinitions.push(fetchedTrend);
      }
      
      return fetchedTrend;
    } catch (error) {
      console.error(`Error getting trend ${trendId}:`, error);
      return null;
    }
  }

  /**
   * Create a new trend
   * 
   * @param trendData Trend data to create
   * @returns The created trend
   */
  async createTrend(trendData: Partial<TrendDefinition>): Promise<TrendDefinition> {
    try {
      const newTrend: Omit<TrendDefinition, 'id'> = {
        name: trendData.name || 'New Trend',
        description: trendData.description,
        organization_id: this.organizationId,
        impacts: trendData.impacts || {
          population: 0,
          employment: 0,
          tripGeneration: 0,
          modeChoice: {
            auto: 0,
            transit: 0,
            walk: 0,
            bike: 0
          },
          networkCapacity: 0,
          networkSpeed: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('trend_definitions')
        .insert(newTrend)
        .select()
        .single();

      if (error) throw error;
      
      // Update cache with the new trend
      const createdTrend = data as TrendDefinition;
      this.trendDefinitions.push(createdTrend);
      
      return createdTrend;
    } catch (error) {
      console.error('Error creating trend:', error);
      throw error;
    }
  }

  /**
   * Update an existing trend
   */
  async updateTrend(trendId: string, updates: Partial<TrendDefinition>): Promise<TrendDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('trend_definitions')
        .update(updates)
        .eq('id', trendId)
        .eq('organization_id', this.organizationId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cache
      const updatedTrend = data as TrendDefinition;
      const index = this.trendDefinitions.findIndex(t => t.id === trendId);
      if (index >= 0) {
        this.trendDefinitions[index] = updatedTrend;
      }
      
      return updatedTrend;
    } catch (error) {
      console.error(`Error updating trend ${trendId}:`, error);
      return null;
    }
  }

  /**
   * Delete a trend
   * 
   * @param trendId ID of the trend to delete
   * @returns Success status
   */
  async deleteTrend(trendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trend_definitions')
        .delete()
        .eq('id', trendId)
        .eq('organization_id', this.organizationId);

      if (error) throw error;
      
      // Update cache
      this.trendDefinitions = this.trendDefinitions.filter(t => t.id !== trendId);
      
      return true;
    } catch (error) {
      console.error(`Error deleting trend ${trendId}:`, error);
      throw error;
    }
  }

  /**
   * Load all trend scenarios
   * 
   * @returns Array of trend scenarios
   */
  async loadScenarios(): Promise<TrendScenario[]> {
    try {
      // Fetch scenarios from the database
      const { data, error } = await supabase
        .from('trend_scenarios')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (error) {
        console.error('Error loading scenarios:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('No scenarios found for organization:', this.organizationId);
        return [];
      }

      return data as TrendScenario[];
    } catch (error) {
      console.error('Error in loadScenarios:', error);
      return [];
    }
  }

  /**
   * Create a new scenario
   * 
   * @param scenarioData Scenario data to create
   * @returns The created scenario
   */
  async createScenario(scenarioData: Partial<TrendScenario>): Promise<TrendScenario> {
    try {
      const newScenario: Omit<TrendScenario, 'id'> = {
        name: scenarioData.name || 'New Scenario',
        description: scenarioData.description,
        organization_id: this.organizationId,
        trendImpacts: scenarioData.trendImpacts || [],
        run_status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('trend_scenarios')
        .insert(newScenario)
        .select()
        .single();

      if (error) throw error;
      
      return data as TrendScenario;
    } catch (error) {
      console.error('Error creating scenario:', error);
      throw error;
    }
  }

  /**
   * Delete a scenario
   * 
   * @param scenarioId ID of the scenario to delete
   * @returns Success status
   */
  async deleteScenario(scenarioId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trend_scenarios')
        .delete()
        .eq('id', scenarioId)
        .eq('organization_id', this.organizationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting scenario ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Apply trend impacts to zone data
   * 
   * @param zoneData Original zone data
   * @param trendImpacts Trends and their impact intensity
   * @returns Modified zone data with trend impacts applied
   */
  async applyTrendImpactsToZoneData(
    zoneData: TrendNavigatorZoneMetrics[], 
    trendImpacts: TrendImpact[]
  ): Promise<TrendNavigatorZoneMetrics[]> {
    try {
      if (!zoneData || !trendImpacts || trendImpacts.length === 0) {
        return zoneData;
      }

      // Load trend definitions if not already loaded
      if (this.trendDefinitions.length === 0) {
        await this.loadTrends();
      }

      // Clone the zone data to avoid modifying the original
      const modifiedZoneData = JSON.parse(JSON.stringify(zoneData)) as TrendNavigatorZoneMetrics[];

      // Process each trend impact
      for (const trendImpact of trendImpacts) {
        // Find the trend definition
        const trendDef = this.trendDefinitions.find(t => t.id === trendImpact.trendId);
        
        if (!trendDef) {
          console.warn(`Trend definition not found for ID: ${trendImpact.trendId}`);
          continue;
        }

        // Scale impact based on intensity (0-100%)
        const impactScale = trendImpact.intensity / 100;

        // Apply trend impacts to each zone
        modifiedZoneData.forEach(zone => {
          // Apply trip generation impacts
          if (trendDef.impacts.tripGeneration) {
            const tripGenImpact = trendDef.impacts.tripGeneration * impactScale;
            zone.tripProduction *= (1 + tripGenImpact);
            zone.tripAttraction *= (1 + tripGenImpact);
          }

          // Apply population impacts
          if (trendDef.impacts.population) {
            const popImpact = trendDef.impacts.population * impactScale;
            zone.population *= (1 + popImpact);
          }

          // Apply employment impacts
          if (trendDef.impacts.employment) {
            const empImpact = trendDef.impacts.employment * impactScale;
            zone.employment *= (1 + empImpact);
          }

          // Apply mode choice impacts if available
          if (trendDef.impacts.modeChoice && zone.modeShares) {
            const modeChoiceImpacts = trendDef.impacts.modeChoice;
            
            // Apply impact to each mode
            for (const [mode, impact] of Object.entries(modeChoiceImpacts)) {
              if (zone.modeShares[mode] !== undefined && impact !== undefined) {
                const scaledImpact = impact * impactScale;
                zone.modeShares[mode] *= (1 + scaledImpact);
              }
            }
            
            // Normalize mode shares to ensure they sum to 1
            this.normalizeModeShares(zone.modeShares);
          }
        });
      }

      return modifiedZoneData;
    } catch (error) {
      console.error('Error applying trend impacts to zone data:', error);
      return zoneData; // Return original data on error
    }
  }

  /**
   * Apply trend impacts to network data
   * 
   * @param networkData Original network data
   * @param trendImpacts Trends and their impact intensity
   * @returns Modified network data with trend impacts applied
   */
  async applyTrendImpactsToNetworkData(
    networkData: any[],
    trendImpacts: TrendImpact[]
  ): Promise<any[]> {
    try {
      if (!networkData || !trendImpacts || trendImpacts.length === 0) {
        return networkData;
      }

      // Load trend definitions if not already loaded
      if (this.trendDefinitions.length === 0) {
        await this.loadTrends();
      }

      // Clone the network data to avoid modifying the original
      const modifiedNetworkData = JSON.parse(JSON.stringify(networkData));

      // Process each trend impact
      for (const trendImpact of trendImpacts) {
        // Find the trend definition
        const trendDef = this.trendDefinitions.find(t => t.id === trendImpact.trendId);
        
        if (!trendDef) {
          console.warn(`Trend definition not found for ID: ${trendImpact.trendId}`);
          continue;
        }

        // Scale impact based on intensity (0-100%)
        const impactScale = trendImpact.intensity / 100;

        // Apply network capacity impacts
        if (trendDef.impacts.networkCapacity) {
          const capacityImpact = trendDef.impacts.networkCapacity * impactScale;
          
          // Apply to each link in the network
          for (const link of modifiedNetworkData.links || []) {
            link.capacity *= (1 + capacityImpact);
          }
        }

        // Apply network speed impacts
        if (trendDef.impacts.networkSpeed) {
          const speedImpact = trendDef.impacts.networkSpeed * impactScale;
          
          // Apply to each link in the network
          for (const link of modifiedNetworkData.links || []) {
            link.freeFlowSpeed *= (1 + speedImpact);
            
            // Adjust travel time based on new speed if available
            if (link.freeFlowTime && link.length) {
              // Recalculate travel time based on new speed
              link.freeFlowTime = link.length / link.freeFlowSpeed * 60; // Convert to minutes
            }
          }
        }
      }

      return modifiedNetworkData;
    } catch (error) {
      console.error('Error applying trend impacts to network data:', error);
      return networkData; // Return original data on error
    }
  }

  /**
   * Run a CAMP model with trend impacts applied
   */
  async runTrendScenario(scenarioId: string): Promise<boolean> {
    try {
      // Fetch the trend scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('trend_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      
      if (scenarioError) throw scenarioError;
      const scenario = scenarioData as TrendScenario;
      
      // Create a CAMP runner
      const campRunner = new CAMPRunner(this.organizationId);
      
      // Get baseline scenario data from database
      const { data: baseScenarioData, error: dataError } = await supabase
        .from('baseline_scenarios')
        .select('zone_data, network_data')
        .eq('organization_id', this.organizationId)
        .single();
      
      if (dataError || !baseScenarioData) {
        throw new Error(`Failed to fetch baseline scenario data: ${dataError?.message || 'Data not found'}`);
      }
      
      // Apply trend impacts to zone and network data
      const modifiedZoneData = await this.applyTrendImpactsToZoneData(
        baseScenarioData.zone_data,
        scenario.trendImpacts
      );
      
      const modifiedNetworkData = await this.applyTrendImpactsToNetworkData(
        baseScenarioData.network_data,
        scenario.trendImpacts
      );
      
      // Store scenario custom data
      const customData = {
        zoneData: modifiedZoneData,
        networkData: modifiedNetworkData,
        analysisPeriods: ["AM", "PM", "OffPeak"],
        modelYear: 2030,
        trendImpacts: scenario.trendImpacts
      };
      
      // Store additional data as part of the scenario record
      const { error: updateError } = await supabase
        .from('trend_scenarios')
        .update({
          custom_data: customData,
          run_status: 'running',
          last_run_at: new Date().toISOString()
        })
        .eq('id', scenarioId);
        
      if (updateError) {
        console.error(`Error updating scenario with custom data: ${updateError.message}`);
      }
      
      // Run the CAMP model with modified data
      const modelParams = {
        trip_generation: {
          production_rates: { "HOME_WORK": 0.8, "HOME_OTHER": 2.0 },
          attraction_rates: { "HOME_WORK": 0.9, "HOME_OTHER": 1.8 }
        },
        trip_distribution: {
          friction_factors: { "HOME_WORK": [1.0, 0.9, 0.8, 0.7, 0.6], "HOME_OTHER": [1.0, 0.85, 0.7, 0.55, 0.4] },
          k_factors: {}
        },
        mode_choice: {
          constants: { "auto": 0, "transit": -2.0, "walk": -3.5, "bike": -3.0 },
          coefficients: { "time": -0.03, "cost": -0.008 }
        },
        assignment: {
          volume_delay_parameters: {
            alpha: 0.15,
            beta: 4.0
          },
          convergence_criteria: 0.001,
          max_iterations: 20
        }
      };
      
      // Run the model
      const result = await campRunner.runModel(scenarioId, modelParams);
      
      // Update the scenario status based on model run results
      const runStatus = result.success ? 'completed' : 'failed';
      
      await supabase
        .from('trend_scenarios')
        .update({
          run_status: runStatus,
          result_id: result.resultId || null,
          error_message: result.success ? null : result.message,
          completed_at: result.success ? new Date().toISOString() : null
        })
        .eq('id', scenarioId);
      
      return result.success;
    } catch (error) {
      console.error(`Error running trend scenario ${scenarioId}:`, error);
      
      // Update scenario status with error
      await supabase
        .from('trend_scenarios')
        .update({
          run_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', scenarioId);
      
      return false;
    }
  }
  
  /**
   * Normalize mode shares to ensure they sum to 1
   */
  private normalizeModeShares(modeShares: Record<string, number>): void {
    const sum = Object.values(modeShares).reduce((acc, val) => acc + val, 0);
    
    if (sum > 0 && sum !== 1) {
      for (const mode in modeShares) {
        modeShares[mode] /= sum;
      }
    }
  }
  
  /**
   * Compare multiple trend scenarios to analyze their relative impacts
   * 
   * @param scenarioIds Array of scenario IDs to compare
   * @returns Comparison results with metrics for each scenario
   */
  async compareScenarios(scenarioIds: string[]): Promise<Record<string, any>> {
    try {
      if (!scenarioIds || scenarioIds.length === 0) {
        throw new Error('No scenario IDs provided for comparison');
      }
      
      console.log(`Comparing ${scenarioIds.length} scenarios`);
      
      // Get scenario data and results for all scenarios
      type ScenarioWithResults = {
        scenario: {
          id: string;
          name: string;
          description: string;
          trend_impacts: TrendImpact[];
          run_status: string;
          result_id: string;
        };
        results: any;
      };
      
      const scenariosData: ScenarioWithResults[] = [];
      
      for (const id of scenarioIds) {
        const { data, error } = await supabase
          .from('trend_scenarios')
          .select(`
            id,
            name,
            description,
            trend_impacts,
            run_status,
            result_id
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          console.error(`Error fetching scenario ${id}:`, error);
          continue;
        }
        
        if (!data) {
          console.warn(`Scenario ${id} not found`);
          continue;
        }
        
        if (data.run_status !== 'completed' || !data.result_id) {
          console.warn(`Scenario ${id} has not been successfully run`);
          continue;
        }
        
        // Get scenario results
        const { data: resultData, error: resultError } = await supabase
          .from('scenario_results')
          .select('*')
          .eq('id', data.result_id)
          .single();
          
        if (resultError || !resultData) {
          console.error(`Error fetching results for scenario ${id}:`, resultError);
          continue;
        }
        
        scenariosData.push({
          scenario: data as ScenarioWithResults['scenario'],
          results: resultData
        });
      }
      
      if (scenariosData.length === 0) {
        throw new Error('No valid scenarios found for comparison');
      }
      
      // Use the first scenario as the reference point
      const referenceScenario = scenariosData[0];
      
      // Build comparison metrics
      const comparison = {
        reference: {
          id: referenceScenario.scenario.id,
          name: referenceScenario.scenario.name,
          metrics: {
            // Extract absolute values for the reference scenario
            congestion: referenceScenario.results.congestion.average_vtc,
            emissions: referenceScenario.results.emissions.co2_tonnes,
            accessibility: referenceScenario.results.accessibility.job_accessibility.overall || 0,
            vmt: referenceScenario.results.network_metrics.total_vmt,
            vht: referenceScenario.results.network_metrics.total_vht,
            transit_share: this.extractModeShare(referenceScenario.results, 'transit'),
            bike_share: this.extractModeShare(referenceScenario.results, 'bike'),
            walk_share: this.extractModeShare(referenceScenario.results, 'walk')
          }
        },
        scenarios: [] as Array<{
          id: string;
          name: string;
          metrics: {
            congestion_change: number;
            emissions_change: number;
            accessibility_change: number;
            vmt_change: number;
            vht_change: number;
            transit_share_change: number;
            bike_share_change: number;
            walk_share_change: number;
          };
          absolute_metrics: {
            congestion: number;
            emissions: number;
            accessibility: number;
            vmt: number;
            vht: number;
            transit_share: number;
            bike_share: number;
            walk_share: number;
          };
        }>
      };
      
      // Compare each other scenario to the reference
      for (let i = 1; i < scenariosData.length; i++) {
        const scenario = scenariosData[i];
        
        comparison.scenarios.push({
          id: scenario.scenario.id,
          name: scenario.scenario.name,
          metrics: {
            // Calculate percentage changes relative to reference
            congestion_change: this.calculatePercentChange(
              scenario.results.congestion.average_vtc,
              referenceScenario.results.congestion.average_vtc
            ),
            emissions_change: this.calculatePercentChange(
              scenario.results.emissions.co2_tonnes,
              referenceScenario.results.emissions.co2_tonnes
            ),
            accessibility_change: this.calculatePercentChange(
              scenario.results.accessibility.job_accessibility.overall || 0,
              referenceScenario.results.accessibility.job_accessibility.overall || 0
            ),
            vmt_change: this.calculatePercentChange(
              scenario.results.network_metrics.total_vmt,
              referenceScenario.results.network_metrics.total_vmt
            ),
            vht_change: this.calculatePercentChange(
              scenario.results.network_metrics.total_vht,
              referenceScenario.results.network_metrics.total_vht
            ),
            transit_share_change: this.calculatePercentChange(
              this.extractModeShare(scenario.results, 'transit'),
              this.extractModeShare(referenceScenario.results, 'transit')
            ),
            bike_share_change: this.calculatePercentChange(
              this.extractModeShare(scenario.results, 'bike'),
              this.extractModeShare(referenceScenario.results, 'bike')
            ),
            walk_share_change: this.calculatePercentChange(
              this.extractModeShare(scenario.results, 'walk'),
              this.extractModeShare(referenceScenario.results, 'walk')
            )
          },
          // Also store absolute values for direct comparison
          absolute_metrics: {
            congestion: scenario.results.congestion.average_vtc,
            emissions: scenario.results.emissions.co2_tonnes,
            accessibility: scenario.results.accessibility.job_accessibility.overall || 0,
            vmt: scenario.results.network_metrics.total_vmt,
            vht: scenario.results.network_metrics.total_vht,
            transit_share: this.extractModeShare(scenario.results, 'transit'),
            bike_share: this.extractModeShare(scenario.results, 'bike'),
            walk_share: this.extractModeShare(scenario.results, 'walk')
          }
        });
      }
      
      return comparison;
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error during scenario comparison',
        reference: null,
        scenarios: []
      };
    }
  }
  
  /**
   * Helper method to extract mode share from results
   */
  private extractModeShare(results: any, mode: string): number {
    if (!results || !results.mode_shares) {
      return 0;
    }
    return results.mode_shares[mode] || 0;
  }
  
  /**
   * Calculate percentage change between two values
   */
  private calculatePercentChange(current: number, reference: number): number {
    if (reference === 0) {
      return current === 0 ? 0 : 100; // Avoid division by zero
    }
    return ((current - reference) / reference) * 100;
  }
}

export default TrendNavigator; 