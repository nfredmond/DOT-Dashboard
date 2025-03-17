### User Interface Components

The following key components have been implemented to provide a rich user experience:

1. **Scenario Editor**: Located at `src/components/trend-navigator/scenario-editor.tsx`, this component allows users to create and edit scenarios, specifying details such as name, description, base year, horizon years, assumptions and policy packages.

2. **Scenario Results Viewer**: Located at `src/components/scenario-results.tsx`, this component visualizes the results of scenario runs, including metrics like congestion levels, emissions, and accessibility.

3. **GIS Visualization**: Located at `src/components/scenario-map-view.tsx`, this component displays the spatial impacts of scenarios through interactive maps, allowing users to visualize zone-based and network-based metrics from the CAMP model.

4. **Scenario Insights**: Located at `src/components/scenario-insights.tsx`, this component displays AI-generated insights and analysis for a specific scenario.

5. **Scenario Comparison**: Located at `src/components/trend-navigator/scenarios-comparison-dashboard.tsx`, this component enables users to compare multiple scenarios side by side, providing visualizations of key metrics across scenarios and AI-generated comparative analysis.

6. **Comparative Insights**: Located at `src/components/trend-navigator/comparison-insights.tsx`, this component presents AI-generated analytical insights comparing multiple scenarios, highlighting relative performance, trade-offs, and recommendations based on the comparison.

These components integrate with the backend services to provide a seamless user experience, from scenario creation to results visualization and analysis.

### Database Schema

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

### API Routes

The following API routes have been implemented to support the CAMP and TrendNavigator integration:

1. **Scenario Management**:
   - `GET /api/scenarios`: List all scenarios for the authenticated user's organization
   - `POST /api/scenarios`: Create a new scenario
   - `GET /api/scenarios/[id]`: Get a specific scenario by ID
   - `PUT /api/scenarios/[id]`: Update a scenario
   - `DELETE /api/scenarios/[id]`: Delete a scenario

2. **Scenario Execution**:
   - `POST /api/scenarios/[id]/run`: Run a scenario through the CAMP model
   - `GET /api/scenarios/[id]/run`: Get the status of the latest run for a scenario

3. **Scenario Insights**:
   - `GET /api/scenarios/[id]/insights`: Get AI-generated insights for a scenario
   - `POST /api/scenarios/[id]/insights`: Generate new insights for a scenario

4. **Scenario Comparison**:
   - `POST /api/scenarios/compare`: Compare multiple scenarios simultaneously
   - `GET /api/scenarios/compare/insights`: Get existing comparative insights
   - `POST /api/scenarios/compare/insights`: Generate new comparative insights between scenarios

5. **GIS Data**:
   - `GET /api/scenarios/[id]/gis/zones`: Get zone-level GIS data for a scenario
   - `GET /api/scenarios/[id]/gis/network`: Get network-level GIS data for a scenario

All routes implement appropriate authentication and authorization checks to ensure that users can only access data from their own organization. 