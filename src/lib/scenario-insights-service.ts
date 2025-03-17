'use client';

import { ScenarioResults, ScenarioDefinition, TimeHorizon } from '@/types/trend-navigator';
import { CAMPModelConfig } from '@/types/camp';
import { createClient } from '@/lib/supabase/client';
import { AgentType, runAgentQuery } from '@/lib/agents-service';
import { analyzeScenarioResults, compareScenarios, generateRecommendations } from './ai-agent-service';
import { ScenarioInsights } from '@/types/trend-navigator';

export type InsightType = 'summary' | 'highlights' | 'recommendations' | 'comparison';

export interface ScenarioInsight {
  id: string;
  scenarioId: string;
  type: InsightType;
  title: string;
  description: string;
  metrics: {
    key: string;
    name: string;
    value: number;
    change: number;
    unit: string;
  }[];
  recommendations?: string[];
  tags: string[];
  createdAt: Date;
  aiGenerated: boolean;
}

export interface ComparisonInsight extends ScenarioInsight {
  comparedScenarioId: string;
  differences: {
    metric: string;
    scenarioValue: number;
    comparedValue: number;
    percentDifference: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

interface InsightOptions {
  focusAreas?: string[];
  detailLevel?: 'brief' | 'normal' | 'detailed';
  includeCharts?: boolean;
  compareToBaseline?: boolean;
}

interface InsightResponse {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  charts?: any[];
}

/**
 * Get insights for a scenario
 * 
 * @param scenarioId The scenario ID
 * @returns The scenario insights
 */
export async function getScenarioInsights(scenarioId: string): Promise<ScenarioInsights | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('scenario_insights')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (error) {
      console.error('Error fetching scenario insights:', error);
      return null;
    }
    
    // Convert from database format to application format
    return {
      id: data.id,
      scenarioId: data.scenario_id,
      summary: data.summary || '',
      keyFindings: data.key_findings || [],
      recommendations: data.recommendations || [],
      charts: data.charts || [],
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getScenarioInsights:', error);
    return null;
  }
}

/**
 * Generate insights for a scenario using AI
 * 
 * @param scenarioId The scenario ID
 * @param options Additional options
 * @returns The generated insights
 */
export async function generateScenarioInsights(
  scenarioId: string,
  options: Record<string, any> = {}
): Promise<ScenarioInsights | null> {
  try {
    const supabase = createClient();
    
    // Get scenario and results
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        *,
        results:scenario_results(*)
      `)
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError || !scenario || !scenario.results) {
      console.error('Error fetching scenario or no results available:', scenarioError);
      return null;
    }
    
    // If there's a baseline scenario, get its results for comparison
    let baselineResults = null;
    if (scenario.baseline_scenario_id) {
      const { data: baselineScenario, error: baselineError } = await supabase
        .from('scenarios')
        .select(`
          *,
          results:scenario_results(*)
        `)
        .eq('id', scenario.baseline_scenario_id)
        .single();
      
      if (!baselineError && baselineScenario && baselineScenario.results) {
        baselineResults = baselineScenario.results;
      }
    }
    
    // Generate insights using AI
    const promptData = {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        baseYear: scenario.base_year,
        horizonYears: scenario.horizon_years,
        assumptions: scenario.assumptions,
        policyPackages: scenario.policy_packages
      },
      results: scenario.results,
      baselineResults: baselineResults,
      compareToBaseline: !!baselineResults
    };
    
    // Call the AI agent
    const aiResponse = await runAgentQuery({
      type: AgentType.SCENARIO_INSIGHTS,
      query: 'Generate comprehensive insights for this scenario',
      context: promptData
    });
    
    if (!aiResponse || !aiResponse.result) {
      throw new Error('Failed to generate insights using AI');
    }
    
    // Parse AI response
    const aiResult = aiResponse.result;
    
    // Create insights object
    const insights: Partial<ScenarioInsights> = {
      scenarioId,
      summary: aiResult.summary || '',
      keyFindings: aiResult.keyFindings || [],
      recommendations: aiResult.recommendations || [],
      charts: aiResult.chartSuggestions || []
    };
    
    // Save insights to database
    const { data: existingInsights } = await supabase
      .from('scenario_insights')
      .select('id')
      .eq('scenario_id', scenarioId);
    
    if (existingInsights && existingInsights.length > 0) {
      // Update existing insights
      const { data: updated, error: updateError } = await supabase
        .from('scenario_insights')
        .update({
          summary: insights.summary,
          key_findings: insights.keyFindings,
          recommendations: insights.recommendations,
          charts: insights.charts,
          updated_at: new Date().toISOString()
        })
        .eq('scenario_id', scenarioId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating insights:', updateError);
        return null;
      }
      
      return {
        id: updated.id,
        scenarioId: updated.scenario_id,
        summary: updated.summary || '',
        keyFindings: updated.key_findings || [],
        recommendations: updated.recommendations || [],
        charts: updated.charts || [],
        updatedAt: updated.updated_at
      };
    } else {
      // Create new insights
      const { data: created, error: createError } = await supabase
        .from('scenario_insights')
        .insert({
          scenario_id: scenarioId,
          summary: insights.summary,
          key_findings: insights.keyFindings,
          recommendations: insights.recommendations,
          charts: insights.charts,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating insights:', createError);
        return null;
      }
      
      return {
        id: created.id,
        scenarioId: created.scenario_id,
        summary: created.summary || '',
        keyFindings: created.key_findings || [],
        recommendations: created.recommendations || [],
        charts: created.charts || [],
        updatedAt: created.updated_at
      };
    }
  } catch (error) {
    console.error('Error in generateScenarioInsights:', error);
    return null;
  }
}

/**
 * Compare multiple scenarios and generate insights about their differences
 */
export async function compareScenarioInsights(
  scenarioIds: string[],
  options: InsightOptions = {}
): Promise<InsightResponse | null> {
  if (scenarioIds.length < 2) {
    throw new Error('Need at least two scenarios to compare');
  }
  
  try {
    const aiResponse = await compareScenarios(scenarioIds, {
      detailLevel: options.detailLevel || 'normal'
    });
    
    return {
      summary: aiResponse.summary,
      keyFindings: aiResponse.keyFindings,
      recommendations: aiResponse.recommendations,
      charts: aiResponse.charts
    };
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    return null;
  }
}

/**
 * Generate recommendations for improving a scenario
 */
export async function generateScenarioRecommendations(
  scenarioId: string,
  goals: {
    emissions?: boolean;
    congestion?: boolean;
    equity?: boolean;
    transit?: boolean;
    costEffectiveness?: boolean;
  } = { emissions: true }
): Promise<string[]> {
  try {
    return await generateRecommendations(scenarioId, goals);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get detailed analysis of a specific aspect of a scenario
 * 
 * @param scenarioId The scenario ID
 * @param aspect The aspect to analyze (emissions, congestion, equity, transit)
 * @param baselineScenarioId Optional baseline scenario ID for comparison
 * @returns The analysis content
 */
export async function analyzeScenarioAspect(
  scenarioId: string,
  aspect: 'emissions' | 'congestion' | 'equity' | 'transit',
  baselineScenarioId: string | null
): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // Get scenario and results
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        *,
        results:scenario_results(*)
      `)
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError || !scenario || !scenario.results) {
      console.error('Error fetching scenario or no results available:', scenarioError);
      return null;
    }
    
