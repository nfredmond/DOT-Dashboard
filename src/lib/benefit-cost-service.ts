/**
 * Benefit Cost Analysis Service
 * 
 * Provides functions for creating, retrieving, updating, and calculating
 * benefit-cost analyses for transportation projects and scenarios.
 */

import { v4 as uuidv4 } from 'uuid';
import { getClient } from './supabase-service';
import { 
  BenefitCostAnalysis, 
  BenefitCostAnalysisMethod, 
  BenefitCostAnalysisResult,
  BenefitCostParameter, 
  BenefitCostTemplate, 
  BenefitCategory,
  BenefitCostTimeSeries, 
  BenefitValueCalculation,
  CostCategory, 
  CostValueCalculation,
  DistributionalAnalysis,
  MonetizationParameters,
  MonteCarloSimulation,
  SensitivityAnalysis,
  SensitivityAnalysisItem
} from '../types/benefit-cost';
import { runAgentQuery, AgentType } from './agents-service';

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
      BenefitCategory.ACCIDENT_COSTS,
      BenefitCategory.VEHICLE_OPERATING_COSTS,
      BenefitCategory.EMISSIONS,
      BenefitCategory.HEALTH_BENEFITS,
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
      BenefitCategory.ACCIDENT_COSTS,
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
  const supabase = getClient(organizationId);
  
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
  const supabase = getClient(organizationId);
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
 * @returns Benefit calculation result
 */
export function calculateBenefitCategory(
  category: BenefitCategory,
  inputs: any,
  parameters: MonetizationParameters,
  analysisHorizon: number,
  baseYear: number
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
            // Use legacy parameter
            const valueOfTime = parameters.valueOfTime_legacy || parameters.valueOfTime as number || 18.8;
            commuterValue = commuterHours * valueOfTime;
            commercialValue = commercialHours * valueOfTime * 1.5; // Assumption for commercial
            freightValue = freightHours * valueOfTime * 1.7; // Assumption for freight
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
            // Use legacy parameters
            fatalValue = fatalReduction * (parameters.fatalityCost as number || 11000000);
            injuryValue = injuryReduction * (parameters.injuryCost as number || 125000);
            pdoValue = pdoReduction * 4500; // Default if not provided
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
    const discountFactor = 1 / Math.pow(1 + parameters.discount.rate, yearsFromBase);
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
        parameterName,
        baseValue,
        lowValue: baseValue * lowAdjustment,
        highValue: baseValue * highAdjustment,
      };
    }),
    results,
  };
}

/**
 * Create a new benefit-cost analysis
 * @param projectId Project ID
 * @param templateId Template ID (optional)
 * @param userId User ID
 * @param organizationId Organization ID
 * @returns Created benefit-cost analysis
 */
