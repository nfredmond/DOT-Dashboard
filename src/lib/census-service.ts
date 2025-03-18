/**
 * Census Service - Handles interactions with Census API for demographic data
 */

import { getEnvVariable } from './env-service';

/**
 * Census geography types
 */
export enum CensusGeoType {
  State = 'state',
  County = 'county',
  Tract = 'tract',
  Block = 'block',
  Place = 'place',
  Zcta = 'zip code tabulation area'
}

/**
 * Census dataset identifiers
 */
export enum CensusDataset {
  // American Community Survey 5-year estimates
  ACS5 = 'acs/acs5',
  // American Community Survey 1-year estimates
  ACS1 = 'acs/acs1',
  // Decennial Census
  Census = 'dec/sf1'
}

/**
 * Common Census variables
 */
export const CENSUS_VARIABLES = {
  // Demographic variables
  TOTAL_POPULATION: 'B01003_001E',
  MEDIAN_AGE: 'B01002_001E',
  RACE_WHITE: 'B02001_002E',
  RACE_BLACK: 'B02001_003E',
  RACE_ASIAN: 'B02001_005E',
  HISPANIC_LATINO: 'B03003_003E',
  
  // Economic variables
  MEDIAN_HOUSEHOLD_INCOME: 'B19013_001E',
  POVERTY_COUNT: 'B17001_002E',
  UNEMPLOYMENT_RATE: 'DP03_0009PE',
  
  // Housing variables
  TOTAL_HOUSING_UNITS: 'B25001_001E',
  MEDIAN_HOME_VALUE: 'B25077_001E',
  MEDIAN_RENT: 'B25064_001E',
  OWNER_OCCUPIED: 'B25003_002E',
  RENTER_OCCUPIED: 'B25003_003E',
  
  // Transportation variables
  COMMUTE_DRIVE_ALONE: 'B08006_002E',
  COMMUTE_CARPOOL: 'B08006_003E',
  COMMUTE_PUBLIC_TRANSIT: 'B08006_008E',
  COMMUTE_WALK: 'B08006_015E',
  COMMUTE_BIKE: 'B08006_014E',
  COMMUTE_WORK_AT_HOME: 'B08006_017E',
  NO_VEHICLE_AVAILABLE: 'B08201_002E',
};

/**
 * Census data query parameters
 */
export interface CensusQueryParams {
  dataset?: CensusDataset;
  vintage?: number;
  variables: string[];
  geoType: CensusGeoType;
  geoIds?: string[];
  state?: string;
  county?: string;
  place?: string;
}

/**
 * Census data response
 */
export interface CensusData {
  geoid: string;
  geoname: string;
  variables: Record<string, string | number | null>;
  geometry?: GeoJSON.Geometry;
}

/**
 * Cache for census data
 */
const censusCache: Record<string, {
  timestamp: number,
  data: CensusData[]
}> = {};

/**
 * Cache expiration time (7 days)
 */
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Get Census data
 */
