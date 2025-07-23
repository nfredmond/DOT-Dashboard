import { ModelParameters } from '@/types/camp';
import { fetchAndProcessRoadNetwork, ProcessedRoadNetwork, ProcessedNode, ProcessedEdge } from './road-network-importer';
import { createGraphFromRoadNetwork, EdgeData, getEdgeCapacity, getEdgeFreeFlowTime } from './graph-utils';
import { aStar, PathFinderOptions } from 'ngraph.path'; // Using aStar, dijkstra is also an option
import { Graph, Link as NgLink, Node as NgNode } from 'ngraph.graph'; // Renamed to avoid conflict with DOM types

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
    const tripsByPurpose: Record<string, Record<string, number>> = {};
    
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
        kFactors[purpose]
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
    frictionFactorsForPurpose: number[],
    kFactorsForOrigin?: Record<string, number>
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
        const frictionFactor = this.getFrictionFactor(distance, frictionFactorsForPurpose);
        
        // Apply K-factors (socioeconomic or spatial adjustment factors) - now origin-specific
        const kFactor = kFactorsForOrigin?.[origin] || 1.0;
        
        // Calculate distribution factor
        const factor = attractions[destination] * frictionFactor * kFactor;
        factorsByDest[destination] = factor;
        sumFactors += factor;
      }
      
      // Calculate intra-zonal trips with special treatment
      const intrazonalFriction = this.getFrictionFactor(1, frictionFactorsForPurpose) * 0.5; // Adjust for intra-zonal
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
    const tripsByMode: Record<string, number> = {};
    
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
        const totalTrips: number = totalTripMatrix[origin][destination];
        
        for (const mode of modes) {
          const probability = Math.exp(utilities[mode]) / sumExp;
          const trips = totalTrips * probability;
          
          modalSplits[origin][destination][mode] = probability;
          tripsByMode[mode] += trips;
        }
      }
    }
    
    // Calculate overall mode shares
    const totalTrips: number = Object.values(tripsByMode).reduce((a: number, b: number) => a + b, 0);
    const modeShares: Record<string, number> = {};
    
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
  private networkData: any; // Should ideally be typed e.g., { links, nodes, linkCapacities, ..., boundingBox: {minLat, ...} }
  private parameters: ModelParameters;
  private roadNetworkGraph: Graph<ProcessedNode, EdgeData> | null = null;
  private osmNodeMap: Map<number, ProcessedNode> = new Map(); // To store OSM nodes from the graph for quick lookup

  constructor(networkData: any, parameters: ModelParameters) {
    this.networkData = networkData; // Expect this to contain bounding box: { minLat, minLon, maxLat, maxLon }
    this.parameters = parameters;
  }

  /**
   * Initializes the underlying road network graph by fetching OSM data and building the graph.
   * This should be called before pathfinding operations.
   */
  public async initializeNetwork(): Promise<void> {
    if (this.roadNetworkGraph) {
      console.log("Road network graph already initialized.");
      return;
    }

    // Assuming networkData contains the bounding box for the study area
    // TODO: Define a proper type for networkData and ensure boundingBox is present
    const bbox = this.networkData.boundingBox; // Rely solely on networkData for bbox
    if (!bbox || !bbox.minLat || !bbox.minLon || !bbox.maxLat || !bbox.maxLon) {
      console.error("Bounding box for road network is not defined in networkData. Cannot initialize network.");
      throw new Error("Bounding box for road network is not defined.");
    }

    console.log(`Initializing road network for bbox: [${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}]`);

    const processedNetwork: ProcessedRoadNetwork | null = await fetchAndProcessRoadNetwork(
      bbox.minLat,
      bbox.minLon,
      bbox.maxLat,
      bbox.maxLon
    );

    if (processedNetwork) {
      this.roadNetworkGraph = createGraphFromRoadNetwork(processedNetwork, true); // true for travel time as weight
      // Populate osmNodeMap for quick access to node data (e.g., lat/lon for heuristics)
      processedNetwork.nodes.forEach(node => {
        this.osmNodeMap.set(node.id, node);
      });
      console.log("Road network graph successfully initialized and built.");
    } else {
      console.error("Failed to fetch and process road network. Graph not built.");
      throw new Error("Failed to initialize road network graph.");
    }
  }

  /**
   * Execute network assignment calculations
   * @param modeChoiceData Results from the mode choice step
   * @returns Link volumes and travel times
   */
  public async execute(modeChoiceData: any) {
    console.log('Executing network assignment model...');
    
    // Ensure the network graph is initialized
    if (!this.roadNetworkGraph) {
      await this.initializeNetwork();
    }
    if (!this.roadNetworkGraph) { // Check again after attempting initialization
        console.error("Network graph failed to initialize. Aborting network assignment.");
        // Return a structure indicating failure or throw
        return { error: "Network graph initialization failed" }; 
    }
    
    const modalSplits = modeChoiceData.modalSplits;
    const totalTripMatrix = modeChoiceData.tripDistData.totalTripMatrix;
    const tripGenData = modeChoiceData.tripDistData.tripGenData; // Extract tripGenData

    const alpha = this.parameters.assignment.volume_delay_parameters.alpha;
    const beta = this.parameters.assignment.volume_delay_parameters.beta;
    const maxIterations = this.parameters.assignment.max_iterations;
    const convergenceCriteria = this.parameters.assignment.convergence_criteria;
    
    // These are from the old networkData structure, may not be directly used if paths are from OSM graph
    const links = this.networkData.links; 
    const linkCapacities = this.networkData.linkCapacities; // Will be replaced by getEdgeCapacity
    const linkFreeFlowTimes = this.networkData.linkFreeFlowTimes; // Will be replaced by getEdgeFreeFlowTime
    
    const linkVolumes: Record<string, number> = {}; // Keyed by ProcessedEdge.id
    // Initialize linkVolumes based on the edges in the new roadNetworkGraph
    // Create a map for easy lookup of ProcessedEdge objects by their ID
    const edgeMap: Map<string, ProcessedEdge> = new Map();
    this.roadNetworkGraph.forEachLink(link => {
        if (link.data && link.data.originalEdge) {
            const edge = link.data.originalEdge;
            edgeMap.set(edge.id, edge);
            linkVolumes[edge.id] = 0; // Initialize volume for this edge
        }
    });
    
    // const linkTravelTimes = { ...(linkFreeFlowTimes || {}) }; // Old way
    const linkTravelTimes: Record<string, number> = {}; // Keyed by ProcessedEdge.id
    edgeMap.forEach(edge => {
        linkTravelTimes[edge.id] = getEdgeFreeFlowTime(edge); // Initialize with free-flow time
    });
    
    // console.log("Calculating paths using the new road network graph..."); // Moved inside loop
    // const paths = this.calculatePaths(totalTripMatrix, this.roadNetworkGraph, this.osmNodeMap, tripGenData); // Moved inside loop
    
    let iteration = 0;
    let convergence = 1.0;
    let previousLinkVolumes = { ...linkVolumes };
    
    while (iteration < maxIterations && convergence > convergenceCriteria) {
      // Reset link volumes for this iteration
      for (const linkId in linkVolumes) {
        linkVolumes[linkId] = 0;
      }

      // Recalculate paths based on current linkTravelTimes
      console.log(`Iteration ${iteration + 1}: Recalculating paths with updated travel times...`);
      const paths = this.calculatePaths(totalTripMatrix, this.roadNetworkGraph, this.osmNodeMap, tripGenData, linkTravelTimes);
      
      for (const origin in totalTripMatrix) {
        for (const destination in totalTripMatrix[origin]) {
          const totalTrips = totalTripMatrix[origin][destination];
          if (totalTrips <= 0) continue;
          const carShare = modalSplits[origin]?.[destination]?.car || 0.5; // Default car share if not specified
          const carTrips = totalTrips * carShare;
          const pathInfo = paths[`${origin}-${destination}`]; 
          
          if (pathInfo && pathInfo.linkIds && pathInfo.linkIds.length > 0) {
            for (const linkId of pathInfo.linkIds) { // linkId is ProcessedEdge.id
              if (linkVolumes[linkId] !== undefined) {
                linkVolumes[linkId] += carTrips;
              } else {
                // This might happen if a path contains an edge not initially in edgeMap (e.g. if graph was modified)
                // Or if path linkIds are somehow malformed. For now, warn.
                console.warn(`Link ID ${linkId} from path not found in linkVolumes during assignment. This indicates a mismatch or an edge not in the initial graph scan.`);
              }
            }
          }
        }
      }
      
      // Update link travel times using BPR formula based on ProcessedEdge properties
      for (const linkId of edgeMap.keys()) { // Iterate over all known edges from the graph
        const edge = edgeMap.get(linkId);
        if (edge) {
            const volume = linkVolumes[linkId] || 0; // Default to 0 if no volume assigned
            const capacity = getEdgeCapacity(edge);
            const freeFlowTime = getEdgeFreeFlowTime(edge);
            
            if (capacity > 0) { // Avoid division by zero for zero capacity links
                 linkTravelTimes[linkId] = freeFlowTime * (1 + alpha * Math.pow(volume / capacity, beta));
            } else {
                 linkTravelTimes[linkId] = freeFlowTime * (1 + alpha * Math.pow(volume / 0.1, beta)); // Handle zero capacity: use a nominal small capacity
                 // Or assign a very high travel time if capacity is truly zero (e.g. closed road)
                 // linkTravelTimes[linkId] = Infinity; 
            }
        } else {
            // This should not happen if edgeMap.keys() is used
            console.warn(`Edge with ID ${linkId} not found in edgeMap during BPR calculation.`);
        }
      }
      
      let sumSquaredDiff = 0;
      let sumSquaredVol = 0;
      for (const linkId in linkVolumes) {
        const diff = linkVolumes[linkId] - (previousLinkVolumes[linkId] || 0);
        sumSquaredDiff += diff * diff;
        sumSquaredVol += linkVolumes[linkId] * linkVolumes[linkId];
      }
      convergence = sumSquaredVol > 0 ? Math.sqrt(sumSquaredDiff / sumSquaredVol) : 0;
      previousLinkVolumes = { ...linkVolumes };
      iteration++;
      console.log(`Assignment iteration ${iteration}: convergence = ${convergence.toFixed(4)}`);
    }
    
    console.log(`Network assignment completed after ${iteration} iterations`);
    
    return {
      linkVolumes,
      linkTravelTimes,
      // ... (other return data, ensure consistency with new network structure or map back)
    };
  }
  
  private calculatePaths(
    tripMatrix: any, 
    graph: Graph<ProcessedNode, EdgeData>, 
    osmNodeMap: Map<number, ProcessedNode>,
    tripGenData?: { zones: any, zoneGeometries: any },
    currentLinkTravelTimes?: Record<string, number> // Added currentLinkTravelTimes
  ) {
    const paths: Record<string, { path: NgNode<ProcessedNode>[], linkIds: string[] }> = {};
    
    // Heuristic function for A* (Haversine distance)
    const heuristic = (fromNodeData: ProcessedNode | undefined, toNodeData: ProcessedNode | undefined): number => {
      if (!fromNodeData || !toNodeData) return Infinity;
      // Simple Haversine distance (you might have a utility for this already)
      const R = 6371e3; // Earth radius in meters
      const lat1 = fromNodeData.lat * Math.PI / 180;
      const lat2 = toNodeData.lat * Math.PI / 180;
      const deltaLat = (toNodeData.lat - fromNodeData.lat) * Math.PI / 180;
      const deltaLon = (toNodeData.lon - fromNodeData.lon) * Math.PI / 180;
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Heuristic needs to be in the same unit as edge weights if directly comparable, or just guide search
    };

    // Distance function for A* (reads weight from edge data or current travel times)
    const distance = (fromNodeData: ProcessedNode | undefined, toNodeData: ProcessedNode | undefined, link: NgLink<EdgeData>): number => {
      if (currentLinkTravelTimes && currentLinkTravelTimes[link.data.originalEdge.id] !== undefined) {
        return Math.max(currentLinkTravelTimes[link.data.originalEdge.id], 0.1); // Use current, ensure positive
      }
      return Math.max(link.data.weight, 0.1); // Fallback to initial free-flow weight, ensure positive
    };

    for (const originZoneId in tripMatrix) {
      for (const destinationZoneId in tripMatrix[originZoneId]) {
        if (originZoneId === destinationZoneId) {
          paths[`${originZoneId}-${destinationZoneId}`] = { path: [], linkIds: [] };
          continue;
        }

        const startNodeId = findNearestGraphNode(originZoneId, osmNodeMap, tripGenData); // Pass tripGenData
        const endNodeId = findNearestGraphNode(destinationZoneId, osmNodeMap, tripGenData); // Pass tripGenData

        if (startNodeId === null || endNodeId === null) {
          console.warn(`Could not find network nodes for O-D pair: ${originZoneId} to ${destinationZoneId}`);
          paths[`${originZoneId}-${destinationZoneId}`] = { path: [], linkIds: [] };
          continue;
        }
        
        // Ensure nodes exist in the graph before pathfinding
        if (!graph.getNode(startNodeId) || !graph.getNode(endNodeId)) {
            console.warn(`Start or end node for O-D pair ${originZoneId}-${destinationZoneId} not in graph. Start: ${startNodeId}, End: ${endNodeId}`);
            paths[`${originZoneId}-${destinationZoneId}`] = { path: [], linkIds: [] };
            continue;
        }

        const pathOptions: PathFinderOptions<ProcessedNode, EdgeData> = {
          oriented: true, // Respect oneway streets
          heuristic: (fromNode, toNode) => heuristic(graph.getNode(fromNode.id)?.data, graph.getNode(toNode.id)?.data),
          distance: (fromNode, toNode, link) => distance(graph.getNode(fromNode.id)?.data, graph.getNode(toNode.id)?.data, link),
        };

        try {
            const pathfinder = aStar(graph, pathOptions);
            const foundPath: NgNode<ProcessedNode>[] = pathfinder.find(startNodeId, endNodeId);

            // Convert path of NgNode objects to list of link IDs (original OSM way segment IDs)
            const linkIds: string[] = [];
            if (foundPath.length > 0) {
                for (let i = 0; i < foundPath.length - 1; i++) {
                    const fromGraphNode = foundPath[i];
                    const toGraphNode = foundPath[i+1];
                    let foundLink = false;
                    // Find the link in the graph that connects these two nodes in the path direction
                    graph.forEachLinkedNode(fromGraphNode.id, (linkedNode, link) => {
                        if (linkedNode.id === toGraphNode.id) {
                            // This is the link used in the path from fromGraphNode to toGraphNode
                            linkIds.push(link.data.originalEdge.id); // Use the unique ID from ProcessedEdge
                            foundLink = true;
                            return true; // Break from forEachLinkedNode for this node
                        }
                    }, true); // true for outgoing links only, respecting path direction
                    if(!foundLink){
                        // This case should ideally not happen if aStar returns a valid path from graph links
                        // console.warn(`Could not find connecting link in graph for path segment: ${fromGraphNode.id} -> ${toGraphNode.id}`);
                    }
                }
            }
            paths[`${originZoneId}-${destinationZoneId}`] = { path: foundPath, linkIds };
        } catch (e) {
            console.error(`Error finding path for ${originZoneId} to ${destinationZoneId}:`, e);
            paths[`${originZoneId}-${destinationZoneId}`] = { path: [], linkIds: [] };
        }
      }
    }
    return paths;
  }

  // Remove or comment out the old generateSimplifiedPath method as it's replaced
  /*
  private generateSimplifiedPath(originId: string, destinationId: string, links: any) {
    // ... old placeholder code ...
  }
  */
}

