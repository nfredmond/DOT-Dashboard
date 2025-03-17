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
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Planning', 'Design', 'Environmental', 'RightOfWay', 'Construction', 'Complete', 'Cancelled', 'On Hold', 'Not Started')),
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
    pe_amount DECIMAL(12, 2), -- Preliminary Engineering amount
    contingency_amount DECIMAL(12, 2), -- Contingency funds
    
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

-- Create project_milestones table for tracking important project dates
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    phase TEXT,
    priority INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create funding_sources table to track detailed project funding
CREATE TABLE IF NOT EXISTS funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    funding_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create MCP servers table for Multi-Client Processing
CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_concurrent_requests INTEGER NOT NULL DEFAULT 10,
    priority INTEGER NOT NULL DEFAULT 5,
    capabilities JSONB DEFAULT '{}',
    health_status TEXT DEFAULT 'unknown',
    last_health_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create agent settings table
CREATE TABLE IF NOT EXISTS agent_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_models TEXT[],
    default_model_id UUID REFERENCES ai_models(id),
    capability_flags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sync_status table to track data synchronization state
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('synced', 'pending', 'failed')),
    sync_error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(record_id, table_name)
);

-- Create sync_queue table to manage sync operations
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    client_id TEXT
);

-- Community feedback tables
CREATE TABLE IF NOT EXISTS community_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'suggestion', 'issue', 'question', 'praise')),
    category TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'under_review', 'planned', 'in_progress', 'completed', 'declined', 'duplicate')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Public/privacy fields
    is_public BOOLEAN DEFAULT TRUE,
    moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    
    -- Location data
    location_description TEXT,
    latitude FLOAT,
    longitude FLOAT,
    geometry GEOMETRY,
    address TEXT,
    
    -- Media
    media_urls TEXT[],
    media_types TEXT[],
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Community feedback votes
CREATE TABLE IF NOT EXISTS community_feedback_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES community_feedback(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(feedback_id, user_id)
);

-- Community feedback responses (from agency to feedback)
CREATE TABLE IF NOT EXISTS community_feedback_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES community_feedback(id) ON DELETE CASCADE,
    responded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    is_official BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community feedback categories
CREATE TABLE IF NOT EXISTS community_feedback_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES community_feedback_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agency_id, name)
);

-- Agency community feedback settings
CREATE TABLE IF NOT EXISTS community_feedback_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    moderation_required BOOLEAN DEFAULT TRUE,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    notify_on_new BOOLEAN DEFAULT TRUE,
    auto_publish BOOLEAN DEFAULT FALSE,
    email_notifications TEXT[],
    required_fields TEXT[],
    custom_fields JSONB DEFAULT '[]',
    terms_and_conditions TEXT,
    welcome_message TEXT,
    thank_you_message TEXT,
    custom_statuses JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agency_id)
);

-- Create project_invoices table to track project invoices
CREATE TABLE IF NOT EXISTS project_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')),
    invoice_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    paid_date TIMESTAMPTZ,
    vendor TEXT NOT NULL,
    description TEXT,
    payment_method TEXT,
    file_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_contracts table to track contracts
CREATE TABLE IF NOT EXISTS project_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contract_number TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    vendor TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    scope_of_work TEXT,
    file_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create construction_progress table to track construction progress
CREATE TABLE IF NOT EXISTS construction_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_date TIMESTAMPTZ NOT NULL,
    progress_percent DECIMAL(5, 2) NOT NULL,
    work_completed TEXT,
    issues TEXT,
    next_steps TEXT,
    weather_conditions TEXT,
    days_delayed INTEGER DEFAULT 0,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create custom_fields table to store project custom fields
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agency_id, field_name)
);

-- Create custom_field_values table to store values for custom fields
CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    field_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, field_id)
);

