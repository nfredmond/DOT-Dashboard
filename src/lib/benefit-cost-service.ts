/**
 * Benefit Cost Analysis Service
 * 
 * Provides functions for creating, retrieving, updating, and calculating
 * benefit-cost analyses for transportation projects and scenarios.
 */

import { v4 as uuidv4 } from 'uuid';
import { getClient } from './supabase-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  BenefitCostAnalysis, 
  BenefitCostAnalysisMethod, 
  BenefitCostAnalysisResult,
  // BenefitCostParameter, 
  BenefitCostTemplate, 
  BenefitCategory,
  BenefitCostTimeSeries, 
  BenefitValueCalculation,
  CostCategory,
  CostValueCalculation,
  // DistributionalAnalysis,
  MonetizationParameters,
  // MonteCarloSimulation,
  SensitivityAnalysis
} from '../types/benefit-cost';
import { runAgentQuery, AgentType, RunAgentQueryOptions, AgentQueryResponse } from './agents-service';

// Default monetization parameters
const DEFAULT_MONETIZATION_PARAMETERS: MonetizationParameters = {
  valueOfTime: {
    commuter: 18.80,      // $ per hour (2023 USD)
    commercial: 32.60,    // $ per hour (2023 USD)
    freight: 38.50,       // $ per hour (2023 USD)
  },
  accidentCosts: {
    fatal: 11000000,      // $ per accident (2023 USD)
    injury: 125000,       // $ per accident (2023 USD)
    propertyDamage: 4500, // $ per accident (2023 USD)
  },
  vehicleOperating: {
    fuelCost: 3.50,       // $ per gallon (2023 USD)
    maintenance: 0.15,    // $ per mile (2023 USD)
    depreciation: 0.28,   // $ per mile (2023 USD)
  },
  emissions: {
    co2: 51,              // $ per metric ton (2023 USD) 
    nox: 7400,            // $ per ton (2023 USD)
    pm: 380000,           // $ per ton (2023 USD)
  },
  discount: {
    rate: 0.07,           // 7% discount rate (OMB default)
    year: 2023,           // Base year for discounting
  },
  health: {
    walking: 0.92,        // $ per mile walked (2023 USD)
    biking: 0.41,         // $ per mile biked (2023 USD)
  },
  propertyValues: {
    residential: 0.05,    // 5% increase within 0.5 miles
    commercial: 0.08,     // 8% increase within 0.5 miles
  },
  economic: {
    jobsMultiplier: 17.8, // jobs per $1M investment
    gdpMultiplier: 2.0,   // $ GDP per $ investment
  }
};

// Default templates for common grant programs
const DEFAULT_TEMPLATES: BenefitCostTemplate[] = [
  {
    id: 'raise',
    name: 'USDOT RAISE',
    description: 'Rebuilding American Infrastructure with Sustainability and Equity (RAISE) grant program',
    parameters: DEFAULT_MONETIZATION_PARAMETERS,
    benefitCategories: [
      BenefitCategory.TRAVEL_TIME_SAVINGS,
      BenefitCategory.SAFETY,
      BenefitCategory.VEHICLE_OPERATING_COSTS,
      BenefitCategory.EMISSIONS,
      BenefitCategory.HEALTH,
      BenefitCategory.ECONOMIC_DEVELOPMENT,
    ],
    costCategories: [
      CostCategory.CAPITAL,
      CostCategory.OPERATIONS,
      CostCategory.MAINTENANCE,
    ],
    defaultAnalysisHorizon: 20,
    defaultDiscountRate: 0.07,
    methodologies: [
      BenefitCostAnalysisMethod.NET_PRESENT_VALUE,
      BenefitCostAnalysisMethod.BENEFIT_COST_RATIO,
    ],
    sensitivityDefaults: {
      parameters: ['discountRate', 'valueOfTime.commuter', 'capital'],
      lowAdjustment: 0.8,
      highAdjustment: 1.2,
    },
    distributionalDefaults: {
      demographicGroups: ['low-income', 'minority', 'zero-car households'],
    },
    grantProgram: {
      name: 'RAISE',
      requirements: ['Justice40 analysis required', 'Emissions analysis required'],
      thresholds: {
        minBCR: 1.0,
      },
    },
  },
  {
    id: 'infra',
    name: 'USDOT INFRA',
    description: 'Infrastructure For Rebuilding America (INFRA) grant program',
    parameters: DEFAULT_MONETIZATION_PARAMETERS,
    benefitCategories: [
      BenefitCategory.TRAVEL_TIME_SAVINGS,
      BenefitCategory.SAFETY,
      BenefitCategory.VEHICLE_OPERATING_COSTS,
      BenefitCategory.EMISSIONS,
      BenefitCategory.ECONOMIC_DEVELOPMENT,
    ],
    costCategories: [
      CostCategory.CAPITAL,
      CostCategory.OPERATIONS,
      CostCategory.MAINTENANCE,
    ],
    defaultAnalysisHorizon: 30,
    defaultDiscountRate: 0.07,
    methodologies: [
      BenefitCostAnalysisMethod.NET_PRESENT_VALUE,
      BenefitCostAnalysisMethod.BENEFIT_COST_RATIO,
    ],
    sensitivityDefaults: {
      parameters: ['discountRate', 'capital'],
      lowAdjustment: 0.8,
      highAdjustment: 1.2,
    },
    distributionalDefaults: {
      demographicGroups: ['low-income', 'minority'],
    },
    grantProgram: {
      name: 'INFRA',
      requirements: ['Freight analysis required'],
      thresholds: {
        minBCR: 1.0,
      },
    },
  },
];

/**
 * Fetch benefit-cost analysis templates
 * @param organizationId (Optional) Organization ID to filter templates
 * @returns Array of benefit-cost analysis templates
 */
