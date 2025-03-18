import { getAIClient } from '../ai-service';

/**
 * Scenario Comparison Service
 * 
 * Compares multiple scenarios and generates insights on their differences
 * and relative performance across key metrics.
 */

/**
 * Compare multiple scenarios and generate insights
 * 
 * @param scenarios Array of scenarios with their results
 * @param baselineScenario The baseline scenario for comparison
 * @returns Object containing comparison insights and metrics
 */
export async function compareScenarios(scenarios: any[], baselineScenario: any) {
  try {
    console.log(`Comparing ${scenarios.length} scenarios with baseline: ${baselineScenario.name}`);
    
    // Extract comparison metrics
    const comparisonMetrics = extractComparisonMetrics(scenarios, baselineScenario);
    
    // Get AI client for comparison analysis
    const aiClient = await getAIClient();
    
    // Prepare prompt for AI
    const prompt = createComparisonPrompt(scenarios, baselineScenario, comparisonMetrics);
    
    // Get AI response
    const response = await aiClient.complete({
      prompt,
      max_tokens: 1500,
      temperature: 0.3,
      stop: ['###']
    });
    
    // Parse AI-generated insights
    const insights = parseComparisonResponse(response);
    
    return {
      insights,
      metrics: comparisonMetrics
    };
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    
    // Return fallback comparison if AI generation fails
    return createFallbackComparison(scenarios, baselineScenario);
  }
}

/**
 * Extract metrics for scenario comparison
 */
function extractComparisonMetrics(scenarios: any[], baselineScenario: any) {
  // Define metrics to compare
  const metricsToCompare = [
    { key: 'congestion.average_vtc', label: 'Average V/C Ratio', desiredDirection: 'lower' },
    { key: 'congestion.total_delay', label: 'Total Delay (hours)', desiredDirection: 'lower' },
    { key: 'emissions.co2_tonnes', label: 'CO2 Emissions (tonnes)', desiredDirection: 'lower' },
    { key: 'emissions.nox_kg', label: 'NOx Emissions (kg)', desiredDirection: 'lower' },
    { key: 'emissions.pm_kg', label: 'PM Emissions (kg)', desiredDirection: 'lower' },
    { key: 'safety.total_crashes', label: 'Total Crashes', desiredDirection: 'lower' },
    { key: 'safety.fatalities', label: 'Fatalities', desiredDirection: 'lower' },
    { key: 'network_metrics.total_vmt', label: 'Total VMT', desiredDirection: 'lower' },
    { key: 'network_metrics.total_vht', label: 'Total VHT', desiredDirection: 'lower' },
    { key: 'network_metrics.average_speed', label: 'Average Speed', desiredDirection: 'higher' },
    { key: 'equity.equity_ratios.low_income', label: 'Low Income Equity Ratio', desiredDirection: 'higher' },
    { key: 'equity.equity_ratios.minority', label: 'Minority Equity Ratio', desiredDirection: 'higher' }
  ];
  
  // Function to safely get nested property value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : null;
    }, obj);
  };
  
  // Extract baseline values
  const baselineValues = {};
  const baselineResults = baselineScenario.scenario_results?.[0]?.results || baselineScenario.scenario_results?.[0];
  
  metricsToCompare.forEach(metric => {
    baselineValues[metric.key] = getNestedValue(baselineResults, metric.key);
  });
  
  // Extract values for each scenario and calculate differences
  const scenarioComparisons = scenarios.map(scenario => {
    const scenarioResults = scenario.scenario_results?.[0]?.results || scenario.scenario_results?.[0];
    
    // Extract metric values
    const metricValues = {};
    const differences = {};
    const percentChanges = {};
    const performanceIndications = {};
    
    metricsToCompare.forEach(metric => {
      const value = getNestedValue(scenarioResults, metric.key);
      metricValues[metric.key] = value;
      
      // Calculate difference if both values exist
      if (value !== null && baselineValues[metric.key] !== null) {
        const difference = value - baselineValues[metric.key];
        differences[metric.key] = difference;
        
        // Calculate percent change if baseline value is not zero
        if (baselineValues[metric.key] !== 0) {
          const percentChange = (difference / baselineValues[metric.key]) * 100;
          percentChanges[metric.key] = percentChange;
          
          // Determine if this is better or worse
          const isBetter = 
            (metric.desiredDirection === 'lower' && percentChange < 0) || 
            (metric.desiredDirection === 'higher' && percentChange > 0);
          
          performanceIndications[metric.key] = isBetter ? 'better' : 'worse';
        }
      }
    });
    
    return {
      id: scenario.id,
      name: scenario.name,
      values: metricValues,
      differences,
      percent_changes: percentChanges,
      performance: performanceIndications
    };
  });
  
  // Identify best and worst scenarios for each metric
  const metricRankings = {};
  
  metricsToCompare.forEach(metric => {
    // Filter scenarios that have values for this metric
    const scenariosWithValues = scenarioComparisons.filter(sc => 
      sc.values[metric.key] !== null && sc.values[metric.key] !== undefined);
    
    if (scenariosWithValues.length > 0) {
      // Sort scenarios by this metric
      const sortedScenarios = [...scenariosWithValues].sort((a, b) => {
        if (metric.desiredDirection === 'lower') {
          return a.values[metric.key] - b.values[metric.key];
        } else {
          return b.values[metric.key] - a.values[metric.key];
        }
      });
      
      metricRankings[metric.key] = {
        best: sortedScenarios[0].name,
        worst: sortedScenarios[sortedScenarios.length - 1].name
      };
    }
  });
  
  return {
    baseline: {
      id: baselineScenario.id,
      name: baselineScenario.name,
      values: baselineValues
    },
    scenarios: scenarioComparisons,
    metrics: metricsToCompare,
    rankings: metricRankings
  };
}