    // If there's a baseline scenario, get its results for comparison
    let baselineResults = null;
    if (baselineScenarioId) {
      const { data: baselineScenario, error: baselineError } = await supabase
        .from('scenarios')
        .select(`
          *,
          results:scenario_results(*)
        `)
        .eq('id', baselineScenarioId)
        .single();
      
      if (!baselineError && baselineScenario && baselineScenario.results) {
        baselineResults = baselineScenario.results;
      }
    }
    
    // Generate aspect analysis using AI
    const promptData = {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        baseYear: scenario.base_year,
        horizonYears: scenario.horizon_years,
        assumptions: scenario.assumptions,
        policyPackages: scenario.policy_packages
      },
      results: scenario.results,
      aspect,
      baselineResults,
      compareToBaseline: !!baselineResults
    };
    
    // Call the AI agent
    const aiResponse = await runAgentQuery({
      type: AgentType.SCENARIO_ASPECT_ANALYSIS,
      query: `Analyze the ${aspect} aspect of this scenario`,
      context: promptData
    });
    
    if (!aiResponse || !aiResponse.result) {
      throw new Error(`Failed to analyze ${aspect} aspect using AI`);
    }
    
    return aiResponse.result.analysis || null;
  } catch (error) {
    console.error(`Error in analyzeScenarioAspect (${aspect}):`, error);
    return null;
  }
}

