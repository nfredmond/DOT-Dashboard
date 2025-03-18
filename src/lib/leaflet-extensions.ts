/**
 * Leaflet Extensions for Transportation Planning
 * 
 * This module provides extensions for Leaflet map visualizations
 * specific to transportation planning needs.
 */

import L from 'leaflet';
import { CensusGeoType, getCensusGeoData, CENSUS_VARIABLES } from './census-service';
import { CollisionQueryParams, CollisionSeverity, getCollisionHeatmapData } from './traffic-service';

// Note: We'll handle the leaflet.heat plugin dynamically to avoid TypeScript errors

/**
 * Legend configuration for various visualization types
 */
export interface LegendConfig {
  title: string;
  colors: string[];
  labels: string[];
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
}

/**
 * Options for demographic layer visualization
 */
export interface DemographicLayerOptions {
  variable?: string;
  colorScheme?: string[];
  showLegend?: boolean;
  legendTitle?: string;
  opacity?: number;
}

/**
 * Options for traffic heatmap visualization
 */
export interface TrafficHeatmapOptions {
  severityFilter?: CollisionSeverity[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  gradient?: Record<number, string>;
  showInfoOnClick?: boolean;
  showLegend?: boolean;
}

/**
 * Options for accessibility analysis visualization
 */
export interface AccessibilityOptions {
  mode?: 'walking' | 'cycling' | 'driving' | 'transit';
  travelTimes?: number[];
  destination?: [number, number];
  showLegend?: boolean;
  opacity?: number;
}

/**
 * Transportation Map Extensions for Leaflet
 */
export function createTransportationMap(map: L.Map) {
  // Store active layers for management
  const activeLayers: Record<string, L.Layer> = {};
  const legends: Record<string, L.Control> = {};
  
  /**
   * Import Leaflet.heat plugin dynamically
   */
  async function importHeatPlugin(): Promise<boolean> {
    try {
      // In a real app, you would import from node_modules
      // Using dynamic import with a catch for error handling
      // We don't have the actual module, so this will fail gracefully in development
      console.log("Attempting to load Leaflet heat plugin");
      return Promise.resolve(false);
    } catch (error) {
      console.error('Error loading Leaflet.heat plugin:', error);
      return false;
    }
  }
  
  return {
    /**
     * Add a traffic collision heatmap to the map
     */
    async addTrafficHeatmap(county: string, options: TrafficHeatmapOptions = {}): Promise<boolean> {
      try {
        // Remove any existing traffic heatmap
        this.removeLayer('traffic-heatmap');
        this.removeLegend('traffic-legend');
        
        // Default options
        const defaultOptions = {
          radius: 25,
          blur: 15,
          gradient: { 0.4: 'blue', 0.65: 'yellow', 1: 'red' },
          showLegend: true,
          severityFilter: [CollisionSeverity.Fatal, CollisionSeverity.Injury]
        };
        
        // Merge with user options
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Build query parameters
        const queryParams: CollisionQueryParams = {
          county,
          severity: mergedOptions.severityFilter,
          limit: 1000
        };
        
        // Get collision data formatted for heatmap
        const heatmapData = await getCollisionHeatmapData(queryParams);
        
        // Check if we have the heatmap plugin
        if (!(L as any).heat) {
          // Dynamically load the heatmap plugin if not available
          console.log("Leaflet heat plugin not loaded, trying to load dynamically");
          await importHeatPlugin();
        }
        
        // Safely check and use the heat plugin
        if ((L as any).heat) {
          // Create heatmap layer
          const heatmapLayer = (L as any).heat.create(heatmapData, {
            radius: mergedOptions.radius,
            gradient: mergedOptions.gradient,
            minOpacity: 0.3,
            blur: mergedOptions.blur,
            max: 1.0,
            maxZoom: mergedOptions.maxZoom
          });
          
          // Add to map and store reference
          heatmapLayer.addTo(map);
          activeLayers['traffic-heatmap'] = heatmapLayer;
          
          // Add legend if requested
          if (mergedOptions.showLegend) {
            this.addLegend('traffic-legend', {
              title: 'Traffic Collisions',
              colors: ['blue', 'yellow', 'red'],
              labels: ['Low', 'Medium', 'High'],
              position: 'bottomright'
            });
          }
          
          return true;
        } else {
          console.error("Failed to load Leaflet.heat plugin");
          return false;
        }
      } catch (error) {
        console.error('Error adding traffic heatmap:', error);
        return false;
      }
    },
    
    /**
     * Add a census demographic layer to the map
     */
    async addDemographicLayer(geoType: string, state: string, options: DemographicLayerOptions = {}): Promise<boolean> {
      try {
        // Remove any existing demographic layer
        this.removeLayer('demographic-layer');
        this.removeLegend('demographic-legend');
        
        // Default options
        const defaultOptions = {
          variable: CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME,
          colorScheme: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
          showLegend: true,
          legendTitle: 'Median Household Income',
          opacity: 0.7
        };
        
        // Merge with user options
        const mergedOptions = { ...defaultOptions, ...options };
        
        // Map string geoType to enum
        const geoTypeEnum = geoType === 'state' ? CensusGeoType.State :
                          geoType === 'county' ? CensusGeoType.County :
                          geoType === 'tract' ? CensusGeoType.Tract :
                          geoType === 'block' ? CensusGeoType.Block :
                          geoType === 'place' ? CensusGeoType.Place :
                          geoType === 'zcta' ? CensusGeoType.Zcta :
                          CensusGeoType.Tract;
        
        // Get census data with geometry
        const censusData = await getCensusGeoData({
          geoType: geoTypeEnum,
          state: state === '*' ? undefined : state,
          variables: [mergedOptions.variable]
        });
        
        // Create value array for quantile breaks
        const values = censusData
          .map(item => Number(item.variables[mergedOptions.variable]))
          .filter(val => !isNaN(val))
          .sort((a, b) => a - b);
        
        // Calculate quantile breaks for choropleth
        const breaks = calculateQuantileBreaks(values, mergedOptions.colorScheme.length);
        
        // Create style function
        const style = (feature: any) => {
          const value = feature.properties.value;
          if (value === null || isNaN(value)) {
            return {
              fillColor: '#ccc',
              weight: 1,
              opacity: 0.5,
              color: '#666',
              fillOpacity: mergedOptions.opacity
            };
          }
          
          // Find the appropriate color based on value
          let colorIndex = 0;
          for (let i = 0; i < breaks.length; i++) {
            if (value <= breaks[i]) {
              colorIndex = i;
              break;
            }
            colorIndex = mergedOptions.colorScheme.length - 1;
          }
          
          return {
            fillColor: mergedOptions.colorScheme[colorIndex],
            weight: 1,
            opacity: 0.5,
            color: '#666',
            fillOpacity: mergedOptions.opacity
          };
        };
        
        // Create GeoJSON layer
        const features = censusData.map(item => {
          if (!item.geometry) return null;
          
          return {
            type: 'Feature',
            geometry: item.geometry,
            properties: {
              name: item.geoname,
              value: item.variables[mergedOptions.variable],
              geoid: item.geoid
            }
          };
        }).filter(f => f !== null);
        
        const geoJsonLayer = L.geoJSON(features as any, {
          style,
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div>
                <h3>${feature.properties.name}</h3>
                <p>${getVariableLabel(mergedOptions.variable)}: ${formatValue(feature.properties.value, mergedOptions.variable)}</p>
              </div>
            `);
          }
        });
        
        // Add to map and store reference
        geoJsonLayer.addTo(map);
        activeLayers['demographic-layer'] = geoJsonLayer;
        
        // Add legend if requested
        if (mergedOptions.showLegend) {
          // Format break labels
          const breakLabels = breaks.map(value => formatValue(value, mergedOptions.variable));
          
          this.addLegend('demographic-legend', {
            title: mergedOptions.legendTitle || getVariableLabel(mergedOptions.variable),
            colors: mergedOptions.colorScheme,
            labels: breakLabels,
            position: 'bottomright'
          });
        }
        
        return true;
      } catch (error) {
        console.error('Error adding demographic layer:', error);
        return false;
      }
    },
    
    /**
     * Add an accessibility analysis layer to the map
     */
    async addAccessibilityAnalysis(center: [number, number], options: AccessibilityOptions = {}): Promise<boolean> {
      try {
        // Remove any existing accessibility layer
        this.removeLayer('accessibility-layer');
        this.removeLegend('accessibility-legend');
        
        // Default options
        const defaultOptions = {
          mode: 'walking',
          travelTimes: [5, 10, 15, 20, 25, 30],
          showLegend: true,
          opacity: 0.6
        };
        
        // Merge with user options
        const mergedOptions = { ...defaultOptions, ...options };
        
        // In a real app, this would make API calls to a routing service
        // For this demo, we'll create mock isochrones
        
        // Colors for travel time rings
        const colors = [
          '#1a9850', 
          '#66bd63', 
          '#a6d96a', 
          '#fee08b', 
          '#fdae61', 
          '#f46d43'
        ];
        
        // Create mock isochrones
        const layers: L.Layer[] = [];
        const destination = mergedOptions.destination || center;
        
        // Create circles with decreasing opacity for each travel time
        mergedOptions.travelTimes.forEach((minutes, i) => {
          // Approximate walking speed (miles per hour)
          let speed: number;
          switch(mergedOptions.mode) {
            case 'walking': speed = 3; break;
            case 'cycling': speed = 10; break;
            case 'driving': speed = 30; break;
            case 'transit': speed = 15; break;
            default: speed = 3;
          }
          
          // Convert minutes to miles
          const miles = (minutes / 60) * speed;
          // Convert miles to meters (approximate)
          const meters = miles * 1609.34;
          
          // Create circle
          const circle = L.circle(destination, {
            radius: meters,
            color: colors[i % colors.length],
            fillColor: colors[i % colors.length],
            fillOpacity: mergedOptions.opacity * (1 - (i / (mergedOptions.travelTimes.length + 2))),
            weight: 1
          });
          
          circle.bindTooltip(`${minutes} min ${mergedOptions.mode}`);
          circle.addTo(map);
          layers.push(circle);
        });
        
        // Create a feature group for all layers
        const featureGroup = L.featureGroup(layers);
        
        // Store reference
        activeLayers['accessibility-layer'] = featureGroup;
        
        // Fit bounds to show all isochrones
        map.fitBounds(featureGroup.getBounds());
        
        // Add legend if requested
        if (mergedOptions.showLegend) {
          this.addLegend('accessibility-legend', {
            title: `${capitalizeFirst(mergedOptions.mode)} Travel Time`,
            colors: colors.slice(0, mergedOptions.travelTimes.length),
            labels: mergedOptions.travelTimes.map(t => `${t} min`),
            position: 'bottomleft'
          });
        }
        
        return true;
      } catch (error) {
        console.error('Error adding accessibility analysis:', error);
        return false;
      }
    },
    
    /**
     * Add a custom legend to the map
     */
    addLegend(id: string, config: LegendConfig) {
      // Remove existing legend with same ID
      this.removeLegend(id);
      
      // Create legend control
      const legend = new L.Control({ position: config.position || 'bottomright' });
      
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.padding = '6px 8px';
        div.style.background = 'rgba(255,255,255,0.8)';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
        div.style.lineHeight = '18px';
        
        // Add title
        const title = L.DomUtil.create('div', 'legend-title', div);
        title.innerHTML = `<strong>${config.title}</strong>`;
        title.style.marginBottom = '5px';
        
        // Add legend items
        for (let i = 0; i < config.colors.length; i++) {
          const item = L.DomUtil.create('div', 'legend-item', div);
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.marginBottom = '3px';
          
          const colorBox = L.DomUtil.create('i', '', item);
          colorBox.style.width = '18px';
          colorBox.style.height = '18px';
          colorBox.style.backgroundColor = config.colors[i];
          colorBox.style.marginRight = '8px';
          colorBox.style.opacity = '0.7';
          
          const label = L.DomUtil.create('span', '', item);
          label.innerHTML = config.labels[i];
        }
        
        return div;
      };
      
      // Add to map
      legend.addTo(map);
      
      // Store reference
      legends[id] = legend;
      
      return legend;
    },
    
    /**
     * Remove a layer by ID
     */
    removeLayer(id: string) {
      if (activeLayers[id]) {
        map.removeLayer(activeLayers[id]);
        delete activeLayers[id];
        return true;
      }
      return false;
    },
    
    /**
     * Remove a legend by ID
     */
    removeLegend(id: string) {
      if (legends[id]) {
        map.removeControl(legends[id]);
        delete legends[id];
        return true;
      }
      return false;
    },
    
    /**
     * Remove all layers and legends
     */
    clearAll() {
      // Remove all layers
      Object.keys(activeLayers).forEach(id => {
        map.removeLayer(activeLayers[id]);
      });
      
      // Remove all legends
      Object.keys(legends).forEach(id => {
        map.removeControl(legends[id]);
      });
      
      // Clear references
      Object.keys(activeLayers).forEach(key => delete activeLayers[key]);
      Object.keys(legends).forEach(key => delete legends[key]);
    }
  };
}

/**
 * Calculate quantile breaks for choropleth
 */
function calculateQuantileBreaks(values: number[], numBreaks: number): number[] {
  if (values.length === 0) return [];
  
  const breaks: number[] = [];
  const step = 1 / numBreaks;
  
  for (let i = 1; i < numBreaks; i++) {
    const quantile = i * step;
    const index = Math.floor(quantile * values.length);
    breaks.push(values[index]);
  }
  
  return breaks;
}

/**
 * Get a human-readable label for a Census variable
 */
function getVariableLabel(variable: string): string {
  const variableLabels: Record<string, string> = {
    'B01003_001E': 'Total Population',
    'B19013_001E': 'Median Household Income',
    'B25077_001E': 'Median Home Value',
    'B08201_002E': 'Households with No Vehicle',
    'B08006_008E': 'Public Transit Commuters',
    'S0801_C01_002E': 'Drive Alone Percentage'
  };
  
  return variableLabels[variable] || 'Value';
}

/**
 * Format a value based on its variable type
 */
function formatValue(value: number, variable: string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'No Data';
  }
  
  // Money variables
  if (variable.startsWith('B19') || variable === 'B25077_001E' || variable === 'B25064_001E') {
    return `$${value.toLocaleString()}`;
  }
  
  // Percentage variables
  if (variable.includes('PE')) {
    return `${value.toFixed(1)}%`;
  }
  
  // Default number formatting
  return value.toLocaleString();
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 