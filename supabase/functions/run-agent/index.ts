import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

// Interface for request payload
interface AgentRequestPayload {
  type: string;
  query: string;
  context: Record<string, any>;
  modelConfig: {
    modelName: string;
    temperature: number;
    maxTokens: number;
  };
}

// Get system prompt for agent type
function getSystemPrompt(type: string): string {
  switch (type) {
    case 'scenario_analysis':
      return `You are an expert transportation planner AI assistant that analyzes transportation scenarios.
Your goal is to provide clear, data-driven analysis of transportation planning scenarios.
You have access to scenario data including assumptions, policies, and results.
Always back your analysis with data from the scenario provided. Be specific and precise.`;

    case 'scenario_insights':
      return `You are an expert transportation planner AI assistant that generates insights from scenario results.
Focus on identifying the most important patterns, trends, and implications in the scenario results.
Organize insights by category (congestion, emissions, accessibility, equity, etc.).
Be specific, data-driven, and actionable. Highlight both positive and negative outcomes.`;

    case 'scenario_aspect_analysis':
      return `You are an expert transportation planner AI assistant that analyzes specific aspects of scenarios.
Focus exclusively on the requested aspect (e.g., emissions, congestion, accessibility).
Provide detailed analysis backed by data from the scenario. Compare to baseline if available.
Be specific, data-driven, and actionable in your analysis.`;

    case 'policy_recommendations':
      return `You are an expert transportation planner AI assistant that recommends policies.
Based on the scenario results, recommend specific policies that could improve outcomes.
For each recommendation, explain the rationale and expected impact.
Prioritize recommendations based on their potential impact and feasibility.
Be specific and actionable in your recommendations.`;

    case 'comparison':
      return `You are an expert transportation planner AI assistant that compares scenarios.
Compare the two scenarios across key metrics (congestion, emissions, accessibility, equity, etc.).
Highlight significant differences and similarities. Be specific and data-driven.
Provide a balanced assessment of the strengths and weaknesses of each scenario.
Conclude with a summary of which scenario performs better across different objectives.`;

    default:
      return `You are an expert transportation planner AI assistant.
You help transportation planners analyze scenarios, interpret results, and make recommendations.
Base your responses on the data provided. Be specific, clear, and actionable.`;
  }
}

// Format agent query for Claude or OpenAI
function formatQuery(payload: AgentRequestPayload): any {
  const { type, query, context, modelConfig } = payload;
  const systemPrompt = getSystemPrompt(type);
  
  // Check if using Claude model
  if (modelConfig.modelName.includes('claude')) {
    return {
      model: modelConfig.modelName,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: query
            },
            {
              type: 'text',
              text: `Context: ${JSON.stringify(context, null, 2)}`
            }
          ]
        }
      ]
    };
  }
  
  // Default to OpenAI format
  return {
    model: modelConfig.modelName,
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.maxTokens,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `${query}\n\nContext: ${JSON.stringify(context, null, 2)}`
      }
    ]
  };
}

// Process request with Anthropic Claude
async function processWithClaude(payload: AgentRequestPayload): Promise<any> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  
  const queryData = formatQuery(payload);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(queryData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API Error: ${JSON.stringify(error)}`);
  }
  
  const result = await response.json();
  
  return {
    result: result.content[0].text,
    usage: {
      promptTokens: result.usage.input_tokens,
      completionTokens: result.usage.output_tokens,
      totalTokens: result.usage.input_tokens + result.usage.output_tokens
    },
    created: Date.now(),
    model: payload.modelConfig.modelName
  };
}

// Process request with OpenAI
async function processWithOpenAI(payload: AgentRequestPayload): Promise<any> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
  });
  
  const openai = new OpenAIApi(configuration);
  
  const queryData = formatQuery(payload);
  
  const response = await openai.createChatCompletion(queryData);
  
  return {
    result: response.data.choices[0].message?.content,
    usage: {
      promptTokens: response.data.usage?.prompt_tokens || 0,
      completionTokens: response.data.usage?.completion_tokens || 0,
      totalTokens: response.data.usage?.total_tokens || 0
    },
    created: Date.now(),
    model: payload.modelConfig.modelName
  };
}

serve(async (req) => {
  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  
  try {
    // Get Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const payload: AgentRequestPayload = await req.json();
    const { type, query, context, modelConfig } = payload;
    
    if (!type || !query) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // Process with appropriate AI service
    let result;
    
    if (modelConfig.modelName.includes('claude')) {
      result = await processWithClaude(payload);
    } else {
      result = await processWithOpenAI(payload);
    }
    
    // Log agent query for auditing
    await supabase.from('agent_queries').insert({
      user_id: user.id,
      agent_type: type,
      query: query,
      context: context,
      result: result.result,
      model: modelConfig.modelName,
      prompt_tokens: result.usage.promptTokens,
      completion_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens
    });
    
    // Return result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing agent request:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}); 