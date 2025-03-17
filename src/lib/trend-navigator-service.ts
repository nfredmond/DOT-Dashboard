/**
 * TrendNavigator Service
 * 
 * Provides functionality for the TrendNavigator scenario planning module
 * This service handles scenario creation, trend analysis, and integration with CAMP
 */

'use client';

import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { 
  ScenarioDefinition, 
  TrendNavigatorConfig, 
  ScenarioAssumption,
  PolicyPackage,
  ScenarioResults,
  TimeHorizon,
  ScenarioComparison,
  ScenarioImpactArea,
  Trend,
  PolicyIntervention,
  TrendNavigatorRunRequest,
  RunOptions,
  AggregateMetrics,
  BaselineComparison,
  ComparisonResult
} from '@/types/trend-navigator';
import { AgentType, runAgentQuery } from './agents-service';
import { getCAMPModelConfig, runCAMPModel, convertCAMPResultsToScenarioResults } from '@/lib/camp-runner';
import { textToSpeech, VoiceSettings } from './voice-service';
import { CAMPModelConfig, CAMPRunRequest } from '@/types/camp';

/**
 * Get all TrendNavigator configurations for an agency
 * 
 * @param agencyId The agency ID
 * @returns Array of TrendNavigator configurations
 */
export async function getTrendNavigatorConfigs(agencyId: string): Promise<TrendNavigatorConfig[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_configs')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching TrendNavigator configs:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific TrendNavigator configuration
 * 
 * @param configId The configuration ID
 * @returns The configuration or null if not found
 */
export async function getTrendNavigatorConfig(configId: string): Promise<TrendNavigatorConfig | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_configs')
    .select('*')
    .eq('id', configId)
    .single();
  
  if (error) {
    console.error('Error fetching TrendNavigator config:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new TrendNavigator configuration
 * 
 * @param agencyId The agency ID
 * @param config The configuration data
 * @returns The created configuration
 */
export async function createTrendNavigatorConfig(
  agencyId: string,
  config: Omit<TrendNavigatorConfig, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>
): Promise<TrendNavigatorConfig> {
  const supabase = createClient();
  
  const newConfig = {
    id: uuidv4(),
    agency_id: agencyId,
    ...config,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('trend_navigator_configs')
    .insert([newConfig])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating TrendNavigator config:', error);
    throw error;
  }
  
  return data;
}

/**
 * Update an existing TrendNavigator configuration
 * 
 * @param configId The configuration ID
 * @param updates The updates to apply
 * @returns The updated configuration
 */
export async function updateTrendNavigatorConfig(
  configId: string,
  updates: Partial<TrendNavigatorConfig>
): Promise<TrendNavigatorConfig> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_configs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', configId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating TrendNavigator config:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get all scenarios for a specific TrendNavigator configuration
 * 
 * @param configId The configuration ID
 * @returns Array of scenarios
 */
export async function getScenarios(configId: string): Promise<ScenarioDefinition[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_scenarios')
    .select('*')
    .eq('config_id', configId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scenarios:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific scenario
 * 
 * @param scenarioId The scenario ID
 * @returns The scenario or null if not found
 */
export async function getScenario(scenarioId: string): Promise<ScenarioDefinition | null> {
  try {
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (error) {
      console.error('Error fetching scenario:', error);
      return null;
    }

    return data as ScenarioDefinition;
  } catch (error) {
    console.error('Error in getScenario:', error);
    return null;
  }
}

/**
 * Create a new scenario
 * 
 * @param configId The configuration ID
 * @param scenario The scenario data
 * @returns The created scenario
 */
export async function createScenario(
  organizationId: string,
  scenarioData: Partial<ScenarioDefinition>
): Promise<ScenarioDefinition | null> {
  try {
    const supabase = createClient();
    if (!supabase) return null;

    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const newScenario: ScenarioDefinition = {
      id: uuidv4(),
      name: scenarioData.name || 'New Scenario',
      description: scenarioData.description || '',
      organizationId,
      createdBy: user.data.user.id,
      baselineScenarioId: scenarioData.baselineScenarioId,
      assumptions: scenarioData.assumptions || [],
      policyPackages: scenarioData.policyPackages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('scenarios')
      .insert(newScenario)
      .select()
      .single();

    if (error) {
      console.error('Error creating scenario:', error);
      return null;
    }

    return data as ScenarioDefinition;
  } catch (error) {
    console.error('Error in createScenario:', error);
    return null;
  }
}

/**
 * Update an existing scenario
 * 
 * @param scenarioId The scenario ID
 * @param updates The updates to apply
 * @returns The updated scenario
 */
export async function updateScenario(
  id: string,
  scenarioData: Partial<ScenarioDefinition>
): Promise<ScenarioDefinition | null> {
  try {
    const supabase = createClient();
    if (!supabase) return null;

    // Ensure updatedAt is set to now
    const updates = {
      ...scenarioData,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scenario:', error);
      return null;
    }

    return data as ScenarioDefinition;
  } catch (error) {
    console.error('Error in updateScenario:', error);
    return null;
  }
}

/**
 * Delete a scenario
 */
export async function deleteScenario(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    if (!supabase) return false;

    // First delete related results
    const { error: resultsError } = await supabase
      .from('scenario_results')
      .delete()
      .eq('scenarioId', id);

    if (resultsError) {
      console.error('Error deleting scenario results:', resultsError);
    }

    // Then delete the scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteScenario:', error);
    return false;
  }
}

/**
 * Get scenario results
 * 
 * @param scenarioId The scenario ID
 * @returns The results or null if not found
 */
export async function getScenarioResults(scenarioId: string): Promise<ScenarioResults | null> {
  try {
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('scenario_results')
      .select('*')
      .eq('scenarioId', scenarioId)
      .order('generatedAt', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error (empty result)
        return null;
      }
      console.error('Error fetching scenario results:', error);
      return null;
    }

    return data as ScenarioResults;
  } catch (error) {
    console.error('Error in getScenarioResults:', error);
    return null;
  }
}

/**
 * Run a TrendNavigator scenario using the CAMP model
 */
export async function runTrendNavigatorScenario(
  scenarioId: string,
  options: RunOptions = {}
): Promise<ScenarioResults | null> {
  try {
    // First, ensure the scenario exists
    const scenario = await getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }

    // Run the CAMP model
    const modelRun = await runCAMPModel(scenarioId, options);
    
    // Poll for results until the run is complete or failed
    let maxRetries = 30; // Try for 5 minutes (10 seconds × 30)
    let isComplete = false;
    let results: ScenarioResults | null = null;
    
    while (maxRetries > 0 && !isComplete) {
      // Wait 10 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check if results are available
      results = await getScenarioResults(scenarioId);
      if (results) {
        isComplete = true;
        break;
      }
      
      maxRetries--;
    }
    
    if (!results) {
      throw new Error('Run timed out or failed to produce results');
    }
    
    return results;
  } catch (error) {
    console.error('Error running TrendNavigator scenario:', error);
    return null;
  }
}

/**
 * Generate a voice explanation of the scenario results
 */
export async function generateScenarioVoiceExplanation(
  scenarioId: string
): Promise<string | null> {
  try {
    // Get scenario and results
    const scenario = await getScenario(scenarioId);
    const results = await getScenarioResults(scenarioId);
    
    if (!scenario || !results) {
      return null;
    }
    
    // In a production environment, this would call an AI service
    // Here we'll generate a simple explanation
    
    const horizonYear = results.horizonYears[0];
    const metrics = results.aggregateMetrics[horizonYear];
    
    let explanation = `In this scenario, called "${scenario.name}", `;
    
    if (results.comparisonToBaseline) {
      const comparison = results.comparisonToBaseline;
      
      if (comparison.vmtChange < 0) {
        explanation += `we see a ${Math.abs(comparison.vmtChange).toFixed(1)}% reduction in vehicle miles traveled compared to the baseline. `;
      } else {
        explanation += `we see a ${comparison.vmtChange.toFixed(1)}% increase in vehicle miles traveled compared to the baseline. `;
      }
      
      if (comparison.ghgEmissionsChange < 0) {
        explanation += `Greenhouse gas emissions are reduced by ${Math.abs(comparison.ghgEmissionsChange).toFixed(1)}%. `;
      } else {
        explanation += `Greenhouse gas emissions increase by ${comparison.ghgEmissionsChange.toFixed(1)}%. `;
      }
    }
    
    // Add information about mode shares
    if (metrics.modeShares) {
      explanation += `The primary transportation mode is driving alone at ${(metrics.modeShares.drive_alone * 100).toFixed(1)}%, `;
      explanation += `followed by transit at ${(metrics.modeShares.transit * 100).toFixed(1)}% and `;
      explanation += `walking at ${(metrics.modeShares.walk * 100).toFixed(1)}%. `;
    }
    
    // Add policy information
    if (scenario.policyPackages && scenario.policyPackages.length > 0) {
      explanation += `This scenario includes ${scenario.policyPackages.length} policy packages, `;
      explanation += `including ${scenario.policyPackages.map(p => p.name).join(', ')}. `;
    }
    
    // Add a conclusion
    explanation += `Overall, this scenario ${results.comparisonToBaseline?.vmtChange < 0 ? 'performs well' : 'may need adjustments'} in terms of transportation sustainability goals.`;
    
    return explanation;
  } catch (error) {
    console.error('Error generating scenario voice explanation:', error);
    return null;
  }
}

/**
 * Compare multiple scenarios
 */
export async function compareScenarios(
  scenarioIds: string[]
): Promise<ComparisonResult | null> {
  try {
    if (scenarioIds.length < 2) {
      throw new Error('At least two scenarios are required for comparison');
    }
    
    // Get all scenarios and their results
    const scenariosWithResults = await Promise.all(
      scenarioIds.map(async (id) => {
        const scenario = await getScenario(id);
        const results = await getScenarioResults(id);
        return { scenario, results };
      })
    );
    
    // Filter out any scenarios or results that couldn't be loaded
    const validScenarios = scenariosWithResults.filter(
      (item) => item.scenario && item.results
    );
    
    if (validScenarios.length < 2) {
      throw new Error('Not enough valid scenarios with results for comparison');
    }
    
    // Extract the horizon year (assuming all scenarios use the same horizon years)
    const horizonYear = validScenarios[0].results!.horizonYears[0];
    
    // Create comparison metrics
    const scenarioMetrics = validScenarios.map((item) => {
      const metrics = item.results!.aggregateMetrics[horizonYear];
      
      return {
        scenarioId: item.scenario!.id,
        scenarioName: item.scenario!.name,
        totalVmt: metrics.totalVmt,
        totalVht: metrics.totalVht,
        ghgEmissions: metrics.ghgEmissions,
        transitModeShare: metrics.modeShares?.transit || 0,
        walkModeShare: metrics.modeShares?.walk || 0,
        bikeModeShare: metrics.modeShares?.bike || 0,
        congestionIndex: metrics.congestionIndex || 0,
        accessibilityIndex: metrics.accessibilityIndex || 0,
        equityIndex: metrics.equityIndex || 0
      };
    });
    
    // Calculate relative differences using the first scenario as the reference
    const reference = scenarioMetrics[0];
    const comparisons = scenarioMetrics.slice(1).map((metrics) => {
      return {
        scenarioId: metrics.scenarioId,
        scenarioName: metrics.scenarioName,
        vmtChange: calculatePercentChange(metrics.totalVmt, reference.totalVmt),
        vhtChange: calculatePercentChange(metrics.totalVht, reference.totalVht),
        ghgChange: calculatePercentChange(metrics.ghgEmissions, reference.ghgEmissions),
        transitShareChange: calculatePercentagePointChange(metrics.transitModeShare, reference.transitModeShare),
        walkShareChange: calculatePercentagePointChange(metrics.walkModeShare, reference.walkModeShare),
        bikeShareChange: calculatePercentagePointChange(metrics.bikeModeShare, reference.bikeModeShare),
        congestionChange: calculatePercentChange(metrics.congestionIndex, reference.congestionIndex),
        accessibilityChange: calculatePercentChange(metrics.accessibilityIndex, reference.accessibilityIndex),
        equityChange: calculatePercentChange(metrics.equityIndex, reference.equityIndex)
      };
    });
    
    return {
      referenceScenario: {
        id: reference.scenarioId,
        name: reference.scenarioName
      },
      comparedScenarios: comparisons,
      horizonYear
    };
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    return null;
  }
}

// Helper functions

function calculatePercentChange(newValue: number, oldValue: number): number {
  if (!oldValue) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

function calculatePercentagePointChange(newValue: number, oldValue: number): number {
  return (newValue - oldValue) * 100; // Convert from decimal to percentage points
}

/**
 * Apply scenario assumptions to a CAMP model
 * 
 * @param scenarioId The scenario ID
 * @param campModelConfig The CAMP model configuration
 * @param assumptions The scenario assumptions
 * @returns Adjusted CAMP model parameters
 */
async function applyScenarioAssumptionsToCAMPModel(
  scenarioId: string,
  campModelConfig: CAMPModelConfig,
  assumptions: ScenarioAssumption[]
): Promise<CAMPModelParameters> {
  // Start with default parameters
  const parameters: CAMPModelParameters = { ...campModelConfig.defaultParameters };
  
  // Process each assumption to modify parameters
  for (const assumption of assumptions) {
    switch (assumption.trend.id) {
      case 'telecommuting':
        // Update telecommuting rate
        parameters.telecommutingRate = assumption.value / 100; // Convert from percentage
        break;
        
      case 'ecommerce':
        // Update e-commerce rate
        parameters.ecommerceRate = assumption.value / 100; // Convert from percentage
        break;
        
      case 'shared_mobility':
        // Adjust shared ride parameters
        parameters.sharedMobilityFactor = assumption.value / 100; // Convert from percentage
        break;
        
      case 'autonomous_vehicles':
        // Adjust autonomous vehicle adoption rate
        parameters.autonomousVehicleAdoption = assumption.value / 100; // Convert from percentage
        
        // AVs increase road capacity
        if (parameters.autonomousVehicleAdoption > 0) {
          // Capacity increases with AV adoption
          const capacityBoost = 1 + parameters.autonomousVehicleAdoption * 0.5; // Up to 50% increase at 100% adoption
          parameters.capacityAdjustmentFactor = capacityBoost;
        }
        break;
        
      case 'micromobility':
        // Adjust bike/scooter factor
        parameters.micromobilityFactor = assumption.value / 100; // Convert from percentage
        break;
        
      case 'electric_vehicles':
        // Adjust EV adoption rate
        parameters.electricVehicleAdoption = assumption.value / 100; // Convert from percentage
        break;
        
      case 'hybrid_vehicles':
        // Adjust hybrid vehicle adoption rate
        parameters.hybridVehicleAdoption = assumption.value / 100; // Convert from percentage
        break;
        
      case 'fleet_efficiency':
        // Adjust vehicle fleet efficiency
        parameters.fleetEfficiencyImprovement = assumption.value / 100; // Convert from percentage
        break;
        
      case 'transit_tech':
        // Adjust transit technological advances
        parameters.transitTechnologyFactor = assumption.value / 100; // Convert from percentage
        break;
        
      default:
        console.log(`Unhandled trend: ${assumption.trend.id}`);
        break;
    }
  }
  
  return parameters;
}

/**
 * Apply policy packages to a CAMP model
 * 
 * @param scenarioId The scenario ID
 * @param parameters The CAMP model parameters
 * @param policyPackages The policy packages
 * @returns Adjusted CAMP model parameters
 */
async function applyPolicyPackagesToCAMPModel(
  scenarioId: string,
  parameters: CAMPModelParameters,
  policyPackages: PolicyPackage[]
): Promise<CAMPModelParameters> {
  // Create a copy of parameters to avoid modifying the original
  const adjustedParameters = { ...parameters };
  
  // Process each policy package to modify parameters
  for (const policyPackage of policyPackages) {
    if (!policyPackage.policies) continue;
    
    for (const policy of policyPackage.policies) {
      switch (policy.id) {
        case 'transit_investment':
          // Adjust transit investment
          adjustedParameters.transitInvestment = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'bike_lanes':
          // Adjust bike infrastructure
          adjustedParameters.bikeInvestment = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'congestion_pricing':
          // Adjust congestion pricing
          adjustedParameters.congestionPricing = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'parking_management':
          // Adjust parking pricing and availability
          adjustedParameters.parkingFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'land_use_density':
          // Adjust density policy
          adjustedParameters.landUseDensityFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'mixed_use_zoning':
          // Adjust mixed use policy
          adjustedParameters.mixedUseZoningFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'tods':
          // Adjust Transit-Oriented Development policy
          adjustedParameters.transitOrientedDevelopmentFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'rideshare_incentives':
          // Adjust rideshare incentives
          adjustedParameters.rideshareIncentiveFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'ev_incentives':
          // Adjust electric vehicle incentives
          adjustedParameters.evIncentiveFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        case 'traffic_management':
          // Adjust traffic signal timing and management
          adjustedParameters.trafficManagementFactor = policy.intensity / 5; // Normalize to 0-1 range
          break;
          
        default:
          console.log(`Unhandled policy: ${policy.id}`);
          break;
      }
    }
  }
  
  return adjustedParameters;
}

/**
 * Process CAMP model results for scenario metrics
 */
function processCAMPResultsForScenario(campResults: any): any {
  // Extract and transform relevant metrics from CAMP results
  return {
    totalTrips: campResults.summary?.totalTrips || 0,
    totalVmt: campResults.summary?.vehicleMilesTraveled || 0,
    totalVht: campResults.summary?.vehicleHoursTraveled || 0,
    ghgEmissions: calculateGHGEmissions(campResults),
    modeShares: transformModeShares(campResults.summary?.modeShares || []),
    averageCommute: calculateAverageCommute(campResults),
    congestionIndex: campResults.summary?.congestionIndex || 0,
    accessibilityIndex: calculateAccessibilityIndex(campResults),
    equityIndex: calculateEquityIndex(campResults)
  };
}

/**
 * Calculate GHG emissions from travel model results
 */
function calculateGHGEmissions(campResults: any): number {
  // Simple calculation based on VMT and average emissions factor
  const vmt = campResults.summary?.vehicleMilesTraveled || 0;
  const emissionFactor = 0.35; // kg CO2 per mile (example)
  return vmt * emissionFactor;
}

/**
 * Transform mode shares into a more accessible format
 */
function transformModeShares(modeShares: any[]): Record<string, number> {
  const result = {};
  
  for (const share of modeShares) {
    result[share.mode] = share.percentage;
  }
  
  return result;
}

/**
 * Calculate average commute time from model results
 */
function calculateAverageCommute(campResults: any): number {
  // This would use detailed OD matrices and link travel times
  // Simplified example calculation
  const vht = campResults.summary?.vehicleHoursTraveled || 0;
  const trips = campResults.summary?.totalTrips || 1; // Avoid division by zero
  
  return (vht * 60) / trips; // Convert hours to minutes and divide by trips
}

/**
 * Calculate accessibility index from model results
 */
function calculateAccessibilityIndex(campResults: any): number {
  // Placeholder for accessibility calculation
  // In a real implementation, this would consider:
  // - Job accessibility by transit/walking
  // - Access to essential services
  // - Travel time to key destinations
  return 65; // Example score out of 100
}

/**
 * Calculate equity index from model results
 */
function calculateEquityIndex(campResults: any): number {
  // Placeholder for equity calculation
  // In a real implementation, this would consider:
  // - Distribution of benefits across income groups
  // - Access to opportunities for disadvantaged communities
  // - Environmental justice metrics
  return 70; // Example score out of 100
}

/**
 * Calculate comparison to baseline scenario
 */
function calculateBaselineComparison(results: ScenarioResults): BaselineComparison {
  // Placeholder for baseline comparison
  // In a real implementation, this would compare to a stored baseline scenario
  
  const baselineComparison: BaselineComparison = {
    vmtChange: -0.03, // 3% decrease
    ghgChange: -0.04, // 4% decrease
    transitModeShareChange: 0.02, // 2% increase
    totalTripsChange: 0.05, // 5% increase
    totalVmtChange: -0.03, // 3% decrease
    ghgEmissionsChange: -0.04, // 4% decrease
    congestionIndexChange: -0.02 // 2% improvement
  };
  
  return baselineComparison;
}

/**
 * Generate scenario results using AI when CAMP model is not available
 * 
 * @param scenario The scenario definition
 * @param year The target year
 * @returns Generated metrics
 */
async function generateScenarioResultsWithAI(
  scenario: ScenarioDefinition,
  year: number
): Promise<any> {
  try {
    // Prepare a description of the scenario for the AI
    const horizon = determineTimeHorizon(year, scenario.baseYear);
    
    // Build a description of the trends and assumptions
    let trendsDescription = 'Scenario trends include:';
    if (scenario.assumptions) {
      for (const assumption of scenario.assumptions) {
        trendsDescription += `\n- ${assumption.name}: ${assumption.values[horizon]} ${assumption.description || ''}`;
      }
    }
    
    // Build a description of policy packages if any
    let policiesDescription = '';
    if (scenario.policyPackages && scenario.policyPackages.length > 0) {
      policiesDescription = '\n\nPolicy interventions include:';
      for (const pkg of scenario.policyPackages) {
        policiesDescription += `\n- ${pkg.name}: ${pkg.description}`;
      }
    }
    
    // Create prompt for the AI
    const prompt = `Generate realistic transportation modeling results for the year ${year} for a scenario called "${scenario.name}". The scenario is described as: "${scenario.description}".
    
${trendsDescription}
${policiesDescription}

Base year is ${scenario.baseYear}. 

Generate the following metrics:
1. Total daily trips
2. Vehicle miles traveled (VMT)
3. Vehicle hours traveled (VHT)
4. Greenhouse gas emissions (metric tons CO2)
5. Mode shares (percentage for each mode: drive_alone, shared_ride_2, shared_ride_3_plus, transit, walk, bike, tnc, micro_mobility)
6. Average commute time (minutes)
7. Congestion index (0-100, higher means more congested)
8. Accessibility index (0-100, higher means better accessibility)
9. Equity index (0-100, higher means more equitable distribution of benefits)

Format your response as a JSON object with these metrics as keys.`;

    // Use the Planning agent to generate results
    const response = await runAgentQuery({
      prompt,
      agentType: AgentType.PLANNING,
      systemPrompt: 'You are a transportation modeling expert system that generates realistic and consistent output metrics for transportation scenarios. Output valid JSON only.'
    });
    
    // Parse the JSON response
    try {
      // Extract JSON from the response if needed
      const jsonMatch = response.match(/```json([\s\S]*?)```/) || 
                         response.match(/```([\s\S]*?)```/) || 
                         [null, response];
      
      const jsonStr = jsonMatch[1] || response;
      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      console.log('Raw response:', response);
      
      // Return fallback default metrics
      return {
        totalTrips: 1500000,
        totalVmt: 12000000,
        totalVht: 400000,
        ghgEmissions: 4200,
        modeShares: {
          drive_alone: 0.65,
          shared_ride_2: 0.12,
          shared_ride_3_plus: 0.08,
          transit: 0.06,
          walk: 0.05,
          bike: 0.02,
          tnc: 0.01,
          micro_mobility: 0.01
        },
        averageCommute: 28,
        congestionIndex: 65,
        accessibilityIndex: 60,
        equityIndex: 55
      };
    }
  } catch (error) {
    console.error('Error generating scenario results with AI:', error);
    throw error;
  }
}

/**
 * Get a trend by ID
 */
async function getTrend(trendId: string): Promise<Trend | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_trends')
    .select('*')
    .eq('id', trendId)
    .single();
  
  if (error) {
    console.error('Error fetching trend:', error);
    return null;
  }
  
  return data;
}

/**
 * Get a policy by ID
 */
async function getPolicy(policyId: string): Promise<PolicyIntervention | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trend_navigator_policies')
    .select('*')
    .eq('id', policyId)
    .single();
  
  if (error) {
    console.error('Error fetching policy:', error);
    return null;
  }
  
  return data;
}

/**
 * Get scenario trends
 */
export async function getScenarioTrends(): Promise<ScenarioAssumption[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('trends')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching trends:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get policy packages
 */
export async function getPolicyPackages(): Promise<PolicyPackage[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('policy_packages')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching policy packages:', error);
    throw error;
  }
  
  return data;
}

/**
 * Transform database scenario object to our application type
 */
function transformScenarioData(data: any): ScenarioDefinition {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    organizationId: data.organization_id,
    baseYear: data.base_year,
    horizonYears: data.horizon_years || [],
    assumptions: (data.assumptions || []) as ScenarioAssumption[],
    policyPackages: (data.policy_packages || []) as PolicyPackage[],
    tags: data.tags || [],
    campModelConfigId: data.camp_model_config_id,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
} 