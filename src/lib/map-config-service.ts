import { TileLayerOptions } from "./map-helpers";
import { getMapTiles, getMapboxStyleById } from "./map-service";

// Types for Map Settings
export interface MapProviderConfig {
  id: string;
  name: string;
  provider: 'mapbox' | 'maptiler' | 'carto' | 'osm' | 'custom';
  apiKey?: string;
  isEnabled: boolean;
  isDefault?: boolean;
  customUrl?: string;
  customAttribution?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  baseMap: string;
  baseMapProvider?: string;
  isDefault: boolean;
  assignedTo: UserOrAgency[];
  layers: MapLayer[];
}

export interface UserOrAgency {
  id: string;
  name: string;
  type: 'user' | 'agency';
}

export interface MapLayer {
  id: string;
  name: string;
  description: string;
  type: 'kmz' | 'custom' | 'external';
  url?: string;
  visible: boolean;
  fileInfo?: {
    name: string;
    size: number;
    uploadDate: string;
  };
}

// Default providers
const defaultMapProviders: MapProviderConfig[] = [
  {
    id: "mapbox",
    name: "Mapbox",
    provider: "mapbox",
    apiKey: "",
    isEnabled: true,
    isDefault: true
  },
  {
    id: "maptiler",
    name: "MapTiler",
    provider: "maptiler",
    apiKey: "",
    isEnabled: false,
    isDefault: false
  },
  {
    id: "carto",
    name: "CARTO",
    provider: "carto",
    isEnabled: true,
    isDefault: false
  },
  {
    id: "osm",
    name: "OpenStreetMap",
    provider: "osm",
    isEnabled: true,
    isDefault: false
  },
  {
    id: "custom",
    name: "Custom Provider",
    provider: "custom",
    isEnabled: false,
    isDefault: false,
    customUrl: "https://{s}.tile.example.com/{z}/{x}/{y}.png",
    customAttribution: "© Custom Map Provider"
  }
];

// Default maps
const defaultMaps: MapDefinition[] = [
  {
    id: "1",
    name: "Default Map",
    description: "Standard map for all transportation projects",
    baseMap: "cartoVoyager",
    isDefault: true,
    assignedTo: [
      { id: "all", name: "All Users", type: "user" }
    ],
    layers: [
      {
        id: "1",
        name: "Highway Network",
        description: "Major highways and freeways",
        type: "custom",
        visible: true,
      },
      {
        id: "2",
        name: "Transit Routes",
        description: "Bus and rail transit lines",
        type: "kmz",
        visible: true,
        fileInfo: {
          name: "transit_routes.kmz",
          size: 1024 * 1024, // 1MB
          uploadDate: "2023-07-01",
        }
      }
    ]
  },
  {
    id: "2",
    name: "Caltrans Regional Map",
    description: "Specialized map for Caltrans District 4",
    baseMap: "mapboxSatellite",
    isDefault: false,
    assignedTo: [
      { id: "agency1", name: "Caltrans District 4", type: "agency" }
    ],
    layers: [
      {
        id: "3",
        name: "District Boundaries",
        description: "Caltrans district boundary lines",
        type: "kmz",
        visible: true,
        fileInfo: {
          name: "district_boundaries.kmz",
          size: 2048 * 1024, // 2MB
          uploadDate: "2023-06-15",
        }
      }
    ]
  }
];

/**
 * Get map providers configuration
 */
export function getMapProviders(): MapProviderConfig[] {
  if (typeof window === 'undefined') {
    return defaultMapProviders;
  }

  try {
    const stored = localStorage.getItem('mapProviders');
    return stored ? JSON.parse(stored) : defaultMapProviders;
  } catch (error) {
    console.error('Error loading map providers:', error);
    return defaultMapProviders;
  }
}

/**
 * Save map providers configuration
 */
export function saveMapProviders(providers: MapProviderConfig[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('mapProviders', JSON.stringify(providers));
  } catch (error) {
    console.error('Error saving map providers:', error);
  }
}

/**
 * Get map definitions
 */
export function getMaps(): MapDefinition[] {
  if (typeof window === 'undefined') {
    return defaultMaps;
  }

  try {
    const stored = localStorage.getItem('mapDefinitions');
    return stored ? JSON.parse(stored) : defaultMaps;
  } catch (error) {
    console.error('Error loading map definitions:', error);
    return defaultMaps;
  }
}

/**
 * Save map definitions
 */
