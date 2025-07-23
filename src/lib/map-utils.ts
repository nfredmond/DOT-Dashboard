/**
 * Map utilities that provide a global access point for Leaflet map instances
 * This helps solve cross-component access to map instances
 */

// MapInstance interface with minimal required operations
export interface MapInstance {
  setView: (center: [number, number], zoom: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  remove: () => void;
}

// Global store for map instances
let globalMapInstance: MapInstance | null = null;

/**
 * Register a map instance globally
 */
export function registerMapInstance(map: MapInstance): void {
  globalMapInstance = map;
  
  // Also register in window for direct script access
  if (typeof window !== 'undefined') {
    (window as any).leafletMapInstance = map;
    
    // Set up utility functions on window
    (window as any).leafletUtils = {
      zoomIn: () => {
        if (!map) return;
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom + 1);
          return true;
        } catch (error) {
          console.error('Error in zoomIn:', error);
          return false;
        }
      },
      
      zoomOut: () => {
        if (!map) return;
        try {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom - 1);
          return true;
        } catch (error) {
          console.error('Error in zoomOut:', error);
          return false;
        }
      },
      
      resetView: (center: [number, number], zoom: number) => {
        if (!map) return;
        try {
          map.setView(center, zoom);
          return true;
        } catch (error) {
          console.error('Error in resetView:', error);
          return false;
        }
      }
    };
    
    console.log('Map instance and utilities registered globally');
  }
}

/**
 * Get the current map instance
 */
export function getMapInstance(): MapInstance | null {
  // First try our internal reference
  if (globalMapInstance) {
    return globalMapInstance;
  }
  
  // Then try window properties if we're in browser
  if (typeof window !== 'undefined') {
    const windowAny = window as any;
    
    // Try different ways the map instance might be stored
    if (windowAny.leafletMapInstance) {
      globalMapInstance = windowAny.leafletMapInstance;
      return globalMapInstance;
    }
    
    if (windowAny._mapInstance) {
      globalMapInstance = windowAny._mapInstance;
      return globalMapInstance;
    }
    
    // Try to get from Leaflet's internal structures
    if (window.L?.map) {
      try {
        // Try map instances array
        if (window.L.map._mapInstances?.[0]) {
          globalMapInstance = window.L.map._mapInstances[0];
          return globalMapInstance;
        }
        
        // Try through container element
        const container = document.querySelector('.leaflet-container');
        if (container) {
          const leafletId = (container as any)._leaflet_id;
          if (leafletId && window.L.map._layers?.[leafletId]) {
            globalMapInstance = window.L.map._layers[leafletId];
            return globalMapInstance;
          }
        }
      } catch (error) {
        console.error('Error accessing Leaflet instance:', error);
      }
    }
  }
  
  return null;
}

/**
 * Helper function to zoom in
 */
export function zoomIn(): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for zoom in');
    return false;
  }
  
  try {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + 1);
    console.log('Zoomed in to level:', currentZoom + 1);
    return true;
  } catch (error) {
    console.error('Error zooming in:', error);
    return false;
  }
}

/**
 * Helper function to zoom out
 */
export function zoomOut(): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for zoom out');
    return false;
  }
  
  try {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom - 1);
    console.log('Zoomed out to level:', currentZoom - 1);
    return true;
  } catch (error) {
    console.error('Error zooming out:', error);
    return false;
  }
}

/**
 * Helper function to reset view
 */
export function resetView(center: [number, number], zoom: number): boolean {
  const map = getMapInstance();
  if (!map) {
    console.warn('Map instance not available for reset view');
    return false;
  }
  
  try {
    map.setView(center, zoom);
    console.log('Reset view to center:', center, 'zoom:', zoom);
    return true;
  } catch (error) {
    console.error('Error resetting view:', error);
    return false;
  }
}

/**
 * Clean up map instance and utilities
 */
export function cleanupMapInstance(): void {
  globalMapInstance = null;
  
  if (typeof window !== 'undefined') {
    delete (window as any).leafletMapInstance;
    delete (window as any).leafletUtils;
  }
}

/**
 * Mapbox utility functions
 */
import mapboxgl, { AnimationOptions } from 'mapbox-gl';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import logger from './logger';

// Set the Mapbox token from environment variable
let mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/**
 * Initialize the Mapbox token, optionally with a custom token
 */
export function initMapboxToken(customToken?: string) {
  const token = customToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  if (!token) {
    console.warn('Mapbox token not set. Maps will not function correctly.');
    return;
  }
  
  mapboxToken = token;
  mapboxgl.accessToken = token;
}

/**
 * Interface for user map preferences
 */
export interface UserMapPreferences {
  mapStyle?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  enable3D?: boolean;
  mapboxToken?: string;
}