export async function createBenefitCostAnalysis(
  projectId: string,
  templateId?: string,
  userId?: string,
  organizationId?: string
): Promise<BenefitCostAnalysis> {
  const supabase = getClient(organizationId);
  
  // Get template if provided
  let template: BenefitCostTemplate | undefined;
  
  if (templateId) {
    const templates = await getBenefitCostTemplates(organizationId);
    template = templates.find(t => t.id === templateId);
  }
  
  // Create default analysis
  const defaultAnalysis: Omit<BenefitCostAnalysis, 'id' | 'createdAt' | 'updatedAt'> = {
    projectId,
    name: `Benefit-Cost Analysis (${new Date().toLocaleDateString()})`,
    description: 'New benefit-cost analysis',
    createdBy: userId || 'system',
    
    discountRate: template?.defaultDiscountRate || 0.07,
    baseYear: new Date().getFullYear(),
    analysisHorizon: template?.defaultAnalysisHorizon || 20,
    
    netPresentValue: 0,
    benefitCostRatio: 0,
    
    benefits: [],
    costs: [],
    annualBenefits: [],
    annualCosts: [],
    
    parameters: template?.parameters || DEFAULT_MONETIZATION_PARAMETERS,
    
    isPublic: false,
    status: 'draft',
    methodology: template?.name || 'Standard benefit-cost analysis',
    assumptions: [],
    limitations: [],
    tags: [],
  };
  
  // Insert into database
  const newAnalysis = {
    ...defaultAnalysis,
    id: uuidv4(),
  };
  
  const { data, error } = await supabase
    .from('benefit_cost_analyses')
    .insert(newAnalysis)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating benefit-cost analysis:', error);
    throw new Error(`Failed to create analysis: ${error.message}`);
  }
  
  return data;
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
  const supabase = getClient(organizationId);
  
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
  const supabase = getClient(organizationId);
  
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
  const supabase = getClient(organizationId);
  
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
  const supabase = getClient(organizationId);
  
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
  // Calculate present values
  let totalBenefitsPV = 0;
  let totalCostsPV = 0;
  
  // Process benefits
  for (const benefit of analysis.benefits) {
    const discountedValues = benefit.annualValues.map(annual => {
      const yearsFromBase = annual.year - analysis.baseYear;
      const discountFactor = 1 / Math.pow(1 + analysis.discountRate, yearsFromBase);
      return {
        ...annual,
        presentValue: annual.value * discountFactor
      };
    });
    
    // Update benefit
    benefit.annualValues = discountedValues;
    benefit.presentValue = discountedValues.reduce((sum, item) => sum + (item.presentValue || 0), 0);
    totalBenefitsPV += benefit.presentValue;
  }
  
  // Process costs
  for (const cost of analysis.costs) {
    const discountedValues = cost.annualValues.map(annual => {
      const yearsFromBase = annual.year - analysis.baseYear;
      const discountFactor = 1 / Math.pow(1 + analysis.discountRate, yearsFromBase);
      return {
        ...annual,
        presentValue: annual.value * discountFactor
      };
    });
    
    // Update cost
    cost.annualValues = discountedValues;
    cost.presentValue = discountedValues.reduce((sum, item) => sum + (item.presentValue || 0), 0);
    totalCostsPV += cost.presentValue;
  }
  
  // Compile annual streams
  const allBenefitStreams = analysis.benefits.flatMap(b => b.annualValues);
  const allCostStreams = analysis.costs.flatMap(c => c.annualValues);
  
  // Calculate results
  const npv = totalBenefitsPV - totalCostsPV;
  const bcr = totalCostsPV > 0 ? totalBenefitsPV / totalCostsPV : 0;
  
  // Calculate IRR (all cash flows together)
  const irr = calculateIRR([
    ...allBenefitStreams.map(b => ({ ...b, value: b.value })),
    ...allCostStreams.map(c => ({ ...c, value: -c.value })) // Costs are negative for IRR
  ]);
  
  // Calculate payback period
  const paybackPeriod = calculatePaybackPeriod(allBenefitStreams, allCostStreams);
  
  // Return updated analysis
  return {
    ...analysis,
    netPresentValue: npv,
    benefitCostRatio: bcr,
    internalRateOfReturn: irr,
    paybackPeriod: paybackPeriod,
    annualBenefits: allBenefitStreams,
    annualCosts: allCostStreams
  };
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
    const response = await runAgentQuery({
      prompt: `Analyze this benefit-cost analysis and provide insights:
      1. Summarize the overall results in 2-3 sentences
      2. List 3-5 key insights about the benefit distribution and value drivers
      3. Provide 2-3 recommendations for strengthening the analysis or improving outcomes`,
      agentType: AgentType.ANALYSIS,
      context: context
    });
    
    // Parse the response
    const insights = response.content.split('\n\n');
    
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

