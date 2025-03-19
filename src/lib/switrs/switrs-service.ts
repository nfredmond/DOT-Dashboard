import { supabase } from '../supabase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

/**
 * Interface definitions for SWITRS (Statewide Integrated Traffic Records System) data
 */

export interface SWITRSCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
}

export interface SWITRSCollision {
  caseId: string;
  jurisId: number;
  officerId: string;
  reportDistrictId: string;
  officerOrgId: string;
  collisionDate: string;
  collisionTime: string;
  collisionTimeHour: number;
  processDate: string;
  pcfViolation: string;
  location: string;
  weatherCond: string;
  roadSurfaceCond: string;
  roadwayCondition: string;
  lightingCondition: string;
  partyCount: number;
  injuryCount: number;
  fatalityCount: number;
  latitude?: number;
  longitude?: number;
  primaryRoad?: string;
  secondaryRoad?: string;
  countyCode?: string;
  cityCode?: string;
  countyName?: string;
  cityName?: string;
  severityDescription?: string;
  collisionSeverityId?: number;
  hitRunStatus?: string;
  alcoholInvolved?: boolean;
  drugInvolved?: boolean;
  pedestrianInvolved?: boolean;
  bicyclistInvolved?: boolean;
  motorcycleInvolved?: boolean;
  truckInvolved?: boolean;
  collisionType?: string;
}

export interface SWITRSParty {
  caseId: string;
  partyNumber: number;
  partyType: string;
  atFault?: boolean;
  age?: number;
  sex?: string;
  sobrietyType?: string;
  sobrietyTest?: string;
  sobrietyTestResult?: string;
  moveViolation?: string;
  cellPhoneInUse?: boolean;
  otherAssociatedFactors?: string;
  vehicleMake?: string;
  vehicleYear?: number;
  vehicleType?: string;
  direction?: string;
  safetyEquipment?: string;
  ejection?: string;
  injury?: string;
  injurySeverity?: string;
  financialResponsibility?: string;
  schoolBusRelated?: boolean;
}

export interface SWITRSVictim {
  caseId: string;
  victimNumber: number;
  partyNumber: number;
  victimAge?: number;
  victimSex?: string;
  victimRole?: string;
  injurySeverity?: string;
  ejected?: string;
  safetyEquipment?: string;
  seatingPosition?: string;
  transportation?: string;
}

export interface SWITRSQueryParameters {
  startDate?: string;
  endDate?: string;
  county?: string | string[];
  city?: string | string[];
  severity?: number | number[];
  limit?: number;
  offset?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  radius?: number;
  centerLat?: number;
  centerLng?: number;
  pcfViolation?: string;
  involvedWith?: ('pedestrian' | 'bicycle' | 'motorcycle' | 'truck')[];
  roadCondition?: string;
  lightCondition?: string;
  weatherCondition?: string;
  timeOfDay?: [number, number]; // [start hour, end hour]
  includeParties?: boolean;
  includeVictims?: boolean;
}

export interface SWITRSQueryResult {
  collisions: SWITRSCollision[];
  parties: SWITRSParty[];
  victims: SWITRSVictim[];
  metadata: {
    totalCount: number;
    limit: number;
    offset: number;
    query: SWITRSQueryParameters;
  };
}

export interface SWITRSHotspot {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  radius: number; // meters
  collisionCount: number;
  fatalityCount: number;
  injuryCount: number;
  pedestrianCount: number;
  bicyclistCount: number;
  motorcycleCount: number;
  mostCommonViolation?: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * SWITRS (California Statewide Integrated Traffic Records System) Service
 * Provides access to California crash data through the TIMS API
 */
class SWITRSService {
  private baseUrl: string = 'https://tims.berkeley.edu/api/switrs/';
  private credentials: SWITRSCredentials | null = null;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Set the API credentials for SWITRS/TIMS access
   */
  setCredentials(credentials: SWITRSCredentials): void {
    this.credentials = credentials;
    // Reset token when credentials change
    this.authToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get an auth token for the TIMS API
   */
  private async getAuthToken(): Promise<string> {
    try {
      // Return existing token if it's still valid
      if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.authToken;
      }

      // If no credentials are set, throw an error
      if (!this.credentials) {
        throw new Error('SWITRS credentials not set');
      }

      // If we have an API key, use that directly
      if (this.credentials.apiKey) {
        this.authToken = this.credentials.apiKey;
        // Set expiry to 1 day from now (this is just a safeguard, API keys don't expire)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 1);
        this.tokenExpiry = expiry;
        return this.authToken;
      }

      // Otherwise, if we have username/password, request a token
      if (this.credentials.username && this.credentials.password) {
        const response = await axios.post(`${this.baseUrl}auth/token`, {
          username: this.credentials.username,
          password: this.credentials.password
        });

        if (response.data && response.data.token) {
          this.authToken = response.data.token;
          
          // Set token expiry (usually 24 hours from TIMS API)
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 24);
          this.tokenExpiry = expiry;
          
          return this.authToken;
        } else {
          throw new Error('Failed to get auth token from TIMS API');
        }
      }

      throw new Error('Invalid SWITRS credentials');
    } catch (error) {
      logger.error('Error getting SWITRS auth token:', error);
      throw new Error(`Failed to authenticate with SWITRS: ${error.message}`);
    }
  }

