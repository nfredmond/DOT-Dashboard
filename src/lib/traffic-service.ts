/**
 * Traffic Service - Handles interactions with SWITRS API for collision data
 */

import { getEnvVariable } from './env-service';

/**
 * Collision Severity Enum
 * 1 = Fatal
 * 2 = Injury (Severe, Visible, Complaint of Pain)
 * 3 = Property Damage Only (PDO)
 */
export enum CollisionSeverity {
  Fatal = 1,
  Injury = 2,
  PropertyDamage = 3
}

/**
 * Collision Type Enum
 */
export enum CollisionType {
  HeadOn = 'A',
  Sideswipe = 'B',
  RearEnd = 'C',
  Broadside = 'D',
  HitObject = 'E', 
  Overturned = 'F',
  Pedestrian = 'G',
  Other = 'H'
}

/**
 * Collision data interface
 */
export interface CollisionData {
  id: string;
  caseId: string;
  latitude: number;
  longitude: number;
  county: string;
  date: string;
  timeOfDay: string;
  severity: CollisionSeverity;
  collisionType: CollisionType;
  vehiclesInvolved: number;
  partiesInvolved: number;
  pedestriansInvolved: number;
  bicyclistsInvolved: number;
  location: string;
  primaryRoad: string;
  secondaryRoad?: string;
  weatherCondition: string;
  roadCondition: string;
  lightingCondition: string;
}

/**
 * Query parameters for filtering collision data
 */
export interface CollisionQueryParams {
  county?: string;
  startDate?: string;
  endDate?: string;
  severity?: CollisionSeverity[];
  collisionType?: CollisionType[];
  limit?: number;
  offset?: number;
}

/**
 * Cache for collision data
 */
const collisionCache: Record<string, {
  timestamp: number,
  data: CollisionData[]
}> = {};

/**
 * Cache expiration time (24 hours)
 */
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get SWITRS collision data 
 */
export async function getCollisionData(params: CollisionQueryParams): Promise<CollisionData[]> {
  // Generate cache key from params
  const cacheKey = getCacheKey(params);
  
  // Check cache first
  const cachedData = collisionCache[cacheKey];
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
    console.log("Using cached collision data");
    return cachedData.data;
  }
  
  // Get API key from environment
  const apiKey = getEnvVariable('SWITRS_API_KEY');
  if (!apiKey) {
    console.warn("SWITRS API key not configured");
    throw new Error("SWITRS API key not configured");
  }
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.county) queryParams.append('county', params.county);
    if (params.startDate) queryParams.append('from_date', params.startDate);
    if (params.endDate) queryParams.append('to_date', params.endDate);
    if (params.severity && params.severity.length > 0) {
      queryParams.append('severity', params.severity.join(','));
    }
    if (params.collisionType && params.collisionType.length > 0) {
      queryParams.append('collision_type', params.collisionType.join(','));
    }
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    // API base URL
    const baseUrl = 'https://switrs.api.ca.gov/collisions';
    const url = `${baseUrl}?${queryParams.toString()}`;
    
    // Fetch data
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SWITRS API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform data to match our interface
    const collisions: CollisionData[] = data.results.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      latitude: item.latitude,
      longitude: item.longitude,
      county: item.county,
      date: item.collision_date,
      timeOfDay: item.collision_time,
      severity: item.severity as CollisionSeverity,
      collisionType: item.collision_type as CollisionType,
      vehiclesInvolved: item.number_of_vehicles,
      partiesInvolved: item.parties_involved,
      pedestriansInvolved: item.pedestrians_involved || 0,
      bicyclistsInvolved: item.bicyclists_involved || 0,
      location: item.location,
      primaryRoad: item.primary_road,
      secondaryRoad: item.secondary_road,
      weatherCondition: item.weather_condition,
      roadCondition: item.road_condition,
      lightingCondition: item.lighting
    }));
    
    // Cache the results
    collisionCache[cacheKey] = {
      timestamp: Date.now(),
      data: collisions
    };
    
    return collisions;
    
  } catch (error) {
    console.error("Error fetching collision data:", error);
    
    // For development - return mock data if API fails or not configured
    if (process.env.NODE_ENV === 'development') {
      return getMockCollisionData(params);
    }
    
    throw error;
  }
}

/**
 * Get collision data formatted for heatmap
 */
export async function getCollisionHeatmapData(params: CollisionQueryParams): Promise<[number, number, number][]> {
  const collisions = await getCollisionData(params);
  
  // Format for heatmap [lat, lng, intensity]
  return collisions.map(collision => {
    // Scale intensity based on severity
    let intensity = 0.5; // Default for property damage
    
    if (collision.severity === CollisionSeverity.Fatal) {
      intensity = 1.0; // Max intensity for fatal
    } else if (collision.severity === CollisionSeverity.Injury) {
      intensity = 0.7; // Medium intensity for injuries
    }
    
    return [collision.latitude, collision.longitude, intensity];
  });
}

/**
 * Check if the SWITRS API is configured
 */
export function isSwitrsConfigured(): boolean {
  return !!getEnvVariable('SWITRS_API_KEY');
}

