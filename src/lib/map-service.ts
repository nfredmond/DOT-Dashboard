import { getEnvVariable, isMapProviderConfigured, TileLayerOptions } from "./map-helpers";

/**
 * Get available map tile providers with their configuration
 * @returns Object with available map tile providers
 */
export function getMapTiles(): Record<string, TileLayerOptions> {
  return {
    // CARTO basemaps (always available, doesn't require API key)
    cartoPositron: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    cartoDarkMatter: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    cartoVoyager: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    
    // Mapbox basemaps (requires access token)
    ...(isMapProviderConfigured('mapbox') ? {
      mapboxStreets: {
        url: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '')
      },
      mapboxSatellite: {
        url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '')
      },
      mapboxLight: {
        url: "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token={accessToken}",
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '')
      }
    } : {}),
    
    // MapTiler basemaps (requires access token)
    ...(isMapProviderConfigured('maptiler') ? {
      maptilerStreets: {
        url: "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key={accessToken}",
        attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN', '')
      },
      maptilerSatellite: {
        url: "https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key={accessToken}",
        attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN', '')
      },
      maptilerOutdoors: {
        url: "https://api.maptiler.com/maps/outdoor/{z}/{x}/{y}.png?key={accessToken}",
        attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        accessToken: getEnvVariable('NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN', '')
      }
    } : {}),
    
    // Fallback to OSM if no token is available
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };
}

/**
 * Get available basemap options for UI dropdowns
 * @returns Array of available map types
 */
export function getAvailableMapTypes(): {value: string, label: string}[] {
  const mapTiles = getMapTiles();
  
  return Object.keys(mapTiles).map(key => {
    // Format the label for display (convert camelCase to Title Case with spaces)
    const label = key
      // Insert a space before all caps
      .replace(/([A-Z])/g, ' $1')
      // Replace first char with uppercase
      .replace(/^./, str => str.toUpperCase());
    
    return { value: key, label };
  });
}

/**
 * Get the default map type based on available providers
 * @returns Default map type key
 */
export function getDefaultMapType(): string {
  // Always default to CARTO Voyager as it doesn't require an API key
  return 'cartoVoyager';
} 