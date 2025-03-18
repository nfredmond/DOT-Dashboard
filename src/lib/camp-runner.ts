'use client';

import { createClient } from '@/lib/supabase/client';
import { 
  CAMPModelParameters, 
  CAMPModelResults,
  CAMPModelRun,
  CAMPModelRunStatus
} from '@/types/camp';
import { RunOptions, ScenarioResults } from '@/types/trend-navigator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Run a CAMP model for a given scenario
 */
export async function runCAMPModel(
  scenarioId: string,
  options: RunOptions = {}
): Promise<CAMPModelRun> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Could not initialize Supabase client');
    }

    // Get scenario information
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenarioData) {
      throw new Error(`Failed to retrieve scenario: ${scenarioError?.message || 'Not found'}`);
    }

    // Get model configuration
    const { data: modelConfigData, error: modelConfigError } = await supabase
      .from('camp_model_configs')
      .select('*')
      .eq('organization_id', scenarioData.organizationId)
      .limit(1)
      .single();

    if (modelConfigError || !modelConfigData) {
      throw new Error(`Failed to retrieve model configuration: ${modelConfigError?.message || 'Not found'}`);
    }

    // Create a new model run record
    const modelRunId = uuidv4();
    const modelRun: CAMPModelRun = {
      id: modelRunId,
      scenarioId,
      modelConfigId: modelConfigData.id,
      status: CAMPModelRunStatus.QUEUED,
      options: options,
      parameters: {
        // Set model parameters based on scenario data
        tripGeneration: {
          baseRate: 3.2, // Default trip generation rate
          // Apply adjustments based on scenario assumptions
          rateAdjustments: []
        },
        tripDistribution: {
          frictionFactorA: 0.15,
          frictionFactorB: 0.05,
          maxDistance: 50
        },
        modeChoice: {
          autoTimeValue: 15,
          transitTimeValue: 12,
          waitTimeValue: 20,
          walkTimeValue: 18
        },
        trafficAssignment: {
          convergenceThreshold: 0.01,
          maxIterations: 20
        }
      },
      results: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      errorMessage: null
    };

    // Save the model run
    const { error: saveError } = await supabase
      .from('camp_model_runs')
      .insert(modelRun);

    if (saveError) {
      throw new Error(`Failed to save model run: ${saveError.message}`);
    }

    // Simulate model execution (in a real scenario, this would be a backend job)
    // Here we'll simulate it with a timeout and updates
    setTimeout(async () => {
      try {
        // Update status to RUNNING
        await supabase
          .from('camp_model_runs')
          .update({
            status: CAMPModelRunStatus.RUNNING,
            startedAt: new Date().toISOString()
          })
          .eq('id', modelRunId);

        // Simulate progress updates (every 5 seconds)
        let progress = 0;
        const progressInterval = setInterval(async () => {
          progress += 20;
          
          // Update progress
          await supabase
            .from('camp_model_runs')
            .update({
              progress: Math.min(progress, 99) // Cap at 99% until complete
            })
            .eq('id', modelRunId);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Generate model results
            const modelResults: CAMPModelResults = {
              tripGeneration: {
                totalTrips: 250000,
                tripsByPurpose: {
                  WORK: 95000,
                  SCHOOL: 45000,
                  SHOPPING: 65000,
                  OTHER: 45000
                },
                tripsByZone: {
                  // Example zone trips
                  '1': 12500,
                  '2': 15600,
                  '3': 18300,
                  // ... other zones
                }
              },
              tripDistribution: {
                // Example OD matrix
                odMatrix: {
                  '1-2': 5200,
                  '1-3': 3100,
                  '2-1': 4900,
                  // ... other OD pairs
                },
                averageTripLength: 7.8,
                totalVMT: 1950000
              },
              modeChoice: {
                modeShares: {
                  drive_alone: 0.65,
                  shared_ride: 0.12,
                  transit: 0.09,
                  walk: 0.08,
                  bike: 0.04,
                  micro_mobility: 0.02
                },
                modeSharesByPurpose: {
                  WORK: {
                    drive_alone: 0.71,
                    shared_ride: 0.08,
                    transit: 0.12,
                    walk: 0.05,
                    bike: 0.03,
                    micro_mobility: 0.01
                  },
                  // ... other purposes
                }
              },
              trafficAssignment: {
                linkVolumes: {
                  // Example link volumes
                  'link-1': 18500,
                  'link-2': 12300,
                  // ... other links
                },
                vht: 85000,
                vmt: 1950000,
                averageSpeed: 23,
                congestionIndex: 0.72
              },
              emissions: {
                co2: 980,
                nox: 15.3,
                pm25: 5.2,
                totalGHG: 1020
              },
              accessibility: {
                accessibilityByZone: {
                  // Example accessibility scores by zone
                  '1': 0.85,
                  '2': 0.78,
                  // ... other zones
                },
                equityIndex: 0.72,
                overallAccessibility: 0.81
              }
            };
            
            // Convert CAMP results to Scenario Results
            const _scenarioResults = await convertCAMPResultsToScenarioResults(modelRunId, scenarioId);
            
            // Update model run to COMPLETED
            await supabase
              .from('camp_model_runs')
              .update({
                status: CAMPModelRunStatus.COMPLETED,
                results: modelResults,
                progress: 100,
                completedAt: new Date().toISOString()
              })
              .eq('id', modelRunId);
          }
        }, 5000);
      } catch (error) {
        console.error('Error in model run simulation:', error);
        
        // Update status to ERROR
        await supabase
          .from('camp_model_runs')
          .update({
            status: CAMPModelRunStatus.ERROR,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date().toISOString()
          })
          .eq('id', modelRunId);
      }
    }, 2000);

    return modelRun;
  } catch (error) {
    console.error('Error running CAMP model:', error);
    throw error;
  }
}