/**
 * Get map preferences for a specific user
 */
export function getUserMapPreferences(userId: string): UserMapPreferences | null {
  try {
    // In a real app, this would fetch from a database
    // For now, we'll just simulate with localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefs = localStorage.getItem(`map_prefs_${userId}`);
      if (prefs) {
        return JSON.parse(prefs);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user map preferences:', error);
    return null;
  }
}

/**
 * Save map preferences for a specific user
 */
export function saveUserMapPreferences(userId: string, preferences: UserMapPreferences): boolean {
  try {
    // In a real app, this would save to a database
    // For now, we'll just simulate with localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`map_prefs_${userId}`, JSON.stringify(preferences));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving user map preferences:', error);
    return false;
  }
}

/**
 * Enable 3D terrain on a map
 */
export function enable3DTerrain(map: mapboxgl.Map) {
  if (!map) return;
  
  map.on('style.load', () => {
    // Add terrain source if not already added
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
    }
    
    // Add sky layer for better visualization
    if (!map.getLayer('sky')) {
      map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });
    }
    
    // Set terrain for 3D effect
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
  });
}

/**
 * Fly to a location on the map with animation
 */
export function flyToLocation(map: mapboxgl.Map, lng: number, lat: number, zoom: number, options: Partial<AnimationOptions> = {}) {
  if (!map) return;
  
  map.flyTo({
    center: [lng, lat],
    zoom,
    essential: true, // Animation will happen even on slower devices
    ...options
  });
}

/**
 * Fit map bounds to a GeoJSON feature collection
 */
export function fitMapToBounds(map: mapboxgl.Map, geojson: FeatureCollection<Geometry, GeoJsonProperties>, padding: number | mapboxgl.PaddingOptions = 50) {
  if (!map || !geojson || !geojson.features || geojson.features.length === 0) return;

  try {
    // Get bounds from the GeoJSON data
    const bounds = new mapboxgl.LngLatBounds();
    
    geojson.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates;
        bounds.extend([coords[0], coords[1]]);
      } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiPoint') {
        feature.geometry.coordinates.forEach(coords => {
          bounds.extend([coords[0], coords[1]]);
        });
      } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
        feature.geometry.coordinates.forEach(ring => {
          ring.forEach(coords => {
            bounds.extend([coords[0], coords[1]]);
          });
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            ring.forEach(coords => {
              bounds.extend([coords[0], coords[1]]);
            });
          });
        });
      }
    });
    
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding });
    }
  } catch (error) {
    console.error('Error fitting map to bounds:', error);
  }
}

/**
 * Load GreenChAMP model results onto a map
 */