/**
 * Construct a prompt for scenario analysis
 */
function constructScenarioAnalysisPrompt(
  scenario: any,
  results: any,
  options: InsightOptions
): string {
  const horizonYear = results.horizonYears[0];
  const metrics = results.aggregateMetrics[horizonYear];
  
  // Format the basic prompt
  let prompt = `
    You are a transportation planning expert analyzing the results of the following scenario:
    
    SCENARIO NAME: ${scenario.name}
    DESCRIPTION: ${scenario.description}
    HORIZON YEAR: ${horizonYear}
    
    KEY METRICS:
    ${formatMetricsForPrompt(results)}
    
    SCENARIO ASSUMPTIONS:
    ${formatAssumptionsForPrompt(scenario.assumptions)}
    
    IMPLEMENTED POLICIES:
    ${formatPoliciesForPrompt(scenario.policyPackages)}
  `;
  
  // Add comparison to baseline if available and requested
  if (options.compareToBaseline && results.comparisonToBaseline) {
    prompt += `
      COMPARISON TO BASELINE:
      - VMT Change: ${results.comparisonToBaseline.vmtChange.toFixed(1)}%
      - GHG Emissions Change: ${results.comparisonToBaseline.ghgEmissionsChange.toFixed(1)}%
      - Transit Share Change: ${results.comparisonToBaseline.transitShareChange.toFixed(1)} percentage points
      - Walking Share Change: ${results.comparisonToBaseline.walkShareChange.toFixed(1)} percentage points
      - Biking Share Change: ${results.comparisonToBaseline.bikeShareChange.toFixed(1)} percentage points
    `;
  }
  
  // Add focus areas if specified
  if (options.focusAreas && options.focusAreas.length > 0) {
    prompt += `
      FOCUS YOUR ANALYSIS ON THESE AREAS:
      ${options.focusAreas.join(', ')}
    `;
  }
  
  // Add detail level instruction
  prompt += `
    Based on this information, provide a ${options.detailLevel || 'detailed'} analysis of this scenario. 
    ${options.includeCharts ? 'Include recommendations for visualizations that would help communicate the findings.' : ''}
    
    PLEASE STRUCTURE YOUR RESPONSE AS JSON with the following format:
    {
      "summary": "A concise summary of the scenario's performance and implications",
      "keyFindings": ["Finding 1", "Finding 2", ...],
      "recommendations": ["Recommendation 1", "Recommendation 2", ...],
      ${options.includeCharts ? '"charts": [{"type": "chart_type", "title": "Chart Title", "description": "What the chart shows", "data": {...}}],' : ''}
    }
  `;
  
  return prompt;
}

/**
 * Construct a prompt for scenario comparison
 */
function constructComparisonPrompt(
  scenarios: any[], 
  resultsMap: Record<string, any>,
  options: InsightOptions
): string {
  // Start with basic prompt
  let prompt = `
    You are a transportation planning expert comparing the following scenarios:
    
  `;
  
  // Add each scenario with its metrics
  scenarios.forEach(scenario => {
    const results = resultsMap[scenario.id];
    if (!results) return;
    
    const horizonYear = results.horizonYears[0];
    const metrics = results.aggregateMetrics[horizonYear];
    
    prompt += `
      SCENARIO: ${scenario.name}
      DESCRIPTION: ${scenario.description}
      
      KEY METRICS:
      ${formatMetricsForPrompt(results)}
      
      IMPLEMENTED POLICIES:
      ${formatPoliciesForPrompt(scenario.policyPackages)}
      
      -------------------
    `;
  });
  
  // Add comparison instructions
  prompt += `
    Compare these scenarios, focusing on:
    1. Key differences in performance metrics
    2. Trade-offs between scenarios
    3. Strengths and weaknesses of each approach
    ${options.focusAreas && options.focusAreas.length > 0 ? 
      `4. Specific performance in these areas: ${options.focusAreas.join(', ')}` : ''}
    
    PLEASE STRUCTURE YOUR RESPONSE AS JSON with the following format:
    {
      "summary": "A concise comparison of the scenarios",
      "keyFindings": ["Finding 1", "Finding 2", ...],
      "recommendations": ["Recommendation 1", "Recommendation 2", ...],
      ${options.includeCharts ? '"charts": [{"type": "chart_type", "title": "Chart Title", "description": "What the chart shows", "data": {...}}],' : ''}
    }
  `;
  
  return prompt;
}

