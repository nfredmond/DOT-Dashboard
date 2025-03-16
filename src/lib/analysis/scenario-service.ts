/**
 * Scenario Service - Provides functionality to generate and analyze alternative scenarios for projects
 * using AI agents with support for both MCP and OpenAI Agents SDK.
 */

import { runAgentQuery, AgentType } from '@/lib/agents-service';
import { Project } from '@/types/project';
import { getCensusDataForLocation } from '@/lib/census/census-service';
import { getCollisionDataForLocation } from '@/lib/traffic/safety-service';

export enum ScenarioGenerationType {
  COST_ALTERNATIVES = 'cost_alternatives',
  TIMELINE_ALTERNATIVES = 'timeline_alternatives',
  DESIGN_ALTERNATIVES = 'design_alternatives',
  FUNDING_ALTERNATIVES = 'funding_alternatives',
  PHASING_ALTERNATIVES = 'phasing_alternatives',
  COMPREHENSIVE = 'comprehensive',
}

export interface ScenarioOptions {
  count?: number;
  constraintBudget?: number;
  constraintTimeline?: string;
  preferredOutcomes?: string[];
  includeAnalysis?: boolean;
  detailLevel?: 'brief' | 'standard' | 'comprehensive';
}

export interface GeneratedScenario {
  id?: string;
  name: string;
  description: string;
  timeline: string;
  cost: number;
  benefits: string[];
  drawbacks: string[];
  feasibility: number;
  impact?: {
    environmental?: number;
    economic?: number;
    social?: number;
    transportation?: number;
  };
  analysis?: string;
}

export interface ScenarioGenerationResult {
  scenarios: GeneratedScenario[];
  summary?: string;
  recommendation?: string;
}

/**
 * Generates alternative scenarios for a project using AI
 * @param project The project to generate scenarios for
 * @param type The type of scenario alternatives to generate
 * @param options Options for scenario generation
 * @returns A list of generated scenarios with analysis
 */
export async function generateScenarios(
  project: Project,
  type: ScenarioGenerationType,
  options: ScenarioOptions = {}
): Promise<ScenarioGenerationResult> {
  const prompt = generatePrompt(project, type, options);
  
  // Get contextual data if needed for comprehensive analysis
  let demographicData = null;
  let collisionData = null;
  
  if (options.detailLevel === 'comprehensive' && project.location) {
    try {
      demographicData = await getCensusDataForLocation(project.location);
      collisionData = await getCollisionDataForLocation(project.location);
    } catch (error) {
      console.error("Error fetching contextual data for scenario generation:", error);
    }
  }
  
  // Build system message with instructions for the AI agent
  const systemPrompt = `You are an expert transportation planner and project manager specializing in ${project.category || 'transportation'} projects. 
Your task is to generate realistic alternative scenarios for the provided project based on the specified type (${type}).
Each scenario should be detailed, feasible, and provide meaningful alternatives to the current project plan.`;

  try {
    const result = await runAgentQuery({
      prompt,
      systemPrompt,
      agentType: AgentType.PLANNING,
      additionalContext: {
        project,
        demographicData,
        collisionData,
        scenarioType: type,
        options
      }
    });
    
    // Process the agent's response
    try {
      // Attempt to parse the JSON response
      return JSON.parse(result.response) as ScenarioGenerationResult;
    } catch (e) {
      // If parsing fails, attempt to extract JSON from the text response
      const jsonMatch = result.response.match(/```json\n([\s\S]*?)\n```/) || 
                        result.response.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]) as ScenarioGenerationResult;
        } catch (innerError) {
          console.error("Error parsing JSON from agent response:", innerError);
        }
      }
      
      // Fallback: Return a basic structure with the raw response
      return {
        scenarios: [{
          name: "AI-Generated Scenario",
          description: result.response,
          timeline: "Not specified",
          cost: 0,
          benefits: [],
          drawbacks: [],
          feasibility: 0.5
        }],
        summary: "Response couldn't be parsed into the expected format."
      };
    }
  } catch (error) {
    console.error("Error generating scenarios:", error);
    throw new Error(`Failed to generate scenarios: ${error.message}`);
  }
}

/**
 * Compares two scenarios to determine which is better based on project goals
 * @param project The base project
 * @param scenario1 First scenario to compare
 * @param scenario2 Second scenario to compare
 * @returns Analysis of the comparison with recommendation
 */