export async function loadGreenChampResults(map: mapboxgl.Map, modelId: string): Promise<boolean> {
  if (!map) return false;
  
  try {
    // Fetch model results
    const response = await fetch(`/api/models/greenchamp/${modelId}/results`);
    if (!response.ok) {
      throw new Error(`Failed to fetch GreenChAMP results: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add sources for model data
    map.addSource('greenchamp-network', {
      type: 'geojson',
      data: data.network
    });
    
    map.addSource('greenchamp-zones', {
      type: 'geojson',
      data: data.zones
    });
    
    // Add network layer
    map.addLayer({
      id: 'greenchamp-network-layer',
      type: 'line',
      source: 'greenchamp-network',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'volume'],
          0, '#00ff00',
          1000, '#ffff00',
          2000, '#ff8800',
          5000, '#ff0000'
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['get', 'volume'],
          0, 1,
          5000, 10
        ],
        'line-opacity': 0.8
      }
    });
    
    // Add zones layer
    map.addLayer({
      id: 'greenchamp-zones-layer',
      type: 'fill',
      source: 'greenchamp-zones',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'activityDensity'],
          0, '#f8f9fa',
          50, '#91e5ff',
          200, '#006699'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      }
    });
    
    // Fit map to the data extent
    fitMapToBounds(map, data.network);
    
    return true;
  } catch (error) {
    console.error('Error loading GreenChAMP results:', error);
    return false;
  }
}

/**
 * Load TrendNavigator scenario results onto a map
 */
export async function loadTrendNavigatorResults(map: mapboxgl.Map, scenarioId: string): Promise<boolean> {
  if (!map) return false;
  
  try {
    // Fetch scenario results
    const response = await fetch(`/api/scenarios/trend/${scenarioId}/results`);
    if (!response.ok) {
      throw new Error(`Failed to fetch TrendNavigator results: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add sources for scenario data
    map.addSource('trendnav-scenario', {
      type: 'geojson',
      data: data.geojson
    });
    
    // Add scenario layer
    map.addLayer({
      id: 'trendnav-scenario-layer',
      type: 'fill',
      source: 'trendnav-scenario',
      paint: {
        'fill-color': [
          'match',
          ['get', 'scenarioImpact'],
          'positive', '#00ff00',
          'neutral', '#ffff00',
          'negative', '#ff0000',
          '#808080' // default
        ],
        'fill-opacity': 0.6,
        'fill-outline-color': '#000000'
      }
    });
    
    // Add labels
    map.addLayer({
      id: 'trendnav-labels',
      type: 'symbol',
      source: 'trendnav-scenario',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
        'text-offset': [0, 0.5],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
    
    // Fit map to the data extent
    fitMapToBounds(map, data.geojson);
    
    return true;
  } catch (error) {
    console.error('Error loading TrendNavigator results:', error);
    return false;
  }
}

/**
 * Visualize integrated analysis results combining GreenChAMP, TrendNavigator, and Benefit-Cost analysis
 * 
 * @param map - The Mapbox map instance
 * @param modelId - GreenChAMP model ID
 * @param scenarioId - TrendNavigator scenario ID
 * @param analysisId - Benefit-Cost analysis ID
 * @returns Promise resolving to success status
 */
export async function visualizeIntegratedAnalysis(
  map: mapboxgl.Map, 
  modelId: string, 
  scenarioId: string, 
  analysisId: string
): Promise<boolean> {
  if (!map) return false;
  
  try {
    // Load data from all three sources
    await Promise.all([
      loadGreenChampResults(map, modelId),
      loadTrendNavigatorResults(map, scenarioId),
      visualizeBenefitCostOnMap(map, 'project-id', analysisId)
    ]);
    
    // Create a combined layer that shows intersections of high impact areas
    // This would create a heatmap layer showing areas with high benefits
    // from all three analysis methods
    if (map.getSource('integrated-analysis')) {
      map.removeSource('integrated-analysis');
    }
    
    if (map.getLayer('integrated-analysis-heatmap')) {
      map.removeLayer('integrated-analysis-heatmap');
    }
    
    // Fetch combined analysis results
    const response = await fetch(`/api/modeling/integrated-analysis?modelId=${modelId}&scenarioId=${scenarioId}&analysisId=${analysisId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch integrated analysis: ${response.statusText}`);
    }
    
    const combinedData = await response.json();
    
    // Add the combined data source
    map.addSource('integrated-analysis', {
      type: 'geojson',
      data: combinedData
    });
    
    // Add a heatmap layer to visualize the combined impact
    map.addLayer({
      id: 'integrated-analysis-heatmap',
      type: 'heatmap',
      source: 'integrated-analysis',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'combinedImpact'],
          0, 0,
          1, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 0, 255, 0)',
          0.2, 'rgba(0, 255, 255, 0.5)',
          0.4, 'rgba(0, 255, 0, 0.7)',
          0.6, 'rgba(255, 255, 0, 0.8)',
          0.8, 'rgba(255, 128, 0, 0.9)',
          1, 'rgba(255, 0, 0, 1)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        'heatmap-opacity': 0.8
      }
    });
    
    // Add a legend or popup functionality
    map.on('click', 'integrated-analysis-heatmap', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const coordinates = e.lngLat;
      const properties = e.features[0].properties;
      
      // Create popup content from the combined analysis data
      const content = `
        <div>
          <h3>Integrated Analysis</h3>
          <div><strong>Combined Impact Score:</strong> ${properties?.combinedImpact?.toFixed(2) || 'N/A'}</div>
          <div><strong>GreenChAMP:</strong> ${properties?.greenChampValue?.toFixed(2) || 'N/A'}</div>
          <div><strong>TrendNavigator:</strong> ${properties?.trendValue?.toFixed(2) || 'N/A'}</div>
          <div><strong>Benefit/Cost:</strong> ${properties?.benefitCostValue?.toFixed(2) || 'N/A'}</div>
        </div>
      `;
      
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
    });
    
    return true;
  } catch (error) {
    console.error('Error visualizing integrated analysis:', error);
    return false;
  }
}

/**
 * Convert a GreenChAMP travel demand model to GeoJSON for Mapbox visualization
 */