/**
 * Format metrics for a prompt
 */
function formatMetricsForPrompt(results: any): string {
  if (!results || !results.aggregateMetrics || !results.horizonYears || results.horizonYears.length === 0) {
    return 'No metrics available';
  }
  
  const horizonYear = results.horizonYears[0];
  const metrics = results.aggregateMetrics[horizonYear];
  
  return `
    - Total VMT: ${metrics.totalVmt.toLocaleString()}
    - Total VHT: ${metrics.totalVht.toLocaleString()}
    - Total Trips: ${metrics.totalTrips.toLocaleString()}
    - GHG Emissions: ${metrics.ghgEmissions.toLocaleString()} metric tons
    - Congestion Index: ${metrics.congestionIndex.toFixed(2)}
    - Average Commute Time: ${metrics.averageCommute.toFixed(1)} minutes
    - Accessibility Index: ${metrics.accessibilityIndex.toFixed(2)}
    - Equity Index: ${metrics.equityIndex.toFixed(2)}
    - Mode Shares:
      - Drive Alone: ${(metrics.modeShares.drive_alone * 100).toFixed(1)}%
      - Shared Ride: ${(metrics.modeShares.shared_ride * 100).toFixed(1)}%
      - Transit: ${(metrics.modeShares.transit * 100).toFixed(1)}%
      - Walk: ${(metrics.modeShares.walk * 100).toFixed(1)}%
      - Bike: ${(metrics.modeShares.bike * 100).toFixed(1)}%
      - Micro-mobility: ${(metrics.modeShares.micro_mobility * 100).toFixed(1)}%
  `;
}

/**
 * Format assumptions for a prompt
 */
function formatAssumptionsForPrompt(assumptions: any[]): string {
  if (!assumptions || assumptions.length === 0) {
    return 'No specific assumptions defined';
  }
  
  return assumptions.map(assumption => {
    const values = Object.entries(assumption.values)
      .map(([year, value]) => `${year}: ${value}${assumption.unit}`)
      .join(', ');
      
    return `- ${assumption.name}: ${values} (Baseline: ${assumption.baselineValue}${assumption.unit})`;
  }).join('\n');
}

/**
 * Format policies for a prompt
 */
function formatPoliciesForPrompt(policyPackages: PolicyPackage[]): string {
  if (!policyPackages || policyPackages.length === 0) {
    return 'No policies implemented';
  }
  
  return policyPackages.map(pkg => {
    const policies = pkg.policies.map(p => `  - ${p.name}`).join('\n');
    return `- Package: ${pkg.name} (${pkg.category})\n${policies}`;
  }).join('\n');
}

/**
 * Generates comparative insights between multiple scenarios
 * @param scenarioIds Array of scenario IDs to compare
 * @param baselineScenarioId Optional baseline scenario ID for reference
 * @returns Comparative insights or null if an error occurs
 */
