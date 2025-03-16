-- Planning Manager v6 - Supabase Schema
-- Complete schema setup for the Planning Manager application

-- Drop everything and reinstall from scratch
-- Drop the entire public schema and recreate it (this removes ALL tables, functions, views, etc.)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    isGlobalAdmin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(agency_id, user_id)
);

-- Create projects table with enhanced fields for project management integration
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    location TEXT,
    geometry GEOMETRY,
    metadata JSONB DEFAULT '{}',
    score_data JSONB,
    analysis_results JSONB,
    
    -- Enhanced project management fields
    allocated_budget DECIMAL(12, 2),
    estimated_cost DECIMAL(12, 2),
    pse_budget DECIMAL(12, 2), -- Plans, Specifications & Estimates budget
    ce_budget DECIMAL(12, 2), -- Construction Engineering budget
    construction_budget DECIMAL(12, 2), -- Total construction cost
    right_of_way_budget DECIMAL(12, 2), -- Right of Way acquisition cost
    
    -- Environmental documentation fields
    nepa_status TEXT CHECK (nepa_status IN ('not_started', 'in_progress', 'completed', 'not_required')),
    ceqa_status TEXT CHECK (ceqa_status IN ('not_started', 'in_progress', 'completed', 'not_required')),
    environmental_document_type TEXT,
    environmental_clearance_date TIMESTAMPTZ,
    
    -- Project dates
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Map integration fields
    coordinates JSONB, -- {latitude: number, longitude: number}
    geojson JSONB,
    map_type TEXT DEFAULT 'standard',
    
    -- Other metadata
    lead_agency TEXT,
    partners TEXT[],
    tags TEXT[],
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Tracking fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);

-- Create project_users junction table
CREATE TABLE IF NOT EXISTS project_users (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'contributor', 'viewer')),
    PRIMARY KEY (project_id, user_id)
);

-- Create criteria table
CREATE TABLE IF NOT EXISTS criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('numeric', 'boolean', 'enum')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);

-- Create scoring table
CREATE TABLE IF NOT EXISTS scoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    notes TEXT,
    evaluated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, criteria_id),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);

-- Create project_scenarios table
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

-- Create scenario_comparisons table
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

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    voice_settings_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    thinking_capable BOOLEAN DEFAULT TRUE,
    vision_capable BOOLEAN DEFAULT FALSE,
    research_capable BOOLEAN DEFAULT TRUE,
    code_capable BOOLEAN DEFAULT FALSE,
    voice_capable BOOLEAN DEFAULT FALSE,
    max_token_limit INTEGER NOT NULL,
    cost_per_1k_tokens DECIMAL(10, 6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create voice_settings table
CREATE TABLE IF NOT EXISTS voice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voice_type TEXT DEFAULT 'natural',
    speed DECIMAL(4, 2) DEFAULT 1.0,
    pitch DECIMAL(4, 2) DEFAULT 1.0,
    volume DECIMAL(4, 2) DEFAULT 1.0,
    preferred_model_id UUID REFERENCES ai_models(id),
    wake_word TEXT DEFAULT 'hey assistant',
    language TEXT DEFAULT 'en-US',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create voice_command_logs table 
CREATE TABLE IF NOT EXISTS voice_command_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    model_id UUID REFERENCES ai_models(id),
    command_type TEXT NOT NULL,
    response_text TEXT,
    duration_ms INTEGER,
    was_successful BOOLEAN DEFAULT TRUE,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create document_attachments table for project files
CREATE TABLE IF NOT EXISTS document_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    completed_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create funding_sources table
CREATE TABLE IF NOT EXISTS funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL,
    fiscal_year TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create MCP servers table for Model Context Protocol integration
CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    capabilities TEXT[] NOT NULL,
    models TEXT[],
    max_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create agent_settings table for AI agent configuration
CREATE TABLE IF NOT EXISTS agent_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    prefer_mcp_over_openai BOOLEAN DEFAULT FALSE,
    analysis_agent_enabled BOOLEAN DEFAULT TRUE,
    planning_agent_enabled BOOLEAN DEFAULT TRUE,
    browser_agent_enabled BOOLEAN DEFAULT TRUE,
    computer_agent_enabled BOOLEAN DEFAULT TRUE,
    default_model_id UUID REFERENCES ai_models(id),
    system_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sync_status table for offline sync tracking
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_version INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(record_id, table_name)
);