/**
 * Get statistics from collision data
 */
export async function getCollisionStats(params: CollisionQueryParams): Promise<{
  total: number;
  bySeverity: Record<CollisionSeverity, number>;
  byType: Record<string, number>;
  byCounty: Record<string, number>;
}> {
  const collisions = await getCollisionData(params);
  
  // Initialize stats object
  const stats = {
    total: collisions.length,
    bySeverity: {
      [CollisionSeverity.Fatal]: 0,
      [CollisionSeverity.Injury]: 0,
      [CollisionSeverity.PropertyDamage]: 0
    },
    byType: {} as Record<string, number>,
    byCounty: {} as Record<string, number>
  };
  
  // Calculate statistics
  collisions.forEach(collision => {
    // Count by severity
    stats.bySeverity[collision.severity]++;
    
    // Count by type
    if (!stats.byType[collision.collisionType]) {
      stats.byType[collision.collisionType] = 0;
    }
    stats.byType[collision.collisionType]++;
    
    // Count by county
    if (!stats.byCounty[collision.county]) {
      stats.byCounty[collision.county] = 0;
    }
    stats.byCounty[collision.county]++;
  });
  
  return stats;
}

/**
 * Create cache key from query parameters
 */
function getCacheKey(params: CollisionQueryParams): string {
  return JSON.stringify(params);
}

/**
 * Generate mock collision data for development
 */
function getMockCollisionData(params: CollisionQueryParams): CollisionData[] {
  console.log("Generating mock collision data");
  
  const mockData: CollisionData[] = [];
  const baseDate = new Date();
  
  // Filter by county if specified
  const countyFilter = params.county || 'San Francisco';
  
  // County coordinates (approximate centers)
  const countyCoordinates: Record<string, [number, number]> = {
    'San Francisco': [37.7749, -122.4194],
    'Alameda': [37.6017, -121.7195],
    'Santa Clara': [37.3541, -121.9552],
    'San Mateo': [37.4969, -122.3330],
    'Contra Costa': [37.8534, -121.9018],
    'Marin': [38.0834, -122.7633]
  };
  
  // Use coordinates for the specified county or default to SF
  const centerCoords = countyCoordinates[countyFilter] || countyCoordinates['San Francisco'];
  
  // Generate random points around the county center
  const count = params.limit || 100;
  for (let i = 0; i < count; i++) {
    // Random coordinates within ~10km of center
    const lat = centerCoords[0] + (Math.random() - 0.5) * 0.2;
    const lng = centerCoords[1] + (Math.random() - 0.5) * 0.2;
    
    // Random severity with weighted distribution
    let severity: CollisionSeverity;
    const sevRand = Math.random();
    if (sevRand < 0.1) {
      severity = CollisionSeverity.Fatal; // 10% fatal
    } else if (sevRand < 0.6) {
      severity = CollisionSeverity.Injury; // 50% injury
    } else {
      severity = CollisionSeverity.PropertyDamage; // 40% PDO
    }
    
    // Filter by severity if specified
    if (params.severity && params.severity.length > 0 && !params.severity.includes(severity)) {
      continue;
    }
    
    // Random collision type
    const collisionTypes = Object.values(CollisionType);
    const collisionType = collisionTypes[Math.floor(Math.random() * collisionTypes.length)];
    
    // Filter by collision type if specified
    if (params.collisionType && params.collisionType.length > 0 && !params.collisionType.includes(collisionType)) {
      continue;
    }
    
    // Random date within the last year
    const date = new Date(baseDate);
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const dateStr = date.toISOString().split('T')[0];
    
    // Random time
    const hour = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const minute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    const timeStr = `${hour}:${minute}`;
    
    // Create mock collision
    mockData.push({
      id: `mock-${i}`,
      caseId: `TC-${Math.floor(1000000 + Math.random() * 9000000)}`,
      latitude: lat,
      longitude: lng,
      county: countyFilter,
      date: dateStr,
      timeOfDay: timeStr,
      severity: severity,
      collisionType: collisionType,
      vehiclesInvolved: Math.floor(1 + Math.random() * 3),
      partiesInvolved: Math.floor(1 + Math.random() * 5),
      pedestriansInvolved: Math.random() < 0.2 ? Math.floor(1 + Math.random() * 2) : 0,
      bicyclistsInvolved: Math.random() < 0.15 ? Math.floor(1 + Math.random() * 2) : 0,
      location: `Mock Location ${i}`,
      primaryRoad: `Main Street ${Math.floor(Math.random() * 100)}`,
      secondaryRoad: Math.random() > 0.3 ? `Cross Street ${Math.floor(Math.random() * 50)}` : undefined,
      weatherCondition: ['Clear', 'Cloudy', 'Raining', 'Foggy'][Math.floor(Math.random() * 4)],
      roadCondition: ['Dry', 'Wet', 'Slippery', 'Under Construction'][Math.floor(Math.random() * 4)],
      lightingCondition: ['Daylight', 'Dusk', 'Dark - Street Lights', 'Dark - No Street Lights'][Math.floor(Math.random() * 4)]
    });
  }
  
  return mockData;
} 