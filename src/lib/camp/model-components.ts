import { ModelParameters } from '@/types/camp';

/**
 * Trip Generation Component
 * 
 * Handles the first step of the classic four-step transportation model:
 * calculating the number of trips produced by and attracted to each zone.
 */
export class TripGeneration {
  private zoneData: any;
  private parameters: ModelParameters;

  constructor(zoneData: any, parameters: ModelParameters) {
    this.zoneData = zoneData;
    this.parameters = parameters;
  }

  /**
   * Execute trip generation calculations
   * @returns Object containing trip production and attraction by zone
   */
  public async execute() {
    console.log('Executing trip generation model...');
    
    const zones = this.zoneData.zones;
    const zoneGeometries = this.zoneData.zoneGeometries;
    const productionRates = this.parameters.trip_generation.production_rates;
    const attractionRates = this.parameters.trip_generation.attraction_rates;
    
    // Initialize result objects
    const tripProduction = {};
    const tripAttraction = {};
    const tripsByPurpose = {};
    
    // Define trip purposes
    const purposes = ['home_work', 'home_shop', 'home_other', 'non_home'];
    
    // Initialize trips by purpose
    for (const purpose of purposes) {
      tripsByPurpose[purpose] = {};
    }
    
    // Calculate productions and attractions for each zone
    for (const zoneId in zones) {
      const zone = zones[zoneId];
      
      // Trip productions by purpose
      let homeworkProduction = zone.households.total * productionRates.home_work_per_household;
      let homeshopProduction = zone.households.total * productionRates.home_shop_per_household;
      let homeotherProduction = zone.households.total * productionRates.home_other_per_household;
      let nonhomeProduction = zone.employment.total * productionRates.non_home_per_job;
      
      // Adjust based on demographics
      homeworkProduction *= (1 + (zone.zero_car_households / zone.households.total - 0.1) * -0.5);
      homeshopProduction *= (1 + (zone.elderly_pop / zone.population - 0.15) * 0.3);
      
      // Store productions by purpose
      tripsByPurpose.home_work[zoneId] = homeworkProduction;
      tripsByPurpose.home_shop[zoneId] = homeshopProduction;
      tripsByPurpose.home_other[zoneId] = homeotherProduction;
      tripsByPurpose.non_home[zoneId] = nonhomeProduction;
      
      // Total productions
      tripProduction[zoneId] = homeworkProduction + homeshopProduction + homeotherProduction + nonhomeProduction;
      
      // Trip attractions by purpose
      const homeworkAttraction = zone.employment.total * attractionRates.home_work_per_job;
      const homeshopAttraction = (zone.employment.retail + zone.employment.other * 0.2) * attractionRates.home_shop_per_retail_job;
      const homeotherAttraction = (
        zone.employment.total * attractionRates.home_other_per_job + 
        zone.population * attractionRates.home_other_per_person
      );
      const nonhomeAttraction = (
        zone.employment.total * attractionRates.non_home_per_job +
        zone.population * attractionRates.non_home_per_person
      );
      
      // Store attractions by purpose
      tripsByPurpose.home_work[`${zoneId}_attraction`] = homeworkAttraction;
      tripsByPurpose.home_shop[`${zoneId}_attraction`] = homeshopAttraction;
      tripsByPurpose.home_other[`${zoneId}_attraction`] = homeotherAttraction;
      tripsByPurpose.non_home[`${zoneId}_attraction`] = nonhomeAttraction;
      
      // Total attractions
      tripAttraction[zoneId] = homeworkAttraction + homeshopAttraction + homeotherAttraction + nonhomeAttraction;
    }
    
    // Balance productions and attractions
    this.balanceTrips(tripProduction, tripAttraction);
    
    // Prepare output structure
    return {
      zones: {
        ...zones,
      },
      zoneGeometries,
      tripProduction,
      tripAttraction,
      tripsByPurpose
    };
  }
  
  /**
   * Balance total trip productions and attractions
   */
  private balanceTrips(tripProduction: Record<string, number>, tripAttraction: Record<string, number>) {
    // Calculate totals
    const totalProduction = Object.values(tripProduction).reduce((a, b) => a + b, 0);
    const totalAttraction = Object.values(tripAttraction).reduce((a, b) => a + b, 0);
    
    // Calculate adjustment factor
    const adjustmentFactor = totalProduction / totalAttraction;
    
    // Adjust attractions to match productions
    for (const zoneId in tripAttraction) {
      tripAttraction[zoneId] *= adjustmentFactor;
    }
  }
}