/**
 * Get all CAMP model runs for a scenario
 */
export async function getCAMPModelRuns(scenarioId: string): Promise<CAMPModelRun[]> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Could not initialize Supabase client');
    }

    const { data, error } = await supabase
      .from('camp_model_runs')
      .select('*')
      .eq('scenarioId', scenarioId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching model runs:', error);
      return [];
    }

    return data as CAMPModelRun[];
  } catch (error) {
    console.error('Error getting CAMP model runs:', error);
    return [];
  }
}

/**
 * Get a specific CAMP model run by ID
 */
export async function getCAMPModelRun(runId: string): Promise<CAMPModelRun | null> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('camp_model_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      console.error('Error fetching model run:', error);
      return null;
    }

    return data as CAMPModelRun;
  } catch (error) {
    console.error('Error getting CAMP model run:', error);
    return null;
  }
}

/**
 * Cancel a CAMP model run
 */
export async function cancelCAMPModelRun(runId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Could not initialize Supabase client');
    }

    // Check if run is in a cancellable state
    const { data: runData, error: runError } = await supabase
      .from('camp_model_runs')
      .select('status')
      .eq('id', runId)
      .single();

    if (runError || !runData) {
      throw new Error(`Could not find model run with ID ${runId}`);
    }

    if (
      runData.status !== CAMPModelRunStatus.QUEUED &&
      runData.status !== CAMPModelRunStatus.RUNNING
    ) {
      throw new Error('Cannot cancel a model run that is not queued or running');
    }

    // Update the run status to CANCELLED
    const { error } = await supabase
      .from('camp_model_runs')
      .update({
        status: CAMPModelRunStatus.CANCELLED,
        completedAt: new Date().toISOString()
      })
      .eq('id', runId);

    if (error) {
      throw new Error(`Failed to cancel model run: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error cancelling CAMP model run:', error);
    return false;
  }
}

/**
 * Convert CAMP model results to TrendNavigator scenario results
 */
export async function convertCAMPResultsToScenarioResults(
  modelRunId: string,
  scenarioId: string
): Promise<ScenarioResults> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Could not initialize Supabase client');
    }

    // Get the model run
    const { data: modelRun, error: modelRunError } = await supabase
      .from('camp_model_runs')
      .select('*')
      .eq('id', modelRunId)
      .single();

    if (modelRunError || !modelRun) {
      throw new Error(`Could not find model run with ID ${modelRunId}`);
    }

    if (modelRun.status !== CAMPModelRunStatus.COMPLETED || !modelRun.results) {
      throw new Error('Model run is not completed or has no results');
    }

    // Get scenario information
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      throw new Error(`Could not find scenario with ID ${scenarioId}`);
    }

    // Generate example metrics
    const currentYear = new Date().getFullYear();
    const horizonYears = scenario.horizonYears || [currentYear + 20];
    const horizonYear = horizonYears[0];

    // Extract metrics from CAMP results
    const campResults = modelRun.results as CAMPModelResults;
    
    // Create aggregate metrics object
    const aggregateMetrics: Record<number, any> = {};
    
    // Populate metrics for the horizon year
    aggregateMetrics[horizonYear] = {
      totalVmt: campResults.trafficAssignment.vmt,
      totalVht: campResults.trafficAssignment.vht,
      totalTrips: campResults.tripGeneration.totalTrips,
      ghgEmissions: campResults.emissions.totalGHG,
      congestionIndex: campResults.trafficAssignment.congestionIndex,
      averageCommute: 25, // Example value
      accessibilityIndex: campResults.accessibility.overallAccessibility,
      equityIndex: campResults.accessibility.equityIndex,
      modeShares: campResults.modeChoice.modeShares
    };
    
    // Generate a comparison to baseline if this is not a baseline scenario
    let comparisonToBaseline = null;
    if (scenario.baselineScenarioId) {
      // Get baseline scenario results
      const { data: baselineResults, error: baselineError } = await supabase
        .from('scenario_results')
        .select('*')
        .eq('scenarioId', scenario.baselineScenarioId)
        .order('generatedAt', { ascending: false })
        .limit(1)
        .single();
        
      if (!baselineError && baselineResults) {
        // Calculate comparison metrics
        const baseline = baselineResults.aggregateMetrics[horizonYear];
        const current = aggregateMetrics[horizonYear];
        
        comparisonToBaseline = {
          baselineScenarioId: scenario.baselineScenarioId,
          horizonYear,
          vmtChange: ((current.totalVmt - baseline.totalVmt) / baseline.totalVmt) * 100,
          vhtChange: ((current.totalVht - baseline.totalVht) / baseline.totalVht) * 100,
          ghgEmissionsChange: ((current.ghgEmissions - baseline.ghgEmissions) / baseline.ghgEmissions) * 100,
          transitShareChange: (current.modeShares.transit - baseline.modeShares.transit) * 100,
          walkShareChange: (current.modeShares.walk - baseline.modeShares.walk) * 100,
          bikeShareChange: (current.modeShares.bike - baseline.modeShares.bike) * 100
        };
      }
    }
    
    // Generate spatial results
    const spatialResults = {
      zoneResults: {} as Record<string, any>,
      linkResults: {} as Record<string, any>
    };
    
    // Populate zone results
    for (const [zoneId, trips] of Object.entries(campResults.tripGeneration.tripsByZone)) {
      spatialResults.zoneResults[zoneId] = {
        totalTrips: trips,
        accessibility: campResults.accessibility.accessibilityByZone[zoneId] || 0.5,
        congestion: Math.random() * 0.5 + 0.5 // Example value
      };
    }
    
    // Populate link results
    for (const [linkId, volume] of Object.entries(campResults.trafficAssignment.linkVolumes)) {
      spatialResults.linkResults[linkId] = {
        volume,
        congestion: Math.random() * 0.8 + 0.2, // Example value
        speed: Math.random() * 30 + 15 // Example value
      };
    }
    
    // Create scenario results object
    const scenarioResults: ScenarioResults = {
      id: uuidv4(),
      scenarioId,
      horizonYears,
      aggregateMetrics,
      spatialResults,
      comparisonToBaseline,
      generatedAt: new Date().toISOString(),
      modelRunId
    };
    
    // Save scenario results
    const { error: saveError } = await supabase
      .from('scenario_results')
      .insert(scenarioResults);
      
    if (saveError) {
      throw new Error(`Failed to save scenario results: ${saveError.message}`);
    }
    
    return scenarioResults;
  } catch (error) {
    console.error('Error converting CAMP results to scenario results:', error);
    throw error;
  }
}

/**
 * Get default parameters for a CAMP model configuration
 */
export async function getDefaultModelParameters(configId: string): Promise<CAMPModelParameters> {
  try {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Could not initialize Supabase client');
    }

    // Get model configuration
    const { data: config, error: configError } = await supabase
      .from('camp_model_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error(`Could not find model configuration with ID ${configId}`);
    }

    // Return default parameters from configuration or use defaults
    return config.defaultParameters || {
      tripGeneration: {
        baseRate: 3.2,
        rateAdjustments: []
      },
      tripDistribution: {
        frictionFactorA: 0.15,
        frictionFactorB: 0.05,
        maxDistance: 50
      },
      modeChoice: {
        autoTimeValue: 15,
        transitTimeValue: 12,
        waitTimeValue: 20,
        walkTimeValue: 18
      },
      trafficAssignment: {
        convergenceThreshold: 0.01,
        maxIterations: 20
      }
    };
  } catch (error) {
    console.error('Error getting default model parameters:', error);
    throw error;
  }
}

/**
 * Core CAMP model implementation
 * 
 * This class handles the computation for the Chained Activity Modeling Process
 */
class CAMPModel {
  private parameters: CAMPModelParameters;
  private zones: Map<string, Zone> = new Map();
  private network: Map<string, NetworkLink> = new Map();
  private baseTripRates: Record<TripPurpose, number> = {
    [TripPurpose.HOME_WORK]: 0.8,
    [TripPurpose.HOME_SHOP]: 0.5,
    [TripPurpose.HOME_SCHOOL]: 0.4,
    [TripPurpose.HOME_OTHER]: 0.7,
    [TripPurpose.WORK_OTHER]: 0.3,
    [TripPurpose.OTHER_OTHER]: 0.4
  };
  
  constructor(parameters: CAMPModelParameters) {
    this.parameters = parameters;
  }
  
  /**
   * Load zone data from database
   */
  async loadZones(organizationId: string): Promise<void> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) {
      throw new Error(`Failed to load zones: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No zones found for this organization');
    }
    
    // Convert data to Map for easy access
    data.forEach(zone => {
      this.zones.set(zone.id, {
        id: zone.id,
        name: zone.name,
        geometry: zone.geometry,
        population: zone.population,
        households: zone.households,
        employment: zone.employment,
        attributes: zone.attributes
      });
    });
    
    console.log(`Loaded ${this.zones.size} zones`);
  }
  
  /**
   * Load network data from database
   */
  async loadNetwork(organizationId: string): Promise<void> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('network_links')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) {
      throw new Error(`Failed to load network: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('No network links found for this organization');
      return;
    }
    
    // Convert data to Map for easy access
    data.forEach(link => {
      this.network.set(link.id, {
        id: link.id,
        fromNode: link.from_node,
        toNode: link.to_node,
        length: link.length,
        speedLimit: link.speed_limit,
        capacity: link.capacity,
        lanes: link.lanes,
        linkType: link.link_type,
        geometry: link.geometry,
        attributes: link.attributes
      });
    });
    
    console.log(`Loaded ${this.network.size} network links`);
  }
  
  /**
   * Generate trips for each zone based on population and employment
   */
  generateTrips(): Record<string, Record<TripPurpose, number>> {
    const tripGeneration: Record<string, Record<TripPurpose, number>> = {};
    
    // Apply scenario adjustments to trip rates
    const adjustedTripRates = { ...this.baseTripRates };
    
    // Adjust work trips based on telecommuting
    if (this.parameters.telecommutingRate) {
      adjustedTripRates[TripPurpose.HOME_WORK] *= (1 - this.parameters.telecommutingRate);
    }
    
    // Adjust shopping trips based on e-commerce
    if (this.parameters.ecommerceRate) {
      adjustedTripRates[TripPurpose.HOME_SHOP] *= (1 - this.parameters.ecommerceRate);
    }
    
    // Generate trips for each zone
    for (const [zoneId, zone] of this.zones.entries()) {
      const zoneTripsByPurpose: Record<TripPurpose, number> = {
        [TripPurpose.HOME_WORK]: 0,
        [TripPurpose.HOME_SHOP]: 0,
        [TripPurpose.HOME_SCHOOL]: 0,
        [TripPurpose.HOME_OTHER]: 0,
        [TripPurpose.WORK_OTHER]: 0,
        [TripPurpose.OTHER_OTHER]: 0
      };
      
      // Calculate trips based on household and population
      if (zone.households) {
        zoneTripsByPurpose[TripPurpose.HOME_WORK] += zone.households * adjustedTripRates[TripPurpose.HOME_WORK];
        zoneTripsByPurpose[TripPurpose.HOME_SHOP] += zone.households * adjustedTripRates[TripPurpose.HOME_SHOP];
        zoneTripsByPurpose[TripPurpose.HOME_SCHOOL] += zone.households * adjustedTripRates[TripPurpose.HOME_SCHOOL];
        zoneTripsByPurpose[TripPurpose.HOME_OTHER] += zone.households * adjustedTripRates[TripPurpose.HOME_OTHER];
      }
      
      // Calculate trips based on employment
      if (zone.employment?.total) {
        zoneTripsByPurpose[TripPurpose.WORK_OTHER] += zone.employment.total * adjustedTripRates[TripPurpose.WORK_OTHER];
      }
      
      tripGeneration[zoneId] = zoneTripsByPurpose;
    }
    
    return tripGeneration;
  }
  
  /**
   * Distribute trips between origins and destinations using a gravity model
   */
  distributeTrips(tripGeneration: Record<string, Record<TripPurpose, number>>): Record<string, Record<string, Record<TripPurpose, number>>> {
    const tripDistribution: Record<string, Record<string, Record<TripPurpose, number>>> = {};
    const purposes = Object.values(TripPurpose);
    
    // Initialize the distribution matrix
    for (const originId of this.zones.keys()) {
      tripDistribution[originId] = {};
      
      for (const destId of this.zones.keys()) {
        tripDistribution[originId][destId] = {};
        
        for (const purpose of purposes) {
          tripDistribution[originId][destId][purpose] = 0;
        }
      }
    }
    
    // Calculate destinations attractiveness
    const attractiveness: Record<string, Record<TripPurpose, number>> = {};
    
    for (const [zoneId, zone] of this.zones.entries()) {
      attractiveness[zoneId] = {
        [TripPurpose.HOME_WORK]: zone.employment?.total || 0,
        [TripPurpose.HOME_SHOP]: (zone.employment?.retail || 0) * 2 + (zone.employment?.total || 0) * 0.5,
        [TripPurpose.HOME_SCHOOL]: zone.attributes?.school_enrollment || 0,
        [TripPurpose.HOME_OTHER]: (zone.employment?.total || 0) + (zone.households || 0) * 0.5,
        [TripPurpose.WORK_OTHER]: (zone.employment?.retail || 0) + (zone.households || 0),
        [TripPurpose.OTHER_OTHER]: (zone.employment?.total || 0) + (zone.households || 0)
      };
    }
    
    // Apply gravity model
    for (const purpose of purposes) {
      // Calculate impedance between zones
      const impedance: Record<string, Record<string, number>> = this.calculateImpedance(purpose);
      
      // Distribute trips for each origin
      for (const [originId, originTrips] of Object.entries(tripGeneration)) {
        const tripsToDistribute = originTrips[purpose];
        let totalAttractivenessWeighted = 0;
        
        // Calculate total weighted attractiveness for normalization
        for (const [destId, _destZone] of this.zones.entries()) {
          if (destId === originId) continue; // Skip self
          totalAttractivenessWeighted += attractiveness[destId][purpose] / Math.pow(impedance[originId][destId], this.parameters.distanceSensitivity || 1);
        }
        
        // Distribute trips based on attractiveness and impedance
        if (totalAttractivenessWeighted > 0) {
          for (const [destId, _destZone] of this.zones.entries()) {
            if (destId === originId) continue; // Skip self
            
            const destAttractivenessWeighted = attractiveness[destId][purpose] / Math.pow(impedance[originId][destId], this.parameters.distanceSensitivity || 1);
            const trips = tripsToDistribute * (destAttractivenessWeighted / totalAttractivenessWeighted);
            
            tripDistribution[originId][destId][purpose] = trips;
          }
        }
      }
    }
    
    return tripDistribution;
  }
  
  /**
   * Calculate impedance (distance/travel time) between zones
   */
  private calculateImpedance(_purpose: TripPurpose): Record<string, Record<string, number>> {
    const impedance: Record<string, Record<string, number>> = {};
    
    // Simple Euclidean distance for demonstration
    // In a real model, this would be based on network distance or travel time
    for (const [originId, originZone] of this.zones.entries()) {
      impedance[originId] = {};
      
      for (const [destId, destZone] of this.zones.entries()) {
        // Skip self-zone trips
        if (originId === destId) {
          impedance[originId][destId] = 1;
          continue;
        }
        
        // Calculate distance between centroids (simplified)
        const originCentroid = {
          x: originZone.attributes?.centroid_x || 0,
          y: originZone.attributes?.centroid_y || 0
        };
        
        const destCentroid = {
          x: destZone.attributes?.centroid_x || 0,
          y: destZone.attributes?.centroid_y || 0
        };
        
        const distance = Math.sqrt(
          Math.pow(destCentroid.x - originCentroid.x, 2) +
          Math.pow(destCentroid.y - originCentroid.y, 2)
        );
        
        // Ensure minimum distance
        impedance[originId][destId] = Math.max(0.1, distance);
      }
    }
    
    return impedance;
  }
  
  /**
   * Apply mode choice to distributed trips
   */
  applyModeChoice(tripDistribution: Record<string, Record<string, Record<TripPurpose, number>>>): Record<string, Record<string, Record<TripPurpose, Record<TransportMode, number>>>> {
    const modeChoice: Record<string, Record<string, Record<TripPurpose, Record<TransportMode, number>>>> = {};
    const modes = Object.values(TransportMode);
    
    // Base mode shares by purpose
    const baseModeShares: Record<TripPurpose, Record<TransportMode, number>> = {
      [TripPurpose.HOME_WORK]: {
        [TransportMode.DRIVE_ALONE]: 0.75,
        [TransportMode.SHARED_RIDE_2]: 0.1,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.05,
        [TransportMode.TRANSIT]: 0.05,
        [TransportMode.BIKE]: 0.01,
        [TransportMode.WALK]: 0.04
      },
      [TripPurpose.HOME_SHOP]: {
        [TransportMode.DRIVE_ALONE]: 0.65,
        [TransportMode.SHARED_RIDE_2]: 0.15,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.1,
        [TransportMode.TRANSIT]: 0.02,
        [TransportMode.BIKE]: 0.03,
        [TransportMode.WALK]: 0.05
      },
      [TripPurpose.HOME_SCHOOL]: {
        [TransportMode.DRIVE_ALONE]: 0.4,
        [TransportMode.SHARED_RIDE_2]: 0.2,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.15,
        [TransportMode.TRANSIT]: 0.1,
        [TransportMode.BIKE]: 0.05,
        [TransportMode.WALK]: 0.1
      },
      [TripPurpose.HOME_OTHER]: {
        [TransportMode.DRIVE_ALONE]: 0.7,
        [TransportMode.SHARED_RIDE_2]: 0.15,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.05,
        [TransportMode.TRANSIT]: 0.03,
        [TransportMode.BIKE]: 0.02,
        [TransportMode.WALK]: 0.05
      },
      [TripPurpose.WORK_OTHER]: {
        [TransportMode.DRIVE_ALONE]: 0.8,
        [TransportMode.SHARED_RIDE_2]: 0.1,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.03,
        [TransportMode.TRANSIT]: 0.03,
        [TransportMode.BIKE]: 0.01,
        [TransportMode.WALK]: 0.03
      },
      [TripPurpose.OTHER_OTHER]: {
        [TransportMode.DRIVE_ALONE]: 0.7,
        [TransportMode.SHARED_RIDE_2]: 0.15,
        [TransportMode.SHARED_RIDE_3_PLUS]: 0.05,
        [TransportMode.TRANSIT]: 0.02,
        [TransportMode.BIKE]: 0.03,
        [TransportMode.WALK]: 0.05
      }
    };
    
    // Adjust mode shares based on scenario parameters
    const adjustedModeShares = JSON.parse(JSON.stringify(baseModeShares));
    
    // Apply transit investment effect
    if (this.parameters.transitInvestment) {
      for (const purpose of Object.values(TripPurpose)) {
        // Increase transit share based on investment level
        const transitBoost = this.parameters.transitInvestment * 0.1;
        
        // Take share proportionally from driving modes
        const totalDriveShare = 
          adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] + 
          adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] + 
          adjustedModeShares[purpose][TransportMode.SHARED_RIDE_3_PLUS];
        
        const reduction = Math.min(transitBoost, totalDriveShare * 0.5);
        
        // Apply reductions proportionally
        adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] -= reduction * (adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] / totalDriveShare);
        adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] -= reduction * (adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] / totalDriveShare);
        adjustedModeShares[purpose][TransportMode.SHARED_RIDE_3_PLUS] -= reduction * (adjustedModeShares[purpose][TransportMode.SHARED_RIDE_3_PLUS] / totalDriveShare);
        
        // Add to transit
        adjustedModeShares[purpose][TransportMode.TRANSIT] += reduction;
      }
    }
    
    // Apply bike infrastructure effect
    if (this.parameters.bikeInvestment) {
      for (const purpose of Object.values(TripPurpose)) {
        // Increase bike share based on investment level
        const bikeBoost = this.parameters.bikeInvestment * 0.05;
        
        // Take share proportionally from driving modes
        const totalDriveShare = 
          adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] + 
          adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2];
        
        const reduction = Math.min(bikeBoost, totalDriveShare * 0.3);
        
        // Apply reductions proportionally
        adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] -= reduction * (adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] / totalDriveShare);
        adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] -= reduction * (adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] / totalDriveShare);
        
        // Add to bike
        adjustedModeShares[purpose][TransportMode.BIKE] += reduction;
      }
    }
    
    // Apply congestion pricing effect
    if (this.parameters.congestionPricing) {
      for (const purpose of Object.values(TripPurpose)) {
        // Reduce drive-alone share based on pricing level
        const driveReduction = this.parameters.congestionPricing * 0.1 * 
          adjustedModeShares[purpose][TransportMode.DRIVE_ALONE];
        
        // Redistribute to other modes
        adjustedModeShares[purpose][TransportMode.DRIVE_ALONE] -= driveReduction;
        adjustedModeShares[purpose][TransportMode.SHARED_RIDE_2] += driveReduction * 0.3;
        adjustedModeShares[purpose][TransportMode.SHARED_RIDE_3_PLUS] += driveReduction * 0.2;
        adjustedModeShares[purpose][TransportMode.TRANSIT] += driveReduction * 0.4;
        adjustedModeShares[purpose][TransportMode.BIKE] += driveReduction * 0.05;
        adjustedModeShares[purpose][TransportMode.WALK] += driveReduction * 0.05;
      }
    }
    
    // Initialize mode choice matrix
    for (const [originId, destinations] of Object.entries(tripDistribution)) {
      modeChoice[originId] = {};
      
      for (const [destId, purposes] of Object.entries(destinations)) {
        modeChoice[originId][destId] = {};
        
        for (const [purpose, trips] of Object.entries(purposes)) {
          modeChoice[originId][destId][purpose as TripPurpose] = {};
          
          for (const mode of modes) {
            const modeShare = adjustedModeShares[purpose as TripPurpose][mode];
            modeChoice[originId][destId][purpose as TripPurpose][mode] = trips * modeShare;
          }
        }
      }
    }
    
    return modeChoice;
  }
  
  /**
   * Assign trips to the network
   */
  assignTripsToNetwork(modeChoice: Record<string, Record<string, Record<TripPurpose, Record<TransportMode, number>>>>): Record<string, NetworkAssignment> {
    const networkAssignment: Record<string, NetworkAssignment> = {};
    
    // Initialize network assignment with zero volume
    for (const [linkId, link] of this.network.entries()) {
      networkAssignment[linkId] = {
        linkId,
        volume: 0,
        capacity: link.capacity || 1500 * (link.lanes || 1),
        congestionIndex: 0,
        vehicleTrips: 0,
        transitTrips: 0,
        bikeTrips: 0,
        walkTrips: 0
      };
    }
    
    // For simplicity, we're doing a very basic assignment
    // A real model would use sophisticated routing algorithms
    
    // Calculate vehicle trips by OD pair
    for (const [originId, destinations] of Object.entries(modeChoice)) {
      for (const [destId, purposes] of Object.entries(destinations)) {
        if (originId === destId) continue; // Skip intra-zonal trips
        
        let totalVehicleTrips = 0;
        let totalTransitTrips = 0;
        let totalBikeTrips = 0;
        let totalWalkTrips = 0;
        
        // Sum up all vehicle trips between this OD pair
        for (const purpose of Object.values(TripPurpose)) {
          if (!purposes[purpose]) continue;
          
          totalVehicleTrips += 
            (purposes[purpose][TransportMode.DRIVE_ALONE] || 0) +
            (purposes[purpose][TransportMode.SHARED_RIDE_2] || 0) / 2 +
            (purposes[purpose][TransportMode.SHARED_RIDE_3_PLUS] || 0) / 3.5;
          
          totalTransitTrips += purposes[purpose][TransportMode.TRANSIT] || 0;
          totalBikeTrips += purposes[purpose][TransportMode.BIKE] || 0;
          totalWalkTrips += purposes[purpose][TransportMode.WALK] || 0;
        }
        
        // Find shortest path links between origin and destination
        // This is a simplification - a real model would use actual routing
        const pathLinks = this.findPathLinks(originId, destId);
        
        // Assign vehicle trips to links in the path
        for (const linkId of pathLinks) {
          networkAssignment[linkId].vehicleTrips += totalVehicleTrips;
          networkAssignment[linkId].volume += totalVehicleTrips;
          
          networkAssignment[linkId].transitTrips += totalTransitTrips;
          networkAssignment[linkId].bikeTrips += totalBikeTrips;
          networkAssignment[linkId].walkTrips += totalWalkTrips;
        }
      }
    }
    
    // Calculate congestion index (Volume/Capacity ratio)
    for (const [_linkId, assignment] of Object.entries(networkAssignment)) {
      if (assignment.capacity > 0) {
        assignment.congestionIndex = assignment.volume / assignment.capacity;
      }
    }
    
    return networkAssignment;
  }
  
  /**
   * Find links connecting origin and destination
   * This is a very simplified version - a real implementation would use path-finding algorithms
   */
  private findPathLinks(_originId: string, _destId: string): string[] {
    // For demonstration, return a random sample of links
    // In a real model, this would use graph algorithms to find the shortest path
    const pathLinks: string[] = [];
    const linkCount = Math.ceil(Math.random() * 5); // Random number of links (1-5)
    
    // Get array of link IDs
    const linkIds = Array.from(this.network.keys());
    
    // Select random links
    for (let i = 0; i < Math.min(linkCount, linkIds.length); i++) {
      const randomIndex = Math.floor(Math.random() * linkIds.length);
      pathLinks.push(linkIds[randomIndex]);
    }
    
    return pathLinks;
  }
  
  /**
   * Calculate overall metrics
   */
  calculateMetrics(
    tripGeneration: Record<string, Record<TripPurpose, number>>,
    tripDistribution: Record<string, Record<string, Record<TripPurpose, number>>>,
    modeChoice: Record<string, Record<string, Record<TripPurpose, Record<TransportMode, number>>>>,
    networkAssignment: Record<string, NetworkAssignment>
  ): CAMPModelResults {
    // Calculate total trips by purpose
    const tripsByPurpose: Record<TripPurpose, number> = {
      [TripPurpose.HOME_WORK]: 0,
      [TripPurpose.HOME_SHOP]: 0,
      [TripPurpose.HOME_SCHOOL]: 0,
      [TripPurpose.HOME_OTHER]: 0,
      [TripPurpose.WORK_OTHER]: 0,
      [TripPurpose.OTHER_OTHER]: 0
    };
    
    for (const zoneTrips of Object.values(tripGeneration)) {
      for (const [purpose, trips] of Object.entries(zoneTrips)) {
        tripsByPurpose[purpose as TripPurpose] += trips;
      }
    }
    
    // Calculate trips by mode
    const tripsByMode: Record<TransportMode, number> = {
      [TransportMode.DRIVE_ALONE]: 0,
      [TransportMode.SHARED_RIDE_2]: 0,
      [TransportMode.SHARED_RIDE_3_PLUS]: 0,
      [TransportMode.TRANSIT]: 0,
      [TransportMode.BIKE]: 0,
      [TransportMode.WALK]: 0
    };
    
    for (const origins of Object.values(modeChoice)) {
      for (const destinations of Object.values(origins)) {
        for (const purposes of Object.values(destinations)) {
          for (const [mode, trips] of Object.entries(purposes)) {
            tripsByMode[mode as TransportMode] += trips;
          }
        }
      }
    }
    
    // Calculate total VMT and VHT
    let totalVMT = 0;
    let totalVHT = 0;
    let congestedVMT = 0;
    
    for (const [linkId, assignment] of Object.entries(networkAssignment)) {
      const link = this.network.get(linkId);
      if (!link) continue;
      
      // Calculate VMT: volume * length
      const linkVMT = assignment.vehicleTrips * link.length;
      totalVMT += linkVMT;
      
      // Calculate VHT: VMT / speed
      const freeFlowSpeed = link.speedLimit || 30; // mph
      
      // Adjust speed based on congestion using BPR formula
      // speed = freeFlowSpeed / (1 + alpha * (volume/capacity)^beta)
      const alpha = 0.15;
      const beta = 4;
      const adjustedSpeed = freeFlowSpeed / (1 + alpha * Math.pow(assignment.congestionIndex, beta));
      
      const linkVHT = linkVMT / adjustedSpeed;
      totalVHT += linkVHT;
      
      // Count congested VMT (V/C > 0.8)
      if (assignment.congestionIndex > 0.8) {
        congestedVMT += linkVMT;
      }
    }
    
    // Calculate mode shares (as percentages)
    const totalTrips = Object.values(tripsByMode).reduce((sum, trips) => sum + trips, 0);
    const modeShares: Record<TransportMode, number> = {} as Record<TransportMode, number>;
    
    for (const mode of Object.values(TransportMode)) {
      modeShares[mode] = totalTrips > 0 ? (tripsByMode[mode] / totalTrips) * 100 : 0;
    }
    
    // Calculate GHG emissions (very simple estimate)
    // In a real model, this would be based on fleet composition, speeds, etc.
    const emissionFactorGramsPerMile = 400; // g CO2 per mile
    const totalGHGTons = (totalVMT * emissionFactorGramsPerMile) / 907185; // Convert g to tons
    
    return {
      totalTrips,
      tripsByPurpose,
      tripsByMode,
      modeShares,
      totalVMT,
      totalVHT,
      averageSpeed: totalVMT > 0 ? totalVMT / totalVHT : 0,
      congestedVMT,
      percentCongestedVMT: totalVMT > 0 ? (congestedVMT / totalVMT) * 100 : 0,
      ghgEmissions: totalGHGTons,
      networkAssignment
    };
  }
  
  /**
   * Run the complete CAMP model
   */
  async run(scenarioId: string, organizationId: string): Promise<CAMPModelResults> {
    try {
      console.log(`Running CAMP model for scenario ${scenarioId}`);
      
      // Load data
      await this.loadZones(organizationId);
      await this.loadNetwork(organizationId);
      
      // Four-step process
      const tripGeneration = this.generateTrips();
      console.log('Trip generation complete');
      
      const tripDistribution = this.distributeTrips(tripGeneration);
      console.log('Trip distribution complete');
      
      const modeChoice = this.applyModeChoice(tripDistribution);
      console.log('Mode choice complete');
      
      const networkAssignment = this.assignTripsToNetwork(modeChoice);
      console.log('Network assignment complete');
      
      // Calculate metrics
      const results = this.calculateMetrics(
        tripGeneration,
        tripDistribution,
        modeChoice,
        networkAssignment
      );
      
      console.log('CAMP model run complete');
      return results;
    } catch (error) {
      console.error('Error running CAMP model:', error);
      throw error;
    }
  }
} 