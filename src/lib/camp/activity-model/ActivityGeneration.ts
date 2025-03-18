/**
 * Activity Generation Module
 * 
 * Responsible for generating daily activity patterns for each person agent.
 * Creates a set of activities based on demographic attributes and time allocations.
 */

import { supabase } from '@/lib/supabase-client';
import { 
  PersonAgent, 
  ActivityType, 
  Activity,
  ModelParameters,
  ActivityLocation
} from '@/types/camp';
import { v4 as uuidv4 } from 'uuid';

/**
 * ActivityGeneration class
 * 
 * Generates activities for person agents based on their demographic attributes,
 * preferences, and local context.
 */
export class ActivityGeneration {
  private scenarioId: string;
  private parameters: ModelParameters;
  private personAgents: Map<string, PersonAgent>;
  private activityLocations: ActivityLocation[];
  private supabase: any;
  private simulationRunId: string = '';

  /**
   * Constructor for ActivityGeneration
   * 
   * @param scenarioId - ID of the scenario
   * @param parameters - Model parameters including activity distributions
   * @param personAgents - Map of person agents to generate activities for
   * @param supabase - Supabase client for database operations
   */
  constructor(
    scenarioId: string, 
    parameters: ModelParameters, 
    personAgents: Map<string, PersonAgent>, 
    supabase: any
  ) {
    this.scenarioId = scenarioId;
    this.parameters = parameters;
    this.personAgents = personAgents;
    this.activityLocations = [];
    this.supabase = supabase;
    
    // Set simulation run ID from the first person agent if available
    if (personAgents.size > 0) {
      const firstPerson = personAgents.values().next().value;
      if (firstPerson && firstPerson.simulation_run_id) {
        this.simulationRunId = firstPerson.simulation_run_id;
      }
    }
  }

  /**
   * Generate activities for all person agents
   * 
   * @returns Promise resolving to an array of generated activities
   */
  async generateActivities(): Promise<Activity[]> {
    console.log('Generating activities for person agents...');
    
    if (!this.parameters.activity_based?.activities) {
      throw new Error('Activity-based parameters are not defined');
    }
    
    try {
      // Fetch activity locations from the database
      await this.fetchActivityLocations();
      
      const activityParams = this.parameters.activity_based.activities;
      const activities: Activity[] = [];
      
      // Parse the start date and get simulation days and start hour
      const startDate = new Date(activityParams.time_frame?.start_date || new Date().toISOString());
      const simulationDays = activityParams.time_frame?.days || 1;
      const startHour = activityParams.time_frame?.start_hour || 0;
      
      // Generate activities for each person
      let personCount = 0;
      const totalPersons = this.personAgents.size;
      let storedActivities = 0;
      
      for (const [personId, person] of this.personAgents.entries()) {
        personCount++;
        
        // Generate activities for this person
        const personActivities = await this.generateActivitiesForPerson(
          person, 
          activityParams.types || [], 
          startDate, 
          startHour, 
          simulationDays
        );
        
        activities.push(...personActivities);
        
        // Store activities in batches to avoid request size limits
        if (activities.length - storedActivities >= 100 || personCount === totalPersons) {
          const batch = activities.slice(storedActivities);
          await this.storeActivities(batch);
          storedActivities += batch.length;
          console.log(`Stored ${batch.length} activities for ${personCount}/${totalPersons} persons`);
        }
      }
      
      console.log(`Generated a total of ${activities.length} activities for ${totalPersons} persons`);
      return activities;
    } catch (error) {
      console.error('Error generating activities:', error);
      throw error;
    }
  }
  