export async function compareScenarios(
  project: Project,
  scenario1: GeneratedScenario,
  scenario2: GeneratedScenario
): Promise<{ comparison: string; recommendation: string; scores: Record<string, { scenario1: number; scenario2: number }> }> {
  const prompt = `Compare these two alternative scenarios for the ${project.name || 'project'} and determine which better achieves the project goals:
  
Scenario 1: "${scenario1.name}"
${scenario1.description}
Timeline: ${scenario1.timeline}
Cost: $${scenario1.cost.toLocaleString()}
Benefits: ${scenario1.benefits.join(", ")}
Drawbacks: ${scenario1.drawbacks.join(", ")}

Scenario 2: "${scenario2.name}"
${scenario2.description}
Timeline: ${scenario2.timeline}
Cost: $${scenario2.cost.toLocaleString()}
Benefits: ${scenario2.benefits.join(", ")}
Drawbacks: ${scenario2.drawbacks.join(", ")}

Project Description: ${project.description || 'Not provided'}
Project Category: ${project.category || 'Not specified'}
Project Budget: ${project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}

Provide a detailed comparison across multiple factors including cost-effectiveness, timeline feasibility, environmental impact, social benefits, and alignment with project goals.
Then provide a clear recommendation for which scenario is superior overall.
Finally, include a scoring table comparing the two scenarios across relevant metrics on a scale of 1-10.`;

  try {
    const result = await runAgentQuery({
      prompt,
      agentType: AgentType.PLANNING,
      additionalContext: { project, scenario1, scenario2 }
    });
    
    // Extract comparison, recommendation, and scores from the response
    let comparison = result.response;
    let recommendation = '';
    let scores = {};
    
    // Try to extract the recommendation section
    const recommendationMatch = comparison.match(/recommendation:?(.*?)(?:\n\n|\n*$)/is);
    if (recommendationMatch) {
      recommendation = recommendationMatch[1].trim();
      // Remove the recommendation section from the comparison
      comparison = comparison.replace(recommendationMatch[0], '');
    }
    
    // Try to extract scores if they're in a table or JSON format
    const scoresMatch = comparison.match(/scores?:?(.*?)(?:\n\n|\n*$)/is) || 
                       comparison.match(/comparison table:?(.*?)(?:\n\n|\n*$)/is);
    
    if (scoresMatch) {
      // Simple parsing of tabular data - could be enhanced
      const scoresText = scoresMatch[1];
      const metrics = ['cost', 'timeline', 'environmental', 'social', 'feasibility', 'overall'];
      
      metrics.forEach(metric => {
        const metricMatch = scoresText.match(new RegExp(`${metric}[^\\d]*(\\d+)[^\\d]*(\\d+)`, 'i'));
        if (metricMatch) {
          scores[metric] = {
            scenario1: parseInt(metricMatch[1], 10),
            scenario2: parseInt(metricMatch[2], 10)
          };
        }
      });
    }
    
    return {
      comparison,
      recommendation,
      scores
    };
  } catch (error) {
    console.error("Error comparing scenarios:", error);
    throw new Error(`Failed to compare scenarios: ${error.message}`);
  }
}

/**
 * Generates the prompt for scenario generation based on project details and options
 */
