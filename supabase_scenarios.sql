-- Planning Manager v5 - Scenario Feature Migration
-- This SQL file contains the migration necessary to add the scenario development feature
-- to the Supabase database for the Planning Manager application.

-- 1. Add scenario-related fields to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS score_data JSONB,
ADD COLUMN IF NOT EXISTS analysis_results JSONB;

-- 2. Create table for project scenarios
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

-- 3. Create table for scenario comparisons
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

-- 4. Create indexes for performance
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

-- 5. Enable Row Level Security
ALTER TABLE project_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policies for scenarios

-- Policy for reading scenarios (users can read all scenarios in their organization)
CREATE POLICY "Users can read scenarios in their organization" ON project_scenarios
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = project_scenarios.project_id
            AND pr.user_id = auth.uid()
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
            AND pr.user_id = auth.uid()
        )
    );

-- Policy for updating scenarios (users can update scenarios they created)
CREATE POLICY "Users can update scenarios they created" ON project_scenarios
    FOR UPDATE
    USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    WITH CHECK (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy for deleting scenarios (users can delete scenarios they created)
CREATE POLICY "Users can delete scenarios they created" ON project_scenarios
    FOR DELETE
    USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 7. Add RLS policies for scenario comparisons

-- Policy for reading scenario comparisons
CREATE POLICY "Users can read scenario comparisons in their organization" ON scenario_comparisons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN profiles pr ON p.organization_id = pr.organization_id
            WHERE p.id = scenario_comparisons.project_id
            AND pr.user_id = auth.uid()
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
            AND pr.user_id = auth.uid()
        )
    );

-- Policy for updating scenario comparisons (users can update scenario comparisons they created)
CREATE POLICY "Users can update scenario comparisons they created" ON scenario_comparisons
    FOR UPDATE
    USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
    WITH CHECK (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy for deleting scenario comparisons (users can delete scenario comparisons they created)
CREATE POLICY "Users can delete scenario comparisons they created" ON scenario_comparisons
    FOR DELETE
    USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 8. Sample data for testing (commented out for production)
/*
-- Insert sample scenarios
INSERT INTO project_scenarios (
    project_id, 
    name, 
    description, 
    timeline, 
    cost, 
    benefits, 
    drawbacks, 
    feasibility, 
    impact, 
    analysis
)
VALUES
    -- Sample Scenario 1
    (
        '11111111-1111-1111-1111-111111111111', -- Replace with actual project ID
        'Enhanced Safety Focus',
        'A scenario that prioritizes safety improvements with pedestrian and bicycle facilities',
        '2024-2026',
        1200000.00,
        ARRAY['Improved pedestrian safety', 'Dedicated bike lanes', 'Reduced vehicle speeds'],
        ARRAY['Higher cost', 'Longer implementation time'],
        0.85,
        '{"safety": 0.9, "mobility": 0.7, "cost": 0.6}',
        'This scenario would significantly improve safety metrics for all road users, especially vulnerable populations.'
    ),
    -- Sample Scenario 2
    (
        '11111111-1111-1111-1111-111111111111', -- Replace with actual project ID
        'Cost-Efficient Alternative',
        'A streamlined version focused on essential safety improvements with reduced scope',
        '2024-2025',
        850000.00,
        ARRAY['Lower cost', 'Quicker implementation', 'Addresses critical safety issues'],
        ARRAY['Limited pedestrian improvements', 'No bike facilities'],
        0.75,
        '{"safety": 0.7, "mobility": 0.6, "cost": 0.85}',
        'This scenario offers a more budget-friendly approach while still addressing key safety concerns.'
    );

-- Insert sample comparison
INSERT INTO scenario_comparisons (
    project_id,
    scenario1_id,
    scenario2_id,
    comparison,
    recommendation,
    scores
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111', -- Replace with actual project ID
        '22222222-2222-2222-2222-222222222222', -- Replace with actual scenario1 ID
        '33333333-3333-3333-3333-333333333333', -- Replace with actual scenario2 ID
        'The Enhanced Safety Focus provides comprehensive safety improvements but at a higher cost and longer timeline. The Cost-Efficient Alternative addresses critical issues with a more limited budget and faster implementation.',
        'Recommend the Enhanced Safety Focus scenario if budget allows, as it provides superior long-term safety benefits and aligns better with community feedback.',
        '{"overall": {"scenario1": 0.85, "scenario2": 0.75}, "categories": {"safety": {"scenario1": 0.9, "scenario2": 0.7}, "cost": {"scenario1": 0.6, "scenario2": 0.85}, "timeline": {"scenario1": 0.7, "scenario2": 0.8}}}'
    );
*/

-- Verification queries (commented out for production)
/*
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

-- Check the RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('project_scenarios', 'scenario_comparisons');
*/ 