export async function generateComparativeInsights(
  scenarioIds: string[],
  baselineScenarioId?: string
): Promise<{ insights: string; metrics: Record<string, any> } | null> {
  try {
    if (!scenarioIds.length) {
      console.error('No scenario IDs provided for comparison');
      return null;
    }

    // Fetch all scenarios and their results
    const supabase = createClient();
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .in('id', scenarioIds);

    if (scenariosError || !scenarios) {
      console.error('Error fetching scenarios for comparison:', scenariosError);
      return null;
    }

    // Fetch results for all scenarios
    const { data: results, error: resultsError } = await supabase
      .from('scenario_results')
      .select('*')
      .in('scenario_id', scenarioIds)
      .order('created_at', { ascending: false });

    if (resultsError || !results) {
      console.error('Error fetching results for comparison:', resultsError);
      return null;
    }

    // Group results by scenario ID (taking the latest result for each scenario)
    const latestResultsByScenarioId: Record<string, any> = {};
    for (const result of results) {
      const scenarioId = result.scenario_id;
      if (!latestResultsByScenarioId[scenarioId] || 
          new Date(result.created_at) > new Date(latestResultsByScenarioId[scenarioId].created_at)) {
        latestResultsByScenarioId[scenarioId] = result;
      }
    }

    // Match scenarios with their results
    const scenariosWithResults = scenarios.map(scenario => ({
      ...scenario,
      results: latestResultsByScenarioId[scenario.id]?.results || null
    }));

    // Identify baseline scenario if provided
    const baselineScenario = baselineScenarioId 
      ? scenariosWithResults.find(s => s.id === baselineScenarioId) 
      : null;

    // Prepare metrics comparison data
    const metricKeys = ['congestion', 'emissions', 'accessibility', 'safety', 'equity'];
    const metricsComparison: Record<string, any> = {};

    scenariosWithResults.forEach(scenario => {
      if (!scenario.results) return;
      
      const scenarioMetrics: Record<string, any> = {};
      metricKeys.forEach(metricKey => {
        const value = scenario.results[metricKey];
        if (value === undefined) return;
        
        const baselineValue = baselineScenario?.results?.[metricKey];
        
        scenarioMetrics[metricKey] = {
          value,
          percentChange: baselineValue ? ((value / baselineValue) - 1) * 100 : null
        };
      });
      
      metricsComparison[scenario.id] = {
        name: scenario.name,
        metrics: scenarioMetrics
      };
    });

    // Construct prompt for AI to generate comparative insights
    let prompt = `Analyze and compare the following transportation scenarios:\n\n`;
    
    scenariosWithResults.forEach(scenario => {
      prompt += `Scenario: ${scenario.name}\n`;
      prompt += `Description: ${scenario.description || 'No description provided'}\n`;
      
      if (scenario.assumptions && scenario.assumptions.length > 0) {
        prompt += `Assumptions: ${scenario.assumptions.map((a: any) => a.name).join(', ')}\n`;
      }
      
      if (scenario.policy_packages && scenario.policy_packages.length > 0) {
        prompt += `Policy Packages: ${scenario.policy_packages.map((p: any) => p.name).join(', ')}\n`;
      }
      
      if (scenario.results) {
        prompt += `Results:\n`;
        metricKeys.forEach(key => {
          if (scenario.results[key] !== undefined) {
            prompt += `- ${key}: ${scenario.results[key]}\n`;
          }
        });
      }
      
      prompt += `\n`;
    });
    
    if (baselineScenario) {
      prompt += `Consider "${baselineScenario.name}" as the baseline scenario for comparison.\n`;
    }
    
    prompt += `\nProvide comprehensive comparative insights focusing on:
1. Overall performance comparison between scenarios
2. Key differences in outcomes for congestion, emissions, accessibility, safety, and equity
3. Trade-offs between different scenarios
4. Recommendations for which scenario(s) might be most effective based on the results`;

    // Call AI service to generate insights
    const aiResponse = await queryAIAgent({
      type: AgentType.SCENARIO_COMPARISON_ANALYSIS,
      query: prompt,
      temperature: 0.3
    });

    if (!aiResponse?.response) {
      console.error('Failed to get AI response for comparative insights');
      return null;
    }

    // Store the comparison results in the database for future reference
    const timestamp = new Date().toISOString();
    const { error: insertError } = await supabase
      .from('scenario_comparisons')
      .insert({
        scenario_ids: scenarioIds,
        baseline_scenario_id: baselineScenarioId,
        comparison_insights: aiResponse.response,
        metrics_data: metricsComparison,
        created_at: timestamp
      });

    if (insertError) {
      console.error('Error storing comparative insights:', insertError);
    }

    return {
      insights: aiResponse.response,
      metrics: metricsComparison
    };
  } catch (error) {
    console.error('Error generating comparative insights:', error);
    return null;
  }
} 