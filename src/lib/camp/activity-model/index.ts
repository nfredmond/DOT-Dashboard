/**
 * Activity-Based Modeling API
 * 
 * This file exports the activity-based modeling components and provides
 * the main API for using the model in the application.
 */

import { ActivityBasedSimulation } from './ActivityBasedSimulation';
import { PopulationSynthesis } from './PopulationSynthesis';
import { ActivityGeneration } from './ActivityGeneration';
import { TravelItineraryGeneration } from './TravelItineraryGeneration';
import { 
  ModelParameters, 
  ActivitySimulationRun,
  ActivitySimulationResults,
  PersonAgent,
  Activity,
  TravelItinerary,
  ActivityType
} from '@/types/camp';
import { supabase } from '@/lib/supabase-client';

// Export all components
export {
  ActivityBasedSimulation,
  PopulationSynthesis,
  ActivityGeneration,
  TravelItineraryGeneration
};

/**
 * Run an activity-based simulation for a scenario
 */
export async function runActivitySimulation(
  scenarioId: string,
  parameters: ModelParameters,
  organizationId: string,
  userId?: string,
  name?: string,
  description?: string,
  config?: any
): Promise<ActivitySimulationResults> {
  const simulation = new ActivityBasedSimulation(
    scenarioId,
    parameters,
    organizationId,
    userId
  );
  
  return simulation.runSimulation(
    name || `Activity Simulation ${new Date().toISOString().split('T')[0]}`,
    description,
    config
  );
}

/**
 * Get all simulation runs for a scenario
 */
export async function getSimulationRuns(
  scenarioId: string
): Promise<ActivitySimulationRun[]> {
  const { data, error } = await supabase
    .from('activity_simulation_runs')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('start_time', { ascending: false });
    
  if (error) {
    console.error('Error fetching simulation runs:', error);
    return [];
  }
  
  return (data || []).map(run => ({
    id: run.id,
    scenarioId: run.scenario_id,
    name: run.name,
    description: run.description,
    startTime: run.start_time,
    endTime: run.end_time,
    status: run.status,
    configuration: run.configuration,
    agentCount: run.agent_count,
    activityCount: run.activity_count,
    tripCount: run.trip_count,
    createdBy: run.created_by,
    errorMessage: run.error_message,
    resultsSummary: run.results_summary
  }));
}

/**
 * Get a specific simulation run
 */
export async function getSimulationRun(
  runId: string
): Promise<ActivitySimulationRun | null> {
  const { data, error } = await supabase
    .from('activity_simulation_runs')
    .select('*')
    .eq('id', runId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching simulation run:', error);
    return null;
  }
  
  return {
    id: data.id,
    scenarioId: data.scenario_id,
    name: data.name,
    description: data.description,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    configuration: data.configuration,
    agentCount: data.agent_count,
    activityCount: data.activity_count,
    tripCount: data.trip_count,
    createdBy: data.created_by,
    errorMessage: data.error_message,
    resultsSummary: data.results_summary
  };
}

/**
 * Get person agents for a simulation run
 */
export async function getPersonAgents(
  scenarioId: string,
  limit = 1000,
  offset = 0
): Promise<PersonAgent[]> {
  const { data, error } = await supabase
    .from('person_agents')
    .select('*')
    .eq('scenario_id', scenarioId)
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Error fetching person agents:', error);
    return [];
  }
  
  return (data || []).map(agent => ({
    id: agent.id,
    scenarioId: agent.scenario_id,
    zoneId: agent.zone_id,
    householdId: agent.household_id,
    age: agent.age,
    gender: agent.gender,
    occupation: agent.occupation,
    incomeGroup: agent.income_group,
    hasVehicle: agent.has_vehicle,
    hasBicycle: agent.has_bicycle,
    hasTransitPass: agent.has_transit_pass,
    timezone: agent.timezone || 'UTC',
    attributes: agent.attributes,
    homeLocation: agent.home_location,
    workLocation: agent.work_location,
    schoolLocation: agent.school_location
  }));
}

