import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { 
  getBenefitCostAnalysis,
  updateBenefitCostAnalysis,
  calculateBenefitCostAnalysis
} from '@/lib/benefit-cost-service';
import { getScenarioResults } from '@/lib/trend-navigator-service';
import { getCAMPModelRunResults } from '@/lib/camp-service';
import logger from '@/lib/logger';
import { 
  BenefitCostAnalysis, 
  BenefitCostTimeSeries,
  MonetizationParameters
} from '@/types/benefit-cost';
import { CAMPModelResults } from '@/types/camp';
import { ScenarioResults } from '@/types/trend-navigator';

interface YearlyData {
  year: number;
  [key: string]: any;
}

interface TravelTimeData extends YearlyData {
  commuterHoursSaved?: number;
  commercialHoursSaved?: number;
  freightHoursSaved?: number;
}

interface EmissionsData extends YearlyData {
  co2Reduction?: number;
  noxReduction?: number;
  pmReduction?: number;
}

interface SafetyData extends YearlyData {
  fatalReduction?: number;
  injuryReduction?: number;
  pdoReduction?: number;
}

interface VehicleOperatingData extends YearlyData {
  fuelSavings?: number;
  maintenanceSavings?: number;
  depreciationSavings?: number;
}

interface HealthData extends YearlyData {
  walkingMiles?: number;
  bikingMiles?: number;
}

interface IntegrationOptions {
  includeTravelTime?: boolean;
  includeEmissions?: boolean;
  includeSafety?: boolean;
  includeVehicleOperating?: boolean;
  includeHealth?: boolean;
}

// Define interfaces for the model data with optional properties
interface ModelData {
  travelTimes?: TravelTimeData[];
  emissions?: EmissionsData[];
  safety?: SafetyData[];
  vehicleOperating?: VehicleOperatingData[];
  activeTransportation?: HealthData[];
}

// Define interfaces for the extended models
interface ExtendedCAMPModelResults extends Omit<CAMPModelResults, 'emissions'>, ModelData {
  [key: string]: any;
}