  /**
   * Query SWITRS data from the TIMS API
   */
  async queryCollisions(params: SWITRSQueryParameters): Promise<SWITRSQueryResult> {
    try {
      const token = await this.getAuthToken();
      
      // Build query parameters
      const queryParams: Record<string, any> = {};
      
      // Add date range
      if (params.startDate) queryParams.start_date = params.startDate;
      if (params.endDate) queryParams.end_date = params.endDate;
      
      // Add location filters
      if (params.county) {
        queryParams.county = Array.isArray(params.county) 
          ? params.county.join(',') 
          : params.county;
      }
      
      if (params.city) {
        queryParams.city = Array.isArray(params.city) 
          ? params.city.join(',') 
          : params.city;
      }
      
      // Add bounding box
      if (params.minLat && params.maxLat && params.minLng && params.maxLng) {
        queryParams.min_lat = params.minLat;
        queryParams.max_lat = params.maxLat;
        queryParams.min_lng = params.minLng;
        queryParams.max_lng = params.maxLng;
      }
      
      // Add radius search
      if (params.centerLat && params.centerLng && params.radius) {
        queryParams.lat = params.centerLat;
        queryParams.lng = params.centerLng;
        queryParams.radius = params.radius;
      }
      
      // Add collision severity
      if (params.severity) {
        queryParams.severity = Array.isArray(params.severity) 
          ? params.severity.join(',') 
          : params.severity;
      }
      
      // Add pagination
      if (params.limit) queryParams.limit = params.limit;
      if (params.offset) queryParams.offset = params.offset;
      
      // Add other filters
      if (params.pcfViolation) queryParams.pcf_violation = params.pcfViolation;
      if (params.roadCondition) queryParams.road_condition = params.roadCondition;
      if (params.lightCondition) queryParams.light_condition = params.lightCondition;
      if (params.weatherCondition) queryParams.weather_condition = params.weatherCondition;
      
      // Add involved party filters
      if (params.involvedWith && params.involvedWith.length > 0) {
        queryParams.involved_with = params.involvedWith.join(',');
      }
      
      // Add time of day filter
      if (params.timeOfDay && params.timeOfDay.length === 2) {
        queryParams.time_start = params.timeOfDay[0];
        queryParams.time_end = params.timeOfDay[1];
      }
      
      // Whether to include parties and victims
      queryParams.include_parties = params.includeParties ? '1' : '0';
      queryParams.include_victims = params.includeVictims ? '1' : '0';
      
      // Make API request
      const response = await axios.get(`${this.baseUrl}collisions`, {
        params: queryParams,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Process response
      const result: SWITRSQueryResult = {
        collisions: response.data.collisions || [],
        parties: response.data.parties || [],
        victims: response.data.victims || [],
        metadata: {
          totalCount: response.data.total_count || 0,
          limit: params.limit || 100,
          offset: params.offset || 0,
          query: params
        }
      };
      
      return result;
    } catch (error) {
      logger.error('Error querying SWITRS collisions:', error);
      throw new Error(`Failed to query SWITRS data: ${error.message}`);
    }
  }

  /**
   * Get collision details for a specific case ID
   */
  async getCollisionDetails(caseId: string): Promise<{
    collision: SWITRSCollision;
    parties: SWITRSParty[];
    victims: SWITRSVictim[];
  }> {
    try {
      const token = await this.getAuthToken();
      
      const response = await axios.get(`${this.baseUrl}collisions/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        collision: response.data.collision || null,
        parties: response.data.parties || [],
        victims: response.data.victims || []
      };
    } catch (error) {
      logger.error(`Error fetching SWITRS collision ${caseId}:`, error);
      throw new Error(`Failed to fetch collision details: ${error.message}`);
    }
  }

  /**
   * Save SWITRS data to the database for a specific organization
   */
  async saveCollisionsToDatabase(
    organizationId: string,
    collisions: SWITRSCollision[],
    parties: SWITRSParty[] = [],
    victims: SWITRSVictim[] = []
  ): Promise<number> {
    try {
      // Skip if no collisions
      if (!collisions || collisions.length === 0) {
        return 0;
      }
      
      // Map collisions to database format
      const collisionRecords = collisions.map(collision => ({
        organization_id: organizationId,
        case_id: collision.caseId,
        collision_date: collision.collisionDate,
        collision_time: collision.collisionTime,
        latitude: collision.latitude,
        longitude: collision.longitude,
        location: collision.location,
        primary_road: collision.primaryRoad,
        secondary_road: collision.secondaryRoad,
        county_code: collision.countyCode,
        city_code: collision.cityCode,
        county_name: collision.countyName,
        city_name: collision.cityName,
        weather_condition: collision.weatherCond,
        road_surface: collision.roadSurfaceCond,
        road_condition: collision.roadwayCondition,
        lighting_condition: collision.lightingCondition,
        pcf_violation: collision.pcfViolation,
        collision_severity_id: collision.collisionSeverityId,
        severity_description: collision.severityDescription,
        party_count: collision.partyCount,
        injury_count: collision.injuryCount,
        fatality_count: collision.fatalityCount,
        pedestrian_involved: collision.pedestrianInvolved,
        bicycle_involved: collision.bicyclistInvolved,
        motorcycle_involved: collision.motorcycleInvolved,
        truck_involved: collision.truckInvolved,
        alcohol_involved: collision.alcoholInvolved,
        drug_involved: collision.drugInvolved,
        collision_type: collision.collisionType,
        hit_run_status: collision.hitRunStatus,
        process_date: collision.processDate,
        geom: collision.latitude && collision.longitude 
          ? `POINT(${collision.longitude} ${collision.latitude})` 
          : null
      }));
      
      // Insert collisions in batches (to avoid query size limits)
      const batchSize = 100;
      for (let i = 0; i < collisionRecords.length; i += batchSize) {
        const batch = collisionRecords.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('switrs_collisions')
          .upsert(batch, {
            onConflict: 'case_id',
            ignoreDuplicates: false // Update existing records
          });
        
        if (error) throw new Error(`Error inserting collisions: ${error.message}`);
      }
      
      // Insert parties if provided
      if (parties && parties.length > 0) {
        const partyRecords = parties.map(party => ({
          organization_id: organizationId,
          case_id: party.caseId,
          party_number: party.partyNumber,
          party_type: party.partyType,
          at_fault: party.atFault,
          age: party.age,
          sex: party.sex,
          sobriety_type: party.sobrietyType,
          sobriety_test: party.sobrietyTest,
          sobriety_test_result: party.sobrietyTestResult,
          move_violation: party.moveViolation,
          cell_phone_in_use: party.cellPhoneInUse,
          other_associated_factors: party.otherAssociatedFactors,
          vehicle_make: party.vehicleMake,
          vehicle_year: party.vehicleYear,
          vehicle_type: party.vehicleType,
          direction: party.direction,
          safety_equipment: party.safetyEquipment,
          ejection: party.ejection,
          injury: party.injury,
          injury_severity: party.injurySeverity,
          financial_responsibility: party.financialResponsibility,
          school_bus_related: party.schoolBusRelated
        }));
        
        // Insert parties in batches
        for (let i = 0; i < partyRecords.length; i += batchSize) {
          const batch = partyRecords.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from('switrs_parties')
            .upsert(batch, {
              onConflict: 'case_id,party_number',
              ignoreDuplicates: false
            });
          
          if (error) throw new Error(`Error inserting parties: ${error.message}`);
        }
      }
      
      // Insert victims if provided
      if (victims && victims.length > 0) {
        const victimRecords = victims.map(victim => ({
          organization_id: organizationId,
          case_id: victim.caseId,
          victim_number: victim.victimNumber,
          party_number: victim.partyNumber,
          victim_age: victim.victimAge,
          victim_sex: victim.victimSex,
          victim_role: victim.victimRole,
          injury_severity: victim.injurySeverity,
          ejected: victim.ejected,
          safety_equipment: victim.safetyEquipment,
          seating_position: victim.seatingPosition,
          transportation: victim.transportation
        }));
        
        // Insert victims in batches
        for (let i = 0; i < victimRecords.length; i += batchSize) {
          const batch = victimRecords.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from('switrs_victims')
            .upsert(batch, {
              onConflict: 'case_id,victim_number',
              ignoreDuplicates: false
            });
          
          if (error) throw new Error(`Error inserting victims: ${error.message}`);
        }
      }
      
      return collisions.length;
    } catch (error) {
      logger.error('Error saving SWITRS data to database:', error);
      throw new Error(`Failed to save SWITRS data: ${error.message}`);
    }
  }

  /**
   * Identify and save collision hotspots for an organization
   */
  async identifyHotspots(
    organizationId: string,
    params: {
      startDate: string;
      endDate: string;
      searchArea: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
      };
      gridSize: number; // meters
      minCollisionCount: number;
      name?: string;
      createdBy: string;
    }
  ): Promise<SWITRSHotspot[]> {
    try {
      // Get all collisions in the area for the time period
      const collisions = await this.queryCollisions({
        startDate: params.startDate,
        endDate: params.endDate,
        minLat: params.searchArea.minLat,
        maxLat: params.searchArea.maxLat,
        minLng: params.searchArea.minLng,
        maxLng: params.searchArea.maxLng,
        limit: 10000 // large limit to get most collisions
      });
      
      // Save collisions to database for future reference
      await this.saveCollisionsToDatabase(
        organizationId, 
        collisions.collisions,
        collisions.parties,
        collisions.victims
      );
      
      // Use database spatial functions to identify hotspots
      const { data: hotspots, error } = await supabase.rpc('identify_collision_hotspots', {
        p_organization_id: organizationId,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_min_lat: params.searchArea.minLat,
        p_max_lat: params.searchArea.maxLat,
        p_min_lng: params.searchArea.minLng,
        p_max_lng: params.searchArea.maxLng,
        p_grid_size: params.gridSize,
        p_min_collisions: params.minCollisionCount
      });
      
      if (error) throw new Error(`Error identifying hotspots: ${error.message}`);
      
      // Save each hotspot to the database
      const savedHotspots: SWITRSHotspot[] = [];
      
      for (const spot of hotspots) {
        const hotspotId = uuidv4();
        const hotspotName = params.name ? 
          `${params.name} #${savedHotspots.length + 1}` : 
          `Collision Hotspot #${savedHotspots.length + 1}`;
        
        const { data, error } = await supabase
          .from('switrs_hotspots')
          .insert({
            id: hotspotId,
            organization_id: organizationId,
            name: hotspotName,
            description: `Identified hotspot with ${spot.collision_count} collisions from ${params.startDate} to ${params.endDate}`,
            center_lat: spot.lat,
            center_lng: spot.lng,
            radius: spot.radius || params.gridSize / 2,
            collision_count: spot.collision_count,
            fatality_count: spot.fatality_count,
            injury_count: spot.injury_count,
            pedestrian_count: spot.pedestrian_count,
            bicyclist_count: spot.bicyclist_count,
            motorcycle_count: spot.motorcycle_count,
            most_common_violation: spot.most_common_violation,
            start_date: params.startDate,
            end_date: params.endDate,
            created_by: params.createdBy,
            geom: `POINT(${spot.lng} ${spot.lat})`
          })
          .select()
          .single();
        
        if (error) {
          logger.error(`Error saving hotspot: ${error.message}`);
          continue;
        }
        
        savedHotspots.push({
          id: data.id,
          organizationId: data.organization_id,
          name: data.name,
          description: data.description,
          centerLat: data.center_lat,
          centerLng: data.center_lng,
          radius: data.radius,
          collisionCount: data.collision_count,
          fatalityCount: data.fatality_count,
          injuryCount: data.injury_count,
          pedestrianCount: data.pedestrian_count,
          bicyclistCount: data.bicyclist_count,
          motorcycleCount: data.motorcycle_count,
          mostCommonViolation: data.most_common_violation,
          startDate: data.start_date,
          endDate: data.end_date,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          createdBy: data.created_by
        });
      }
      
      return savedHotspots;
    } catch (error) {
      logger.error('Error identifying collision hotspots:', error);
      throw new Error(`Failed to identify hotspots: ${error.message}`);
    }
  }

  /**
   * Get saved hotspots for an organization
   */
  async getHotspots(organizationId: string): Promise<SWITRSHotspot[]> {
    try {
      const { data, error } = await supabase
        .from('switrs_hotspots')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(`Error fetching hotspots: ${error.message}`);
      
      return data.map(spot => ({
        id: spot.id,
        organizationId: spot.organization_id,
        name: spot.name,
        description: spot.description,
        centerLat: spot.center_lat,
        centerLng: spot.center_lng,
        radius: spot.radius,
        collisionCount: spot.collision_count,
        fatalityCount: spot.fatality_count,
        injuryCount: spot.injury_count,
        pedestrianCount: spot.pedestrian_count,
        bicyclistCount: spot.bicyclist_count,
        motorcycleCount: spot.motorcycle_count,
        mostCommonViolation: spot.most_common_violation,
        startDate: spot.start_date,
        endDate: spot.end_date,
        createdAt: new Date(spot.created_at),
        updatedAt: new Date(spot.updated_at),
        createdBy: spot.created_by
      }));
    } catch (error) {
      logger.error('Error getting SWITRS hotspots:', error);
      throw new Error(`Failed to get hotspots: ${error.message}`);
    }
  }

  /**
   * Get the GeoJSON representation of hotspots for an organization
   */
  async getHotspotsAsGeoJSON(organizationId: string): Promise<GeoJSON.FeatureCollection> {
    try {
      const { data, error } = await supabase.rpc('get_switrs_hotspots_geojson', {
        p_organization_id: organizationId
      });
      
      if (error) throw new Error(`Error fetching hotspots GeoJSON: ${error.message}`);
      
      return data;
    } catch (error) {
      logger.error('Error getting SWITRS hotspots as GeoJSON:', error);
      throw new Error(`Failed to get hotspots as GeoJSON: ${error.message}`);
    }
  }

  /**
   * Get collisions in a specific area as GeoJSON
   */
  async getCollisionsAsGeoJSON(
    organizationId: string,
    params: {
      startDate?: string;
      endDate?: string;
      minLat?: number;
      maxLat?: number;
      minLng?: number;
      maxLng?: number;
      centerLat?: number;
      centerLng?: number;
      radius?: number;
    }
  ): Promise<GeoJSON.FeatureCollection> {
    try {
      const { data, error } = await supabase.rpc('get_switrs_collisions_geojson', {
        p_organization_id: organizationId,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_min_lat: params.minLat,
        p_max_lat: params.maxLat,
        p_min_lng: params.minLng,
        p_max_lng: params.maxLng,
        p_center_lat: params.centerLat,
        p_center_lng: params.centerLng,
        p_radius: params.radius
      });
      
      if (error) throw new Error(`Error fetching collisions GeoJSON: ${error.message}`);
      
      return data;
    } catch (error) {
      logger.error('Error getting SWITRS collisions as GeoJSON:', error);
      throw new Error(`Failed to get collisions as GeoJSON: ${error.message}`);
    }
  }

  /**
   * Get collision statistics for an organization
   */
  async getCollisionStatistics(
    organizationId: string,
    params: {
      startDate?: string;
      endDate?: string;
      minLat?: number;
      maxLat?: number;
      minLng?: number;
      maxLng?: number;
    }
  ): Promise<{
    totalCollisions: number;
    collisionsBySeverity: { severity: string; count: number }[];
    collisionsByYear: { year: string; count: number }[];
    collisionsByType: { type: string; count: number }[];
    topPrimaryCollisionFactors: { factor: string; count: number }[];
    involvedParties: {
      pedestrians: number;
      bicyclists: number;
      motorcyclists: number;
      trucks: number;
    };
  }> {
    try {
      const { data, error } = await supabase.rpc('get_switrs_collision_statistics', {
        p_organization_id: organizationId,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_min_lat: params.minLat,
        p_max_lat: params.maxLat,
        p_min_lng: params.minLng,
        p_max_lng: params.maxLng
      });
      
      if (error) throw new Error(`Error fetching collision statistics: ${error.message}`);
      
      return data;
    } catch (error) {
      logger.error('Error getting SWITRS collision statistics:', error);
      throw new Error(`Failed to get collision statistics: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const switrsService = new SWITRSService(); 