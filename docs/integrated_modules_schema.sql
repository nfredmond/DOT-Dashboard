-- Integrated Transportation Planning Modules Schema
-- This schema supports the integration of Benefit-Cost Analysis, GreenChAMP, and TrendNavigator

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    geometry GEOGRAPHY(GEOMETRY, 4326),
    status VARCHAR(50) DEFAULT 'planning',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    UNIQUE(organization_id, name)
);

-- =====================================================
-- GREENCHAMP TABLES
-- =====================================================

-- GreenChAMP Model Configurations
CREATE TABLE IF NOT EXISTS greenchamp_model_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    zone_system JSONB NOT NULL, -- TAZ definitions, population, employment
    network_config JSONB NOT NULL, -- Road and transit network configuration
    parameters JSONB NOT NULL, -- Model parameters (trip rates, friction factors, etc.)
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Transportation Analysis Zones
CREATE TABLE IF NOT EXISTS transportation_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model_config_id UUID REFERENCES greenchamp_model_configs(id) ON DELETE CASCADE,
    zone_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
    population INTEGER,
    households INTEGER,
    employment_total INTEGER,
    employment_retail INTEGER,
    employment_office INTEGER,
    employment_industrial INTEGER,
    employment_other INTEGER,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, model_config_id, zone_id)
);

-- Transportation Network Links
CREATE TABLE IF NOT EXISTS network_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model_config_id UUID REFERENCES greenchamp_model_configs(id) ON DELETE CASCADE,
    link_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    geometry GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    link_type VARCHAR(50), -- road, transit, bike, walk
    capacity INTEGER,
    lanes INTEGER,
    speed_limit INTEGER,
    length FLOAT,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, model_config_id, link_id)
);

-- GreenChAMP Model Runs
CREATE TABLE IF NOT EXISTS greenchamp_model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    model_config_id UUID NOT NULL REFERENCES greenchamp_model_configs(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0,
    options JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =====================================================
-- TRENDNAVIGATOR TABLES
-- =====================================================

-- Scenarios (for TrendNavigator)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    greenchamp_model_id UUID REFERENCES greenchamp_model_configs(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_year INTEGER NOT NULL,
    horizon_years INTEGER[] NOT NULL,
    assumptions JSONB DEFAULT '{}', -- Trend assumptions
    policy_packages JSONB DEFAULT '[]', -- Policy interventions
    status VARCHAR(50) DEFAULT 'draft',
    last_run_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Trend Definitions
CREATE TABLE IF NOT EXISTS trend_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- technology, behavior, policy, demographic
    default_values JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key)
);

-- Scenario Results
CREATE TABLE IF NOT EXISTS scenario_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    run_id UUID REFERENCES greenchamp_model_runs(id),
    status VARCHAR(50) DEFAULT 'pending',
    metrics JSONB NOT NULL, -- VMT, VHT, emissions, mode shares, etc.
    spatial_results JSONB, -- Zone-based and link-based results
    comparison_to_baseline JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario Insights (AI-generated)
CREATE TABLE IF NOT EXISTS scenario_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    result_id UUID REFERENCES scenario_results(id),
    insights JSONB NOT NULL,
    aspect VARCHAR(50), -- overall, emissions, congestion, equity, etc.
    confidence_score FLOAT,
    generated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BENEFIT-COST ANALYSIS TABLES
-- =====================================================

-- BCA Templates
CREATE TABLE IF NOT EXISTS benefit_cost_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL, -- Monetization parameters
    benefit_categories TEXT[] DEFAULT '{}',
    cost_categories TEXT[] DEFAULT '{}',
    default_discount_rate FLOAT DEFAULT 0.07,
    default_analysis_horizon INTEGER DEFAULT 20,
    grant_program JSONB, -- Grant-specific requirements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Benefit-Cost Analyses
