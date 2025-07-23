import { NetworkAssignment } from '../model-components';
import { ModelParameters } from '@/types/camp';
// import { ProcessedNode, ProcessedEdge } from '../road-network-importer'; // Removed as unused for now

async function runNetworkAssignmentTest() {
  console.log("--- Starting Network Assignment Test ---");

  // 1. Define Bounding Box for the study area (e.g., a small part of SF)
  const testBoundingBox = {
    minLat: 37.770,
    minLon: -122.420,
    maxLat: 37.780,
    maxLon: -122.410,
  };

  // 2. Define Mock Zone Data
  const mockZoneGeometries = {
    'zone1': { type: 'Point', coordinates: [-122.419, 37.771] }, // SW area
    'zone2': { type: 'Point', coordinates: [-122.411, 37.779] }, // NE area
    'zone3': { type: 'Point', coordinates: [-122.415, 37.775] }, // Central
  };

  const mockZones = {
    'zone1': { id: 'zone1', name: 'Zone 1 SW', centroid: { lat: 37.771, lon: -122.419 } },
    'zone2': { id: 'zone2', name: 'Zone 2 NE', centroid: { lat: 37.779, lon: -122.411 } },
    'zone3': { id: 'zone3', name: 'Zone 3 Central', centroid: { lat: 37.775, lon: -122.415 } },
  };
  
  // 3. Define Mock Trip Matrix (Total trips between zones)
  const mockTotalTripMatrix = {
    'zone1': {
      'zone2': 500, // Trips from Zone 1 to Zone 2
      'zone3': 300, // Trips from Zone 1 to Zone 3
    },
    'zone2': {
      'zone1': 100, // Trips from Zone 2 to Zone 1 (return)
    }
  };

  // 4. Define Mock Modal Splits (assuming 100% car for simplicity in this road network test)
  const mockModalSplits = {};
  for (const origin in mockTotalTripMatrix) {
    mockModalSplits[origin] = {};
    for (const destination in mockTotalTripMatrix[origin]) {
      mockModalSplits[origin][destination] = {
        car: 1.0, // 100% car
        transit: 0.0,
        walk: 0.0,
        bike: 0.0,
      };
    }
  }
  
  // 5. Define Model Parameters
  const mockModelParameters: ModelParameters = {
    // project_name and scenario_name might not be strictly part of ModelParameters, but often useful context.
    // Let's assume they are not for strict type adherence for now if they cause issues.
    // Based on src/types/camp.ts, these are not directly in ModelParameters but in higher-level structs.
    // ModelParameters itself (around line 563) has specific structures:
    trip_generation: { production_rates: {}, attraction_rates: {} }, // Provide empty required structures
    trip_distribution: { friction_factors: {}, k_factors: {} },   // Provide empty required structures
    mode_choice: { constants: {}, coefficients: {} },           // Provide empty required structures
    assignment: {
      // study_area_bbox: testBoundingBox, // Removed as it's not in ModelParameters.assignment type
      volume_delay_parameters: {
        alpha: 0.15,
        beta: 4.0,
      },
      max_iterations: 5,
      convergence_criteria: 0.01,
    },
    // analysis_year and other top-level items also seem not part of this specific ModelParameters type
  };

  // 6. Prepare Mock Network Data
  const mockNetworkData = {
    boundingBox: testBoundingBox, // Pass boundingBox here for initializeNetwork
  };

  // 7. Prepare Mock Mode Choice Data structure
  const mockModeChoiceData = {
    modalSplits: mockModalSplits,
    tripDistData: {
      totalTripMatrix: mockTotalTripMatrix,
      tripGenData: {
        zones: mockZones,
        zoneGeometries: mockZoneGeometries,
      },
    },
  };

  // 8. Instantiate and Run NetworkAssignment
  try {
    const networkAssignment = new NetworkAssignment(mockNetworkData, mockModelParameters);
    
    console.log("Executing network assignment (will fetch from OSM and initialize network if needed)...");
    const assignmentResults = await networkAssignment.execute(mockModeChoiceData);

    console.log("\n--- Network Assignment Results ---");
    if (assignmentResults.error) {
        console.error("Assignment failed:", assignmentResults.error);
    } else {
        console.log("Final Link Volumes (Top 20 by volume):");
        const sortedVolumes = Object.entries(assignmentResults.linkVolumes || {})
            .sort(([,a],[,b]) => b-a)
            .slice(0, 20);
        sortedVolumes.forEach(([linkId, volume]) => {
            console.log(`  Link ${linkId}: ${volume.toFixed(2)} trips`);
        });

        console.log("\nFinal Link Travel Times (for same Top 20 links):");
        sortedVolumes.forEach(([linkId]) => {
            const time = (assignmentResults.linkTravelTimes || {})[linkId];
            if (time !== undefined) {
                console.log(`  Link ${linkId}: ${time.toFixed(2)} seconds`);
            }
        });
        
        // Further checks:
        const totalInputTrips = Object.values(mockTotalTripMatrix).reduce((sum, dests) => 
            sum + Object.values(dests).reduce((s, t) => s + t, 0), 0);
        console.log(`\nTotal input car trips: ${totalInputTrips}`);

        // Note: Summing assigned volumes on links is tricky because one trip uses multiple links.
        // A better check might be path-based analysis if paths were stored.
    }

  } catch (error) {
    console.error("Error during network assignment test:", error);
  }

  console.log("\n--- Network Assignment Test Finished ---");
}

runNetworkAssignmentTest();

// To run this test (assuming you have ts-node and necessary dependencies):
// Option 1: Modify tsconfig.json - "module": "CommonJS" (temporarily)
//   npx ts-node src/lib/camp/tests/network-assignment.test.ts
// Option 2: Use ESM loader with Node.js (if "module": "esnext" in tsconfig.json)
//   Make sure ts-node is installed globally or locally: npm install -D ts-node
//   Make sure your package.json has "type": "module" or rename file to .mts
//   node --loader ts-node/esm src/lib/camp/tests/network-assignment.test.ts

// To run this test (assuming you have ts-node and necessary dependencies):
// 1. Ensure tsconfig.json has "module": "CommonJS" (temporarily, or use esm loader)
//    npx ts-node src/lib/camp/tests/network-assignment.test.ts
// 2. If using ESM ("module": "esnext" in tsconfig.json):
//    node --loader ts-node/esm src/lib/camp/tests/network-assignment.test.ts
//    (Make sure ts-node is installed: npm install -D ts-node)
//    You might also need to ensure 'type: module' is in package.json or use .mts extension. 