export function convertModelToGeoJSON(modelData: any): FeatureCollection<Geometry, GeoJsonProperties> {
  try {
    // Simplified implementation for conversion
    const features: Array<{
      type: 'Feature';
      properties: {
        id: any;
        name: any;
        type: string;
        volume?: number;
        capacity?: number;
        speed?: number;
        vic?: number;
        delay?: number;
        population?: number;
        employment?: number;
        activityDensity?: number;
        tripProduction?: number;
        tripAttraction?: number;
      };
      geometry: any;
    }> = [];
    
    // Process links
    if (modelData.links && Array.isArray(modelData.links)) {
      modelData.links.forEach((link: any) => {
        if (link.from && link.to && link.geometry) {
          features.push({
            type: 'Feature' as const,
            properties: {
              id: link.id,
              name: link.name || `Link ${link.id}`,
              type: 'link',
              volume: link.volume || 0,
              capacity: link.capacity || 0,
              speed: link.speed || 0,
              vic: (link.volume && link.capacity) ? link.volume / link.capacity : 0,
              delay: link.delay || 0
            },
            geometry: link.geometry
          });
        }
      });
    }
    
    // Process zones
    if (modelData.zones && Array.isArray(modelData.zones)) {
      modelData.zones.forEach((zone: any) => {
        if (zone.geometry) {
          features.push({
            type: 'Feature' as const,
            properties: {
              id: zone.id,
              name: zone.name || `Zone ${zone.id}`,
              type: 'zone',
              population: zone.population || 0,
              employment: zone.employment || 0,
              activityDensity: (zone.population + zone.employment) / (zone.area || 1),
              tripProduction: zone.tripProduction || 0,
              tripAttraction: zone.tripAttraction || 0
            },
            geometry: zone.geometry
          });
        }
      });
    }
    
    return {
      type: 'FeatureCollection' as const,
      features
    };
  } catch (error) {
    console.error('Error converting model to GeoJSON:', error);
    return {
      type: 'FeatureCollection' as const,
      features: []
    };
  }
}

/**
 * Integrate benefit-cost analysis with map visualization
 */
export function visualizeBenefitCostOnMap(map: mapboxgl.Map, projectId: string, analysisId: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    if (!map) {
      resolve(false);
      return;
    }
    
    try {
      // Fetch project and analysis data
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const analysisResponse = await fetch(`/api/projects/${projectId}/benefit-cost/${analysisId}`);
      
      if (!projectResponse.ok || !analysisResponse.ok) {
        throw new Error('Failed to fetch project or analysis data');
      }
      
      const project = await projectResponse.json();
      const analysis = await analysisResponse.json();
      
      // Check if the project has geographic data
      if (!project.geometry) {
        logger.warn('Project has no geographic data to visualize');
        resolve(false);
        return;
      }
      
      // Create a GeoJSON feature
      const bcRatio = analysis.benefitCostRatio || 0;
      const npv = analysis.netPresentValue || 0;
      
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: {
            id: project.id,
            name: project.name,
            description: project.description,
            benefitCostRatio: bcRatio,
            netPresentValue: npv,
            economicallyViable: bcRatio >= 1.0,
            totalBenefits: analysis.benefits?.reduce((sum: number, b: any) => sum + b.presentValue, 0) || 0,
            totalCosts: analysis.costs?.reduce((sum: number, c: any) => sum + c.presentValue, 0) || 0
          },
          geometry: project.geometry
        }]
      };
      
      // Add source and layers if they don't exist
      if (!map.getSource('benefit-cost-source')) {
        map.addSource('benefit-cost-source', {
          type: 'geojson',
          data: geojson
        });
      } else {
        // Update the source data
        (map.getSource('benefit-cost-source') as mapboxgl.GeoJSONSource).setData(geojson);
      }
      
      if (!map.getLayer('benefit-cost-fill')) {
        map.addLayer({
          id: 'benefit-cost-fill',
          type: 'fill',
          source: 'benefit-cost-source',
          paint: {
            'fill-color': [
              'case',
              ['>=', ['get', 'benefitCostRatio'], 1.0],
              '#4CAF50', // green for BCR >= 1.0
              '#F44336'  // red for BCR < 1.0
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#000000'
          }
        });
      }
      
      if (!map.getLayer('benefit-cost-line')) {
        map.addLayer({
          id: 'benefit-cost-line',
          type: 'line',
          source: 'benefit-cost-source',
          paint: {
            'line-color': '#000000',
            'line-width': 2
          }
        });
      }
      
      // Fit map to the project geometry
      fitMapToBounds(map, geojson as FeatureCollection<Geometry, GeoJsonProperties>);
      
      resolve(true);
    } catch (error) {
      console.error('Error visualizing benefit-cost on map:', error);
      resolve(false);
    }
  });
}

/**
 * Visualize scenario comparison on map
 * 
 * @param map Mapbox map instance
 * @param scenarioIds Array of scenario IDs to compare
 * @param options Visualization options
 * @returns Promise resolving to success status
 */
