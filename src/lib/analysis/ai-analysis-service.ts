/**
 * AI Analysis Service
 * 
 * Central service for handling AI-powered project analysis operations
 * Integrates with Model Context Protocol (MCP) servers and OpenAI Agents SDK
 */

import { AgentType, runAgentQuery } from '@/lib/agents-service';
import { getProjectDemographicContext, generateDemographicsSummary } from '@/lib/census/census-service';
import { getProjectCollisionData, generateCollisionSummary } from '@/lib/traffic/safety-service';
import { CollisionData, DemographicData, Project, ProjectScoreCategory, ScenarioAnalysis } from '@/types/project.d';

// Analysis types for different kinds of project evaluations
export enum AnalysisType {
  GENERAL = 'general',
  EQUITY = 'equity',
  SAFETY = 'safety',
  COST_BENEFIT = 'cost-benefit',
  ENVIRONMENTAL = 'environmental',
  ACCESSIBILITY = 'accessibility',
  SCENARIO = 'scenario',
}

// Context structure for AI analysis
export interface AnalysisContext {
  project: Project | Partial<Project>;
  comparisonProjects?: (Project | Partial<Project>)[];
  demographicData?: DemographicData;
  collisionData?: CollisionData;
  existingAnalysis?: AnalysisResult;
  analysisType: AnalysisType;
  options?: AnalysisOptions;
}

// Options for analysis
export interface AnalysisOptions {
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  focusAreas?: string[];
  constraints?: Record<string, any>;
  customPrompt?: string;
  maxTokens?: number;
  includeDiagrams?: boolean;
}

