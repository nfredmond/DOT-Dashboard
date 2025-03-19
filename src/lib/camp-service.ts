/**
 * CAMP Service
 * 
 * Provides functionality for the Chained Activity Modeling Process (CAMP) travel demand forecasting tool
 * This service handles model configuration, running, and results processing
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  CAMPModelConfig, 
  CAMPModelParams, 
  CAMPModelResults, 
  CAMPRunRequest,
  LinkFlow,
  ODMatrix,
  ModeShare
} from '@/types/camp';
import { runAgentQuery, AgentType } from './agents-service';
import { AgentContext } from './agents-service';
import { initSupabaseClient } from './supabase-service';

// Initialize Supabase client
const supabaseClient = initSupabaseClient();

/**
 * Get all CAMP model configurations for an organization
 */
export async function getCAMPModelConfigs(organizationId: string): Promise<CAMPModelConfig[]> {
  try {
    const { data, error } = await supabaseClient
      .from('camp_model_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    
    if (error) {
      console.error('Error fetching CAMP model configs:', error);
      throw error;
    }
    
    return data.map(transformCAMPModelConfig);
  } catch (error) {
    console.error('Failed to get CAMP model configs:', error);
    return [];
  }
}

/**
 * Get a specific CAMP model configuration by ID
 */
export async function getCAMPModelConfig(configId: string): Promise<CAMPModelConfig | null> {
  try {
    const { data, error } = await supabaseClient
      .from('camp_model_configs')
      .select('*')
      .eq('id', configId)
      .single();
    
    if (error) {
      console.error('Error fetching CAMP model config:', error);
      throw error;
    }
    
    return transformCAMPModelConfig(data);
  } catch (error) {
    console.error(`Failed to get CAMP model config with ID ${configId}:`, error);
    return null;
  }
}

/**
 * Create a new CAMP model configuration
 */
export async function createCAMPModelConfig(
  organizationId: string,
  data: Partial<CAMPModelConfig>
): Promise<CAMPModelConfig | null> {
  try {
    // Default values for a new CAMP model config
    const newConfig = {
      name: data.name || 'New CAMP Model',
      description: data.description || '',
      organization_id: organizationId,
      model_type: data.modelType || 'TDF',
      parameters: data.parameters || {},
      tags: data.tags || [],
      connection_details: data.connectionDetails || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: createdConfig, error } = await supabaseClient
      .from('camp_model_configs')
      .insert([newConfig])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating CAMP model config:', error);
      throw error;
    }
    
    return transformCAMPModelConfig(createdConfig);
  } catch (error) {
    console.error('Failed to create CAMP model config:', error);
    return null;
  }
}

/**
 * Update an existing CAMP model configuration
 */
export async function updateCAMPModelConfig(
  configId: string,
  data: Partial<CAMPModelConfig>
): Promise<CAMPModelConfig | null> {
  try {
    const updates = {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.modelType && { model_type: data.modelType }),
      ...(data.parameters && { parameters: data.parameters }),
      ...(data.tags && { tags: data.tags }),
      ...(data.connectionDetails && { connection_details: data.connectionDetails }),
      updated_at: new Date().toISOString(),
    };
    
    const { data: updatedConfig, error } = await supabaseClient
      .from('camp_model_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating CAMP model config:', error);
      throw error;
    }
    
    return transformCAMPModelConfig(updatedConfig);
  } catch (error) {
    console.error(`Failed to update CAMP model config with ID ${configId}:`, error);
    return null;
  }
}

/**
 * Delete a CAMP model configuration
 */
export async function deleteCAMPModelConfig(configId: string): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('camp_model_configs')
      .delete()
      .eq('id', configId);
    
    if (error) {
      console.error('Error deleting CAMP model config:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to delete CAMP model config with ID ${configId}:`, error);
    return false;
  }
}

/**
 * Test the connection to a CAMP model
 */
