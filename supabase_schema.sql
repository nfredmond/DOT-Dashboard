-- This file contains the complete database schema for the Planning Manager application
-- Running this script will RESET the database and recreate all tables

-- Reset the database by dropping the public schema and recreating it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Turn on necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- USERS AND AUTHENTICATION
-- =========================
-- NOTE: When using demo mode, the application will show empty states with guidance
-- when no data exists for the user, and an onboarding dialog for first-time users.

-- Create agencies table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('global_admin', 'org_admin', 'org_member', 'public')),
    isGlobalAdmin BOOLEAN DEFAULT FALSE,
    organization_role TEXT,
    organization_name TEXT,
    profile_image TEXT,
    phone_number TEXT,
    department TEXT,
    position TEXT,
    bio TEXT,
    linkedIn TEXT,
    twitter TEXT,
    website TEXT,
    location TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    permissions TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('county', 'city', 'agency', 'department', 'other')),
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_public BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create organization hierarchy view
CREATE OR REPLACE VIEW organization_hierarchy AS
WITH RECURSIVE org_tree AS (
    SELECT id, name, parent_id, agency_id, 1 as level, ARRAY[id] as path
    FROM organizations
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT o.id, o.name, o.parent_id, o.agency_id, t.level + 1, t.path || o.id
    FROM organizations o
    JOIN org_tree t ON o.parent_id = t.id
)
SELECT * FROM org_tree;

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled', 'on_hold')),
    type TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    budget NUMERIC,
    funding_source TEXT,
    start_date DATE,
    end_date DATE,
    location TEXT,
    location_details JSONB,
    geometry GEOMETRY,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_users junction table
CREATE TABLE project_users (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'contributor', 'viewer')),
    PRIMARY KEY (project_id, user_id)
);

-- Create criteria table
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('numeric', 'boolean', 'enum', 'range')),
    options JSONB, -- For enum types
    min_value NUMERIC, -- For numeric/range types
    max_value NUMERIC, -- For numeric/range types
    units TEXT, -- For numeric types
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scoring table
CREATE TABLE scoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    raw_value NUMERIC, -- Original value before normalization
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, criteria_id)
);

