/**
 * Activity-Based Simulation Module
 * 
 * Coordinates the entire activity-based simulation process.
 * Manages population synthesis, activity generation, and travel itinerary generation.
 */

import { supabase } from '@/lib/supabase-client';
import { PopulationSynthesis } from './PopulationSynthesis';
import { ActivityGeneration } from './ActivityGeneration';
import { TravelItineraryGeneration } from './TravelItineraryGeneration';
import {
  ModelParameters,
  ActivitySimulationRun,
  ActivityType,
  ActivitySimulationResults
} from '@/types/camp';

export class ActivityBasedSimulation {
  private scenarioId: string;
  private parameters: ModelParameters;
  private organizationId: string;
  private userId?: string;
  private simulationRun?: ActivitySimulationRun;
  
  constructor(
    scenarioId: string,
    parameters: ModelParameters,
    organizationId: string,
    userId?: string
  ) {
    this.scenarioId = scenarioId;
    this.parameters = parameters;
    this.organizationId = organizationId;
    this.userId = userId;
  }
  
  /**
   * Run the complete activity-based simulation
   */
  public async runSimulation(
    name: string,
    description?: string,
    config?: any
  ): Promise<ActivitySimulationResults> {
    console.log('Starting activity-based simulation...');
    
    try {
      // Create simulation run record
      this.simulationRun = await this.createSimulationRun(name, description, config);
      
      // Get zone data
      const zoneData = await this.getZoneData();
      
      // Get network data
      const networkData = await this.getNetworkData();
      
      // Get activity types
      const activityTypes = await this.getActivityTypes();
      
      // Step 1: Population synthesis
      const populationSynthesis = new PopulationSynthesis(
        this.scenarioId, 
        zoneData, 
        this.parameters
      );
      
      await this.updateSimulationStatus('synthesizing_population');
      const syntheticPopulation = await populationSynthesis.synthesizePopulation();
      
      // Step 2: Activity generation
      const activityGeneration = new ActivityGeneration(
        this.scenarioId,
        this.parameters,
        syntheticPopulation,
        activityTypes,
        zoneData,
        await this.getLocationData()
      );
      
      await this.updateSimulationStatus('generating_activities');
      const activities = await activityGeneration.generateActivities();
      
      // Step 3: Travel itinerary generation
      const travelItineraryGeneration = new TravelItineraryGeneration(
        this.scenarioId,
        this.parameters,
        syntheticPopulation,
        activities,
        networkData
      );
      
      await this.updateSimulationStatus('generating_itineraries');
      const itineraries = await travelItineraryGeneration.generateItineraries();
      
      // Step 4: Process results
      await this.updateSimulationStatus('processing_results');
      const results = await this.processResults(
        syntheticPopulation,
        activities,
        itineraries
      );
      
      // Step 5: Complete simulation
      await this.completeSimulation(
        syntheticPopulation.length,
        activities.length,
        itineraries.length,
        results
      );
      
      return results;
    } catch (error: any) {
      console.error('Error in activity-based simulation:', error);
      
      // Update simulation run with error
      await this.failSimulation(error.message);
      
      throw error;
    }
  }
  
  /**
   * Create a new simulation run record
   */
  private async createSimulationRun(
    name: string,
    description?: string,
    config?: any
  ): Promise<ActivitySimulationRun> {
    const simulationConfig = config || {
      agentSampleRate: this.parameters.activity_based?.population_synthesis?.seed_penetration_rate || 0.1,
      simulationDay: new Date().toISOString().split('T')[0],
      timeStep: 15, // 15-minute intervals
      spatialResolution: 2, // Level of spatial resolution
      includeTransitSimulation: true,
      includeTrafficSimulation: false,
      maxIterations: 1,
      convergenceCriteria: 0.01,
      randomSeed: Math.floor(Math.random() * 1000000)
    };
    
    // Create simulation run record
    const { data, error } = await supabase
      .from('activity_simulation_runs')
      .insert({
        scenario_id: this.scenarioId,
        name,
        description,
        configuration: simulationConfig,
        status: 'running',
        agent_count: 0,
        activity_count: 0,
        trip_count: 0,
        created_by: this.userId
      })
      .select('*')
      .single();
      
    if (error) {
      throw new Error(`Failed to create simulation run: ${error.message}`);
    }
    
    // Convert to application model
    return {
      id: data.id,
      scenarioId: data.scenario_id,
      name: data.name,
      description: data.description,
      startTime: data.start_time,
      status: data.status,
      configuration: data.configuration,
      agentCount: data.agent_count,
      activityCount: data.activity_count,
      tripCount: data.trip_count,
      createdBy: data.created_by
    };
  }
  