/**
 * Trip Distribution Component
 * 
 * Handles the second step of the four-step model:
 * distributing trips between origins and destinations.
 */
export class TripDistribution {
  private parameters: ModelParameters;

  constructor(parameters: ModelParameters) {
    this.parameters = parameters;
  }

  /**
   * Execute trip distribution calculations
   * @param tripGenData Results from the trip generation step
   * @returns Trip matrix
   */
  public async execute(tripGenData: any) {
    console.log('Executing trip distribution model...');
    
    const tripProduction = tripGenData.tripProduction;
    const tripAttraction = tripGenData.tripAttraction;
    const tripsByPurpose = tripGenData.tripsByPurpose;
    const frictionFactors = this.parameters.trip_distribution.friction_factors;
    const kFactors = this.parameters.trip_distribution.k_factors;
    
    // Initialize trip matrices by purpose
    const tripMatrices = {};
    const purposes = Object.keys(tripsByPurpose);
    
    // Calculate trip matrix for each purpose using gravity model
    for (const purpose of purposes) {
      const tripMatrix = this.calculateGravityModel(
        tripsByPurpose[purpose],
        tripAttraction,
        frictionFactors[purpose] || frictionFactors.default,
        kFactors[purpose] || {}
      );
      
      tripMatrices[purpose] = tripMatrix;
    }
    
    // Combine purpose-specific matrices into a total matrix
    const totalTripMatrix = this.combineTripMatrices(tripMatrices);
    
    return {
      tripMatrices,
      totalTripMatrix,
      tripGenData
    };
  }
  
  /**
   * Calculate trip distribution using gravity model
   */
  private calculateGravityModel(
    productions: Record<string, number>,
    attractions: Record<string, number>,
    frictionFactors: number[],
    kFactors: Record<string, Record<string, number>>
  ) {
    const tripMatrix = {};
    const origins = Object.keys(productions).filter(id => !id.includes('_attraction'));
    const destinations = Object.keys(attractions);
    
    // First pass: calculate unadjusted trips
    for (const origin of origins) {
      tripMatrix[origin] = {};
      
      let sumFactors = 0;
      const factorsByDest = {};
      
      // Calculate distribution factors
      for (const destination of destinations) {
        if (origin === destination) continue; // Skip intra-zonal for now
        
        // Calculate travel impedance (simplified for demonstration)
        const distance = this.calculateDistance(origin, destination);
        const frictionFactor = this.getFrictionFactor(distance, frictionFactors);
        
        // Apply K-factors (socioeconomic or spatial adjustment factors)
        const kFactor = kFactors[origin]?.[destination] || 1.0;
        
        // Calculate distribution factor
        const factor = attractions[destination] * frictionFactor * kFactor;
        factorsByDest[destination] = factor;
        sumFactors += factor;
      }
      
      // Calculate intra-zonal trips with special treatment
      const intrazonalFriction = this.getFrictionFactor(1, frictionFactors) * 0.5; // Adjust for intra-zonal
      const intraFactor = attractions[origin] * intrazonalFriction;
      factorsByDest[origin] = intraFactor;
      sumFactors += intraFactor;
      
      // Distribute trips
      const originProduction = productions[origin];
      
      for (const destination of [...destinations, origin]) {
        if (sumFactors > 0) {
          tripMatrix[origin][destination] = originProduction * (factorsByDest[destination] / sumFactors);
        } else {
          tripMatrix[origin][destination] = 0;
        }
      }
    }
    
    return tripMatrix;
  }
  
  /**
   * Get friction factor for a given distance
   */
  private getFrictionFactor(distance: number, frictionFactors: number[]) {
    const maxDistance = frictionFactors.length - 1;
    
    if (distance <= 0) return frictionFactors[0];
    if (distance >= maxDistance) return frictionFactors[maxDistance];
    
    // Interpolate between distance brackets
    const lowerIndex = Math.floor(distance);
    const upperIndex = Math.ceil(distance);
    
    if (lowerIndex === upperIndex) return frictionFactors[lowerIndex];
    
    const lowerValue = frictionFactors[lowerIndex];
    const upperValue = frictionFactors[upperIndex];
    const fraction = distance - lowerIndex;
    
    return lowerValue + fraction * (upperValue - lowerValue);
  }
  