-- Create prioritization_scenarios table
CREATE TABLE prioritization_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scenario_weights table
CREATE TABLE scenario_weights (
    scenario_id UUID NOT NULL REFERENCES prioritization_scenarios(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    PRIMARY KEY (scenario_id, criteria_id)
);

-- Create scoring_templates table
CREATE TABLE scoring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scoring_template_criteria junction table
CREATE TABLE scoring_template_criteria (
    template_id UUID NOT NULL REFERENCES scoring_templates(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (template_id, criteria_id)
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    location GEOMETRY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    location GEOMETRY,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create spatial_features table
CREATE TABLE spatial_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('point', 'line', 'polygon', 'multipoint', 'multiline', 'multipolygon')),
    geometry GEOMETRY NOT NULL,
    properties JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create llm_config table
CREATE TABLE llm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key_enc TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create llm_logs table
CREATE TABLE llm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request TEXT,
    response TEXT,
    tokens INTEGER,
    model TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_milestones table
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed_date DATE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    content TEXT,
    parameters JSONB DEFAULT '{}',
    schedule JSONB, -- For scheduled reports
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    ui_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    permissions TEXT[],
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create project scenarios table
CREATE TABLE project_scenarios (
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

-- Create scenario comparisons table
CREATE TABLE scenario_comparisons (
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

-- Create indices for all tables
-- Indices for agencies table
CREATE INDEX agencies_created_at_idx ON agencies(created_at);

-- Indices for profiles table
CREATE INDEX profiles_agency_id_idx ON profiles(agency_id);
CREATE INDEX profiles_organization_id_idx ON profiles(organization_id);
CREATE INDEX profiles_created_at_idx ON profiles(created_at);

-- Indices for organizations table
CREATE INDEX organizations_agency_id_idx ON organizations(agency_id);
CREATE INDEX organizations_parent_id_idx ON organizations(parent_id);
CREATE INDEX organizations_created_at_idx ON organizations(created_at);

-- Indices for projects table
CREATE INDEX projects_organization_id_idx ON projects(organization_id);
CREATE INDEX projects_agency_id_idx ON projects(agency_id);
CREATE INDEX projects_created_by_idx ON projects(created_by);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_type_idx ON projects(type);
CREATE INDEX projects_created_at_idx ON projects(created_at);
CREATE INDEX projects_updated_at_idx ON projects(updated_at);
CREATE INDEX projects_geometry_idx ON projects USING GIST(geometry);

-- Indices for project_users table
CREATE INDEX project_users_user_id_idx ON project_users(user_id);

-- Indices for criteria table
CREATE INDEX criteria_agency_id_idx ON criteria(agency_id);
CREATE INDEX criteria_organization_id_idx ON criteria(organization_id);
CREATE INDEX criteria_category_idx ON criteria(category);
CREATE INDEX criteria_is_active_idx ON criteria(is_active);

-- Indices for scoring table
CREATE INDEX scoring_project_id_idx ON scoring(project_id);
CREATE INDEX scoring_criteria_id_idx ON scoring(criteria_id);
CREATE INDEX scoring_created_by_idx ON scoring(created_by);

-- Indices for prioritization_scenarios table
CREATE INDEX prioritization_scenarios_organization_id_idx ON prioritization_scenarios(organization_id);
CREATE INDEX prioritization_scenarios_agency_id_idx ON prioritization_scenarios(agency_id);
CREATE INDEX prioritization_scenarios_created_by_idx ON prioritization_scenarios(created_by);

-- Indices for scenario_weights table
CREATE INDEX scenario_weights_scenario_id_idx ON scenario_weights(scenario_id);
CREATE INDEX scenario_weights_criteria_id_idx ON scenario_weights(criteria_id);

-- Indices for scoring_templates table
CREATE INDEX scoring_templates_agency_id_idx ON scoring_templates(agency_id);
CREATE INDEX scoring_templates_organization_id_idx ON scoring_templates(organization_id);
CREATE INDEX scoring_templates_created_by_idx ON scoring_templates(created_by);

-- Indices for scoring_template_criteria table
CREATE INDEX scoring_template_criteria_template_id_idx ON scoring_template_criteria(template_id);
CREATE INDEX scoring_template_criteria_criteria_id_idx ON scoring_template_criteria(criteria_id);

-- Indices for documents table
CREATE INDEX documents_project_id_idx ON documents(project_id);
CREATE INDEX documents_created_by_idx ON documents(created_by);
CREATE INDEX documents_created_at_idx ON documents(created_at);

-- Indices for comments table
CREATE INDEX comments_project_id_idx ON comments(project_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
CREATE INDEX comments_created_at_idx ON comments(created_at);
CREATE INDEX comments_location_idx ON comments USING GIST(location);

-- Indices for feedback table
CREATE INDEX feedback_project_id_idx ON feedback(project_id);
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_created_at_idx ON feedback(created_at);
CREATE INDEX feedback_location_idx ON feedback USING GIST(location);

-- Indices for spatial_features table
CREATE INDEX spatial_features_project_id_idx ON spatial_features(project_id);
CREATE INDEX spatial_features_created_by_idx ON spatial_features(created_by);
CREATE INDEX spatial_features_geometry_idx ON spatial_features USING GIST(geometry);

-- Indices for llm_config table
CREATE INDEX llm_config_agency_id_idx ON llm_config(agency_id);
CREATE INDEX llm_config_organization_id_idx ON llm_config(organization_id);

-- Indices for llm_logs table
CREATE INDEX llm_logs_agency_id_idx ON llm_logs(agency_id);
CREATE INDEX llm_logs_organization_id_idx ON llm_logs(organization_id);
CREATE INDEX llm_logs_created_by_idx ON llm_logs(created_by);
CREATE INDEX llm_logs_created_at_idx ON llm_logs(created_at);

-- Indices for project_milestones table
CREATE INDEX project_milestones_project_id_idx ON project_milestones(project_id);
CREATE INDEX project_milestones_due_date_idx ON project_milestones(due_date);
CREATE INDEX project_milestones_status_idx ON project_milestones(status);

-- Indices for reports table
CREATE INDEX reports_agency_id_idx ON reports(agency_id);
CREATE INDEX reports_organization_id_idx ON reports(organization_id);
CREATE INDEX reports_created_by_idx ON reports(created_by);
CREATE INDEX reports_created_at_idx ON reports(created_at);

-- Indices for audit_logs table
CREATE INDEX audit_logs_agency_id_idx ON audit_logs(agency_id);
CREATE INDEX audit_logs_organization_id_idx ON audit_logs(organization_id);
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- Indices for notifications table
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);

-- Indices for api_keys table
CREATE INDEX api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX api_keys_organization_id_idx ON api_keys(organization_id);
CREATE INDEX api_keys_expires_at_idx ON api_keys(expires_at);

-- Create RLS policies for security
-- Enable Row Level Security on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE prioritization_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_template_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

-- Create sample data for demo mode
-- This data is used when the application is in demo mode
-- In regular mode, when no data exists, the application will display empty states
-- with guidance and an onboarding dialog for first-time users

INSERT INTO agencies (id, name, subdomain, settings)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Transportation Agency', 'demo', '{"theme":"blue"}');

-- Insert a default organization
INSERT INTO organizations (id, name, description, type, agency_id, is_public)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Demo Organization', 'Demo transportation organization', 'agency', '11111111-1111-1111-1111-111111111111', true);

-- Create some sample criteria
INSERT INTO criteria (id, agency_id, organization_id, name, description, weight, category, type, is_active, is_required)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Safety', 'Safety impact assessment', 0.3, 'impact', 'numeric', true, true),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cost Effectiveness', 'Cost per benefit ratio', 0.2, 'financial', 'numeric', true, false),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Environmental Impact', 'Environmental sustainability score', 0.25, 'impact', 'numeric', true, false),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Community Support', 'Level of community support', 0.15, 'social', 'numeric', true, false),
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Implementation Feasibility', 'Ease of implementation', 0.1, 'operational', 'numeric', true, false);

-- Create a default scoring template
INSERT INTO scoring_templates (id, agency_id, organization_id, name, description, is_default)
VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Default Scoring Template', 'Standard template for all projects', true);

-- Link criteria to template
INSERT INTO scoring_template_criteria (template_id, criteria_id, weight)
VALUES
  ('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 0.3),
  ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 0.2),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 0.25),
  ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 0.15),
  ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 0.1);

