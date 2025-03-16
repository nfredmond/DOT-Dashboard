# Supabase Scenario Feature Migration

This document provides the SQL migration script needed to add the scenario development feature to your Supabase database for the Planning Manager application.

## Overview

The scenario feature allows planners to generate and compare alternative transportation project scenarios with AI assistance. This migration adds the necessary tables and relationships to store scenario data, comparisons, and related information.

## Migration SQL

Run the following SQL in your Supabase SQL Editor to add the scenario-related tables:

```sql
-- Add scenario-related fields to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS score_data JSONB,
ADD COLUMN IF NOT EXISTS analysis_results JSONB;

-- Create table for project scenarios
CREATE TABLE IF NOT EXISTS project_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    timeline TEXT NOT NULL,
    cost DECIMAL(12, 2) NOT NULL,
    benefits TEXT[],
    drawbacks TEXT[],
    feasibility DECIMAL(4, 2) NOT NULL,
    impact JSONB,
    analysis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    parent_scenario_id UUID REFERENCES project_scenarios(id) ON DELETE SET NULL
);

-- Create table for scenario comparisons
CREATE TABLE IF NOT EXISTS scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scenario1_id UUID NOT NULL REFERENCES project_scenarios(id) ON DELETE CASCADE,
    scenario2_id UUID NOT NULL REFERENCES project_scenarios(id) ON DELETE CASCADE,
    comparison TEXT NOT NULL,
    recommendation TEXT,
    scores JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS project_scenarios_project_id_idx ON project_scenarios(project_id);
CREATE INDEX IF NOT EXISTS project_scenarios_created_by_idx ON project_scenarios(created_by);
CREATE INDEX IF NOT EXISTS project_scenarios_parent_scenario_id_idx ON project_scenarios(parent_scenario_id);
CREATE INDEX IF NOT EXISTS project_scenarios_created_at_idx ON project_scenarios(created_at);
CREATE INDEX IF NOT EXISTS project_scenarios_feasibility_idx ON project_scenarios(feasibility);

CREATE INDEX IF NOT EXISTS scenario_comparisons_project_id_idx ON scenario_comparisons(project_id);
CREATE INDEX IF NOT EXISTS scenario_comparisons_scenario1_id_idx ON scenario_comparisons(scenario1_id);
CREATE INDEX IF NOT EXISTS scenario_comparisons_scenario2_id_idx ON scenario_comparisons(scenario2_id);
CREATE INDEX IF NOT EXISTS scenario_comparisons_created_by_idx ON scenario_comparisons(created_by);
CREATE INDEX IF NOT EXISTS scenario_comparisons_created_at_idx ON scenario_comparisons(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE project_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

-- Policy for reading scenarios (users can read all scenarios in their organization)
CREATE POLICY "Users can read scenarios in their organization" ON project_scenarios
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = project_scenarios.project_id
            AND pr.id = auth.uid()
        )
    );

-- Policy for creating scenarios (users can create scenarios for projects in their organization)
CREATE POLICY "Users can create scenarios for their organization's projects" ON project_scenarios
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = project_scenarios.project_id
            AND pr.id = auth.uid()
        )
    );

-- Policy for updating scenarios (users can update scenarios they created)
CREATE POLICY "Users can update scenarios they created" ON project_scenarios
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy for reading scenario comparisons
CREATE POLICY "Users can read scenario comparisons in their organization" ON scenario_comparisons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = scenario_comparisons.project_id
            AND pr.id = auth.uid()
        )
    );

-- Policy for creating scenario comparisons
CREATE POLICY "Users can create scenario comparisons for their organization's projects" ON scenario_comparisons
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = scenario_comparisons.project_id
            AND pr.id = auth.uid()
        )
    );
```

## Verification

After running the migration, verify that the tables were created correctly:

```sql
-- Check that the tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('project_scenarios', 'scenario_comparisons');

-- Check the columns in the project_scenarios table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'project_scenarios';

-- Check the columns in the scenario_comparisons table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'scenario_comparisons';
```

## Updating the Schema Documentation

After applying this migration, make sure to update your schema documentation to include these new tables. Add the following to your data model documentation:

- `project_scenarios`: Stores alternative scenarios for transportation projects
- `scenario_comparisons`: Stores comparisons between different scenarios

## Related API Endpoints

The application now includes the following API endpoints to interact with scenarios:

- `GET /api/projects/:projectId/scenarios` - Get all scenarios for a project
- `POST /api/projects/:projectId/scenarios` - Create a new scenario
- `GET /api/projects/:projectId/scenarios/:scenarioId` - Get a specific scenario
- `PATCH /api/projects/:projectId/scenarios/:scenarioId` - Update a scenario
- `DELETE /api/projects/:projectId/scenarios/:scenarioId` - Delete a scenario
- `PUT /api/projects/:projectId/scenarios/compare` - Compare two scenarios 