  /**
   * Calculate distance between zones (simplified)
   */
  private calculateDistance(originId: string, destinationId: string) {
    // In a real implementation, this would use the network distance or skim matrix
    // For demonstration, we're using a simple random distance
    // This would be replaced with actual distance calculations
    
    // Create a stable "random" distance based on the zone IDs
    const seed = (parseInt(originId) * 10000 + parseInt(destinationId)) % 10000 / 10000;
    return 1 + seed * 29; // Distance between 1 and 30 units
  }
  
  /**
   * Combine purpose-specific matrices into one total matrix
   */
  private combineTripMatrices(tripMatrices: Record<string, any>) {
    const totalMatrix = {};
    const purposes = Object.keys(tripMatrices);
    
    // Initialize matrix
    for (const purpose of purposes) {
      const matrix = tripMatrices[purpose];
      
      for (const origin in matrix) {
        if (!totalMatrix[origin]) {
          totalMatrix[origin] = {};
        }
        
        for (const destination in matrix[origin]) {
          if (!totalMatrix[origin][destination]) {
            totalMatrix[origin][destination] = 0;
          }
          
          totalMatrix[origin][destination] += matrix[origin][destination];
        }
      }
    }
    
    return totalMatrix;
  }
}

/**
 * Mode Choice Component
 * 
 * Handles the third step of the four-step model:
 * splitting trips between available transportation modes.
 */
export class ModeChoice {
  private parameters: ModelParameters;
  private assumptions: any;

  constructor(parameters: ModelParameters, assumptions: any) {
    this.parameters = parameters;
    this.assumptions = assumptions;
  }

  /**
   * Execute mode choice calculations
   * @param tripDistData Results from the trip distribution step
   * @returns Modal splits by origin-destination pair
   */
  public async execute(tripDistData: any) {
    console.log('Executing mode choice model...');
    
    const totalTripMatrix = tripDistData.totalTripMatrix;
    const constants = this.parameters.mode_choice.constants;
    const coefficients = this.parameters.mode_choice.coefficients;
    
    // Available modes
    const modes = ['car', 'transit', 'walk', 'bike'];
    
    // Modal utility adjustments from scenario assumptions
    const modeAdjustments = this.assumptions.mode_choice || {};
    
    // Initialize results object
    const modalSplits = {};
    const tripsByMode = {};
    
    // Initialize trips by mode
    for (const mode of modes) {
      tripsByMode[mode] = 0;
    }
    
    // Calculate mode choice for each O-D pair
    for (const origin in totalTripMatrix) {
      modalSplits[origin] = {};
      
      for (const destination in totalTripMatrix[origin]) {
        modalSplits[origin][destination] = {};
        
        // Skip if no trips
        if (totalTripMatrix[origin][destination] <= 0) continue;
        
        // Calculate utilities for each mode
        const utilities = {};
        let sumExp = 0;
        
        for (const mode of modes) {
          // Calculate base utility
          let utility = constants[mode] || 0;
          
          // Add travel time utility component
          const travelTime = this.calculateTravelTime(origin, destination, mode);
          utility += coefficients.travel_time * travelTime;
          
          // Add travel cost utility component
          const travelCost = this.calculateTravelCost(origin, destination, mode);
          utility += coefficients.travel_cost * travelCost;
          
          // Add scenario-specific adjustments
          if (modeAdjustments[mode]) {
            utility += modeAdjustments[mode];
          }
          
          // Store utility and add to denominator
          utilities[mode] = utility;
          sumExp += Math.exp(utility);
        }
        
        // Calculate mode probabilities using logit model
        const totalTrips = totalTripMatrix[origin][destination];
        
        for (const mode of modes) {
          const probability = Math.exp(utilities[mode]) / sumExp;
          const trips = totalTrips * probability;
          
          modalSplits[origin][destination][mode] = probability;
          tripsByMode[mode] += trips;
        }
      }
    }
    
    // Calculate overall mode shares
    const totalTrips = Object.values(tripsByMode).reduce((a, b) => a + b, 0);
    const modeShares = {};
    
    for (const mode of modes) {
      modeShares[mode] = totalTrips > 0 ? tripsByMode[mode] / totalTrips : 0;
    }
    
    return {
      modalSplits,
      modeShares,
      tripsByMode,
      tripDistData
    };
  }
  