export function saveMaps(maps: MapDefinition[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('mapDefinitions', JSON.stringify(maps));
  } catch (error) {
    console.error('Error saving map definitions:', error);
  }
}

/**
 * Update the global default base map for all maps
 * @param baseMapType The base map type ID (e.g., "cartoVoyager")
 * @param updateAllMaps Whether to update all maps or just the default map
 * @returns The updated maps array
 */
export function updateDefaultBaseMap(baseMapType: string, updateAllMaps: boolean = false): MapDefinition[] {
  const maps = getMaps();
  let updatedMaps: MapDefinition[];
  
  if (updateAllMaps) {
    // Update all maps to use the new base map type
    updatedMaps = maps.map(map => ({
      ...map,
      baseMap: baseMapType
    }));
  } else {
    // Only update the default map
    updatedMaps = maps.map(map => 
      map.isDefault ? { ...map, baseMap: baseMapType } : map
    );
  }
  
  // Save the updated maps
  saveMaps(updatedMaps);
  return updatedMaps;
}

/**
 * Get map for a specific user or agency
 * @param userId User ID
 * @param agencyId Agency ID (optional)
 * @returns Map definition to use
 */
export function getMapForUser(userId: string, agencyId?: string): MapDefinition {
  const maps = getMaps();
  
  // First, look for maps specifically assigned to this user
  let userMap = maps.find(map => 
    map.assignedTo.some(assignee => 
      assignee.id === userId && assignee.type === 'user'
    )
  );
  
  // If not found and agencyId is provided, look for agency-specific maps
  if (!userMap && agencyId) {
    userMap = maps.find(map => 
      map.assignedTo.some(assignee => 
        assignee.id === agencyId && assignee.type === 'agency'
      )
    );
  }
  
  // If still not found, use the default map
  if (!userMap) {
    userMap = maps.find(map => map.isDefault);
  }
  
  // If no default map is set, use the first available map
  return userMap || maps[0];
}

/**
 * Get the tile layer configuration for a map (Leaflet)
 * This extends the regular map service by using the map configuration
 */
export function getTileLayerForMap(mapId: string): TileLayerOptions {
  const maps = getMaps();
  const map = maps.find(m => m.id === mapId);
  
  if (!map) {
    // Return CARTO Voyager tiles as default if map not found
    return {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    };
  }
  
  // For custom provider
  if (map.baseMap === 'custom') {
    const providers = getMapProviders();
    const customProvider = providers.find(p => p.provider === 'custom');
    
    if (customProvider && customProvider.customUrl) {
      return {
        url: customProvider.customUrl,
        attribution: customProvider.customAttribution || '© Custom Map Provider'
      };
    }
    
    // Fallback to CARTO Voyager if custom provider is not properly configured
    return {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    };
  }
  
  // Use the map service to get the tile configuration
  const mapTiles = getMapTiles();
  return mapTiles[map.baseMap] || mapTiles.cartoVoyager;
}

/**
 * Get Mapbox style URL for a map 
 * @param mapId Map ID
 * @returns The style URL to use with Mapbox GL
 */
export function getMapboxStyleForMap(mapId: string): string {
  const maps = getMaps();
  const providers = getMapProviders();
  const map = maps.find(m => m.id === mapId);
  
  if (!map) {
    // Return CARTO Voyager as default if map not found
    return "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
  }
  
  // Get API keys from enabled providers
  const apiKeys: Record<string, string> = {};
  providers.forEach(provider => {
    if (provider.isEnabled && provider.apiKey) {
      apiKeys[provider.provider] = provider.apiKey;
    }
  });
  
  // Get style URL for the selected baseMap
  const style = getMapboxStyleById(map.baseMap, apiKeys);
  
  // If style found, return its URL
  if (style) {
    return style.url;
  }
  
  // For custom provider
  if (map.baseMap === 'custom') {
    const customProvider = providers.find(p => p.provider === 'custom');
    if (customProvider && customProvider.isEnabled) {
      // For custom raster source, create a style JSON
      // This is simplified - in a real app, you'd generate full style JSON
      return JSON.stringify({
        version: 8,
        sources: {
          'custom-raster': {
            type: 'raster',
            tiles: [customProvider.customUrl],
            tileSize: 256,
            attribution: customProvider.customAttribution
          }
        },
        layers: [
          {
            id: 'custom-raster-layer',
            type: 'raster',
            source: 'custom-raster',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      });
    }
  }
  
  // Fallback to CARTO Voyager if style not found
  return "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
} 