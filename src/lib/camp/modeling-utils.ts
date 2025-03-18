/**
 * Modeling utility functions for the CAMP travel demand model
 */

/**
 * Calculate zonal growth factors between base year and horizon year
 * In a real implementation, this would use forecasts from regional planning agencies
 * or demographic projections.
 * 
 * @param baseYear Base year for scenarios
 * @param horizonYear Target forecast year
 * @returns Growth factors by zone and variable type
 */
export async function zonalGrowthFactors(baseYear: number, horizonYear: number) {
  // Calculate number of years between base and horizon
  const years = horizonYear - baseYear;
  
  if (years <= 0) {
    return {
      default: {
        population: 1.0,
        employment: {
          retail: 1.0,
          office: 1.0,
          industrial: 1.0,
          other: 1.0
        },
        households: {
          single_family: 1.0,
          multi_family: 1.0
        }
      }
    };
  }
  
  // Default annual growth rates (could be replaced with actual forecast data)
  const defaultGrowthRates = {
    population: 0.01,             // 1% annual growth
    employment: {
      retail: 0.005,              // 0.5% annual growth
      office: 0.015,              // 1.5% annual growth
      industrial: 0.003,          // 0.3% annual growth
      other: 0.008                // 0.8% annual growth
    },
    households: {
      single_family: 0.008,       // 0.8% annual growth
      multi_family: 0.018         // 1.8% annual growth (assuming more multi-family growth)
    }
  };
  
  // Calculate compounded growth factors
  const defaultFactors = {
    population: Math.pow(1 + defaultGrowthRates.population, years),
    employment: {
      retail: Math.pow(1 + defaultGrowthRates.employment.retail, years),
      office: Math.pow(1 + defaultGrowthRates.employment.office, years),
      industrial: Math.pow(1 + defaultGrowthRates.employment.industrial, years),
      other: Math.pow(1 + defaultGrowthRates.employment.other, years)
    },
    households: {
      single_family: Math.pow(1 + defaultGrowthRates.households.single_family, years),
      multi_family: Math.pow(1 + defaultGrowthRates.households.multi_family, years)
    }
  };
  
  // In a real implementation, you would return zone-specific growth factors
  // based on forecast data. Here we're returning the default for all zones.
  return {
    // Default factors for all zones
    default: defaultFactors,
    
    // Example of zone-specific factors (would be expanded with real data)
    // These show higher growth in zone 1 and lower in zone 2
    "1": {
      population: defaultFactors.population * 1.2,
      employment: {
        retail: defaultFactors.employment.retail * 1.3,
        office: defaultFactors.employment.office * 1.5,
        industrial: defaultFactors.employment.industrial * 0.9,
        other: defaultFactors.employment.other * 1.1
      },
      households: {
        single_family: defaultFactors.households.single_family * 1.1,
        multi_family: defaultFactors.households.multi_family * 1.4
      }
    },
    "2": {
      population: defaultFactors.population * 0.9,
      employment: {
        retail: defaultFactors.employment.retail * 0.8,
        office: defaultFactors.employment.office * 0.7,
        industrial: defaultFactors.employment.industrial * 1.1,
        other: defaultFactors.employment.other * 0.9
      },
      households: {
        single_family: defaultFactors.households.single_family * 0.9,
        multi_family: defaultFactors.households.multi_family * 0.8
      }
    }
  };
}

/**
 * Apply policy impacts to network links
 * Modifies link attributes based on policy parameters
 * 
 * @param link Original link data
 * @param policy Policy object with type and parameters
 * @returns Modified link with policy impacts applied
 */
export function applyNetworkPolicy(link: any, policy: any) {
  // Clone the link to avoid modifying the original
  const modifiedLink = { ...link };
  
  // Apply policy based on type
  switch (policy.type) {
    case 'network_modification':
      // Check if this link is affected by the policy
      if (isLinkAffected(link, policy.affected_links)) {
        // Apply capacity changes
        if (policy.capacity_change_factor) {
          modifiedLink.capacity = (link.capacity || 0) * policy.capacity_change_factor;
        }
        
        // Apply travel time changes (e.g., speed improvements)
        if (policy.travel_time_change_factor) {
          modifiedLink.free_flow_time = (link.free_flow_time || 0) * policy.travel_time_change_factor;
        }
        
        // Add new attributes if specified
        if (policy.new_attributes) {
          Object.assign(modifiedLink, policy.new_attributes);
        }
      }
      break;
      
    case 'transit_improvement':
      // For transit links
      if (link.mode === 'transit') {
        // Apply frequency improvements
        if (policy.frequency_change_factor) {
          modifiedLink.headway = (link.headway || 0) / policy.frequency_change_factor;
        }
        
        // Apply speed improvements
        if (policy.speed_change_factor) {
          modifiedLink.travel_time = (link.travel_time || 0) / policy.speed_change_factor;
        }
      }
      break;
      
    case 'toll_implementation':
      // For links where tolls are being applied
      if (isLinkAffected(link, policy.toll_links)) {
        modifiedLink.toll = policy.toll_amount || 0;
        
        // Tolls might affect capacity or free flow time
        if (policy.capacity_impact_factor) {
          modifiedLink.capacity = (link.capacity || 0) * policy.capacity_impact_factor;
        }
      }
      break;
      
    case 'lane_addition':
      // For links where lanes are being added
      if (isLinkAffected(link, policy.affected_links)) {
        const currentLanes = link.lanes || 1;
        const addedLanes = policy.lanes_to_add || 0;
        modifiedLink.lanes = currentLanes + addedLanes;
        
        // Adjust capacity based on new lanes
        if (link.capacity) {
          modifiedLink.capacity = link.capacity * (modifiedLink.lanes / currentLanes);
        }
      }
      break;
      
    case 'active_transportation':
      // For pedestrian/bicycle improvements
      if (link.mode === 'walk' || link.mode === 'bike') {
        if (policy.travel_time_improvement) {
          modifiedLink.free_flow_time = (link.free_flow_time || 0) * 
            (1 - policy.travel_time_improvement);
        }
      }
      break;
  }
  
  return modifiedLink;
}

/**
 * Check if a link is affected by a policy
 * 
 * @param link Link to check
 * @param affectedLinks Array or object defining which links are affected
 * @returns True if the link is affected by the policy
 */
function isLinkAffected(link: any, affectedLinks: any): boolean {
  // If no affected links specified, assume no effect
  if (!affectedLinks) return false;
  
  // If affected_links is an array of IDs
  if (Array.isArray(affectedLinks)) {
    return affectedLinks.includes(link.id);
  }
  
  // If affected_links is an object with criteria
  if (typeof affectedLinks === 'object') {
    // Check facility type
    if (affectedLinks.facility_types && 
        !affectedLinks.facility_types.includes(link.facility_type)) {
      return false;
    }
    
    // Check area type
    if (affectedLinks.area_types &&
        !affectedLinks.area_types.includes(link.area_type)) {
      return false;
    }
    
    // Check specific corridors
    if (affectedLinks.corridors &&
        !affectedLinks.corridors.includes(link.corridor)) {
      return false;
    }
    
    // If we made it through all the filters, the link is affected
    return true;
  }
  
  // Default case
  return false;
} 