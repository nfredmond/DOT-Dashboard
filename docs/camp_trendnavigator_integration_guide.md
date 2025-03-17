# CAMP and TrendNavigator Integration Guide - Planning Manager v6

## Implementation Status

**Status**: Primary integration complete, optimization and extensions in progress

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| Core Services | ✅ Complete |
| UI Components | ✅ Complete |
| API Endpoints | ✅ Complete |
| AI Integration | ✅ Complete |
| Documentation | 🔄 In Progress |
| Performance Optimization | 🔄 In Progress |
| External Data Source Integration | 🔄 In Progress |
| Advanced Visualization | 🔄 In Progress |

## User Interface Components

The following key components have been implemented to provide a rich user experience:

1. **Scenario Editor**: Located at `src/components/trend-navigator/scenario-editor.tsx`, this component allows users to create and edit scenarios, specifying details such as name, description, base year, horizon years, assumptions and policy packages.

2. **Scenario Results Viewer**: Located at `src/components/scenario-results.tsx`, this component visualizes the results of scenario runs, including metrics like congestion levels, emissions, and accessibility.

3. **GIS Visualization**: Located at `src/components/scenario-map-view.tsx`, this component displays the spatial impacts of scenarios through interactive maps, allowing users to visualize zone-based and network-based metrics from the CAMP model.

4. **Scenario Insights**: Located at `src/components/scenario-insights.tsx`, this component displays AI-generated insights and analysis for a specific scenario.

5. **Scenario Comparison**: Located at `src/components/trend-navigator/scenarios-comparison-dashboard.tsx`, this component enables users to compare multiple scenarios side by side, providing visualizations of key metrics across scenarios and AI-generated comparative analysis.

6. **Comparative Insights**: Located at `src/components/trend-navigator/comparison-insights.tsx`, this component presents AI-generated analytical insights comparing multiple scenarios, highlighting relative performance, trade-offs, and recommendations based on the comparison.

These components integrate with the backend services to provide a seamless user experience, from scenario creation to results visualization and analysis.

## Database Schema

The database schema has been extended to support CAMP and TrendNavigator with the following tables:

1. **trend_navigator_configs**: Stores organization-specific configurations for TrendNavigator
   - Fields: id, organization_id, default_base_year, default_horizon_years, available_trends, created_at, updated_at

2. **camp_configs**: Stores CAMP model configurations
   - Fields: id, organization_id, zone_data, network_data, parameters, calibration_status, created_at, updated_at

3. **scenarios**: Stores scenario definitions
   - Fields: id, organization_id, name, description, base_year, horizon_years, assumptions, policy_packages, tags, status, created_at, updated_at, created_by

4. **scenario_results**: Stores the results of scenario runs
   - Fields: id, scenario_id, results, congestion, emissions, accessibility, safety, equity, gis_data, zone_metrics, network_metrics, created_at

5. **camp_model_runs**: Stores information about CAMP model runs
   - Fields: id, scenario_id, model_parameters, status, error_message, start_time, end_time, execution_time

6. **scenario_insights**: Stores AI-generated insights for scenarios
   - Fields: id, scenario_id, insights, key_findings, recommendations, created_at, updated_at

7. **scenario_comparisons**: Stores comparative analysis between multiple scenarios
   - Fields: id, scenario_ids, baseline_scenario_id, comparison_insights, metrics_data, created_at, updated_at

All tables include appropriate row-level security policies to enforce multi-tenancy and prevent unauthorized access. Indexes have been added to optimize query performance, particularly for filtering by organization_id and for text search on scenario names and descriptions.

The complete SQL schema can be found in `docs/camp_trendnavigator_schema.sql`.

## API Endpoints

The following API routes have been implemented to support the CAMP and TrendNavigator integration:

1. **Scenario Management**
   - `GET /api/scenarios` - List all scenarios for the current organization
   - `POST /api/scenarios` - Create a new scenario
   - `GET /api/scenarios/:id` - Get details for a specific scenario
   - `PUT /api/scenarios/:id` - Update a scenario
   - `DELETE /api/scenarios/:id` - Delete a scenario

2. **Model Configuration**
   - `GET /api/camp/configs` - List all CAMP model configurations
   - `POST /api/camp/configs` - Create a new CAMP model configuration
   - `GET /api/camp/configs/:id` - Get details for a specific CAMP configuration
   - `PUT /api/camp/configs/:id` - Update a CAMP configuration