// Results from AI analysis
export interface AnalysisResult {
  id?: string;
  projectId?: string;
  analysisType: AnalysisType;
  summary: string;
  insights: string[];
  recommendations: string[];
  warnings?: string[];
  scores?: Record<ProjectScoreCategory, number>;
  rawResponse?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * Generate a prompt for the AI based on analysis type and context
 * @param context The analysis context
 * @returns Prompt string for the AI
 */
function generatePrompt(context: AnalysisContext): string {
  const { project, analysisType, options } = context;
  const detailLevel = options?.detailLevel || 'detailed';
  
  // Base project information
  let prompt = `Analyze the following transportation project:\n\n`;
  prompt += `Project: ${project.name || 'Unnamed Project'}\n`;
  prompt += `Description: ${project.description || 'No description provided'}\n`;
  prompt += `Location: ${project.location || 'No location provided'}\n`;
  prompt += `Type: ${project.type || 'No type provided'}\n`;
  prompt += `Status: ${project.status || 'No status provided'}\n`;
  prompt += `Estimated Budget: ${project.budget ? '$' + project.budget.toLocaleString() : 'Not specified'}\n\n`;
  
  // Add demographic data if available
  if (context.demographicData) {
    prompt += `Demographic Context:\n${generateDemographicsSummary(context.demographicData)}\n\n`;
  }
  
  // Add collision data if available
  if (context.collisionData) {
    prompt += `Safety Context:\n${generateCollisionSummary(context.collisionData)}\n\n`;
  }
  
  // Add comparison projects if available
  if (context.comparisonProjects?.length) {
    prompt += `Comparison Projects:\n`;
    context.comparisonProjects.forEach((cp, i) => {
      prompt += `${i+1}. ${cp.name || 'Unnamed Project'} (${cp.type || 'No type'}) - ${cp.status || 'No status'}\n`;
      prompt += `   Description: ${cp.description || 'No description'}\n`;
      prompt += `   Budget: ${cp.budget ? '$' + cp.budget.toLocaleString() : 'Not specified'}\n`;
    });
    prompt += `\n`;
  }
  
  // Analysis-specific instructions
  switch (analysisType) {
    case AnalysisType.GENERAL:
      prompt += `Perform a general analysis of this transportation project. Consider its benefits, challenges, and overall impact on the community.`;
      if (detailLevel === 'comprehensive') {
        prompt += ` Include detailed evaluation of feasibility, stakeholder considerations, and potential timeline impacts.`;
      }
      break;
      
    case AnalysisType.EQUITY:
      prompt += `Analyze this project from an equity perspective. Consider its impacts on disadvantaged communities, accessibility improvements, and potential for addressing transportation inequities.`;
      if (context.demographicData) {
        prompt += ` Consider the demographic data provided and specifically address how this project will impact minority, low-income, and other vulnerable populations.`;
      }
      break;
      
    case AnalysisType.SAFETY:
      prompt += `Analyze the safety implications of this transportation project. Consider how it might address existing safety issues and any potential new safety concerns it might introduce.`;
      if (context.collisionData) {
        prompt += ` Consider the collision data provided and specifically address how this project might improve safety at high-crash locations.`;
      }
      break;
      
    case AnalysisType.COST_BENEFIT:
      prompt += `Perform a cost-benefit analysis of this transportation project. Consider both quantitative financial aspects and qualitative benefits to the community.`;
      if (detailLevel === 'comprehensive') {
        prompt += ` Include lifecycle cost considerations, maintenance requirements, and long-term economic impacts.`;
      }
      break;
      
    case AnalysisType.ENVIRONMENTAL:
      prompt += `Analyze the environmental impacts of this transportation project. Consider air quality, greenhouse gas emissions, noise, habitat impacts, and sustainability aspects.`;
      break;
      
    case AnalysisType.ACCESSIBILITY:
      prompt += `Analyze how this project improves or affects accessibility. Consider impacts on different transportation modes, ADA compliance, and connectivity to key destinations.`;
      break;
      
    case AnalysisType.SCENARIO:
      prompt += `Generate alternative scenarios or variations for this project that might better achieve its goals or address specific challenges.`;
      if (options?.focusAreas?.length) {
        prompt += ` Focus particularly on: ${options.focusAreas.join(', ')}.`;
      }
      break;
  }
  
  // Add detail level instructions
  if (detailLevel === 'basic') {
    prompt += `\n\nProvide a concise analysis with a brief summary, 2-3 key insights, and 2-3 recommendations.`;
  } else if (detailLevel === 'detailed') {
    prompt += `\n\nProvide a thorough analysis with a summary, 4-6 key insights, and 3-5 detailed recommendations.`;
  } else if (detailLevel === 'comprehensive') {
    prompt += `\n\nProvide a comprehensive analysis with an executive summary, 6-10 detailed insights, 5-8 actionable recommendations, and note any potential warnings or risks.`;
  }
  
  // Add custom prompt if provided
  if (options?.customPrompt) {
    prompt += `\n\nAdditional Instructions: ${options.customPrompt}`;
  }
  
  // Format requirements
  prompt += `\n\nFormat your response as follows:
SUMMARY:
[A comprehensive summary of your analysis]

INSIGHTS:
- [Key insight 1]
- [Key insight 2]
...

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
...`;

  if (detailLevel === 'comprehensive') {
    prompt += `\n\nWARNINGS:
- [Warning or risk 1, if any]
- [Warning or risk 2, if any]
...`;
  }
  
  if (analysisType === AnalysisType.SCENARIO) {
    prompt += `\n\nSCENARIOS:
1. [First alternative scenario name]
   Description: [Description]
   Timeline: [Estimated timeline]
   Cost: [Estimated cost]
   Benefits: [Key benefits]
   Drawbacks: [Key drawbacks]
   Feasibility: [Feasibility score 1-10]

2. [Second alternative scenario name]
   ...
`;
  }
  
  return prompt;
}

/**
 * Parse the AI response into a structured analysis result
 * @param response The raw response from the AI
 * @param analysisType The type of analysis performed
 * @returns Structured analysis result
 */
function parseResponse(response: string, analysisType: AnalysisType): AnalysisResult {
  // Default structure
  const result: AnalysisResult = {
    analysisType,
    summary: '',
    insights: [],
    recommendations: [],
    warnings: [],
    rawResponse: response
  };
  
  // Extract summary
  const summaryMatch = response.match(/SUMMARY:([\s\S]*?)(?=INSIGHTS:|$)/i);
  if (summaryMatch && summaryMatch[1]) {
    result.summary = summaryMatch[1].trim();
  }
  
  // Extract insights
  const insightsMatch = response.match(/INSIGHTS:([\s\S]*?)(?=RECOMMENDATIONS:|WARNINGS:|SCENARIOS:|$)/i);
  if (insightsMatch && insightsMatch[1]) {
    result.insights = insightsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean);
  }
  
