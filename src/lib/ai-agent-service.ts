'use client';

import { createClient } from '@/lib/supabase/client';
import { ScenarioDefinition, ScenarioResults } from '@/types/trend-navigator';

// Types for AI agent requests
interface AIAnalysisRequest {
  prompt: string;
  scenarioId?: string;
  comparedScenarioId?: string;
  contextData?: any;
  options?: {
    temperature?: number;
    maxTokens?: number;
    includeCharts?: boolean;
    includeVisualization?: boolean;
  };
}

// Response from AI model
interface AIResponse {
  content: string;
  suggestedActions?: {
    type: 'run_scenario' | 'modify_assumption' | 'add_policy' | 'compare_scenarios' | 'export_results';
    parameters?: Record<string, any>;
  }[];
  chartData?: any;
  visualizationData?: any;
}

interface AIAnalysisOptions {
  modelName?: string;
  temperature?: number;
  detailLevel?: 'brief' | 'normal' | 'detailed';
  compareToBaseline?: boolean;
  aspectToFocus?: 'emissions' | 'congestion' | 'equity' | 'transit' | 'general';
}

interface AIAnalysisResponse {
  content: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  charts?: any[];
}

/**
 * Analyzes scenario results using the AI agent
 */
export async function analyzeScenarioResults(
  scenarioId: string,
  tab: string = 'overview',
  options: AIAnalysisOptions = {}
): Promise<AIAnalysisResponse> {
  const supabase = createClient();
  
  try {
    // Fetch the scenario definition
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*, policy_packages(*), assumptions(*)')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Fetch the scenario results
    const { data: results, error: resultsError } = await supabase
      .from('scenario_results')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (resultsError) throw resultsError;

    // Fetch baseline results if needed for comparison
    let baselineResults = null;
    if (options.compareToBaseline && scenario.baseline_scenario_id) {
      const { data: baseline, error: baselineError } = await supabase
        .from('scenario_results')
        .select('*')
        .eq('scenario_id', scenario.baseline_scenario_id)
        .single();
      
      if (!baselineError) {
        baselineResults = baseline;
      }
    }
    
    // Prepare the prompt based on the tab
    const prompt = generatePromptForAnalysis(scenario, results, tab, baselineResults, options);
    
    // Call the AI service
    const aiResponse = await callAIService(prompt, {
      modelName: options.modelName || 'gpt-4-turbo',
      temperature: options.temperature || 0.7,
      format: 'json'
    });
    
    // Format response if needed
    const formattedResponse = formatAIResponse(aiResponse, tab);
    
    // Store the analysis in the database
    await storeAnalysisResult(scenarioId, tab, formattedResponse);
    
    return formattedResponse;
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw new Error(`Failed to analyze scenario: ${error.message}`);
  }
}

/**
 * Compare two scenarios and generate insights about their differences
 */
export async function compareScenarios(
  scenarioIds: string[],
  options: AIAnalysisOptions = {}
): Promise<AIAnalysisResponse> {
  if (scenarioIds.length < 2) {
    throw new Error('Need at least two scenarios to compare');
  }
  
  const supabase = createClient();
  const scenarios = [];
  const results = [];
  
  try {
    // Fetch all scenario definitions and results
    for (const id of scenarioIds) {
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*, policy_packages(*), assumptions(*)')
        .eq('id', id)
        .single();
      
      if (scenarioError) throw scenarioError;
      scenarios.push(scenario);
      
      const { data: scenarioResults, error: resultsError } = await supabase
        .from('scenario_results')
        .select('*')
        .eq('scenario_id', id)
        .single();
      
      if (resultsError) throw resultsError;
      results.push(scenarioResults);
    }
    
    // Generate prompt for comparison
    const prompt = generatePromptForComparison(scenarios, results, options);
    
    // Call AI service
    const aiResponse = await callAIService(prompt, {
      modelName: options.modelName || 'gpt-4-turbo',
      temperature: options.temperature || 0.7,
      format: 'json'
    });
    
    // Format the response
    const formattedResponse = formatAIResponse(aiResponse, 'comparison');
    
    // Store the comparison result
    await storeComparisonResult(scenarioIds, formattedResponse);
    
    return formattedResponse;
  } catch (error) {
    console.error('Error in scenario comparison:', error);
    throw new Error(`Failed to compare scenarios: ${error.message}`);
  }
}

