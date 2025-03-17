# MCP and Agents SDK Integration - Planning Manager v6

## Implementation Status

**Status**: Core integration complete, extensions in progress

| Component | Status |
|-----------|--------|
| MCP Service | ✅ Complete |
| OpenAI Agents SDK Integration | ✅ Complete |
| Domain-Specific Agents | ✅ Complete |
| Advanced Query Handling | ✅ Complete |
| Browser Tool Integration | ✅ Complete |
| Computer Tool Integration | ✅ Complete |
| UI Components | ✅ Complete |
| Documentation | 🔄 In Progress |
| Enhanced MCP Server Management | 🔄 In Progress |
| Advanced Analytics Integration | 🔄 In Progress |

## Overview

The Planning Manager v6 application integrates both Model Component Package (MCP) technology and OpenAI's Agents SDK to provide powerful AI assistance across the application. This document details the technical implementation of these integrations, how they work together, and how to extend and maintain them.

## Architecture

The integration follows a layered architecture pattern:

```
┌────────────────┐     ┌─────────────────────┐     ┌─────────────┐
│                │     │                     │     │             │
│  UI Components │◀───▶│  AI Analysis Service│◀───▶│ Agents      │
│                │     │                     │     │ Service     │
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

### 1. Agents Service (`src/lib/agents-service.ts`)

Central service that provides the main entry point for agent functionality:

- `runAgentQuery()`: Main function that determines whether to use MCP or OpenAI Agents
- Handles agent type selection (Analysis, Planning, Browser, Computer)
- Provides consistent response format regardless of backend provider
- Manages streaming responses and error handling

### 2. MCP Agents Utils (`src/lib/mcp-agents-utils.ts`)

Utility functions for MCP and Agents SDK integration:

- Capability detection and matching
- Provider selection logic
- Format conversion between MCP and Agents SDK
- System prompts for different agent types
- Context preparation and user query formatting

### 3. MCP Service (`src/lib/mcp-service.ts`)

Low-level service for interacting with MCP servers:

- Server configuration management
- API communication with MCP servers
- Capability definitions and discovery
- Streaming support for real-time responses
- Authentication and request formatting

### 4. AI Analysis Service (`src/lib/ai-analysis-service.ts`)

High-level service that provides domain-specific functionality:

- Project analysis functions
- Score generation for projects against criteria
- Scenario development assistance
- Comparative analysis between project scenarios
- Domain-specific prompts tailored to transportation planning

## Database Schema Support

The MCP and Agents SDK integration is fully supported by the following database tables:

### MCP Servers Table

```sql
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  api_key TEXT,
  capabilities JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Agent Settings Table

```sql
CREATE TABLE agent_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  model_id UUID REFERENCES ai_models(id),
  settings JSONB DEFAULT '{}',
  system_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Agent Runs Table

```sql
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  duration_ms INTEGER,
  provider TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tools_used JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Agent Types

The system supports the following agent types:

1. **Analysis Agent**: Specialized for analyzing transportation project data, calculating scores, and generating insights
2. **Planning Agent**: Focused on scenario planning, project development, and prioritization strategies
3. **Browser Agent**: Enhanced with web browsing capabilities to access external information
4. **Computer Agent**: Equipped with computer interaction tools for file operations and data processing

## UI Components

The MCP and Agents SDK integration is exposed through several UI components:

1. **LLM Assistant Page**: Full-featured assistant interface at `/llm-assistant`
2. **Project Analysis Panel**: Embedded in project detail pages
3. **Scenario Development Interface**: Within the scenario planning module
4. **Quick Assistant**: Accessible throughout the application via a floating button
5. **Voice Interface**: Voice-activated assistant with speech recognition

## Key Features

### Provider Selection Logic

The system intelligently selects between MCP and OpenAI Agents based on:

1. **Query Complexity**: Routes complex queries to the most capable model
2. **Tool Requirements**: Selects provider based on needed tools (browser, computer, etc.)
3. **User Preferences**: Respects agency and user preferences where specified
4. **Availability**: Falls back to secondary provider if primary is unavailable
5. **Cost Optimization**: Selects the most cost-effective option for the specific task

### Context Preparation

The system prepares context for agent queries based on:

1. **Query Type**: Different context for analysis vs. planning queries
2. **Related Data**: Automatically includes relevant project/scenario data
3. **User History**: Incorporates relevant conversation history
4. **Agency Settings**: Applies agency-specific preferences and constraints
5. **Capability Detection**: Adjusts prompts based on AI model capabilities

### Tool Configuration

The following tools have been configured for agents:

1. **Web Search**: Access to real-time web information
2. **Code Interpreter**: Python execution for data analysis
3. **File Operations**: Reading, writing, and analyzing files
4. **Data Visualization**: Generating charts and graphs
5. **Domain-Specific Tools**: Transportation modeling and analysis tools

## Current Development Focus

The current development focus for MCP and Agents SDK includes:

1. **Enhanced MCP Server Management**
   - Improved server discovery and capability detection
   - Health monitoring and automatic failover
   - Performance analytics and usage tracking

2. **Advanced Tool Integration**
   - GIS analysis tools integration
   - Database query capabilities
   - External API access for transportation data

3. **UI Improvements**
   - Enhanced visualization of agent responses
   - Better streaming response display
   - Improved agent state management

4. **Documentation and Training**
   - Comprehensive user guides
   - Developer documentation for extending agent capabilities
   - Training materials for end users

## Code Examples

### Using the Agents Service

```typescript
import { runAgentQuery, AgentType } from '@/lib/agents-service';

// Example query to the Analysis agent
const response = await runAgentQuery({
  query: "Analyze this project's impact on congestion",
  agentType: AgentType.Analysis,
  contextData: {
    projectId: "123-456-789",
    includeScores: true
  },
  streaming: true,
  onChunk: (chunk) => {
    // Handle streaming response
    console.log(chunk);
  }
});
```

### Configuring Agent Settings

```typescript
import { updateAgentSettings } from '@/lib/agents-service';

await updateAgentSettings({
  agencyId: "agency-123",
  agentType: AgentType.Planning,
  settings: {
    preferredProvider: "openai",
    useWebSearch: true,
    includeBrowserCapability: true
  },
  systemPrompt: "You are a transportation planning specialist..."
});
```

## Best Practices

1. **Context Management**: Provide focused context to get the best results
2. **Tool Selection**: Only enable tools that are needed for specific tasks
3. **Error Handling**: Implement proper error handling for AI responses
4. **Response Validation**: Validate structured outputs from agents
5. **User Feedback**: Collect and incorporate user feedback on agent performance

## Future Enhancements

Planned future enhancements include:

1. **Multi-Agent Collaboration**: Enabling multiple specialized agents to work together
2. **Advanced Tool Creation**: Custom tools for transportation specific operations
3. **Enhanced Memory**: Improved conversation history and context handling
4. **Personalization**: User-specific adaptation of agent behavior
5. **Performance Optimization**: Reduced latency and improved response quality 