export async function visualizeScenarioComparison(
  map: mapboxgl.Map,
  scenarioIds: string[],
  options: {
    metricType?: 'volume' | 'emissions' | 'vmt' | 'accessibility' | 'equity';
    showDifference?: boolean;
    baseScenarioId?: string;
    colorScheme?: 'sequential' | 'diverging';
    layer3D?: boolean;
  } = {}
): Promise<boolean> {
  if (!map || scenarioIds.length === 0) return false;
  
  try {
    // Set default options
    const {
      metricType = 'volume',
      showDifference = true,
      baseScenarioId = scenarioIds[0],
      colorScheme = 'diverging',
      layer3D = false
    } = options;
    
    logger.info(`Visualizing scenario comparison for ${scenarioIds.length} scenarios`);
    
    // Fetch all scenario data
    const scenarioData = await Promise.all(
      scenarioIds.map(async (id) => {
        const response = await fetch(`/api/scenarios/${id}/results`);
        if (!response.ok) {
          throw new Error(`Failed to fetch scenario ${id} results: ${response.statusText}`);
        }
        return response.json();
      })
    );
    
    // Prepare sources for visualization
    // First remove any existing sources/layers
    ['scenario-comparison-network', 'scenario-comparison-zones'].forEach(sourceId => {
      if (map.getSource(sourceId)) {
        // Remove associated layers first
        ['scenario-comparison-network-layer', 'scenario-comparison-zones-layer', 'scenario-comparison-3d-layer'].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        map.removeSource(sourceId);
      }
    });
    
    // Process data for visualization
    // For network data, we need to merge and calculate differences if showing differences
    const baseScenarioIndex = scenarioIds.indexOf(baseScenarioId);
    const baseScenario = scenarioData[baseScenarioIndex >= 0 ? baseScenarioIndex : 0];
    
    // Prepare the network GeoJSON
    let networkGeoJSON: any = {
      type: 'FeatureCollection' as const,
      features: []
    };
    
    if (showDifference && scenarioIds.length > 1) {
      // Create features showing differences between scenarios
      networkGeoJSON.features = baseScenario.network.features.map((feature: any) => {
        // Deep clone the feature
        const newFeature = JSON.parse(JSON.stringify(feature));
        
        // For each comparison scenario, calculate the difference
        scenarioIds.forEach((scenarioId, index) => {
          if (scenarioId === baseScenarioId) return;
          
          const comparisonScenario = scenarioData[index];
          const matchingFeature = comparisonScenario.network.features.find(
            (f: any) => f.properties.id === feature.properties.id
          );
          
          if (matchingFeature) {
            // Calculate difference for the selected metric
            const baseValue = feature.properties[metricType] || 0;
            const comparisonValue = matchingFeature.properties[metricType] || 0;
            const difference = comparisonValue - baseValue;
            const percentChange = baseValue !== 0 ? (difference / baseValue) * 100 : 0;
            
            // Add difference to properties
            newFeature.properties[`${scenarioId}_diff`] = difference;
            newFeature.properties[`${scenarioId}_pct`] = percentChange;
          }
        });
        
        return newFeature;
      });
    } else {
      // Just use the network from all scenarios
      scenarioData.forEach((data, index) => {
        data.network.features.forEach((feature: any) => {
          const newFeature = JSON.parse(JSON.stringify(feature));
          newFeature.properties.scenarioId = scenarioIds[index];
          networkGeoJSON.features.push(newFeature);
        });
      });
    }
    
    // Add network source
    map.addSource('scenario-comparison-network', {
      type: 'geojson',
      data: networkGeoJSON
    });
    
    // Add network layer with appropriate styling
    map.addLayer({
      id: 'scenario-comparison-network-layer',
      type: 'line',
      source: 'scenario-comparison-network',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: showDifference ? 
        // Diverging color scheme for differences
        {
          'line-color': colorScheme === 'diverging' ? 
            [
              'interpolate',
              ['linear'],
              ['get', `${scenarioIds[1]}_diff`],
              -1000, '#d7191c', // Significant decrease
              -100, '#fdae61',  // Moderate decrease
              0, '#ffffbf',     // No change
              100, '#a6d96a',   // Moderate increase
              1000, '#1a9641'   // Significant increase
            ] : 
            [
              'interpolate',
              ['linear'],
              ['get', `${scenarioIds[1]}_diff`],
              -1000, '#0571b0', // Blues for negative
              -100, '#92c5de',
              0, '#f7f7f7',     // White for no change
              100, '#f4a582',   // Oranges for positive
              1000, '#ca0020'
            ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['abs', ['get', `${scenarioIds[1]}_diff`]],
            0, 1,
            1000, 8
          ],
          'line-opacity': 0.8
        } : 
        // Sequential color scheme for raw values
        {
          'line-color': [
            'match',
            ['get', 'scenarioId'],
            scenarioIds[0], '#1a9641',
            scenarioIds[1], '#d7191c',
            scenarioIds[2], '#fdae61',
            scenarioIds[3], '#a6d96a',
            '#ffffbf' // default
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', metricType],
            0, 1,
            5000, 8
          ],
          'line-opacity': 0.8
        }
    });
    
    // Add zones data if available
    if (scenarioData[0].zones) {
      // Prepare the zones GeoJSON
      let zonesGeoJSON: any = {
        type: 'FeatureCollection' as const,
        features: []
      };
      
      if (showDifference && scenarioIds.length > 1) {
        // Create features showing differences between scenarios
        zonesGeoJSON.features = baseScenario.zones.features.map((feature: any) => {
          // Deep clone the feature
          const newFeature = JSON.parse(JSON.stringify(feature));
          
          // For each comparison scenario, calculate the difference
          scenarioIds.forEach((scenarioId, index) => {
            if (scenarioId === baseScenarioId) return;
            
            const comparisonScenario = scenarioData[index];
            const matchingFeature = comparisonScenario.zones.features.find(
              (f: any) => f.properties.id === feature.properties.id
            );
            
            if (matchingFeature) {
              // Calculate difference for the selected metric
              const baseValue = feature.properties[metricType] || 0;
              const comparisonValue = matchingFeature.properties[metricType] || 0;
              const difference = comparisonValue - baseValue;
              const percentChange = baseValue !== 0 ? (difference / baseValue) * 100 : 0;
              
              // Add difference to properties
              newFeature.properties[`${scenarioId}_diff`] = difference;
              newFeature.properties[`${scenarioId}_pct`] = percentChange;
              newFeature.properties.height = Math.abs(percentChange) * 100; // For 3D visualization
            }
          });
          
          return newFeature;
        });
      } else {
        // Just use the zones from all scenarios
        scenarioData.forEach((data, index) => {
          if (!data.zones) return;
          
          data.zones.features.forEach((feature: any) => {
            const newFeature = JSON.parse(JSON.stringify(feature));
            newFeature.properties.scenarioId = scenarioIds[index];
            newFeature.properties.height = feature.properties[metricType] * 10; // For 3D visualization
            zonesGeoJSON.features.push(newFeature);
          });
        });
      }
      
      // Add zones source
      map.addSource('scenario-comparison-zones', {
        type: 'geojson',
        data: zonesGeoJSON
      });
      
      // Add regular zones layer
      map.addLayer({
        id: 'scenario-comparison-zones-layer',
        type: 'fill',
        source: 'scenario-comparison-zones',
        layout: {},
        paint: showDifference ? 
          // Diverging color scheme for differences
          {
            'fill-color': colorScheme === 'diverging' ?
              [
                'interpolate',
                ['linear'],
                ['get', `${scenarioIds[1]}_diff`],
                -1000, '#d7191c', // Significant decrease
                -100, '#fdae61',  // Moderate decrease
                0, '#ffffbf',     // No change
                100, '#a6d96a',   // Moderate increase
                1000, '#1a9641'   // Significant increase
              ] :
              [
                'interpolate',
                ['linear'],
                ['get', `${scenarioIds[1]}_diff`],
                -1000, '#0571b0', // Blues for negative
                -100, '#92c5de',
                0, '#f7f7f7',     // White for no change
                100, '#f4a582',   // Oranges for positive
                1000, '#ca0020'
              ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#000000'
          } : 
          // Sequential color scheme for raw values
          {
            'fill-color': [
              'match',
              ['get', 'scenarioId'],
              scenarioIds[0], '#1a9641',
              scenarioIds[1], '#d7191c',
              scenarioIds[2], '#fdae61',
              scenarioIds[3], '#a6d96a',
              '#ffffbf' // default
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#000000'
          }
      });
      
      // Add 3D visualization if requested
      if (layer3D) {
        map.addLayer({
          id: 'scenario-comparison-3d-layer',
          type: 'fill-extrusion',
          source: 'scenario-comparison-zones',
          paint: {
            'fill-extrusion-color': showDifference ? 
              // Diverging color scheme for differences
              colorScheme === 'diverging' ?
              [
                'interpolate',
                ['linear'],
                ['get', `${scenarioIds[1]}_diff`],
                -1000, '#d7191c', // Significant decrease
                -100, '#fdae61',  // Moderate decrease
                0, '#ffffbf',     // No change
                100, '#a6d96a',   // Moderate increase
                1000, '#1a9641'   // Significant increase
              ] :
              [
                'interpolate',
                ['linear'],
                ['get', `${scenarioIds[1]}_diff`],
                -1000, '#0571b0', // Blues for negative
                -100, '#92c5de',
                0, '#f7f7f7',     // White for no change
                100, '#f4a582',   // Oranges for positive
                1000, '#ca0020'
              ] : 
              // Sequential color scheme for raw values
              [
                'match',
                ['get', 'scenarioId'],
                scenarioIds[0], '#1a9641',
                scenarioIds[1], '#d7191c',
                scenarioIds[2], '#fdae61',
                scenarioIds[3], '#a6d96a',
                '#ffffbf' // default
              ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.7
          }
        });
        
        // Enable 3D terrain for better visualization
        enable3DTerrain(map);
      }
    }
    
    // Add a legend
    if (map.getContainer()) {
      let legendContainer = document.getElementById('scenario-comparison-legend');
      if (!legendContainer) {
        legendContainer = document.createElement('div');
        legendContainer.id = 'scenario-comparison-legend';
        legendContainer.className = 'mapbox-legend';
        legendContainer.style.position = 'absolute';
        legendContainer.style.bottom = '30px';
        legendContainer.style.right = '10px';
        legendContainer.style.backgroundColor = 'white';
        legendContainer.style.padding = '10px';
        legendContainer.style.borderRadius = '4px';
        legendContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        legendContainer.style.zIndex = '1';
        legendContainer.style.maxWidth = '200px';
        
        // Create legend content
        const title = document.createElement('h4');
        title.style.margin = '0 0 8px 0';
        title.textContent = showDifference ? `${metricType} Difference` : metricType;
        legendContainer.appendChild(title);
        
        if (showDifference) {
          // Create legend for difference visualization
          const colors = colorScheme === 'diverging' ? 
            ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'] :
            ['#0571b0', '#92c5de', '#f7f7f7', '#f4a582', '#ca0020'];
          const labels = ['Major Decrease', 'Minor Decrease', 'No Change', 'Minor Increase', 'Major Increase'];
          
          colors.forEach((color, i) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '4px';
            
            const colorBox = document.createElement('div');
            colorBox.style.width = '12px';
            colorBox.style.height = '12px';
            colorBox.style.backgroundColor = color;
            colorBox.style.marginRight = '6px';
            
            const label = document.createElement('span');
            label.style.fontSize = '12px';
            label.textContent = labels[i];
            
            item.appendChild(colorBox);
            item.appendChild(label);
            if (legendContainer) {
              legendContainer.appendChild(item);
            }
          });
        } else {
          // Create legend for scenario visualization
          scenarioIds.forEach((id, i) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '4px';
            
            const colorBox = document.createElement('div');
            colorBox.style.width = '12px';
            colorBox.style.height = '12px';
            colorBox.style.backgroundColor = [
              '#1a9641', '#d7191c', '#fdae61', '#a6d96a'
            ][i % 4];
            colorBox.style.marginRight = '6px';
            
            const label = document.createElement('span');
            label.style.fontSize = '12px';
            label.textContent = `Scenario ${i + 1}`;
            
            item.appendChild(colorBox);
            item.appendChild(label);
            if (legendContainer) {
              legendContainer.appendChild(item);
            }
          });
        }
        
        const mapContainer = map.getContainer();
        if (mapContainer && legendContainer) {
          mapContainer.appendChild(legendContainer);
        }
      }
    }
    
    // Fit map to the data bounds
    fitMapToBounds(map, networkGeoJSON);
    
    return true;
  } catch (error) {
    console.error('Error visualizing scenario comparison:', error);
    return false;
  }
}

/**
 * Create a combined scenario comparison that integrates benefit-cost analysis results
 * @param map The Mapbox map instance
 * @param scenarios The scenario IDs to compare
 * @param bcResults The benefit-cost analysis results
 * @returns Promise resolving to a boolean indicating success
 */
export async function createBCScenarioComparison(
  map: mapboxgl.Map,
  scenarios: string[],
  bcResults: Record<string, any>,
): Promise<boolean> {
  if (!map || scenarios.length === 0) return false;
  
  try {
    // Clear any existing layers
    if (map.getLayer('bc-scenario-comparison')) {
      map.removeLayer('bc-scenario-comparison');
    }
    
    if (map.getSource('bc-scenario-comparison')) {
      map.removeSource('bc-scenario-comparison');
    }
    
    // Fetch scenario data for each ID
    const scenarioDataPromises = scenarios.map(id => 
      fetch(`/api/scenarios/${id}/results`)
        .then(res => res.ok ? res.json() : null)
    );
    
    const scenarioResults = await Promise.all(scenarioDataPromises);
    const validResults = scenarioResults.filter(Boolean);
    
    if (validResults.length === 0) {
      console.warn('No valid scenario results found');
      return false;
    }
    
    // Combine scenario data with BC results
    const combinedFeatures = validResults.flatMap((result, index) => {
      const scenarioId = scenarios[index];
      const bcResult = bcResults[scenarioId];
      
      if (!bcResult) return [];
      
      return result.geojson.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          scenarioId,
          bcRatio: bcResult.benefitCostRatio || 0,
          npv: bcResult.netPresentValue || 0,
          combinedScore: (feature.properties?.impact || 0) * (bcResult.benefitCostRatio || 1)
        }
      }));
    });
    
    // Create a new GeoJSON source with the combined data
    map.addSource('bc-scenario-comparison', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection' as const,
        features: combinedFeatures
      }
    });
    
    // Add a new layer for the combined visualization
    map.addLayer({
      id: 'bc-scenario-comparison',
      type: 'fill',
      source: 'bc-scenario-comparison',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'combinedScore'],
          0, '#f2dede',  // Low score (red tint)
          0.5, '#fcf8e3', // Medium score (yellow tint)
          1, '#dff0d8',  // High score (green tint)
          2, '#5cb85c'   // Excellent score (green)
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      }
    });
    
    // Fit map to the data extent
    const bounds = new mapboxgl.LngLatBounds();
    combinedFeatures.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
      }
    });
    
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating benefit-cost scenario comparison:', error);
    return false;
  }
}

