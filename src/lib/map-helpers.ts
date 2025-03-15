/**
 * Helper functions for map services
 */

// Simple environment variable getter to avoid circular dependencies
export function getEnvVariable(key: string, defaultValue: string = ""): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  if (typeof window !== 'undefined') {
    try {
      // Try to get from localStorage if available
      const storedValue = localStorage.getItem(`env_${key}`);
      if (storedValue) return storedValue;
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  return defaultValue;
}

// Check if a map provider is configured
export function isMapProviderConfigured(provider: 'mapbox' | 'maptiler' | 'carto'): boolean {
  switch (provider) {
    case 'mapbox':
      return !!getEnvVariable('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
    case 'maptiler':
      return !!getEnvVariable('NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN');
    case 'carto':
      return true; // CARTO always available as fallback
    default:
      return false;
  }
}

// Tile layer options interface
export interface TileLayerOptions {
  url: string;
  attribution: string;
  accessToken?: string;
} 