-- Create sample projects
INSERT INTO projects (id, name, description, organization_id, agency_id, status, type, priority, budget)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'Highway 101 Expansion', 'Expansion of Highway 101 from 2 to 3 lanes in each direction', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'planning', 'highway', 'high', 15000000),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Street Bridge Repair', 'Structural repairs to Main Street Bridge', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'active', 'bridge', 'critical', 5000000),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Downtown Bike Lane Network', 'Implementation of protected bike lanes in downtown area', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'planning', 'bicycle', 'medium', 2500000),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Transit Signal Priority System', 'Installation of transit signal priority at 15 intersections', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'planning', 'transit', 'medium', 1800000),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Electric Bus Fleet Expansion', 'Purchase of 10 new electric buses', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'active', 'transit', 'high', 8000000);

-- Add scoring to projects
INSERT INTO scoring (project_id, criteria_id, score, notes)
VALUES
  ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 75, 'Moderate safety improvements expected'),
  ('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 60, 'Somewhat cost effective'),
  ('99999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 40, 'Some environmental concerns'),
  ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 65, 'Mixed community reception'),
  ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', 80, 'Straightforward to implement'),
  
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 90, 'Critical safety improvement'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 75, 'Good cost-benefit ratio'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 60, 'Minimal environmental impact'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 85, 'Strong community support'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 70, 'Some technical challenges'),
  
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 85, 'Significant safety improvement for cyclists'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 80, 'Excellent cost-benefit ratio'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 95, 'Positive environmental impact'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 70, 'Some community concerns about parking'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', 75, 'Some coordination challenges'),
  
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 65, 'Modest safety improvements'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 85, 'Very cost effective'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 80, 'Reduces emissions through better traffic flow'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 60, 'Limited public visibility'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 70, 'Requires coordination with traffic operations'),
  
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 70, 'Improved safety features on new buses'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 65, 'Higher upfront costs, long-term savings'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 90, 'Significant emissions reduction'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 80, 'Strong public support for electric transit'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', 60, 'Requires charging infrastructure implementation');