-- Create indexes
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
CREATE INDEX IF NOT EXISTS idx_sync_queue_processed_at ON sync_queue(processed_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_client_id ON sync_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_project_id ON project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_progress_project_id ON construction_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_agency_id ON custom_fields(agency_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_project_id ON custom_field_values(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field_id ON custom_field_values(field_id);

-- Create indexes for community feedback tables
CREATE INDEX IF NOT EXISTS idx_community_feedback_agency_id ON community_feedback(agency_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_project_id ON community_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_user_id ON community_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback(status);
CREATE INDEX IF NOT EXISTS idx_community_feedback_feedback_type ON community_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_community_feedback_category ON community_feedback(category);
CREATE INDEX IF NOT EXISTS idx_community_feedback_geometry ON community_feedback USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_community_feedback_votes_feedback_id ON community_feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_votes_user_id ON community_feedback_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_responses_feedback_id ON community_feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_categories_agency_id ON community_feedback_categories(agency_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_settings_agency_id ON community_feedback_settings(agency_id);

-- Create function to get user voice settings
CREATE OR REPLACE FUNCTION get_user_voice_settings(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    voice_type TEXT,
    speed DECIMAL(4, 2),
    pitch DECIMAL(4, 2),
    volume DECIMAL(4, 2),
    wake_word TEXT,
    language TEXT,
    model_name TEXT,
    model_provider TEXT,
    model_version TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vs.id,
        vs.user_id,
        vs.voice_type,
        vs.speed,
        vs.pitch,
        vs.volume,
        vs.wake_word,
        vs.language,
        m.name,
        m.provider,
        m.version
    FROM
        voice_settings vs
    LEFT JOIN
        ai_models m ON vs.preferred_model_id = m.id
    WHERE
        vs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to find the best AI model for a task
CREATE OR REPLACE FUNCTION get_best_model_for_task(
    p_task_type TEXT,
    p_require_thinking BOOLEAN DEFAULT FALSE,
    p_require_vision BOOLEAN DEFAULT FALSE,
    p_require_voice BOOLEAN DEFAULT FALSE,
    p_require_research BOOLEAN DEFAULT FALSE,
    p_require_code BOOLEAN DEFAULT FALSE,
    p_min_token_limit INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    provider TEXT,
    version TEXT,
    max_token_limit INTEGER,
    cost_per_1k_tokens DECIMAL(10, 6)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.provider,
        m.version,
        m.max_token_limit,
        m.cost_per_1k_tokens
    FROM
        ai_models m
    WHERE
        m.is_active = TRUE
        AND (NOT p_require_thinking OR m.thinking_capable = TRUE)
        AND (NOT p_require_vision OR m.vision_capable = TRUE)
        AND (NOT p_require_voice OR m.voice_capable = TRUE)
        AND (NOT p_require_research OR m.research_capable = TRUE)
        AND (NOT p_require_code OR m.code_capable = TRUE)
        AND m.max_token_limit >= p_min_token_limit
    ORDER BY
        -- Order logic based on task type
        CASE
            WHEN p_task_type = 'conversation' THEN m.cost_per_1k_tokens
            WHEN p_task_type = 'analysis' THEN m.max_token_limit DESC
            ELSE m.cost_per_1k_tokens
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to log voice commands
CREATE OR REPLACE FUNCTION log_voice_command(
    p_user_id UUID,
    p_command_text TEXT,
    p_model_id UUID,
    p_command_type TEXT,
    p_response_text TEXT,
    p_duration_ms INTEGER,
    p_was_successful BOOLEAN,
    p_context JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO voice_command_logs (
        user_id,
        command_text,
        model_id,
        command_type,
        response_text,
        duration_ms,
        was_successful,
        context
    ) VALUES (
        p_user_id,
        p_command_text,
        p_model_id,
        p_command_type,
        p_response_text,
        p_duration_ms,
        p_was_successful,
        p_context
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment version number for sync
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.is_synced = FALSE;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to find projects in a geographic area
CREATE OR REPLACE FUNCTION find_projects_in_area(
    p_lat FLOAT, 
    p_lng FLOAT, 
    p_radius_meters FLOAT,
    p_agency_id UUID
)
RETURNS SETOF projects AS $$
DECLARE
    search_point GEOMETRY;
BEGIN
    -- Create a point from the provided lat/lng
    search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
    
    -- Return projects that are within the specified radius
    RETURN QUERY
    SELECT *
    FROM projects
    WHERE 
        agency_id = p_agency_id
        AND ST_DWithin(
            geometry,
            search_point,
            p_radius_meters
        );
END;
$$ LANGUAGE plpgsql;

-- Create view for voice activity summary
CREATE OR REPLACE VIEW voice_activity_summary AS
SELECT
    user_id,
    DATE_TRUNC('day', created_at) AS activity_date,
    COUNT(*) AS total_commands,
    SUM(CASE WHEN was_successful THEN 1 ELSE 0 END) AS successful_commands,
    SUM(CASE WHEN NOT was_successful THEN 1 ELSE 0 END) AS failed_commands,
    AVG(duration_ms) AS avg_duration_ms,
    MAX(duration_ms) AS max_duration_ms,
    MIN(duration_ms) AS min_duration_ms
FROM
    voice_command_logs
GROUP BY
    user_id, DATE_TRUNC('day', created_at)
ORDER BY
    activity_date DESC;

-- Create view for AI model usage statistics
CREATE OR REPLACE VIEW model_usage_statistics AS
SELECT
    m.id AS model_id,
    m.name AS model_name,
    m.provider AS provider,
    COUNT(vcl.id) AS usage_count,
    AVG(vcl.duration_ms) AS avg_response_time,
    SUM(CASE WHEN vcl.was_successful THEN 1 ELSE 0 END) AS successful_calls,
    SUM(CASE WHEN NOT vcl.was_successful THEN 1 ELSE 0 END) AS failed_calls,
    (SUM(CASE WHEN vcl.was_successful THEN 1 ELSE 0 END)::float / COUNT(vcl.id)) * 100 AS success_rate
FROM
    ai_models m
LEFT JOIN
    voice_command_logs vcl ON m.id = vcl.model_id
GROUP BY
    m.id, m.name, m.provider
ORDER BY
    usage_count DESC;

-- Create view for project status summary
CREATE OR REPLACE VIEW project_status_summary AS
SELECT
    agency_id,
    status,
    COUNT(*) AS project_count,
    SUM(estimated_cost) AS total_estimated_cost,
    SUM(allocated_budget) AS total_allocated_budget,
    AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400) AS avg_duration_days
FROM
    projects
GROUP BY
    agency_id, status
ORDER BY
    agency_id, project_count DESC;

-- Create triggers for version tracking
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

-- Initialize with default data for demonstration
-- Default agency
INSERT INTO agencies (name, subdomain, logo_url, settings)
VALUES (
    'Demo Planning Agency',
    'demo',
    'https://via.placeholder.com/150',
    '{"theme": "blue", "enableVoice": true, "allowPublicFeedback": true}'
);

-- Sample AI models
INSERT INTO ai_models (
    name, provider, version, description, 
    thinking_capable, vision_capable, research_capable, code_capable, voice_capable,
    max_token_limit, cost_per_1k_tokens
) VALUES
    ('Claude 3.5 Sonnet', 'Anthropic', '3.5', 'Advanced reasoning with high versatility', 
     true, true, true, true, false, 200000, 0.003),
    ('Claude 3 Haiku', 'Anthropic', '3.0', 'Fast and efficient for routine tasks', 
     true, false, true, false, false, 70000, 0.00025),
    ('GPT-4o', 'OpenAI', '4o', 'Multimodal capabilities with strong reasoning', 
     true, true, true, true, false, 128000, 0.005),
    ('TTS-1', 'OpenAI', '1.0', 'Text-to-speech model for voice generation', 
     false, false, false, false, true, 4096, 0.00015);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
