-- GreenChAMP and TrendNavigator Schema Extension for Planning Manager
-- This file contains SQL statements to extend the Planning Manager database
-- with tables for the GreenChAMP and TrendNavigator modules.

-----------------
-- Create TYPES --
-----------------

-- Run status for model runs
CREATE TYPE run_status AS ENUM ('queued', 'running', 'completed', 'failed');

-- Impact assessment for insights
CREATE TYPE impact_type AS ENUM ('positive', 'negative', 'neutral');

---------------------
-- Create TABLES ----
---------------------

-- TrendNavigator Configurations
CREATE TABLE trend_navigator_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    model_parameters JSONB NOT NULL,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenarios
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_year INTEGER NOT NULL,
    horizon_years INTEGER[] NOT NULL,
    assumptions JSONB NOT NULL DEFAULT '[]'::JSONB,
    policy_packages JSONB NOT NULL DEFAULT '[]'::JSONB,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    baseline_scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GreenChAMP Model Configurations
CREATE TABLE greenchamp_model_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GreenChAMP Model Runs
CREATE TABLE greenchamp_model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    status run_status NOT NULL DEFAULT 'queued',
    error_message TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    model_config_id UUID REFERENCES greenchamp_model_configs(id),
    model_version TEXT NOT NULL,
    results_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario Results
CREATE TABLE scenario_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    horizon_years INTEGER[] NOT NULL,
    aggregate_metrics JSONB NOT NULL,
    metrics JSONB NOT NULL,
    model_run_id UUID REFERENCES greenchamp_model_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scenario_id)
);

-- Scenario Insights
CREATE TABLE scenario_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    insights JSONB NOT NULL,
    comparison_to_baseline TEXT,
    recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scenario_id)
);

-- Zone Definitions
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    population INTEGER NOT NULL,
    employment INTEGER NOT NULL,
    area NUMERIC(10, 2) NOT NULL, -- in sq km
    centroid GEOMETRY(POINT, 4326) NOT NULL,
    geom GEOMETRY(POLYGON, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Network Links
CREATE TABLE network_links (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_node INTEGER NOT NULL,
    to_node INTEGER NOT NULL,
    length NUMERIC(10, 2) NOT NULL, -- in km
    freeflow_speed NUMERIC(5, 2) NOT NULL, -- in km/h
    capacity INTEGER NOT NULL, -- in vehicles per hour
    lanes INTEGER NOT NULL,
    link_type TEXT NOT NULL, -- 'highway', 'arterial', 'collector', 'local'
    mode TEXT NOT NULL, -- 'road', 'transit', 'bike', 'walk'
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Queries (for auditing and usage tracking)
CREATE TABLE agent_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    query TEXT NOT NULL,
    context JSONB,
    result TEXT,
    model TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for scenario comparisons
CREATE TABLE scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_ids UUID[] NOT NULL,
  baseline_scenario_id UUID,
  comparison_insights TEXT NOT NULL,
  metrics_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

----------------------------
-- Row Level Security ------
----------------------------

-- Enable Row Level Security
ALTER TABLE trend_navigator_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenchamp_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenchamp_model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for trend_navigator_configs
CREATE POLICY "Users can view their organization's TrendNavigator configs"
    ON trend_navigator_configs FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create TrendNavigator configs for their organization"
    ON trend_navigator_configs FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's TrendNavigator configs"
    ON trend_navigator_configs FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their organization's TrendNavigator configs"
    ON trend_navigator_configs FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

-- Create policies for scenarios
CREATE POLICY "Users can view their organization's scenarios"
    ON scenarios FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create scenarios for their organization"
    ON scenarios FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's scenarios"
    ON scenarios FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their organization's scenarios"
    ON scenarios FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
    ));

-- Create policies for the other tables (similar pattern as above)
-- For brevity, not all policies are shown here but should follow the same pattern
-- of organization-based access control