export async function getCensusData(params: CensusQueryParams): Promise<CensusData[]> {
  // Generate cache key from params
  const cacheKey = getCacheKey(params);
  
  // Check cache first
  const cachedData = censusCache[cacheKey];
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
    console.log("Using cached census data");
    return cachedData.data;
  }
  
  // Get API key from environment
  const apiKey = getEnvVariable('CENSUS_API_KEY');
  if (!apiKey) {
    console.warn("Census API key not configured");
    throw new Error("Census API key not configured");
  }
  
  try {
    // Build the Census API URL
    const baseUrl = 'https://api.census.gov/data';
    const dataset = params.dataset || CensusDataset.ACS5;
    const vintage = params.vintage || new Date().getFullYear() - 2; // Default to 2 years ago
    
    // Format variables
    const variables = ['NAME', ...params.variables];
    const variablesParam = variables.join(',');
    
    // Build geo parameters
    const geoParams = buildGeoParams(params);
    
    // Construct the URL
    const url = `${baseUrl}/${vintage}/${dataset}?get=${variablesParam}&${geoParams}&key=${apiKey}`;
    
    // Fetch data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Census API error: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    
    // Parse the response (first row is headers)
    const headers = rawData[0];
    const rows = rawData.slice(1);
    
    // Format the data
    const formattedData: CensusData[] = rows.map((row: any) => {
      const result: CensusData = {
        geoid: '',
        geoname: '',
        variables: {}
      };
      
      // Extract values based on headers
      headers.forEach((header: string, index: number) => {
        const value = row[index];
        
        if (header === 'NAME') {
          result.geoname = value;
        } else {
          // Convert numeric values
          result.variables[header] = isNaN(Number(value)) ? value : Number(value);
        }
      });
      
      // Generate geoid based on geography type
      result.geoid = buildGeoid(params, row, headers);
      
      return result;
    });
    
    // Cache the results
    censusCache[cacheKey] = {
      timestamp: Date.now(),
      data: formattedData
    };
    
    return formattedData;
    
  } catch (error) {
    console.error('Error fetching Census data:', error);
    
    // For development - return mock data if API fails
    if (process.env.NODE_ENV === 'development') {
      return getMockCensusData(params);
    }
    
    throw error;
  }
}

/**
 * Get Census data with geometry (for mapping)
 */
