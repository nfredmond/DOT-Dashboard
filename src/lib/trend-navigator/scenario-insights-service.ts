import { getAIClient } from '../ai-service';

/**
 * Scenario Insights Service
 * 
 * Generates AI-powered insights from scenario results to provide
 * meaningful analysis and recommendations.
 */

/**
 * Generate insights for a scenario based on its results
 * 
 * @param scenario The scenario data
 * @param results The scenario model results
 * @returns Object containing insights, key findings, and recommendations
 */
export async function generateInsights(scenario: any, results: any) {
  try {
    console.log(`Generating insights for scenario ${scenario.id}`);
    
    // Get AI client for insight generation
    const aiClient = await getAIClient();
    
    // Prepare prompt with scenario data and results
    const prompt = createInsightPrompt(scenario, results);
    
    // Get AI response
    const response = await aiClient.complete({
      prompt,
      max_tokens: 1000,
      temperature: 0.2, // Lower temperature for more focused, consistent responses
      stop: ['###']
    });
    
    // Parse AI-generated insights
    const parsedInsights = parseInsightsResponse(response);
    
    return parsedInsights;
  } catch (error) {
    console.error('Error generating scenario insights:', error);
    
    // Return fallback insights if AI generation fails
    return createFallbackInsights(scenario, results);
  }
}

/**
 * Create a prompt for the AI to generate scenario insights
 */
function createInsightPrompt(scenario: any, results: any) {
  // Extract key metrics from the results
  const metrics = extractKeyMetrics(results);
  
  // Build the prompt
  return `
You are an expert transportation planner analyzing scenario results.

SCENARIO INFORMATION:
Name: ${scenario.name}
Description: ${scenario.description}
Base Year: ${scenario.base_year}
Horizon Year: ${scenario.horizon_years[0]}

KEY ASSUMPTIONS:
${formatAssumptions(scenario.assumptions)}

KEY METRICS:
${formatMetrics(metrics)}

Based on the above information, provide a comprehensive analysis including:
1. General insights about the scenario outcomes
2. Key findings highlighting the most significant results
3. Recommendations for policy or planning decisions

Format your response in JSON as follows:
{
  "insights": "Detailed paragraph analyzing the overall scenario results...",
  "key_findings": [
    "Finding 1: Details about this finding...",
    "Finding 2: Details about this finding...",
    "Finding 3: Details about this finding..."
  ],
  "recommendations": [
    "Recommendation 1: Rationale for this recommendation...",
    "Recommendation 2: Rationale for this recommendation...",
    "Recommendation 3: Rationale for this recommendation..."
  ]
}

###
`;
}

/**
 * Extract key metrics from scenario results
 */
function extractKeyMetrics(results: any) {
  const metrics = {
    congestion: {
      average_vtc: results.congestion?.average_vtc || 'N/A',
      total_delay: results.congestion?.total_delay || 'N/A',
      congested_links: results.congestion?.congested_links || 'N/A'
    },
    emissions: {
      co2_tonnes: results.emissions?.co2_tonnes || 'N/A',
      nox_kg: results.emissions?.nox_kg || 'N/A',
      pm_kg: results.emissions?.pm_kg || 'N/A'
    },
    safety: {
      total_crashes: results.safety?.total_crashes || 'N/A',
      fatalities: results.safety?.fatalities || 'N/A',
      injuries: results.safety?.injuries || 'N/A'
    },
    equity: {
      low_income_ratio: results.equity?.equity_ratios?.low_income || 'N/A',
      minority_ratio: results.equity?.equity_ratios?.minority || 'N/A',
      zero_car_ratio: results.equity?.equity_ratios?.zero_car || 'N/A'
    },
    network: {
      total_vmt: results.network_metrics?.total_vmt || 'N/A',
      total_vht: results.network_metrics?.total_vht || 'N/A',
      average_speed: results.network_metrics?.average_speed || 'N/A'
    },
    mode_shares: results.mode_shares || {}
  };
  
  return metrics;
}

/**
 * Format scenario assumptions for the prompt
 */
function formatAssumptions(assumptions: any) {
  if (!assumptions) return 'No assumptions provided';
  
  let formatted = '';
  
  // Add telecommuting assumptions if present
  if (assumptions.telecommuting) {
    formatted += `- Telecommuting Rate: ${assumptions.telecommuting.rate * 100}%\n`;
  }
  
  // Add e-commerce assumptions if present
  if (assumptions.e_commerce) {
    formatted += `- E-commerce Adoption: ${assumptions.e_commerce.adoption_rate * 100}%\n`;
  }
  
  // Add mode choice adjustments if present
  if (assumptions.mode_choice) {
    formatted += '- Mode Choice Adjustments:\n';
    for (const [mode, value] of Object.entries(assumptions.mode_choice)) {
      formatted += `  - ${mode}: ${value}\n`;
    }
  }
  
  // Add network assumptions if present
  if (assumptions.network) {
    formatted += '- Network Assumptions:\n';
    if (assumptions.network.capacity_factor) {
      formatted += `  - Capacity Factor: ${assumptions.network.capacity_factor}\n`;
    }
  }
  
  // Add other key assumptions
  if (assumptions.general) {
    formatted += '- General Assumptions:\n';
    for (const [key, value] of Object.entries(assumptions.general)) {
      formatted += `  - ${key}: ${value}\n`;
    }
  }
  
  return formatted || 'No specific assumptions provided';
}

