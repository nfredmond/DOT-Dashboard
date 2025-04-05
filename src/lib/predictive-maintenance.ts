import { runAgentQuery, AgentType } from "./ai-assistance";

// Asset types that can be monitored
export type AssetType = 
  | 'bridge'
  | 'road'
  | 'signal'
  | 'culvert'
  | 'sign'
  | 'lighting'
  | 'transit-stop'
  | 'transit-vehicle'
  | 'bike-lane'
  | 'sidewalk';

// Maintenance priority levels
export type PriorityLevel = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'scheduled';

// Status of a maintenance item
export type MaintenanceStatus = 
  | 'pending'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'deferred';

// Asset with maintenance information
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  installedDate: string;
  lastInspection?: string;
  lastMaintenance?: string;
  condition: number; // 0-100 scale
  description?: string;
  metadata?: Record<string, any>;
}

// Maintenance prediction for an asset
export interface MaintenancePrediction {
  id: string;
  assetId: string;
  assetName?: string;
  assetType?: AssetType;
  failureProbability: number; // 0-1 scale
  timeToFailure: number; // days
  recommendedAction: string;
  priority: PriorityLevel;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
  status: MaintenanceStatus;
  notes?: string;
}

/**
 * Get all assets for an organization with their maintenance status
 */
export async function getAssets(organizationId?: string): Promise<Asset[]> {
  // This would be a database call in production
  
  // Mock data
  const assets: Asset[] = [
    {
      id: "asset-1",
      name: "Main Street Bridge",
      type: "bridge",
      location: {
        latitude: 38.9072,
        longitude: -77.0369,
        address: "Main St & River Rd"
      },
      installedDate: "2005-06-15",
      lastInspection: "2023-02-10",
      lastMaintenance: "2022-08-23",
      condition: 78,
      description: "Steel truss bridge over Potomac tributary"
    },
    {
      id: "asset-2",
      name: "5th & Oak Traffic Signal",
      type: "signal",
      location: {
        latitude: 38.9032,
        longitude: -77.0329,
        address: "5th Ave & Oak St"
      },
      installedDate: "2018-03-22",
      lastInspection: "2023-01-15",
      lastMaintenance: "2022-11-05",
      condition: 92,
      description: "Smart traffic signal with pedestrian countdown"
    },
    {
      id: "asset-3",
      name: "Highway 101 Segment 37-42",
      type: "road",
      location: {
        latitude: 38.8977,
        longitude: -77.0365
      },
      installedDate: "2008-09-30",
      lastInspection: "2022-12-05",
      lastMaintenance: "2020-07-12",
      condition: 64,
      description: "Asphalt highway segment with high traffic volume"
    },
    {
      id: "asset-4",
      name: "North District Culvert System",
      type: "culvert",
      location: {
        latitude: 38.9122,
        longitude: -77.0444,
        address: "Watershed Park Area"
      },
      installedDate: "2012-04-18",
      lastInspection: "2022-10-20",
      lastMaintenance: "2021-05-30",
      condition: 72,
      description: "Concrete box culvert system for stormwater management"
    },
    {
      id: "asset-5",
      name: "Downtown Transit Hub Bike Racks",
      type: "bike-lane",
      location: {
        latitude: 38.9011,
        longitude: -77.0312,
        address: "Central Plaza"
      },
      installedDate: "2019-08-12",
      lastInspection: "2023-03-01",
      lastMaintenance: "2022-09-15",
      condition: 95,
      description: "Protected bike lane with green thermoplastic markings"
    }
  ];
  
  return assets;
}

/**
 * Get maintenance predictions for assets
 */
