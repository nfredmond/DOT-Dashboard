import { createClient } from '@/lib/supabase/client';

// Define map tile sources interface for Leaflet (keep for backward compatibility)
export interface MapTileSource {
  id: string;
  name: string;
  url: string;
  maxZoom: number;
  attribution: string;
  type: 'raster' | 'vector';
}

// Define Mapbox style interface
export interface MapboxStyleOption {
  id: string;
  value: string;
  label: string;
  url: string;
  provider: string;
  preview?: string;
}

// Default map tile sources (Leaflet format for backward compatibility)
const DEFAULT_MAP_TILES: Record<string, { url: string, attribution: string }> = {
  'openStreetMap': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  'cartoPositron': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CARTO'
  },
  'cartoDarkMatter': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors, © CARTO'
  },
  'cartoVoyager': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', 
    attribution: '© OpenStreetMap contributors, © CARTO'
  }
};

// Default Mapbox styles
const DEFAULT_MAPBOX_STYLES: MapboxStyleOption[] = [
  {
    id: 'openStreetMap',
    value: 'openStreetMap',
    label: 'OpenStreetMap',
    url: 'https://api.maptiler.com/maps/openstreetmap/style.json?key={key}',
    provider: 'osm',
    preview: '/map-previews/osm.png'
  },
  {
    id: 'cartoPositron',
    value: 'cartoPositron',
    label: 'CARTO Positron',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    provider: 'carto',
    preview: '/map-previews/positron.png'
  },
  {
    id: 'cartoDarkMatter',
    value: 'cartoDarkMatter',
    label: 'CARTO Dark Matter',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    provider: 'carto',
    preview: '/map-previews/dark-matter.png'
  },
  {
    id: 'cartoVoyager',
    value: 'cartoVoyager',
    label: 'CARTO Voyager',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    provider: 'carto',
    preview: '/map-previews/voyager.png'
  },
  {
    id: 'mapboxStreets',
    value: 'mapboxStreets',
    label: 'Mapbox Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-streets.png'
  },
  {
    id: 'mapboxOutdoors',
    value: 'mapboxOutdoors',
    label: 'Mapbox Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v12',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-outdoors.png'
  },
  {
    id: 'mapboxLight',
    value: 'mapboxLight',
    label: 'Mapbox Light',
    url: 'mapbox://styles/mapbox/light-v11',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-light.png'
  },
  {
    id: 'mapboxDark',
    value: 'mapboxDark',
    label: 'Mapbox Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-dark.png'
  },
  {
    id: 'mapboxSatellite',
    value: 'mapboxSatellite',
    label: 'Mapbox Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-satellite.png'
  },
  {
    id: 'mapboxSatelliteStreets',
    value: 'mapboxSatelliteStreets',
    label: 'Mapbox Satellite Streets',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    provider: 'mapbox',
    preview: '/map-previews/mapbox-satellite-streets.png'
  }
];

/**
 * Get available map tile sources (Leaflet format for backward compatibility)
 */
export function getMapTiles(): Record<string, { url: string, attribution: string }> {
  return DEFAULT_MAP_TILES;
}

/**
 * Get the default map type
 */
export function getDefaultMapType(): string {
  return 'cartoPositron';
}

/**
 * Get all available map types as select options
 */
export function getAvailableMapTypes(): { value: string, label: string }[] {
  return Object.keys(DEFAULT_MAP_TILES).map(key => ({
    value: key,
    label: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
  }));
}

/**
 * Get all available Mapbox styles
 */
export function getMapboxStyles(apiKeys: Record<string, string> = {}): MapboxStyleOption[] {
  // Replace API key placeholders in style URLs
  return DEFAULT_MAPBOX_STYLES.map(style => {
    let url = style.url;
    
    // Replace {key} placeholders with actual API keys based on provider
    if (style.provider && apiKeys[style.provider]) {
      url = url.replace('{key}', apiKeys[style.provider]);
    }
    
    return {
      ...style,
      url
    };
  });
}

/**
 * Get a Mapbox style by ID
 */
export function getMapboxStyleById(styleId: string, apiKeys: Record<string, string> = {}): MapboxStyleOption | undefined {
  const styles = getMapboxStyles(apiKeys);
  return styles.find(style => style.id === styleId);
}

/**
 * Get the default Mapbox style URL
 */
export function getDefaultMapboxStyleUrl(): string {
  return DEFAULT_MAPBOX_STYLES.find(style => style.id === 'cartoVoyager')?.url || 
    'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
}

// Define simplified GeoJSON types
interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Fetches zone geometry data for a scenario
 */
