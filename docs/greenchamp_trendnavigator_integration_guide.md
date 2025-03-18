# GreenChAMP and TrendNavigator Integration Guide

## Overview

This guide provides implementation details for integrating the GreenChAMP (Green DOT Chained Activity Modelling Process) and TrendNavigator modules into the Planning Manager application. These integrated tools enable advanced scenario planning, travel demand modeling, and trend analysis.

## System Components

The integration consists of these key components:

1. **GreenChAMP Module**: Travel demand forecasting framework based on activity modeling
2. **TrendNavigator Module**: Scenario planning tool for exploring future trends
3. **API Integration Layer**: Connects modules to the main application
4. **Database Extensions**: Schema for storing model inputs, configurations, and results
5. **UI Components**: Interfaces for configuring, running, and visualizing models

## Implementation Steps

### 1. Database Setup

Run the SQL migration scripts to create the necessary database tables:

```
docs/greenchamp_trendnavigator_schema.sql
```

This script creates:
- Tables for scenarios, configurations, and results
- PostGIS extensions for spatial data
- Indexes for performance optimization
- Row-level security policies for multi-tenant isolation

### 2. API Routes Implementation

Implement the following API endpoints:

- `/api/scenarios` - CRUD operations for scenarios
- `/api/scenarios/[id]/run` - Trigger model runs
- `/api/scenarios/[id]/results` - Retrieve model results
- `/api/scenarios/[id]/insights` - AI-generated insights

### 3. Service Layer Integration

Create and implement these service files:

- `src/services/greenchamp-service.ts` - Core GreenChAMP model logic
- `src/services/trend-navigator-service.ts` - TrendNavigator functionality
- `src/services/scenario-service.ts` - Scenario management
- `src/services/insights-service.ts` - AI analysis of results

### 4. UI Components 

Develop user interface components:

- Scenario creation and management forms
- Model configuration interfaces
- Results visualization with charts and maps
- Insights dashboard for analysis

### 5. Testing

Implement comprehensive testing:

- Unit tests for model components
- Integration tests for API endpoints
- End-to-end tests for user flows

## Configuration

The integration requires the following environment variables:

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
OPENAI_API_KEY=your_openai_key
```

## Dependencies

- Next.js 14+
- PostgreSQL with PostGIS
- Supabase for authentication and database
- Mapbox GL JS for visualizations
- OpenAI API for insights generation

## Security Considerations

- Row-level security ensures data isolation between organizations
- API route handlers validate user permissions
- Client-side access control in UI components
- Sanitization of all user inputs

## Performance Optimizations

- Asynchronous model runs for long-running operations
- Result caching for frequently accessed data
- Spatial indexes for geographic queries
- Batched data loading for visualizations

## Documentation

Additional reference materials:

- GreenChAMP Model Technical Specification
- TrendNavigator Configuration Guide
- Database Schema Reference
- API Documentation 