interface ExtendedScenarioResults extends Omit<ScenarioResults, 'emissions'>, ModelData {
  congestion?: {
    travelTimes?: TravelTimeData[];
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * This route handles the integration between Benefit-Cost Analysis and CAMP/TrendNavigator
 * It allows fetching data from CAMP models and scenarios to create or update BCA entries
 */

// POST /api/projects/[id]/bca/camp-integration - Import data from CAMP/TrendNavigator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const projectId = params.id;
    const userId = session.user.id;
    
    // Check if user has access to this project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return new NextResponse(JSON.stringify({ error: 'Project not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const organizationId = project.organization_id;
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    
    // Check if user is a global admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, metadata')
      .eq('id', userId)
      .single();
    
    const isGlobalAdmin = userData?.role === 'global_admin' || 
      (userData?.metadata && userData.metadata.isGlobalAdmin);
    
    if (!isGlobalAdmin && !membership) {
      return new NextResponse(JSON.stringify({ error: 'You do not have access to this project' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { analysisId, scenarioId, campModelRunId, options } = body;
    
    // Validate required parameters
    if (!analysisId) {
      return new NextResponse(JSON.stringify({ error: 'Analysis ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!scenarioId && !campModelRunId) {
      return new NextResponse(JSON.stringify({ error: 'Either scenario ID or CAMP model run ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the existing BCA
    const analysis = await getBenefitCostAnalysis(analysisId, organizationId);
    if (!analysis) {
      return new NextResponse(JSON.stringify({ error: 'Analysis not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get data from the source
    let campData: ExtendedCAMPModelResults | null = null;
    let scenarioData: ExtendedScenarioResults | null = null;
    
    if (scenarioId) {
      // Get TrendNavigator scenario results
      const scenarioResult = await getScenarioResults(scenarioId);
      if (!scenarioResult) {
        return new NextResponse(JSON.stringify({ error: 'Scenario not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      scenarioData = scenarioResult as unknown as ExtendedScenarioResults;
    }
    
    if (campModelRunId) {
      // Get CAMP model results
      const campResult = await getCAMPModelRunResults(campModelRunId);
      if (!campResult) {
        return new NextResponse(JSON.stringify({ error: 'CAMP model run not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      campData = campResult as unknown as ExtendedCAMPModelResults;
    }
    
    // Process the data and update the BCA
    const updatedAnalysis = await processModelData(
      analysis, 
      campData, 
      scenarioData, 
      options as IntegrationOptions
    );
    
    // Calculate updated BCA values
    const result = await calculateBenefitCostAnalysis(updatedAnalysis);
    
    // Save the updated analysis
    const updated = await updateBenefitCostAnalysis(analysisId, result, organizationId);
    
    return new NextResponse(JSON.stringify({
      success: true,
      analysis: updated,
      dataSource: scenarioId ? 'scenario' : 'camp',
      sourceId: scenarioId || campModelRunId
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error integrating BCA with CAMP/TrendNavigator:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to integrate benefit-cost analysis with CAMP/TrendNavigator'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Process model data from CAMP and/or TrendNavigator to update BCA
 */
async function processModelData(
  analysis: BenefitCostAnalysis, 
  campData: ExtendedCAMPModelResults | null, 
  scenarioData: ExtendedScenarioResults | null, 
  options: IntegrationOptions
): Promise<BenefitCostAnalysis> {
  const updatedAnalysis = { ...analysis };
  const annualBenefits: BenefitCostTimeSeries[] = [...(analysis.annualBenefits || [])];
  const annualCosts: BenefitCostTimeSeries[] = [...(analysis.annualCosts || [])];
  
  // Process travel time savings
  if (options?.includeTravelTime && ((campData && campData.travelTimes) || (scenarioData && scenarioData.congestion && scenarioData.congestion.travelTimes))) {
    const travelTimeData = campData?.travelTimes || (scenarioData?.congestion?.travelTimes || []);
    if (travelTimeData.length > 0) {
      // Convert travel time savings to benefit entries
      const travelTimeBenefits = convertTravelTimeToBenefits(
        travelTimeData as TravelTimeData[], 
        analysis.baseYear, 
        analysis.analysisHorizon,
        analysis.parameters as MonetizationParameters
      );
      
      // Add or update benefits
      for (const benefit of travelTimeBenefits) {
        // Check if we already have a benefit for this year and category
        const existingIndex = annualBenefits.findIndex(
          b => b.year === benefit.year && b.category === benefit.category
        );
        
        if (existingIndex >= 0) {
          annualBenefits[existingIndex] = benefit;
        } else {
          annualBenefits.push(benefit);
        }
      }
    }
  }
  
  // Process emissions benefits
  if (options?.includeEmissions && ((campData && campData.emissions) || (scenarioData && scenarioData.emissions))) {
    const emissionsData = campData?.emissions || (scenarioData?.emissions || []);
    if (emissionsData.length > 0) {
      // Convert emissions reductions to benefit entries
      const emissionsBenefits = convertEmissionsToBenefits(
        emissionsData as EmissionsData[],
        analysis.baseYear,
        analysis.analysisHorizon,
        analysis.parameters as MonetizationParameters
      );
      
      // Add or update benefits
      for (const benefit of emissionsBenefits) {
        const existingIndex = annualBenefits.findIndex(
          b => b.year === benefit.year && b.category === benefit.category
        );
        
        if (existingIndex >= 0) {
          annualBenefits[existingIndex] = benefit;
        } else {
          annualBenefits.push(benefit);
        }
      }
    }
  }
  
  // Process safety benefits
  if (options?.includeSafety && ((campData && campData.safety) || (scenarioData && scenarioData.safety))) {
    const safetyData = campData?.safety || (scenarioData?.safety || []);
    if (safetyData.length > 0) {
      // Convert safety improvements to benefit entries
      const safetyBenefits = convertSafetyToBenefits(
        safetyData as SafetyData[],
        analysis.baseYear,
        analysis.analysisHorizon,
        analysis.parameters as MonetizationParameters
      );
      
      // Add or update benefits
      for (const benefit of safetyBenefits) {
        const existingIndex = annualBenefits.findIndex(
          b => b.year === benefit.year && b.category === benefit.category
        );
        
        if (existingIndex >= 0) {
          annualBenefits[existingIndex] = benefit;
        } else {
          annualBenefits.push(benefit);
        }
      }
    }
  }
  
  // Process vehicle operating costs
  if (options?.includeVehicleOperating && ((campData && campData.vehicleOperating) || (scenarioData && scenarioData.vehicleOperating))) {
    const vocData = campData?.vehicleOperating || (scenarioData?.vehicleOperating || []);
    if (vocData.length > 0) {
      // Convert vehicle operating costs to benefit entries
      const vocBenefits = convertVehicleOperatingToBenefits(
        vocData as VehicleOperatingData[],
        analysis.baseYear,
        analysis.analysisHorizon,
        analysis.parameters as MonetizationParameters
      );
      
      // Add or update benefits
      for (const benefit of vocBenefits) {
        const existingIndex = annualBenefits.findIndex(
          b => b.year === benefit.year && b.category === benefit.category
        );
        
        if (existingIndex >= 0) {
          annualBenefits[existingIndex] = benefit;
        } else {
          annualBenefits.push(benefit);
        }
      }
    }
  }
  
  // Process health benefits
  if (options?.includeHealth && ((campData && campData.activeTransportation) || (scenarioData && scenarioData.activeTransportation))) {
    const healthData = campData?.activeTransportation || (scenarioData?.activeTransportation || []);
    if (healthData.length > 0) {
      // Convert active transportation to health benefits
      const healthBenefits = convertHealthToBenefits(
        healthData as HealthData[],
        analysis.baseYear,
        analysis.analysisHorizon,
        analysis.parameters as MonetizationParameters
      );
      
      // Add or update benefits
      for (const benefit of healthBenefits) {
        const existingIndex = annualBenefits.findIndex(
          b => b.year === benefit.year && b.category === benefit.category
        );
        
        if (existingIndex >= 0) {
          annualBenefits[existingIndex] = benefit;
        } else {
          annualBenefits.push(benefit);
        }
      }
    }
  }
  
  // Update the analysis with new benefit entries
  updatedAnalysis.annualBenefits = annualBenefits;
  updatedAnalysis.annualCosts = annualCosts;
  
  return updatedAnalysis;
}

// Helper functions to convert model data to benefit entries

function convertTravelTimeToBenefits(
  travelTimeData: TravelTimeData[], 
  baseYear: number, 
  analysisHorizon: number, 
  parameters: MonetizationParameters
): BenefitCostTimeSeries[] {
  const benefits: BenefitCostTimeSeries[] = [];
  
  // Extract parameters
  const valueOfTimeCommuter = parameters.valueOfTime?.commuter || 18.8; // $ per hour (default)
  const valueOfTimeCommercial = parameters.valueOfTime?.commercial || 32.6; // $ per hour (default)
  const valueOfTimeFreight = parameters.valueOfTime?.freight || 38.5; // $ per hour (default)
  
  // Process each year's data
  for (const yearData of travelTimeData) {
    const { year, commuterHoursSaved, commercialHoursSaved, freightHoursSaved } = yearData;
    
    // Skip if outside analysis horizon
    if (year < baseYear || year > baseYear + analysisHorizon) continue;
    
    // Calculate benefit value
    const commuterValue = (commuterHoursSaved || 0) * valueOfTimeCommuter;
    const commercialValue = (commercialHoursSaved || 0) * valueOfTimeCommercial;
    const freightValue = (freightHoursSaved || 0) * valueOfTimeFreight;
    const totalValue = commuterValue + commercialValue + freightValue;
    
    // Add benefit entry
    benefits.push({
      year,
      value: totalValue,
      category: 'Travel Time Savings',
      subcategory: 'CAMP Model',
      notes: `Imported from CAMP model: ${commuterHoursSaved || 0} commuter hours, ${commercialHoursSaved || 0} commercial hours, ${freightHoursSaved || 0} freight hours saved`
    });
  }
  
  return benefits;
}

function convertEmissionsToBenefits(
  emissionsData: EmissionsData[], 
  baseYear: number, 
  analysisHorizon: number, 
  parameters: MonetizationParameters
): BenefitCostTimeSeries[] {
  const benefits: BenefitCostTimeSeries[] = [];
  
  // Extract parameters
  const co2Cost = parameters.emissions?.co2 || 51; // $ per metric ton (default)
  const noxCost = parameters.emissions?.nox || 7400; // $ per ton (default)
  const pmCost = parameters.emissions?.pm || 380000; // $ per ton (default)
  
  // Process each year's data
  for (const yearData of emissionsData) {
    const { year, co2Reduction, noxReduction, pmReduction } = yearData;
    
    // Skip if outside analysis horizon
    if (year < baseYear || year > baseYear + analysisHorizon) continue;
    
    // Calculate benefit value
    const co2Value = (co2Reduction || 0) * co2Cost;
    const noxValue = (noxReduction || 0) * noxCost;
    const pmValue = (pmReduction || 0) * pmCost;
    const totalValue = co2Value + noxValue + pmValue;
    
    // Add benefit entry
    benefits.push({
      year,
      value: totalValue,
      category: 'Emissions',
      subcategory: 'CAMP Model',
      notes: `Imported from CAMP model: ${co2Reduction || 0} metric tons CO2, ${noxReduction || 0} tons NOx, ${pmReduction || 0} tons PM reduced`
    });
  }
  
  return benefits;
}

function convertSafetyToBenefits(
  safetyData: SafetyData[], 
  baseYear: number, 
  analysisHorizon: number, 
  parameters: MonetizationParameters
): BenefitCostTimeSeries[] {
  const benefits: BenefitCostTimeSeries[] = [];
  
  // Extract parameters
  const fatalCost = parameters.accidentCosts?.fatal || 11000000; // $ per fatal accident (default)
  const injuryCost = parameters.accidentCosts?.injury || 125000; // $ per injury accident (default)
  const pdoCost = parameters.accidentCosts?.propertyDamage || 4500; // $ per PDO accident (default)
  
  // Process each year's data
  for (const yearData of safetyData) {
    const { year, fatalReduction, injuryReduction, pdoReduction } = yearData;
    
    // Skip if outside analysis horizon
    if (year < baseYear || year > baseYear + analysisHorizon) continue;
    
    // Calculate benefit value
    const fatalValue = (fatalReduction || 0) * fatalCost;
    const injuryValue = (injuryReduction || 0) * injuryCost;
    const pdoValue = (pdoReduction || 0) * pdoCost;
    const totalValue = fatalValue + injuryValue + pdoValue;
    
    // Add benefit entry
    benefits.push({
      year,
      value: totalValue,
      category: 'Safety',
      subcategory: 'CAMP Model',
      notes: `Imported from CAMP model: ${fatalReduction || 0} fatal, ${injuryReduction || 0} injury, ${pdoReduction || 0} PDO accidents prevented`
    });
  }
  
  return benefits;
}

function convertVehicleOperatingToBenefits(
  vocData: VehicleOperatingData[], 
  baseYear: number, 
  analysisHorizon: number, 
  parameters: MonetizationParameters
): BenefitCostTimeSeries[] {
  const benefits: BenefitCostTimeSeries[] = [];
  
  // Extract parameters
  const fuelCost = parameters.vehicleOperating?.fuelCost || 3.5; // $ per gallon (default)
  const maintenanceCost = parameters.vehicleOperating?.maintenance || 0.15; // $ per mile (default)
  const depreciationCost = parameters.vehicleOperating?.depreciation || 0.28; // $ per mile (default)
  
  // Process each year's data
  for (const yearData of vocData) {
    const { year, fuelSavings, maintenanceSavings, depreciationSavings } = yearData;
    
    // Skip if outside analysis horizon
    if (year < baseYear || year > baseYear + analysisHorizon) continue;
    
    // Calculate benefit value
    const fuelValue = (fuelSavings || 0) * fuelCost;
    const maintenanceValue = (maintenanceSavings || 0) * maintenanceCost;
    const depreciationValue = (depreciationSavings || 0) * depreciationCost;
    const totalValue = fuelValue + maintenanceValue + depreciationValue;
    
    // Add benefit entry
    benefits.push({
      year,
      value: totalValue,
      category: 'Vehicle Operating Costs',
      subcategory: 'CAMP Model',
      notes: `Imported from CAMP model: ${fuelSavings || 0} gallons fuel saved, ${maintenanceSavings || 0} miles maintenance savings, ${depreciationSavings || 0} miles depreciation savings`
    });
  }
  
  return benefits;
}

function convertHealthToBenefits(
  healthData: HealthData[], 
  baseYear: number, 
  analysisHorizon: number, 
  parameters: MonetizationParameters
): BenefitCostTimeSeries[] {
  const benefits: BenefitCostTimeSeries[] = [];
  
  // Extract parameters
  const walkingValue = parameters.health?.walking || 0.92; // $ per mile walked (default)
  const bikingValue = parameters.health?.biking || 0.41; // $ per mile biked (default)
  
  // Process each year's data
  for (const yearData of healthData) {
    const { year, walkingMiles, bikingMiles } = yearData;
    
    // Skip if outside analysis horizon
    if (year < baseYear || year > baseYear + analysisHorizon) continue;
    
    // Calculate benefit value
    const walkingBenefit = (walkingMiles || 0) * walkingValue;
    const bikingBenefit = (bikingMiles || 0) * bikingValue;
    const totalValue = walkingBenefit + bikingBenefit;
    
    // Add benefit entry
    benefits.push({
      year,
      value: totalValue,
      category: 'Health',
      subcategory: 'CAMP Model',
      notes: `Imported from CAMP model: ${walkingMiles || 0} miles walked, ${bikingMiles || 0} miles biked`
    });
  }
  
  return benefits;
} 