/**
 * Generate recommendations to improve a scenario based on goals
 */
export async function generateRecommendations(
  scenarioId: string,
  goals: {
    emissions?: boolean;
    congestion?: boolean;
    equity?: boolean;
    transit?: boolean;
    costEffectiveness?: boolean;
  }
): Promise<string[]> {
  const supabase = createClient();
  
  try {
    // Fetch the scenario and its results
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*, policy_packages(*), assumptions(*)')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    const { data: results, error: resultsError } = await supabase
      .from('scenario_results')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (resultsError) throw resultsError;
    
    // Get available policies to recommend
    const { data: allPolicies, error: policiesError } = await supabase
      .from('policies')
      .select('*')
      .eq('organization_id', scenario.organization_id);
    
    if (policiesError) throw policiesError;
    
    // Filter out policies already in the scenario
    const existingPolicyIds = scenario.policy_packages.flatMap(pkg => 
      pkg.policies.map(p => p.id)
    );
    
    const availablePolicies = allPolicies.filter(p => 
      !existingPolicyIds.includes(p.id)
    );
    
    // Generate prompt for recommendations
    const prompt = generatePromptForRecommendations(
      scenario, 
      results, 
      availablePolicies,
      goals
    );
    
    // Call AI service
    const aiResponse = await callAIService(prompt, {
      modelName: 'gpt-4-turbo',
      temperature: 0.8,
      format: 'json'
    });
    
    // Format and return recommendations
    if (aiResponse && aiResponse.recommendations) {
      return aiResponse.recommendations;
    }
    
    return aiResponse || [];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
}

/**
 * Helper function to generate a prompt for scenario analysis
 */
function generatePromptForAnalysis(
  scenario: ScenarioDefinition,
  results: ScenarioResults,
  tab: string,
  baselineResults: ScenarioResults | null,
  options: AIAnalysisOptions
): string {
  const detailLevel = options.detailLevel || 'normal';
  
  let prompt = `You are an AI transportation planning assistant analyzing scenario results.\n\n`;
  prompt += `Scenario Name: ${scenario.name}\n`;
  prompt += `Description: ${scenario.description || 'No description provided'}\n\n`;
  
  // Add metrics from results
  prompt += `Key Metrics:\n`;
  const horizonYear = results.horizonYears[0];
  const metrics = results.aggregateMetrics[horizonYear];
  
  prompt += `- Total Vehicle Miles Traveled (VMT): ${metrics.totalVmt.toLocaleString()}\n`;
  prompt += `- Greenhouse Gas Emissions: ${metrics.ghgEmissions.toLocaleString()} tons CO2e\n`;
  prompt += `- Mode Share: ${Object.entries(metrics.modeShares)
    .map(([mode, share]) => `${mode}: ${(share * 100).toFixed(1)}%`)
    .join(', ')}\n`;
  prompt += `- Congestion Index: ${metrics.congestionIndex.toFixed(2)}\n`;
  prompt += `- Equity Index: ${metrics.equityIndex.toFixed(2)}\n\n`;
  
  // Add comparison to baseline if available
  if (baselineResults) {
    prompt += `Comparison to Baseline:\n`;
    if (results.comparisonToBaseline) {
      prompt += `- VMT Change: ${results.comparisonToBaseline.vmtChange.toFixed(1)}%\n`;
      prompt += `- GHG Emissions Change: ${results.comparisonToBaseline.ghgEmissionsChange.toFixed(1)}%\n`;
      prompt += `- Transit Mode Share Change: ${results.comparisonToBaseline.transitShareChange.toFixed(1)} percentage points\n`;
      prompt += `- Active Mode Share Change: ${results.comparisonToBaseline.activeModeShareChange.toFixed(1)} percentage points\n\n`;
    }
  }
  
  // Add scenario assumptions
  if (scenario.assumptions && scenario.assumptions.length > 0) {
    prompt += `Assumptions:\n`;
    scenario.assumptions.forEach(assumption => {
      prompt += `- ${assumption.name}: ${assumption.description}\n`;
    });
    prompt += '\n';
  }
  
  // Add policy packages
  if (scenario.policyPackages && scenario.policyPackages.length > 0) {
    prompt += `Policy Packages:\n`;
    scenario.policyPackages.forEach(pkg => {
      prompt += `- ${pkg.name} (${pkg.policies.length} policies):\n`;
      pkg.policies.forEach(policy => {
        prompt += `  - ${policy.name}: ${policy.description}\n`;
      });
    });
    prompt += '\n';
  }
  
  // Request analysis based on the tab
  prompt += `Based on the information provided, please provide a ${detailLevel} analysis of the scenario's `;
  
  switch (tab) {
    case 'overview':
      prompt += `overall performance. Include a summary, key findings, and recommendations.`;
      break;
    case 'emissions':
      prompt += `emissions impact. Focus on greenhouse gas emissions, contributing factors, and potential improvements.`;
      break;
    case 'mobility':
      prompt += `mobility outcomes. Focus on mode share, travel times, accessibility, and potential improvements.`;
      break;
    case 'equity':
      prompt += `equity implications. Focus on distributional impacts, equity index, accessibility for disadvantaged communities, and potential improvements.`;
      break;
    case 'congestion':
      prompt += `congestion impacts. Focus on the congestion index, travel times, bottlenecks, and potential improvements.`;
      break;
    case 'transit':
      prompt += `transit performance. Focus on transit mode share, transit accessibility, ridership, and potential improvements.`;
      break;
    default:
      prompt += `overall performance. Include a summary, key findings, and recommendations.`;
  }
  
  // Add format instructions
  prompt += `\n\nPlease format your response as a JSON object with the following structure:
  {
    "content": "Detailed analysis text",
    "summary": "Brief summary (1-2 sentences)",
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3", ...],
    "recommendations": ["Recommendation 1", "Recommendation 2", ...]
  }`;
  
  return prompt;
}

/**
 * Helper function to generate a prompt for scenario comparison
 */
function generatePromptForComparison(
  scenarios: ScenarioDefinition[],
  results: ScenarioResults[],
  options: AIAnalysisOptions
): string {
  let prompt = `You are an AI transportation planning assistant comparing multiple scenarios.\n\n`;
  
  // Add info for each scenario
  scenarios.forEach((scenario, index) => {
    prompt += `SCENARIO ${index + 1}: ${scenario.name}\n`;
    prompt += `Description: ${scenario.description || 'No description provided'}\n\n`;
    
    // Add key metrics
    const horizonYear = results[index].horizonYears[0];
    const metrics = results[index].aggregateMetrics[horizonYear];
    
    prompt += `Key Metrics (${scenario.name}):\n`;
    prompt += `- Total VMT: ${metrics.totalVmt.toLocaleString()}\n`;
    prompt += `- GHG Emissions: ${metrics.ghgEmissions.toLocaleString()} tons CO2e\n`;
    prompt += `- Mode Share: ${Object.entries(metrics.modeShares)
      .map(([mode, share]) => `${mode}: ${(share * 100).toFixed(1)}%`)
      .join(', ')}\n`;
    prompt += `- Congestion Index: ${metrics.congestionIndex.toFixed(2)}\n`;
    prompt += `- Equity Index: ${metrics.equityIndex.toFixed(2)}\n\n`;
    
    // Add policy differences if not the first scenario
    if (index > 0) {
      const currentPolicies = scenario.policyPackages.flatMap(pkg => pkg.policies.map(p => p.name));
      const prevPolicies = scenarios[0].policyPackages.flatMap(pkg => pkg.policies.map(p => p.name));
      
      const uniquePolicies = currentPolicies.filter(p => !prevPolicies.includes(p));
      
      if (uniquePolicies.length > 0) {
        prompt += `Unique Policies (compared to Scenario 1):\n`;
        uniquePolicies.forEach(policy => {
          prompt += `- ${policy}\n`;
        });
        prompt += '\n';
      }
    }
  });
  
  // Request comparison
  prompt += `Please compare these scenarios, focusing on their relative performance in terms of emissions, congestion, transit usage, and equity. Include the following in your analysis:
  
1. Which scenario performs best overall and why?
2. Key trade-offs between the scenarios
3. Specific strengths and weaknesses of each scenario
4. Recommendations for how to combine the best elements of these scenarios`;
  
  // Add format instructions
  prompt += `\n\nPlease format your response as a JSON object with the following structure:
  {
    "content": "Detailed comparison text",
    "summary": "Brief summary (1-2 sentences)",
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3", ...],
    "recommendations": ["Recommendation 1", "Recommendation 2", ...],
    "bestScenario": "Name of the best performing scenario"
  }`;
  
  return prompt;
}

/**
 * Helper function to generate a prompt for scenario recommendations
 */
function generatePromptForRecommendations(
  scenario: ScenarioDefinition,
  results: ScenarioResults,
  availablePolicies: any[],
  goals: any
): string {
  let prompt = `You are an AI transportation planning assistant recommending policies to improve a scenario.\n\n`;
  
  prompt += `Scenario Name: ${scenario.name}\n`;
  prompt += `Description: ${scenario.description || 'No description provided'}\n\n`;
  
  // Add metrics from results
  prompt += `Current Metrics:\n`;
  const horizonYear = results.horizonYears[0];
  const metrics = results.aggregateMetrics[horizonYear];
  
  prompt += `- Total VMT: ${metrics.totalVmt.toLocaleString()}\n`;
  prompt += `- GHG Emissions: ${metrics.ghgEmissions.toLocaleString()} tons CO2e\n`;
  prompt += `- Mode Share: ${Object.entries(metrics.modeShares)
    .map(([mode, share]) => `${mode}: ${(share * 100).toFixed(1)}%`)
    .join(', ')}\n`;
  prompt += `- Congestion Index: ${metrics.congestionIndex.toFixed(2)}\n`;
  prompt += `- Equity Index: ${metrics.equityIndex.toFixed(2)}\n\n`;
  
  // Add current policies
  prompt += `Current Policies:\n`;
  scenario.policyPackages.forEach(pkg => {
    pkg.policies.forEach(policy => {
      prompt += `- ${policy.name}\n`;
    });
  });
  prompt += '\n';
  
  // Add available policies to recommend
  prompt += `Available Policies to Recommend:\n`;
  availablePolicies.forEach(policy => {
    prompt += `- ${policy.name}: ${policy.description}\n`;
    if (policy.impact_estimates) {
      prompt += `  Impact estimates: ${JSON.stringify(policy.impact_estimates)}\n`;
    }
  });
  prompt += '\n';
  
  // Add improvement goals
  prompt += `Improvement Goals:\n`;
  if (goals.emissions) prompt += `- Reduce greenhouse gas emissions\n`;
  if (goals.congestion) prompt += `- Reduce congestion\n`;
  if (goals.equity) prompt += `- Improve equity\n`;
  if (goals.transit) prompt += `- Increase transit usage\n`;
  if (goals.costEffectiveness) prompt += `- Maximize cost-effectiveness\n`;
  prompt += '\n';
  
  // Request recommendations
  prompt += `Please recommend 3-5 policies from the available options that would best help achieve the improvement goals. For each recommendation, explain why it would be effective and how it complements the existing policies.`;
  
  // Add format instructions
  prompt += `\n\nPlease format your response as a JSON object with the following structure:
  {
    "recommendations": [
      {
        "policyName": "Name of the policy",
        "explanation": "Why this policy is recommended and how it would help",
        "expectedImpact": "High/Medium/Low impact on the goals"
      },
      ...
    ]
  }`;
  
  return prompt;
}

/**
 * Format AI response for the UI
 */
function formatAIResponse(response: any, _tab: string): AIAnalysisResponse {
  // If response is already in the expected format, return it
  if (typeof response === 'object' && response.content && response.summary) {
    return response;
  }
  
  // If response is a string, try to parse it as JSON
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      if (parsed.content) {
        return parsed;
      }
    } catch (e) {
      // Not valid JSON, continue with fallback
    }
  }
  
  // Fallback: construct a response object
  return {
    content: typeof response === 'string' ? response : JSON.stringify(response),
    summary: 'AI analysis completed.',
    keyFindings: [],
    recommendations: []
  };
}