// Export the Mapbox token getter
export function getMapboxToken() {
  return mapboxToken;
}

// Map style constants
export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1'
};

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  style: MAP_STYLES.STREETS,
  center: [-122.4194, 37.7749], // San Francisco by default
  zoom: 12,
  minZoom: 2,
  maxZoom: 18,
  pitch: 0, // For 3D view
  bearing: 0,
  attributionControl: true,
  logoPosition: 'bottom-left' as const
};

// Helper to create marker element with custom CSS
export const createCustomMarker = (
  type: string, 
  color: string = '#FF0000', 
  size: number = 30
): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = `custom-marker ${type}`;
  el.style.backgroundColor = color;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.justifyContent = 'center';
  el.style.alignItems = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
  
  return el;
};

// Helper to create a pulsing dot (useful for current location)
export const createPulsingDot = (color: string = '#3FB1CE'): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'pulsing-dot';
  el.style.backgroundColor = color;
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.boxShadow = '0 0 0 rgba(0, 0, 0, 0.2)';
  el.style.border = '2px solid white';
  el.style.animation = 'pulse 1.5s infinite';

  // Add the animation keyframes
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      70% { transform: scale(1.5); opacity: 0; }
      100% { transform: scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  return el;
};

// Helper to create a geolocation control
export const addGeolocationControl = (
  map: mapboxgl.Map, 
  onSuccess?: (position: GeolocationPosition) => void
): mapboxgl.GeolocateControl => {
  const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  });
  
  map.addControl(geolocateControl, 'top-right');
  
  if (onSuccess) {
    map.on('geolocate', (e: any) => {
      if (e && e.coords) {
        onSuccess(e);
      }
    });
  }
  
  return geolocateControl;
};

