/**
 * Type definitions for the camp (activity-based modeling) system
 */

declare module '@/types/camp' {
  // Model parameters for activity-based modeling
  export interface ModelParameters {
    // General model configuration
    scenario_id: string;
    scenario_name?: string;
    name?: string;
    description?: string;
    
    // Activity-based modeling specific parameters
    activity_based: {
      sample_rate: number; // 0-1 proportion of population to model
      activity_count: number; // Target number of activities per person
      mode_preferences: {
        walk: number;
        bike: number;
        transit: number;
        car: number;
      };
      activities: {
        [key: string]: {
          priority: number; // Higher values = higher priority
          typical_duration: number; // in minutes
        };
      };
    };
  }

  // Person agent in activity model
  export interface PersonAgent {
    id: string;
    simulation_run_id: string;
    household_id?: string;
    age?: number;
    gender?: string;
    employment_status?: string;
    student_status?: string;
    license?: boolean;
    household_vehicles?: number;
    income_level?: string;
    home_location_id?: string;
    work_location_id?: string;
    school_location_id?: string;
    properties: Record<string, any>;
    created_at: string;
  }

  // Activity location
  export interface ActivityLocation {
    id: string;
    scenario_id: string;
    location_type: string;
    name: string;
    latitude: number;
    longitude: number;
    properties: Record<string, any>;
    created_at: string;
  }

  // Activity 
  export interface Activity {
    id: string;
    simulation_run_id: string;
    person_agent_id: string;
    activity_type: string;
    activity_location_id: string | null;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    properties: Record<string, any>;
    created_at: string;
  }

  // Travel itinerary between activities
  export interface TravelItinerary {
    id: string;
    simulation_run_id: string;
    person_agent_id: string;
    origin_activity_id: string;
    destination_activity_id: string;
    departure_time: string;
    arrival_time: string;
    mode: string;
    distance_meters: number;
    duration_minutes: number;
    properties: Record<string, any>;
    created_at: string;
  }

  // Activity simulation run
  export interface ActivitySimulationRun {
    id: string;
    scenario_id: string;
    scenario_name?: string;
    name: string;
    description?: string;
    model_parameters: ModelParameters;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    error_message?: string;
    person_count: number;
    activity_count: number;
    trip_count: number; 
    results_id?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    created_by?: string;
  }

  // Activity simulation results
  export interface ActivitySimulationResults {
    id: string;
    simulation_run_id: string;
    // Summary statistics
    activity_counts: {
      [key: string]: number; // activity_type -> count
    };
    mode_split: {
      [key: string]: number; // mode -> proportion (0-1)
    };
    trips_by_purpose: {
      [key: string]: number; // activity_type -> proportion (0-1)
    };
    trips_by_time: {
      [key: string]: number; // hour -> proportion (0-1)
    };
    trip_distance_distribution: {
      [key: string]: number; // distance_bin -> proportion (0-1)
    };
    person_activity_counts: {
      [key: string]: number; // number of activities -> count of persons
    };
    // Additional properties
    properties: Record<string, any>;
    created_at: string;
  }
}

export interface SimulationResultsSummary {
  total_persons: number;
  total_activities: number;
  total_trips: number;
  peak_hour: {
    hour: number;
    count: number;
  };
}

export interface ModeSplitItem {
  mode: string;
  count: number;
  percentage: number;
}

export interface TripsByPurposeItem {
  purpose: string;
  count: number;
  percentage: number;
}

export interface TemporalDistributionItem {
  hour: number;
  count: number;
  percentage: number;
} 