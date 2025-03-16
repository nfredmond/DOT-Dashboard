/**
 * Safety Service
 * 
 * Provides access to traffic collision data for project area analysis
 * Used by AI analysis tools to provide safety context for project evaluations
 */

import { CollisionData, CollisionSeverity, CollisionType } from '@/types/project.d';
import { getEnvVariable } from '@/lib/env-service';

/**
 * Get collision data for a project location
 * Uses available traffic/collision APIs to retrieve safety data
 * 
 * @param location The project location (address, city, county, etc.)
 * @param radius Optional radius in miles to search around the location (default: 0.5)
 * @param years Optional number of years of historical data to retrieve (default: 5)
 * @returns Collision data for the project area
 */
export async function getProjectCollisionData(
  location: string,
  radius: number = 0.5,
  years: number = 5
): Promise<CollisionData> {
  try {
    // Extract lat/lon from location
    const coordinates = await getCoordinatesFromLocation(location);
    
    // Check if we have an API key for collision data
    const apiKey = getEnvVariable('TRAFFIC_DATA_API_KEY');
    
    if (!apiKey) {
      console.warn('Traffic data API key not found. Using sample collision data.');
      return getSampleCollisionData(location, radius, years);
    }
    
    // Construct the API URL for collision data
    // Using TIMS (Transportation Injury Mapping System) API if in California
    // or nationwide FARS (Fatality Analysis Reporting System) if elsewhere
    const baseUrl = getEnvVariable('TRAFFIC_DATA_API_URL', 'https://api.safetydata.gov/v1/collisions');
    
    // Calculate date range for the query
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);
    
    // Format dates for API
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Build API request
    const params = new URLSearchParams({
      key: apiKey,
      lat: coordinates.lat.toString(),
      lon: coordinates.lon.toString(),
      radius: (radius * 1609.34).toString(), // Convert miles to meters
      start_date: startDateStr,
      end_date: endDateStr,
      detail: 'full'
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Traffic data API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the collision data
    // This structure will depend on the actual API response format
    const collisions = data.collisions || [];
    
    // Count collisions by severity and type
    const severityCounts: Record<CollisionSeverity, number> = {
      fatal: 0,
      severe: 0,
      visible: 0,
      complaint: 0,
      pdo: 0 // Property damage only
    };
    
    const typeCounts: Record<CollisionType, number> = {
      pedestrian: 0,
      bicycle: 0,
      motorcycle: 0,
      vehicle: 0,
      fixed_object: 0,
      other: 0
    };
    
    // Count by time of day
    const timeOfDayCounts = {
      morning: 0,   // 6am - 10am
      midday: 0,    // 10am - 3pm
      evening: 0,   // 3pm - 7pm
      night: 0      // 7pm - 6am
    };
    
    // Count by weather condition
    const weatherCounts = {
      clear: 0,
      rain: 0,
      snow: 0,
      fog: 0,
      other: 0
    };
    
    // Process each collision
    collisions.forEach((collision: any) => {
      // Count by severity
      if (collision.severity === 'Fatal') {
        severityCounts.fatal++;
      } else if (collision.severity === 'Severe Injury') {
        severityCounts.severe++;
      } else if (collision.severity === 'Visible Injury') {
        severityCounts.visible++;
      } else if (collision.severity === 'Complaint of Pain') {
        severityCounts.complaint++;
      } else {
        severityCounts.pdo++;
      }
      
      // Count by collision type
      if (collision.type.includes('Pedestrian')) {
        typeCounts.pedestrian++;
      } else if (collision.type.includes('Bicycle')) {
        typeCounts.bicycle++;
      } else if (collision.type.includes('Motorcycle')) {
        typeCounts.motorcycle++;
      } else if (collision.type.includes('Object')) {
        typeCounts.fixed_object++;
      } else if (collision.type.includes('Vehicle')) {
        typeCounts.vehicle++;
      } else {
        typeCounts.other++;
      }
      
      // Count by time of day
      const hour = new Date(collision.datetime).getHours();
      if (hour >= 6 && hour < 10) {
        timeOfDayCounts.morning++;
      } else if (hour >= 10 && hour < 15) {
        timeOfDayCounts.midday++;
      } else if (hour >= 15 && hour < 19) {
        timeOfDayCounts.evening++;
      } else {
        timeOfDayCounts.night++;
      }
      
      // Count by weather
      const weather = collision.weather || 'Unknown';
      if (weather.includes('Clear')) {
        weatherCounts.clear++;
      } else if (weather.includes('Rain')) {
        weatherCounts.rain++;
      } else if (weather.includes('Snow')) {
        weatherCounts.snow++;
      } else if (weather.includes('Fog')) {
        weatherCounts.fog++;
      } else {
        weatherCounts.other++;
      }
    });
    
    const totalCollisions = collisions.length;
    
    // Calculate collision rate
    // Using a simple formula: collisions per year per mile of roadway
    // Assuming the area is roughly circular with the given radius
    const areaInSqMiles = Math.PI * radius * radius;
    const roadwayMiles = estimateRoadwayMiles(areaInSqMiles);
    const collisionsPerYearPerMile = totalCollisions / years / roadwayMiles;
    
    return {
      totalCollisions,
      collisionsPerYear: totalCollisions / years,
      collisionsPerMile: totalCollisions / roadwayMiles,
      collisionRate: collisionsPerYearPerMile,
      severityCounts,
      typeCounts,
      timeOfDayCounts,
      weatherCounts,
      hotspots: identifyHotspots(collisions),
      years,
      radius,
      location,
      source: 'Traffic Safety Data API',
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching collision data:', error);
    return getSampleCollisionData(location, radius, years);
  }
}

/**
 * Generates a human-readable summary of collision data
 * @param collisionData The collision data
 * @returns A string with a human-readable summary
 */
export function generateCollisionSummary(collisionData: CollisionData): string {
  if (!collisionData) {
    return 'No collision data available.';
  }

  const {
    totalCollisions,
    collisionsPerYear,
    radius,
    years,
    severityCounts,
    typeCounts,
    location
  } = collisionData;

  // Format numbers
  const formatNum = (num: number) => num.toFixed(1);

  const summary = `
Safety Analysis Summary for ${location} (${radius}-mile radius, ${years}-year period):

- Total Collisions: ${totalCollisions}
- Average: ${formatNum(collisionsPerYear)} collisions per year

Severity Breakdown:
- Fatal: ${severityCounts.fatal} (${formatNum(severityCounts.fatal / totalCollisions * 100)}%)
- Severe Injury: ${severityCounts.severe} (${formatNum(severityCounts.severe / totalCollisions * 100)}%)
- Visible Injury: ${severityCounts.visible} (${formatNum(severityCounts.visible / totalCollisions * 100)}%)
- Complaint of Pain: ${severityCounts.complaint} (${formatNum(severityCounts.complaint / totalCollisions * 100)}%)
- Property Damage Only: ${severityCounts.pdo} (${formatNum(severityCounts.pdo / totalCollisions * 100)}%)

Collision Types:
- Pedestrian Involved: ${typeCounts.pedestrian} (${formatNum(typeCounts.pedestrian / totalCollisions * 100)}%)
- Bicycle Involved: ${typeCounts.bicycle} (${formatNum(typeCounts.bicycle / totalCollisions * 100)}%)
- Motorcycle Involved: ${typeCounts.motorcycle} (${formatNum(typeCounts.motorcycle / totalCollisions * 100)}%)
- Vehicle-Vehicle: ${typeCounts.vehicle} (${formatNum(typeCounts.vehicle / totalCollisions * 100)}%)
- Fixed Object: ${typeCounts.fixed_object} (${formatNum(typeCounts.fixed_object / totalCollisions * 100)}%)
- Other: ${typeCounts.other} (${formatNum(typeCounts.other / totalCollisions * 100)}%)

${collisionData.hotspots.length > 0 ? `
Identified Hotspots:
${collisionData.hotspots.map(h => `- ${h.description} (${h.collisionCount} collisions)`).join('\n')}
` : ''}

Source: ${collisionData.source}
Last Updated: ${new Date(collisionData.lastUpdated).toLocaleDateString()}
  `;

  return summary.trim();
}

/**
 * Convert address to latitude/longitude coordinates
 * @param location Address or location description
 * @returns Lat/lon coordinates
 */
async function getCoordinatesFromLocation(location: string): Promise<{ lat: number; lon: number }> {
  try {
    // Check if we have a geocoding API key
    const apiKey = getEnvVariable('GEOCODING_API_KEY');
    
    if (!apiKey) {
      console.warn('Geocoding API key not found. Using approximate coordinates.');
      // Default to San Francisco city center if no geocoding available
      return { lat: 37.7749, lon: -122.4194 };
    }
    
    // Use a geocoding service
    const baseUrl = getEnvVariable('GEOCODING_API_URL', 'https://maps.googleapis.com/maps/api/geocode/json');
    
    const params = new URLSearchParams({
      address: location,
      key: apiKey
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lon: lng };
    } else {
      throw new Error('No results from geocoding API');
    }
  } catch (error) {
    console.error('Error in geocoding:', error);
    // Default to San Francisco city center
    return { lat: 37.7749, lon: -122.4194 };
  }
}

/**
 * Estimate miles of roadway based on area
 * @param areaSqMiles Area in square miles
 * @returns Estimated miles of roadway
 */
function estimateRoadwayMiles(areaSqMiles: number): number {
  // Simple estimation: US average is roughly 20 miles of road per square mile
  // Urban areas tend to have higher density (30-40), rural lower (5-10)
  const roadDensity = 25; // Assuming medium-density urban/suburban area
  return areaSqMiles * roadDensity;
}

/**
 * Identify collision hotspots from collision data
 * @param collisions Array of collision objects from API
 * @returns Array of hotspot objects with location and description
 */
function identifyHotspots(collisions: any[]): Array<{ location: string; description: string; collisionCount: number }> {
  // This is a simplified implementation
  // In a real implementation, this would use spatial clustering algorithms
  
  // Group collisions by nearest intersection or location
  const locationCounts: Record<string, number> = {};
  
  collisions.forEach(collision => {
    const locationKey = collision.intersection || collision.location || 'Unknown Location';
    locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
  });
  
  // Find locations with multiple collisions, consider them hotspots
  const hotspots = Object.entries(locationCounts)
    .filter(([_, count]) => count >= 3) // Locations with 3+ collisions
    .map(([location, count]) => ({
      location,
      description: `${location} (${count} collisions)`,
      collisionCount: count
    }))
    .sort((a, b) => b.collisionCount - a.collisionCount) // Sort by collision count descending
    .slice(0, 5); // Top 5 hotspots
  
  return hotspots;
}

/**
 * Get sample collision data when API is unavailable
 * @param location Location string to customize the sample data
 * @param radius Radius in miles
 * @param years Number of years of data
 * @returns Sample collision data
 */
function getSampleCollisionData(location: string, radius: number, years: number): CollisionData {
  // Generate realistic but synthetic data
  // Scale number of collisions based on radius and years
  const baseCollisionsPerYear = 25; // Base collisions per year in a 0.5 mile radius
  const scaleFactor = (radius / 0.5) * (radius / 0.5); // Square relationship to area
  
  const totalCollisions = Math.round(baseCollisionsPerYear * years * scaleFactor);
  
  // Get a sense of the location type to adjust collision patterns
  const isUrban = location.toLowerCase().includes('san francisco') || 
                 location.toLowerCase().includes('oakland') || 
                 location.toLowerCase().includes('los angeles');
  
  const isHighway = location.toLowerCase().includes('highway') || 
                   location.toLowerCase().includes('freeway') || 
                   location.toLowerCase().includes('interstate');
  
  // Adjust severity distribution based on location type
  let severityDistribution: Record<CollisionSeverity, number>;
  
  if (isHighway) {
    // Highways tend to have more severe crashes but fewer pedestrian/bicycle involvement
    severityDistribution = {
      fatal: Math.round(totalCollisions * 0.03),
      severe: Math.round(totalCollisions * 0.12),
      visible: Math.round(totalCollisions * 0.20),
      complaint: Math.round(totalCollisions * 0.25),
      pdo: 0 // Will be calculated to make up the remainder
    };
  } else if (isUrban) {
    // Urban areas tend to have more minor crashes but more pedestrian/bicycle involvement
    severityDistribution = {
      fatal: Math.round(totalCollisions * 0.01),
      severe: Math.round(totalCollisions * 0.08),
      visible: Math.round(totalCollisions * 0.18),
      complaint: Math.round(totalCollisions * 0.30),
      pdo: 0 // Will be calculated to make up the remainder
    };
  } else {
    // Suburban/rural areas
    severityDistribution = {
      fatal: Math.round(totalCollisions * 0.02),
      severe: Math.round(totalCollisions * 0.10),
      visible: Math.round(totalCollisions * 0.15),
      complaint: Math.round(totalCollisions * 0.23),
      pdo: 0 // Will be calculated to make up the remainder
    };
  }
  
  // Calculate PDO to make the total add up
  const sumSeverity = severityDistribution.fatal + 
                   severityDistribution.severe + 
                   severityDistribution.visible + 
                   severityDistribution.complaint;
  
  severityDistribution.pdo = totalCollisions - sumSeverity;
  
  // Adjust type distribution based on location
  let typeDistribution: Record<CollisionType, number>;
  
  if (isHighway) {
    typeDistribution = {
      pedestrian: Math.round(totalCollisions * 0.02),
      bicycle: Math.round(totalCollisions * 0.01),
      motorcycle: Math.round(totalCollisions * 0.05),
      vehicle: Math.round(totalCollisions * 0.75),
      fixed_object: Math.round(totalCollisions * 0.12),
      other: 0 // Will be calculated to make up the remainder
    };
  } else if (isUrban) {
    typeDistribution = {
      pedestrian: Math.round(totalCollisions * 0.12),
      bicycle: Math.round(totalCollisions * 0.09),
      motorcycle: Math.round(totalCollisions * 0.06),
      vehicle: Math.round(totalCollisions * 0.60),
      fixed_object: Math.round(totalCollisions * 0.08),
      other: 0 // Will be calculated to make up the remainder
    };
  } else {
    typeDistribution = {
      pedestrian: Math.round(totalCollisions * 0.05),
      bicycle: Math.round(totalCollisions * 0.04),
      motorcycle: Math.round(totalCollisions * 0.06),
      vehicle: Math.round(totalCollisions * 0.68),
      fixed_object: Math.round(totalCollisions * 0.12),
      other: 0 // Will be calculated to make up the remainder
    };
  }
  
  // Calculate "other" to make the total add up
  const sumType = typeDistribution.pedestrian + 
               typeDistribution.bicycle + 
               typeDistribution.motorcycle + 
               typeDistribution.vehicle + 
               typeDistribution.fixed_object;
  
  typeDistribution.other = totalCollisions - sumType;
  
  // Time of day distribution
  const timeOfDayCounts = {
    morning: Math.round(totalCollisions * 0.25), // 6am - 10am
    midday: Math.round(totalCollisions * 0.20),  // 10am - 3pm
    evening: Math.round(totalCollisions * 0.35), // 3pm - 7pm
    night: Math.round(totalCollisions * 0.20)    // 7pm - 6am
  };
  
  // Weather distribution
  const weatherCounts = {
    clear: Math.round(totalCollisions * 0.70),
    rain: Math.round(totalCollisions * 0.15),
    snow: Math.round(totalCollisions * 0.02),
    fog: Math.round(totalCollisions * 0.05),
    other: Math.round(totalCollisions * 0.08)
  };
  
  // Generate sample hotspots
  const hotspots: Array<{location: string; description: string; collisionCount: number}> = [];
  
  if (isUrban) {
    // Generate urban intersection hotspots
    const streetNames = [
      'Market', 'Mission', 'Van Ness', 'Geary', 'Broadway', 
      'Valencia', 'Divisadero', 'Castro', 'Folsom', 'Howard',
      'California', 'Pine', 'Bush', 'Oak', 'Fell'
    ];
    
    const crossStreets = [
      '1st', '3rd', '6th', '9th', '16th', '24th', 
      'Fillmore', 'Masonic', 'Polk', 'Octavia', 'Gough', 
      'Franklin', 'Turk', 'Eddy', 'Ellis'
    ];
    
    for (let i = 0; i < Math.min(5, totalCollisions / 10); i++) {
      const street1 = streetNames[Math.floor(Math.random() * streetNames.length)];
      const street2 = crossStreets[Math.floor(Math.random() * crossStreets.length)];
      const count = Math.floor(Math.random() * 8) + 3; // 3-10 collisions
      
      hotspots.push({
        location: `${street1} St & ${street2} St`,
        description: `Intersection of ${street1} and ${street2}`,
        collisionCount: count
      });
    }
  } else if (isHighway) {
    // Generate highway hotspots
    const highways = ['101', '280', '580', '880', '680', '80'];
    const landmarks = ['Exit', 'Interchange', 'On-ramp', 'Off-ramp', 'Overpass', 'Underpass'];
    
    for (let i = 0; i < Math.min(5, totalCollisions / 15); i++) {
      const highway = highways[Math.floor(Math.random() * highways.length)];
      const landmark = landmarks[Math.floor(Math.random() * landmarks.length)];
      const nearby = Math.floor(Math.random() * 150) + 1;
      const count = Math.floor(Math.random() * 12) + 4; // 4-15 collisions
      
      hotspots.push({
        location: `Highway ${highway} ${landmark} ${nearby}`,
        description: `Highway ${highway} at ${landmark} ${nearby}`,
        collisionCount: count
      });
    }
  } else {
    // Generate suburban/rural hotspots
    const roadTypes = ['Road', 'Avenue', 'Boulevard', 'Drive', 'Way', 'Street'];
    const roadNames = ['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lincoln'];
    
    for (let i = 0; i < Math.min(3, totalCollisions / 20); i++) {
      const roadName = roadNames[Math.floor(Math.random() * roadNames.length)];
      const roadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
      const count = Math.floor(Math.random() * 5) + 3; // 3-7 collisions
      
      hotspots.push({
        location: `${roadName} ${roadType}`,
        description: `Curve on ${roadName} ${roadType}`,
        collisionCount: count
      });
    }
  }
  
  // Calculate roadway miles and collision rate
  const areaInSqMiles = Math.PI * radius * radius;
  const roadwayMiles = estimateRoadwayMiles(areaInSqMiles);
  const collisionsPerMile = totalCollisions / roadwayMiles;
  const collisionsPerYear = totalCollisions / years;
  const collisionRate = collisionsPerYear / roadwayMiles;
  
  return {
    totalCollisions,
    collisionsPerYear,
    collisionsPerMile,
    collisionRate,
    severityCounts: severityDistribution,
    typeCounts: typeDistribution,
    timeOfDayCounts,
    weatherCounts,
    hotspots,
    years,
    radius,
    location,
    source: 'Sample data based on location type and parameters',
    lastUpdated: new Date().toISOString()
  };
} 