// Add 3D building layer
export const add3DBuildings = (map: mapboxgl.Map): void => {
  map.on('load', () => {
    // Check if the style has a "building" layer
    const layers = map.getStyle().layers;
    if (layers && layers.find(layer => layer.id === 'building')) {
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
    }
  });
};

// Helper to create a debug layer for development
export const addDebugLayer = (map: mapboxgl.Map): void => {
  map.showTileBoundaries = true;
  map.showCollisionBoxes = true;
  map.showTerrainWireframe = true;
};

// Injects mapbox custom styles into the page
export const injectMapboxCustomStyles = (): void => {
  // Check if styles already exist
  if (document.getElementById('mapbox-custom-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'mapbox-custom-styles';
  style.innerHTML = `
    /* Custom marker styles */
    .mapboxgl-marker {
      cursor: pointer;
    }
    
    /* Custom pulsing dot animation */
    .pulsing-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(0, 0, 0, 0.2);
      border: 2px solid white;
    }
    
    /* Custom popup styles */
    .mapboxgl-popup-content {
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);
    }
    
    .mapboxgl-popup-close-button {
      font-size: 16px;
      color: #666;
      right: 8px;
      top: 8px;
    }
    
    /* Marker type styles */
    .custom-marker.project {
      background-color: #3b82f6;
    }
    
    .custom-marker.issue {
      background-color: #ef4444;
    }
    
    .custom-marker.suggestion {
      background-color: #22c55e;
    }
    
    .custom-marker.comment {
      background-color: #f59e0b;
    }
  `;
  
  document.head.appendChild(style);
}; 