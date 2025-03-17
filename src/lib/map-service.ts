import { createClient } from '@/lib/supabase/client';

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
      .eq('organization_id', scenario.organization_id);
    
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
      .eq('organization_id', scenario.organization_id);
    
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