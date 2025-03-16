# OpenAI Agents SDK Integration

## Overview

The Planning Manager application now integrates OpenAI's Agents SDK to provide advanced AI assistant capabilities including computer access and web browsing. This integration enhances the existing LLM functionality with agentic capabilities that can perform more complex tasks.

## Features

The Agents SDK integration adds the following capabilities:

- **Analysis Agent**: An expert transportation planning agent that provides comprehensive project analysis
- **Computer Agent**: An agent with access to file system operations for retrieving and analyzing local documents
- **Browser Agent**: An agent with web browsing capabilities to search for relevant transportation planning information

Key features include:

- Agent delegation (handoffs between specialized agents)
- Streaming responses for real-time feedback
- Tool execution tracing for transparency
- Integration with existing Census and SWITRS data analysis

## Architecture

The integration consists of the following components:

### 1. Agents Service

Location: `src/lib/agents-service.ts`

This service provides the core functionality for creating and running agents:

- Defines agent types (`ANALYSIS`, `COMPUTER`, `BROWSER`)
- Creates specialized agents with different tools and capabilities
- Provides functions for running agent queries with or without streaming
- Handles agent contexts to pass project information

### 2. LLM Context Provider

Location: `src/contexts/LLMContext.tsx`

The LLM context has been enhanced to include agent functionality:

- `sendAgentQuery`: Sends a query to an agent and returns a response
- `sendStreamedAgentQuery`: Sends a query to an agent with streaming capabilities
- Formats agent responses to match the existing LLM response interface

### 3. Project Map LLM Integration Component

Location: `src/app/project-mapping/components/ProjectMapLLMIntegration.tsx`

This component has been updated to include:

- A toggle between standard LLM and Agent modes
- Selection of different agent types
- Support for streaming responses in real-time
- Context passing from projects to agents

### 4. Agent Tools Page

Location: `src/app/agent-tools/page.tsx`

A dedicated page for working directly with agents that provides:

- A full-screen interface for agent interactions
- Real-time streaming of agent responses
- Visualization of agent execution events (tool calls, handoffs)
- Selection between different agent types

### 5. Admin Panel Integration

Location: `src/app/admin-panel/page.tsx`

Administrators can manage agent functionality through:

- A dedicated "Agents" tab in the admin panel
- Quick access to the Agent Tools interface
- Configuration options for API keys and permissions

## Usage

### Standard Project Analysis

1. Navigate to the Project Mapping page
2. Select a project on the map
3. In the Analysis panel, switch to "AI Agent" mode
4. Select the appropriate agent type (Analysis, Computer, or Browser)
5. Optionally enable streaming responses
6. Click "Analyze" to process the project

### Custom Agent Queries

1. Navigate to the Agent Tools page from the navigation menu
2. Select the desired agent type
3. Enter your query in the text area
4. Enable or disable streaming as needed
5. Click "Submit" to process your query

### Admin Configuration

Administrators can configure agent settings:

1. Navigate to the Admin Panel
2. Select the "Agents" tab
3. Configure API keys, permissions, and access controls
4. Access the Agent Tools interface directly from the admin panel

## Technical Implementation

### Agent Creation

```typescript
// Creating a specialized agent
export const createBrowserAgent = () => {
  return new Agent({
    name: 'browser_agent',
    instructions: `You are a helpful agent with web browsing capabilities...`,
    tools: browserTools,
  });
};
```

### Agent Execution

```typescript
// Running an agent query with streaming
export async function runAgentQueryStreamed(
  agentType: AgentType,
  query: string,
  context?: AgentContext,
  onEvent?: (event: any) => void
): Promise<{ response: string; trace?: any }> {
  // Implementation details...
}
```

### Integration with Existing LLM Context

```typescript
// Sending an agent query through the LLM context
const sendAgentQuery = async (query: string, agentType: AgentType, projectData?: any): Promise<LLMResponse> => {
  // Implementation details...
};
```

## Security and Privacy Considerations

The Agents SDK integration includes several security measures:

- All agent interactions are authenticated through the application's existing authentication system
- Computer access is limited to authorized files and directories
- Web browsing capabilities are configured with appropriate usage policies
- All agent interactions are logged for audit purposes

## Limitations

Current limitations include:

- Computer agent functionality is limited to pre-defined file operations
- Browser agent cannot access internal systems or private networks
- Execution time for complex queries may be longer than standard LLM queries

## Future Enhancements

Planned enhancements for the Agents integration include:

- Enhanced file access capabilities with more granular permissions
- Integration with additional data sources and APIs
- Custom agent creation for specific transportation planning tasks
- Improved visualization of agent reasoning and decision processes

## Troubleshooting

Common issues and solutions:

- **Agent not responding**: Verify OpenAI API key is configured correctly
- **Computer access errors**: Check file permissions and access controls
- **Browser access issues**: Ensure internet connectivity and proper API configuration
- **Performance issues**: Consider disabling streaming for large responses

## References

- [OpenAI Agents SDK Documentation](https://platform.openai.com/docs/agents)
- [Planning Manager LLM Documentation](docs/LLM_INTEGRATION.md) 