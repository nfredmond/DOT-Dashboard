import createGraph, { Graph } from 'ngraph.graph';
import { ProcessedRoadNetwork, ProcessedEdge, ProcessedNode } from './road-network-importer';

/**
 * Represents the data associated with an edge in the graph for pathfinding.
 */
export interface EdgeData {
  originalEdge: ProcessedEdge;
  weight: number; // Typically travel time in seconds or distance in meters
}

/**
 * Creates a graph suitable for pathfinding from processed road network data.
 *
 * @param roadNetwork The processed road network data (nodes and edges).
 * @param useTravelTimeAsWeight If true, edge weights will be travel time in seconds.
 *                              If false, edge weights will be length in meters.
 * @returns A graph instance from ngraph.graph.
 */
export function createGraphFromRoadNetwork(
  roadNetwork: ProcessedRoadNetwork,
  useTravelTimeAsWeight = true
): Graph<any, EdgeData> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const graph = createGraph<any, EdgeData>({ multigraph: true });

  // Add all nodes to the graph
  // While ngraph.graph can add nodes implicitly when adding edges,
  // explicitly adding them allows attaching data to nodes if needed in the future.
  roadNetwork.nodes.forEach((node: ProcessedNode) => {
    graph.addNode(node.id, node); // Store the original ProcessedNode data with the graph node
  });

  // Add all edges to the graph
  roadNetwork.edges.forEach((edge: ProcessedEdge) => {
    const weight = useTravelTimeAsWeight ? edge.travelTimeSeconds : edge.lengthMeters;
    
    const edgeData: EdgeData = {
      originalEdge: edge,
      weight: weight,
    };

    // Add the forward edge
    // ngraph.graph stores data on the link object itself, not as a third argument to addLink.
    // The link object can be retrieved after adding if needed, or we can store data directly if the pathfinder uses it.
    // For ngraph.path, the pathfinder function typically accepts a `weight` function that can access this data.
    graph.addLink(edge.startNodeId, edge.endNodeId, edgeData);

    // If the road is not oneway, add a reverse edge as well
    if (!edge.isOneway) {
      // Create a distinct EdgeData object for the reverse link if properties like originalEdge directionality matter
      // or if a pathfinder might modify edge data during its run.
      // For simple weight calculation, it might be the same, but good practice to separate.
      const reverseEdgeData: EdgeData = {
        originalEdge: { ...edge, startNodeId: edge.endNodeId, endNodeId: edge.startNodeId }, // Swap start/end for conceptual reverse
        weight: weight, // Weight is usually the same for reverse travel unless specific reverse penalties exist
      };
      graph.addLink(edge.endNodeId, edge.startNodeId, reverseEdgeData);
    }
  });

  console.log(`Graph created with ${graph.getNodesCount()} nodes and ${graph.getLinksCount()} links.`);
  return graph;
}

// Example of how a weight function for ngraph.path might look:
// This would typically be defined where the pathfinder is used.
/*
function getEdgeWeight(link: Link<EdgeData>): number {
  // Assuming link.data is populated correctly by graph.addLink with EdgeData
  if (link.data) {
    return link.data.weight;
  }
  // Fallback or error if edge data is missing, though addLink should ensure it's there
  return Infinity; 
}
*/ 

/**
 * Estimated capacities per lane per hour for different highway types.
 * These are illustrative and should be refined based on local standards or specific data.
 */
const ESTIMATED_CAPACITY_PER_LANE_PCH = {
  motorway: 2200,
  trunk: 2000,
  primary: 1800,
  secondary: 1400,
  tertiary: 1000,
  residential: 800,
  service: 600,
  unclassified: 800,
  road: 800,
  living_street: 400,
  default: 1000, // Default for unknown types
};

/**
 * Estimated number of lanes for different highway types if not explicitly tagged in OSM.
 * These are rough estimates.
 */
const ESTIMATED_LANES = {
  motorway: 3, // Typically 2-4+, median might be 3
  trunk: 2,
  primary: 2,
  secondary: 1, // Often 1 lane each way, or 2 lanes total for two-way roads
  tertiary: 1,
  residential: 1,
  service: 1,
  unclassified: 1,
  road: 1,
  living_street: 1,
  default: 1,
};

/**
 * Gets the estimated capacity for a given processed edge.
 * @param edge The ProcessedEdge object.
 * @returns Estimated capacity in vehicles per hour.
 */
export function getEdgeCapacity(edge: ProcessedEdge): number {
  const highwayType = edge.highwayType || 'default';
  const lanes = ESTIMATED_LANES[highwayType] || ESTIMATED_LANES.default;
  // If the edge is one-way, capacity is per direction. If two-way, this is total for the segment (shared).
  // For traffic assignment, we usually think of capacity per *directed* link.
  // If an edge represents a two-way street, the graph should have two opposing links,
  // each getting this directional capacity.
  const capacityPerLane = ESTIMATED_CAPACITY_PER_LANE_PCH[highwayType] || ESTIMATED_CAPACITY_PER_LANE_PCH.default;
  return capacityPerLane * lanes;
}

/**
 * Gets the free-flow travel time for an edge, ensuring it's not zero.
 * This is typically already calculated during road network import if using speed limits.
 * This function can serve as a fallback or a consistent way to access it.
 * @param edge The ProcessedEdge object.
 * @returns Free-flow travel time in seconds.
 */
export function getEdgeFreeFlowTime(edge: ProcessedEdge): number {
  // travelTimeSeconds on ProcessedEdge is already the free-flow time
  // Ensure it's a positive value to avoid division by zero in BPR or other models.
  return Math.max(edge.travelTimeSeconds, 0.1); // Minimum 0.1 seconds
} 