/**
 * Get activities for a person agent
 */
export async function getActivities(
  personAgentId: string,
  scenarioId?: string
): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*, activity_types(*)')
    .eq('person_agent_id', personAgentId);
    
  if (scenarioId) {
    query = query.eq('scenario_id', scenarioId);
  }
  
  const { data, error } = await query.order('start_time', { ascending: true });
    
  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
  
  return (data || []).map(activity => ({
    id: activity.id,
    personAgentId: activity.person_agent_id,
    scenarioId: activity.scenario_id,
    activityTypeId: activity.activity_type_id,
    activityType: activity.activity_types?.name,
    startTime: activity.start_time,
    endTime: activity.end_time,
    durationMinutes: activity.duration_minutes,
    locationId: activity.location_id,
    locationZoneId: activity.location_zone_id,
    locationLongitude: activity.location_longitude,
    locationLatitude: activity.location_latitude,
    locationName: activity.location_name,
    isPrimary: activity.is_primary,
    isScheduled: activity.is_scheduled,
    priority: activity.priority,
    flexibility: activity.flexibility,
    properties: activity.properties
  }));
}

/**
 * Get travel itineraries for a person agent
 */
export async function getTravelItineraries(
  personAgentId: string,
  scenarioId?: string
): Promise<TravelItinerary[]> {
  let query = supabase
    .from('travel_itineraries')
    .select('*')
    .eq('person_agent_id', personAgentId);
    
  if (scenarioId) {
    query = query.eq('scenario_id', scenarioId);
  }
  
  const { data, error } = await query.order('departure_time', { ascending: true });
    
  if (error) {
    console.error('Error fetching travel itineraries:', error);
    return [];
  }
  
  return (data || []).map(itinerary => ({
    id: itinerary.id,
    personAgentId: itinerary.person_agent_id,
    scenarioId: itinerary.scenario_id,
    originActivityId: itinerary.origin_activity_id,
    destinationActivityId: itinerary.destination_activity_id,
    originZoneId: itinerary.origin_zone_id,
    destinationZoneId: itinerary.destination_zone_id,
    originLongitude: itinerary.origin_longitude,
    originLatitude: itinerary.origin_latitude,
    destinationLongitude: itinerary.destination_longitude,
    destinationLatitude: itinerary.destination_latitude,
    departureTime: itinerary.departure_time,
    arrivalTime: itinerary.arrival_time,
    travelMode: itinerary.travel_mode,
    travelTimeMinutes: itinerary.travel_time_minutes,
    travelDistanceMeters: itinerary.travel_distance_meters,
    travelCost: itinerary.travel_cost,
    pathGeometry: itinerary.path_geometry,
    properties: itinerary.properties
  }));
}

/**
 * Get activity types for an organization
 */
export async function getActivityTypes(
  organizationId: string
): Promise<ActivityType[]> {
  const { data, error } = await supabase
    .from('activity_types')
    .select('*')
    .eq('organization_id', organizationId)
    .order('priority', { ascending: false });
    
  if (error) {
    console.error('Error fetching activity types:', error);
    return [];
  }
  
  return (data || []).map(type => ({
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
 * Create a new activity type
 */
export async function createActivityType(
  activityType: Omit<ActivityType, 'id'>
): Promise<ActivityType | null> {
  const { data, error } = await supabase
    .from('activity_types')
    .insert({
      name: activityType.name,
      organization_id: activityType.organizationId,
      description: activityType.description,
      priority: activityType.priority,
      typical_duration_minutes: activityType.typicalDurationMinutes,
      mandatory: activityType.mandatory,
      time_window_start: activityType.timeWindowStart,
      time_window_end: activityType.timeWindowEnd,
      location_flexibility: activityType.locationFlexibility,
      properties: activityType.properties
    })
    .select('*')
    .single();
    
  if (error) {
    console.error('Error creating activity type:', error);
    return null;
  }
  
  return {
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
  };
} 