/**
 * Format metrics for the prompt
 */
function formatMetrics(metrics: any) {
  let formatted = '';
  
  // Congestion metrics
  formatted += 'Congestion:\n';
  formatted += `- Average Volume/Capacity Ratio: ${metrics.congestion.average_vtc}\n`;
  formatted += `- Total Delay (hours): ${metrics.congestion.total_delay}\n`;
  formatted += `- Congested Links: ${metrics.congestion.congested_links}\n\n`;
  
  // Emissions metrics
  formatted += 'Emissions:\n';
  formatted += `- CO2 (tonnes): ${metrics.emissions.co2_tonnes}\n`;
  formatted += `- NOx (kg): ${metrics.emissions.nox_kg}\n`;
  formatted += `- PM (kg): ${metrics.emissions.pm_kg}\n\n`;
  
  // Safety metrics
  formatted += 'Safety:\n';
  formatted += `- Total Crashes: ${metrics.safety.total_crashes}\n`;
  formatted += `- Fatalities: ${metrics.safety.fatalities}\n`;
  formatted += `- Injuries: ${metrics.safety.injuries}\n\n`;
  
  // Equity metrics
  formatted += 'Equity:\n';
  formatted += `- Low Income Accessibility Ratio: ${metrics.equity.low_income_ratio}\n`;
  formatted += `- Minority Accessibility Ratio: ${metrics.equity.minority_ratio}\n`;
  formatted += `- Zero-Car Household Accessibility Ratio: ${metrics.equity.zero_car_ratio}\n\n`;
  
  // Network metrics
  formatted += 'Network Performance:\n';
  formatted += `- Total VMT: ${metrics.network.total_vmt}\n`;
  formatted += `- Total VHT: ${metrics.network.total_vht}\n`;
  formatted += `- Average Speed: ${metrics.network.average_speed}\n\n`;
  
  // Mode shares
  formatted += 'Mode Shares:\n';
  for (const [mode, share] of Object.entries(metrics.mode_shares)) {
    formatted += `- ${mode}: ${Number(share) * 100}%\n`;
  }
  
  return formatted;
}

/**
 * Parse the AI response into structured insights
 */
function parseInsightsResponse(response: string): any {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback parsing if JSON extraction fails
    const insights = extractSection(response, 'insights', 'key_findings');
    const keyFindings = extractListItems(response, 'key_findings', 'recommendations');
    const recommendations = extractListItems(response, 'recommendations');
    
    return {
      insights,
      key_findings: keyFindings,
      recommendations
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Return a basic structure if parsing fails
    return {
      insights: response.substring(0, 500) + '...',
      key_findings: ['Unable to parse key findings from AI response'],
      recommendations: ['Unable to parse recommendations from AI response']
    };
  }
}

/**
 * Extract a section from the AI response text
 */
function extractSection(text: string, sectionName: string, nextSection?: string): string {
  const sectionRegex = new RegExp(`${sectionName}[:\\s]+(.*?)${nextSection ? `(?=${nextSection})` : '$'}`, 'is');
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : '';
}

/**
 * Extract list items from the AI response text
 */
function extractListItems(text: string, sectionName: string, nextSection?: string): string[] {
  const section = extractSection(text, sectionName, nextSection);
  if (!section) return [];
  
  // Try to extract numbered or bulleted list items
  const listItemRegex = /(?:^|\n)(?:\d+\.|\*|\-)\s*(.+?)(?=(?:\n(?:\d+\.|\*|\-|$))|\n\n|$)/g;
  const matches = [...section.matchAll(listItemRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim());
  } else {
    // Fallback: split by newlines
    return section.split('\n').filter(line => line.trim().length > 0);
  }
}

/**
 * Create fallback insights if AI generation fails
 */
function createFallbackInsights(scenario: any, results: any) {
  const metrics = extractKeyMetrics(results);
  
  return {
    insights: `Scenario "${scenario.name}" analysis based on travel model results. This scenario examines impacts from ${scenario.base_year} to ${scenario.horizon_years[0]}.`,
    key_findings: [
      `Congestion: Volume-to-capacity ratio of ${metrics.congestion.average_vtc}`,
      `Emissions: Generated ${metrics.emissions.co2_tonnes} tonnes of CO2`,
      `Safety: Estimated ${metrics.safety.total_crashes} crashes, with ${metrics.safety.fatalities} fatalities`
    ],
    recommendations: [
      'Consider reviewing areas with high congestion for potential improvements',
      'Evaluate policies to reduce emissions in high-impact corridors',
      'Focus safety improvements on areas with high crash rates'
    ]
  };
} 