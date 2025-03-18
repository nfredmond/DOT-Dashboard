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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 