function generatePrompt(
  project: Project,
  type: ScenarioGenerationType,
  options: ScenarioOptions
): string {
  const { count = 3, detailLevel = 'standard', includeAnalysis = true } = options;
  
  let typeSpecificInstructions = '';
  
  switch (type) {
    case ScenarioGenerationType.COST_ALTERNATIVES:
      typeSpecificInstructions = `Generate ${count} alternative scenarios that achieve similar goals but with different cost structures. 
If the project has a budget of ${project.budget ? `$${project.budget.toLocaleString()}` : 'unspecified amount'}, include at least one scenario that reduces costs by 15-25%.`;
      break;
      
    case ScenarioGenerationType.TIMELINE_ALTERNATIVES:
      typeSpecificInstructions = `Generate ${count} alternative scenarios with different timeline approaches. 
Include options for accelerated delivery, phased implementation, and longer timeline with reduced annual costs.`;
      break;
      
    case ScenarioGenerationType.DESIGN_ALTERNATIVES:
      typeSpecificInstructions = `Generate ${count} alternative design approaches for this ${project.category || 'transportation'} project. 
Consider different technologies, layouts, or methodologies that could achieve similar outcomes.`;
      break;
      
    case ScenarioGenerationType.FUNDING_ALTERNATIVES:
      typeSpecificInstructions = `Generate ${count} alternative funding approaches for this project. 
Consider different funding sources (federal, state, local, private), financing mechanisms, and public-private partnerships.`;
      break;
      
    case ScenarioGenerationType.PHASING_ALTERNATIVES:
      typeSpecificInstructions = `Generate ${count} alternative phasing strategies for project implementation. 
Show how the project could be divided into phases that provide incremental benefits while managing costs and resources.`;
      break;
      
    case ScenarioGenerationType.COMPREHENSIVE:
      typeSpecificInstructions = `Generate ${count} comprehensive alternative scenarios that consider multiple aspects: 
cost structure, timeline, design approaches, funding mechanisms, and phasing strategies. 
Provide substantially different approaches that could achieve the project's core objectives.`;
      break;
  }
  
  // Detail level adjustments
  let detailInstructions = '';
  if (detailLevel === 'brief') {
    detailInstructions = 'Provide concise summaries for each scenario with key points only.';
  } else if (detailLevel === 'comprehensive') {
    detailInstructions = 'Provide very detailed scenarios with in-depth analysis of feasibility, risks, and expected outcomes.';
  }
  
  // Build the prompt
  return `Generate ${count} alternative scenarios for the following ${project.category || 'transportation'} project:

PROJECT DETAILS:
Name: ${project.name || 'Unnamed Project'}
Description: ${project.description || 'No description provided'}
Location: ${project.location || 'Location not specified'}
Type: ${project.type || 'Type not specified'}
Budget: ${project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
Timeline: ${project.startDate && project.endDate ? `${project.startDate} to ${project.endDate}` : 'Not specified'}

${typeSpecificInstructions}

${detailInstructions}

${options.constraintBudget ? `All scenarios must stay within a maximum budget of $${options.constraintBudget.toLocaleString()}.` : ''}
${options.constraintTimeline ? `All scenarios must complete within the timeframe: ${options.constraintTimeline}.` : ''}
${options.preferredOutcomes?.length ? `The scenarios should prioritize these outcomes: ${options.preferredOutcomes.join(', ')}.` : ''}

For each scenario, provide:
1. A descriptive name
2. A detailed description
3. Timeline estimation
4. Cost estimation
5. Key benefits (bullet points)
6. Potential drawbacks (bullet points)
7. Feasibility rating (0.0-1.0)
${includeAnalysis ? '8. Brief analysis of the scenario' : ''}

${detailLevel === 'comprehensive' ? 'Additionally, provide impact scores (0-10) for environmental, economic, social, and transportation metrics.' : ''}

Provide a scenario summary and recommendation at the end.
Format the response as a JSON object with a "scenarios" array and optional "summary" and "recommendation" fields.`;
}

/**
 * Refines an existing scenario based on feedback or constraints
 * @param project The base project
 * @param scenario The scenario to refine
 * @param feedback Feedback or constraints to apply in refinement
 * @returns A refined scenario
 */
export async function refineScenario(
  project: Project,
  scenario: GeneratedScenario,
  feedback: string
): Promise<GeneratedScenario> {
  const prompt = `Refine the following scenario for the ${project.name || 'project'} based on this feedback:
  
SCENARIO:
Name: ${scenario.name}
Description: ${scenario.description}
Timeline: ${scenario.timeline}
Cost: $${scenario.cost.toLocaleString()}
Benefits: ${scenario.benefits.join(", ")}
Drawbacks: ${scenario.drawbacks.join(", ")}
Feasibility: ${scenario.feasibility}

PROJECT DETAILS:
Description: ${project.description || 'Not provided'}
Category: ${project.category || 'Not specified'}
Budget: ${project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}

FEEDBACK/CONSTRAINTS TO APPLY:
${feedback}

Provide a refined version of this scenario that addresses the feedback while maintaining its core approach.
Return the result as a JSON object with the same structure as the original scenario.`;

  try {
    const result = await runAgentQuery({
      prompt,
      agentType: AgentType.PLANNING,
      additionalContext: { project, scenario, feedback }
    });
    
    // Process the agent's response
    try {
      // Attempt to parse the JSON response
      return JSON.parse(result.response) as GeneratedScenario;
    } catch (e) {
      // If parsing fails, attempt to extract JSON from the text response
      const jsonMatch = result.response.match(/```json\n([\s\S]*?)\n```/) || 
                        result.response.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]) as GeneratedScenario;
        } catch (innerError) {
          console.error("Error parsing JSON from agent response:", innerError);
        }
      }
      
      // Fallback: Return a modified version of the original scenario with the response as description
      return {
        ...scenario,
        name: `Refined: ${scenario.name}`,
        description: result.response,
      };
    }
  } catch (error) {
    console.error("Error refining scenario:", error);
    throw new Error(`Failed to refine scenario: ${error.message}`);
  }
} 