import { NextResponse } from 'next/server';
import logger from '../../../../lib/logger';


// Mock data for development
const mockLayers = {
  'transportation': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-122.4194, 37.7749],
            [-122.4184, 37.7749]
          ]
        },
        properties: {
          name: 'Main Street',
          type: 'road'
        }
      }
    ]
  },
  'buildings': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.4194, 37.7749],
            [-122.4184, 37.7749],
            [-122.4184, 37.7739],
            [-122.4194, 37.7739],
            [-122.4194, 37.7749]
          ]]
        },
        properties: {
          name: 'City Hall',
          type: 'government'
        }
      }
    ]
  },
  'transit_routes.kmz': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-122.4194, 37.7749],
            [-122.4184, 37.7749],
            [-122.4174, 37.7751],
            [-122.4164, 37.7754]
          ]
        },
        properties: {
          name: 'Transit Route 1',
          type: 'bus',
          routeNumber: '38'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-122.4150, 37.7890],
            [-122.4160, 37.7880],
            [-122.4170, 37.7870],
            [-122.4180, 37.7860]
          ]
        },
        properties: {
          name: 'Transit Route 2',
          type: 'rail',
          routeNumber: 'N'
        }
      }
    ]
  },
  'district_boundaries.kmz': {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.4194, 37.7749],
            [-122.4184, 37.7749],
            [-122.4184, 37.7739],
            [-122.4194, 37.7739],
            [-122.4194, 37.7749]
          ]]
        },
        properties: {
          name: 'District 4',
          type: 'administrative',
          districtNumber: '4'
        }
      }
    ]
  }
};

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const layerName = params.name;
    
    // Return mock data for development
    if (mockLayers[layerName as keyof typeof mockLayers]) {
      return NextResponse.json(mockLayers[layerName as keyof typeof mockLayers]);
    }

    // If layer not found in mock data
    return NextResponse.json(
      { error: 'Layer not found' },
      { status: 404 }
    );
  } catch (error) {
    logger.error('Error in layers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 