export async function testCAMPModelConnection(configId: string): Promise<boolean> {
  try {
    const config = await getCAMPModelConfig(configId);
    if (!config) {
      throw new Error(`CAMP model config with ID ${configId} not found`);
    }
    
    // In a real implementation, this would test the connection to the actual model
    // For now, we'll simulate a successful connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error(`Failed to test connection to CAMP model with ID ${configId}:`, error);
    return false;
  }
}

/**
 * Transform database CAMP model config object to our application type
 */
function transformCAMPModelConfig(data: any): CAMPModelConfig {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    organizationId: data.organization_id,
    modelType: data.model_type,
    parameters: data.parameters || {},
    tags: data.tags || [],
    connectionDetails: data.connection_details || {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Run a CAMP model with the provided parameters
 * 
 * @param request The run request
 * @returns The model run results
 */
export async function runCAMPModel(request: CAMPRunRequest): Promise<CAMPModelResults> {
  // Create a run record in the database
  const runId = uuidv4();
  const runRecord = {
    id: runId,
    name: request.name,
    description: request.description,
    config_id: request.configId,
    scenario_id: request.scenarioId,
    baseline_run_id: request.baselineRunId,
    status: 'queued',
    created_at: new Date().toISOString()
  };
  
  const { error: insertError } = await supabaseClient
    .from('camp_model_runs')
    .insert([runRecord]);
  
  if (insertError) {
    console.error('Error creating CAMP model run record:', insertError);
    throw insertError;
  }
  
  try {
    // Update status to running
    await supabaseClient
      .from('camp_model_runs')
      .update({ status: 'running', progress: 0 })
      .eq('id', runId);
    
    // Get the full configuration
    const config = await getCAMPModelConfig(request.configId);
    if (!config) {
      throw new Error(`CAMP model config ${request.configId} not found`);
    }
    
    // Combine base parameters with request parameters
    const parameters = {
      ...config.baseParams,
      ...request.parameters
    };
    
    // Run the model (implementation depends on your approach - local calculation, external service, etc.)
    const results = await processCAMPModel(runId, parameters, config, request.baselineRunId);
    
    // Update the run record with results
    await supabaseClient
      .from('camp_model_runs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        summary: results.summary,
        detailed_results: results.detailedResults
      })
      .eq('id', runId);
    
    // Return the results
    return {
      id: runId,
      name: request.name,
      description: request.description || '',
      createdAt: runRecord.created_at,
      completedAt: new Date().toISOString(),
      status: 'completed',
      progress: 100,
      summary: results.summary,
      detailedResults: results.detailedResults
    };
  } catch (error) {
    // Update the run record with error
    await supabaseClient
      .from('camp_model_runs')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', runId);
    
    console.error('Error running CAMP model:', error);
    throw error;
  }
}

/**
 * Process a CAMP model run
 * This is the core modeling function that implements the CAMP methodology
 * 
 * @param runId The model run ID
 * @param parameters The model parameters
 * @param config The model configuration
 * @param baselineRunId Optional baseline run ID for comparison
 * @returns The model results
 */
async function processCAMPModel(
  runId: string,
  parameters: CAMPModelParams,
  config: CAMPModelConfig,
  baselineRunId?: string
): Promise<Pick<CAMPModelResults, 'summary' | 'detailedResults'>> {
  try {
    // Update progress
    await updateProgress(runId, 10, 'Starting trip generation');
    
    // Step 1: Trip Generation
    const tripGeneration = await runTripGeneration(parameters, config);
    await updateProgress(runId, 25, 'Trip generation complete');
    
    // Step 2: Trip Distribution
    const tripDistribution = await runTripDistribution(tripGeneration, parameters, config);
    await updateProgress(runId, 50, 'Trip distribution complete');
    
    // Step 3: Mode Choice
    const modeChoice = await runModeChoice(tripDistribution, parameters, config);
    await updateProgress(runId, 75, 'Mode choice complete');
    
    // Step 4: Trip Assignment
    const assignment = await runAssignment(modeChoice, parameters, config);
    await updateProgress(runId, 90, 'Trip assignment complete');
    
    // Calculate summary metrics
    const summary = calculateSummaryMetrics(assignment, modeChoice);
    
    // If baseline run is provided, calculate comparisons
    if (baselineRunId) {
      const baselineResults = await getCAMPModelRunResults(baselineRunId);
      if (baselineResults) {
        summary.comparisonToBaseline = calculateComparisonToBaseline(summary, baselineResults.summary);
      }
    }
    
    await updateProgress(runId, 95, 'Preparing results');
    
    // Return the results
    return {
      summary,
      detailedResults: {
        odMatrices: modeChoice.slice(0, 1000), // Limit to avoid excessive data
        linkFlows: assignment.slice(0, 1000)  // Limit to avoid excessive data
      }
    };
  } catch (error) {
    console.error('Error processing CAMP model:', error);
    throw error;
  }
}

/**
 * Update the progress of a model run
 * 
 * @param runId The run ID
 * @param progress The progress (0-100)
 * @param statusMessage Optional status message
 */
async function updateProgress(runId: string, progress: number, statusMessage?: string): Promise<void> {
  const updates: any = { progress };
  if (statusMessage) {
    updates.status_message = statusMessage;
  }
  
  await supabaseClient
    .from('camp_model_runs')
    .update(updates)
    .eq('id', runId);
}

/**
 * Run the trip generation step of the model
 * 
 * @param parameters The model parameters
 * @param config The model configuration
 * @returns The trip generation results
 */
async function runTripGeneration(
  parameters: CAMPModelParams,
  config: CAMPModelConfig
): Promise<{ fromZone: string; toZone: string; purpose: string; trips: number }[]> {
  // This would typically be implemented with actual transportation modeling algorithms
  // For this implementation, we'll use a simulated approach
  
  // Get the zones from the configuration
  const zones = config.zones || [];
  
  // Create an array to store the trips
  const trips: { fromZone: string; toZone: string; purpose: string; trips: number }[] = [];
  
  // Generate trips based on parameters
  for (const tripGen of parameters.tripGeneration) {
    for (const fromZone of zones) {
      // Calculate productions based on zone population, households, employment
      const population = fromZone.population || 0;
      const households = fromZone.households || 0;
      const employment = fromZone.employment?.total || 0;
      
      // Simple trip production calculation (would be more complex in a real model)
      const productions = tripGen.productionRate * (
        0.6 * households + 
        0.3 * population + 
        0.1 * employment
      );
      
      // Temporary: Just distribute evenly to all other zones
      // In a real model, this would be replaced by a proper trip distribution step
      for (const toZone of zones) {
        if (fromZone.id !== toZone.id) {
          const tripCount = productions / (zones.length - 1);
          trips.push({
            fromZone: fromZone.id,
            toZone: toZone.id,
            purpose: tripGen.purpose,
            trips: tripCount
          });
        }
      }
    }
  }
  
  return trips;
}

/**
 * Run the trip distribution step of the model
 * 
 * @param tripGeneration The trip generation results
 * @param parameters The model parameters
 * @param config The model configuration
 * @returns The trip distribution results
 */
async function runTripDistribution(
  tripGeneration: { fromZone: string; toZone: string; purpose: string; trips: number }[],
  parameters: CAMPModelParams,
  config: CAMPModelConfig
): Promise<{ fromZone: string; toZone: string; purpose: string; trips: number }[]> {
  // This would typically be implemented with a gravity model or similar
  // For this implementation, we'll use a simulated approach
  
  // In a full implementation, we would apply the gravity model:
  // Tij = Pi * Aj * Fij * Kij
  // Where:
  // Tij = trips from zone i to zone j
  // Pi = productions from zone i
  // Aj = attractions to zone j
  // Fij = friction factor (based on travel time or distance)
  // Kij = K-factor (socioeconomic adjustment)
  
  // For now, we'll just return the trip generation results as-is
  return tripGeneration;
}

/**
 * Run the mode choice step of the model
 * 
 * @param tripDistribution The trip distribution results
 * @param parameters The model parameters
 * @param config The model configuration
 * @returns The mode choice results (OD matrices with mode)
 */
async function runModeChoice(
  tripDistribution: { fromZone: string; toZone: string; purpose: string; trips: number }[],
  parameters: CAMPModelParams,
  config: CAMPModelConfig
): Promise<ODMatrix[]> {
  // This would typically be implemented with a logit model
  // For this implementation, we'll use a simulated approach
  
  const modeChoiceResults: ODMatrix[] = [];
  
  // Group trips by purpose
  const tripsByPurpose: Record<string, typeof tripDistribution> = {};
  
  for (const trip of tripDistribution) {
    if (!tripsByPurpose[trip.purpose]) {
      tripsByPurpose[trip.purpose] = [];
    }
    tripsByPurpose[trip.purpose].push(trip);
  }
  
  // Apply mode choice for each purpose
  for (const purpose in tripsByPurpose) {
    // Find the mode choice parameters for this purpose
    const modeChoiceParams = parameters.modeChoice.find(mc => mc.purpose === purpose);
    
    if (!modeChoiceParams) {
      continue;
    }
    
    for (const trip of tripsByPurpose[purpose]) {
      // Calculate mode shares for this trip
      // In a real model, this would use a logit model based on utilities
      // For simplicity, we'll use fixed shares based on the constants
      const constants = modeChoiceParams.constants;
      const totalUtility = Object.values(constants).reduce((sum, value) => sum + Math.exp(value), 0);
      
      for (const [mode, constant] of Object.entries(constants)) {
        const share = Math.exp(constant) / totalUtility;
        const trips = trip.trips * share;
        
        modeChoiceResults.push({
          fromZone: trip.fromZone,
          toZone: trip.toZone,
          purpose: trip.purpose as any,
          mode: mode as any,
          trips
        });
      }
    }
  }
  
  return modeChoiceResults;
}

/**
 * Run the trip assignment step of the model
 * 
 * @param modeChoice The mode choice results
 * @param parameters The model parameters
 * @param config The model configuration
 * @returns The assignment results (link flows)
 */
async function runAssignment(
  modeChoice: ODMatrix[],
  parameters: CAMPModelParams,
  config: CAMPModelConfig
): Promise<LinkFlow[]> {
  // This would typically be implemented with a network assignment algorithm
  // For this implementation, we'll use a simulated approach
  
  // Get the network links from the configuration
  const links = config.network || [];
  
  // Filter to just auto trips
  const autoTrips = modeChoice.filter(trip => 
    trip.mode === 'drive_alone' || 
    trip.mode === 'shared_ride_2' || 
    trip.mode === 'shared_ride_3_plus'
  );
  
  // Calculate total auto trips
  const totalAutoTrips = autoTrips.reduce((sum, trip) => sum + trip.trips, 0);
  
  // Assign trips to links (in a real model, this would use proper path assignment)
  const linkFlows: LinkFlow[] = [];
  
  for (const link of links) {
    // Simple assignment: distribute trips proportionally to link capacity
    // In a real model, this would use a proper traffic assignment algorithm
    const capacity = link.capacity;
    const totalCapacity = links.reduce((sum, l) => sum + l.capacity, 0);
    const share = capacity / totalCapacity;
    
    // Assign auto trips
    const volume = totalAutoTrips * share;
    
    // Calculate v/c ratio
    const vcRatio = volume / capacity;
    
    // Calculate speed using BPR function
    // Speed = FreeFlowSpeed / (1 + alpha * (v/c)^beta)
    const freeFlowSpeed = link.freeFlowSpeed || link.speedLimit;
    const alpha = parameters.assignment.alpha || 0.15;
    const beta = parameters.assignment.beta || 4.0;
    const speed = freeFlowSpeed / (1 + alpha * Math.pow(vcRatio, beta));
    
    // Calculate travel time
    const travelTime = (link.length / speed) * 60; // Convert to minutes
    
    linkFlows.push({
      linkId: link.id,
      volume,
      capacity,
      speed,
      travelTime,
      vCRatio: vcRatio,
      timePeriod: 'daily' as any // Default to daily
    });
  }
  
  return linkFlows;
}

/**
 * Calculate summary metrics from the model results
 * 
 * @param assignment The assignment results
 * @param modeChoice The mode choice results
 * @returns The summary metrics
 */
function calculateSummaryMetrics(
  assignment: LinkFlow[],
  modeChoice: ODMatrix[]
): NonNullable<CAMPModelResults['summary']> {
  // Calculate total trips
  const totalTrips = modeChoice.reduce((sum, trip) => sum + trip.trips, 0);
  
  // Calculate VMT: sum of (link volume * link length)
  // Note: We would need the link lengths here, using a placeholder approach
  const vehicleMilesTraveled = assignment.reduce((sum, link) => {
    // Assuming we have the link length, calculate VMT
    // For this example, we're just using the link volume
    return sum + link.volume;
  }, 0);
  
  // Calculate VHT: sum of (link volume * link travel time / 60)
  const vehicleHoursTraveled = assignment.reduce((sum, link) => {
    // Travel time is in minutes, convert to hours
    return sum + (link.volume * link.travelTime / 60);
  }, 0);
  
  // Calculate average speed
  const averageSpeed = vehicleMilesTraveled / (vehicleHoursTraveled > 0 ? vehicleHoursTraveled : 1);
  
  // Calculate congestion index (average v/c ratio)
  const congestionIndex = assignment.reduce((sum, link) => sum + link.vCRatio, 0) / assignment.length;
  
  // Calculate mode shares
  const modeShares: ModeShare[] = [];
  const tripsByMode: Record<string, number> = {};
  
  for (const trip of modeChoice) {
    if (!trip.mode) continue;
    
    const mode = trip.mode.toString();
    if (!tripsByMode[mode]) {
      tripsByMode[mode] = 0;
    }
    tripsByMode[mode] += trip.trips;
  }
  
  for (const [mode, trips] of Object.entries(tripsByMode)) {
    modeShares.push({
      mode: mode as any,
      trips,
      percentage: (trips / totalTrips) * 100
    });
  }
  
  // Calculate trips by purpose
  const tripsByPurpose: Record<string, number> = {};
  
  for (const trip of modeChoice) {
    if (!trip.purpose) continue;
    
    const purpose = trip.purpose.toString();
    if (!tripsByPurpose[purpose]) {
      tripsByPurpose[purpose] = 0;
    }
    tripsByPurpose[purpose] += trip.trips;
  }
  
  return {
    totalTrips,
    vehicleMilesTraveled,
    vehicleHoursTraveled,
    averageSpeed,
    congestionIndex,
    modeShares,
    tripsByPurpose: tripsByPurpose as any
  };
}

/**
 * Calculate comparison to baseline
 * 
 * @param current The current summary metrics
 * @param baseline The baseline summary metrics
 * @returns The comparison metrics
 */
function calculateComparisonToBaseline(
  current: NonNullable<CAMPModelResults['summary']>,
  baseline: NonNullable<CAMPModelResults['summary']>
): Record<string, number> {
  return {
    tripsDelta: current.totalTrips - baseline.totalTrips,
    tripsPercent: ((current.totalTrips / baseline.totalTrips) - 1) * 100,
    vmtDelta: current.vehicleMilesTraveled - baseline.vehicleMilesTraveled,
    vmtPercent: ((current.vehicleMilesTraveled / baseline.vehicleMilesTraveled) - 1) * 100,
    vhtDelta: current.vehicleHoursTraveled - baseline.vehicleHoursTraveled,
    vhtPercent: ((current.vehicleHoursTraveled / baseline.vehicleHoursTraveled) - 1) * 100,
    speedDelta: current.averageSpeed - baseline.averageSpeed,
    speedPercent: ((current.averageSpeed / baseline.averageSpeed) - 1) * 100,
    congestionDelta: current.congestionIndex - baseline.congestionIndex,
    congestionPercent: ((current.congestionIndex / baseline.congestionIndex) - 1) * 100
  };
}

/**
 * Get a list of CAMP model runs for a configuration
 * 
 * @param configId The configuration ID
 * @returns Array of model run results
 */
export async function getCAMPModelRuns(configId: string): Promise<CAMPModelResults[]> {
  const { data, error } = await supabaseClient
    .from('camp_model_runs')
    .select('*')
    .eq('config_id', configId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching CAMP model runs:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific CAMP model run results
 * 
 * @param runId The run ID
 * @returns The model run results or null if not found
 */
export async function getCAMPModelRunResults(runId: string): Promise<CAMPModelResults | null> {
  const { data, error } = await supabaseClient
    .from('camp_model_runs')
    .select('*')
    .eq('id', runId)
    .single();
  
  if (error) {
    console.error('Error fetching CAMP model run:', error);
    return null;
  }
  
  return data;
}

/**
 * Use AI to analyze CAMP model results and generate insights
 * 
 * @param runId The model run ID to analyze
 * @param baselineRunId Optional baseline run ID for comparison
 * @returns The analysis results
 */
export async function analyzeCAMPModelResults(
  runId: string,
  baselineRunId?: string
): Promise<string> {
  try {
    // Get the run results
    const results = await getCAMPModelRunResults(runId);
    if (!results) {
      throw new Error(`CAMP model run ${runId} not found`);
    }
    
    // Get the baseline results if provided
    let baselineResults = null;
    if (baselineRunId) {
      baselineResults = await getCAMPModelRunResults(baselineRunId);
    }
    
    // Prepare the context for the agent
    const context: AgentContext = {
      modelRunId: runId,
      baselineRunId,
      modelName: results.name,
      summary: JSON.stringify(results.summary, null, 2)
    };
    
    if (baselineResults) {
      context.baselineName = baselineResults.name;
      context.baselineSummary = JSON.stringify(baselineResults.summary, null, 2);
    }
    
    // Build the prompt
    let prompt = 'Please analyze the CAMP model results and provide insights on:';
    prompt += '\n- Overall transportation patterns and metrics';
    prompt += '\n- Mode share distribution and implications';
    prompt += '\n- Congestion levels and critical areas';
    prompt += '\n- Key findings that planners should know';
    
    if (baselineResults) {
      prompt += '\n- Comparison with the baseline scenario';
      prompt += '\n- Significant changes and potential impacts';
    }
    
    prompt += '\nPlease provide a comprehensive yet concise analysis that would be useful for transportation planners.';
    
    // Run the agent query
    const analysis = await runAgentQuery({
      prompt,
      agentType: AgentType.ANALYSIS,
      systemPrompt: 'You are a transportation modeling expert. Analyze CAMP model results and provide insights in a clear, structured format for transportation planners. Focus on key metrics, patterns, and implications.',
    });
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing CAMP model results:', error);
    throw error;
  }
}

/**
 * Create database tables for CAMP
 * This function would typically be run during app initialization
 * 
 * @returns void
 */
export async function createCAMPDatabaseTables(): Promise<void> {
  // Check if tables exist first
  const { data: existingTables } = await supabaseClient
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['camp_model_configs', 'camp_model_runs']);
  
  const tables = existingTables?.map(t => t.table_name) || [];
  
  // Create model configs table if it doesn't exist
  if (!tables.includes('camp_model_configs')) {
    await supabaseClient.rpc('create_camp_model_configs_table');
  }
  
  // Create model runs table if it doesn't exist
  if (!tables.includes('camp_model_runs')) {
    await supabaseClient.rpc('create_camp_model_runs_table');
  }
} 