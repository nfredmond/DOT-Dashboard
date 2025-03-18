# GreenChAMP, TrendNavigator, and MCP Integration Guide

This document provides a comprehensive guide for integrating the GreenChAMP (Green DOT Chained Activity Modelling Process), TrendNavigator, and Model Component Package (MCP) modules into the Planning Manager application.

## 1. Overview

The integration includes three key components:

1. **GreenChAMP** - A travel demand modeling framework that simulates activity patterns and travel behavior
2. **TrendNavigator** - A scenario planning tool that models future trends and policy impacts
3. **MCP (Model Component Package)** - A system for deploying and managing AI-enhanced transportation models

Together, these components provide a powerful platform for transportation planning and analysis.

## 2. Architecture

The integration follows a service-oriented architecture with these layers:

1. **Database Layer** - PostgreSQL with PostGIS for spatial data storage
2. **API Layer** - RESTful endpoints for accessing model functionality
3. **Service Layer** - Core business logic for model execution
4. **UI Layer** - Interactive interfaces for configuration and visualization
5. **AI Layer** - Integration with AI services for enhanced analysis

## 3. Database Schema

The database schema includes tables for:

- Scenarios and model configurations
- Geographic zones and networks
- Travel demand model inputs and outputs
- Trend analysis parameters and results
- AI agent settings and queries

For the complete schema, refer to the `greenchamp_trendnavigator_schema.sql` file.

## 4. API Endpoints

Key API endpoints include:

- `/api/scenarios` - Manage modeling scenarios
- `/api/scenarios/[id]/run` - Execute model runs
- `/api/scenarios/[id]/results` - Retrieve model results
- `/api/mcp/agents` - Interact with AI agents for analysis

## 5. GreenChAMP Implementation

The GreenChAMP module implements a four-step travel demand model:

1. **Trip Generation** - Calculate trip productions and attractions
2. **Trip Distribution** - Connect origins and destinations
3. **Mode Choice** - Determine transportation modes
4. **Network Assignment** - Assign trips to transportation networks

Additional features include:

- Activity-based modeling extensions
- Environmental impact assessment
- Equity analysis components

## 6. TrendNavigator Implementation

TrendNavigator provides tools for:

- Defining future scenarios with varying assumptions
- Modeling impacts of technology trends (telecommuting, autonomous vehicles)
- Analyzing policy interventions
- Comparing scenario outcomes

## 7. MCP Implementation

The Model Component Package (MCP) provides:

- AI agent integration for advanced analysis
- Modular components for model customization
- API-based access to transportation models
- Web browser capabilities for data access

## 8. Integration Points

Key integration points between the components:

- GreenChAMP produces travel forecasts used by TrendNavigator
- TrendNavigator scenarios define inputs for GreenChAMP models
- MCP agents analyze outputs from both GreenChAMP and TrendNavigator
- Shared database schema for seamless data flow

## 9. Configuration

The integration requires these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

## 10. Deployment

Deployment steps:

1. Run database migrations
2. Deploy API services
3. Configure environment variables
4. Build and deploy the Next.js application

## 11. Security Considerations

Security measures include:

- Row-level security for multi-tenant data isolation
- API authentication and authorization
- Input validation and sanitization
- Rate limiting for API endpoints

## 12. Performance Optimization

Performance optimizations include:

- Database indexing for efficient queries
- Caching of frequently accessed data
- Asynchronous processing for long-running operations
- Lazy loading of UI components

## 13. Testing

Testing strategy includes:

- Unit tests for model components
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for model execution

## 14. Documentation

Additional documentation includes:

- User guides for model configuration
- API documentation for developers
- Technical specifications for model components
- Tutorials for common use cases

## 15. Future Enhancements

Planned future enhancements:

- Enhanced visualization capabilities
- Advanced AI-powered insights
- Real-time collaborative modeling
- Additional data integrations 