// Export the mock templates and data functions only - these replace the earlier versions
export async function getBenefitCostTemplates(): Promise<BenefitCostTemplate[]> {
  // In a real application, this would call an API endpoint to retrieve templates from the database
  // For now, we'll return some mock templates
  return [
    {
      id: 'template-1',
      name: 'USDOT BCA Guidance',
      description: 'Template based on USDOT Benefit-Cost Analysis Guidance (2023)',
      defaultDiscountRate: 0.07,
      defaultAnalysisHorizon: 20,
      suggestedBenefits: [
        { category: BenefitCategory.TRAVEL_TIME_SAVINGS, description: 'Reduced travel time due to project' },
        { category: BenefitCategory.RELIABILITY, description: 'Improved travel time reliability' },
        { category: BenefitCategory.SAFETY, description: 'Reduced accidents and improved safety' },
        { category: BenefitCategory.EMISSIONS, description: 'Reduction in greenhouse gas and other emissions' }
      ],
      suggestedCosts: [
        { category: CostCategory.CAPITAL, description: 'Initial construction and implementation' },
        { category: CostCategory.MAINTENANCE, description: 'Ongoing maintenance' },
        { category: CostCategory.OPERATIONS, description: 'Operational costs' }
      ]
    },
    {
      id: 'template-2',
      name: 'RAISE Grant Template',
      description: 'Template for RAISE discretionary grant applications',
      defaultDiscountRate: 0.07,
      defaultAnalysisHorizon: 20,
      suggestedBenefits: [
        { category: BenefitCategory.TRAVEL_TIME_SAVINGS, description: 'Reduced travel time due to project' },
        { category: BenefitCategory.SAFETY, description: 'Reduced accidents and improved safety' },
        { category: BenefitCategory.EMISSIONS, description: 'Reduction in greenhouse gas and other emissions' },
        { category: BenefitCategory.HEALTH, description: 'Health benefits from active transportation' }
      ],
      suggestedCosts: [
        { category: CostCategory.CAPITAL, description: 'Initial construction and implementation' },
        { category: CostCategory.MAINTENANCE, description: 'Ongoing maintenance' },
        { category: CostCategory.OPERATIONS, description: 'Operational costs' }
      ]
    }
  ];
}

