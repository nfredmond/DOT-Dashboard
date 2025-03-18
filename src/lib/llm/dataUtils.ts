/**
 * Data Utilities for LLM Integration with external APIs
 * These utilities help integrate Census and SWITRS data with LLM components
 */

import { 
  getCensusData, 
  CensusDataset, 
  CensusGeoType, 
  CensusQueryParams,
  CensusData,
  CENSUS_VARIABLES 
} from '../census-service';

import {
  getCollisionData,
  getCollisionStats,
  CollisionQueryParams,
  CollisionData,
  CollisionSeverity,
  CollisionType
} from '../traffic-service';

/**
 * Get demographic data for a project location to provide context to LLM
 */
export async function getProjectDemographicContext(
  location: string, 
  county?: string,
  state?: string
): Promise<{
  demographicSummary: string;
  demographicData: CensusData[];
}> {
  try {
    // Default to California if no state provided
    const stateCode = state || 'CA';
    
    // Create census query parameters for demographic data
    const censusParams: CensusQueryParams = {
      dataset: CensusDataset.ACS5,
      variables: [
        CENSUS_VARIABLES.TOTAL_POPULATION,
        CENSUS_VARIABLES.MEDIAN_AGE,
        CENSUS_VARIABLES.RACE_WHITE,
        CENSUS_VARIABLES.RACE_BLACK,
        CENSUS_VARIABLES.RACE_ASIAN,
        CENSUS_VARIABLES.HISPANIC_LATINO,
        CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME,
        CENSUS_VARIABLES.POVERTY_COUNT,
        CENSUS_VARIABLES.NO_VEHICLE_AVAILABLE,
        CENSUS_VARIABLES.COMMUTE_PUBLIC_TRANSIT,
        CENSUS_VARIABLES.COMMUTE_WALK,
        CENSUS_VARIABLES.COMMUTE_BIKE
      ],
      geoType: county ? CensusGeoType.Tract : CensusGeoType.County,
      state: stateCode,
      county: county
    };
    
    // Fetch census data
    const censusData = await getCensusData(censusParams);
    
    // Create a summary string for the LLM
    let demographicSummary = `Demographic context for ${location}:\n`;
    
    if (censusData.length > 0) {
      // Use the most relevant geographic area (first result)
      const areaData = censusData[0];
      const vars = areaData.variables;
      
      // Calculate derived statistics
      const totalPop = Number(vars[CENSUS_VARIABLES.TOTAL_POPULATION]) || 0;
      const pctWhite = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.RACE_WHITE]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctBlack = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.RACE_BLACK]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctAsian = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.RACE_ASIAN]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctHispanic = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.HISPANIC_LATINO]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctPoverty = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.POVERTY_COUNT]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      
      const pctNoVehicle = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.NO_VEHICLE_AVAILABLE]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctTransit = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.COMMUTE_PUBLIC_TRANSIT]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctWalk = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.COMMUTE_WALK]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      const pctBike = totalPop > 0 ? ((Number(vars[CENSUS_VARIABLES.COMMUTE_BIKE]) || 0) / totalPop * 100).toFixed(1) : 'N/A';
      
      // Build the summary
      demographicSummary += `Area: ${areaData.geoname}\n`;
      demographicSummary += `Total Population: ${totalPop.toLocaleString()}\n`;
      demographicSummary += `Median Age: ${vars[CENSUS_VARIABLES.MEDIAN_AGE] || 'N/A'}\n`;
      demographicSummary += `Racial Demographics: ${pctWhite}% White, ${pctBlack}% Black, ${pctAsian}% Asian, ${pctHispanic}% Hispanic/Latino\n`;
      demographicSummary += `Median Household Income: $${(Number(vars[CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME]) || 0).toLocaleString()}\n`;
      demographicSummary += `Population in Poverty: ${pctPoverty}%\n`;
      demographicSummary += `Transportation: ${pctNoVehicle}% No Vehicle, ${pctTransit}% Public Transit, ${pctWalk}% Walk, ${pctBike}% Bike\n`;
    } else {
      demographicSummary += "Demographic data not available for this location.";
    }
    
    return {
      demographicSummary,
      demographicData: censusData
    };
  } catch (error) {
    console.error("Error getting demographic context:", error);
    return {
      demographicSummary: "Unable to retrieve demographic data at this time.",
      demographicData: []
    };
  }
}