  /**
   * Update simulation status
   */
  private async updateSimulationStatus(status: string): Promise<void> {
    if (!this.simulationRun?.id) return;
    
    await supabase
      .from('activity_simulation_runs')
      .update({ status })
      .eq('id', this.simulationRun.id);
  }
  
  /**
   * Mark simulation as failed
   */
  private async failSimulation(errorMessage: string): Promise<void> {
    if (!this.simulationRun?.id) return;
    
    await supabase
      .from('activity_simulation_runs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        end_time: new Date().toISOString()
      })
      .eq('id', this.simulationRun.id);
  }
  
  /**
   * Mark simulation as complete
   */
  private async completeSimulation(
    agentCount: number,
    activityCount: number,
    tripCount: number,
    results: ActivitySimulationResults
  ): Promise<void> {
    if (!this.simulationRun?.id) return;
    
    await supabase
      .from('activity_simulation_runs')
      .update({
        status: 'completed',
        agent_count: agentCount,
        activity_count: activityCount,
        trip_count: tripCount,
        results_summary: results,
        end_time: new Date().toISOString()
      })
      .eq('id', this.simulationRun.id);
  }
  
  /**
   * Get zone data for the scenario
   */
  private async getZoneData(): Promise<any> {
    // Get scenario data
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', this.scenarioId)
      .single();
      
    if (scenarioError || !scenario) {
      throw new Error(`Failed to fetch scenario: ${scenarioError?.message || 'Scenario not found'}`);
    }
    
    // Find the baseline scenario
    const { data: baselineScenario, error: baselineError } = await supabase
      .from('baseline_scenarios')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('year', scenario.year)
      .single();
      
    if (baselineError || !baselineScenario) {
      throw new Error(`Failed to fetch baseline scenario: ${baselineError?.message || 'Baseline not found'}`);
    }
    
    // Return zone data from baseline
    return {
      zones: baselineScenario.zone_data,
      zoneGeometries: baselineScenario.zone_geometries
    };
  }
  
  /**
   * Get network data for the scenario
   */
  private async getNetworkData(): Promise<any> {
    // Get scenario data
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', this.scenarioId)
      .single();
      
    if (scenarioError || !scenario) {
      throw new Error(`Failed to fetch scenario: ${scenarioError?.message || 'Scenario not found'}`);
    }
    
    // Find the baseline scenario
    const { data: baselineScenario, error: baselineError } = await supabase
      .from('baseline_scenarios')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('year', scenario.year)
      .single();
      
    if (baselineError || !baselineScenario) {
      throw new Error(`Failed to fetch baseline scenario: ${baselineError?.message || 'Baseline not found'}`);
    }
    
    // Return network data from baseline
    return baselineScenario.network_data;
  }
  
  /**
   * Get location data for activities
   */
  private async getLocationData(): Promise<any> {
    // Get activity locations
    const { data: locations, error } = await supabase
      .from('activity_locations')
      .select('*')
      .eq('organization_id', this.organizationId);
      
    if (error) {
      console.error('Error fetching activity locations:', error);
      return {};
    }
    
    // Group locations by zone
    const locationsByZone: Record<string, any[]> = {};
    
    for (const location of locations || []) {
      if (!locationsByZone[location.zone_id]) {
        locationsByZone[location.zone_id] = [];
      }
      
      const coordinates = location.coordinates as string;
      const match = coordinates.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
      
      locationsByZone[location.zone_id].push({
        id: location.id,
        name: location.location_name,
        type: location.location_type,
        longitude: match ? parseFloat(match[1]) : 0,
        latitude: match ? parseFloat(match[2]) : 0,
        properties: location.properties
      });
    }
    
    return locationsByZone;
  }
  
  /**
   * Get activity types for the organization
   */
  private async getActivityTypes(): Promise<ActivityType[]> {
    // Get activity types
    const { data, error } = await supabase
      .from('activity_types')
      .select('*')
      .eq('organization_id', this.organizationId);
      
    if (error) {
      throw new Error(`Failed to fetch activity types: ${error.message}`);
    }
    
    // If no activity types exist, create default ones
    if (!data || data.length === 0) {
      return this.createDefaultActivityTypes();
    }
    
    // Convert to application model
    return data.map(type => ({
      id: type.id,
      name: type.name,
      organizationId: type.organization_id,
      description: type.description,
      priority: type.priority,
      typicalDurationMinutes: type.typical_duration_minutes,
      mandatory: type.mandatory,
      timeWindowStart: type.time_window_start,
      timeWindowEnd: type.time_window_end,
      locationFlexibility: type.location_flexibility,
      properties: type.properties
    }));
  }
  
  /**
   * Create default activity types
   */
  private async createDefaultActivityTypes(): Promise<ActivityType[]> {
    const defaultTypes = [
      {
        name: 'home',
        description: 'Being at home',
        priority: 10,
        typical_duration_minutes: 720,
        mandatory: true,
        location_flexibility: 0,
        properties: { color: '#3498db' }
      },
      {
        name: 'work',
        description: 'Work activities',
        priority: 9,
        typical_duration_minutes: 480,
        mandatory: true,
        time_window_start: '08:00',
        time_window_end: '18:00',
        location_flexibility: 1,
        properties: { color: '#e74c3c' }
      },
      {
        name: 'education',
        description: 'School/education activities',
        priority: 8,
        typical_duration_minutes: 360,
        mandatory: true,
        time_window_start: '08:00',
        time_window_end: '16:00',
        location_flexibility: 1,
        properties: { color: '#9b59b6' }
      },
      {
        name: 'shopping',
        description: 'Shopping activities',
        priority: 5,
        typical_duration_minutes: 60,
        mandatory: false,
        time_window_start: '09:00',
        time_window_end: '21:00',
        location_flexibility: 7,
        properties: { color: '#f1c40f' }
      },
      {
        name: 'recreation',
        description: 'Recreational activities',
        priority: 3,
        typical_duration_minutes: 120,
        mandatory: false,
        time_window_start: '09:00',
        time_window_end: '22:00',
        location_flexibility: 8,
        properties: { color: '#2ecc71' }
      },
      {
        name: 'social',
        description: 'Social activities',
        priority: 4,
        typical_duration_minutes: 120,
        mandatory: false,
        time_window_start: '17:00',
        time_window_end: '23:00',
        location_flexibility: 6,
        properties: { color: '#1abc9c' }
      },
      {
        name: 'medical',
        description: 'Medical/healthcare activities',
        priority: 7,
        typical_duration_minutes: 60,
        mandatory: false,
        time_window_start: '08:00',
        time_window_end: '18:00',
        location_flexibility: 5,
        properties: { color: '#e74c3c' }
      },
      {
        name: 'errand',
        description: 'Personal errands',
        priority: 6,
        typical_duration_minutes: 30,
        mandatory: false,
        time_window_start: '09:00',
        time_window_end: '19:00',
        location_flexibility: 6,
        properties: { color: '#95a5a6' }
      },
      {
        name: 'meal',
        description: 'Eating/meal activities',
        priority: 6,
        typical_duration_minutes: 45,
        mandatory: false,
        location_flexibility: 8,
        properties: { color: '#e67e22' }
      }
    ];
    
    // Create the activity types
    const types: ActivityType[] = [];
    
    for (const type of defaultTypes) {
      const { data, error } = await supabase
        .from('activity_types')
        .insert({
          ...type,
          organization_id: this.organizationId
        })
        .select('*')
        .single();
        
      if (error) {
        console.error(`Error creating activity type ${type.name}:`, error);
        continue;
      }
      
      types.push({
        id: data.id,
        name: data.name,
        organizationId: data.organization_id,
        description: data.description,
        priority: data.priority,
        typicalDurationMinutes: data.typical_duration_minutes,
        mandatory: data.mandatory,
        timeWindowStart: data.time_window_start,
        timeWindowEnd: data.time_window_end,
        locationFlexibility: data.location_flexibility,
        properties: data.properties
      });
    }
    
    return types;
  }
  
  /**
   * Process simulation results
   */
  private async processResults(
    population: any[],
    activities: any[],
    itineraries: any[]
  ): Promise<ActivitySimulationResults> {
    console.log('Processing simulation results...');
    
    // Calculate aggregate statistics
    const totalTrips = itineraries.length;
    const totalTravelTime = itineraries.reduce((sum, trip) => sum + trip.travelTimeMinutes, 0);
    const totalTravelDistance = itineraries.reduce((sum, trip) => sum + trip.travelDistanceMeters, 0);
    
    const averageTripLength = totalTrips > 0 ? totalTravelDistance / totalTrips : 0;
    const averageTripDuration = totalTrips > 0 ? totalTravelTime / totalTrips : 0;
    
    // Calculate mode split
    const modeCounts: Record<string, number> = {};
    for (const trip of itineraries) {
      modeCounts[trip.travelMode] = (modeCounts[trip.travelMode] || 0) + 1;
    }
    
    const modeSplit: Record<string, number> = {};
    for (const [mode, count] of Object.entries(modeCounts)) {
      modeSplit[mode] = count / totalTrips;
    }
    
    // Calculate purpose split
    const activityById: Record<string, any> = {};
    for (const activity of activities) {
      if (activity.id) {
        activityById[activity.id] = activity;
      }
    }
    
    const purposeCounts: Record<string, number> = {};
    for (const trip of itineraries) {
      const destActivity = activityById[trip.destinationActivityId];
      if (!destActivity) continue;
      
      // Get activity type name
      const activityType = destActivity.activityTypeId || 'unknown';
      purposeCounts[activityType] = (purposeCounts[activityType] || 0) + 1;
    }
    
    const purposeSplit: Record<string, number> = {};
    for (const [purpose, count] of Object.entries(purposeCounts)) {
      purposeSplit[purpose] = count / totalTrips;
    }
    
    // Find peak hour demand
    const tripsByHour: Record<number, number> = {};
    for (const trip of itineraries) {
      const departureHour = new Date(trip.departureTime).getHours();
      tripsByHour[departureHour] = (tripsByHour[departureHour] || 0) + 1;
    }
    
    let peakHour = 0;
    let peakHourDemand = 0;
    
    for (const [hour, count] of Object.entries(tripsByHour)) {
      if (count > peakHourDemand) {
        peakHour = parseInt(hour);
        peakHourDemand = count;
      }
    }
    
    // Calculate zonal statistics
    const zonalStatistics: Record<string, any> = {};
    
    // Count trips produced and attracted by zone
    for (const trip of itineraries) {
      const originZone = trip.originZoneId;
      const destZone = trip.destinationZoneId;
      
      // Initialize if needed
      if (!zonalStatistics[originZone]) {
        zonalStatistics[originZone] = { tripsProduced: 0, tripsAttracted: 0, internalTrips: 0, activityDensity: 0 };
      }
      
      if (!zonalStatistics[destZone]) {
        zonalStatistics[destZone] = { tripsProduced: 0, tripsAttracted: 0, internalTrips: 0, activityDensity: 0 };
      }
      
      // Count trips
      zonalStatistics[originZone].tripsProduced++;
      zonalStatistics[destZone].tripsAttracted++;
      
      // Count internal trips
      if (originZone === destZone) {
        zonalStatistics[originZone].internalTrips++;
      }
    }
    
    // Count activities by zone
    for (const activity of activities) {
      const zone = activity.locationZoneId;
      
      if (!zonalStatistics[zone]) {
        zonalStatistics[zone] = { tripsProduced: 0, tripsAttracted: 0, internalTrips: 0, activityDensity: 0 };
      }
      
      zonalStatistics[zone].activityDensity++;
    }
    
    // Calculate temporal distribution
    const temporalDistribution: Record<string, number> = {};
    
    // Group by hour
    for (const trip of itineraries) {
      const hour = new Date(trip.departureTime).getHours();
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      
      temporalDistribution[timeKey] = (temporalDistribution[timeKey] || 0) + 1;
    }
    
    // Calculate spatial distribution
    const originHeatmap: Record<string, number> = {};
    const destinationHeatmap: Record<string, number> = {};
    const flowBundles: Array<{ fromZone: string; toZone: string; volume: number; modes: Record<string, number> }> = [];
    
    // Count origins and destinations
    for (const trip of itineraries) {
      const originZone = trip.originZoneId;
      const destZone = trip.destinationZoneId;
      
      originHeatmap[originZone] = (originHeatmap[originZone] || 0) + 1;
      destinationHeatmap[destZone] = (destinationHeatmap[destZone] || 0) + 1;
      
      // Track flow bundles
      const bundleKey = `${originZone}-${destZone}`;
      const existingBundle = flowBundles.find(b => b.fromZone === originZone && b.toZone === destZone);
      
      if (existingBundle) {
        existingBundle.volume++;
        existingBundle.modes[trip.travelMode] = (existingBundle.modes[trip.travelMode] || 0) + 1;
      } else {
        flowBundles.push({
          fromZone: originZone,
          toZone: destZone,
          volume: 1,
          modes: { [trip.travelMode]: 1 }
        });
      }
    }
    
    // Sort flow bundles by volume
    flowBundles.sort((a, b) => b.volume - a.volume);
    
    // Return only top flows (e.g., top 100)
    const topFlows = flowBundles.slice(0, 100);
    
    // Assemble results
    return {
      aggregateStatistics: {
        totalTrips,
        totalTravelTime,
        totalTravelDistance,
        averageTripLength,
        averageTripDuration,
        modeSplit,
        purposeSplit,
        peakHourDemand,
        peakHourTime: `${peakHour.toString().padStart(2, '0')}:00`
      },
      zonalStatistics,
      temporalDistribution,
      spatialDistribution: {
        originHeatmap,
        destinationHeatmap,
        flowBundles: topFlows
      }
    };
  }
} 