-- Create sync_queue table for pending changes
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    client_id TEXT NOT NULL,
    conflict_resolution TEXT,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_geometry ON projects USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_criteria_agency_id ON criteria(agency_id);
CREATE INDEX IF NOT EXISTS idx_scoring_project_id ON scoring(project_id);
CREATE INDEX IF NOT EXISTS idx_scoring_criteria_id ON scoring(criteria_id);
CREATE INDEX IF NOT EXISTS idx_project_scenarios_project_id ON project_scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_project_scenarios_created_by ON project_scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_project_scenarios_parent_scenario_id ON project_scenarios(parent_scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_project_id ON scenario_comparisons(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_scenario1_id ON scenario_comparisons(scenario1_id);
CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_scenario2_id ON scenario_comparisons(scenario2_id);
CREATE INDEX IF NOT EXISTS idx_voice_settings_user_id ON voice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_logs_user_id ON voice_command_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_logs_model_id ON voice_command_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_project_id ON document_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_funding_sources_project_id ON funding_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_is_active ON mcp_servers(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_settings_agency_id ON agent_settings(agency_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_record_id ON sync_status(record_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_table_name ON sync_status(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_queue_record_id ON sync_queue(record_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_agency_id ON sync_queue(agency_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_client_id ON sync_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_processed_at ON sync_queue(processed_at);

-- Insert sample AI models if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ai_models WHERE name = 'GPT-4 Turbo') THEN
        INSERT INTO ai_models (name, provider, version, description, 
                          thinking_capable, vision_capable, research_capable, code_capable, voice_capable, 
                          max_token_limit, cost_per_1k_tokens) 
        VALUES 
        ('GPT-4 Turbo', 'OpenAI', '4 Turbo', 'Powerful, cost-effective model for complex tasks',
         TRUE, TRUE, TRUE, TRUE, FALSE, 128000, 0.015);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM ai_models WHERE name = 'Claude 3 Opus') THEN
        INSERT INTO ai_models (name, provider, version, description, 
                          thinking_capable, vision_capable, research_capable, code_capable, voice_capable, 
                          max_token_limit, cost_per_1k_tokens) 
        VALUES 
        ('Claude 3 Opus', 'Anthropic', '3 Opus', 'Anthropic''s most powerful model for highly complex tasks',
         TRUE, TRUE, TRUE, TRUE, FALSE, 150000, 0.018);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM ai_models WHERE name = 'Gemini Pro') THEN
        INSERT INTO ai_models (name, provider, version, description, 
                          thinking_capable, vision_capable, research_capable, code_capable, voice_capable, 
                          max_token_limit, cost_per_1k_tokens) 
        VALUES 
        ('Gemini Pro', 'Google', '1.0', 'Google''s advanced multimodal AI model',
         TRUE, TRUE, TRUE, FALSE, TRUE, 32000, 0.007);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM ai_models WHERE name = 'Mistral Large') THEN
        INSERT INTO ai_models (name, provider, version, description, 
                          thinking_capable, vision_capable, research_capable, code_capable, voice_capable, 
                          max_token_limit, cost_per_1k_tokens) 
        VALUES 
        ('Mistral Large', 'Mistral AI', 'Large', 'Powerful open-weight model with strong reasoning',
         TRUE, FALSE, TRUE, TRUE, FALSE, 32000, 0.006);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM ai_models WHERE name = 'Llama 3 70B') THEN
        INSERT INTO ai_models (name, provider, version, description, 
                          thinking_capable, vision_capable, research_capable, code_capable, voice_capable, 
                          max_token_limit, cost_per_1k_tokens) 
        VALUES 
        ('Llama 3 70B', 'Meta', '3', 'Open source large language model with strong generalist capabilities',
         TRUE, FALSE, FALSE, TRUE, FALSE, 8000, 0.004);
    END IF;
END $$;

-- Create a function to get or create voice settings for a user
CREATE OR REPLACE FUNCTION get_user_voice_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_settings_id UUID;
    v_profile_id UUID;
BEGIN
    -- Get the profile ID for the user
    SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_user_id;
    
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
    END IF;

    -- Check if voice settings exist
    SELECT id INTO v_settings_id FROM voice_settings WHERE user_id = v_profile_id;
    
    -- If not, create default settings
    IF v_settings_id IS NULL THEN
        INSERT INTO voice_settings (user_id)
        VALUES (v_profile_id)
        RETURNING id INTO v_settings_id;
        
        -- Update user_settings with the new voice_settings_id
        UPDATE user_settings
        SET voice_settings_id = v_settings_id
        WHERE user_id = v_profile_id;
    END IF;
    
    RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find the best model for a given task
CREATE OR REPLACE FUNCTION get_best_model_for_task(
    p_requires_thinking BOOLEAN DEFAULT FALSE,
    p_requires_vision BOOLEAN DEFAULT FALSE,
    p_requires_research BOOLEAN DEFAULT FALSE,
    p_requires_code BOOLEAN DEFAULT FALSE,
    p_requires_voice BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_model_id UUID;
BEGIN
    -- Find a model that meets all the requirements
    SELECT id INTO v_model_id
    FROM ai_models
    WHERE (NOT p_requires_thinking OR thinking_capable) AND
          (NOT p_requires_vision OR vision_capable) AND
          (NOT p_requires_research OR research_capable) AND
          (NOT p_requires_code OR code_capable) AND
          (NOT p_requires_voice OR voice_capable) AND
          is_active = TRUE
    ORDER BY cost_per_1k_tokens ASC
    LIMIT 1;
    
    -- If no model found, return the most capable general model
    IF v_model_id IS NULL THEN
        SELECT id INTO v_model_id
        FROM ai_models
        WHERE is_active = TRUE
        ORDER BY 
            thinking_capable::INT + 
            vision_capable::INT + 
            research_capable::INT + 
            code_capable::INT + 
            voice_capable::INT DESC,
            cost_per_1k_tokens ASC
        LIMIT 1;
    END IF;
    
    RETURN v_model_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to log voice commands
CREATE OR REPLACE FUNCTION log_voice_command(
    p_user_id UUID,
    p_command_text TEXT,
    p_model_id UUID,
    p_command_type TEXT,
    p_response_text TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_was_successful BOOLEAN DEFAULT TRUE,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_profile_id UUID;
BEGIN
    -- Get the profile ID for the user
    SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_user_id;
    
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
    END IF;

    -- Insert log entry
    INSERT INTO voice_command_logs (
        user_id, command_text, model_id, command_type, 
        response_text, duration_ms, was_successful, context
    )
    VALUES (
        v_profile_id, p_command_text, p_model_id, p_command_type,
        p_response_text, p_duration_ms, p_was_successful, p_context
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment version on update for sync tables
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for spatial project queries
CREATE OR REPLACE FUNCTION find_projects_in_area(
    p_lat FLOAT, 
    p_lng FLOAT, 
    p_radius_meters FLOAT,
    p_agency_id UUID
)
RETURNS SETOF projects AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM projects p
    WHERE 
        p.agency_id = p_agency_id AND
        ST_DWithin(
            p.geometry,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
            p_radius_meters
        );
END;
$$ LANGUAGE plpgsql;

-- Create or replace the views
CREATE OR REPLACE VIEW voice_activity_summary AS
SELECT
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    COUNT(vcl.id) AS total_commands,
    SUM(CASE WHEN vcl.was_successful THEN 1 ELSE 0 END) AS successful_commands,
    AVG(vcl.duration_ms) AS avg_duration_ms,
    MAX(vcl.created_at) AS last_command_time
FROM
    profiles p
LEFT JOIN
    voice_command_logs vcl ON p.id = vcl.user_id
GROUP BY
    p.id, p.first_name, p.last_name;

CREATE OR REPLACE VIEW model_usage_statistics AS
SELECT
    am.id AS model_id,
    am.name AS model_name,
    am.provider,
    COUNT(vcl.id) AS usage_count,
    SUM(CASE WHEN vcl.was_successful THEN 1 ELSE 0 END) AS successful_uses,
    AVG(vcl.duration_ms) AS avg_response_time_ms
FROM
    ai_models am
LEFT JOIN
    voice_command_logs vcl ON am.id = vcl.model_id
GROUP BY
    am.id, am.name, am.provider;

CREATE OR REPLACE VIEW project_status_summary AS
SELECT
    agency_id,
    status,
    COUNT(*) as count,
    SUM(estimated_cost) as total_estimated_cost,
    SUM(allocated_budget) as total_allocated_budget
FROM
    projects
GROUP BY
    agency_id, status;

-- Create triggers for version increments
CREATE TRIGGER projects_version_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER criteria_version_trigger
BEFORE UPDATE ON criteria
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER scoring_version_trigger
BEFORE UPDATE ON scoring
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER document_attachments_version_trigger
BEFORE UPDATE ON document_attachments
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Administrators can manage AI models') THEN
        CREATE POLICY "Administrators can manage AI models" ON ai_models
            USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isGlobalAdmin = TRUE));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Users can read public AI models') THEN
        CREATE POLICY "Users can read public AI models" ON ai_models FOR SELECT
            USING (is_active = TRUE);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_settings' AND policyname = 'Users can view and update their own voice settings') THEN
        CREATE POLICY "Users can view and update their own voice settings" ON voice_settings
            USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()))
            WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_settings' AND policyname = 'Administrators can view all voice settings') THEN
        CREATE POLICY "Administrators can view all voice settings" ON voice_settings FOR SELECT
            USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isGlobalAdmin = TRUE));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_command_logs' AND policyname = 'Users can view their own voice command logs') THEN
        CREATE POLICY "Users can view their own voice command logs" ON voice_command_logs FOR SELECT
            USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_command_logs' AND policyname = 'Administrators can view all voice command logs') THEN
        CREATE POLICY "Administrators can view all voice command logs" ON voice_command_logs FOR SELECT
            USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isGlobalAdmin = TRUE));
    END IF;
    
    -- Project management integration policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view projects from their agency') THEN
        CREATE POLICY "Users can view projects from their agency" ON projects FOR SELECT
            USING (agency_id IN (SELECT agency_id FROM profiles WHERE profiles.user_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Editors and Admins can modify projects from their agency') THEN
        CREATE POLICY "Editors and Admins can modify projects from their agency" ON projects FOR INSERT UPDATE DELETE
            USING (agency_id IN (SELECT agency_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'editor')))
            WITH CHECK (agency_id IN (SELECT agency_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'editor')));
    END IF;
    
    -- MCP and Agents SDK integration policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mcp_servers' AND policyname = 'Administrators can manage MCP servers') THEN
        CREATE POLICY "Administrators can manage MCP servers" ON mcp_servers
            USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isGlobalAdmin = TRUE));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_settings' AND policyname = 'Agency admins can manage agent settings') THEN
        CREATE POLICY "Agency admins can manage agent settings" ON agent_settings
            USING (agency_id IN (SELECT agency_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'))
            WITH CHECK (agency_id IN (SELECT agency_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));
    END IF;
END $$;

-- Set up Row Level Security for all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