export async function getCensusGeoData(params: CensusQueryParams): Promise<CensusData[]> {
  // First get the regular Census data
  const censusData = await getCensusData(params);
  
  try {
    // Get API key from environment
    const _apiKey = getEnvVariable('CENSUS_API_KEY');
    
    // Build the Tiger/Line URL for geometry
    const _vintage = params.vintage || new Date().getFullYear() - 2;
    let tigerUrl = '';
    
    switch (params.geoType) {
      case CensusGeoType.State:
        tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=GEOID%20IN%20(${params.geoIds?.join(',')})&outFields=GEOID,NAME&outSR=4326&f=geojson`;
        break;
      case CensusGeoType.County:
        tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/3/query?where=GEOID%20IN%20(${params.geoIds?.join(',')})&outFields=GEOID,NAME&outSR=4326&f=geojson`;
        break;
      case CensusGeoType.Tract:
        tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/10/query?where=STATE=${params.state}&outFields=GEOID,NAME&outSR=4326&f=geojson`;
        if (params.county) {
          tigerUrl += `&COUNTY=${params.county}`;
        }
        break;
      default:
        throw new Error(`Geometry not supported for geography type: ${params.geoType}`);
    }
    
    // Fetch geometry data
    const response = await fetch(tigerUrl);
    if (!response.ok) {
      throw new Error(`Census Tiger/Line API error: ${response.status} ${response.statusText}`);
    }
    
    const geoJsonData = await response.json();
    
    // Match geometries to census data
    return censusData.map(item => {
      const feature = geoJsonData.features.find((f: any) => f.properties.GEOID === item.geoid);
      if (feature) {
        item.geometry = feature.geometry;
      }
      return item;
    });
    
  } catch (error) {
    console.error('Error fetching Census geometry:', error);
    return censusData; // Return data without geometry
  }
}

/**
 * Check if the Census API is configured
 */
export function isCensusConfigured(): boolean {
  return !!getEnvVariable('CENSUS_API_KEY');
}

/**
 * Build geo parameters string for Census API
 */
function buildGeoParams(params: CensusQueryParams): string {
  switch (params.geoType) {
    case CensusGeoType.State:
      return params.geoIds?.length ? `for=state:${params.geoIds.join(',')}` : 'for=state:*';
    case CensusGeoType.County:
      if (params.state) {
        return params.geoIds?.length 
          ? `for=county:${params.geoIds.join(',')}&in=state:${params.state}` 
          : `for=county:*&in=state:${params.state}`;
      }
      return 'for=county:*';
    case CensusGeoType.Tract:
      if (params.state && params.county) {
        return `for=tract:*&in=state:${params.state}&in=county:${params.county}`;
      } else if (params.state) {
        return `for=tract:*&in=state:${params.state}`;
      }
      return 'for=tract:*';
    case CensusGeoType.Block:
      if (params.state && params.county && params.geoIds?.length) {
        return `for=block:${params.geoIds.join(',')}&in=state:${params.state}&in=county:${params.county}`;
      } else if (params.state && params.county) {
        return `for=block:*&in=state:${params.state}&in=county:${params.county}`;
      }
      throw new Error('Block requires state and county parameters');
    case CensusGeoType.Place:
      if (params.state) {
        return params.geoIds?.length 
          ? `for=place:${params.geoIds.join(',')}&in=state:${params.state}` 
          : `for=place:*&in=state:${params.state}`;
      }
      return 'for=place:*';
    case CensusGeoType.Zcta:
      return params.geoIds?.length 
        ? `for=zip%20code%20tabulation%20area:${params.geoIds.join(',')}` 
        : 'for=zip%20code%20tabulation%20area:*';
    default:
      throw new Error(`Unsupported geography type: ${params.geoType}`);
  }
}

/**
 * Build a geoid based on geography type
 */
function buildGeoid(params: CensusQueryParams, row: any[], headers: string[]): string {
  // Find indexes of geo ID fields
  const stateIdx = headers.indexOf('state');
  const countyIdx = headers.indexOf('county');
  const tractIdx = headers.indexOf('tract');
  const blockIdx = headers.indexOf('block');
  const placeIdx = headers.indexOf('place');
  const zctaIdx = headers.indexOf('zip code tabulation area');
  
  switch (params.geoType) {
    case CensusGeoType.State:
      return row[stateIdx];
    case CensusGeoType.County:
      return `${row[stateIdx]}${row[countyIdx]}`;
    case CensusGeoType.Tract:
      return `${row[stateIdx]}${row[countyIdx]}${row[tractIdx]}`;
    case CensusGeoType.Block:
      return `${row[stateIdx]}${row[countyIdx]}${row[tractIdx]}${row[blockIdx]}`;
    case CensusGeoType.Place:
      return `${row[stateIdx]}${row[placeIdx]}`;
    case CensusGeoType.Zcta:
      return row[zctaIdx];
    default:
      return '';
  }
}

/**
 * Create cache key from query parameters
 */
function getCacheKey(params: CensusQueryParams): string {
  return JSON.stringify(params);
}

/**
 * Generate mock census data for development
 */
function getMockCensusData(params: CensusQueryParams): CensusData[] {
  console.log("Generating mock census data");
  
  const mockData: CensusData[] = [];
  const geoCount = params.geoIds?.length || 10;
  
  // Generate mock data for each requested geography
  for (let i = 0; i < geoCount; i++) {
    const mockItem: CensusData = {
      geoid: `mock-geoid-${i}`,
      geoname: `Mock Geography ${i}`,
      variables: {}
    };
    
    // Create mock values for each requested variable
    params.variables.forEach(variable => {
      // Generate appropriate mock values based on variable type
      let value: number | string | null = null;
      
      // Population variables (usually in thousands)
      if (variable.startsWith('B01')) {
        value = Math.floor(1000 + Math.random() * 50000);
      } 
      // Income variables (usually in thousands)
      else if (variable.startsWith('B19')) {
        value = Math.floor(30000 + Math.random() * 120000);
      }
      // Housing variables
      else if (variable.startsWith('B25')) {
        if (variable === 'B25077_001E') { // Median home value
          value = Math.floor(100000 + Math.random() * 900000);
        } else if (variable === 'B25064_001E') { // Median rent
          value = Math.floor(800 + Math.random() * 2200);
        } else { // Housing counts
          value = Math.floor(500 + Math.random() * 10000);
        }
      }
      // Transportation variables
      else if (variable.startsWith('B08')) {
        value = Math.floor(100 + Math.random() * 5000);
      }
      // Percentage variables
      else if (variable.includes('PE')) {
        value = Math.floor(Math.random() * 100);
      }
      // Default case for other variables
      else {
        value = Math.floor(Math.random() * 1000);
      }
      
      mockItem.variables[variable] = value;
    });
    
    mockData.push(mockItem);
  }
  
  return mockData;
} 