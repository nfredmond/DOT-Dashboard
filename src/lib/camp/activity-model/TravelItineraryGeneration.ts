import { v4 as uuidv4 } from 'uuid';
import type { Activity, PersonAgent, TravelItinerary, ModelParameters } from '@/types/camp';

/**
 * TravelItineraryGeneration class
 * 
 * Generates travel itineraries between activities.
 */
export class TravelItineraryGeneration {
  private scenarioId: string;
  private parameters: ModelParameters;
  private personAgents: Map<string, PersonAgent>;
  private activities: Activity[];
  private activitiesByPerson: Map<string, Activity[]>;
  private networkData: any;
  private supabase: any;
  private simulationRunId: string = '';

  /**
   * Constructor for TravelItineraryGeneration
   * 
   * @param scenarioId - ID of the scenario
   * @param parameters - Model parameters including travel options
   * @param personAgents - Map of person agents
   * @param activities - Array of activities
   * @param networkData - Network data for routing
   * @param supabase - Supabase client for database operations
   */
  constructor(
    scenarioId: string, 
    parameters: ModelParameters, 
    personAgents: Map<string, PersonAgent>, 
    activities: Activity[],
    networkData: any,
    supabase: any
  ) {
    this.scenarioId = scenarioId;
    this.parameters = parameters;
    this.personAgents = personAgents;
    this.activities = activities;
    this.networkData = networkData;
    this.supabase = supabase;
    
    // Group activities by person
    this.activitiesByPerson = this.groupActivitiesByPerson(activities);
    
    // Set simulation run ID from the first activity if available
    if (activities.length > 0) {
      this.simulationRunId = activities[0].simulation_run_id;
    }
  }

  /**
   * Group activities by person agent ID
   */
  private groupActivitiesByPerson(activities: Activity[]): Map<string, Activity[]> {
    const activityMap = new Map<string, Activity[]>();
    
    // Sort activities by person and start time
    for (const activity of activities) {
      const personId = activity.person_agent_id;
      
      if (!activityMap.has(personId)) {
        activityMap.set(personId, []);
      }
      
      const personActivities = activityMap.get(personId);
      if (personActivities) {
        personActivities.push(activity);
      }
    }
    
    // Sort each person's activities by start time
    for (const [personId, personActivities] of activityMap.entries()) {
      activityMap.set(
        personId,
        personActivities.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      );
    }
    
    return activityMap;
  }

  /**
   * Generate itineraries for all persons
   * 
   * @returns Promise resolving to an array of travel itineraries
   */
  async generateItineraries(): Promise<TravelItinerary[]> {
    console.log('Generating travel itineraries...');
    
    if (!this.parameters.activity_based?.travel) {
      throw new Error('Travel parameters are not defined');
    }
    
    try {
      const travelParams = this.parameters.activity_based.travel;
      const itineraries: TravelItinerary[] = [];
      
      // Process each person's activities to generate itineraries
      let personCount = 0;
      let itineraryCount = 0;
      const totalPersons = this.activitiesByPerson.size;
      let storedItineraries = 0;
      
      // Process in batches to avoid overwhelming database
      for (const [personId, activities] of this.activitiesByPerson.entries()) {
        personCount++;
        
        // Skip if person has fewer than 2 activities (need origin and destination)
        if (activities.length < 2) {
          continue;
        }
        
        // Get the person agent
        const person = this.personAgents.get(personId);
        if (!person) {
          console.warn(`Person agent ${personId} not found, skipping itinerary generation`);
          continue;
        }
        
        // Generate itineraries between consecutive activities
        for (let i = 0; i < activities.length - 1; i++) {
          const originActivity = activities[i];
          const destinationActivity = activities[i + 1];
          
          // Generate an itinerary between these activities
          const itinerary = this.generateItinerary(person, originActivity, destinationActivity);
          
          if (itinerary) {
            itineraries.push(itinerary);
            itineraryCount++;
          }
        }
        
        // Store itineraries in batches
        if (itineraries.length - storedItineraries >= 100 || personCount === totalPersons) {
          const batch = itineraries.slice(storedItineraries);
          if (batch.length > 0) {
            await this.storeItineraries(batch);
            storedItineraries += batch.length;
            console.log(`Stored ${batch.length} itineraries (${personCount}/${totalPersons} persons)`);
          }
        }
        
        // Log progress every 100 persons
        if (personCount % 100 === 0 || personCount === totalPersons) {
          console.log(`Generated itineraries for ${personCount}/${totalPersons} persons (${itineraryCount} total itineraries)`);
        }
      }
      
      console.log(`Generated a total of ${itineraries.length} travel itineraries`);
      return itineraries;
    } catch (error) {
      console.error('Error generating travel itineraries:', error);
      throw error;
    }
  }

