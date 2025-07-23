# OpenAI Agents Integration Guide

## Overview

Planning Manager v10 integrates OpenAI's advanced AI agents to provide powerful research, analysis, and automation capabilities for transportation planning tasks. This guide covers the available agent types, how to use them, and best practices.

## Table of Contents

1. [Agent Types](#agent-types)
2. [Getting Started](#getting-started)
3. [Research Agent](#research-agent)
4. [Computer Use Agent](#computer-use-agent)
5. [Data Analysis Agent](#data-analysis-agent)
6. [Code Generation Agent](#code-generation-agent)
7. [API Integration](#api-integration)
8. [Best Practices](#best-practices)

## Agent Types

### 1. Research Agent
Performs deep research on transportation planning topics, gathering information from multiple sources and providing comprehensive analysis.

### 2. Computer Use Agent
Analyzes screenshots and visual interfaces, providing insights and automation suggestions for UI-based tasks.

### 3. Data Analysis Agent
Processes and analyzes transportation data, identifying patterns, trends, and providing actionable insights.

### 4. Code Generation Agent
Generates code for transportation planning features, including GIS/mapping functions, data processing scripts, and UI components.

## Getting Started

### Prerequisites

1. Ensure your organization has OpenAI API access configured
2. Have appropriate permissions (Editor or Admin role)
3. Navigate to a project where you want to use AI agents

### Accessing AI Agents

The AI Agent Assistant can be accessed:
- From the project dashboard
- Via the LLM Assistant interface
- Through direct API calls

## Research Agent

### Use Cases
- Researching best practices for specific project types
- Finding case studies of similar projects
- Understanding regulations and policies
- Identifying funding opportunities

### How to Use

1. **Select Research Tab**: Open the AI Agent Assistant and select "Research"
2. **Enter Topic**: Provide a detailed research topic, for example:
   - "Best practices for implementing protected bike lanes in urban areas"
   - "Federal funding opportunities for transit-oriented development"
   - "Environmental impact assessment requirements for highway expansion"
3. **Start Research**: Click "Start Deep Research"
4. **Review Results**: The agent will provide:
   - Executive summary
   - Key findings
   - Case studies
   - Relevant regulations
   - Data sources and references

### Example Research Query
```
Topic: "Complete streets implementation in mid-size cities"

The agent will research:
- Design standards and guidelines
- Successful implementations in similar cities
- Common challenges and solutions
- Funding mechanisms
- Performance metrics
```

## Computer Use Agent

### Use Cases
- Analyzing complex transportation maps or diagrams
- Extracting data from screenshots of legacy systems
- Understanding UI workflows in planning software
- Identifying accessibility issues in digital tools

### How to Use

1. **Select Computer Use Tab**: Navigate to the Computer Use section
2. **Provide Screenshot URL**: Enter the URL of the image to analyze
3. **Add Context** (Optional): Describe what you want to analyze:
   - "Identify all transportation modes shown in this map"
   - "Extract traffic count data from this table"
   - "Analyze the accessibility of this interface"
4. **Analyze**: Click "Analyze Screenshot"

### Supported Image Formats
- PNG, JPG, JPEG
- Maximum size: 20MB
- Publicly accessible URLs or uploaded images

## Data Analysis Agent

### Use Cases
- Analyzing traffic patterns and trends
- Evaluating project impact metrics
- Processing survey data
- Generating insights from sensor data

### How to Use

1. **Select Data Analysis Tab**: Open the Data Analysis section
2. **Choose Analysis Type**:
   - General Analysis
   - Traffic Pattern Analysis
   - Safety Analysis
   - Environmental Impact
   - Economic Analysis
3. **Provide Data**: Enter data in JSON format:
   ```json
   {
     "traffic_counts": {
       "morning_peak": [1200, 1350, 1100],
       "evening_peak": [1400, 1500, 1300],
       "locations": ["Main St", "2nd Ave", "Park Blvd"]
     },
     "date_range": "2024-01-01 to 2024-01-31"
   }
   ```
4. **Analyze**: Click "Analyze Data"

### Analysis Outputs
- Statistical summaries
- Trend identification
- Anomaly detection
- Visualizations recommendations
- Actionable insights

## Code Generation Agent

### Use Cases
- Creating custom map visualizations
- Building data processing scripts
- Generating API integrations
- Developing planning calculators

### How to Use

1. **Select Code Gen Tab**: Navigate to Code Generation
2. **Select Language**:
   - TypeScript (default)
   - JavaScript
   - Python
   - SQL
3. **Describe Requirements**: Be specific about what you need:
   - "Create a function to calculate vehicle miles traveled (VMT) based on trip data"
   - "Generate a React component for displaying transit route information"
   - "Write a SQL query to analyze crash data by intersection"
4. **Generate Code**: Click "Generate Code"

### Code Generation Tips
- Provide clear, specific requirements
- Include input/output examples
- Mention any libraries or frameworks to use
- Specify error handling needs

## API Integration

### Direct API Usage

For programmatic access, use the `/api/agents/execute` endpoint:

```typescript
const response = await fetch('/api/agents/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    taskType: 'research',
    action: 'deep_research',
    data: {
      topic: 'Your research topic here'
    },
    projectId: 'optional-project-id'
  })
});

const result = await response.json();
```

### Task Types and Actions

| Task Type | Actions | Description |
|-----------|---------|-------------|
| research | deep_research | Comprehensive topic research |
| computer_use | analyze_screenshot | Visual analysis of images |
| data_analysis | analyze_transportation_data | Data processing and insights |
| code_generation | generate_planning_code | Code creation for planning tasks |

### Response Format

```typescript
interface AgentResponse {
  success: boolean;
  result?: {
    // Varies by agent type
    analysis?: string;
    code?: string;
    insights?: object;
  };
  error?: string;
  metadata?: {
    duration: number;
    tokens_used?: number;
    tools_used?: string[];
  };
}
```

## Best Practices

### 1. Clear Instructions
- Be specific about what you need
- Provide context and constraints
- Include examples when possible

### 2. Data Preparation
- Ensure data is properly formatted
- Remove sensitive information
- Validate JSON before submission

### 3. Result Verification
- Always review AI-generated content
- Verify facts and figures
- Test generated code thoroughly

### 4. Iterative Refinement
- Start with broad queries
- Refine based on initial results
- Build on previous outputs

### 5. Security Considerations
- Don't share sensitive data
- Review generated code for security issues
- Validate all outputs before use

## Limitations

- **Context Window**: Large datasets may need to be summarized
- **Real-time Data**: Agents use training data; verify current information
- **Complex Visualizations**: May need manual refinement
- **Legal Compliance**: Always verify regulatory information

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Ensure you're logged in
   - Check organization API key configuration

2. **Timeout Errors**
   - Reduce data size
   - Break complex tasks into smaller parts

3. **Invalid JSON**
   - Use a JSON validator
   - Check for proper escaping

4. **Rate Limiting**
   - Space out requests
   - Contact admin for limit increases

## Future Enhancements

Planned improvements include:
- Real-time web search integration
- Direct database query capabilities
- Multi-modal analysis (video, audio)
- Collaborative agent workflows
- Custom agent training

## Support

For assistance with AI agents:
1. Check the error messages for specific issues
2. Review the examples in this guide
3. Contact your system administrator
4. Submit feedback through the Help section 