/**
 * Create a prompt for the AI to generate scenario comparison insights
 */
function createComparisonPrompt(scenarios: any[], baselineScenario: any, comparisonMetrics: any) {
  // Format scenario information
  const scenarioInfo = scenarios.map(s => 
    `- ${s.name}: ${s.description || 'No description provided'}`).join('\n');
  
  // Format metric comparison table
  let metricsTable = 'METRIC COMPARISON:\n';
  metricsTable += 'Metric | Baseline';
  
  // Add scenario names to header
  scenarios.forEach(s => {
    if (s.id !== baselineScenario.id) {
      metricsTable += ` | ${s.name}`;
    }
  });
  metricsTable += '\n';
  
  // Add separator row
  metricsTable += '--- | ---';
  scenarios.forEach(s => {
    if (s.id !== baselineScenario.id) {
      metricsTable += ' | ---';
    }
  });
  metricsTable += '\n';
  
  // Add metric rows
  comparisonMetrics.metrics.forEach(metric => {
    metricsTable += `${metric.label} | ${comparisonMetrics.baseline.values[metric.key] || 'N/A'}`;
    
    // Add values for each non-baseline scenario
    scenarios.forEach(s => {
      if (s.id !== baselineScenario.id) {
        const scenarioData = comparisonMetrics.scenarios.find(sc => sc.id === s.id);
        if (scenarioData) {
          const value = scenarioData.values[metric.key] || 'N/A';
          const percentChange = scenarioData.percent_changes?.[metric.key];
          
          if (percentChange !== undefined) {
            const direction = percentChange >= 0 ? '+' : '';
            metricsTable += ` | ${value} (${direction}${percentChange.toFixed(1)}%)`;
          } else {
            metricsTable += ` | ${value}`;
          }
        } else {
          metricsTable += ' | N/A';
        }
      }
    });
    metricsTable += '\n';
  });
  
  // Format performance highlights
  let performanceHighlights = 'PERFORMANCE HIGHLIGHTS:\n';
  
  Object.entries(comparisonMetrics.rankings).forEach(([metricKey, ranking]: [string, any]) => {
    const metricInfo = comparisonMetrics.metrics.find(m => m.key === metricKey);
    if (metricInfo) {
      performanceHighlights += `- ${metricInfo.label}: Best = ${ranking.best}, Worst = ${ranking.worst}\n`;
    }
  });
  
  // Build the prompt
  return `
You are an expert transportation planner comparing multiple scenario outcomes.

SCENARIOS BEING COMPARED:
Baseline: ${baselineScenario.name}
${scenarioInfo}

${metricsTable}

${performanceHighlights}

Based on the above information, provide a comprehensive comparison analysis including:
1. Overall comparison of how the scenarios perform relative to the baseline
2. Key differences between scenarios
3. Trade-offs between different metrics
4. Recommendations on which scenario might be preferable depending on priorities

Format your response with the following sections:
- Overall Comparison: High-level analysis of how scenarios compare
- Key Differences: Notable differences between scenarios
- Trade-offs: Important trade-offs observed across metrics
- Recommendations: Guidance based on different potential priorities

###
`;
}

/**
 * Parse the AI response into structured comparison insights
 */
function parseComparisonResponse(response: string): any {
  try {
    // Extract sections
    const overallComparison = extractSection(response, 'Overall Comparison', 'Key Differences');
    const keyDifferences = extractSection(response, 'Key Differences', 'Trade-offs');
    const tradeoffs = extractSection(response, 'Trade-offs', 'Recommendations');
    const recommendations = extractSection(response, 'Recommendations');
    
    return {
      overall_comparison: overallComparison,
      key_differences: keyDifferences,
      tradeoffs: tradeoffs,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error parsing AI comparison response:', error);
    
    // Return the raw response if parsing fails
    return {
      raw_insights: response
    };
  }
}

/**
 * Extract a section from the AI response text
 */
function extractSection(text: string, sectionName: string, nextSection?: string): string {
  const sectionRegex = new RegExp(`${sectionName}:?\\s+(.*?)${nextSection ? `(?=${nextSection}:?)` : '$'}`, 'is');
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : '';
}

/**
 * Create fallback comparison if AI generation fails
 */
function createFallbackComparison(scenarios: any[], baselineScenario: any) {
  const metrics = extractComparisonMetrics(scenarios, baselineScenario);
  
  // Generate basic insights
  const insights = {
    overall_comparison: `Comparing ${scenarios.length} scenarios against the baseline "${baselineScenario.name}".`,
    key_differences: `The scenarios show variations in key transportation metrics such as congestion, emissions, and safety.`,
    tradeoffs: `Different scenarios show trade-offs between congestion reduction, emissions reduction, and other transportation goals.`,
    recommendations: `Review the detailed metrics to identify which scenario best aligns with your specific priorities.`
  };
  
  return {
    insights,
    metrics
  };
} 