3. **Model Execution**
   - `POST /api/scenarios/:id/run` - Run the CAMP model for a scenario
   - `GET /api/scenarios/:id/status` - Check the status of a model run
   - `GET /api/scenarios/:id/results` - Get the results of a model run

4. **Insights and Analysis**
   - `POST /api/scenarios/:id/insights` - Generate AI insights for a scenario
   - `GET /api/scenarios/:id/insights` - Get AI-generated insights for a scenario
   - `POST /api/scenarios/compare` - Compare multiple scenarios
   - `GET /api/scenarios/compare/:id` - Get comparison results

5. **TrendNavigator Configuration**
   - `GET /api/trend-navigator/configs` - Get TrendNavigator configuration
   - `PUT /api/trend-navigator/configs` - Update TrendNavigator configuration

## Service Implementation

The following key services have been implemented to power the CAMP and TrendNavigator functionality:

1. **camp-runner.ts**
   - Handles the execution of CAMP travel demand models
   - Manages the trip generation, distribution, mode choice, and assignment steps
   - Processes and stores model results

2. **trend-navigator-service.ts**
   - Manages scenario definitions, assumptions, and policies
   - Coordinates with CAMP runner for model execution
   - Provides scenario comparison functionality

3. **scenario-insights-service.ts**
   - Generates AI-powered insights from scenario results
   - Uses Claude or OpenAI models to analyze results and generate recommendations
   - Provides comparative analysis between scenarios

4. **mcp-integration-service.ts**
   - Connects with external Model Component Package (MCP) servers
   - Enables integration with specialized modeling tools
   - Supports advanced analysis through MCP agents

## Integration with AI Services

The CAMP and TrendNavigator modules are deeply integrated with AI services to provide enhanced analysis capabilities:

1. **Result Analysis**
   - AI-powered analysis of model results
   - Identification of key trends and patterns
   - Generation of natural language insights

2. **Comparative Analysis**
   - AI comparison of multiple scenarios
   - Identification of trade-offs between scenarios
   - Recommendations based on organizational priorities

3. **Policy Recommendations**
   - AI-generated policy suggestions based on scenario outcomes
   - Impact assessment of potential policy interventions
   - Customized recommendations based on agency goals

4. **MCP Agent Integration**
   - Domain-specific agents for specialized analysis
   - Integration with OpenAI Agents SDK for enhanced capabilities
   - Complex query handling through agent-based interactions

## Current Development Focus

The current development focus for CAMP and TrendNavigator includes:

1. **Performance Optimization**
   - Improving calculation speed for large networks
   - Implementing caching strategies for model results
   - Optimizing database queries for scenario analysis

2. **External Data Integration**
   - Census Transportation Planning Package integration
   - GTFS transit data integration
   - GIS data source integration

3. **Enhanced Visualization**
   - 3D visualization of model results
   - Temporal visualization of scenario impacts over time
   - Customizable dashboards for scenario analysis

4. **Advanced AI Features**
   - Enhanced prompt engineering for more detailed insights
   - Multi-modal AI analysis (text + maps)
   - Automated scenario generation based on goals

## Getting Started

To begin using the CAMP and TrendNavigator modules:

1. Navigate to the Scenarios section in the application
2. Create a new scenario with the Scenario Editor
3. Configure trend variables and policy packages
4. Run the scenario model
5. View results and AI-generated insights
6. Compare with other scenarios

## Documentation

Comprehensive documentation for the CAMP and TrendNavigator modules is available:

- **User Guide**: Step-by-step instructions for using the modeling features
- **API Documentation**: Details on all available API endpoints
- **Technical Reference**: Implementation details for developers
- **Model Methodology**: Documentation on the CAMP model methodology

## Future Enhancements

Planned enhancements for future versions include:

1. **Activity-Based Modeling**
   - Enhanced individual travel itinerary simulation
   - Time-of-day modeling improvements
   - Tour-based modeling capabilities

2. **Advanced Visualization**
   - 3D city visualization for scenario impacts
   - Animated temporal visualization
   - Virtual reality scenario exploration

3. **Enhanced AI Capabilities**
   - Automated scenario optimization based on goals
   - Enhanced natural language query capabilities
   - AI-driven calibration assistance

4. **Integration Enhancements**
   - Additional transportation data source integrations
   - Real-time data feed capabilities
   - Enhanced MCP agent capabilities 