  /**
   * Generate an itinerary between two activities
   * 
   * @param person - The person agent
   * @param originActivity - The origin activity
   * @param destinationActivity - The destination activity
   * @returns The generated travel itinerary or null if not possible
   */
  private generateItinerary(
    person: PersonAgent,
    originActivity: Activity,
    destinationActivity: Activity
  ): TravelItinerary | null {
    // Skip if origin and destination are at the same location
    const originCoords = this.getActivityCoordinates(originActivity);
    const destinationCoords = this.getActivityCoordinates(destinationActivity);
    
    if (!originCoords || !destinationCoords) {
      console.warn(`Missing coordinates for activities ${originActivity.id} or ${destinationActivity.id}`);
      return null;
    }
    
    if (this.isSameCoordinates(originCoords, destinationCoords)) {
      // Same location, no travel needed
      return null;
    }
    
    // Calculate distance between activities
    const distance = this.calculateDistance(originCoords, destinationCoords);
    
    // Determine available travel modes for this person and distance
    const availableModes = this.getAvailableModes(person, distance);
    
    if (availableModes.length === 0) {
      console.warn(`No available travel modes for person ${person.id} between activities`);
      return null;
    }
    
    // Choose a travel mode
    const mode = this.chooseTravelMode(person, distance, availableModes);
    
    // Calculate travel time based on mode and distance
    const travelTimeMinutes = this.calculateTravelTime(distance, mode);
    
    // Calculate travel cost based on mode and distance
    const cost = this.calculateTravelCost(distance, mode);
    
    // Calculate departure time
    const originEndTime = new Date(originActivity.end_time);
    const departureTime = originEndTime.toISOString();
    
    // Generate simplified path geometry
    const pathGeometry = this.generatePathGeometry(originCoords, destinationCoords);
    
    // Create the travel itinerary
    return {
      id: uuidv4(),
      simulation_run_id: this.simulationRunId,
      person_agent_id: person.id,
      origin_activity_id: originActivity.id,
      destination_activity_id: destinationActivity.id,
      departure_time: departureTime,
      mode: mode,
      travel_time: travelTimeMinutes,
      distance: Math.round(distance),
      cost: cost,
      geometry: pathGeometry,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Check if two coordinates are the same
   */
  private isSameCoordinates(coords1: [number, number], coords2: [number, number]): boolean {
    // Use small epsilon to account for floating point errors
    const epsilon = 0.00001;
    return (
      Math.abs(coords1[0] - coords2[0]) < epsilon &&
      Math.abs(coords1[1] - coords2[1]) < epsilon
    );
  }

  /**
   * Get coordinates for an activity
   */
  private getActivityCoordinates(activity: Activity): [number, number] | null {
    if (activity.properties?.coordinates) {
      return activity.properties.coordinates as [number, number];
    }
    
    // If activity has a location, find it in available locations
    if (activity.activity_location_id && activity.activity_location_id !== null) {
      // Would typically fetch from a locations database/map
      // Simplified approach for now
      return [0, 0]; // Placeholder
    }
    
    return null;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(origin: [number, number], destination: [number, number]): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (origin[1] * Math.PI) / 180; // Convert latitude to radians
    const φ2 = (destination[1] * Math.PI) / 180;
    const Δφ = ((destination[1] - origin[1]) * Math.PI) / 180;
    const Δλ = ((destination[0] - origin[0]) * Math.PI) / 180;
    
    // Haversine formula
    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in meters
    
    return distance;
  }

  /**
   * Get available travel modes for a person and distance
   */
  private getAvailableModes(person: PersonAgent, distance: number): string[] {
    if (!this.parameters.activity_based?.travel?.modes) {
      // Default modes if none specified
      return ['walk', 'bike', 'car', 'transit'];
    }
    
    const travelModes = this.parameters.activity_based.travel.modes;
    const availableModes: string[] = [];
    
    for (const mode of travelModes) {
      // Skip if distance exceeds max distance for this mode
      if (mode.max_distance && distance > mode.max_distance) {
        continue;
      }
      
      // Apply demographic constraints
      if (mode.constraints) {
        // Age constraints
        if (
          (mode.constraints.min_age && person.age < mode.constraints.min_age) ||
          (mode.constraints.max_age && person.age > mode.constraints.max_age)
        ) {
          continue;
        }
        
        // Income constraints
        if (
          mode.constraints.income_levels &&
          person.income_level &&
          !mode.constraints.income_levels.includes(person.income_level)
        ) {
          continue;
        }
      }
      
      // Check person's mobility capabilities
      if (mode.id === 'car' && person.properties?.has_vehicle !== true) {
        continue;
      }
      
      if (mode.id === 'transit' && person.properties?.has_transit_pass !== true) {
        continue;
      }
      
      if (mode.id === 'bike' && person.properties?.has_bicycle !== true) {
        continue;
      }
      
      // Add this mode to available options
      availableModes.push(mode.id);
    }
    
    // If no modes available, default to 'walk'
    if (availableModes.length === 0) {
      return ['walk'];
    }
    
    return availableModes;
  }

  /**
   * Choose a travel mode based on distance bands and person characteristics
   */
  private chooseTravelMode(person: PersonAgent, distance: number, availableModes: string[]): string {
    if (availableModes.length === 1) {
      return availableModes[0];
    }
    
    // Get mode choice parameters
    const modeChoice = this.parameters.activity_based?.travel?.mode_choice;
    
    if (modeChoice?.distance_bands) {
      // Find appropriate distance band
      const distanceBand = modeChoice.distance_bands
        .filter(band => distance <= band.max_distance)
        .sort((a, b) => a.max_distance - b.max_distance)[0];
      
      if (distanceBand && distanceBand.mode_probabilities) {
        // Filter probabilities to only include available modes
        const filteredProbs = distanceBand.mode_probabilities.filter(
          mp => availableModes.includes(mp.mode)
        );
        
        if (filteredProbs.length > 0) {
          // Normalize probabilities
          const totalProb = filteredProbs.reduce((sum, mp) => sum + mp.probability, 0);
          let cumProb = 0;
          const rand = Math.random();
          
          for (const mp of filteredProbs) {
            cumProb += mp.probability / totalProb;
            if (rand <= cumProb) {
              return mp.mode;
            }
          }
        }
      }
    }
    
    // Simple fallback logic based on distance
    if (distance <= 500 && availableModes.includes('walk')) {
      return 'walk';
    } else if (distance <= 5000 && availableModes.includes('bike')) {
      return 'bike';
    } else if (availableModes.includes('transit')) {
      return 'transit';
    } else if (availableModes.includes('car')) {
      return 'car';
    }
    
    // Default to the first available mode
    return availableModes[0];
  }

  /**
   * Calculate travel time based on mode and distance
   */
  private calculateTravelTime(distance: number, mode: string): number {
    // Get mode parameters
    const modeParams = this.parameters.activity_based?.travel?.modes.find(m => m.id === mode);
    
    if (modeParams && modeParams.speed) {
      // Calculate time based on speed (m/s)
      const timeSeconds = distance / modeParams.speed;
      const timeMinutes = Math.ceil(timeSeconds / 60);
      
      // Add waiting/preparation time based on mode
      let additionalMinutes = 0;
      
      switch (mode) {
        case 'transit':
          additionalMinutes = 5 + Math.floor(Math.random() * 10); // 5-15 minutes wait
          break;
        case 'car':
          additionalMinutes = 2 + Math.floor(Math.random() * 3); // 2-5 minutes (parking, etc.)
          break;
        case 'bike':
          additionalMinutes = 1 + Math.floor(Math.random() * 2); // 1-3 minutes prep
          break;
        case 'walk':
          additionalMinutes = 0; // No additional time
          break;
      }
      
      return timeMinutes + additionalMinutes;
    }
    
    // Default speeds in m/min if not specified
    const defaultSpeeds: Record<string, number> = {
      'walk': 80, // ~5 km/h
      'bike': 250, // ~15 km/h
      'car': 500, // ~30 km/h urban average
      'transit': 400 // ~25 km/h
    };
    
    const speed = defaultSpeeds[mode] || 100;
    const timeMinutes = Math.ceil(distance / speed);
    
    return timeMinutes;
  }

  /**
   * Calculate travel cost based on mode and distance
   */
  private calculateTravelCost(distance: number, mode: string): number | null {
    if (mode === 'walk' || mode === 'bike') {
      return 0; // No cost for walking or biking
    }
    
    // Get mode parameters
    const modeParams = this.parameters.activity_based?.travel?.modes.find(m => m.id === mode);
    
    if (modeParams && modeParams.cost_per_km) {
      // Calculate cost based on distance (in km) and cost per km
      return modeParams.cost_per_km * (distance / 1000);
    }
    
    // Default costs if not specified
    if (mode === 'car') {
      return (distance / 1000) * 0.2; // $0.20 per km
    } else if (mode === 'transit') {
      return 2.5; // Flat fare
    }
    
    return 0; // Default
  }

  /**
   * Generate simplified path geometry (straight line)
   */
  private generatePathGeometry(origin: [number, number], destination: [number, number]): any {
    // Simplest case: direct line from origin to destination
    return {
      type: 'LineString',
      coordinates: [origin, destination]
    };
  }

  /**
   * Store itineraries in the database
   */
  private async storeItineraries(itineraries: TravelItinerary[]): Promise<void> {
    if (itineraries.length === 0) return;
    
    try {
      const { error } = await this.supabase
        .from('travel_itineraries')
        .insert(itineraries);
      
      if (error) {
        console.error('Error storing travel itineraries:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to store travel itineraries:', error);
      throw error;
    }
  }
} 