// Fetch all benefit-cost analyses for a project
export async function getBenefitCostAnalyses(projectId: string): Promise<BenefitCostAnalysis[]> {
  // In a real application, this would call an API endpoint to retrieve analyses from the database
  // For now, we'll return some mock data
  return [
    {
      id: 'analysis-1',
      projectId,
      name: 'Main Street Improvement BCA',
      description: 'Benefit-cost analysis for the Main Street Improvement Project',
      createdAt: '2023-07-15T10:30:00Z',
      updatedAt: '2023-08-01T14:45:00Z',
      createdBy: 'user-1',
      discountRate: 0.07,
      baseYear: 2023,
      analysisHorizon: 20,
      status: 'final',
      isPublic: true,
      methodology: 'USDOT BCA Guidance',
      assumptions: ['Traffic growth rate of 1.5% per year', 'Construction period of 2 years'],
      limitations: ['Excludes potential property value increases', 'Does not account for induced demand'],
      tags: ['road', 'safety', 'urban'],
      benefits: [
        {
          id: 'benefit-1',
          category: BenefitCategory.TRAVEL_TIME_SAVINGS,
          description: 'Reduced travel time due to improved traffic flow',
          annualValue: 500000,
          growthRate: 0.015,
          presentValue: 5300000
        },
        {
          id: 'benefit-2',
          category: BenefitCategory.SAFETY,
          description: 'Reduced accidents due to improved intersection design',
          annualValue: 350000,
          growthRate: 0,
          presentValue: 3600000
        }
      ],
      costs: [
        {
          id: 'cost-1',
          category: CostCategory.CAPITAL,
          description: 'Construction costs',
          annualValue: 5000000,
          growthRate: 0,
          presentValue: 5000000
        },
        {
          id: 'cost-2',
          category: CostCategory.MAINTENANCE,
          description: 'Annual maintenance',
          annualValue: 100000,
          growthRate: 0.02,
          presentValue: 1100000
        }
      ],
      annualBenefits: [
        { year: 2023, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 0, presentValue: 0 },
        { year: 2024, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 0, presentValue: 0 },
        { year: 2025, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 500000, presentValue: 436680 },
        { year: 2026, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 507500, presentValue: 414290 },
        // ... more annual benefits
        { year: 2023, category: BenefitCategory.SAFETY, value: 0, presentValue: 0 },
        { year: 2024, category: BenefitCategory.SAFETY, value: 0, presentValue: 0 },
        { year: 2025, category: BenefitCategory.SAFETY, value: 350000, presentValue: 305676 },
        { year: 2026, category: BenefitCategory.SAFETY, value: 350000, presentValue: 285679 }
        // ... more annual benefits
      ],
      annualCosts: [
        { year: 2023, category: CostCategory.CAPITAL, value: 2500000, presentValue: 2500000 },
        { year: 2024, category: CostCategory.CAPITAL, value: 2500000, presentValue: 2336449 },
        { year: 2025, category: CostCategory.CAPITAL, value: 0, presentValue: 0 },
        // ... more annual costs
        { year: 2023, category: CostCategory.MAINTENANCE, value: 0, presentValue: 0 },
        { year: 2024, category: CostCategory.MAINTENANCE, value: 0, presentValue: 0 },
        { year: 2025, category: CostCategory.MAINTENANCE, value: 100000, presentValue: 87336 },
        { year: 2026, category: CostCategory.MAINTENANCE, value: 102000, presentValue: 83265 }
        // ... more annual costs
      ],
      parameters: {
        valueOfTime: 15.00,
        fatalityCost: 10000000,
        injuryCost: 500000,
        emissionsCostPerTon: 45
      },
      benefitCostRatio: 1.45,
      netPresentValue: 2800000,
      paybackPeriod: 12.3,
      internalRateOfReturn: 0.095
    },
    {
      id: 'analysis-2',
      projectId,
      name: 'Alternative Design BCA',
      description: 'Benefit-cost analysis for the alternative design option',
      createdAt: '2023-07-20T09:15:00Z',
      updatedAt: '2023-07-25T16:30:00Z',
      createdBy: 'user-1',
      discountRate: 0.07,
      baseYear: 2023,
      analysisHorizon: 20,
      status: 'draft',
      isPublic: false,
      methodology: 'USDOT BCA Guidance',
      assumptions: ['Traffic growth rate of 1.5% per year', 'Construction period of 1 year'],
      limitations: ['Excludes potential property value increases'],
      tags: ['road', 'safety', 'urban', 'alternative'],
      benefits: [
        {
          id: 'benefit-3',
          category: BenefitCategory.TRAVEL_TIME_SAVINGS,
          description: 'Reduced travel time due to improved traffic flow',
          annualValue: 400000,
          growthRate: 0.015,
          presentValue: 4200000
        },
        {
          id: 'benefit-4',
          category: BenefitCategory.SAFETY,
          description: 'Reduced accidents due to improved intersection design',
          annualValue: 300000,
          growthRate: 0,
          presentValue: 3100000
        }
      ],
      costs: [
        {
          id: 'cost-3',
          category: CostCategory.CAPITAL,
          description: 'Construction costs',
          annualValue: 4000000,
          growthRate: 0,
          presentValue: 4000000
        },
        {
          id: 'cost-4',
          category: CostCategory.MAINTENANCE,
          description: 'Annual maintenance',
          annualValue: 150000,
          growthRate: 0.02,
          presentValue: 1650000
        }
      ],
      annualBenefits: [
        { year: 2023, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 0, presentValue: 0 },
        { year: 2024, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 400000, presentValue: 373832 },
        { year: 2025, category: BenefitCategory.TRAVEL_TIME_SAVINGS, value: 406000, presentValue: 354552 },
        // ... more annual benefits
        { year: 2023, category: BenefitCategory.SAFETY, value: 0, presentValue: 0 },
        { year: 2024, category: BenefitCategory.SAFETY, value: 300000, presentValue: 280374 },
        { year: 2025, category: BenefitCategory.SAFETY, value: 300000, presentValue: 262032 }
        // ... more annual benefits
      ],
      annualCosts: [
        { year: 2023, category: CostCategory.CAPITAL, value: 4000000, presentValue: 4000000 },
        { year: 2024, category: CostCategory.CAPITAL, value: 0, presentValue: 0 },
        // ... more annual costs
        { year: 2023, category: CostCategory.MAINTENANCE, value: 0, presentValue: 0 },
        { year: 2024, category: CostCategory.MAINTENANCE, value: 150000, presentValue: 140187 },
        { year: 2025, category: CostCategory.MAINTENANCE, value: 153000, presentValue: 133636 }
        // ... more annual costs
      ],
      parameters: {
        valueOfTime: 15.00,
        fatalityCost: 10000000,
        injuryCost: 500000,
        emissionsCostPerTon: 45,
        dailyTraffic: 40000,
        accidentRate: 0.001
      },
      benefitCostRatio: 1.03,
      netPresentValue: 600000,
      paybackPeriod: 18.5,
      internalRateOfReturn: 0.073
    }
  ];
}

