export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_locations: {
        Row: {
          created_at: string
          geometry: Json
          id: string
          location_type: string
          name: string | null
          properties: Json | null
          scenario_id: string
        }
        Insert: {
          created_at?: string
          geometry: Json
          id?: string
          location_type: string
          name?: string | null
          properties?: Json | null
          scenario_id: string
        }
        Update: {
          created_at?: string
          geometry?: Json
          id?: string
          location_type?: string
          name?: string | null
          properties?: Json | null
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_locations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_simulation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          error_message: string | null
          id: string
          name: string
          parameters: Json
          results: Json | null
          scenario_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          name: string
          parameters: Json
          results?: Json | null
          scenario_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          name?: string
          parameters?: Json
          results?: Json | null
          scenario_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_simulation_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          properties: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          properties?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          properties?: Json | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_location_id: string | null
          activity_type: string
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          person_agent_id: string
          properties: Json | null
          simulation_run_id: string
          start_time: string
        }
        Insert: {
          activity_location_id?: string | null
          activity_type: string
          created_at?: string
          duration_minutes: number
          end_time: string
          id?: string
          person_agent_id: string
          properties?: Json | null
          simulation_run_id: string
          start_time: string
        }
        Update: {
          activity_location_id?: string | null
          activity_type?: string
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          person_agent_id?: string
          properties?: Json | null
          simulation_run_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_activity_location_id_fkey"
            columns: ["activity_location_id"]
            isOneToOne: false
            referencedRelation: "activity_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_activity_type_fkey"
            columns: ["activity_type"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_person_agent_id_fkey"
            columns: ["person_agent_id"]
            isOneToOne: false
            referencedRelation: "person_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "activity_simulation_runs"
            referencedColumns: ["id"]
          }
        ]
      }
      person_agents: {
        Row: {
          age: number
          created_at: string
          gender: string
          household_id: string
          id: string
          income_level: string | null
          occupation: string | null
          properties: Json | null
          simulation_run_id: string
        }
        Insert: {
          age: number
          created_at?: string
          gender: string
          household_id: string
          id?: string
          income_level?: string | null
          occupation?: string | null
          properties?: Json | null
          simulation_run_id: string
        }
        Update: {
          age?: number
          created_at?: string
          gender?: string
          household_id?: string
          id?: string
          income_level?: string | null
          occupation?: string | null
          properties?: Json | null
          simulation_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_agents_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "activity_simulation_runs"
            referencedColumns: ["id"]
          }
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          network_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          network_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          network_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      travel_itineraries: {
        Row: {
          cost: number | null
          created_at: string
          departure_time: string
          destination_activity_id: string
          distance: number | null
          geometry: Json | null
          id: string
          mode: string
          origin_activity_id: string
          person_agent_id: string
          simulation_run_id: string
          travel_time: number
        }
        Insert: {
          cost?: number | null
          created_at?: string
          departure_time: string
          destination_activity_id: string
          distance?: number | null
          geometry?: Json | null
          id?: string
          mode: string
          origin_activity_id: string
          person_agent_id: string
          simulation_run_id: string
          travel_time: number
        }
        Update: {
          cost?: number | null
          created_at?: string
          departure_time?: string
          destination_activity_id?: string
          distance?: number | null
          geometry?: Json | null
          id?: string
          mode?: string
          origin_activity_id?: string
          person_agent_id?: string
          simulation_run_id?: string
          travel_time?: number
        }
        Relationships: [
          {
            foreignKeyName: "travel_itineraries_destination_activity_id_fkey"
            columns: ["destination_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_itineraries_origin_activity_id_fkey"
            columns: ["origin_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_itineraries_person_agent_id_fkey"
            columns: ["person_agent_id"]
            isOneToOne: false
            referencedRelation: "person_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_itineraries_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "activity_simulation_runs"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          name: string | null
        }
        Insert: {
          email: string
          id: string
          name?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      switrs_collisions: {
        Row: {
          id: string
          organization_id: string
          case_id: string
          collision_date: string
          collision_time: string
          latitude: number | null
          longitude: number | null
          location: string
          primary_road: string | null
          secondary_road: string | null
          county_code: string | null
          city_code: string | null
          county_name: string | null
          city_name: string | null
          weather_condition: string | null
          road_surface: string | null
          road_condition: string | null
          lighting_condition: string | null
          pcf_violation: string | null
          collision_severity_id: number | null
          severity_description: string | null
          party_count: number | null
          injury_count: number | null
          fatality_count: number | null
          pedestrian_involved: boolean | null
          bicycle_involved: boolean | null
          motorcycle_involved: boolean | null
          truck_involved: boolean | null
          alcohol_involved: boolean | null
          drug_involved: boolean | null
          collision_type: string | null
          hit_run_status: string | null
          process_date: string | null
          geom: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          case_id: string
          collision_date: string
          collision_time: string
          latitude?: number | null
          longitude?: number | null
          location: string
          primary_road?: string | null
          secondary_road?: string | null
          county_code?: string | null
          city_code?: string | null
          county_name?: string | null
          city_name?: string | null
          weather_condition?: string | null
          road_surface?: string | null
          road_condition?: string | null
          lighting_condition?: string | null
          pcf_violation?: string | null
          collision_severity_id?: number | null
          severity_description?: string | null
          party_count?: number | null
          injury_count?: number | null
          fatality_count?: number | null
          pedestrian_involved?: boolean | null
          bicycle_involved?: boolean | null
          motorcycle_involved?: boolean | null
          truck_involved?: boolean | null
          alcohol_involved?: boolean | null
          drug_involved?: boolean | null
          collision_type?: string | null
          hit_run_status?: string | null
          process_date?: string | null
          geom?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          case_id?: string
          collision_date?: string
          collision_time?: string
          latitude?: number | null
          longitude?: number | null
          location?: string
          primary_road?: string | null
          secondary_road?: string | null
          county_code?: string | null
          city_code?: string | null
          county_name?: string | null
          city_name?: string | null
          weather_condition?: string | null
          road_surface?: string | null
          road_condition?: string | null
          lighting_condition?: string | null
          pcf_violation?: string | null
          collision_severity_id?: number | null
          severity_description?: string | null
          party_count?: number | null
          injury_count?: number | null
          fatality_count?: number | null
          pedestrian_involved?: boolean | null
          bicycle_involved?: boolean | null
          motorcycle_involved?: boolean | null
          truck_involved?: boolean | null
          alcohol_involved?: boolean | null
          drug_involved?: boolean | null
          collision_type?: string | null
          hit_run_status?: string | null
          process_date?: string | null
          geom?: string | null
          created_at?: string
        }
        Relationships: []
      }
      switrs_parties: {
        Row: {
          id: string
          organization_id: string
          case_id: string
          party_number: number
          party_type: string
          at_fault: boolean | null
          age: number | null
          sex: string | null
          sobriety_type: string | null
          sobriety_test: string | null
          sobriety_test_result: string | null
          move_violation: string | null
          cell_phone_in_use: boolean | null
          other_associated_factors: string | null
          vehicle_make: string | null
          vehicle_year: number | null
          vehicle_type: string | null
          direction: string | null
          safety_equipment: string | null
          ejection: string | null
          injury: string | null
          injury_severity: string | null
          financial_responsibility: string | null
          school_bus_related: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          case_id: string
          party_number: number
          party_type: string
          at_fault?: boolean | null
          age?: number | null
          sex?: string | null
          sobriety_type?: string | null
          sobriety_test?: string | null
          sobriety_test_result?: string | null
          move_violation?: string | null
          cell_phone_in_use?: boolean | null
          other_associated_factors?: string | null
          vehicle_make?: string | null
          vehicle_year?: number | null
          vehicle_type?: string | null
          direction?: string | null
          safety_equipment?: string | null
          ejection?: string | null
          injury?: string | null
          injury_severity?: string | null
          financial_responsibility?: string | null
          school_bus_related?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          case_id?: string
          party_number?: number
          party_type?: string
          at_fault?: boolean | null
          age?: number | null
          sex?: string | null
          sobriety_type?: string | null
          sobriety_test?: string | null
          sobriety_test_result?: string | null
          move_violation?: string | null
          cell_phone_in_use?: boolean | null
          other_associated_factors?: string | null
          vehicle_make?: string | null
          vehicle_year?: number | null
          vehicle_type?: string | null
          direction?: string | null
          safety_equipment?: string | null
          ejection?: string | null
          injury?: string | null
          injury_severity?: string | null
          financial_responsibility?: string | null
          school_bus_related?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      switrs_victims: {
        Row: {
          id: string
          organization_id: string
          case_id: string
          victim_number: number
          party_number: number
          victim_age: number | null
          victim_sex: string | null
          victim_role: string | null
          injury_severity: string | null
          ejected: string | null
          safety_equipment: string | null
          seating_position: string | null
          transportation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          case_id: string
          victim_number: number
          party_number: number
          victim_age?: number | null
          victim_sex?: string | null
          victim_role?: string | null
          injury_severity?: string | null
          ejected?: string | null
          safety_equipment?: string | null
          seating_position?: string | null
          transportation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          case_id?: string
          victim_number?: number
          party_number?: number
          victim_age?: number | null
          victim_sex?: string | null
          victim_role?: string | null
          injury_severity?: string | null
          ejected?: string | null
          safety_equipment?: string | null
          seating_position?: string | null
          transportation?: string | null
          created_at?: string
        }
        Relationships: []
      }
      switrs_hotspots: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          center_lat: number
          center_lng: number
          radius: number
          collision_count: number
          fatality_count: number
          injury_count: number
          pedestrian_count: number
          bicyclist_count: number
          motorcycle_count: number
          most_common_violation: string | null
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
          created_by: string
          geom: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          center_lat: number
          center_lng: number
          radius: number
          collision_count: number
          fatality_count: number
          injury_count: number
          pedestrian_count: number
          bicyclist_count: number
          motorcycle_count: number
          most_common_violation?: string | null
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
          created_by: string
          geom?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          center_lat?: number
          center_lng?: number
          radius?: number
          collision_count?: number
          fatality_count?: number
          injury_count?: number
          pedestrian_count?: number
          bicyclist_count?: number
          motorcycle_count?: number
          most_common_violation?: string | null
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          geom?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      identify_collision_hotspots: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
          p_min_lat: number
          p_max_lat: number
          p_min_lng: number
          p_max_lng: number
          p_grid_size: number
          p_min_collisions: number
        }
        Returns: {
          lat: number
          lng: number
          radius: number
          collision_count: number
          fatality_count: number
          injury_count: number
          pedestrian_count: number
          bicyclist_count: number
          motorcycle_count: number
          most_common_violation: string
        }[]
      }
      get_switrs_hotspots_geojson: {
        Args: {
          p_organization_id: string
        }
        Returns: Json
      }
      get_switrs_collisions_geojson: {
        Args: {
          p_organization_id: string
          p_start_date?: string
          p_end_date?: string
          p_min_lat?: number
          p_max_lat?: number
          p_min_lng?: number
          p_max_lng?: number
          p_center_lat?: number
          p_center_lng?: number
          p_radius?: number
        }
        Returns: Json
      }
      get_switrs_collision_statistics: {
        Args: {
          p_organization_id: string
          p_start_date?: string
          p_end_date?: string
          p_min_lat?: number
          p_max_lat?: number
          p_min_lng?: number
          p_max_lng?: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 