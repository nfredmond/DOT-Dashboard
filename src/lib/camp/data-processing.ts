import { zonalGrowthFactors, applyNetworkPolicy } from './modeling-utils';

/**
 * Process zone data to prepare for modeling
 * 
 * @param rawZoneData Raw zone data from the database
 * @param baseYear Base year for the scenario
 * @param horizonYear Horizon year for the scenario
 * @returns Processed zone data ready for modeling
 */
export async function processZoneData(rawZoneData: any, baseYear: number, horizonYear: number) {
  try {
    console.log(`Processing zone data from ${baseYear} to ${horizonYear}...`);
    
    // Clone to avoid modifying the original data
    const zoneData = JSON.parse(JSON.stringify(rawZoneData));
    
    // Get growth factors for different demographic and economic variables
    const growthFactors = await zonalGrowthFactors(baseYear, horizonYear);
    
    // Process each zone
    const processedZones = {};
    const zoneGeometries = {};
    
    for (const zoneId in zoneData.zones) {
      const zone = zoneData.zones[zoneId];
      
      // Store geometry separately for GIS operations
      zoneGeometries[zoneId] = zone.geometry;
      
      // Apply growth factors to demographic data
      const growthFactor = growthFactors[zoneId] || growthFactors.default;
      
      // Apply growth to population
      let population = zone.population || 0;
      population *= growthFactor.population;
      
      // Apply growth to different employment types
      let employment = {
        retail: (zone.employment?.retail || 0) * growthFactor.employment.retail,
        office: (zone.employment?.office || 0) * growthFactor.employment.office,
        industrial: (zone.employment?.industrial || 0) * growthFactor.employment.industrial,
        other: (zone.employment?.other || 0) * growthFactor.employment.other
      };
      
      // Calculate total employment
      employment.total = employment.retail + employment.office + employment.industrial + employment.other;
      
      // Apply growth to households by type
      const households = {
        single_family: (zone.households?.single_family || 0) * growthFactor.households.single_family,
        multi_family: (zone.households?.multi_family || 0) * growthFactor.households.multi_family,
        total: 0
      };
      
      households.total = households.single_family + households.multi_family;
      
      // Calculate other demographic metrics
      const lowIncomePop = population * (zone.low_income_percentage || 0.2);
      const minorityPop = population * (zone.minority_percentage || 0.3);
      const elderlyPop = population * (zone.elderly_percentage || 0.15);
      const zeroCarHouseholds = households.total * (zone.zero_car_percentage || 0.05);
      
      // Store processed data
      processedZones[zoneId] = {
        population,
        employment,
        households,
        low_income_pop: lowIncomePop,
        minority_pop: minorityPop,
        elderly_pop: elderlyPop,
        zero_car_households: zeroCarHouseholds,
        // Additional trip generation variables can be calculated here
        // ...
      };
    }
    
    return {
      zones: processedZones,
      zoneGeometries
    };
  } catch (error) {
    console.error('Error processing zone data:', error);
    throw error;
  }
}

/**
 * Process network data to prepare for modeling
 * 
 * @param rawNetworkData Raw network data from the database
 * @param assumptions Scenario assumptions
 * @param policyPackages Scenario policy packages
 * @returns Processed network data ready for modeling
 */
export async function processNetworkData(rawNetworkData: any, assumptions: any, policyPackages: any[]) {
  try {
    console.log('Processing network data...');
    
    // Clone to avoid modifying the original data
    const networkData = JSON.parse(JSON.stringify(rawNetworkData));
    
    // Extract network components
    const { links, nodes } = networkData;
    
    // Process links
    const processedLinks = {};
    const linkGeometries = {};
    const linkCapacities = {};
    const linkFreeFlowTimes = {};
    const linkLengths = {};
    const linkTypes = {};
    
    for (const linkId in links) {
      const link = links[linkId];
      
      // Store geometry separately for GIS operations
      linkGeometries[linkId] = link.geometry;
      
      // Process link attributes
      linkCapacities[linkId] = link.capacity || 0;
      linkFreeFlowTimes[linkId] = link.free_flow_time || 0;
      linkLengths[linkId] = link.length || 0;
      linkTypes[linkId] = link.facility_type || 'unknown';
      
      // Apply policy impacts to the network
      if (policyPackages && policyPackages.length > 0) {
        for (const policy of policyPackages) {
          // Apply network modifications based on policies
          if (policy.type === 'network_modification') {
            const modifiedLink = applyNetworkPolicy(link, policy);
            
            // Update link attributes with policy impacts
            linkCapacities[linkId] = modifiedLink.capacity || linkCapacities[linkId];
            linkFreeFlowTimes[linkId] = modifiedLink.free_flow_time || linkFreeFlowTimes[linkId];
          }
        }
      }
      
      // Apply scenario assumptions
      if (assumptions && assumptions.network) {
        // Apply global capacity changes
        if (assumptions.network.capacity_factor) {
          linkCapacities[linkId] *= assumptions.network.capacity_factor;
        }
        
        // Apply facility-specific changes
        if (assumptions.network.facility_adjustments && 
            assumptions.network.facility_adjustments[link.facility_type]) {
          const adjustment = assumptions.network.facility_adjustments[link.facility_type];
          linkCapacities[linkId] *= adjustment.capacity_factor || 1;
          linkFreeFlowTimes[linkId] *= adjustment.travel_time_factor || 1;
        }
      }
      
      // Store processed link
      processedLinks[linkId] = {
        from_node: link.from_node,
        to_node: link.to_node,
        capacity: linkCapacities[linkId],
        free_flow_time: linkFreeFlowTimes[linkId],
        length: linkLengths[linkId],
        facility_type: linkTypes[linkId]
      };
    }
    
    // Process nodes (if needed)
    const processedNodes = {};
    
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      
      processedNodes[nodeId] = {
        x: node.x,
        y: node.y,
        type: node.type || 'junction'
      };
    }
    
    return {
      links: processedLinks,
      nodes: processedNodes,
      linkGeometries,
      linkCapacities,
      linkFreeFlowTimes,
      linkLengths,
      linkTypes
    };
  } catch (error) {
    console.error('Error processing network data:', error);
    throw error;
  }
} 