// Fetch a specific benefit-cost analysis by ID
export async function getBenefitCostAnalysis(analysisId: string): Promise<BenefitCostAnalysisResult | null> {
  // In a real application, this would call an API endpoint to retrieve the analysis from the database
  // For now, we'll simulate finding the analysis in our mock data
  
  const allAnalyses = await getBenefitCostAnalyses('mock-project-id');
  const analysis = allAnalyses.find(a => a.id === analysisId);
  
  if (!analysis) {
    return null;
  }
  
  // Convert to BenefitCostAnalysisResult by adding the summary and insights
  return generateBenefitCostInsights(analysis);
}

// Create a new benefit-cost analysis
export async function createBenefitCostAnalysis(analysis: BenefitCostAnalysis): Promise<BenefitCostAnalysis> {
  // In a real application, this would call an API endpoint to create the analysis in the database
  // For now, we'll just return the analysis with an assigned ID
  
  const newAnalysis = {
    ...analysis,
    id: analysis.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return newAnalysis;
}

// Delete a benefit-cost analysis
export async function deleteBenefitCostAnalysis(analysisId: string): Promise<boolean> {
  // In a real application, this would call an API endpoint to delete the analysis from the database
  // For now, we'll just return true to indicate success
  
  return true;
}

// Calculate benefit-cost analysis results
export function calculateBenefitCostAnalysis(analysis: BenefitCostAnalysis): BenefitCostAnalysis {
  // Calculate the present value of benefits and costs
  // In a real application, this would involve more complex calculations
  
  // For now, we'll just return the analysis as is, assuming the present values are already calculated
  return {
    ...analysis,
    updatedAt: new Date().toISOString(),
  };
}

// Perform sensitivity analysis on key parameters
export function performSensitivityAnalysis(
  analysis: BenefitCostAnalysis, 
  parameters: string[]
): SensitivityAnalysisItem[] {
  // For demonstration purposes, we'll create some mock sensitivity analysis results
  return parameters.map(parameter => {
    const baseValue = parameter === 'discountRate' ? analysis.discountRate : 0;
    
    return {
      parameter,
      variationPercent: 20,
      results: {
        decrease: {
          benefitCostRatio: analysis.benefitCostRatio * 0.9,
          netPresentValue: analysis.netPresentValue * 0.85
        },
        increase: {
          benefitCostRatio: analysis.benefitCostRatio * 1.1,
          netPresentValue: analysis.netPresentValue * 1.15
        }
      }
    };
  });
}

// Generate insights from benefit-cost analysis results
export async function generateBenefitCostInsights(
  analysis: BenefitCostAnalysis
): Promise<BenefitCostAnalysisResult> {
  // In a real application, this might use AI to generate insights
  // For now, we'll create some mock insights based on the analysis values
  
  const bcRatio = analysis.benefitCostRatio;
  const npv = analysis.netPresentValue;
  
  let summary = '';
  const insights = [];
  const recommendations = [];
  
  // Generate summary
  if (bcRatio >= 1.5) {
    summary = `The project demonstrates strong economic value with a benefit-cost ratio of ${bcRatio.toFixed(2)}, indicating that benefits substantially exceed costs. The net present value of $${(npv / 1000000).toFixed(1)} million represents significant positive economic impact.`;
    insights.push('Benefits significantly exceed costs, indicating high economic value.');
    insights.push(`Every dollar invested returns approximately $${bcRatio.toFixed(2)} in benefits.`);
    recommendations.push('Proceed with the project as the economic case is strong.');
    
    if (bcRatio >= 2.0) {
      insights.push('The project is in the top tier of economic performance.');
      recommendations.push('Consider expanding the project scope to capture additional benefits.');
    }
  } else if (bcRatio >= 1.0) {
    summary = `The project demonstrates positive economic value with a benefit-cost ratio of ${bcRatio.toFixed(2)}, indicating that benefits exceed costs. The net present value of $${(npv / 1000000).toFixed(1)} million represents positive economic impact.`;
    insights.push('Benefits exceed costs, indicating positive economic value.');
    insights.push(`Every dollar invested returns approximately $${bcRatio.toFixed(2)} in benefits.`);
    
    if (bcRatio < 1.2) {
      insights.push('The economic case is positive but relatively marginal.');
      recommendations.push('Look for cost savings or benefit enhancements to improve the economic case.');
      recommendations.push('Consider phasing the project to prioritize elements with higher benefit-cost ratios.');
    } else {
      recommendations.push('Proceed with the project as the economic case is positive.');
    }
  } else {
    summary = `The project has a benefit-cost ratio of ${bcRatio.toFixed(2)}, indicating that costs exceed benefits. The net present value of $${(npv / 1000000).toFixed(1)} million represents negative economic impact.`;
    insights.push('Costs exceed benefits, indicating negative economic value.');
    insights.push(`Every dollar invested returns approximately $${bcRatio.toFixed(2)} in benefits.`);
    recommendations.push('Reconsider the project or look for significant cost savings.');
    recommendations.push('Explore alternative designs that may offer better economic performance.');
  }
  
  // Add insights about payback period if available
  if (analysis.paybackPeriod) {
    if (analysis.paybackPeriod < analysis.analysisHorizon) {
      insights.push(`The project is expected to pay back its costs in ${analysis.paybackPeriod.toFixed(1)} years.`);
      
      if (analysis.paybackPeriod < 10) {
        insights.push('The relatively short payback period indicates good economic efficiency.');
      } else {
        insights.push('The payback period is relatively long but within the analysis horizon.');
      }
    } else {
      insights.push(`The project does not fully pay back within the ${analysis.analysisHorizon}-year analysis horizon.`);
      recommendations.push('Consider extending the analysis horizon to capture more long-term benefits.');
    }
  }
  
  // Add insights about key benefit categories
  if (analysis.benefits.length > 0) {
    // Sort benefits by present value (descending)
    const sortedBenefits = [...analysis.benefits].sort((a, b) => b.presentValue - a.presentValue);
    const topBenefit = sortedBenefits[0];
    
    insights.push(`The largest benefit category is ${topBenefit.category}, representing approximately ${((topBenefit.presentValue / analysis.benefits.reduce((sum, b) => sum + b.presentValue, 0)) * 100).toFixed(0)}% of total benefits.`);
    
    if (sortedBenefits.length > 1) {
      const secondBenefit = sortedBenefits[1];
      insights.push(`The second largest benefit category is ${secondBenefit.category}, representing approximately ${((secondBenefit.presentValue / analysis.benefits.reduce((sum, b) => sum + b.presentValue, 0)) * 100).toFixed(0)}% of total benefits.`);
    }
  }
  
  return {
    ...analysis,
    summary,
    insights,
    recommendations,
    aiGenerated: true
  };
}

// Helper function to generate a UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
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