  /**
   * Fetch activity locations from the database
   */
  private async fetchActivityLocations(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('activity_locations')
        .select('*')
        .eq('scenario_id', this.scenarioId);
      
      if (error) {
        console.error('Error fetching activity locations:', error);
        throw error;
      }
      
      this.activityLocations = data || [];
      console.log(`Fetched ${this.activityLocations.length} activity locations`);
    } catch (error) {
      console.error('Failed to fetch activity locations:', error);
      throw error;
    }
  }
  
  /**
   * Generate activities for a specific person
   * 
   * @param person - The person agent to generate activities for
   * @param activityTypes - Array of activity types from parameters
   * @param startDate - Starting date of the simulation
   * @param startHour - Starting hour of the simulation (0-23)
   * @param simulationDays - Number of days to simulate
   * @returns Array of activities for the person
   */
  private async generateActivitiesForPerson(
    person: PersonAgent,
    activityTypes: any[],
    startDate: Date,
    startHour: number,
    simulationDays: number
  ): Promise<Activity[]> {
    const activities: Activity[] = [];
    
    // Get the base number of activities per day
    const baseActivitiesPerDay = this.parameters.activity_based?.activities?.average_per_person || 4;
    
    // For each simulation day
    for (let day = 0; day < simulationDays; day++) {
      // Calculate number of activities for this person based on demographic factors
      const numActivities = this.calculateNumberOfActivities(person, baseActivitiesPerDay);
      
      // Create home activity at the start of the day
      const morningHomeActivity = this.createHomeActivity(person, day, startDate, startHour);
      activities.push(morningHomeActivity);
      
      // Generate daily activities
      const dailyActivities = this.generateDailyActivities(
        person, 
        activityTypes, 
        numActivities, 
        day, 
        startDate, 
        morningHomeActivity
      );
      
      activities.push(...dailyActivities);
      
      // Add a final home activity if there are multiple days
      if (day < simulationDays - 1) {
        const lastActivity = dailyActivities.length > 0 ? 
          dailyActivities[dailyActivities.length - 1] : 
          morningHomeActivity;
        
        const eveningHomeActivity = this.createEndHomeActivity(person, day, startDate, lastActivity);
        activities.push(eveningHomeActivity);
      }
    }
    
    return activities;
  }
  
  /**
   * Calculate number of activities for a person based on demographic factors
   */
  private calculateNumberOfActivities(person: PersonAgent, baseNumber: number): number {
    // Adjust based on age
    let ageFactor = 1.0;
    if (person.age < 18) {
      ageFactor = 0.8; // Fewer activities for children
    } else if (person.age >= 18 && person.age < 30) {
      ageFactor = 1.2; // More activities for young adults
    } else if (person.age >= 65) {
      ageFactor = 0.9; // Fewer activities for seniors
    }
    
    // Adjust based on occupation
    let occupationFactor = 1.0;
    if (person.occupation === 'employed_full_time') {
      occupationFactor = 1.1;
    } else if (person.occupation === 'student') {
      occupationFactor = 1.2;
    } else if (person.occupation === 'retired') {
      occupationFactor = 0.8;
    }
    
    // Add random variation (-1 to +1 activities)
    const randomFactor = Math.floor(Math.random() * 3) - 1;
    
    // Calculate and ensure at least 2 activities
    const numActivities = Math.max(2, Math.round(baseNumber * ageFactor * occupationFactor) + randomFactor);
    
    return numActivities;
  }
  
  /**
   * Create a home activity at the start of the day
   */
  private createHomeActivity(
    person: PersonAgent,
    day: number,
    startDate: Date,
    startHour: number
  ): Activity {
    // Create a copy of the start date
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    date.setHours(startHour, 0, 0, 0);
    
    // Home activity typically ends in the morning (6-9 AM)
    const workingAge = person.age >= 18 && person.age < 65;
    const isStudent = person.occupation === 'student';
    const isEmployed = person.occupation?.includes('employed');
    
    let endHour: number;
    if (workingAge && (isEmployed || isStudent)) {
      // People who work or study leave home earlier
      endHour = 6 + Math.floor(Math.random() * 3); // 6-8 AM
    } else {
      // Others may leave later
      endHour = 8 + Math.floor(Math.random() * 4); // 8-11 AM
    }
    
    const startTime = new Date(date);
    const endTime = new Date(date);
    endTime.setHours(endHour, Math.floor(Math.random() * 60), 0, 0);
    
    // Duration in minutes
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Find home location or use a random one
    const homeLocation = this.findLocationByType('home');
    
    return {
      id: uuidv4(),
      simulation_run_id: this.simulationRunId,
      person_agent_id: person.id,
      activity_type: 'home',
      activity_location_id: homeLocation?.id || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      properties: {
        is_home: true,
        is_primary: true
      },
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Create a home activity at the end of the day
   */
  private createEndHomeActivity(
    person: PersonAgent,
    day: number,
    startDate: Date,
    lastActivity: Activity
  ): Activity {
    // People typically return home in the evening (5-8 PM)
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    
    const workingAge = person.age >= 18 && person.age < 65;
    const isEmployed = person.occupation?.includes('employed');
    
    let startHour: number;
    if (workingAge && isEmployed) {
      // Employed people return later
      startHour = 17 + Math.floor(Math.random() * 3); // 5-7 PM
    } else {
      // Others may return earlier
      startHour = 16 + Math.floor(Math.random() * 3); // 4-6 PM
    }
    
    const startTime = new Date(date);
    startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
    
    // Ensure start time is after the last activity's end time
    const lastActivityEnd = new Date(lastActivity.end_time);
    if (startTime <= lastActivityEnd) {
      startTime.setTime(lastActivityEnd.getTime() + 30 * 60 * 1000); // 30 minutes after last activity
    }
    
    // End time is end of the day or early next day
    const endTime = new Date(date);
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(startHour < 20 ? 23 : 8, 0, 0, 0);
    
    // Duration in minutes
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Find home location or use a random one
    const homeLocation = this.findLocationByType('home');
    
    return {
      id: uuidv4(),
      simulation_run_id: this.simulationRunId,
      person_agent_id: person.id,
      activity_type: 'home',
      activity_location_id: homeLocation?.id || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      properties: {
        is_home: true,
        is_primary: true
      },
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Generate daily activities between morning and evening home activities
   */
  private generateDailyActivities(
    person: PersonAgent,
    activityTypes: any[],
    numberOfActivities: number,
    day: number,
    startDate: Date,
    homeActivity: Activity
  ): Activity[] {
    const activities: Activity[] = [];
    
    // Available time window between morning home activity and end of day
    const dayStart = new Date(homeActivity.end_time);
    const dayEnd = new Date(startDate);
    dayEnd.setDate(dayEnd.getDate() + day);
    dayEnd.setHours(22, 0, 0, 0); // 10 PM
    
    // Available minutes in the day
    const availableMinutes = Math.max(0, Math.round((dayEnd.getTime() - dayStart.getTime()) / (1000 * 60)));
    
    // If no time available, return empty array
    if (availableMinutes <= 0) {
      return activities;
    }
    
    // Allocate time between activities
    const timePerActivity = Math.floor(availableMinutes / (numberOfActivities + 1)); // +1 for travel time
    let currentTime = new Date(dayStart);
    
    // Generate activities
    for (let i = 0; i < numberOfActivities; i++) {
      // Select an activity type
      const activityType = this.selectActivityType(person, activityTypes);
      
      if (!activityType) {
        continue;
      }
      
      // Calculate activity duration
      const duration = this.calculateActivityDuration(activityType, person);
      
      // Start time is current time plus random travel time (10-30 minutes)
      const travelMinutes = 10 + Math.floor(Math.random() * 20);
      const startTime = new Date(currentTime);
      startTime.setMinutes(startTime.getMinutes() + travelMinutes);
      
      // End time is start time plus duration
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      // Ensure end time doesn't exceed day end
      if (endTime > dayEnd) {
        endTime.setTime(dayEnd.getTime());
      }
      
      // Find location for this activity
      const location = this.findLocationByType(activityType.id);
      
      // Create activity
      const activity: Activity = {
        id: uuidv4(),
        simulation_run_id: this.simulationRunId,
        person_agent_id: person.id,
        activity_type: activityType.id,
        activity_location_id: location?.id || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
        properties: {
          is_home: false,
          is_primary: activityType.id === 'work' || activityType.id === 'education',
          activity_name: activityType.name
        },
        created_at: new Date().toISOString()
      };
      
      activities.push(activity);
      
      // Update current time for next activity
      currentTime = new Date(endTime);
      
      // If we're running out of time, break
      const remainingMinutes = Math.round((dayEnd.getTime() - currentTime.getTime()) / (1000 * 60));
      if (remainingMinutes < 30) {
        break;
      }
    }
    
    return activities;
  }
  
  /**
   * Select an activity type for a person based on demographic factors
   */
  private selectActivityType(person: PersonAgent, activityTypes: any[]): any {
    if (!activityTypes || activityTypes.length === 0) {
      // Default activity types if none specified
      const defaultTypes = [
        { id: 'work', name: 'Work', frequency: 0.4 },
        { id: 'education', name: 'Education', frequency: 0.2 },
        { id: 'shopping', name: 'Shopping', frequency: 0.15 },
        { id: 'leisure', name: 'Leisure', frequency: 0.15 },
        { id: 'social', name: 'Social', frequency: 0.1 }
      ];
      activityTypes = defaultTypes;
    }
    
    // Filter by age and occupation for work
    const filteredTypes = activityTypes.filter(type => {
      if (type.id === 'work') {
        // Only working age and employed people work
        return person.age >= 18 && person.age < 65 && 
               person.occupation?.includes('employed');
      }
      
      if (type.id === 'education') {
        // Students and young people go to education
        return person.occupation === 'student' || person.age < 25;
      }
      
      // Other activity types are available to everyone
      return true;
    });
    
    // If no suitable activities, return null
    if (filteredTypes.length === 0) {
      return null;
    }
    
    // Create probability distribution
    const totalFrequency = filteredTypes.reduce((sum, type) => sum + type.frequency, 0);
    let cumProb = 0;
    
    // Sample from distribution
    const rand = Math.random();
    for (const type of filteredTypes) {
      cumProb += type.frequency / totalFrequency;
      if (rand <= cumProb) {
        return type;
      }
    }
    
    // Fallback to first activity type
    return filteredTypes[0];
  }
  
  /**
   * Calculate duration of an activity based on type and person
   */
  private calculateActivityDuration(activityType: any, person: PersonAgent): number {
    // Get constraints if available
    const constraints = activityType.time_constraints || {};
    
    // Determine base duration
    let baseDuration: number;
    
    if (constraints.preferred_duration) {
      baseDuration = constraints.preferred_duration;
    } else {
      // Default durations by activity type
      switch (activityType.id) {
        case 'work':
          baseDuration = 480; // 8 hours
          break;
        case 'education':
          baseDuration = 360; // 6 hours
          break;
        case 'shopping':
          baseDuration = 60; // 1 hour
          break;
        case 'leisure':
          baseDuration = 120; // 2 hours
          break;
        case 'social':
          baseDuration = 180; // 3 hours
          break;
        default:
          baseDuration = 90; // 1.5 hours default
      }
    }
    
    // Add random variation (±20%)
    const variation = (Math.random() * 0.4) - 0.2;
    let duration = Math.round(baseDuration * (1 + variation));
    
    // Apply constraints if specified
    if (constraints.min_duration) {
      duration = Math.max(duration, constraints.min_duration);
    }
    
    if (constraints.max_duration) {
      duration = Math.min(duration, constraints.max_duration);
    }
    
    return duration;
  }
  
  /**
   * Find a location by type
   */
  private findLocationByType(locationType: string): ActivityLocation | null {
    // Filter locations by type
    const locations = this.activityLocations.filter(loc => 
      loc.location_type === locationType
    );
    
    if (locations.length === 0) {
      return null;
    }
    
    // Randomly select a location
    const index = Math.floor(Math.random() * locations.length);
    return locations[index];
  }
  
  /**
   * Store activities in the database
   */
  private async storeActivities(activities: Activity[]): Promise<void> {
    if (activities.length === 0) return;
    
    try {
      const { error } = await this.supabase
        .from('activities')
        .insert(activities);
      
      if (error) {
        console.error('Error storing activities:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to store activities:', error);
      throw error;
    }
  }
} 