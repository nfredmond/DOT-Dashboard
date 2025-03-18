-- Planning Manager v6 - Supabase Schema
-- Complete schema setup for the Planning Manager application
-- Including GreenChAMP (Green DOT Chained Activity Modelling Process) integration

-- Drop everything and reinstall from scratch
-- This will completely remove the current schema and recreate it
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_type TEXT NOT NULL DEFAULT 'agency',
  subdomain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members junction table
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Create indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Create agencies table (legacy, moved to organizations)
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

-- Scenarios table for modeling different project scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for scenarios
CREATE INDEX IF NOT EXISTS idx_scenarios_organization_id ON scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);

-- Create baseline_scenarios table for GreenChAMP
CREATE TABLE IF NOT EXISTS baseline_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  zone_data JSONB NOT NULL,
  network_data JSONB NOT NULL,
  parameters JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for baseline scenarios
CREATE INDEX IF NOT EXISTS idx_baseline_scenarios_organization_id ON baseline_scenarios(organization_id);

-- Create trend_definitions table for GreenChAMP TrendNavigator
CREATE TABLE IF NOT EXISTS trend_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  impacts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for trend definitions
CREATE INDEX IF NOT EXISTS idx_trend_definitions_organization_id ON trend_definitions(organization_id);

-- Create trend_scenarios table for GreenChAMP TrendNavigator
CREATE TABLE IF NOT EXISTS trend_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trendImpacts JSONB NOT NULL,
  custom_data JSONB,
  result_id UUID,
  run_status TEXT NOT NULL DEFAULT 'draft' CHECK (run_status IN ('draft', 'running', 'completed', 'failed')),
  last_run_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for trend scenarios
CREATE INDEX IF NOT EXISTS idx_trend_scenarios_organization_id ON trend_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_trend_scenarios_run_status ON trend_scenarios(run_status);
CREATE INDEX IF NOT EXISTS idx_trend_scenarios_result_id ON trend_scenarios(result_id);

-- Create scenario_results table for GreenChAMP
CREATE TABLE IF NOT EXISTS scenario_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID,
  trend_scenario_id UUID,
  result_type TEXT NOT NULL,
  metrics JSONB NOT NULL,
  emissions JSONB,
  mode_shares JSONB,
  network_metrics JSONB,
  congestion JSONB,
  accessibility JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for scenario results
CREATE INDEX IF NOT EXISTS idx_scenario_results_scenario_id ON scenario_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_trend_scenario_id ON scenario_results(trend_scenario_id);

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

-- Public Records Request Management System Tables
-- These tables support the public records request functionality

-- Table for request submitters
CREATE TABLE IF NOT EXISTS prr_requesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    organization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for public records requests
CREATE TABLE IF NOT EXISTS prr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'submitted', 'initial_review', 'gathering_records', 
        'legal_review', 'records_ready', 'completed', 
        'denied', 'withdrawn', 'overdue'
    )),
    request_type TEXT NOT NULL CHECK (request_type IN (
        'general', 'project', 'financial', 'environmental', 'other'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    requester_id UUID REFERENCES prr_requesters(id),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    from_date TIMESTAMPTZ,
    to_date TIMESTAMPTZ,
    format_preference TEXT NOT NULL CHECK (format_preference IN ('electronic', 'paper')),
    estimated_completion_date TIMESTAMPTZ,
    special_instructions TEXT,
    legal_exemptions TEXT[],
    fee_estimate DECIMAL(10,2),
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_waived BOOLEAN DEFAULT FALSE,
    internal_notes TEXT,
    is_expedited BOOLEAN DEFAULT FALSE,
    needs_clarification BOOLEAN DEFAULT FALSE,
    extension_requested BOOLEAN DEFAULT FALSE,
    extension_reason TEXT,
    extension_date TIMESTAMPTZ
);

-- Table for request timeline entries
CREATE TABLE IF NOT EXISTS prr_request_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'submitted', 'initial_review', 'gathering_records', 
        'legal_review', 'records_ready', 'completed', 
        'denied', 'withdrawn', 'overdue'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL -- User ID or 'system'
);

-- Table for request documents
CREATE TABLE IF NOT EXISTS prr_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'collecting', 'ready', 'released')),
    reviewed_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    redacted BOOLEAN DEFAULT FALSE,
    page_count INTEGER
);

-- Table for messages between requesters and staff
CREATE TABLE IF NOT EXISTS prr_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL, -- Can be user ID or requester ID
    sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'requester')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create a storage bucket for document files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_records_documents', 'Public Records Documents', false)
ON CONFLICT (id) DO NOTHING;

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

-- Indexes for public records request tables
CREATE INDEX IF NOT EXISTS idx_prr_requests_status ON prr_requests(status);
CREATE INDEX IF NOT EXISTS idx_prr_requests_request_type ON prr_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_prr_requests_requester ON prr_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_prr_requests_agency ON prr_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_prr_requests_assigned_to ON prr_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prr_requests_project_id ON prr_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_prr_timeline_request ON prr_request_timeline(request_id);
CREATE INDEX IF NOT EXISTS idx_prr_documents_request ON prr_documents(request_id);
CREATE INDEX IF NOT EXISTS idx_prr_messages_request ON prr_messages(request_id);

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
        CASE 
            WHEN p_task_type = 'analysis' THEN m.max_token_limit
            WHEN p_task_type = 'conversation' THEN m.cost_per_1k_tokens
            ELSE m.cost_per_1k_tokens
        END DESC
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