// Helper function to calculate Haversine distance between two lat/lon points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const radLat1 = lat1 * Math.PI / 180;
  const radLat2 = lat2 * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Placeholder: robustly finding the nearest network node to a zone/point is complex
// This would involve spatial indexing (e.g., k-d tree) of graph nodes for efficiency.
// For now, it mock-returns a node ID or null.
// NOTE: This needs to be implemented properly based on how zones map to network nodes.
function findNearestGraphNode(
  zoneId: string, 
  osmNodeMap: Map<number, ProcessedNode>,
  zoneData?: { zones: any, zoneGeometries: any } // Make zoneData optional for now
): number | null {
  if (osmNodeMap.size === 0) {
    console.warn(`No nodes in osmNodeMap for findNearestGraphNode with zone ${zoneId}`);
    return null;
  }

  let zoneLat: number | undefined;
  let zoneLon: number | undefined;

  if (zoneData && zoneData.zoneGeometries && zoneData.zoneGeometries[zoneId]) {
    const geometry = zoneData.zoneGeometries[zoneId];
    // Attempt to extract a representative point from the geometry
    // This is a simplified approach; robust centroid calculation for various GeoJSON types is more involved.
    if (geometry.type === 'Point' && geometry.coordinates) {
      zoneLon = geometry.coordinates[0];
      zoneLat = geometry.coordinates[1];
    } else if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
      // Use the first point of the first ring as a rough proxy
      zoneLon = geometry.coordinates[0][0][0];
      zoneLat = geometry.coordinates[0][0][1];
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
      // Use the first point of the first ring of the first polygon
      zoneLon = geometry.coordinates[0][0][0][0];
      zoneLat = geometry.coordinates[0][0][0][1];
    } else if (zoneData.zones && zoneData.zones[zoneId] && zoneData.zones[zoneId].centroid) {
        // Fallback to an explicit centroid if provided in zone attributes
        zoneLat = zoneData.zones[zoneId].centroid.lat;
        zoneLon = zoneData.zones[zoneId].centroid.lon;
    }
  }

  if (zoneLat !== undefined && zoneLon !== undefined) {
    let nearestNodeId: number | null = null;
    let minDistance = Infinity;

    for (const [nodeId, nodeData] of osmNodeMap.entries()) {
      const distance = haversineDistance(zoneLat, zoneLon, nodeData.lat, nodeData.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNodeId = nodeId;
      }
    }
    if (nearestNodeId !== null) {
      console.log(`findNearestGraphNode for zone ${zoneId} (at ${zoneLat.toFixed(4)}, ${zoneLon.toFixed(4)}): mapped to OSM node ${nearestNodeId} (distance: ${minDistance.toFixed(0)}m)`);
      return nearestNodeId;
    } else {
      console.warn(`Could not find any nodes in osmNodeMap, though it's not empty. This is unexpected for zone ${zoneId}.`);
    }
  } else {
    console.warn(`Could not determine coordinates for zone ${zoneId}. Falling back to mock selection.`);
    // Fallback to previous mock behavior if no coordinates found
    const availableNodeIds = Array.from(osmNodeMap.keys());
    const numericZoneId = parseInt(zoneId, 10) || 0;
    const fallbackNodeId = availableNodeIds[numericZoneId % availableNodeIds.length];
    console.log(`Mock findNearestGraphNode for zone ${zoneId} (no coords): mapped to OSM node ${fallbackNodeId}`);
    return fallbackNodeId;
  }
  
  return null; // Should be unreachable if osmNodeMap is not empty
} 