  /**
   * Calculate travel time between zones by mode
   */
  private calculateTravelTime(originId: string, destinationId: string, mode: string) {
    // In a real implementation, this would use actual travel time calculations
    // For demonstration, we're using simplified estimates
    
    // Calculate a base distance
    const distance = this.calculateDistance(originId, destinationId);
    
    // Define relative speeds by mode (car = 1.0)
    const relativeSpeed = {
      car: 1.0,
      transit: 0.5,
      bike: 0.3,
      walk: 0.1
    };
    
    // Apply mode-specific adjustments from scenario assumptions
    let speedAdjustment = 1.0;
    
    if (this.assumptions.speeds && this.assumptions.speeds[mode]) {
      speedAdjustment = this.assumptions.speeds[mode];
    }
    
    // Calculate time in minutes
    const time = distance / (relativeSpeed[mode] * speedAdjustment) * 10;
    
    return time;
  }
  
  /**
   * Calculate travel cost between zones by mode
   */
  private calculateTravelCost(originId: string, destinationId: string, mode: string) {
    // In a real implementation, this would use actual cost calculations
    // For demonstration, we're using simplified estimates
    
    // Calculate a base distance
    const distance = this.calculateDistance(originId, destinationId);
    
    // Define relative costs by mode (per distance unit)
    const baseCost = {
      car: 0.5,  // $ per distance unit
      transit: 0.2,
      bike: 0.05,
      walk: 0.0
    };
    
    // Apply cost adjustments from scenario assumptions
    let costAdjustment = 1.0;
    
    if (this.assumptions.costs && this.assumptions.costs[mode]) {
      costAdjustment = this.assumptions.costs[mode];
    }
    
    // Calculate cost in dollars
    const cost = distance * baseCost[mode] * costAdjustment;
    
    return cost;
  }
  
  /**
   * Calculate distance between zones (simplified)
   */
  private calculateDistance(originId: string, destinationId: string) {
    // Same simplified distance calculator as in trip distribution
    // In a real implementation, this would use network distances
    
    // Create a stable "random" distance based on the zone IDs
    const seed = (parseInt(originId) * 10000 + parseInt(destinationId)) % 10000 / 10000;
    return 1 + seed * 29; // Distance between 1 and 30 units
  }
}

/**
 * Network Assignment Component
 * 
 * Handles the fourth step of the four-step model:
 * assigning trips to the transportation network.
 */
export class NetworkAssignment {
  private networkData: any;
  private parameters: ModelParameters;

  constructor(networkData: any, parameters: ModelParameters) {
    this.networkData = networkData;
    this.parameters = parameters;
  }