CREATE TABLE IF NOT EXISTS benefit_cost_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES scenarios(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_year INTEGER NOT NULL,
    analysis_horizon INTEGER NOT NULL,
    discount_rate FLOAT NOT NULL,
    parameters JSONB NOT NULL, -- Monetization parameters used
    benefits JSONB DEFAULT '[]', -- Array of benefit calculations
    costs JSONB DEFAULT '[]', -- Array of cost calculations
    net_present_value NUMERIC,
    benefit_cost_ratio NUMERIC,
    internal_rate_of_return NUMERIC,
    payback_period INTEGER,
    sensitivity_analysis JSONB,
    monte_carlo_results JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =====================================================
-- INTEGRATION TABLES
-- =====================================================

-- Integrated Analysis Runs
CREATE TABLE IF NOT EXISTS integrated_analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    scenario_id UUID NOT NULL REFERENCES scenarios(id),
    bca_analysis_id UUID REFERENCES benefit_cost_analyses(id),
    greenchamp_run_id UUID REFERENCES greenchamp_model_runs(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    options JSONB DEFAULT '{}',
    results JSONB,
    insights JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Integration Results Cache
CREATE TABLE IF NOT EXISTS integration_results_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_run_id UUID NOT NULL REFERENCES integrated_analysis_runs(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL, -- combined_metrics, spatial_analysis, recommendations
    result_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(integration_run_id, result_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Spatial indexes
CREATE INDEX idx_projects_location ON projects USING GIST (location);
CREATE INDEX idx_projects_geometry ON projects USING GIST (geometry);
CREATE INDEX idx_zones_geometry ON transportation_zones USING GIST (geometry);
CREATE INDEX idx_links_geometry ON network_links USING GIST (geometry);

-- Foreign key indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_scenarios_org ON scenarios(organization_id);
CREATE INDEX idx_scenarios_model ON scenarios(greenchamp_model_id);
CREATE INDEX idx_results_scenario ON scenario_results(scenario_id);
CREATE INDEX idx_bca_project ON benefit_cost_analyses(project_id);
CREATE INDEX idx_bca_scenario ON benefit_cost_analyses(scenario_id);
CREATE INDEX idx_integrated_project ON integrated_analysis_runs(project_id);
CREATE INDEX idx_integrated_scenario ON integrated_analysis_runs(scenario_id);

-- Performance indexes
CREATE INDEX idx_scenarios_status ON scenarios(status);
CREATE INDEX idx_model_runs_status ON greenchamp_model_runs(status);
CREATE INDEX idx_bca_status ON benefit_cost_analyses(status);
CREATE INDEX idx_integrated_status ON integrated_analysis_runs(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenchamp_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenchamp_model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_cost_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_cost_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrated_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_results_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM organization_members WHERE organization_id = organizations.id
    ));

-- Projects: Users can view projects in their organization
CREATE POLICY "Users can view organization projects" ON projects
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- Apply similar policies to all other tables...

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bca_updated_at BEFORE UPDATE ON benefit_cost_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate integrated analysis score
CREATE OR REPLACE FUNCTION calculate_integrated_score(
    p_bca_ratio NUMERIC,
    p_emissions_reduction NUMERIC,
    p_accessibility_improvement NUMERIC,
    p_equity_score NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_economic_score NUMERIC;
    v_environmental_score NUMERIC;
    v_social_score NUMERIC;
    v_total_score NUMERIC;
BEGIN
    -- Economic component (40% weight)
    v_economic_score := LEAST(p_bca_ratio * 20, 40);
    
    -- Environmental component (30% weight)
    v_environmental_score := CASE 
        WHEN p_emissions_reduction > 0.2 THEN 30
        WHEN p_emissions_reduction > 0.1 THEN 20
        WHEN p_emissions_reduction > 0 THEN 10
        ELSE 0
    END;
    
    -- Social component (30% weight)
    v_social_score := (p_accessibility_improvement * 15) + (p_equity_score * 15);
    
    -- Total score (0-100)
    v_total_score := v_economic_score + v_environmental_score + v_social_score;
    
    RETURN ROUND(v_total_score, 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for active integrated analyses
CREATE OR REPLACE VIEW v_active_integrated_analyses AS
SELECT 
    ia.id,
    ia.name,
    ia.description,
    ia.status,
    ia.progress,
    p.name as project_name,
    s.name as scenario_name,
    bca.name as bca_name,
    ia.created_at,
    ia.created_by
FROM integrated_analysis_runs ia
JOIN projects p ON ia.project_id = p.id
JOIN scenarios s ON ia.scenario_id = s.id
LEFT JOIN benefit_cost_analyses bca ON ia.bca_analysis_id = bca.id
WHERE ia.status IN ('pending', 'running');

-- View for scenario comparison
CREATE OR REPLACE VIEW v_scenario_comparison AS
SELECT 
    s.id as scenario_id,
    s.name as scenario_name,
    s.base_year,
    s.horizon_years,
    sr.metrics->>'vmt' as vmt,
    sr.metrics->>'emissions_co2' as emissions_co2,
    sr.metrics->'mode_shares'->>'transit' as transit_share,
    sr.metrics->'mode_shares'->>'active' as active_share,
    sr.metrics->>'accessibility_score' as accessibility_score,
    sr.completed_at
FROM scenarios s
LEFT JOIN scenario_results sr ON s.id = sr.scenario_id
WHERE sr.status = 'completed';

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample trend definitions
INSERT INTO trend_definitions (organization_id, key, name, description, category, default_values) VALUES
    ('00000000-0000-0000-0000-000000000000', 'telecommuting', 'Telecommuting Rate', 'Percentage of workforce working from home', 'behavior', 
     '{"2025": 0.25, "2030": 0.35, "2040": 0.40, "2050": 0.45}'),
    ('00000000-0000-0000-0000-000000000000', 'ev_adoption', 'Electric Vehicle Adoption', 'Percentage of vehicles that are electric', 'technology',
     '{"2025": 0.15, "2030": 0.45, "2040": 0.75, "2050": 0.95}'),
    ('00000000-0000-0000-0000-000000000000', 'shared_mobility', 'Shared Mobility Usage', 'Percentage using shared mobility services', 'technology',
     '{"2025": 0.10, "2030": 0.20, "2040": 0.35, "2050": 0.50}');

-- Insert sample BCA templates
INSERT INTO benefit_cost_templates (name, description, parameters, benefit_categories, cost_categories) VALUES
    ('USDOT RAISE', 'Template for RAISE grant applications', 
     '{"valueOfTime": {"commuter": 25, "commercial": 35}, "emissionsCosts": {"co2": 100, "nox": 5000}}',
     '{"TRAVEL_TIME_SAVINGS", "SAFETY", "EMISSIONS", "HEALTH"}',
     '{"CAPITAL", "OPERATIONS", "MAINTENANCE"}'),
    ('FTA Capital Investment', 'Template for FTA CIG applications',
     '{"valueOfTime": {"commuter": 28, "commercial": 40}, "transitBenefits": {"newRiders": 15}}',
     '{"TRAVEL_TIME_SAVINGS", "TRANSIT_BENEFITS", "EMISSIONS", "ECONOMIC_DEVELOPMENT"}',
     '{"CAPITAL", "OPERATIONS", "MAINTENANCE", "REPLACEMENT"}'); 