export async function getBenefitCostTemplates(organizationId?: string): Promise<BenefitCostTemplate[]> {
  const supabase = getClient(organizationId) as SupabaseClient;
  
  // Get templates from database
  const { data: dbTemplates, error } = await supabase
    .from('benefit_cost_templates')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching benefit-cost templates:', error);
    return DEFAULT_TEMPLATES;
  }
  
  // Return database templates if they exist, otherwise default templates
  return dbTemplates.length > 0 ? dbTemplates : DEFAULT_TEMPLATES;
}

// Helper function to reconstruct MonetizationParameters from flat table rows
function reconstructMonetizationParameters(rows: any[]): MonetizationParameters {
  const params: any = JSON.parse(JSON.stringify(DEFAULT_MONETIZATION_PARAMETERS)); // Start with defaults as a base

  for (const row of rows) {
    if (row.category && row.name) {
      if (!params[row.category]) {
        params[row.category] = {};
      }
      // Ensure value is parsed as a number if it's a numeric field
      // This is a simplified assumption; a more robust solution would check the type of the target field in MonetizationParameters
      const numericValue = parseFloat(row.value);
      params[row.category][row.name] = isNaN(numericValue) ? row.value : numericValue;
    } else if (row.name && typeof params[row.name] !== 'object') { // Direct top-level parameter like discountRate (if stored flatly)
        const numericValue = parseFloat(row.value);
        params[row.name] = isNaN(numericValue) ? row.value : numericValue;
    }
  }
  return params as MonetizationParameters;
}

export async function getOrganizationMonetizationParameters(organizationId: string): Promise<MonetizationParameters> {
  const supabase = getClient(organizationId) as SupabaseClient;
  const { data, error } = await supabase
    .from('benefit_cost_parameters')
    .select('name, category, value, unit, year_valid')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching organization monetization parameters:', error);
    // Optionally, could throw error or handle differently. For now, defaults to system defaults.
    return DEFAULT_MONETIZATION_PARAMETERS;
  }

  if (!data || data.length === 0) {
    return DEFAULT_MONETIZATION_PARAMETERS;
  }

  return reconstructMonetizationParameters(data);
}

// Helper function to flatten MonetizationParameters for database storage
function flattenMonetizationParameters(
  params: MonetizationParameters, 
  organizationId: string
): any[] {
  const rows: any[] = [];
  const now = new Date().toISOString();

  function processObject(obj: any, currentCategory: string | null) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        processObject(obj[key], currentCategory ? `${currentCategory}.${key}` : key);
      } else {
        // Attempt to get unit and year_valid from DEFAULT_MONETIZATION_PARAMETERS structure as a simple heuristic
        // A more robust system might involve explicit unit/year per parameter in MonetizationParameters type or a detailed mapping
        let unit = 'unknown';
        // Safely access discount.year with a type assertion for the known structure of DEFAULT_MONETIZATION_PARAMETERS
        const defaultDiscountInfo = DEFAULT_MONETIZATION_PARAMETERS.discount as { rate?: number; year?: number };
        let yearValid = defaultDiscountInfo?.year || new Date().getFullYear(); 
        
        // Example: try to find unit for valueOfTime.commuter
        if (currentCategory === 'valueOfTime' && DEFAULT_MONETIZATION_PARAMETERS.valueOfTime && (DEFAULT_MONETIZATION_PARAMETERS.valueOfTime as any)[key]) {
            unit = '$/hour'; // Assuming based on context
        } else if (currentCategory === 'emissions' && DEFAULT_MONETIZATION_PARAMETERS.emissions && (DEFAULT_MONETIZATION_PARAMETERS.emissions as any)[key]) {
            unit = key === 'co2' ? '$/metric ton' : '$/ton'; // Assuming
        } else if (currentCategory === 'discount' && key === 'rate') {
            unit = '%'; // Rate is a percentage
        }
        // ... more specific unit/year logic could be added here based on parameter paths

        rows.push({
          organization_id: organizationId,
          category: currentCategory, // This will be the path like 'valueOfTime' or 'emissions'
          name: key, // This will be the specific parameter like 'commuter' or 'co2'
          value: obj[key],
          unit: unit, 
          year_valid: yearValid,
          // id: uuidv4(), // If primary key is UUID and not auto-generated by DB policy for this table per row
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  processObject(params, null);
  return rows;
}

export async function saveOrganizationMonetizationParameters(
  organizationId: string, 
  params: MonetizationParameters
): Promise<void> {
  const supabase = getClient(organizationId) as SupabaseClient;

  // Delete existing parameters for the organization
  const { error: deleteError } = await supabase
    .from('benefit_cost_parameters')
    .delete()
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('Error deleting existing organization monetization parameters:', deleteError);
    throw new Error('Failed to delete existing parameters: ' + deleteError.message);
  }

  // Flatten and insert new parameters
  const rowsToInsert = flattenMonetizationParameters(params, organizationId);

  if (rowsToInsert.length === 0) {
    console.warn('No parameters to save for organization:', organizationId);
    return;
  }
  
  // Supabase insert usually wants an array of objects. UUIDs for each row might be needed if not auto-generated.
  // Assuming 'id' in benefit_cost_parameters is auto-generated or we add uuidv4() in flattenMonetizationParameters
  const { error: insertError } = await supabase
    .from('benefit_cost_parameters')
    .insert(rowsToInsert);

  if (insertError) {
    console.error('Error inserting new organization monetization parameters:', insertError);
    throw new Error('Failed to save new parameters: ' + insertError.message);
  }
}

/**
 * Create a new benefit-cost analysis template
 * @param template Template to create
 * @param organizationId Organization ID
 * @returns Created template
 */
export async function createBenefitCostTemplate(
  template: Omit<BenefitCostTemplate, 'id'>,
  organizationId: string
): Promise<BenefitCostTemplate> {
  const supabase = getClient(organizationId) as SupabaseClient;
  const newTemplate = {
    ...template,
    id: uuidv4(),
  };
  
  const { data, error } = await supabase
    .from('benefit_cost_templates')
    .insert(newTemplate)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating benefit-cost template:', error);
    throw new Error(`Failed to create template: ${error.message}`);
  }
  
  return data;
}