export async function getMaintenancePredictions(
  assetIds?: string[],
  organizationId?: string
): Promise<MaintenancePrediction[]> {
  // In production, this would query a predictive model or database
  
  // Mock predictions
  const predictions: MaintenancePrediction[] = [
    {
      id: "pred-1",
      assetId: "asset-1",
      assetName: "Main Street Bridge",
      assetType: "bridge",
      failureProbability: 0.23,
      timeToFailure: 120,
      recommendedAction: "Inspect bridge joints and replace worn bearings",
      priority: "medium",
      estimatedCost: 12500,
      createdAt: "2023-07-01T12:00:00Z",
      updatedAt: "2023-07-01T12:00:00Z",
      status: "pending"
    },
    {
      id: "pred-2",
      assetId: "asset-2",
      assetName: "5th & Oak Traffic Signal",
      assetType: "signal",
      failureProbability: 0.78,
      timeToFailure: 45,
      recommendedAction: "Replace control board and update firmware",
      priority: "high",
      estimatedCost: 3200,
      createdAt: "2023-07-01T12:00:00Z",
      updatedAt: "2023-07-01T12:00:00Z",
      status: "scheduled"
    },
    {
      id: "pred-3",
      assetId: "asset-3",
      assetName: "Highway 101 Segment 37-42",
      assetType: "road",
      failureProbability: 0.35,
      timeToFailure: 90,
      recommendedAction: "Mill and overlay surface with polymer-modified asphalt",
      priority: "medium",
      estimatedCost: 175000,
      createdAt: "2023-07-01T12:00:00Z",
      updatedAt: "2023-07-01T12:00:00Z",
      status: "pending"
    },
    {
      id: "pred-4",
      assetId: "asset-4",
      assetName: "North District Culvert System",
      assetType: "culvert",
      failureProbability: 0.85,
      timeToFailure: 30,
      recommendedAction: "Clear debris and repair damaged sections",
      priority: "high",
      estimatedCost: 8700,
      createdAt: "2023-07-01T12:00:00Z",
      updatedAt: "2023-07-01T12:00:00Z",
      status: "in-progress"
    },
    {
      id: "pred-5",
      assetId: "asset-5",
      assetName: "Downtown Transit Hub Bike Racks",
      assetType: "bike-lane",
      failureProbability: 0.12,
      timeToFailure: 180,
      recommendedAction: "Refresh lane markings and inspect bollards",
      priority: "low",
      estimatedCost: 1200,
      createdAt: "2023-07-01T12:00:00Z",
      updatedAt: "2023-07-01T12:00:00Z",
      status: "pending"
    }
  ];
  
  // Filter by asset IDs if provided
  if (assetIds && assetIds.length > 0) {
    return predictions.filter(pred => assetIds.includes(pred.assetId));
  }
  
  return predictions;
}

/**
 * Get a detailed maintenance analysis for an asset
 */
export async function getAssetMaintenanceAnalysis(assetId: string): Promise<string> {
  // Get asset details
  const assets = await getAssets();
  const asset = assets.find(a => a.id === assetId);
  
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  
  // Get predictions for this asset
  const predictions = await getMaintenancePredictions([assetId]);
  const prediction = predictions[0];
  
  // Generate an analysis using AI
  try {
    const response = await runAgentQuery({
      prompt: `Generate a detailed maintenance analysis for ${asset.name} (${asset.type}). 
      Asset condition is ${asset.condition}/100. Last inspection was on ${asset.lastInspection || 'unknown'}. 
      Failure probability is ${prediction ? prediction.failureProbability : 'unknown'}.`,
      agentType: AgentType.MAINTENANCE,
      context: {
        asset,
        prediction
      }
    });
    
    return response.content;
  } catch (error) {
    console.error('Error generating maintenance analysis:', error);
    return `Could not generate analysis for ${asset.name}. Please try again later.`;
  }
}

/**
 * Schedule maintenance for an asset
 */
export async function scheduleAssetMaintenance(
  assetId: string, 
  date: string,
  notes?: string
): Promise<boolean> {
  // In production, this would update the database
  
  console.log(`Scheduled maintenance for asset ${assetId} on ${date}`);
  console.log(`Notes: ${notes || 'N/A'}`);
  
  // Mock success
  return true;
}

/**
 * Update the status of a maintenance prediction
 */
export async function updateMaintenanceStatus(
  predictionId: string,
  status: MaintenanceStatus
): Promise<boolean> {
  // In production, this would update the database
  
  console.log(`Updated maintenance prediction ${predictionId} status to ${status}`);
  
  // Mock success
  return true;
} 