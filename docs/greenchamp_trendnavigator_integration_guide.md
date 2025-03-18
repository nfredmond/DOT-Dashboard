# GreenChAMP and TrendNavigator Integration Guide

## Overview

This guide provides comprehensive information on the integration of GreenChAMP (Green DOT Chained Activity Modelling Process) and TrendNavigator modules within the Planning Manager. These powerful tools work together to provide users with advanced travel demand modeling and future scenario planning capabilities.

## What is GreenChAMP?

GreenChAMP is an integrated activity-based travel demand modeling framework that:

- Simulates individual activity patterns and travel behavior
- Models the complete transportation system, including all modes of travel
- Captures detailed spatial and temporal dynamics
- Calculates environmental impacts and emissions
- Supports equity analysis and accessibility metrics
- Forms the foundation for scenario planning and policy analysis

## What is TrendNavigator?

TrendNavigator is a scenario planning tool that:

- Builds on GreenChAMP model outputs to project future scenarios
- Models the impacts of emerging trends and technologies
- Helps users understand how demographic, technological, and policy changes affect transportation patterns
- Allows comparison of multiple future scenarios
- Supports long-term planning and strategic decision-making

## Integration Benefits

The integration of GreenChAMP and TrendNavigator provides numerous benefits:

1. **Seamless Workflow**: Move directly from travel demand modeling to scenario planning within a single application
2. **Consistent Data**: All scenarios use the same underlying data structure, ensuring valid comparisons
3. **Shared Visualization**: The same visualization tools work for both modules
4. **Unified Analysis**: Analyze baseline conditions and future scenarios in the same framework
5. **Incremental Scenario Development**: Create multiple scenarios that branch from a common baseline
6. **Iterative Refinement**: Results from TrendNavigator can inform updates to GreenChAMP models

## Technical Architecture

The integration follows a modular architecture:

```
┌─────────────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│ GreenChAMP Core Engine  │◄────►│ Shared Data Services │◄────►│ TrendNavigator Core │
└─────────────────────────┘      └──────────────────────┘      └─────────────────────┘
            ▲                              ▲                             ▲
            │                              │                             │
            ▼                              ▼                             ▼
┌─────────────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│ GreenChAMP UI Components│◄────►│ Visualization Tools  │◄────►│ TrendNavigator UI  │
└─────────────────────────┘      └──────────────────────┘      └─────────────────────┘
```

## Database Schema

The modules share a common database schema with specialized tables:

- **baseline_scenarios**: Stores GreenChAMP model configurations and results
- **trend_definitions**: Defines the trends and variables available in TrendNavigator
- **trend_scenarios**: Stores TrendNavigator scenario configurations and results
- **scenario_results**: Stores detailed outputs from both modules
- **scenario_insights**: Stores AI-generated insights about scenarios

## User Workflow

### Step 1: Create a GreenChAMP Model

1. Navigate to Modeling > GreenChAMP
2. Click "New Model"
3. Define study area and parameters
4. Run the model
5. Review the results

### Step 2: Create a TrendNavigator Scenario

1. Navigate to Modeling > TrendNavigator
2. Click "New Scenario"
3. Select a GreenChAMP model as baseline
4. Configure trend variables:
   - Telecommuting rates
   - E-commerce adoption
   - Shared mobility usage
   - Vehicle automation levels
   - Transit service changes
   - Land use patterns
5. Set time horizon (5, 10, or 30 years)
6. Click "Generate Scenario"

### Step 3: Compare Scenarios

1. Navigate to Modeling > TrendNavigator > Comparison
2. Select two or more scenarios
3. View side-by-side metrics
4. Export comparison reports

## Key Features

### GreenChAMP Features

- **Activity-Based Modeling**: Simulates individual activities and trip chains
- **Multi-Modal Analysis**: Models all transportation modes
- **Environmental Impacts**: Calculates emissions and environmental factors
- **Equity Analysis**: Evaluates transportation equity across demographics
- **Accessibility Metrics**: Quantifies access to jobs, services, and opportunities
- **Interactive Visualization**: Visualizes travel patterns and transportation network performance

### TrendNavigator Features

- **Trend Modeling**: Projects how emerging trends affect travel patterns
- **Technology Adoption**: Models the impact of new transportation technologies
- **Policy Testing**: Evaluates the effects of policy changes
- **Scenario Comparison**: Enables side-by-side comparison of different futures
- **Time Horizon Analysis**: Projects short, medium, and long-term impacts
- **Statistical Reports**: Generates statistical summaries and reports

### Shared Features

- **Spatial Visualization**: Map-based visualization of activities and travel flows
- **Chart Generation**: Creates charts and graphs for presentations
- **Data Export**: Exports data in multiple formats
- **AI Insights**: Provides AI-generated insights on scenarios

## AI Integration

Both modules leverage AI capabilities:

1. **AI-Assisted Parameter Setting**: Suggests reasonable parameters based on project context
2. **Pattern Recognition**: Identifies patterns in travel behavior and scenario outcomes
3. **Insight Generation**: Automatically generates insights from model results
4. **Anomaly Detection**: Flags unusual or unexpected model outputs
5. **Explanation Generation**: Helps explain complex model results to stakeholders

## Best Practices

For optimal results:

1. **Start Simple**: Begin with a well-calibrated base model before exploring complex scenarios
2. **Validate Baseline Models**: Ensure your GreenChAMP model accurately reflects current conditions
3. **Use Incremental Changes**: Make incremental changes when creating new scenarios
4. **Document Assumptions**: Keep track of all assumptions for each scenario
5. **Compare Systematically**: When comparing scenarios, focus on one or two key variables at a time
6. **Review AI Insights**: Review and validate AI-generated insights
7. **Share Results Clearly**: Use visualization tools to communicate results effectively

## Example Use Cases

1. **Transportation Plan Updates**: Evaluate future transportation needs under different growth scenarios
2. **Climate Action Planning**: Assess the transportation emissions impacts of policy changes
3. **Equity Analysis**: Evaluate how transportation investments affect different communities
4. **Technology Impact Assessment**: Understand how new technologies will reshape travel patterns
5. **Land Use Planning**: Explore the transportation impacts of different land use decisions
6. **Infrastructure Investment**: Prioritize infrastructure investments based on future needs

## Troubleshooting

Common issues and solutions:

- **Long Processing Times**: For large models, use the batch processing option
- **Data Compatibility**: Ensure all imported data uses the correct coordinate system
- **Scenario Comparison Errors**: Verify that compared scenarios use compatible parameters
- **Visualization Performance**: Reduce data points for smoother map performance
- **Export Failures**: Check file permissions when exporting large datasets

## Additional Resources

- [GreenChAMP Technical Documentation](docs/GREENCHAMP_MODEL.md)
- [TrendNavigator User Guide](docs/TrendNavigator_User_Guide.md)
- [Scenario Planning Best Practices](docs/Scenario_Planning_Best_Practices.md)
- [Model Validation Guidelines](docs/Model_Validation_Guidelines.md)

## Support

For additional support:
- Use the in-app help feature
- Contact support@greendottransportation.com
- Visit the online knowledge base at greendottransportation.com/support 