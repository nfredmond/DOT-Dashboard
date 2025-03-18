import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';
import { 
  ModelParameters, 
  ActivitySimulationRun, 
  ActivitySimulationResults,
  PersonAgent,
  Activity,
  TravelItinerary
} from '@/types/camp';
import { PopulationSynthesis } from './activity-model/PopulationSynthesis';
import { ActivityGeneration } from './activity-model/ActivityGeneration';
import { TravelItineraryGeneration } from './activity-model/TravelItineraryGeneration';

/**
 * ActivitySimulationService 
 * 
 * A service that orchestrates the entire activity-based simulation process
 * from population synthesis to activity generation to itinerary generation.
 */
export class ActivitySimulationService {
  private scenarioId: string;
  private parameters: ModelParameters;
  private simulationRunId: string = '';
  private status: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
  private progress: number = 0;
  private errorMessage: string | null = null;
  private startTime: Date | null = null;
  private endTime: Date | null = null;

  /**
   * Constructor for ActivitySimulationService
   * 
   * @param scenarioId - ID of the scenario to run the simulation for
   * @param parameters - Model parameters for the simulation
   */
  constructor(scenarioId: string, parameters: ModelParameters) {
    this.scenarioId = scenarioId;
    this.parameters = parameters;
  }

  /**
   * Run the full activity-based simulation
   * 
   * @returns Promise resolving to the simulation run record
   */
  async runSimulation(): Promise<ActivitySimulationRun> {
    try {
      this.status = 'running';
      this.startTime = new Date();
      this.progress = 0;
      this.errorMessage = null;

      // Create simulation run record
      await this.createSimulationRun();

      // Step 1: Synthesize population
      this.progress = 10;
      await this.updateProgress('Generating synthetic population...');
      const populationSynthesis = new PopulationSynthesis(
        this.scenarioId, 
        {}, // Zone data - we'll need to fetch this or change the constructor
        this.parameters,
        supabase
      );
      
      const personAgents = await populationSynthesis.generatePopulation();
      this.progress = 30;
      await this.updateProgress('Synthetic population generated successfully.');

      // Step 2: Generate activities
      this.progress = 40;
      await this.updateProgress('Generating activities...');
      const activityGeneration = new ActivityGeneration(
        this.scenarioId,
        this.parameters,
        personAgents,
        supabase
      );
      
      const activities = await activityGeneration.generateActivities();
      this.progress = 60;
      await this.updateProgress('Activities generated successfully.');

      // Step 3: Generate travel itineraries
      this.progress = 70;
      await this.updateProgress('Generating travel itineraries...');
      const travelItineraryGeneration = new TravelItineraryGeneration(
        this.scenarioId,
        this.parameters,
        personAgents,
        activities,
        {}, // Network data - we'll need to fetch this or change the constructor
        supabase
      );
      
      const travelItineraries = await travelItineraryGeneration.generateItineraries();
      this.progress = 90;
      await this.updateProgress('Travel itineraries generated successfully.');

      // Step 4: Generate simulation results
      this.progress = 95;
      await this.updateProgress('Generating simulation results...');
      const results = await this.generateResults(personAgents, activities, travelItineraries);
      await this.storeResults(results);
      
      // Finalize
      this.progress = 100;
      this.status = 'completed';
      this.endTime = new Date();
      await this.updateProgress('Simulation completed successfully.');

      return await this.getSimulationRun();
    } catch (error) {
      this.status = 'failed';
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.endTime = new Date();
      await this.updateProgress(`Simulation failed: ${this.errorMessage}`);
      throw error;
    }
  }