  /**
   * Execute network assignment calculations
   * @param modeChoiceData Results from the mode choice step
   * @returns Link volumes and travel times
   */
  public async execute(modeChoiceData: any) {
    console.log('Executing network assignment model...');
    
    const modalSplits = modeChoiceData.modalSplits;
    const totalTripMatrix = modeChoiceData.tripDistData.totalTripMatrix;
    const alpha = this.parameters.assignment.volume_delay_parameters.alpha;
    const beta = this.parameters.assignment.volume_delay_parameters.beta;
    const maxIterations = this.parameters.assignment.max_iterations;
    const convergenceCriteria = this.parameters.assignment.convergence_criteria;
    
    // Extract network components
    const links = this.networkData.links;
    const nodes = this.networkData.nodes;
    const linkCapacities = this.networkData.linkCapacities;
    const linkFreeFlowTimes = this.networkData.linkFreeFlowTimes;
    
    // Initialize link volumes
    const linkVolumes = {};
    for (const linkId in links) {
      linkVolumes[linkId] = 0;
    }
    
    // Initialize link travel times with free flow times
    const linkTravelTimes = { ...linkFreeFlowTimes };
    
    // Calculate paths between all O-D pairs
    // In a real implementation, this would use a proper routing algorithm
    const paths = this.calculatePaths(totalTripMatrix, links, nodes);
    
    // Iterative assignment process
    let iteration = 0;
    let convergence = 1.0;
    let previousLinkVolumes = { ...linkVolumes };
    
    while (iteration < maxIterations && convergence > convergenceCriteria) {
      // Reset link volumes for this iteration
      for (const linkId in linkVolumes) {
        linkVolumes[linkId] = 0;
      }
      
      // Assign trips to links
      for (const origin in totalTripMatrix) {
        for (const destination in totalTripMatrix[origin]) {
          // Get total trips between this O-D pair
          const totalTrips = totalTripMatrix[origin][destination];
          
          if (totalTrips <= 0) continue;
          
          // Get car mode share for this O-D pair
          const carShare = modalSplits[origin]?.[destination]?.car || 0.5; // Default to 50% if missing
          const carTrips = totalTrips * carShare;
          
          // Get path for this O-D pair
          const path = paths[`${origin}-${destination}`];
          
          if (path && path.length > 0) {
            // Assign car trips to each link in the path
            for (const linkId of path) {
              linkVolumes[linkId] += carTrips;
            }
          }
        }
      }
      
      // Update link travel times using BPR function
      for (const linkId in links) {
        const volume = linkVolumes[linkId];
        const capacity = linkCapacities[linkId];
        const freeFlowTime = linkFreeFlowTimes[linkId];
        
        // BPR volume-delay function
        linkTravelTimes[linkId] = freeFlowTime * (1 + alpha * Math.pow(volume / capacity, beta));
      }
      
      // Calculate convergence
      let sumSquaredDiff = 0;
      let sumSquaredVol = 0;
      
      for (const linkId in linkVolumes) {
        const diff = linkVolumes[linkId] - previousLinkVolumes[linkId];
        sumSquaredDiff += diff * diff;
        sumSquaredVol += linkVolumes[linkId] * linkVolumes[linkId];
      }
      
      convergence = sumSquaredVol > 0 ? Math.sqrt(sumSquaredDiff / sumSquaredVol) : 0;
      
      // Store volumes for next iteration
      previousLinkVolumes = { ...linkVolumes };
      
      // Increment iteration counter
      iteration++;
      
      console.log(`Assignment iteration ${iteration}: convergence = ${convergence.toFixed(4)}`);
    }
    
    console.log(`Network assignment completed after ${iteration} iterations`);
    
    // Return assignment results
    return {
      linkVolumes,
      linkTravelTimes,
      linkCapacities: this.networkData.linkCapacities,
      linkFreeFlowTimes: this.networkData.linkFreeFlowTimes,
      linkLengths: this.networkData.linkLengths,
      linkTypes: this.networkData.linkTypes,
      linkGeometries: this.networkData.linkGeometries,
      iterations: iteration,
      convergence
    };
  }
  
  /**
   * Calculate shortest paths between O-D pairs
   * 
   * Note: In a real implementation, this would use a proper shortest path algorithm
   * like Dijkstra's or A*. This is a simplified placeholder.
   */
  private calculatePaths(tripMatrix: any, links: any, nodes: any) {
    const paths = {};
    
    // For each O-D pair
    for (const origin in tripMatrix) {
      for (const destination in tripMatrix[origin]) {
        if (origin === destination) {
          // Intrazonal trips don't use the network
          paths[`${origin}-${destination}`] = [];
          continue;
        }
        
        // Generate a simplified path (placeholder)
        // In a real implementation, this would use a proper routing algorithm
        paths[`${origin}-${destination}`] = this.generateSimplifiedPath(origin, destination, links);
      }
    }
    
    return paths;
  }
  
  /**
   * Generate a simplified path between origin and destination
   * 
   * Note: This is a placeholder that creates a somewhat stable "random" path
   * In a real implementation, a proper routing algorithm would be used
   */
  private generateSimplifiedPath(originId: string, destinationId: string, links: any) {
    const path = [];
    const numLinks = Object.keys(links).length;
    
    // Create a stable seed from origin and destination IDs
    const baseSeed = (parseInt(originId) * 10000 + parseInt(destinationId)) % 10000 / 10000;
    
    // Determine number of links in the path (3-10 links)
    const pathLength = 3 + Math.floor(baseSeed * 7);
    
    // Generate semi-random link IDs for the path
    // In a real implementation, these would be actual link IDs forming a connected path
    for (let i = 0; i < pathLength; i++) {
      // Create a somewhat stable link ID based on i, origin, and destination
      const seed = (baseSeed * 10000 + i * 1000) % 10000 / 10000;
      const linkIndex = Math.floor(seed * numLinks);
      const linkId = Object.keys(links)[linkIndex % numLinks];
      
      path.push(linkId);
    }
    
    return path;
  }
} 