-- Add indexes for faster retrieval
CREATE INDEX idx_scenario_comparisons_scenario_ids ON scenario_comparisons USING GIN (scenario_ids);
CREATE INDEX idx_scenario_comparisons_baseline ON scenario_comparisons (baseline_scenario_id);
CREATE INDEX idx_scenario_comparisons_created_at ON scenario_comparisons (created_at);

-- Add RLS policies for scenario_comparisons
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to select scenario comparisons that include scenarios from their organization
CREATE POLICY select_scenario_comparisons ON scenario_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN profiles p ON p.organization_id = s.organization_id
      WHERE s.id = ANY(scenario_comparisons.scenario_ids)
      AND p.id = auth.uid()
    )
  );

-- Create a policy that allows users to insert scenario comparisons for scenarios from their organization
CREATE POLICY insert_scenario_comparisons ON scenario_comparisons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN profiles p ON p.organization_id = s.organization_id
      WHERE s.id = ANY(scenario_comparisons.scenario_ids)
      AND p.id = auth.uid()
    )
  );

-- Create a policy that allows users to update scenario comparisons that include scenarios from their organization
CREATE POLICY update_scenario_comparisons ON scenario_comparisons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN profiles p ON p.organization_id = s.organization_id
      WHERE s.id = ANY(scenario_comparisons.scenario_ids)
      AND p.id = auth.uid()
    )
  );

-- Create a policy that allows users to delete scenario comparisons that include scenarios from their organization
CREATE POLICY delete_scenario_comparisons ON scenario_comparisons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM scenarios s
      JOIN profiles p ON p.organization_id = s.organization_id
      WHERE s.id = ANY(scenario_comparisons.scenario_ids)
      AND p.id = auth.uid()
    )
  );

----------------------------
-- Create indexes ----------
----------------------------

-- Indexes for scenarios
CREATE INDEX scenarios_organization_id_idx ON scenarios (organization_id);
CREATE INDEX scenarios_user_id_idx ON scenarios (user_id);
CREATE INDEX scenarios_baseline_scenario_id_idx ON scenarios (baseline_scenario_id);

-- Indexes for scenario_results
CREATE INDEX scenario_results_scenario_id_idx ON scenario_results (scenario_id);
CREATE INDEX scenario_results_model_run_id_idx ON scenario_results (model_run_id);

-- Indexes for greenchamp_model_runs
CREATE INDEX greenchamp_model_runs_scenario_id_idx ON greenchamp_model_runs (scenario_id);
CREATE INDEX greenchamp_model_runs_status_idx ON greenchamp_model_runs (status);

-- Indexes for zones and network_links (with GIS support)
CREATE INDEX zones_organization_id_idx ON zones (organization_id);
CREATE INDEX zones_geom_idx ON zones USING GIST (geom);
CREATE INDEX zones_centroid_idx ON zones USING GIST (centroid);

CREATE INDEX network_links_organization_id_idx ON network_links (organization_id);
CREATE INDEX network_links_geom_idx ON network_links USING GIST (geom);
CREATE INDEX network_links_from_to_idx ON network_links (from_node, to_node);

-- Indexes for agent_queries
CREATE INDEX agent_queries_user_id_idx ON agent_queries (user_id);
CREATE INDEX agent_queries_created_at_idx ON agent_queries (created_at);

----------------------------
-- Functions ---------------
----------------------------

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

----------------------------
-- Triggers ----------------
----------------------------

-- Triggers to update the 'updated_at' column on updates
CREATE TRIGGER update_trend_navigator_configs_updated_at
BEFORE UPDATE ON trend_navigator_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at
BEFORE UPDATE ON scenarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_greenchamp_model_configs_updated_at
BEFORE UPDATE ON greenchamp_model_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_greenchamp_model_runs_updated_at
BEFORE UPDATE ON greenchamp_model_runs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenario_results_updated_at
BEFORE UPDATE ON scenario_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenario_insights_updated_at
BEFORE UPDATE ON scenario_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
BEFORE UPDATE ON zones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_links_updated_at
BEFORE UPDATE ON network_links
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