  /**
   * Create a new simulation run record in the database
   */
  private async createSimulationRun(): Promise<void> {
    this.simulationRunId = uuidv4();
    
    const simulationRun: Partial<ActivitySimulationRun> = {
      id: this.simulationRunId,
      scenario_id: this.scenarioId,
      name: this.parameters.name || `Simulation run ${new Date().toLocaleDateString()}`,
      description: this.parameters.description || 'Activity-based simulation run',
      parameters: this.parameters,
      status: 'running',
      results: null,
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    const { error } = await supabase
      .from('activity_simulation_runs')
      .insert(simulationRun);
    
    if (error) {
      throw new Error(`Failed to create simulation run: ${error.message}`);
    }
  }

  /**
   * Update the progress of the simulation run
   * 
   * @param message - Progress message to log
   */
  private async updateProgress(message: string): Promise<void> {
    console.log(`[${this.progress}%] ${message}`);
    
    // Update the simulation run record
    const { error } = await supabase
      .from('activity_simulation_runs')
      .update({
        status: this.status,
        error_message: this.errorMessage
      })
      .eq('id', this.simulationRunId);
    
    if (error) {
      console.error(`Failed to update simulation run progress: ${error.message}`);
    }
    
    // Log to simulation events table for detailed progress tracking
    await supabase
      .from('simulation_events')
      .insert({
        simulation_run_id: this.simulationRunId,
        event_type: 'progress',
        message,
        progress: this.progress,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Generate simulation results from the simulation outputs
   * 
   * @param personAgents - Map of person agents
   * @param activities - Array of activities
   * @param travelItineraries - Array of travel itineraries
   * @returns The generated simulation results
   */
  private async generateResults(
    personAgents: Map<string, PersonAgent>,
    activities: Activity[],
    travelItineraries: TravelItinerary[]
  ): Promise<ActivitySimulationResults> {
    // Calculate summary statistics
    const totalPersons = personAgents.size;
    const totalActivities = activities.length;
    const totalTrips = travelItineraries.length;
    
    // Calculate peak hour
    const hourCounts: Record<number, number> = {};
    for (const trip of travelItineraries) {
      const departureHour = new Date(trip.departure_time).getHours();
      hourCounts[departureHour] = (hourCounts[departureHour] || 0) + 1;
    }
    
    let peakHour = 0;
    let peakCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > peakCount) {
        peakCount = count;
        peakHour = parseInt(hour, 10);
      }
    }
    
    // Calculate mode split
    const modeCounts: Record<string, number> = {};
    for (const trip of travelItineraries) {
      modeCounts[trip.mode] = (modeCounts[trip.mode] || 0) + 1;
    }
    
    const modeSplit = Object.entries(modeCounts).map(([mode, count]) => ({
      mode,
      count,
      percentage: (count / totalTrips) * 100
    }));
    
    // Calculate trips by purpose (using destination activity type)
    const purposeCounts: Record<string, number> = {};
    for (const trip of travelItineraries) {
      const destinationActivity = activities.find(a => a.id === trip.destination_activity_id);
      if (destinationActivity) {
        const purpose = destinationActivity.activity_type;
        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
      }
    }
    
    const tripsByPurpose = Object.entries(purposeCounts).map(([purpose, count]) => ({
      purpose,
      count,
      percentage: (count / totalTrips) * 100
    }));
    
    // Calculate temporal distribution
    const temporalDistribution = Array.from({ length: 24 }, (_, hour) => {
      const count = hourCounts[hour] || 0;
      return {
        hour,
        count,
        percentage: (count / totalTrips) * 100
      };
    });
    
    return {
      summary: {
        total_persons: totalPersons,
        total_activities: totalActivities,
        total_trips: totalTrips,
        peak_hour: {
          hour: peakHour,
          count: peakCount
        }
      },
      mode_split: modeSplit,
      trips_by_purpose: tripsByPurpose,
      temporal_distribution: temporalDistribution
    };
  }

  /**
   * Store simulation results in the database
   * 
   * @param results - The simulation results to store
   */
  private async storeResults(results: ActivitySimulationResults): Promise<void> {
    const { error } = await supabase
      .from('activity_simulation_runs')
      .update({
        status: 'completed',
        results,
        completed_at: new Date().toISOString()
      })
      .eq('id', this.simulationRunId);
    
    if (error) {
      throw new Error(`Failed to store simulation results: ${error.message}`);
    }
  }

  /**
   * Get the current simulation run record
   * 
   * @returns The simulation run record
   */
  private async getSimulationRun(): Promise<ActivitySimulationRun> {
    const { data, error } = await supabase
      .from('activity_simulation_runs')
      .select('*')
      .eq('id', this.simulationRunId)
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to retrieve simulation run: ${error?.message || 'No data'}`);
    }
    
    return data;
  }

  /**
   * Get all simulation runs for a scenario
   * 
   * @param scenarioId - ID of the scenario
   * @returns Array of simulation runs
   */
  public static async getSimulationRuns(scenarioId: string): Promise<ActivitySimulationRun[]> {
    const { data, error } = await supabase
      .from('activity_simulation_runs')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to retrieve simulation runs: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Get a specific simulation run by ID
   * 
   * @param simulationRunId - ID of the simulation run
   * @returns The simulation run record
   */
  public static async getSimulationRun(simulationRunId: string): Promise<ActivitySimulationRun> {
    const { data, error } = await supabase
      .from('activity_simulation_runs')
      .select('*')
      .eq('id', simulationRunId)
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to retrieve simulation run: ${error?.message || 'No data'}`);
    }
    
    return data;
  }

  /**
   * Delete a simulation run and all associated data
   * 
   * @param simulationRunId - ID of the simulation run to delete
   */
  public static async deleteSimulationRun(simulationRunId: string): Promise<void> {
    // Start a transaction to delete all related data
    // Delete travel itineraries
    await supabase
      .from('travel_itineraries')
      .delete()
      .eq('simulation_run_id', simulationRunId);
    
    // Delete activities
    await supabase
      .from('activities')
      .delete()
      .eq('simulation_run_id', simulationRunId);
    
    // Delete person agents
    await supabase
      .from('person_agents')
      .delete()
      .eq('simulation_run_id', simulationRunId);
    
    // Delete simulation events
    await supabase
      .from('simulation_events')
      .delete()
      .eq('simulation_run_id', simulationRunId);
    
    // Finally, delete the simulation run itself
    const { error } = await supabase
      .from('activity_simulation_runs')
      .delete()
      .eq('id', simulationRunId);
    
    if (error) {
      throw new Error(`Failed to delete simulation run: ${error.message}`);
    }
  }
} 