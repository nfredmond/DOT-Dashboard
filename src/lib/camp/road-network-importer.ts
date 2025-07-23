import { overpass, OverpassJson, OverpassOptions } from 'overpass-ts';

// --- Configuration ---
const OVERPASS_API_ENDPOINT = 'https://overpass-api.de/api/interpreter'; // A public endpoint
const APP_USER_AGENT = 'PlanningManager/1.0 (Web; your-contact-email@example.com)'; // TODO: Update with actual contact

// --- Types for our processed data ---

/**
 * Represents a processed node (intersection or point on a road)
 */
export interface ProcessedNode {
  id: number; // OSM Node ID
  lat: number;
  lon: number;
}

/**
 * Represents a processed edge (road segment) connecting two nodes
 */
export interface ProcessedEdge {
  id: string; // Custom ID, e.g., `osmWayId-startNodeId-endNodeId`
  osmWayId: number; // Original OSM Way ID
  startNodeId: number;
  endNodeId: number;
  lengthMeters: number; // Length of the segment in meters
  travelTimeSeconds: number; // Estimated travel time in seconds
  isOneway: boolean;
  name?: string; // Road name, if available
  maxSpeedKmh?: number; // Max speed in km/h, if available
  highwayType: string; // Added: The OSM highway classification (e.g., "primary", "residential")
}

export interface ProcessedRoadNetwork {
  nodes: ProcessedNode[];
  edges: ProcessedEdge[];
}

// --- Helper Functions ---

/**
 * Calculates the Haversine distance between two lat/lon points.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius of Earth in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimates travel time for a road segment.
 * @param lengthMeters Length of the segment
 * @param maxSpeedKmh Max speed in km/h (optional)
 * @param defaultSpeedKmh Default speed if maxSpeed is not available
 * @returns Travel time in seconds
 */
function estimateTravelTime(lengthMeters: number, maxSpeedKmh?: number, defaultSpeedKmh = 50): number {
  const speedKmh = maxSpeedKmh && maxSpeedKmh > 0 ? maxSpeedKmh : defaultSpeedKmh;
  const speedMps = speedKmh * 1000 / 3600; // Convert km/h to m/s
  return lengthMeters / speedMps;
}

// --- Main Fetching and Processing Function ---

/**
 * Fetches road network data from OpenStreetMap for a given bounding box
 * and processes it into a structured format.
 *
 * @param minLat Minimum latitude of the bounding box
 * @param minLon Minimum longitude of the bounding box
 * @param maxLat Maximum latitude of the bounding box
 * @param maxLon Maximum longitude of the bounding box
 * @returns A promise that resolves to the processed road network data, or null if an error occurs.
 */
export async function fetchAndProcessRoadNetwork(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number
): Promise<ProcessedRoadNetwork | null> {
  const highwayTypes = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'living_street',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
  ];

  // Each way query will now explicitly include the bounding box coordinates
  const wayQueries = highwayTypes.map(type => `  way(${minLat},${minLon},${maxLat},${maxLon})[highway=${type}];`).join('\n');

  const query = `
    [out:json][timeout:90];
    (
${wayQueries}
    );
    out body;
    >;
    out skel qt;
  `;

  console.log("Overpass Query:", query);

  // According to overpass-ts README, retry options are valid.
  // However, if linter still flags them, they might be removed temporarily.
  const options: OverpassOptions = {
    endpoint: OVERPASS_API_ENDPOINT,
    userAgent: APP_USER_AGENT,
    verbose: true,
    // rateLimitRetries: 3, // Commented out due to persistent linter/type issue
    // rateLimitPause: 5000, // Commented out due to persistent linter/type issue
  };

  try {
    // Linter suggests overpass() might return a standard Response.
    // Let's treat it as such and then parse JSON.
    const response = await overpass(query, options);
    
    // Check if the response is okay (status 200-299)
    if (!response.ok) {
        console.error(`Overpass API request failed with status: ${response.status}`);
        try {
            const errorBody = await response.text();
            console.error("Error body:", errorBody);
        } catch (e) {
            console.error("Could not read error body from response.");
        }
        return null;
    }

    const result = await response.json() as OverpassJson;

    console.log("Overpass Result (parsed):", JSON.stringify(result, null, 2).substring(0, 1000) + "...");

    const processedNodes: ProcessedNode[] = [];
    const processedEdges: ProcessedEdge[] = [];
    const nodeMap = new Map<number, ProcessedNode>(); // For quick lookup

    // First pass: Collect all nodes
    result.elements.forEach(element => {
      if (element.type === 'node' && element.lat !== undefined && element.lon !== undefined) {
        const node: ProcessedNode = {
          id: element.id,
          lat: element.lat,
          lon: element.lon,
        };
        processedNodes.push(node);
        nodeMap.set(node.id, node);
      }
    });

    // Second pass: Process ways into edges
    result.elements.forEach(element => {
      if (element.type === 'way' && element.nodes && element.nodes.length >= 2) {
        const wayId = element.id;
        const wayTags = element.tags || {};
        const roadName = wayTags.name;
        const isOneway = wayTags.oneway === 'yes' || wayTags.oneway === 'true' || wayTags.oneway === '1';
        const highwayType = wayTags.highway || 'unknown'; // Get highway type
        
        let maxSpeed: number | undefined = undefined;
        if (wayTags.maxspeed) {
            const speedMatch = String(wayTags.maxspeed).match(/^\d+/); // Extract numeric part, ensure it's a string
            if (speedMatch) {
                maxSpeed = parseInt(speedMatch[0], 10);
            }
        }


        for (let i = 0; i < element.nodes.length - 1; i++) {
          const startNodeId = element.nodes[i];
          const endNodeId = element.nodes[i + 1];

          const startNode = nodeMap.get(startNodeId);
          const endNode = nodeMap.get(endNodeId);

          if (startNode && endNode) {
            const length = haversineDistance(startNode.lat, startNode.lon, endNode.lat, endNode.lon);
            const travelTime = estimateTravelTime(length, maxSpeed);

            processedEdges.push({
              id: `${wayId}-${startNodeId}-${endNodeId}`,
              osmWayId: wayId,
              startNodeId,
              endNodeId,
              lengthMeters: length,
              travelTimeSeconds: travelTime,
              isOneway,
              name: roadName,
              maxSpeedKmh: maxSpeed,
              highwayType: highwayType, // Populate highwayType
            });
          }
        }
      }
    });
    
    console.log(`Processed ${processedNodes.length} nodes and ${processedEdges.length} edges.`);

    return {
      nodes: processedNodes,
      edges: processedEdges,
    };

  } catch (error) {
    console.error("Error fetching or processing Overpass data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    // Further error details might be in error.cause if available
    return null;
  }
}

async function testFetch() {
  const minLat = 37.77, minLon = -122.42, maxLat = 37.78, maxLon = -122.41; // San Francisco test area
  console.log(`Fetching road network for bbox: [${minLat},${minLon},${maxLat},${maxLon}]`);
  const network = await fetchAndProcessRoadNetwork(minLat, minLon, maxLat, maxLon);
  if (network) {
    console.log(`Fetched ${network.nodes.length} nodes and ${network.edges.length} edges.`);
    // Optionally, log a few nodes and edges to inspect
    if (network.nodes.length > 0) {
        console.log("Sample node:", JSON.stringify(network.nodes[0], null, 2));
    }
    if (network.edges.length > 0) {
        console.log("Sample edge:", JSON.stringify(network.edges[0], null, 2));
    }
  } else {
    console.log("Failed to fetch network data.");
  }
}

// testFetch(); // Call the test function - REMOVING THIS CALL 