/**
 * Store analysis result in the database
 */
async function storeAnalysisResult(
  scenarioId: string, 
  tab: string, 
  analysis: AIAnalysisResponse
): Promise<void> {
  const supabase = createClient();
  
  try {
    // Check if analysis already exists
    const { data, error: _fetchError } = await supabase
      .from('scenario_analyses')
      .select('id')
      .eq('scenario_id', scenarioId)
      .eq('analysis_type', tab)
      .single();
    
    if (data) {
      // Update existing analysis
      await supabase
        .from('scenario_analyses')
        .update({
          content: analysis.content,
          summary: analysis.summary,
          key_findings: analysis.keyFindings,
          recommendations: analysis.recommendations,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
    } else {
      // Create new analysis
      await supabase
        .from('scenario_analyses')
        .insert({
          scenario_id: scenarioId,
          analysis_type: tab,
          content: analysis.content,
          summary: analysis.summary,
          key_findings: analysis.keyFindings,
          recommendations: analysis.recommendations
        });
    }
  } catch (error) {
    console.error('Error storing analysis result:', error);
    // Continue without storing - don't fail the main function
  }
}

/**
 * Store comparison result in the database
 */
async function storeComparisonResult(
  scenarioIds: string[],
  analysis: AIAnalysisResponse
): Promise<void> {
  const supabase = createClient();
  
  try {
    // Create a unique key for this comparison
    const comparisonKey = scenarioIds.sort().join('-');
    
    // Check if comparison already exists
    const { data, error: _fetchError } = await supabase
      .from('scenario_comparisons')
      .select('id')
      .eq('comparison_key', comparisonKey)
      .single();
    
    if (data) {
      // Update existing comparison
      await supabase
        .from('scenario_comparisons')
        .update({
          content: analysis.content,
          summary: analysis.summary,
          key_findings: analysis.keyFindings,
          recommendations: analysis.recommendations,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
    } else {
      // Create new comparison
      await supabase
        .from('scenario_comparisons')
        .insert({
          comparison_key: comparisonKey,
          scenario_ids: scenarioIds,
          content: analysis.content,
          summary: analysis.summary,
          key_findings: analysis.keyFindings,
          recommendations: analysis.recommendations
        });
    }
  } catch (error) {
    console.error('Error storing comparison result:', error);
    // Continue without storing - don't fail the main function
  }
}

/**
 * Call the AI service with the given prompt
 */
async function callAIService(prompt: string, options: {
  modelName: string;
  temperature: number;
  format: string;
}): Promise<any> {
  try {
    // In a real implementation, this would call an actual OpenAI or similar service
    // For now, we'll simulate a response
    return simulateAIResponse(prompt, options);
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error(`Failed to call AI service: ${error.message}`);
  }
}

/**
 * Simulate AI response for development
 */
function simulateAIResponse(prompt: string, _options: any): any {
  // Check the prompt content to generate an appropriate mock response
  const includesEmissions = prompt.toLowerCase().includes('emissions');
  const includesCongestion = prompt.toLowerCase().includes('congestion');
  const includesEquity = prompt.toLowerCase().includes('equity');
  const includesTransit = prompt.toLowerCase().includes('transit');
  const isComparison = prompt.toLowerCase().includes('comparing multiple scenarios');
  
  let response: any = {
    content: "This is a simulated AI response. In production, this would be generated by an actual AI service.",
    summary: "Simulated analysis of the scenario.",
    keyFindings: [
      "This is a simulated key finding.",
      "Actual AI responses would contain real insights based on the data."
    ],
    recommendations: [
      "This is a simulated recommendation.",
      "In production, these would be generated by an actual AI model."
    ]
  };
  
  if (includesEmissions) {
    response.content += " The analysis focuses on emissions reductions strategies.";
    response.summary = "The scenario shows moderate emissions reductions.";
    response.keyFindings = [
      "GHG emissions are reduced by implementing transit and EV policies.",
      "VMT reduction contributes significantly to emissions goals.",
      "Further emissions reductions could be achieved with more aggressive policies."
    ];
    response.recommendations = [
      "Increase the EV adoption target to 40% by 2030.",
      "Expand the transit system coverage to reduce car dependency.",
      "Implement congestion pricing in high-traffic areas."
    ];
  }
  
  if (includesCongestion) {
    response.content += " The analysis examines congestion impacts and mitigation strategies.";
    response.summary = "The scenario achieves moderate congestion reduction.";
    response.keyFindings = [
      "Congestion is reduced in key corridors through targeted investments.",
      "Peak-hour travel is shifted through TDM programs.",
      "Some areas still experience significant congestion."
    ];
    response.recommendations = [
      "Implement dynamic road pricing in congested corridors.",
      "Increase investment in intelligent transportation systems.",
      "Expand telecommuting incentives to reduce peak-hour trips."
    ];
  }
  
  if (includesEquity) {
    response.content += " The analysis focuses on equity implications across communities.";
    response.summary = "The scenario makes moderate improvements to equity outcomes.";
    response.keyFindings = [
      "Transit accessibility is improved for disadvantaged communities.",
      "Affordable housing policies help reduce transportation cost burden.",
      "Some equity gaps remain in job accessibility and service quality."
    ];
    response.recommendations = [
      "Target transit investments more specifically to underserved areas.",
      "Expand affordable housing near high-frequency transit.",
      "Implement community-based planning processes for future projects."
    ];
  }
  
  if (includesTransit) {
    response.content += " The analysis examines transit performance and improvement opportunities.";
    response.summary = "The scenario shows significant transit ridership growth.";
    response.keyFindings = [
      "Transit mode share increases due to service frequency improvements.",
      "BRT investments create efficient transit corridors.",
      "First/last mile connections remain a challenge in some areas."
    ];
    response.recommendations = [
      "Expand micromobility options for first/last mile connections.",
      "Increase service frequency during off-peak hours.",
      "Implement transit signal priority on all major routes."
    ];
  }
  
  if (isComparison) {
    response.content += " This comparison identifies the relative strengths of each scenario.";
    response.summary = "Scenario 2 performs best overall with balanced outcomes.";
    response.keyFindings = [
      "Scenario 1 achieves the highest emissions reductions but at higher cost.",
      "Scenario 2 balances multiple objectives effectively.",
      "Scenario 3 performs best on equity metrics but falls short on congestion."
    ];
    response.recommendations = [
      "Adopt the transit investments from Scenario 1.",
      "Combine with the land use policies from Scenario 2.",
      "Incorporate the equity-focused programs from Scenario 3."
    ];
    response.bestScenario = "Scenario 2";
  }
  
  return response;
}

// Helper functions

function _formatNumber(value: number): string {
  return value.toLocaleString();
}

function _formatModeName(mode: string): string {
  const modeMap: Record<string, string> = {
    drive_alone: 'Drive Alone',
    shared_ride_2: 'Carpool (2)',
    shared_ride_3: 'Carpool (3+)',
    transit: 'Transit',
    walk: 'Walk',
    bike: 'Bike',
    tnc: 'Rideshare',
    micro_mobility: 'Micromobility'
  };
  
  return modeMap[mode] || mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
} 