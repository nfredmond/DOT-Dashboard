import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import {   createBenefitCostAnalysis,   calculateBenefitCostAnalysis,  updateBenefitCostAnalysis,  performSensitivityAnalysis,  runMonteCarloSimulation} from '@/lib/benefit-cost-service';
import { BenefitCategory, CostCategory } from '@/types/benefit-cost';
import { IntegrationService } from '@/lib/camp/integration-service';
import { z } from 'zod';
import { 
  BenefitCostAnalysis, 
  BenefitCostAnalysisResult,
  generateBenefitCostInsights,
  generateBenefitCostRecommendations,
  optimizeParameters
} from '@/lib/benefit-cost-service';

export const dynamic = 'force-dynamic';

// Schema for integrated analysis request
const integratedAnalysisSchema = z.object({
  analysisName: z.string().min(1).max(255),
  description: z.string().optional(),
  scenarioId: z.string().uuid(),
  greenchampModelId: z.string().uuid().optional(),
  templateId: z.string().optional(),
  options: z.object({
    includeTravelTimeFromModel: z.boolean().default(true),
    includeEmissionsFromModel: z.boolean().default(true),
    includeSafetyFromModel: z.boolean().default(true),
    includeHealthFromModel: z.boolean().default(true),
    runSensitivityAnalysis: z.boolean().default(true),
    runMonteCarloSimulation: z.boolean().default(false),
    monteCarloIterations: z.number().int().min(100).max(10000).default(1000)
  }).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const organizationId = user.user_metadata?.organizationId;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = integratedAnalysisSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { analysisName, description, scenarioId, greenchampModelId, templateId, options } = validationResult.data;

    // Verify project exists and belongs to organization
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('organizationId', organizationId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get scenario results
    const { data: scenarioResults, error: scenarioError } = await supabase
      .from('scenario_results')
      .select(`
        *,
        scenario:scenarios(
          *,
          greenchamp_model:greenchamp_model_configs(*)
        )
      `)
      .eq('scenarioId', scenarioId)
      .order('completedAt', { ascending: false })
      .limit(1)
      .single();

    if (scenarioError || !scenarioResults) {
      return NextResponse.json(
        { error: 'Scenario results not found. Please run the scenario first.' },
        { status: 400 }
      );
    }

    // Get integration service
    const _integrationService = new IntegrationService();

    logger.info(`Starting integrated analysis for project ${projectId} with scenario ${scenarioId}`);

    // Step 1: Create base BCA analysis
    const initialAnalysisData = {
      projectId,
      name: analysisName,
      description: description || `Integrated analysis based on ${scenarioResults.scenario.name}`,
      scenarioId,
      baseYear: scenarioResults.scenario.baseYear || new Date().getFullYear(),
      analysisHorizon: 30, // Default 30-year horizon
      discountRate: 0.07, // Default 7% discount rate
      benefits: [],
      costs: []
    };

    const bcaAnalysis = await createBenefitCostAnalysis(
      initialAnalysisData,
      templateId,
      user.id,
      organizationId
    );

    // Step 2: Import data from GreenChAMP/TrendNavigator results
    if (options?.includeTravelTimeFromModel && scenarioResults.metrics) {
      // Calculate travel time savings
      const baselineVHT = scenarioResults.metrics.baselineVHT || 0;
      const scenarioVHT = scenarioResults.metrics.vht || 0;
      const annualTimeSavings = (baselineVHT - scenarioVHT) * 365; // Convert to annual

      if (annualTimeSavings > 0) {
        bcaAnalysis.benefits.push({
          id: uuidv4(),
          category: BenefitCategory.TRAVEL_TIME_SAVINGS,
          description: 'Travel time savings from GreenChAMP model',
          annualValue: annualTimeSavings * bcaAnalysis.parameters.valueOfTime.commuter,
          growthRate: 0.02, // 2% annual growth
          presentValue: 0,
          totalValue: 0,
          annualValues: [],
          parameters: {
            hoursSaved: annualTimeSavings,
            valueOfTime: bcaAnalysis.parameters.valueOfTime.commuter
          }
        });
      }
    }

    if (options?.includeEmissionsFromModel && scenarioResults.metrics?.emissions) {
      // Calculate emissions reduction benefits
      const emissionsReduction = scenarioResults.metrics.baselineEmissions - scenarioResults.metrics.emissions.co2;
      
      if (emissionsReduction > 0) {
        bcaAnalysis.benefits.push({
          id: uuidv4(),
          category: 'EMISSIONS',
          description: 'CO2 emissions reduction benefits',
          annualValue: emissionsReduction * bcaAnalysis.parameters.emissionsCosts.co2,
          growthRate: 0.01,
          presentValue: 0,
          totalValue: 0,
          annualValues: [],
          parameters: {
            co2Reduced: emissionsReduction,
            costPerTon: bcaAnalysis.parameters.emissionsCosts.co2
          }
        });
      }
    }

    if (options?.includeSafetyFromModel && scenarioResults.metrics?.safety) {
      // Calculate safety benefits
      const crashReduction = scenarioResults.metrics.safety.crashReduction || 0;
      
      if (crashReduction > 0) {
        bcaAnalysis.benefits.push({
          id: uuidv4(),
          category: 'SAFETY',
          description: 'Crash reduction benefits',
          annualValue: crashReduction * bcaAnalysis.parameters.accidentCosts.fatality * 0.01 + // Assume 1% are fatalities
                      crashReduction * bcaAnalysis.parameters.accidentCosts.injury * 0.3 + // 30% injuries
                      crashReduction * bcaAnalysis.parameters.accidentCosts.propertyDamageOnly * 0.69, // 69% PDO
          growthRate: 0,
          presentValue: 0,
          totalValue: 0,
          annualValues: [],
          parameters: {
            crashesReduced: crashReduction,
            severityDistribution: { fatality: 0.01, injury: 0.3, pdo: 0.69 }
          }
        });
      }
    }

    if (options?.includeHealthFromModel && scenarioResults.metrics?.modeShares) {
      // Calculate health benefits from increased active transportation
      const walkBikeIncrease = 
        (scenarioResults.metrics.modeShares.walk - scenarioResults.metrics.baselineModeShares?.walk || 0) +
        (scenarioResults.metrics.modeShares.bike - scenarioResults.metrics.baselineModeShares?.bike || 0);
      
      if (walkBikeIncrease > 0) {
        const population = scenarioResults.scenario.greenchamp_model?.zoneSystem?.totalPopulation || 100000;
        const healthBenefitPerPerson = 500; // $500 annual health benefit per active transport user
        
        bcaAnalysis.benefits.push({
          id: uuidv4(),
          category: 'HEALTH',
          description: 'Health benefits from increased active transportation',
          annualValue: walkBikeIncrease * population * healthBenefitPerPerson,
          growthRate: 0.015,
          presentValue: 0,
          totalValue: 0,
          annualValues: [],
          parameters: {
            activeTransportIncrease: walkBikeIncrease,
            population,
            benefitPerPerson: healthBenefitPerPerson
          }
        });
      }
    }

    // Step 3: Calculate the analysis
    const calculatedAnalysis = calculateBenefitCostAnalysis(bcaAnalysis);

    // Step 4: Save the updated analysis
    await updateBenefitCostAnalysis(calculatedAnalysis.id, calculatedAnalysis, organizationId);

    // Step 5: Run sensitivity analysis if requested
    let sensitivityResults = null;
    if (options?.runSensitivityAnalysis) {
      const sensitivityParams = [
        { parameter: 'discountRate', low: 0.03, base: 0.07, high: 0.10 },
        { parameter: 'valueOfTime', low: 15, base: 25, high: 35 },
        { parameter: 'emissionsCost', low: 50, base: 100, high: 200 }
      ];
      
      sensitivityResults = await performSensitivityAnalysis(
        calculatedAnalysis,
        sensitivityParams
      );
    }

    // Step 6: Run Monte Carlo simulation if requested
    let monteCarloResults = null;
    if (options?.runMonteCarloSimulation) {
      const monteCarloParams = {
        iterations: options.monteCarloIterations || 1000,
        parameters: [
          {
            name: 'travelTimeSavings',
            distribution: 'normal',
            mean: calculatedAnalysis.benefits.find(b => b.category === 'TRAVEL_TIME_SAVINGS')?.annualValue || 0,
            standardDeviation: 0.2 // 20% standard deviation
          },
          {
            name: 'constructionCost',
            distribution: 'triangular',
            min: calculatedAnalysis.costs.find(c => c.category === 'CAPITAL')?.totalValue * 0.8 || 0,
            mode: calculatedAnalysis.costs.find(c => c.category === 'CAPITAL')?.totalValue || 0,
            max: calculatedAnalysis.costs.find(c => c.category === 'CAPITAL')?.totalValue * 1.3 || 0
          }
        ]
      };
      
      monteCarloResults = await performMonteCarloSimulation(
        calculatedAnalysis,
        monteCarloParams
      );
    }

    // Step 7: Generate comprehensive results
    const comprehensiveResults = {
      success: true,
      data: {
        analysis: calculatedAnalysis,
        scenarioMetrics: scenarioResults.metrics,
        sensitivityAnalysis: sensitivityResults,
        monteCarloSimulation: monteCarloResults,
        integration: {
          dataSourced: {
            travelTime: options?.includeTravelTimeFromModel,
            emissions: options?.includeEmissionsFromModel,
            safety: options?.includeSafetyFromModel,
            health: options?.includeHealthFromModel
          },
          scenarioId,
          greenchampModelId: scenarioResults.scenario.greenchampModelId,
          timestamp: new Date().toISOString()
        }
      }
    };

    logger.info(`Integrated analysis completed for project ${projectId}`);

    return NextResponse.json(comprehensiveResults);

  } catch (error) {
    logger.error('Error in integrated BCA analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 