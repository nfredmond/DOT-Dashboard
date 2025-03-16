# Model Context Protocol (MCP) and Agents SDK Integration

This document provides detailed information about the integration between Model Context Protocol (MCP) servers and the OpenAI Agents SDK in the Planning Manager application.

## Overview

The Planning Manager application now supports using either MCP servers or the OpenAI Agents SDK for AI-powered agent functionality. This integration allows for:

1. **Provider flexibility**: Use either OpenAI's Agents or any MCP-compatible server
2. **Capability detection**: Automatically detect available capabilities and route requests appropriately
3. **Priority configuration**: Control whether to prefer MCP servers or OpenAI when both are available
4. **Unified API**: Use a single API for all agent interactions regardless of backend provider

## Architecture

The integration follows this high-level architecture:

```
┌────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│                │     │                     │     │                   │
│  Application   │────▶│  AI Analysis        │────▶│  Agents Service   │
│  Features      │     │  Service            │     │                   │
│                │     │                     │     │                   │
└────────────────┘     └─────────────────────┘     └─────────┬─────────┘
                                                             │
                                                             ▼
                              ┌────────────────┐     ┌───────────────────┐
                              │                │     │                   │
                              │  MCP Agents    │◀───▶│  OpenAI Agents    │
                              │  Utils         │     │  SDK              │
                              │                │     │                   │
                              └───────┬────────┘     └───────────────────┘
                                      │
                                      ▼
                              ┌────────────────┐
                              │                │
                              │  MCP Service   │
                              │                │
                              └────────────────┘
```

## Key Components

### 1. Agents Service (`agents-service.ts`)

Central service that provides the main entry point for agent functionality:

- `runAgentQuery()`: Main function that determines whether to use MCP or OpenAI Agents
- Handles agent type selection (Analysis, Planning, Browser, Computer)
- Provides consistent response format regardless of backend provider

### 2. MCP Agents Utils (`mcp-agents-utils.ts`)

Utility functions for MCP and Agents SDK integration:

- Capability detection and matching
- Provider selection logic
- Format conversion between MCP and Agents SDK
- System prompts for different agent types

### 3. MCP Service (`mcp-service.ts`)

Low-level service for interacting with MCP servers:

- Server configuration management
- API communication
- Capability definitions
- Streaming support

### 4. AI Analysis Service (`ai-analysis-service.ts`)

High-level service that provides domain-specific functionality:

- Project analysis functions
- Score generation
- Scenario development
- Comparative analysis
- Domain-specific prompts

## Agent Types and Capabilities

The integration supports these agent types:

| Agent Type | Description | MCP Capability | OpenAI Agent |
|------------|-------------|----------------|--------------|
| ANALYSIS   | Project analysis and evaluation | `analysis` | Custom Agent |
| PLANNING   | Project planning and scenario development | `planning` | Custom Agent |
| BROWSER    | Web browsing for research | `web_browse` | Browser Agent |
| COMPUTER   | Code/data interpretation and analysis | `code_interpreter` | Computer Agent |

## Configuration Options

### MCP Server Configuration

MCP servers can be configured with these parameters:

```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  isActive: boolean;
  capabilities: MCPCapability[];
  models?: string[];
  maxTokens?: number;
}
```

### Environment Variables

The integration uses these environment variables:

- `OPENAI_API_KEY`: API key for OpenAI Agents SDK
- `MCP_API_KEY`: Default API key for MCP servers (if not specified in server config)
- `PREFER_MCP_OVER_OPENAI`: Whether to prefer MCP servers when both are available

## Usage Examples

### Basic Agent Query

```typescript
import { runAgentQuery, AgentType } from '@/lib/agents-service';

// Run a query with automatic backend selection
const result = await runAgentQuery({
  prompt: "Analyze the environmental impact of widening Highway 101 in San Francisco",
  agentType: AgentType.ANALYSIS
});

console.log(result); // Response from either MCP or OpenAI agent
```

### Project Analysis

```typescript
import { analyzeProject, AnalysisType } from '@/lib/analysis/ai-analysis-service';

// Analyze a project
const analysis = await analyzeProject(
  project,
  AnalysisType.ENVIRONMENTAL,
  { detailLevel: 'comprehensive' }
);

console.log(analysis.summary);
console.log(analysis.insights);
console.log(analysis.recommendations);
```

### Project Scoring

```typescript
import { scoreProject, ProjectScoreCategory } from '@/lib/analysis/ai-analysis-service';

// Score a project on specific categories
const scores = await scoreProject(project, [
  ProjectScoreCategory.SAFETY,
  ProjectScoreCategory.EQUITY,
  ProjectScoreCategory.ENVIRONMENTAL
]);

console.log(scores); // { safety: 85, equity: 72, environmental: 90, overall: 82 }
```

## Advanced Features

### Streaming Support

Both MCP and OpenAI Agents SDK support streaming responses:

```typescript
const result = await runAgentQuery({
  prompt: "Generate a project description for a new bike lane on Market Street",
  agentType: AgentType.PLANNING,
  streamHandler: (event) => {
    if (event.type === 'token' && event.delta) {
      process.stdout.write(event.delta); // Stream tokens as they arrive
    }
  }
});
```

### Custom Tools

You can provide custom tools for either backend:

```typescript
const result = await runAgentQuery({
  prompt: "Analyze traffic patterns in downtown",
  agentType: AgentType.ANALYSIS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'traffic_data',
        description: 'Get traffic data for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to get traffic data for'
            }
          },
          required: ['location']
        }
      }
    }
  ]
});
```

## Fallback Behavior

The integration provides smart fallback behavior:

1. If the preferred provider is unavailable, it will automatically try the alternative
2. If a specific capability is missing, it will use the best available option
3. If no AI capabilities are available, it will return appropriate error messages

## Implementation Details

### Provider Selection Logic

The decision logic for choosing between MCP and OpenAI:

```typescript
// Simplified pseudocode
function chooseProvider(agentType) {
  const preferMCP = getPreference();
  const hasMCP = checkMCPCapability(agentType);
  const hasOpenAI = checkOpenAIKey();
  
  if (preferMCP && hasMCP) return 'MCP';
  if (hasMCP && !hasOpenAI) return 'MCP';
  if (hasOpenAI) return 'OpenAI';
  
  throw new Error('No provider available');
}
```

### Format Conversion

The integration handles format conversions between MCP and Agents SDK:

- Tool definitions are converted between formats
- Responses are normalized to a consistent format
- Streaming events are mapped between different streaming APIs

## Troubleshooting

Common issues and solutions:

- **No provider available**: Check that either an OpenAI API key is configured or at least one MCP server is active
- **Missing capability**: Ensure the MCP server has the required capability for the agent type
- **Authentication errors**: Verify API keys for both OpenAI and MCP servers
- **Inconsistent responses**: Check that the MCP server implements the required response format

## Future Enhancements

Planned enhancements for the integration:

1. **Multi-provider routing**: Route different parts of a request to different providers based on capability
2. **Performance tracking**: Track and compare performance between providers
3. **Cost optimization**: Choose providers based on cost and performance trade-offs
4. **Custom agent types**: Allow defining additional specialized agent types

## References

- [OpenAI Agents SDK Documentation](https://platform.openai.com/docs/guides/agents)
- [Model Context Protocol Specification](https://github.com/microsoft/model-context-protocol)
- [Planning Manager API Documentation](./API.md) 