-- Create a prioritization scenario
INSERT INTO prioritization_scenarios (id, name, description, organization_id, agency_id, is_active)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Safety Focus', 'Prioritization with emphasis on safety improvements', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', true);

-- Set weights for the scenario
INSERT INTO scenario_weights (scenario_id, criteria_id, weight)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 0.5),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 0.15),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 0.15),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 0.1),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '77777777-7777-7777-7777-777777777777', 0.1);

-- Create project scenarios
INSERT INTO project_scenarios (id, project_id, name, description, timeline, cost, benefits, drawbacks, feasibility, impact, analysis)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'Safety Focus Scenario', 'Scenario description', '2024-01-01 to 2025-12-31', 1000000, ARRAY['Safety improvements'], ARRAY['Cost'], 0.75, '{"safety": 0.85, "cost": 0.65}', 'Safety improvements analysis'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cost Focus Scenario', 'Scenario description', '2024-01-01 to 2025-12-31', 800000, ARRAY['Cost effectiveness'], ARRAY['Safety'], 0.60, '{"cost": 0.75, "safety": 0.80}', 'Cost effectiveness analysis');

-- Create scenario comparisons
INSERT INTO scenario_comparisons (project_id, scenario1_id, scenario2_id, comparison, recommendation, scores)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Safety vs. Cost', 'Safety Focus Scenario is more beneficial', '{"safety": 0.85, "cost": 0.65}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Safety vs. Cost', 'Safety Focus Scenario is more beneficial', '{"safety": 0.85, "cost": 0.65}');

-- Scenario indexes
CREATE INDEX project_scenarios_project_id_idx ON project_scenarios(project_id);
CREATE INDEX project_scenarios_created_by_idx ON project_scenarios(created_by);
CREATE INDEX project_scenarios_parent_scenario_id_idx ON project_scenarios(parent_scenario_id);
CREATE INDEX project_scenarios_created_at_idx ON project_scenarios(created_at);
CREATE INDEX project_scenarios_feasibility_idx ON project_scenarios(feasibility);

-- Scenario comparison indexes
CREATE INDEX scenario_comparisons_project_id_idx ON scenario_comparisons(project_id);
CREATE INDEX scenario_comparisons_scenario1_id_idx ON scenario_comparisons(scenario1_id);
CREATE INDEX scenario_comparisons_scenario2_id_idx ON scenario_comparisons(scenario2_id);
CREATE INDEX scenario_comparisons_created_by_idx ON scenario_comparisons(created_by);
CREATE INDEX scenario_comparisons_created_at_idx ON scenario_comparisons(created_at);

-- Scenario policies
CREATE POLICY "Users can read scenarios in their organization" ON project_scenarios FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN profiles pr ON p.organization_id = pr.organization_id
        WHERE p.id = project_scenarios.project_id
        AND pr.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create scenarios for their organization's projects" ON project_scenarios FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN profiles pr ON p.organization_id = pr.organization_id
        WHERE p.id = project_scenarios.project_id
        AND pr.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update scenarios they created" ON project_scenarios FOR UPDATE USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Scenario comparison policies
CREATE POLICY "Users can read scenario comparisons in their organization" ON scenario_comparisons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN profiles pr ON p.organization_id = pr.organization_id
        WHERE p.id = scenario_comparisons.project_id
        AND pr.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create scenario comparisons for their organization's projects" ON scenario_comparisons FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN profiles pr ON p.organization_id = pr.organization_id
        WHERE p.id = scenario_comparisons.project_id
        AND pr.user_id = auth.uid()
    )
); 