  // Extract recommendations
  const recommendationsMatch = response.match(/RECOMMENDATIONS:([\s\S]*?)(?=WARNINGS:|SCENARIOS:|$)/i);
  if (recommendationsMatch && recommendationsMatch[1]) {
    result.recommendations = recommendationsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean);
  }
  
  // Extract warnings if present
  const warningsMatch = response.match(/WARNINGS:([\s\S]*?)(?=SCENARIOS:|$)/i);
  if (warningsMatch && warningsMatch[1]) {
    result.warnings = warningsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean);
  }
  
  // Extract scenarios if it's a scenario analysis
  if (analysisType === AnalysisType.SCENARIO) {
    const scenariosMatch = response.match(/SCENARIOS:([\s\S]*?)$/i);
    if (scenariosMatch && scenariosMatch[1]) {
      // This would be handled by a separate parser for scenarios
      // The scenarios would then be returned as part of the result
    }
  }
  
  return result;
}

/**
 * Parse scenarios from AI response
 * @param response The raw response from the AI
 * @returns Array of scenario objects
 */
function parseScenarios(response: string): ScenarioAnalysis[] {
  const scenarios: ScenarioAnalysis[] = [];
  const scenariosMatch = response.match(/SCENARIOS:([\s\S]*?)$/i);
  
  if (!scenariosMatch || !scenariosMatch[1]) {
    return scenarios;
  }
  
  const scenariosText = scenariosMatch[1].trim();
  
  // Regular expression to find scenarios with numbered indicators
  const scenarioRegex = /(\d+)\.\s+([^\n]+)\s+Description:\s+([^]*?)(?=\s+Timeline:)\s+Timeline:\s+([^]*?)(?=\s+Cost:)\s+Cost:\s+([^]*?)(?=\s+Benefits:)\s+Benefits:\s+([^]*?)(?=\s+Drawbacks:)\s+Drawbacks:\s+([^]*?)(?=\s+Feasibility:)\s+Feasibility:\s+([^]*?)(?=\d+\.|$)/gi;
  
  let match;
  while ((match = scenarioRegex.exec(scenariosText)) !== null) {
    // Extract benefits and drawbacks as arrays
    const benefitsText = match[6].trim();
    const drawbacksText = match[7].trim();
    
    const benefits = benefitsText
      .split('\n')
      .map(line => line.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean);
      
    const drawbacks = drawbacksText
      .split('\n')
      .map(line => line.replace(/^[*-]\s*/, '').trim())
      .filter(Boolean);
    
    // Extract and clean up cost and feasibility
    let cost: number | undefined;
    const costText = match[5].trim();
    const costMatch = costText.match(/\$?([\d,]+)/);
    if (costMatch) {
      cost = parseFloat(costMatch[1].replace(/,/g, ''));
    }
    
    let feasibility: number | undefined;
    const feasibilityText = match[8].trim();
    const feasibilityMatch = feasibilityText.match(/(\d+(?:\.\d+)?)/);
    if (feasibilityMatch) {
      feasibility = parseFloat(feasibilityMatch[1]);
    }
    
    scenarios.push({
      id: `scenario-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: match[2].trim(),
      description: match[3].trim(),
      timeline: match[4].trim(),
      cost,
      benefits,
      drawbacks,
      feasibility,
      createdAt: new Date().toISOString()
    });
  }
  
  return scenarios;
}

/**
 * Run an AI analysis on a project
 * @param project The project to analyze
 * @param analysisType The type of analysis to perform
 * @param options Analysis options
 * @returns Analysis result
 */
export async function analyzeProject(
  project: Project | Partial<Project>,
  analysisType: AnalysisType = AnalysisType.GENERAL,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  // Initialize analysis context
  const context: AnalysisContext = {
    project,
    analysisType,
    options
  };
  
  // Fetch demographic data if needed for equity analysis
  if (analysisType === AnalysisType.EQUITY && project.location) {
    try {
      context.demographicData = await getProjectDemographicContext(project.location);
    } catch (error) {
      console.error('Error fetching demographic data:', error);
    }
  }
  
  // Fetch collision data if needed for safety analysis
  if (analysisType === AnalysisType.SAFETY && project.location) {
    try {
      context.collisionData = await getProjectCollisionData(project.location);
    } catch (error) {
      console.error('Error fetching collision data:', error);
    }
  }
  
  // Generate the prompt for the AI
  const prompt = generatePrompt(context);
  
  // Determine which agent type to use based on analysis type
  let agentType: AgentType;
  switch (analysisType) {
    case AnalysisType.SCENARIO:
      agentType = AgentType.PLANNING;
      break;
    case AnalysisType.COST_BENEFIT:
      agentType = AgentType.ANALYSIS;
      break;
    case AnalysisType.ENVIRONMENTAL:
      agentType = AgentType.ANALYSIS;
      break;
    default:
      agentType = AgentType.ANALYSIS;
  }
  
  // Run the query using the agent
  const response = await runAgentQuery({
    prompt,
    agentType,
    maxTokens: options.maxTokens || 2000,
  });
  
  // Parse the response
  const result = parseResponse(response, analysisType);
  
  // For scenario analysis, parse scenarios
  if (analysisType === AnalysisType.SCENARIO) {
    const scenarios = parseScenarios(response);
    // In a real implementation, we would store these scenarios in the project
    console.log(`Generated ${scenarios.length} scenarios for project ${project.id || 'unknown'}`);
  }
  
  return result;
}

/**
 * Score a project using AI analysis
 * @param project The project to score
 * @param categories Optional array of score categories to calculate
 * @returns Object with scores for each category and overall
 */
export async function scoreProject(
  project: Project | Partial<Project>,
  categories: ProjectScoreCategory[] = Object.values(ProjectScoreCategory)
): Promise<Record<ProjectScoreCategory, number>> {
  // Default scores object
  const scores: Record<ProjectScoreCategory, number> = {
    [ProjectScoreCategory.SAFETY]: 0,
    [ProjectScoreCategory.EQUITY]: 0,
    [ProjectScoreCategory.ENVIRONMENTAL]: 0,
    [ProjectScoreCategory.ECONOMIC]: 0,
    [ProjectScoreCategory.FEASIBILITY]: 0,
    [ProjectScoreCategory.OVERALL]: 0
  };
  
  // Generate specific prompts for scoring
  const scoringPrompt = `
Score the following transportation project on a scale of 0-100:

Project: ${project.name || 'Unnamed Project'}
Description: ${project.description || 'No description provided'}
Location: ${project.location || 'No location provided'}
Type: ${project.type || 'No type provided'}
Status: ${project.status || 'No status provided'}
Budget: ${project.budget ? '$' + project.budget.toLocaleString() : 'Not specified'}

Score the project on these categories: ${categories.join(', ')}

Provide your scores in the following format:
SCORES:
Category1: score
Category2: score
...
OVERALL: score

Briefly explain each score you give.
`;

  // Run the query using the analysis agent
  const response = await runAgentQuery({
    prompt: scoringPrompt,
    agentType: AgentType.ANALYSIS,
    maxTokens: 1500,
  });
  
  // Parse scores from response
  const scoreMatch = response.match(/SCORES:([\s\S]*?)(?=\s*$)/i);
  if (scoreMatch && scoreMatch[1]) {
    const scoreLines = scoreMatch[1].trim().split('\n');
    
    for (const line of scoreLines) {
      // Look for category: score pattern
      const scoreParts = line.match(/([A-Za-z_]+):\s*(\d+)/i);
      if (scoreParts) {
        const category = scoreParts[1].trim().toLowerCase();
        const score = parseInt(scoreParts[2].trim(), 10);
        
        // Map to our enum categories
        for (const enumCategory of Object.values(ProjectScoreCategory)) {
          if (category.includes(enumCategory.toLowerCase())) {
            scores[enumCategory] = score;
            break;
          }
        }
        
        // Handle overall score specifically
        if (category.toLowerCase() === 'overall') {
          scores[ProjectScoreCategory.OVERALL] = score;
        }
      }
    }
  }
  
  // If no overall score was provided, calculate average
  if (scores[ProjectScoreCategory.OVERALL] === 0) {
    const categoryScores = categories
      .filter(cat => cat !== ProjectScoreCategory.OVERALL)
      .map(cat => scores[cat]);
    
    if (categoryScores.length > 0) {
      const sum = categoryScores.reduce((acc, score) => acc + score, 0);
      scores[ProjectScoreCategory.OVERALL] = Math.round(sum / categoryScores.length);
    }
  }
  
  return scores;
}

/**
 * Compare multiple projects using AI analysis
 * @param projects Array of projects to compare
 * @param options Comparison options
 * @returns Analysis result with comparison insights
 */
export async function compareProjects(
  projects: (Project | Partial<Project>)[],
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  if (projects.length < 2) {
    throw new Error('At least two projects are required for comparison');
  }
  
  // Format projects for the prompt
  let projectsText = '';
  projects.forEach((project, i) => {
    projectsText += `Project ${i+1}: ${project.name}\n`;
    projectsText += `Description: ${project.description || 'No description provided'}\n`;
    projectsText += `Location: ${project.location || 'No location provided'}\n`;
    projectsText += `Type: ${project.type || 'No type provided'}\n`;
    projectsText += `Status: ${project.status || 'No status provided'}\n`;
    projectsText += `Budget: ${project.budget ? '$' + project.budget.toLocaleString() : 'Not specified'}\n\n`;
  });
  
  // Generate comparison prompt
  const comparisonPrompt = `
Compare the following transportation projects:

${projectsText}

Compare these projects in terms of their relative merits, impacts, costs, benefits, and potential challenges. Consider which projects might be prioritized over others and why.

Format your response as follows:
SUMMARY:
[A comprehensive summary of your comparison]

COMPARISON INSIGHTS:
- [Key insight 1]
- [Key insight 2]
...

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
...

PRIORITIZATION:
[Explain how these projects should be prioritized and why]
`;

  // Run the query using the planning agent
  const response = await runAgentQuery({
    prompt: comparisonPrompt,
    agentType: AgentType.PLANNING,
    maxTokens: options.maxTokens || 2500,
  });
  
  // Parse response
  const result = parseResponse(response, AnalysisType.GENERAL);
  
  return result;
}

/**
 * Generate alternative scenarios for a project
 * @param project The project to generate scenarios for
 * @param options Scenario generation options
 * @returns Array of generated scenarios
 */
export async function generateScenarios(
  project: Project | Partial<Project>,
  options: AnalysisOptions = {}
): Promise<ScenarioAnalysis[]> {
  // Run the analysis with scenario type
  const result = await analyzeProject(project, AnalysisType.SCENARIO, options);
  
  // Parse the scenarios from the response
  return parseScenarios(result.rawResponse || '');
} 