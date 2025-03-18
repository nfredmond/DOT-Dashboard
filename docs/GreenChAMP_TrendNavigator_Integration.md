# GreenChAMP and TrendNavigator Integration Guide

## Overview

This document provides technical details on the integration of the GreenChAMP (Green DOT Chained Activity Modelling Process) and TrendNavigator modules into the Planning Manager application. These modules enhance the application with scenario planning, travel demand modeling, and trend analysis capabilities.

## Architecture

The integration follows a modular, service-oriented architecture:

### Key Components

1. **Database Schema**: Extended with tables for scenarios, model configurations, results, and insights
2. **API Layer**: RESTful endpoints for managing scenarios and model runs
3. **Service Layer**: Core business logic for model execution and data processing
4. **UI Components**: Interactive interfaces for scenario creation, editing, and visualization
5. **AI Integration**: AI-powered insights and analysis using Claude/OpenAI APIs

### Integration Flow

```
User Interface → API Layer → Service Layer → GreenChAMP Model → Database
                                 ↑               ↓
                      TrendNavigator ← Result Processing
                                ↓
                        AI-powered Insights
```

## Multi-Tenancy & Security

The integration maintains strict data isolation between organizations:

- Row-Level Security (RLS) policies on all tables
- Organization ID as a mandatory field for all resources
- Session-based authentication with Supabase
- API routes enforce organization-specific access

## Database Schema

Key tables added to the schema:

- `scenarios`: Stores scenario definitions with assumptions and policies
- `greenchamp_model_configs`: Stores GreenChAMP model configurations
- `greenchamp_model_runs`: Tracks the status and metadata of model runs
- `scenario_results`: Stores the results of scenario model runs
- `scenario_insights`: Stores AI-generated insights from scenario results
- `trend_navigator_configs`: Stores organization-specific TrendNavigator configurations

## API Routes

New API endpoints implemented:

- `/api/scenarios`: GET (list), POST (create)
- `/api/scenarios/[id]`: GET (retrieve), PUT (update), DELETE (remove)
- `/api/scenarios/[id]/run`: POST (run model), GET (status)
- `/api/scenarios/[id]/insights`: GET (retrieve insights), POST (generate)

## Service Layer

Core services implemented:

- `greenchamp-runner.ts`: Handles GreenChAMP model execution and result processing
- `trend-navigator-service.ts`: Manages scenario assumptions and policies
- `scenario-insights-service.ts`: Generates insights from scenario results using AI
- `agents-service.ts`: Provides AI agent capabilities for various analysis tasks

## User Interface

New components added:

- `scenario-editor.tsx`: Form for creating and editing scenarios
- `scenario-map-view.tsx`: Interactive GIS visualization of scenario results
- `scenario-metrics-chart.tsx`: Data visualization of scenario metrics
- `scenario-results.tsx`: Comprehensive display of scenario results and insights
- `scenario-insights.tsx`: AI-generated insights and recommendations

## AI Integration

The integration leverages AI for advanced analysis:

- Scenario insights generation with Claude or GPT models
- Aspect-specific analysis (emissions, congestion, equity, etc.)
- Policy recommendations based on scenario results
- Comparative analysis between scenarios

## Output Formats

Scenario results are available in multiple formats:

- **Web UI**: Interactive visualizations and dashboards
- **GIS**: GeoJSON exports for zone-based and network-based results
- **Charts**: SVG/PNG exports of metric visualizations
- **Reports**: PDF generation with comprehensive scenario analysis
- **Data Export**: CSV/JSON exports for further analysis

## Deployment Requirements

- Node.js 18+
- Supabase project with Edge Functions enabled
- Authentication set up (Supabase Auth)
- API keys for Claude or OpenAI
- GIS service for map visualizations

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-key (for Claude)
OPENAI_API_KEY=your-openai-key (alternative)
```

## Getting Started

1. Run the SQL migrations in `docs/greenchamp_trendnavigator_schema.sql`
2. Deploy the Supabase Edge Functions from `supabase/functions/`
3. Build and deploy the Next.js application
4. Configure TrendNavigator settings for your organization

## Testing

Comprehensive testing strategy:

- Unit tests for the service layer functions
- Integration tests for API routes
- End-to-end UI testing for the scenario workflow
- Performance testing for model execution

## Future Enhancements

Planned enhancements for future versions:

- Real-time collaborative scenario editing
- Advanced GIS visualization with 3D capabilities
- Enhanced model calibration workflows
- Integration with more external data sources
- Expanded AI capabilities for scenario development 