/**
 * Get safety data for a project location to provide context to LLM
 */
export async function getProjectSafetyContext(
  location: string,
  county: string,
  startDate?: string,
  endDate?: string
): Promise<{
  safetySummary: string;
  collisionStats: any;
  collisionData: CollisionData[];
}> {
  try {
    // Default date range is last 3 years if not specified
    const currentDate = new Date();
    const defaultEndDate = currentDate.toISOString().split('T')[0];
    const defaultStartDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 3))
      .toISOString().split('T')[0];
      
    // Create traffic collision query parameters
    const collisionParams: CollisionQueryParams = {
      county: county,
      startDate: startDate || defaultStartDate,
      endDate: endDate || defaultEndDate,
      limit: 500  // reasonable limit to avoid excessive data
    };
    
    // Fetch collision data and stats
    const collisionData = await getCollisionData(collisionParams);
    const collisionStats = await getCollisionStats(collisionParams);
    
    // Create a summary string for the LLM
    let safetySummary = `Safety context for ${location} (${county} County):\n`;
    
    if (collisionData.length > 0) {
      // Calculate percentages
      const fatalPct = (collisionStats.bySeverity[CollisionSeverity.Fatal] / collisionStats.total * 100).toFixed(1);
      const injuryPct = (collisionStats.bySeverity[CollisionSeverity.Injury] / collisionStats.total * 100).toFixed(1);
      const pdoPct = (collisionStats.bySeverity[CollisionSeverity.PropertyDamage] / collisionStats.total * 100).toFixed(1);
      
      // Count collisions involving vulnerable users
      const pedCollisions = collisionData.filter(c => c.pedestriansInvolved > 0).length;
      const bikeCollisions = collisionData.filter(c => c.bicyclistsInvolved > 0).length;
      
      const pedPct = (pedCollisions / collisionStats.total * 100).toFixed(1);
      const bikePct = (bikeCollisions / collisionStats.total * 100).toFixed(1);
      
      // Build the safety summary
      safetySummary += `Date Range: ${collisionParams.startDate} to ${collisionParams.endDate}\n`;
      safetySummary += `Total Collisions: ${collisionStats.total}\n`;
      safetySummary += `Collision Severity: ${fatalPct}% Fatal, ${injuryPct}% Injury, ${pdoPct}% Property Damage Only\n`;
      safetySummary += `Vulnerable Users: ${pedPct}% involving pedestrians, ${bikePct}% involving bicyclists\n`;
      
      // Identify top collision types
      const typeEntries = Object.entries(collisionStats.byType).sort((a, b) => b[1] - a[1]);
      if (typeEntries.length > 0) {
        const topTypes = typeEntries.slice(0, 3).map(([type, count]) => {
          const percent = (count / collisionStats.total * 100).toFixed(1);
          const collisionTypeName = Object.keys(CollisionType).find(
            key => CollisionType[key as keyof typeof CollisionType] === type
          ) || type;
          return `${collisionTypeName} (${percent}%)`;
        });
        safetySummary += `Top Collision Types: ${topTypes.join(', ')}\n`;
      }
    } else {
      safetySummary += "No collision data available for this location and time period.";
    }
    
    return {
      safetySummary,
      collisionStats,
      collisionData
    };
  } catch (error) {
    console.error("Error getting safety context:", error);
    return {
      safetySummary: "Unable to retrieve safety data at this time.",
      collisionStats: { 
        total: 0, 
        bySeverity: {}, 
        byType: {}, 
        byCounty: {} 
      },
      collisionData: []
    };
  }
}

/**
 * Get combined demographic and safety context for LLM analysis
 */
export async function getProjectAreaContext(
  location: string,
  county: string,
  state?: string
): Promise<string> {
  try {
    // Get both demographic and safety data
    const [demographicData, safetyData] = await Promise.all([
      getProjectDemographicContext(location, county, state),
      getProjectSafetyContext(location, county)
    ]);
    
    // Combine the summaries
    return `
Area Context for ${location}, ${county} County:

DEMOGRAPHIC INFORMATION:
${demographicData.demographicSummary}

SAFETY INFORMATION:
${safetyData.safetySummary}
`;
  } catch (error) {
    console.error("Error getting project area context:", error);
    return `Unable to retrieve comprehensive area context for ${location} at this time.`;
  }
} 