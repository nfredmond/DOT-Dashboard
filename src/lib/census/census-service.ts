/**
 * Census Service
 * 
 * Provides access to demographic data from the US Census API
 * Used by AI analysis tools to provide equity analysis
 */

import { DemographicData, AgeDistribution, EthnicityDistribution } from '@/types/project.d';
import { getEnvVariable } from '@/lib/env-service';

/**
 * Get demographic context for a project location
 * Uses Census API to retrieve demographic data for the project area
 * 
 * @param location The project location (address, city, county, etc.)
 * @returns Demographics data for the location
 */
export async function getProjectDemographicContext(location: string): Promise<DemographicData> {
  try {
    // Extract key location components
    const { county, state } = extractLocationComponents(location);
    
    // Check if we have an API key
    const apiKey = getEnvVariable('CENSUS_API_KEY');
    if (!apiKey) {
      console.warn('Census API key not found. Using sample demographic data.');
      return getSampleDemographicData(county, state);
    }

    // Base URL for Census API
    const baseUrl = getEnvVariable('CENSUS_API_BASE_URL', 'https://api.census.gov/data');
    
    // Determine the geographic level (county, state, tract, etc.)
    const geoLevel = county ? 'county' : 'state';
    
    // Construct the API URL for ACS data
    // Using American Community Survey (ACS) 5-year estimates
    const year = new Date().getFullYear() - 2; // Most recent available data is usually 2 years behind
    const url = `${baseUrl}/${year}/acs/acs5?`;
    
    // Variables to request from the Census API
    // See Census API documentation for available variables
    const variables = [
      'NAME',                    // Name of geographic area
      'B01001_001E',             // Total population
      'B19013_001E',             // Median household income
      'B02001_001E',             // Total population for race calculations
      'B02001_002E',             // White alone
      'B02001_003E',             // Black or African American alone
      'B02001_004E',             // American Indian and Alaska Native alone
      'B02001_005E',             // Asian alone
      'B02001_006E',             // Native Hawaiian and Other Pacific Islander alone
      'B02001_007E',             // Some other race alone
      'B02001_008E',             // Two or more races
      'B03003_003E',             // Hispanic or Latino
      'B18101_001E',             // Total population for disability status
      'B18101_004E',             // Male with disability (under 5)
      'B18101_007E',             // Male with disability (5-17)
      'B18101_010E',             // Male with disability (18-34)
      'B18101_013E',             // Male with disability (35-64)
      'B18101_016E',             // Male with disability (65-74)
      'B18101_019E',             // Male with disability (75+)
      'B18101_023E',             // Female with disability (under 5)
      'B18101_026E',             // Female with disability (5-17)
      'B18101_029E',             // Female with disability (18-34)
      'B18101_032E',             // Female with disability (35-64)
      'B18101_035E',             // Female with disability (65-74)
      'B18101_038E',             // Female with disability (75+)
      'B25044_003E',             // No vehicle available (owner-occupied)
      'B25044_010E',             // No vehicle available (renter-occupied)
      'B01001_003E',             // Male under 5 years
      'B01001_004E',             // Male 5 to 9 years
      'B01001_005E',             // Male 10 to 14 years
      'B01001_006E',             // Male 15 to 17 years
      'B01001_007E',             // Male 18 to 19 years
      'B01001_008E',             // Male 20 years
      'B01001_009E',             // Male 21 years
      'B01001_010E',             // Male 22 to 24 years
      'B01001_011E',             // Male 25 to 29 years
      'B01001_012E',             // Male 30 to 34 years
      'B01001_013E',             // Male 35 to 39 years
      'B01001_014E',             // Male 40 to 44 years
      'B01001_015E',             // Male 45 to 49 years
      'B01001_016E',             // Male 50 to 54 years
      'B01001_017E',             // Male 55 to 59 years
      'B01001_018E',             // Male 60 to 61 years
      'B01001_019E',             // Male 62 to 64 years
      'B01001_020E',             // Male 65 to 66 years
      'B01001_021E',             // Male 67 to 69 years
      'B01001_022E',             // Male 70 to 74 years
      'B01001_023E',             // Male 75 to 79 years
      'B01001_024E',             // Male 80 to 84 years
      'B01001_025E',             // Male 85 years and over
      'B01001_027E',             // Female under 5 years
      'B01001_028E',             // Female 5 to 9 years
      'B01001_029E',             // Female 10 to 14 years
      'B01001_030E',             // Female 15 to 17 years
      'B01001_031E',             // Female 18 to 19 years
      'B01001_032E',             // Female 20 years
      'B01001_033E',             // Female 21 years
      'B01001_034E',             // Female 22 to 24 years
      'B01001_035E',             // Female 25 to 29 years
      'B01001_036E',             // Female 30 to 34 years
      'B01001_037E',             // Female 35 to 39 years
      'B01001_038E',             // Female 40 to 44 years
      'B01001_039E',             // Female 45 to 49 years
      'B01001_040E',             // Female 50 to 54 years
      'B01001_041E',             // Female 55 to 59 years
      'B01001_042E',             // Female 60 to 61 years
      'B01001_043E',             // Female 62 to 64 years
      'B01001_044E',             // Female 65 to 66 years
      'B01001_045E',             // Female 67 to 69 years
      'B01001_046E',             // Female 70 to 74 years
      'B01001_047E',             // Female 75 to 79 years
      'B01001_048E',             // Female 80 to 84 years
      'B01001_049E',             // Female 85 years and over
      'B19001_001E',             // Total households for income distribution
      'B19001_002E',             // Income less than $10,000
      'B19001_003E',             // Income $10,000 to $14,999
      'B19001_004E',             // Income $15,000 to $19,999
      'B19001_005E',             // Income $20,000 to $24,999
    ].join(',');
    
    // Construct the full API URL
    const params = new URLSearchParams({
      key: apiKey,
      get: variables,
      for: `${geoLevel}:*`,
      in: state ? `state:${getStateCodeByName(state)}` : '',
    });
    
    const response = await fetch(`${url}${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Census API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // First row contains headers
    const headers = data[0];
    // Find data row that matches our county or state
    let targetRow;
    
    if (county) {
      targetRow = data.find(row => {
        const nameIndex = headers.indexOf('NAME');
        const rowName = row[nameIndex].toLowerCase();
        return rowName.includes(county.toLowerCase());
      });
    } else if (state) {
      targetRow = data.find(row => {
        const nameIndex = headers.indexOf('NAME');
        const rowName = row[nameIndex].toLowerCase();
        return rowName.includes(state.toLowerCase());
      });
    } else {
      // Use the first data row (excluding header)
      targetRow = data[1];
    }
    
    if (!targetRow) {
      console.warn(`No Census data found for location: ${location}. Using sample data.`);
      return getSampleDemographicData(county, state);
    }
    
    // Extract the data using the header indices
    const totalPopIndex = headers.indexOf('B01001_001E');
    const medianIncomeIndex = headers.indexOf('B19013_001E');
    const totalRacePopIndex = headers.indexOf('B02001_001E');
    const whiteIndex = headers.indexOf('B02001_002E');
    const blackIndex = headers.indexOf('B02001_003E');
    const nativeAmericanIndex = headers.indexOf('B02001_004E');
    const asianIndex = headers.indexOf('B02001_005E');
    const pacificIslanderIndex = headers.indexOf('B02001_006E');
    const otherRaceIndex = headers.indexOf('B02001_007E');
    const multiRacialIndex = headers.indexOf('B02001_008E');
    const hispanicIndex = headers.indexOf('B03003_003E');
    
    // Calculate vehicle availability
    const noVehicleOwnerIndex = headers.indexOf('B25044_003E');
    const noVehicleRenterIndex = headers.indexOf('B25044_010E');
    const noVehicleTotal = parseInt(targetRow[noVehicleOwnerIndex]) + parseInt(targetRow[noVehicleRenterIndex]);
    
    // Calculate disability status by summing all disability counts
    const disabilityIndices = [
      'B18101_004E', 'B18101_007E', 'B18101_010E', 'B18101_013E', 'B18101_016E', 'B18101_019E',
      'B18101_023E', 'B18101_026E', 'B18101_029E', 'B18101_032E', 'B18101_035E', 'B18101_038E'
    ].map(code => headers.indexOf(code));
    
    const totalDisabled = disabilityIndices.reduce((sum, index) => {
      return sum + (parseInt(targetRow[index]) || 0);
    }, 0);
    
    // Calculate low income population (households with income < $25,000)
    const lowIncomeIndices = [
      'B19001_002E', 'B19001_003E', 'B19001_004E', 'B19001_005E'
    ].map(code => headers.indexOf(code));
    
    const totalLowIncome = lowIncomeIndices.reduce((sum, index) => {
      return sum + (parseInt(targetRow[index]) || 0);
    }, 0);
    
    const totalHouseholdsIndex = headers.indexOf('B19001_001E');
    
    // Calculate age distribution
    const under18Indices = [
      'B01001_003E', 'B01001_004E', 'B01001_005E', 'B01001_006E',
      'B01001_027E', 'B01001_028E', 'B01001_029E', 'B01001_030E'
    ].map(code => headers.indexOf(code));
    
    const age18to24Indices = [
      'B01001_007E', 'B01001_008E', 'B01001_009E', 'B01001_010E',
      'B01001_031E', 'B01001_032E', 'B01001_033E', 'B01001_034E'
    ].map(code => headers.indexOf(code));
    
    const age25to44Indices = [
      'B01001_011E', 'B01001_012E', 'B01001_013E', 'B01001_014E',
      'B01001_035E', 'B01001_036E', 'B01001_037E', 'B01001_038E'
    ].map(code => headers.indexOf(code));
    
    const age45to64Indices = [
      'B01001_015E', 'B01001_016E', 'B01001_017E', 'B01001_018E', 'B01001_019E',
      'B01001_039E', 'B01001_040E', 'B01001_041E', 'B01001_042E', 'B01001_043E'
    ].map(code => headers.indexOf(code));
    
    const age65PlusIndices = [
      'B01001_020E', 'B01001_021E', 'B01001_022E', 'B01001_023E', 'B01001_024E', 'B01001_025E',
      'B01001_044E', 'B01001_045E', 'B01001_046E', 'B01001_047E', 'B01001_048E', 'B01001_049E'
    ].map(code => headers.indexOf(code));
    
    const under18 = under18Indices.reduce((sum, index) => sum + (parseInt(targetRow[index]) || 0), 0);
    const age18to24 = age18to24Indices.reduce((sum, index) => sum + (parseInt(targetRow[index]) || 0), 0);
    const age25to44 = age25to44Indices.reduce((sum, index) => sum + (parseInt(targetRow[index]) || 0), 0);
    const age45to64 = age45to64Indices.reduce((sum, index) => sum + (parseInt(targetRow[index]) || 0), 0);
    const age65Plus = age65PlusIndices.reduce((sum, index) => sum + (parseInt(targetRow[index]) || 0), 0);
    
    // Calculate percentages
    const totalPop = parseInt(targetRow[totalPopIndex]);
    const totalRacePop = parseInt(targetRow[totalRacePopIndex]);
    const totalHouseholds = parseInt(targetRow[totalHouseholdsIndex]);
    
    // Assemble the demographic data
    return {
      totalPopulation: totalPop,
      medianIncome: parseInt(targetRow[medianIncomeIndex]),
      percentMinority: 100 - (parseInt(targetRow[whiteIndex]) / totalRacePop * 100),
      percentLowIncome: (totalLowIncome / totalHouseholds) * 100,
      percentWithDisability: (totalDisabled / totalPop) * 100,
      percentWithoutVehicle: (noVehicleTotal / totalHouseholds) * 100,
      
      ageDistribution: {
        under18: (under18 / totalPop) * 100,
        age18to24: (age18to24 / totalPop) * 100,
        age25to44: (age25to44 / totalPop) * 100,
        age45to64: (age45to64 / totalPop) * 100,
        age65Plus: (age65Plus / totalPop) * 100
      },
      
      ethnicityDistribution: {
        white: (parseInt(targetRow[whiteIndex]) / totalRacePop) * 100,
        black: (parseInt(targetRow[blackIndex]) / totalRacePop) * 100,
        hispanic: (parseInt(targetRow[hispanicIndex]) / totalPop) * 100,
        asian: (parseInt(targetRow[asianIndex]) / totalRacePop) * 100,
        nativeAmerican: (parseInt(targetRow[nativeAmericanIndex]) / totalRacePop) * 100,
        pacificIslander: (parseInt(targetRow[pacificIslanderIndex]) / totalRacePop) * 100,
        multiRacial: (parseInt(targetRow[multiRacialIndex]) / totalRacePop) * 100,
        other: (parseInt(targetRow[otherRaceIndex]) / totalRacePop) * 100
      },
      
      source: 'US Census Bureau American Community Survey',
      year: year
    };
    
  } catch (error) {
    console.error('Error fetching Census data:', error);
    const { county, state } = extractLocationComponents(location);
    return getSampleDemographicData(county, state);
  }
}

/**
 * Generates a human-readable summary of demographic data
 * @param demographics The demographic data
 * @returns A string with a human-readable summary
 */
export function generateDemographicsSummary(demographics: DemographicData): string {
  if (!demographics) {
    return 'No demographic data available.';
  }

  // Format numbers
  const formatPercent = (num?: number) => num !== undefined ? `${num.toFixed(1)}%` : 'N/A';
  const formatCurrency = (num?: number) => {
    if (num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const summary = `
Demographic Summary:
- Population: ${demographics.totalPopulation.toLocaleString()}
- Median Income: ${formatCurrency(demographics.medianIncome)}
- Minority Population: ${formatPercent(demographics.percentMinority)}
- Low-Income Population: ${formatPercent(demographics.percentLowIncome)}
- Population with Disability: ${formatPercent(demographics.percentWithDisability)}
- Households without Vehicle Access: ${formatPercent(demographics.percentWithoutVehicle)}

Age Distribution:
- Under 18: ${formatPercent(demographics.ageDistribution?.under18)}
- 18-24: ${formatPercent(demographics.ageDistribution?.age18to24)}
- 25-44: ${formatPercent(demographics.ageDistribution?.age25to44)}
- 45-64: ${formatPercent(demographics.ageDistribution?.age45to64)}
- 65 and older: ${formatPercent(demographics.ageDistribution?.age65Plus)}

Ethnic Distribution:
- White: ${formatPercent(demographics.ethnicityDistribution?.white)}
- Black/African American: ${formatPercent(demographics.ethnicityDistribution?.black)}
- Hispanic/Latino: ${formatPercent(demographics.ethnicityDistribution?.hispanic)}
- Asian: ${formatPercent(demographics.ethnicityDistribution?.asian)}
- Native American: ${formatPercent(demographics.ethnicityDistribution?.nativeAmerican)}
- Pacific Islander: ${formatPercent(demographics.ethnicityDistribution?.pacificIslander)}
- Multiracial: ${formatPercent(demographics.ethnicityDistribution?.multiRacial)}
- Other: ${formatPercent(demographics.ethnicityDistribution?.other)}

Source: ${demographics.source || 'Unknown'} (${demographics.year || 'Unknown'})
  `;

  return summary.trim();
}

/**
 * Extract county and state from a location string
 * @param location The location string (e.g., "San Francisco, CA")
 * @returns Object with county and state
 */
function extractLocationComponents(location: string): { county?: string; state?: string } {
  // Remove any trailing zip codes
  const locationWithoutZip = location.replace(/\d{5}(-\d{4})?$/, '').trim();
  
  // Try to extract state
  let state: string | undefined;
  const stateMatch = locationWithoutZip.match(/,\s*([A-Z]{2})$/);
  if (stateMatch) {
    state = stateMatch[1];
  } else {
    // Try full state names
    const stateNames = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
      'Wisconsin', 'Wyoming'
    ];
    
    for (const stateName of stateNames) {
      if (locationWithoutZip.endsWith(stateName)) {
        state = stateName;
        break;
      }
      if (locationWithoutZip.includes(`, ${stateName}`)) {
        state = stateName;
        break;
      }
    }
  }
  
  // Try to extract county
  let county: string | undefined;
  
  // Common California county names to check
  const commonCounties = [
    'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 
    'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo', 
    'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 
    'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 
    'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 
    'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 
    'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou', 
    'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 
    'Tuolumne', 'Ventura', 'Yolo', 'Yuba'
  ];
  
  // Map of major cities to their counties
  const cityToCounty: Record<string, string> = {
    'San Francisco': 'San Francisco',
    'Los Angeles': 'Los Angeles',
    'San Diego': 'San Diego',
    'San Jose': 'Santa Clara',
    'Oakland': 'Alameda',
    'Sacramento': 'Sacramento',
    'Fresno': 'Fresno',
    'Long Beach': 'Los Angeles',
    'Bakersfield': 'Kern',
    'Anaheim': 'Orange',
    'Santa Ana': 'Orange',
    'Riverside': 'Riverside',
    'Stockton': 'San Joaquin',
    'Irvine': 'Orange',
    'Chula Vista': 'San Diego',
    'Fremont': 'Alameda',
    'San Bernardino': 'San Bernardino',
    'Modesto': 'Stanislaus',
    'Fontana': 'San Bernardino',
    'Santa Clarita': 'Los Angeles',
    'Oxnard': 'Ventura',
    'Moreno Valley': 'Riverside',
    'Glendale': 'Los Angeles',
    'Huntington Beach': 'Orange',
    'Santa Rosa': 'Sonoma',
    'Pasadena': 'Los Angeles',
    'Thousand Oaks': 'Ventura',
    'Simi Valley': 'Ventura',
    'Concord': 'Contra Costa',
    'Roseville': 'Placer',
    'Visalia': 'Tulare',
    'El Monte': 'Los Angeles',
    'Downey': 'Los Angeles',
    'Costa Mesa': 'Orange',
    'Carlsbad': 'San Diego',
    'Victorville': 'San Bernardino',
    'Fairfield': 'Solano',
    'Temecula': 'Riverside',
    'Antioch': 'Contra Costa',
    'Richmond': 'Contra Costa',
    'Murrieta': 'Riverside',
    'San Juan Capistrano': 'Orange',
    'Palo Alto': 'Santa Clara',
    'Berkeley': 'Alameda',
    'Santa Monica': 'Los Angeles',
    'Culver City': 'Los Angeles',
    'Walnut Creek': 'Contra Costa',
    'South San Francisco': 'San Mateo',
    'San Bruno': 'San Mateo',
    'San Rafael': 'Marin',
    'Novato': 'Marin'
  };
  
  // Check for explicit county mention
  for (const countyName of commonCounties) {
    if (locationWithoutZip.includes(`${countyName} County`)) {
      county = countyName;
      break;
    }
  }
  
  // If county not found, check for major city
  if (!county) {
    for (const [city, countyName] of Object.entries(cityToCounty)) {
      if (locationWithoutZip.includes(city)) {
        county = countyName;
        break;
      }
    }
  }
  
  return { county, state };
}

/**
 * Get the state FIPS code by name or abbreviation
 * @param state State name or 2-letter code
 * @returns FIPS code for the state
 */
function getStateCodeByName(state: string): string {
  const stateMap: Record<string, string> = {
    // State names to FIPS codes
    'ALABAMA': '01', 'ALASKA': '02', 'ARIZONA': '04', 'ARKANSAS': '05', 'CALIFORNIA': '06',
    'COLORADO': '08', 'CONNECTICUT': '09', 'DELAWARE': '10', 'FLORIDA': '12', 'GEORGIA': '13',
    'HAWAII': '15', 'IDAHO': '16', 'ILLINOIS': '17', 'INDIANA': '18', 'IOWA': '19',
    'KANSAS': '20', 'KENTUCKY': '21', 'LOUISIANA': '22', 'MAINE': '23', 'MARYLAND': '24',
    'MASSACHUSETTS': '25', 'MICHIGAN': '26', 'MINNESOTA': '27', 'MISSISSIPPI': '28', 'MISSOURI': '29',
    'MONTANA': '30', 'NEBRASKA': '31', 'NEVADA': '32', 'NEW HAMPSHIRE': '33', 'NEW JERSEY': '34',
    'NEW MEXICO': '35', 'NEW YORK': '36', 'NORTH CAROLINA': '37', 'NORTH DAKOTA': '38', 'OHIO': '39',
    'OKLAHOMA': '40', 'OREGON': '41', 'PENNSYLVANIA': '42', 'RHODE ISLAND': '44', 'SOUTH CAROLINA': '45',
    'SOUTH DAKOTA': '46', 'TENNESSEE': '47', 'TEXAS': '48', 'UTAH': '49', 'VERMONT': '50',
    'VIRGINIA': '51', 'WASHINGTON': '53', 'WEST VIRGINIA': '54', 'WISCONSIN': '55', 'WYOMING': '56',
    
    // State abbreviations to FIPS codes
    'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 'CT': '09',
    'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18',
    'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24', 'MA': '25',
    'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32',
    'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
    'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
    'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55',
    'WY': '56'
  };
  
  // Standardize input to match the keys in the map
  const standardizedState = state.toUpperCase();
  return stateMap[standardizedState] || '06'; // Default to California if not found
}

/**
 * Get sample demographic data when Census API is unavailable
 * @param county Optional county name to customize the sample data
 * @param state Optional state name to customize the sample data
 * @returns Sample demographic data
 */
function getSampleDemographicData(county?: string, state?: string): DemographicData {
  const countyName = county || 'Sample County';
  const stateName = state || 'California';
  
  // California statewide demographics as default
  const baseData: DemographicData = {
    totalPopulation: 39538223,
    medianIncome: 78672,
    percentMinority: 63.5,
    percentLowIncome: 19.7,
    percentWithDisability: 10.4,
    percentWithoutVehicle: 7.1,
    ageDistribution: {
      under18: 22.5,
      age18to24: 9.4,
      age25to44: 28.8,
      age45to64: 25.1,
      age65Plus: 14.2
    },
    ethnicityDistribution: {
      white: 36.5,
      black: 5.7,
      hispanic: 39.4,
      asian: 15.1,
      nativeAmerican: 0.8,
      pacificIslander: 0.4,
      multiRacial: 3.0,
      other: 0.1
    },
    source: 'Sample data based on California demographics',
    year: new Date().getFullYear() - 1
  };
  
  // Adjust based on common county profiles if known
  if (county) {
    if (county.toLowerCase().includes('san francisco')) {
      return {
        ...baseData,
        totalPopulation: 873965,
        medianIncome: 112449,
        percentMinority: 58.2,
        percentLowIncome: 17.3,
        percentWithDisability: 11.1,
        percentWithoutVehicle: 30.5,
        ageDistribution: {
          under18: 13.4,
          age18to24: 8.1,
          age25to44: 39.4,
          age45to64: 23.7,
          age65Plus: 15.4
        },
        ethnicityDistribution: {
          white: 41.8,
          black: 5.6,
          hispanic: 15.2,
          asian: 34.4,
          nativeAmerican: 0.4,
          pacificIslander: 0.4,
          multiRacial: 5.1,
          other: 0.1
        },
        source: 'Sample data based on San Francisco demographics',
      };
    } else if (county.toLowerCase().includes('los angeles')) {
      return {
        ...baseData,
        totalPopulation: 10014009,
        medianIncome: 71358,
        percentMinority: 73.5,
        percentLowIncome: 21.2,
        percentWithDisability: 9.9,
        percentWithoutVehicle: 9.8,
        ageDistribution: {
          under18: 21.7,
          age18to24: 9.5,
          age25to44: 30.4,
          age45to64: 24.8,
          age65Plus: 13.6
        },
        ethnicityDistribution: {
          white: 26.5,
          black: 8.1,
          hispanic: 48.5,
          asian: 14.4,
          nativeAmerican: 0.7,
          pacificIslander: 0.3,
          multiRacial: 2.2,
          other: 0.2
        },
        source: 'Sample data based on Los Angeles County demographics',
      };
    }
  }
  
  // Return the base data with adjusted source
  return {
    ...baseData,
    source: `Sample data based on ${stateName} demographics`
  };
} 