-- Create stored procedures for public records request analytics
CREATE OR REPLACE FUNCTION get_prr_request_counts(agency_id_param UUID)
RETURNS TABLE(total_count BIGINT, open_count BIGINT, overdue_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status NOT IN ('completed', 'denied', 'withdrawn')) as open_count,
        COUNT(*) FILTER (WHERE status = 'overdue' OR (status NOT IN ('completed', 'denied', 'withdrawn') AND due_date < NOW())) as overdue_count
    FROM prr_requests
    WHERE agency_id = agency_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_avg_completion_time(agency_id_param UUID)
RETURNS TABLE(avg_days FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(EXTRACT(EPOCH FROM (completed_date - created_at)) / 86400) as avg_days
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND status = 'completed'
    AND completed_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_request_volume_by_month(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(month TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as count
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND created_at >= start_date_param
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_request_types(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        request_type as type,
        COUNT(*) as count
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND created_at >= start_date_param
    GROUP BY request_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_department_workload(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(department TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(p.department, 'Unassigned') as department,
        COUNT(*) as count
    FROM prr_requests r
    LEFT JOIN profiles p ON r.assigned_to = p.user_id
    WHERE r.agency_id = agency_id_param
    AND r.created_at >= start_date_param
    GROUP BY p.department
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Row-level security policies for public records tables
ALTER TABLE prr_requesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_request_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_messages ENABLE ROW LEVEL SECURITY;

-- Policies for requesters
CREATE POLICY "Admins and assigned staff can view requesters"
ON prr_requesters FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.requester_id = prr_requesters.id
        AND (
            p.user_id = auth.uid() AND p.role = 'admin'
            OR
            pr.assigned_to = auth.uid()
        )
    )
);

-- Policies for requests
CREATE POLICY "Requesters can view their own requests"
ON prr_requests FOR SELECT
TO authenticated
USING (
    requester_id IN (
        SELECT id FROM prr_requesters
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Admins can view all agency requests"
ON prr_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

CREATE POLICY "Assigned staff can view their requests"
ON prr_requests FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Admins can create requests"
ON prr_requests FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

CREATE POLICY "Assigned staff can update their requests"
ON prr_requests FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Admins can update agency requests"
ON prr_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

-- Policies for storage buckets access
CREATE POLICY "Public records documents are accessible to authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'public_records_documents' AND (
    -- Allow access if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow access if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

CREATE POLICY "Staff can upload public records documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public_records_documents' AND (
    -- Allow if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

CREATE POLICY "Staff can update public records documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public_records_documents' AND (
    -- Allow if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

-- Create tables for activity-based modeling

-- Person agents for activity-based modeling
CREATE TABLE IF NOT EXISTS person_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  home_zone_id TEXT NOT NULL,
  work_zone_id TEXT,
  school_zone_id TEXT,
  age INTEGER NOT NULL,
  gender TEXT,
  employment_status TEXT NOT NULL,
  student_status TEXT NOT NULL,
  household_id TEXT NOT NULL,
  household_income_group TEXT NOT NULL,
  household_size INTEGER NOT NULL,
  household_vehicles INTEGER NOT NULL,
  driver_license BOOLEAN NOT NULL DEFAULT TRUE,
  has_transit_pass BOOLEAN NOT NULL DEFAULT FALSE,
  has_mobility_limitation BOOLEAN NOT NULL DEFAULT FALSE,
  simulation_weight FLOAT NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity types and parameters
CREATE TABLE IF NOT EXISTS activity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  typical_duration_minutes INTEGER,
  mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  time_window_start TIME,
  time_window_end TIME,
  location_flexibility INTEGER NOT NULL DEFAULT 0,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Activities performed by person agents
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  person_agent_id UUID NOT NULL REFERENCES person_agents(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES activity_types(id) ON DELETE CASCADE,
  location_zone_id TEXT NOT NULL,
  location_coordinates GEOMETRY(POINT) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  flexibility_score INTEGER NOT NULL DEFAULT 0,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Travel itineraries between activities
CREATE TABLE IF NOT EXISTS travel_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  person_agent_id UUID NOT NULL REFERENCES person_agents(id) ON DELETE CASCADE,
  origin_activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  destination_activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  origin_zone_id TEXT NOT NULL,
  destination_zone_id TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  travel_mode TEXT NOT NULL,
  travel_distance_meters FLOAT NOT NULL,
  travel_time_minutes FLOAT NOT NULL,
  wait_time_minutes FLOAT NOT NULL DEFAULT 0,
  transfer_count INTEGER NOT NULL DEFAULT 0,
  cost FLOAT NOT NULL DEFAULT 0,
  path_geometry GEOMETRY(LINESTRING),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity locations for reference
CREATE TABLE IF NOT EXISTS activity_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  coordinates GEOMETRY(POINT) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_name, organization_id)
);

-- Simulation runs for activity-based modeling
CREATE TABLE IF NOT EXISTS activity_simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued',
  configuration JSONB NOT NULL DEFAULT '{}',
  agent_count INTEGER NOT NULL DEFAULT 0,
  activity_count INTEGER NOT NULL DEFAULT 0,
  trip_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  results_summary JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activity-based modeling tables
CREATE INDEX IF NOT EXISTS idx_person_agents_scenario_id ON person_agents(scenario_id);
CREATE INDEX IF NOT EXISTS idx_person_agents_home_zone_id ON person_agents(home_zone_id);
CREATE INDEX IF NOT EXISTS idx_person_agents_household_id ON person_agents(household_id);

CREATE INDEX IF NOT EXISTS idx_activity_types_organization_id ON activity_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_types_name ON activity_types(name);
CREATE INDEX IF NOT EXISTS idx_activity_types_mandatory ON activity_types(mandatory);

CREATE INDEX IF NOT EXISTS idx_activities_scenario_id ON activities(scenario_id);
CREATE INDEX IF NOT EXISTS idx_activities_person_agent_id ON activities(person_agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type_id ON activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_activities_location_zone_id ON activities(location_zone_id);
CREATE INDEX IF NOT EXISTS idx_activities_location_coordinates ON activities USING GIST (location_coordinates);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_end_time ON activities(end_time);

CREATE INDEX IF NOT EXISTS idx_travel_itineraries_scenario_id ON travel_itineraries(scenario_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_person_agent_id ON travel_itineraries(person_agent_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_origin_activity_id ON travel_itineraries(origin_activity_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_destination_activity_id ON travel_itineraries(destination_activity_id);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_travel_mode ON travel_itineraries(travel_mode);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_departure_time ON travel_itineraries(departure_time);
CREATE INDEX IF NOT EXISTS idx_travel_itineraries_path_geometry ON travel_itineraries USING GIST (path_geometry);

CREATE INDEX IF NOT EXISTS idx_activity_locations_organization_id ON activity_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_locations_zone_id ON activity_locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_activity_locations_location_type ON activity_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_activity_locations_coordinates ON activity_locations USING GIST (coordinates);

CREATE INDEX IF NOT EXISTS idx_activity_simulation_runs_scenario_id ON activity_simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_activity_simulation_runs_status ON activity_simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_activity_simulation_runs_created_by ON activity_simulation_runs(created_by);

-- End of schema definition

-- Include GreenChAMP and TrendNavigator Schema Extensions
-- This ensures all necessary GreenChAMP tables, types, and functions are created

-- Create types if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_status') THEN
    CREATE TYPE run_status AS ENUM ('queued', 'running', 'completed', 'failed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_type') THEN
    CREATE TYPE impact_type AS ENUM ('positive', 'negative', 'neutral');
  END IF;
END $$;

-- Create TrendNavigator Configurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS trend_navigator_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_year INTEGER NOT NULL,
  horizon_years INTEGER[] NOT NULL DEFAULT '{5, 10, 30}',
  trend_variables JSONB NOT NULL DEFAULT '{}',
  default_parameters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Trend Variables table if it doesn't exist
CREATE TABLE IF NOT EXISTS trend_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  default_value FLOAT NOT NULL,
  min_value FLOAT NOT NULL,
  max_value FLOAT NOT NULL,
  step FLOAT NOT NULL DEFAULT 0.01,
  unit TEXT,
  impact_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create Scenario Insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS scenario_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metrics JSONB,
  impact impact_type NOT NULL DEFAULT 'neutral',
  confidence FLOAT NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'
);

-- Create indexes for GreenChAMP and TrendNavigator tables
CREATE INDEX IF NOT EXISTS idx_trend_navigator_configs_organization_id ON trend_navigator_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_trend_variables_organization_id ON trend_variables(organization_id);
CREATE INDEX IF NOT EXISTS idx_scenario_insights_scenario_id ON scenario_insights(scenario_id);

-- Create functions for GreenChAMP modeling

-- Function to calculate scenario metrics
CREATE OR REPLACE FUNCTION calculate_scenario_metrics(scenario_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Calculate metrics based on modeling results
  SELECT 
    jsonb_build_object(
      'vehicle_miles_traveled', COALESCE(SUM(sr.metrics->'vehicle_miles_traveled'), 0),
      'emissions', COALESCE(SUM(sr.metrics->'emissions'), 0),
      'travel_time_savings', COALESCE(SUM(sr.metrics->'travel_time_savings'), 0),
      'mode_shares', COALESCE(jsonb_agg(sr.metrics->'mode_shares'), '{}'),
      'accessibility_score', COALESCE(AVG((sr.metrics->'accessibility_score')::float), 0)
    )
  INTO result
  FROM scenario_results sr
  WHERE sr.scenario_id = calculate_scenario_metrics.scenario_id;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;