export async function fetchZoneGeometry(scenarioId: string): Promise<GeoJSONCollection> {
  const supabase = createClient();
  
  try {
    // First get the organization ID from the scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('organization_id')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Fetch zone data for the organization
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .eq('organization_id', scenario?.organization_id as string);
    
    if (zonesError) throw zonesError;
    
    // Convert to GeoJSON format
    const features: GeoJSONFeature[] = zones.map(zone => {
      // Parse geometry from the database
      let geometry: GeoJSONGeometry;
      
      try {
        if (typeof zone.geometry === 'string') {
          geometry = JSON.parse(zone.geometry);
        } else if (zone.geometry && typeof zone.geometry === 'object') {
          geometry = zone.geometry as GeoJSONGeometry;
        } else {
          // Default geometry
          geometry = {
            type: 'Point',
            coordinates: [0, 0]
          };
        }
      } catch (e) {
        console.error('Error parsing zone geometry:', e);
        // Default to a point if geometry is invalid
        geometry = {
          type: 'Point',
          coordinates: [0, 0]
        };
      }
      
      return {
        type: 'Feature',
        properties: {
          id: zone.id,
          zone_id: zone.id,
          name: zone.name || '',
          description: zone.description || '',
          area: zone.area || 0,
          population: zone.population || 0,
          employment: zone.employment || 0
        },
        geometry
      };
    });
    
    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error fetching zone geometry:', error);
    // Return empty feature collection if error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

/**
 * Fetches network link geometry data for a scenario
 */
export async function fetchNetworkGeometry(scenarioId: string): Promise<GeoJSONCollection> {
  const supabase = createClient();
  
  try {
    // First get the organization ID from the scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('organization_id')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Fetch network link data for the organization
    const { data: links, error: linksError } = await supabase
      .from('network_links')
      .select('*')
      .eq('organization_id', scenario?.organization_id as string);
    
    if (linksError) throw linksError;
    
    // Convert to GeoJSON format
    const features: GeoJSONFeature[] = links.map(link => {
      // Parse geometry from the database
      let geometry: GeoJSONGeometry;
      
      try {
        if (typeof link.geometry === 'string') {
          geometry = JSON.parse(link.geometry);
        } else if (link.geometry && typeof link.geometry === 'object') {
          geometry = link.geometry as GeoJSONGeometry;
        } else {
          // Default geometry
          geometry = {
            type: 'LineString',
            coordinates: [[0, 0], [0, 0]]
          };
        }
      } catch (e) {
        console.error('Error parsing link geometry:', e);
        // Default to a linestring if geometry is invalid
        geometry = {
          type: 'LineString',
          coordinates: [[0, 0], [0, 0]]
        };
      }
      
      return {
        type: 'Feature',
        properties: {
          id: link.id,
          link_id: link.id,
          name: link.name || '',
          description: link.description || '',
          length: link.length || 0,
          capacity: link.capacity || 0,
          speed_limit: link.speed_limit || 0,
          link_type: link.link_type || ''
        },
        geometry
      };
    });
    
    return {
      type: 'FeatureCollection',
      features
    };
  } catch (error) {
    console.error('Error fetching network geometry:', error);
    // Return empty feature collection if error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

/**
 * Gets a color for a value based on a min-max range and color scheme
 */
export function getColorForValue(
  value: number, 
  min: number, 
  max: number, 
  colorScheme: 'red' | 'green' | 'blue' = 'blue'
): string {
  // Normalize value to 0-1 range
  const normalizedValue = max === min ? 0.5 : (value - min) / (max - min);
  
  // Red color scheme (higher values are red - for negative metrics like congestion)
  if (colorScheme === 'red') {
    if (normalizedValue >= 0.8) return '#ef4444';
    if (normalizedValue >= 0.6) return '#f97316';
    if (normalizedValue >= 0.4) return '#facc15';
    if (normalizedValue >= 0.2) return '#a3e635';
    return '#22c55e';
  }
  
  // Green color scheme (higher values are green - for positive metrics like transit share)
  if (colorScheme === 'green') {
    if (normalizedValue >= 0.8) return '#22c55e';
    if (normalizedValue >= 0.6) return '#a3e635';
    if (normalizedValue >= 0.4) return '#facc15';
    if (normalizedValue >= 0.2) return '#f97316';
    return '#ef4444';
  }
  
  // Blue color scheme (higher values are darker blue - neutral)
  if (normalizedValue >= 0.8) return '#1e40af';
  if (normalizedValue >= 0.6) return '#3b82f6';
  if (normalizedValue >= 0.4) return '#60a5fa';
  if (normalizedValue >= 0.2) return '#93c5fd';
  return '#bfdbfe';
} 