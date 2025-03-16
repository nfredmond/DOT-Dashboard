import { createClient } from '@/utils/supabase/client';
import { getProjectAreaContext } from './dataUtils';

// Define interfaces
export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  prompt_template?: string;
  additional_context?: string;
}

export interface LLMRequest {
  query: string;
  context?: string;
  project_id?: string;
  options?: LLMRequestOptions;
  project_location?: string;
  project_county?: string;
  project_state?: string;
  project_name?: string;
  project_type?: string;
}

export interface LLMResponse {
  response: string;
  model: string;
  tokens_used: number;
  feedback_id?: string;
}

// Default configuration
const DEFAULT_OPTIONS: LLMRequestOptions = {
  model: 'gpt-4o',  // Default to most capable model
  temperature: 0.7,
  max_tokens: 1000,
};

/**
 * Submit a query to the LLM API
 */
export async function submitLLMQuery(request: LLMRequest): Promise<LLMResponse> {
  try {
    // For demonstration mode, return mock data
    if (typeof window !== 'undefined' && localStorage.getItem('planning_manager_demo_user')) {
      return generateMockResponse(request);
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    
    const supabase = createClient();
    
    // Merge default options with provided options
    const options = { ...DEFAULT_OPTIONS, ...request.options };
    
    // In a production environment, this would call your backend API
    // which would handle the actual LLM API calls and logging
    const { data, error } = await supabase.functions.invoke('llm-query', {
      body: {
        query: request.query,
        context: request.context,
        project_id: request.project_id,
        project_location: request.project_location,
        project_county: request.project_county,
        project_state: request.project_state,
        project_name: request.project_name,
        project_type: request.project_type,
        options
      }
    });
    
    if (error) {
      console.error('Error calling LLM function:', error);
      throw new Error(`Failed to get response: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in LLM service:', error);
    
    // Return fallback response
    return {
      response: "I'm sorry, I couldn't process your request at this time. Please try again later.",
      model: "fallback",
      tokens_used: 0
    };
  }
}

/**
 * Submit feedback for an LLM response to improve the model
 */
export async function submitLLMFeedback(feedbackId: string, isPositive: boolean, comments?: string): Promise<void> {
  try {
    // For demonstration mode, just log to console
    if (typeof window !== 'undefined' && localStorage.getItem('planning_manager_demo_user')) {
      console.log(`Demo feedback: ${isPositive ? 'Positive' : 'Negative'} for ID ${feedbackId}`);
      if (comments) console.log(`Comments: ${comments}`);
      return;
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    
    const supabase = createClient();
    
    const { error } = await supabase.functions.invoke('llm-feedback', {
      body: {
        feedback_id: feedbackId,
        is_positive: isPositive,
        comments: comments || ''
      }
    });
    
    if (error) {
      console.error('Error submitting feedback:', error);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in feedback service:', error);
    throw error;
  }
}

/**
 * Generate context-aware prompts for different use cases
 */
export function generatePrompt(type: string, data: any): string {
  switch (type) {
    case 'project-analysis':
      return `Analyze the following transportation project and provide insights:
Project Name: ${data.name}
Project Type: ${data.category || 'Unknown'}
Description: ${data.description || 'No description provided'}
Location: ${data.location || 'Unknown'}
Budget: ${data.budget || 'Unknown'}
Status: ${data.status || 'Unknown'}

Please provide a comprehensive analysis covering:
1. Strengths and potential weaknesses
2. Environmental considerations
3. Equity implications
4. Economic impact
5. Safety considerations
6. Implementation recommendations`;
      
    case 'project-analysis-with-area-data':
      return `Analyze the following transportation project with additional area context data:
Project Name: ${data.name}
Project Type: ${data.category || 'Unknown'}
Description: ${data.description || 'No description provided'}
Location: ${data.location || 'Unknown'}
Budget: ${data.budget || 'Unknown'}
Status: ${data.status || 'Unknown'}

AREA CONTEXT DATA:
${data.areaContext || 'No area context data available'}

Please provide a comprehensive analysis covering:
1. Strengths and potential weaknesses
2. Environmental considerations
3. Equity implications (using demographic data when available)
4. Economic impact (using income/poverty data when available)
5. Safety implications (using collision data when available)
6. Implementation recommendations
7. Potential community impacts`;
      
    case 'score-justification':
      return `Provide a detailed justification for the following project score:
Project: ${data.projectName}
Criterion: ${data.criterionName} (Category: ${data.category})
Score: ${data.score}/5

Context: This is a ${data.projectType} project with status "${data.projectStatus}".
Project Description: ${data.projectDescription || 'No description provided'}

Please provide a detailed, evidence-based justification for this score that could be included in official documentation.`;
      
    case 'grant-alignment':
      return `Evaluate how well the following project aligns with grant requirements:
Project: ${data.projectName}
Project Type: ${data.projectType}
Description: ${data.description || 'No description provided'}

Grant Program: ${data.grantName}
Grant Focus Areas: ${data.grantFocusAreas.join(', ')}
Grant Requirements: ${data.grantRequirements}

Please analyze:
1. Overall alignment score (1-10)
2. Key strengths relative to grant requirements
3. Areas that could be improved to better align with grant criteria
4. Specific recommendations for the grant application`;
      
    case 'safety-analysis':
      return `Analyze the safety implications of the following transportation project:
Project: ${data.projectName}
Project Type: ${data.projectType}
Description: ${data.description || 'No description provided'}
Location: ${data.location || 'Unknown'}

COLLISION DATA SUMMARY:
${data.safetyContext || 'No safety data available'}

Please provide a detailed safety analysis including:
1. Assessment of current safety conditions in the project area
2. Potential safety impacts of the proposed project
3. Recommendations for safety enhancements
4. Countermeasures for identified collision patterns
5. Special considerations for vulnerable road users (pedestrians, bicyclists)`;
      
    case 'equity-analysis':
      return `Analyze the equity implications of the following transportation project:
Project: ${data.projectName}
Project Type: ${data.projectType}
Description: ${data.description || 'No description provided'}
Location: ${data.location || 'Unknown'}

DEMOGRAPHIC DATA SUMMARY:
${data.demographicContext || 'No demographic data available'}

Please provide a detailed equity analysis including:
1. Assessment of how the project may impact different demographic groups
2. Evaluation of potential benefits and burdens on disadvantaged communities
3. Accessibility considerations for households without vehicles
4. Recommendations for enhancing equity in project design and implementation
5. Potential strategies for inclusive community engagement`;
      
    default:
      return data.query || 'Please provide analysis';
  }
}

/**
 * Generate a mock LLM response for development/demo purposes
 */
function generateMockResponse(request: LLMRequest): LLMResponse {
  const query = request.query.toLowerCase();
  let response = '';
  
  // Generate different mock responses based on query content
  if (query.includes('analyze') || query.includes('assessment')) {
    response = `## Project Analysis
    
Based on the provided information, this appears to be a ${request.context?.includes('Highway') ? 'highway infrastructure' : 
  request.context?.includes('Transit') ? 'public transit' : 
  request.context?.includes('Active') ? 'active transportation' : 'transportation'} project.

### Key Strengths:
- Strategic location addressing identified transportation needs
- Alignment with regional transportation goals
- Potential to improve mobility and accessibility

### Considerations:
- Environmental impacts should be carefully assessed and mitigated
- Community engagement will be critical for successful implementation
- Budget constraints may require phased implementation

### Recommendations:
1. Conduct thorough environmental and equity analyses
2. Develop clear performance metrics to evaluate project success
3. Establish a robust stakeholder engagement plan
4. Consider opportunities for multimodal integration`;
  } 
  else if (query.includes('justify') || query.includes('justification')) {
    response = `## Score Justification

This score reflects the project's strong alignment with established criteria in this category. 

The project demonstrates significant potential for positive outcomes, including:

1. Improved safety conditions for all transportation users
2. Enhanced accessibility to key destinations
3. Support for economic development goals
4. Integration with existing transportation systems

These factors justify the assigned score, which reflects both quantitative and qualitative assessments of the project's merits relative to established performance criteria.`;
  }
  else if (query.includes('improve') || query.includes('enhancement')) {
    response = `## Project Enhancement Opportunities

To strengthen this project, consider the following enhancements:

1. **Multimodal Integration**: Improve connections with other transportation modes
2. **Green Infrastructure**: Incorporate sustainable design elements
3. **Technology Integration**: Explore smart transportation technologies
4. **Equity Measures**: Ensure benefits are distributed to underserved communities
5. **Public Engagement**: Expand stakeholder involvement throughout project lifecycle

These enhancements could significantly improve project outcomes and potentially increase scoring across multiple criteria.`;
  }
  else {
    response = `I've analyzed the information provided and have the following insights:

1. This project appears to be well-conceived but could benefit from additional detail in key areas.
2. Consider strengthening the documentation around specific outcomes and benefits.
3. The approach aligns with industry best practices for transportation project planning.
4. Additional data would help provide more specific recommendations.

Please feel free to provide more details if you'd like a more tailored analysis.`;
  }
  
  return {
    response,
    model: 'mock-llm-model',
    tokens_used: Math.floor(Math.random() * 1000) + 500,
    feedback_id: `mock-feedback-${Date.now()}`,
  };
}

/**
 * Enhanced version of submitLLMQuery that incorporates area data when available
 */
export async function submitEnhancedLLMQuery(request: LLMRequest): Promise<LLMResponse> {
  // Check if location data is available for enrichment
  if (request.project_location && request.project_county) {
    try {
      // Get area context data (demographic and safety)
      const areaContext = await getProjectAreaContext(
        request.project_location,
        request.project_county,
        request.project_state
      );
      
      // Extract parsed project data from context if available
      let projectData: any = {};
      if (request.context) {
        try {
          projectData = JSON.parse(request.context);
        } catch (e) {
          console.warn("Could not parse project context data as JSON");
        }
      }
      
      // Enhance project data with area context
      const enhancedData = {
        ...projectData,
        areaContext: areaContext
      };
      
      // Create enhanced request with area data
      const enhancedRequest: LLMRequest = {
        ...request,
        context: JSON.stringify(enhancedData),
        query: generatePrompt('project-analysis-with-area-data', {
          name: projectData.name || request.project_name,
          category: projectData.category || request.project_type,
          description: projectData.description,
          location: request.project_location,
          budget: projectData.budget,
          status: projectData.status,
          areaContext: areaContext
        })
      };
      
      // Submit the enhanced query
      return submitLLMQuery(enhancedRequest);
    } catch (error) {
      console.error("Error enhancing LLM query with area data:", error);
      // Fall back to standard query if enhancement fails
      return submitLLMQuery(request);
    }
  } else {
    // If no location data, use standard query
    return submitLLMQuery(request);
  }
} 