/**
 * Calculate the Net Present Value (NPV) of a series of cash flows
 * @param cashflows Array of cash flows by year
 * @param discountRate Discount rate (e.g., 0.07 for 7%)
 * @param baseYear Base year for discounting
 * @returns Net Present Value
 */
export function calculateNPV(
  cashflows: BenefitCostTimeSeries[],
  discountRate: number,
  baseYear: number
): number {
  let npv = 0;
  
  for (const flow of cashflows) {
    const yearsFromBase = flow.year - baseYear;
    const discountFactor = 1 / Math.pow(1 + discountRate, yearsFromBase);
    npv += flow.value * discountFactor;
  }
  
  return npv;
}

/**
 * Calculate Benefit-Cost Ratio (BCR)
 * @param benefits Present value of benefits
 * @param costs Present value of costs
 * @returns Benefit-Cost Ratio
 */
export function calculateBCR(benefits: number, costs: number): number {
  if (costs === 0) return 0;
  return benefits / costs;
}

/**
 * Calculate Internal Rate of Return (IRR)
 * @param cashflows Combined benefits and costs as net cash flows
 * @returns Internal Rate of Return (as decimal, e.g., 0.08 for 8%)
 */
export function calculateIRR(cashflows: BenefitCostTimeSeries[]): number | null {
  // Simple IRR estimation using Newton's method
  const MAX_ITERATIONS = 100;
  const PRECISION = 0.0001;
  
  // Sort cashflows by year
  const sortedFlows = [...cashflows].sort((a, b) => a.year - b.year);
  
  // Prepare net flows by year (combining benefits and costs)
  const netFlows: number[] = [];
  let firstYear = sortedFlows[0].year;
  
  // Initialize array with zeros
  for (const flow of sortedFlows) {
    const yearIndex = flow.year - firstYear;
    if (!netFlows[yearIndex]) {
      netFlows[yearIndex] = 0;
    }
    netFlows[yearIndex] += flow.value;
  }
  
  // Check if there's at least one positive and one negative flow
  const hasPositive = netFlows.some(flow => flow > 0);
  const hasNegative = netFlows.some(flow => flow < 0);
  
  if (!hasPositive || !hasNegative) {
    // IRR requires both positive and negative flows
    return null;
  }
  
  // Newton's method to estimate IRR
  let rate = 0.1; // Initial guess
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let npv = 0;
    let derivativeNpv = 0;
    
    for (let j = 0; j < netFlows.length; j++) {
      npv += netFlows[j] / Math.pow(1 + rate, j);
      derivativeNpv -= j * netFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    if (Math.abs(npv) < PRECISION) {
      return rate;
    }
    
    // Avoid division by zero
    if (derivativeNpv === 0) {
      return null;
    }
    
    // Update rate
    const newRate = rate - npv / derivativeNpv;
    
    // Check for convergence
    if (Math.abs(newRate - rate) < PRECISION) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  // Did not converge
  return null;
}

/**
 * Calculate Payback Period
 * @param benefits Annual benefits time series
 * @param costs Annual costs time series
 * @returns Payback period in years (decimal)
 */
export function calculatePaybackPeriod(
  benefits: BenefitCostTimeSeries[],
  costs: BenefitCostTimeSeries[]
): number | null {
  // Group by year
  const benefitsByYear = new Map<number, number>();
  const costsByYear = new Map<number, number>();
  
  for (const benefit of benefits) {
    const existing = benefitsByYear.get(benefit.year) || 0;
    benefitsByYear.set(benefit.year, existing + benefit.value);
  }
  
  for (const cost of costs) {
    const existing = costsByYear.get(cost.year) || 0;
    costsByYear.set(cost.year, existing + cost.value);
  }
  
  // Get all years
  const years = Array.from(new Set([
    ...Array.from(benefitsByYear.keys()),
    ...Array.from(costsByYear.keys()),
  ])).sort();
  
  if (years.length === 0) return null;
  
  let cumulativeCosts = 0;
  let cumulativeBenefits = 0;
  let previousYear = years[0] - 1;
  let previousNet = 0;
  
  for (const year of years) {
    const yearCosts = costsByYear.get(year) || 0;
    const yearBenefits = benefitsByYear.get(year) || 0;
    
    cumulativeCosts += yearCosts;
    cumulativeBenefits += yearBenefits;
    
    const netCumulative = cumulativeBenefits - cumulativeCosts;
    
    // Check if we've crossed from negative to positive
    if (previousNet < 0 && netCumulative >= 0) {
      // Interpolate to find exact point
      const fraction = (0 - previousNet) / (netCumulative - previousNet);
      return previousYear + fraction;
    }
    
    previousYear = year;
    previousNet = netCumulative;
  }
  
  // If we never reach payback
  return null;
}

/**
 * Calculate benefits for a specific category based on input data
 * @param category Benefit category
 * @param inputs Input data for calculation
 * @param parameters Monetization parameters
 * @param analysisHorizon Analysis horizon in years
 * @param baseYear Base year for analysis
 * @param discountRate Discount rate for present value calculations
 * @returns Benefit calculation result
 */
export function calculateBenefitCategory(
  category: BenefitCategory,
  inputs: any,
  parameters: MonetizationParameters,
  analysisHorizon: number,
  baseYear: number,
  discountRate: number
): BenefitValueCalculation {
  const annualValues: BenefitCostTimeSeries[] = [];
  
  // Calculate annual values based on category
  switch (category) {
    case BenefitCategory.TRAVEL_TIME_SAVINGS:
      // Example calculation for travel time savings
      if (inputs.hoursSaved) {
        for (let year = 0; year < analysisHorizon; year++) {
          const currentYear = baseYear + year;
          const commuterHours = inputs.hoursSaved.commuter || 0;
          const commercialHours = inputs.hoursSaved.commercial || 0;
          const freightHours = inputs.hoursSaved.freight || 0;
          
          // Support both structured and legacy parameters
          let commuterValue: number, commercialValue: number, freightValue: number;
          
          if (parameters.valueOfTime && typeof parameters.valueOfTime === 'object') {
            // Use structured parameters
            commuterValue = commuterHours * (parameters.valueOfTime.commuter || 18.8);
            commercialValue = commercialHours * (parameters.valueOfTime.commercial || 32.6);
            freightValue = freightHours * (parameters.valueOfTime.freight || 38.5);
          } else {
            // Use legacy parameter (parameters.valueOfTime might be a number, or use valueOfTime_legacy)
            let legacyVOT: number | undefined = undefined;
            if (typeof parameters.valueOfTime === 'number') {
              legacyVOT = parameters.valueOfTime;
            } else if (typeof parameters.valueOfTime_legacy === 'number') {
              legacyVOT = parameters.valueOfTime_legacy;
            }
            const valueOfTimeForCommuter = legacyVOT !== undefined ? legacyVOT : 18.8; // Default for commuter
            
            commuterValue = commuterHours * valueOfTimeForCommuter;

            if (legacyVOT !== undefined) { // A single VOT value was found from legacy fields
                commercialValue = commercialHours * legacyVOT * 1.5; // Apply multiplier
                freightValue = freightHours * legacyVOT * 1.7;   // Apply multiplier
            } else { // No single legacy/direct number VOT found, use hardcoded defaults for each category
                commercialValue = commercialHours * 32.6;
                freightValue = freightHours * 38.5;
            }
          }
          
          const yearValue = commuterValue + commercialValue + freightValue;
          
          annualValues.push({
            year: currentYear,
            value: yearValue,
            category: BenefitCategory.TRAVEL_TIME_SAVINGS,
          });
        }
      }
      break;
      
    case BenefitCategory.SAFETY:
      // Example calculation for accident reduction
      if (inputs.accidentsReduced) {
        for (let year = 0; year < analysisHorizon; year++) {
          const currentYear = baseYear + year;
          const fatalReduction = inputs.accidentsReduced.fatal || 0;
          const injuryReduction = inputs.accidentsReduced.injury || 0;
          const pdoReduction = inputs.accidentsReduced.propertyDamage || 0;
          
          // Support both structured and legacy parameters
          let fatalValue: number, injuryValue: number, pdoValue: number;
          
          if (parameters.accidentCosts && typeof parameters.accidentCosts === 'object') {
            // Use structured parameters
            fatalValue = fatalReduction * (parameters.accidentCosts.fatal || 11000000);
            injuryValue = injuryReduction * (parameters.accidentCosts.injury || 125000);
            pdoValue = pdoReduction * (parameters.accidentCosts.propertyDamage || 4500);
          } else {
            // Use legacy parameters (parameters.fatalityCost, parameters.injuryCost)
            const legacyFatalityCost = typeof parameters.fatalityCost === 'number' ? parameters.fatalityCost : 11000000;
            const legacyInjuryCost = typeof parameters.injuryCost === 'number' ? parameters.injuryCost : 125000;
            const pdoCostDefault = 4500; // Simpler: No direct legacy field for PDO, use hardcoded default.

            fatalValue = fatalReduction * legacyFatalityCost;
            injuryValue = injuryReduction * legacyInjuryCost;
            pdoValue = pdoReduction * pdoCostDefault;
          }
          
          const yearValue = fatalValue + injuryValue + pdoValue;
          
          annualValues.push({
            year: currentYear,
            value: yearValue,
            category: BenefitCategory.SAFETY,
          });
        }
      }
      break;
      
    // Add other benefit categories...
    
    default:
      // Handle any custom or unimplemented categories
      if (inputs.annualValue) {
        for (let year = 0; year < analysisHorizon; year++) {
          const currentYear = baseYear + year;
          annualValues.push({
            year: currentYear,
            value: inputs.annualValue,
            category: category,
          });
        }
      }
  }
  
  // Calculate present values
  let totalValue = 0;
  let presentValue = 0;
  
  for (const annual of annualValues) {
    totalValue += annual.value;
    
    const yearsFromBase = annual.year - baseYear;
    const effectiveDiscountRate = discountRate;
    const discountFactor = 1 / Math.pow(1 + effectiveDiscountRate, yearsFromBase);
    annual.presentValue = annual.value * discountFactor;
    presentValue += annual.presentValue;
  }
  
  return {
    category,
    totalValue,
    annualValues,
    presentValue,
    parameters: inputs,
  };
}

/**
 * Calculate costs for a specific category based on input data
 * @param category Cost category
 * @param inputs Input data for calculation (e.g., annual cost, specific cost items)
 * @param parameters Monetization parameters (though less likely to be used for direct costs)
 * @param analysisHorizon Analysis horizon in years
 * @param baseYear Base year for analysis
 * @param discountRate Discount rate for present value calculations
 * @returns Cost calculation result
 */
export function calculateCostCategory(
  category: CostCategory,
  inputs: any, 
  _parameters: MonetizationParameters, // MonetizationParameters typically for benefits, less so direct costs
  analysisHorizon: number,
  baseYear: number,
  discountRate: number
): CostValueCalculation {
  const annualValues: BenefitCostTimeSeries[] = [];

  // Calculate annual values based on category - this switch will be simpler for costs
  // Typically, costs are more direct inputs (e.g., capital cost in year X, annual O&M)
  switch (category) {
    case CostCategory.CAPITAL:
      // Example: Capital costs might be a lump sum or spread over a few years
      // inputs could be { year: Y, amount: X } or { startYear: Y, endYear: Z, annualAmount: A }
      if (inputs.totalAmount && inputs.year) { // Lump sum
        annualValues.push({
          year: inputs.year,
          value: inputs.totalAmount,
          category: category,
        });
      } else if (inputs.annualAmount) { // Spread cost
        const startYear = inputs.startYear || baseYear;
        const endYear = inputs.endYear || baseYear + (inputs.duration || 1) -1;
        for (let yr = startYear; yr <= endYear; yr++) {
          if (yr < baseYear + analysisHorizon) {
            annualValues.push({
              year: yr,
              value: inputs.annualAmount,
              category: category,
            });
          }
        }
      }
      break;

    case CostCategory.OPERATIONS:
    case CostCategory.MAINTENANCE:
    case CostCategory.VEHICLES:
    case CostCategory.OTHER:
      // Example: O&M costs are typically annual
      // inputs could be { annualAmount: X, escalationRate?: E }
      if (inputs.annualAmount) {
        let currentAnnualAmount = inputs.annualAmount;
        const escalationRate = inputs.escalationRate || 0;
        for (let year = 0; year < analysisHorizon; year++) {
          const currentYearVal = baseYear + year;
          annualValues.push({
            year: currentYearVal,
            value: currentAnnualAmount * Math.pow(1 + escalationRate, year),
            category: category,
          });
        }
      }
      break;

    default:
      // Handle any custom or unimplemented categories if inputs.annualValue exists
      if (inputs.annualValue) {
        for (let year = 0; year < analysisHorizon; year++) {
          const currentYearVal = baseYear + year;
          annualValues.push({
            year: currentYearVal,
            value: inputs.annualValue,
            category: category,
          });
        }
      }
      break;
  }

  // Calculate present values
  let totalValue = 0;
  let presentValue = 0;

  for (const annual of annualValues) {
    totalValue += annual.value;
    const yearsFromBase = annual.year - baseYear;
    const discountFactor = 1 / Math.pow(1 + discountRate, yearsFromBase);
    annual.presentValue = annual.value * discountFactor;
    presentValue += annual.presentValue;
  }

  return {
    category,
    totalValue,
    annualValues,
    presentValue,
    parameters: inputs, // Store the inputs used for this calculation
  };
}

/**
 * Perform sensitivity analysis on a benefit-cost analysis
 * @param analysis The benefit-cost analysis
 * @param parameters Parameters to vary
 * @param lowAdjustment Low adjustment factor (e.g., 0.8 for -20%)
 * @param highAdjustment High adjustment factor (e.g., 1.2 for +20%)
 * @returns Sensitivity analysis results
 */
export function performSensitivityAnalysis(
  analysis: BenefitCostAnalysis,
  parameters: string[],
  lowAdjustment: number = 0.8,
  highAdjustment: number = 1.2
): SensitivityAnalysis {
  const results: SensitivityAnalysis['results'] = [];
  
  for (const paramName of parameters) {
    // Get the base value
    let baseValue: number;
    
    // Handle nested parameters (e.g., valueOfTime.commuter)
    if (paramName.includes('.')) {
      const [category, subcategory] = paramName.split('.');
      baseValue = (analysis.parameters as any)[category][subcategory];
    } else if (paramName === 'discountRate') {
      baseValue = analysis.discountRate;
    } else {
      // Find in costs or other parameters
      baseValue = 0; // Default
    }
    
    // Clone the analysis and adjust the parameter
    const lowAnalysis = JSON.parse(JSON.stringify(analysis));
    const highAnalysis = JSON.parse(JSON.stringify(analysis));
    
    // Apply adjustments based on parameter
    if (paramName.includes('.')) {
      const [category, subcategory] = paramName.split('.');
      (lowAnalysis.parameters as any)[category][subcategory] = baseValue * lowAdjustment;
      (highAnalysis.parameters as any)[category][subcategory] = baseValue * highAdjustment;
    } else if (paramName === 'discountRate') {
      lowAnalysis.discountRate = baseValue * lowAdjustment;
      highAnalysis.discountRate = baseValue * highAdjustment;
    }
    
    // Calculate new results
    // Note: This is simplified; you would recalculate the full analysis
    const lowResult = analysis.benefitCostRatio * (1 - (1 - lowAdjustment));
    const highResult = analysis.benefitCostRatio * (1 + (highAdjustment - 1));
    
    results.push({
      parameterName: paramName,
      lowValueResult: lowResult,
      baseValueResult: analysis.benefitCostRatio,
      highValueResult: highResult,
      impact: (highResult - lowResult) / analysis.benefitCostRatio,
    });
  }
  
  // Sort by impact
  results.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  
  return {
    id: uuidv4(),
    name: `Sensitivity Analysis for ${analysis.name}`,
    parameters: parameters.map(paramName => {
      let baseValue: number;
      
      if (paramName.includes('.')) {
        const [category, subcategory] = paramName.split('.');
        baseValue = (analysis.parameters as any)[category][subcategory];
      } else if (paramName === 'discountRate') {
        baseValue = analysis.discountRate;
      } else {
        baseValue = 0;
      }
      
      return {
        parameterName: paramName,
        baseValue,
        lowValue: baseValue * lowAdjustment,
        highValue: baseValue * highAdjustment,
      };
    }),
    results,
  };
}

/**
 * Create a new benefit-cost analysis.
 * Can be seeded with initial data and/or a template.
 * @param initialAnalysisData Partial data for the new analysis. Must include projectId.
 * @param templateId Optional ID of a template to apply.
 * @param userId Optional ID of the user creating the analysis.
 * @param organizationId Optional Organization ID.
 * @returns The created benefit-cost analysis.
 */
export async function createBenefitCostAnalysis(
  initialAnalysisData: Partial<BenefitCostAnalysis>, // Contains projectId and other form data
  templateId?: string, // templateId now a separate optional parameter
  userId?: string,
  organizationId?: string
): Promise<BenefitCostAnalysis> {
  const supabase = getClient(organizationId) as SupabaseClient;

  if (!initialAnalysisData.projectId) {
    throw new Error("Project ID is required to create a benefit-cost analysis.");
  }

  let newAnalysisBase: Partial<BenefitCostAnalysis> = {
    id: uuidv4(),
    parameters: DEFAULT_MONETIZATION_PARAMETERS, // Start with global defaults
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId || 'system',
    name: 'Untitled Analysis',
    description: '',
    discountRate: 0.07,
    baseYear: new Date().getFullYear(),
    analysisHorizon: 20,
    benefits: [],
    costs: [],
    annualBenefits: [],
    annualCosts: [],
    netPresentValue: 0,
    benefitCostRatio: 0,
    isPublic: false,
    methodology: 'Default',
    assumptions: [],
    limitations: [],
    tags: [],
    // Overlay with any provided initial data (projectId, name, user-entered benefits/costs etc.)
    // Important: initialAnalysisData might contain benefits/costs arrays populated by the user in the form.
    ...initialAnalysisData, 
  };

  // Apply template if templateId is provided
  if (templateId) {
    const templates = await getBenefitCostTemplates(organizationId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      newAnalysisBase = {
        ...newAnalysisBase, // Keep user-entered details from initialAnalysisData first
        // Then overlay template defaults for non-data fields if not already set by user
        name: initialAnalysisData.name || template.name || newAnalysisBase.name,
        description: initialAnalysisData.description || template.description || newAnalysisBase.description,
        methodology: template.name || newAnalysisBase.methodology, 
        discountRate: initialAnalysisData.discountRate || template.defaultDiscountRate || newAnalysisBase.discountRate,
        analysisHorizon: initialAnalysisData.analysisHorizon || template.defaultAnalysisHorizon || newAnalysisBase.analysisHorizon,
        // Parameters merging: take user-defined, then template, then global default.
        // This is complex if parameters are partially filled. For now, template overwrites if user hasn't started customizing.
        parameters: initialAnalysisData.parameters && Object.keys(initialAnalysisData.parameters).length > 0 
                      ? initialAnalysisData.parameters 
                      : template.parameters || newAnalysisBase.parameters,
        // DO NOT overwrite benefits/costs arrays here if user has already entered them via initialAnalysisData.
        // The template's suggested categories are for UI guidance, not for overwriting user data at this stage.
      };
    }
  }
  
  // Ensure all required fields are present before insertion
  const finalNewAnalysis = newAnalysisBase as BenefitCostAnalysis;

  const { data, error } = await supabase
    .from('benefit_cost_analyses') 
    .insert(finalNewAnalysis)
    .select()
    .single();

  if (error) {
    console.error('Error creating benefit-cost analysis:', error);
    throw new Error(`Failed to create benefit-cost analysis: ${error.message}`);
  }
  
  return data as BenefitCostAnalysis;
}

/**
 * Get all benefit-cost analyses for a project
 * @param projectId Project ID
 * @param organizationId Organization ID
 * @returns Array of benefit-cost analyses
 */
export async function getBenefitCostAnalyses(
  projectId: string,
  organizationId?: string
): Promise<BenefitCostAnalysis[]> {
  const supabase = getClient(organizationId) as SupabaseClient;
  
  const { data, error } = await supabase
    .from('benefit_cost_analyses')
    .select('*')
    .eq('projectId', projectId)
    .order('updatedAt', { ascending: false });
  
  if (error) {
    console.error('Error fetching benefit-cost analyses:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get a specific benefit-cost analysis by ID
 * @param analysisId Analysis ID
 * @param organizationId Organization ID
 * @returns Benefit-cost analysis or null if not found
 */
export async function getBenefitCostAnalysis(
  analysisId: string,
  organizationId?: string
): Promise<BenefitCostAnalysis | null> {
  const supabase = getClient(organizationId) as SupabaseClient;
  
  const { data, error } = await supabase
    .from('benefit_cost_analyses')
    .select('*')
    .eq('id', analysisId)
    .single();
  
  if (error) {
    console.error('Error fetching benefit-cost analysis:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a benefit-cost analysis
 * @param analysisId Analysis ID
 * @param updates Updates to apply
 * @param organizationId Organization ID
 * @returns Updated benefit-cost analysis
 */
export async function updateBenefitCostAnalysis(
  analysisId: string,
  updates: Partial<BenefitCostAnalysis>,
  organizationId?: string
): Promise<BenefitCostAnalysis | null> {
  const supabase = getClient(organizationId) as SupabaseClient;
  
  // Remove read-only fields
  const { id, createdAt, updatedAt, ...validUpdates } = updates as any;
  
  const { data, error } = await supabase
    .from('benefit_cost_analyses')
    .update({ ...validUpdates, updatedAt: new Date().toISOString() })
    .eq('id', analysisId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating benefit-cost analysis:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete a benefit-cost analysis
 * @param analysisId Analysis ID
 * @param organizationId Organization ID
 * @returns True if successful
 */
export async function deleteBenefitCostAnalysis(
  analysisId: string,
  organizationId?: string
): Promise<boolean> {
  const supabase = getClient(organizationId) as SupabaseClient;
  
  const { error } = await supabase
    .from('benefit_cost_analyses')
    .delete()
    .eq('id', analysisId);
  
  if (error) {
    console.error('Error deleting benefit-cost analysis:', error);
    return false;
  }
  
  return true;
}

/**
 * Calculate a complete benefit-cost analysis
 * @param analysis Analysis to calculate
 * @returns Calculated analysis
 */
export function calculateBenefitCostAnalysis(
  analysis: BenefitCostAnalysis
): BenefitCostAnalysis {
  let totalBenefitsPV = 0;
  let totalCostsPV = 0;

  // Process benefits
  for (const benefit of analysis.benefits) {
    const calculatedBenefit = calculateBenefitCategory(
      benefit.category,
      benefit.parameters, // These are the 'inputs' for the calculation logic inside
      analysis.parameters,    // These are the global MonetizationParameters
      analysis.analysisHorizon,
      analysis.baseYear,
      analysis.discountRate
    );
    // Update benefit
    benefit.annualValues = calculatedBenefit.annualValues;
    benefit.presentValue = calculatedBenefit.presentValue;
    totalBenefitsPV += benefit.presentValue;
  }

  // Process costs
  for (const cost of analysis.costs) {
    const calculatedCost = calculateCostCategory( // Changed to calculateCostCategory
      cost.category,
      cost.parameters, // These are the 'inputs' for the calculation logic inside
      analysis.parameters,   // Global MonetizationParameters (though less used for costs)
      analysis.analysisHorizon,
      analysis.baseYear,
      analysis.discountRate
    );
    // Update cost
    cost.annualValues = calculatedCost.annualValues;
    cost.presentValue = calculatedCost.presentValue;
    totalCostsPV += cost.presentValue;
  }

  analysis.netPresentValue = totalBenefitsPV - totalCostsPV;
  analysis.benefitCostRatio = calculateBCR(totalBenefitsPV, totalCostsPV);
  
  // TODO: Calculate IRR and Payback Period if needed and update analysis object

  return analysis;
}

/**
 * Generate an AI-powered analysis of benefit-cost results
 * @param analysis The benefit-cost analysis
 * @param organizationId Organization ID
 * @returns Analysis results with AI insights
 */
export async function generateBenefitCostInsights(
  analysis: BenefitCostAnalysis,
  organizationId?: string
): Promise<BenefitCostAnalysisResult> {
  try {
    // Prepare context for AI
    const context = {
      analysis: {
        name: analysis.name,
        bcr: analysis.benefitCostRatio,
        npv: analysis.netPresentValue,
        irr: analysis.internalRateOfReturn,
        paybackPeriod: analysis.paybackPeriod,
        benefitCategories: analysis.benefits.map(b => ({
          category: b.category,
          presentValue: b.presentValue,
          percentage: analysis.netPresentValue > 0 
            ? (b.presentValue / analysis.netPresentValue) * 100 
            : 0
        })),
        costCategories: analysis.costs.map(c => ({
          category: c.category,
          presentValue: c.presentValue
        })),
        sensitivity: analysis.sensitivityAnalysis?.results
      }
    };
    
    // Call AI agent for analysis
    const agentOptions: RunAgentQueryOptions = {
        type: AgentType.ANALYSIS,
        query: `Analyze this benefit-cost analysis and provide insights:
        1. Summarize the overall results in 2-3 sentences
        2. List 3-5 key insights about the benefit distribution and value drivers
        3. Provide 2-3 recommendations for strengthening the analysis or improving outcomes`,
        context: context
    };

    const response: AgentQueryResponse = await runAgentQuery(agentOptions);
    
    // Parse the response
    // Assuming response.result is the string content we need to split
    const insights = typeof response.result === 'string' ? response.result.split('\n\n') : ['Could not parse AI response'];
    
    // Structure the result
    return {
      ...analysis,
      summary: insights[0] || 'Analysis complete',
      insights: insights[1]?.split('\n').filter(i => i.trim()) || [],
      recommendations: insights[2]?.split('\n').filter(r => r.trim()) || [],
      aiGenerated: true
    };
  } catch (error) {
    console.error('Error generating benefit-cost insights:', error);
    
    // Return basic results without AI insights
    return {
      ...analysis,
      summary: `Analysis complete with BCR of ${analysis.benefitCostRatio.toFixed(2)}`,
      insights: [`Net Present Value: $${analysis.netPresentValue.toFixed(2)}`],
      recommendations: [],
      aiGenerated: false
    };
  }
}

/**
 * Compare two benefit-cost analyses
 * @param baselineId Baseline analysis ID
 * @param compareId Analysis to compare ID
 * @param organizationId Organization ID
 * @returns Comparison result
 */
export async function compareBenefitCostAnalyses(
  baselineId: string,
  compareId: string,
  organizationId?: string
): Promise<BenefitCostAnalysisResult | null> {
  // Get the analyses
  const baseline = await getBenefitCostAnalysis(baselineId, organizationId);
  const compare = await getBenefitCostAnalysis(compareId, organizationId);
  
  if (!baseline || !compare) {
    console.error('Cannot compare: One or both analyses not found');
    return null;
  }
  
  // Calculate incremental benefits
  const incrementalNPV = compare.netPresentValue - baseline.netPresentValue;
  
  // If baseline cost is very small, avoid division problems
  const epsilon = 0.0001;
  const baselineCost = Math.max(
    baseline.costs.reduce((sum, c) => sum + c.presentValue, 0),
    epsilon
  );
  const compareCost = Math.max(
    compare.costs.reduce((sum, c) => sum + c.presentValue, 0),
    epsilon
  );
  
  // Incremental BCR is trickier - need to use incremental benefits / incremental costs
  const incrementalBenefits = compare.benefits.reduce((sum, b) => sum + b.presentValue, 0) -
                             baseline.benefits.reduce((sum, b) => sum + b.presentValue, 0);
  const incrementalCosts = compareCost - baselineCost;
  
  const incrementalBCR = incrementalCosts > 0 ? incrementalBenefits / incrementalCosts : 0;
  
  // Get AI insights on the comparison
  try {
    const result: BenefitCostAnalysisResult = {
      ...compare,
      comparisonId: baselineId,
      baseline: {
        netPresentValue: baseline.netPresentValue,
        benefitCostRatio: baseline.benefitCostRatio,
        internalRateOfReturn: baseline.internalRateOfReturn,
        paybackPeriod: baseline.paybackPeriod
      },
      incremental: {
        netPresentValue: incrementalNPV,
        benefitCostRatio: incrementalBCR,
        // Other incremental metrics could be calculated as needed
      },
      summary: '',
      insights: [],
      recommendations: [],
      aiGenerated: false
    };
    
    // Generate AI insights
    return await generateBenefitCostInsights(result, organizationId);
  } catch (error) {
    console.error('Error in comparison:', error);
    return null;
  }
}

// Rename the duplicate performSensitivityAnalysis to avoid conflicts
export function performMockSensitivityAnalysis(
  analysis: BenefitCostAnalysis,
  parameters: string[]
): SensitivityAnalysis['results'] {
  // For demonstration purposes, we'll create some mock sensitivity analysis results
  return parameters.map(parameter => {
    // Mock base value and results - in a real scenario, these would be calculated
    const baseNetPresentValue = analysis.netPresentValue;
    // const baseBenefitCostRatio = analysis.benefitCostRatio; // If we need sensitivity on BCR too

    const decreaseResult = baseNetPresentValue * 0.85;
    const increaseResult = baseNetPresentValue * 1.15;

    return {
      parameterName: parameter,
      lowValueResult: decreaseResult,
      baseValueResult: baseNetPresentValue, // Mocked base for this parameter's sensitivity
      highValueResult: increaseResult,
      impact: ((increaseResult - decreaseResult) / baseNetPresentValue) * 100 // Mocked impact
    };
  });
}

// Add Monte Carlo simulation function
export const runMonteCarloSimulation = async (
  analysis: BenefitCostAnalysis,
  parameters: any[],
  iterations: number = 1000
): Promise<any> => {
  // This would be handled by the server in a real implementation
  // Here, we simulate the Monte Carlo analysis with some randomized data
  
  // Clone the analysis to avoid modifying the original
  const baseAnalysis = JSON.parse(JSON.stringify(analysis));
  
  // Create distribution buckets for the results
  const bcrDistribution: Record<string, number> = {};
  const npvDistribution: Record<string, number> = {};
  const bcrResults: number[] = [];
  const npvResults: number[] = [];
  
  // Run the simulations
  for (let i = 0; i < iterations; i++) {
    // Create a modified version of the analysis with randomized parameters
    const simulatedAnalysis = JSON.parse(JSON.stringify(baseAnalysis));
    
    // Apply random variations to the parameters
    parameters.forEach(param => {
      // Extract the parameter path and navigate to it
      const path = param.parameterName.split('.');
      let current = simulatedAnalysis;
      
      // Navigate to the nested property, except the last one
      for (let j = 0; j < path.length - 1; j++) {
        const key = path[j];
        // Handle array indices
        if (key.includes('[') && key.includes(']')) {
          const arrayName = key.substring(0, key.indexOf('['));
          const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
          current = current[arrayName][index];
        } else {
          current = current[key];
        }
      }
      
      // Last property name
      const lastKey = path[path.length - 1];
      
      // Apply randomization based on distribution type
      let randomValue;
      switch (param.distribution) {
        case 'normal':
          // Normal distribution using Box-Muller transform
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          randomValue = param.mean + z0 * param.standardDeviation;
          break;
          
        case 'triangular':
          // Triangular distribution
          const r = Math.random();
          const c = (param.most - param.min) / (param.max - param.min);
          if (r < c) {
            randomValue = param.min + Math.sqrt(r * (param.max - param.min) * (param.most - param.min));
          } else {
            randomValue = param.max - Math.sqrt((1 - r) * (param.max - param.min) * (param.max - param.most));
          }
          break;
          
        case 'uniform':
          // Uniform distribution
          randomValue = param.min + Math.random() * (param.max - param.min);
          break;
          
        default:
          randomValue = param.mean || 0;
      }
      
      // Apply the random value to the parameter
      current[lastKey] = randomValue;
    });
    
    // Calculate results for this simulation
    const result = calculateBenefitCostAnalysis(simulatedAnalysis);
    
    // Record the results
    bcrResults.push(result.benefitCostRatio);
    npvResults.push(result.netPresentValue);
    
    // Add to distributions (round to 2 decimal places for BCR, nearest 1000 for NPV)
    const bcrKey = Math.round(result.benefitCostRatio * 100) / 100;
    const npvKey = Math.round(result.netPresentValue / 1000) * 1000;
    
    bcrDistribution[bcrKey] = (bcrDistribution[bcrKey] || 0) + 1;
    npvDistribution[npvKey] = (npvDistribution[npvKey] || 0) + 1;
  }
  
  // Sort the results
  bcrResults.sort((a, b) => a - b);
  npvResults.sort((a, b) => a - b);
  
  // Calculate statistics
  const calculateStatistics = (results: number[]) => {
    const n = results.length;
    const mean = results.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate standard deviation
    const squaredDifferences = results.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate percentiles
    const percentiles: Record<number, number> = {};
    [5, 10, 25, 50, 75, 90, 95].forEach(p => {
      const index = Math.floor(n * p / 100);
      percentiles[p] = results[index];
    });
    
    return {
      mean,
      median: percentiles[50],
      standardDeviation,
      percentiles
    };
  };
  
  // Calculate probability of BCR > 1 and NPV > 0
  const probabilityBcrGreaterThan1 = bcrResults.filter(val => val >= 1).length / iterations;
  const probabilityNpvGreaterThan0 = npvResults.filter(val => val >= 0).length / iterations;
  
  // Determine most influential parameters (simplified approach)
  const mostInfluentialParameters = parameters
    .slice(0, 2) // Just take the first two as a simplification
    .map(p => p.parameterName);
  
  // Return the simulation results
  return {
    iterations,
    parameters,
    mostInfluentialParameters,
    results: [
      {
        metric: 'benefitCostRatio',
        ...calculateStatistics(bcrResults),
        distribution: bcrDistribution,
        probabilityGreaterThan1: probabilityBcrGreaterThan1
      },
      {
        metric: 'netPresentValue',
        ...calculateStatistics(npvResults),
        distribution: npvDistribution,
        probabilityGreaterThan0: probabilityNpvGreaterThan0
      }
    ]
  };
}; 