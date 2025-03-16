# Scenario Development

This document provides an overview of the Scenario Development feature in the Planning Manager application.

## Overview

The Scenario Development feature allows transportation planners to generate, compare, and refine alternative project scenarios using AI. This feature leverages the Model Context Protocol (MCP) and OpenAI Agents SDK integration to provide intelligent scenario generation capabilities.

## Key Components

### 1. Scenario Generation

Users can generate various types of alternative project scenarios:

- **Cost Alternatives**: Different budget approaches
- **Timeline Alternatives**: Different schedule approaches
- **Design Alternatives**: Different technical approaches
- **Funding Alternatives**: Different funding mechanisms
- **Phasing Alternatives**: Different implementation phases
- **Comprehensive Alternatives**: Complete alternative approaches

The generation process can be customized with:
- Number of scenarios to generate
- Detail level (brief, standard, comprehensive)
- Budget constraints
- Timeline constraints
- Preferred outcomes

### 2. Scenario Comparison

Once multiple scenarios are generated, users can compare them side-by-side:

- Visual comparison of key metrics
- AI-generated analysis of strengths and weaknesses
- Scoring across multiple factors
- Clear recommendations

### 3. Scenario Refinement

Users can refine existing scenarios with feedback:

- Provide specific feedback or constraints
- AI generates a refined version of the scenario
- Preserves key elements while incorporating feedback
- Tracks lineage of scenario iterations

## Technical Architecture

The Scenario Development feature consists of these components:

```
┌────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│                │     │                     │     │                   │
│  UI Components │────▶│  API Endpoints      │────▶│  Scenario Service │
│                │     │                     │     │                   │
└────────────────┘     └─────────────────────┘     └─────────┬─────────┘
                                                             │
                                                             ▼
                              ┌────────────────┐     ┌───────────────────┐
                              │                │     │                   │
                              │  Agents        │◀───▶│  Census & Safety  │
                              │  Service       │     │  Services         │
                              │                │     │                   │
                              └────────────────┘     └───────────────────┘
```

### Component Descriptions

#### UI Components

- **ScenarioGenerator**: React component for generating scenarios
- **ScenarioComparison**: React component for comparing scenarios
- **ScenariosPage**: Page that integrates all scenario functionality

#### API Endpoints

- **/api/scenarios**: General endpoint for scenario operations
- **/api/projects/[projectId]/scenarios**: Project-specific scenario management
- **/api/projects/[projectId]/scenarios/[scenarioId]**: Individual scenario operations

#### Services

- **scenario-service.ts**: Core service with generation, comparison, and refinement logic
- **agents-service.ts**: Integration with AI agents (MCP or OpenAI)
- **census-service.ts**: Provides demographic context for scenarios
- **safety-service.ts**: Provides safety data context for scenarios

## Data Models

### GeneratedScenario

```typescript
interface GeneratedScenario {
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
```

### ScenarioGenerationResult

```typescript
interface ScenarioGenerationResult {
  scenarios: GeneratedScenario[];
  summary?: string;
  recommendation?: string;
}
```

### ScenarioOptions

```typescript
interface ScenarioOptions {
  count?: number;
  constraintBudget?: number;
  constraintTimeline?: string;
  preferredOutcomes?: string[];
  includeAnalysis?: boolean;
  detailLevel?: 'brief' | 'standard' | 'comprehensive';
}
```

## Usage Examples

### Generating Scenarios

```typescript
import { generateScenarios, ScenarioGenerationType } from '@/lib/analysis/scenario-service';

// Generate cost alternatives for a project
const result = await generateScenarios(
  project,
  ScenarioGenerationType.COST_ALTERNATIVES,
  {
    count: 3,
    detailLevel: 'comprehensive',
    constraintBudget: 10000000
  }
);

console.log(result.scenarios); // Array of scenario alternatives
console.log(result.recommendation); // AI recommendation
```

### Comparing Scenarios

```typescript
import { compareScenarios } from '@/lib/analysis/scenario-service';

// Compare two scenarios
const comparison = await compareScenarios(project, scenario1, scenario2);

console.log(comparison.comparison); // Detailed comparison text
console.log(comparison.recommendation); // Recommended scenario
console.log(comparison.scores); // Comparison scores across metrics
```

### Refining Scenarios

```typescript
import { refineScenario } from '@/lib/analysis/scenario-service';

// Refine a scenario based on feedback
const refinedScenario = await refineScenario(
  project,
  existingScenario,
  "Reduce the cost by 15% while maintaining the same timeline"
);

console.log(refinedScenario); // Refined scenario incorporating feedback
```

## AI Integration

The Scenario Development feature leverages the MCP and OpenAI Agents SDK integration:

- Uses `PLANNING` agent type for scenario generation
- Provides rich context including project details, demographic data, and safety data
- Formats prompts and parses responses consistently regardless of backend provider
- Automatically selects the best available provider

For detailed information about the AI integration, see [MCP_AGENTS_INTEGRATION.md](MCP_AGENTS_INTEGRATION.md).

## User Experience

1. User navigates to the Project Scenarios page
2. User selects "Generate New" and configures scenario options
3. System generates scenarios using AI
4. User can save promising scenarios
5. User can compare saved scenarios
6. User can refine scenarios based on feedback
7. Final scenarios can be exported or incorporated into project plans

## Future Enhancements

Planned enhancements for the Scenario Development feature:

1. **Timeline Visualization**: Visual timeline comparison between scenarios
2. **Cost Breakdown**: Detailed cost breakdown for each scenario
3. **Scenario Versioning**: Track history and evolution of scenarios
4. **Multi-criteria Analysis**: Enhanced comparison with weighted criteria
5. **Collaborative Feedback**: Allow multiple stakeholders to provide feedback
6. **Public Engagement**: Share scenarios with the public and collect feedback 