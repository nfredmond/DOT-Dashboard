-- Planning Manager Database Schema v5
-- Complete schema definition for the Planning Manager v5 application
-- This file can be executed directly in the Supabase SQL Editor

--------------------------------------------------------------------------------
-- Extensions
--------------------------------------------------------------------------------

-- Enable UUID extension (should be enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------------------
-- Core Tables
--------------------------------------------------------------------------------

-- Create agencies table
-- Stores information about each transportation agency using the system
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organizations table
-- Represents transportation organizations, counties, and sub-agencies
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
-- Helper view to traverse the organization hierarchy
CREATE OR REPLACE VIEW organization_hierarchy AS
WITH RECURSIVE org_tree AS (
    -- Base case: all root organizations
    SELECT 
        id, 
        parent_id, 
        name, 
        ARRAY[id] AS path, 
        1 AS level
    FROM 
        organizations
    WHERE 
        parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: find children of organizations already in the tree
    SELECT 
        o.id, 
        o.parent_id, 
        o.name, 
        ot.path || o.id, 
        ot.level + 1
    FROM 
        organizations o
    JOIN 
        org_tree ot ON o.parent_id = ot.id
)
SELECT 
    id,
    parent_id,
    name,
    path,
    level,
    path[1] AS root_id
FROM 
    org_tree;

-- Create profiles table (links users to agencies)
-- User profiles with agency association and role information
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(agency_id, user_id)
);

-- Create projects table
-- The core table storing transportation project information
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    type TEXT NOT NULL,
    location TEXT,
    geometry GEOMETRY,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_sharing table
-- Controls which organizations can view/access projects from other organizations
CREATE TABLE project_sharing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit', 'report')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, organization_id)
);

-- Create project_users junction table
-- Junction table for user-project associations
CREATE TABLE project_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'contributor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create organization_users junction table
-- Links users to organizations with role information
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'contributor', 'viewer')),
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

--------------------------------------------------------------------------------
-- Scoring System Tables
--------------------------------------------------------------------------------

-- Create criteria table
-- Scoring criteria definitions for project evaluation
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('numeric', 'boolean', 'enum')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scoring table
-- Project scores against defined criteria
CREATE TABLE scoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, criteria_id)
);

-- Create scoring_templates table
-- Reusable templates for project scoring
CREATE TABLE scoring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scoring_template_criteria junction table
-- Links criteria to templates with specific weights
CREATE TABLE scoring_template_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES scoring_templates(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(template_id, criteria_id)
);

--------------------------------------------------------------------------------
-- Supporting Tables
--------------------------------------------------------------------------------

-- Create documents table
-- Project, organization, and agency-related documents and files
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size BIGINT,
    content_type TEXT,
    is_llm_indexed BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint to ensure the document is linked to exactly one entity
    CONSTRAINT document_entity_check CHECK (
        (project_id IS NOT NULL AND organization_id IS NULL AND agency_id IS NULL) OR
        (project_id IS NULL AND organization_id IS NOT NULL AND agency_id IS NULL) OR
        (project_id IS NULL AND organization_id IS NULL AND agency_id IS NOT NULL)
    )
);

-- Create construction_documents table
-- Specialized document library for construction management
CREATE TABLE construction_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'blueprint', 'permit', 'specification', 'contract', 'change_order',
        'inspection_report', 'progress_photo', 'safety_document',
        'meeting_minutes', 'submittal', 'rfi', 'invoice', 'other'
    )),
    phase TEXT,
    url TEXT NOT NULL,
    file_size BIGINT,
    content_type TEXT,
    is_llm_indexed BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    version TEXT,
    revision_number INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create document_content table for LLM searchable content
CREATE TABLE document_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create construction_document_content table for construction document LLM search
CREATE TABLE construction_document_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    construction_document_id UUID NOT NULL REFERENCES construction_documents(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feedback table
-- Community and stakeholder feedback on projects
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    location GEOMETRY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- AI Integration Tables
--------------------------------------------------------------------------------

-- Create llm_config table
-- Configuration for LLM integrations
CREATE TABLE llm_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key_enc TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create llm_logs table
-- Logs of LLM interactions for auditing and cost tracking
CREATE TABLE llm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    request TEXT,
    response TEXT,
    tokens INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- Reporting and Auditing Tables
--------------------------------------------------------------------------------

-- Create reports table
-- Generated reports and documents
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    content TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
-- System audit trail for compliance and security
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- Measures/Propositions Tables
--------------------------------------------------------------------------------

-- Create measures table
-- Stores information about funding measures, propositions and tax measures
CREATE TABLE measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- Measure identifier (e.g., "Measure A", "Prop 1")
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_measure_id UUID REFERENCES measures(id), -- For linked/continuation measures
    continuation_of_id UUID REFERENCES measures(id), -- When a measure is renewed/continued
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'renewed', 'expired')),
    funding_amount NUMERIC,
    funding_currency TEXT DEFAULT 'USD',
    reporting_frequency TEXT CHECK (reporting_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    reporting_requirements TEXT,
    metadata JSONB DEFAULT '{}',
    custom_reporting_fields JSONB DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create measure_projects junction table
-- Links projects to measures they're funded by or associated with
CREATE TABLE measure_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measure_id UUID NOT NULL REFERENCES measures(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    funding_amount NUMERIC,
    reporting_data JSONB DEFAULT '[]', -- Specific reporting data for this project under this measure
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(measure_id, project_id)
);

-- Create measure_organizations junction table
-- Links organizations to measures they're responsible for
CREATE TABLE measure_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measure_id UUID NOT NULL REFERENCES measures(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'administrator', 'reporter', 'member')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(measure_id, organization_id)
);

-- Create measure_reporting table
-- Stores periodic reports submitted for measures
CREATE TABLE measure_reporting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measure_id UUID NOT NULL REFERENCES measures(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporting_period TEXT NOT NULL, -- e.g., "Q1 2023", "2023-03"
    submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'revision_requested')),
    report_data JSONB DEFAULT '{}',
    notes TEXT,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create measure_reporting_projects table
-- Project-specific reporting data for measure reports
CREATE TABLE measure_reporting_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporting_id UUID NOT NULL REFERENCES measure_reporting(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expenditure_amount NUMERIC,
    expenditure_description TEXT,
    status TEXT,
    progress_percentage NUMERIC CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones_completed JSONB DEFAULT '[]',
    reporting_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(reporting_id, project_id)
);

--------------------------------------------------------------------------------
-- Indices
--------------------------------------------------------------------------------

-- Indices for agencies table
CREATE INDEX agencies_created_at_idx ON agencies(created_at);

-- Indices for profiles table
CREATE INDEX profiles_agency_id_idx ON profiles(agency_id);
CREATE INDEX profiles_created_at_idx ON profiles(created_at);

-- Indices for projects table
CREATE INDEX projects_organization_id_idx ON projects(organization_id);
CREATE INDEX projects_created_by_idx ON projects(created_by);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_type_idx ON projects(type);
CREATE INDEX projects_created_at_idx ON projects(created_at);
CREATE INDEX projects_updated_at_idx ON projects(updated_at);
-- Spatial index for geometry column
CREATE INDEX projects_geometry_idx ON projects USING GIST(geometry);

-- Indices for project_users table
CREATE INDEX project_users_user_id_idx ON project_users(user_id);

-- Indices for criteria table
CREATE INDEX criteria_agency_id_idx ON criteria(agency_id);
CREATE INDEX criteria_category_idx ON criteria(category);
CREATE INDEX criteria_is_active_idx ON criteria(is_active);

-- Indices for scoring table
CREATE INDEX scoring_project_id_idx ON scoring(project_id);
CREATE INDEX scoring_criteria_id_idx ON scoring(criteria_id);
CREATE INDEX scoring_created_by_idx ON scoring(created_by);

-- Indices for scoring_templates table
CREATE INDEX scoring_templates_agency_id_idx ON scoring_templates(agency_id);
CREATE INDEX scoring_templates_created_by_idx ON scoring_templates(created_by);

-- Indices for scoring_template_criteria table
CREATE INDEX scoring_template_criteria_template_id_idx ON scoring_template_criteria(template_id);
CREATE INDEX scoring_template_criteria_criteria_id_idx ON scoring_template_criteria(criteria_id);

-- Indices for documents table
CREATE INDEX documents_project_id_idx ON documents(project_id);
CREATE INDEX documents_created_by_idx ON documents(created_by);
CREATE INDEX documents_type_idx ON documents(type);

-- Indices for feedback table
CREATE INDEX feedback_project_id_idx ON feedback(project_id);
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_created_at_idx ON feedback(created_at);
-- Spatial index for location column
CREATE INDEX feedback_location_idx ON feedback USING GIST(location);

-- Indices for llm_config table
CREATE INDEX llm_config_agency_id_idx ON llm_config(agency_id);
CREATE INDEX llm_config_provider_idx ON llm_config(provider);

-- Indices for llm_logs table
CREATE INDEX llm_logs_agency_id_idx ON llm_logs(agency_id);
CREATE INDEX llm_logs_created_by_idx ON llm_logs(created_by);
CREATE INDEX llm_logs_created_at_idx ON llm_logs(created_at);

-- Indices for reports table
CREATE INDEX reports_agency_id_idx ON reports(agency_id);
CREATE INDEX reports_created_by_idx ON reports(created_by);
CREATE INDEX reports_type_idx ON reports(type);

-- Indices for audit_logs table
CREATE INDEX audit_logs_agency_id_idx ON audit_logs(agency_id);
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_resource_type_idx ON audit_logs(resource_type);
CREATE INDEX audit_logs_resource_id_idx ON audit_logs(resource_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX audit_logs_resource_type_resource_id_idx ON audit_logs(resource_type, resource_id);

-- Indices for measures tables
CREATE INDEX measures_organization_id_idx ON measures(organization_id);
CREATE INDEX measures_parent_measure_id_idx ON measures(parent_measure_id);
CREATE INDEX measures_status_idx ON measures(status);
CREATE INDEX measures_created_by_idx ON measures(created_by);
CREATE INDEX measures_created_at_idx ON measures(created_at);

CREATE INDEX measure_projects_measure_id_idx ON measure_projects(measure_id);
CREATE INDEX measure_projects_project_id_idx ON measure_projects(project_id);

CREATE INDEX measure_organizations_measure_id_idx ON measure_organizations(measure_id);
CREATE INDEX measure_organizations_organization_id_idx ON measure_organizations(organization_id);

CREATE INDEX measure_reporting_measure_id_idx ON measure_reporting(measure_id);
CREATE INDEX measure_reporting_organization_id_idx ON measure_reporting(organization_id);
CREATE INDEX measure_reporting_status_idx ON measure_reporting(status);
CREATE INDEX measure_reporting_reporting_period_idx ON measure_reporting(reporting_period);
CREATE INDEX measure_reporting_submitted_by_idx ON measure_reporting(submitted_by);

CREATE INDEX measure_reporting_projects_reporting_id_idx ON measure_reporting_projects(reporting_id);
CREATE INDEX measure_reporting_projects_project_id_idx ON measure_reporting_projects(project_id);

-- Indices for organizations table
CREATE INDEX organizations_name_idx ON organizations(name);
CREATE INDEX organizations_parent_id_idx ON organizations(parent_id);
CREATE INDEX organizations_agency_id_idx ON organizations(agency_id);

-- Indices for organization_users table
CREATE INDEX organization_users_user_id_idx ON organization_users(user_id);
CREATE INDEX organization_users_organization_id_idx ON organization_users(organization_id);
CREATE INDEX organization_users_role_idx ON organization_users(role);
CREATE INDEX organization_users_is_superuser_idx ON organization_users(is_superuser);

-- Indices for project_sharing table
CREATE INDEX project_sharing_project_id_idx ON project_sharing(project_id);
CREATE INDEX project_sharing_organization_id_idx ON project_sharing(organization_id);

-- Indices for documents table
CREATE INDEX documents_project_id_idx ON documents(project_id);
CREATE INDEX documents_organization_id_idx ON documents(organization_id);
CREATE INDEX documents_agency_id_idx ON documents(agency_id);
CREATE INDEX documents_type_idx ON documents(type);
CREATE INDEX documents_category_idx ON documents(category);
CREATE INDEX documents_is_public_idx ON documents(is_public);
CREATE INDEX documents_is_llm_indexed_idx ON documents(is_llm_indexed);

-- Indices for document_content table
CREATE INDEX document_content_document_id_idx ON document_content(document_id);
CREATE INDEX document_content_embedding_idx ON document_content USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Create indexes for construction documents
CREATE INDEX construction_documents_project_id_idx ON construction_documents(project_id);
CREATE INDEX construction_documents_document_type_idx ON construction_documents(document_type);
CREATE INDEX construction_documents_phase_idx ON construction_documents(phase);
CREATE INDEX construction_documents_is_approved_idx ON construction_documents(is_approved);
CREATE INDEX construction_documents_created_by_idx ON construction_documents(created_by);
CREATE INDEX construction_documents_created_at_idx ON construction_documents(created_at);
CREATE INDEX construction_documents_is_llm_indexed_idx ON construction_documents(is_llm_indexed);

-- Create indexes for construction document content
CREATE INDEX construction_doc_content_document_id_idx ON construction_document_content(construction_document_id);
CREATE INDEX construction_doc_content_embedding_idx ON construction_document_content USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

--------------------------------------------------------------------------------
-- Functions and Triggers
--------------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table to update updated_at on UPDATE
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for scoring_templates table to update updated_at on UPDATE
CREATE TRIGGER update_scoring_templates_updated_at
BEFORE UPDATE ON scoring_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    agency_id_val UUID;
    resource_id_val UUID;
    details_val JSONB;
    user_id_val UUID;
BEGIN
    -- Determine agency_id based on each specific table
    -- Handle each table separately to avoid accessing non-existent fields
    IF TG_TABLE_NAME = 'agencies' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'projects' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
    ELSIF TG_TABLE_NAME = 'criteria' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'llm_config' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'llm_logs' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'reports' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'audit_logs' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'sync_queue' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'documents' THEN
        -- Handle project relationship
        IF TG_OP = 'DELETE' THEN
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'feedback' THEN
        -- Handle project relationship
        IF TG_OP = 'DELETE' THEN
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'scoring' THEN
        -- Handle project relationship
        IF TG_OP = 'DELETE' THEN
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'scoring_template_criteria' THEN
        -- Handle template relationship
        IF TG_OP = 'DELETE' THEN
            SELECT t.agency_id INTO agency_id_val 
            FROM scoring_templates t 
            WHERE t.id = OLD.template_id;
        ELSE
            SELECT t.agency_id INTO agency_id_val 
            FROM scoring_templates t 
            WHERE t.id = NEW.template_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'users' THEN
        -- Lookup from user profile
        IF TG_OP = 'DELETE' THEN
            SELECT p.agency_id INTO agency_id_val 
            FROM profiles p 
            WHERE p.user_id = OLD.id;
        ELSE
            SELECT p.agency_id INTO agency_id_val 
            FROM profiles p 
            WHERE p.user_id = NEW.id;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_users' THEN
        -- Lookup from project
        IF TG_OP = 'DELETE' THEN
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.organization_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSE
        -- For any other tables, try to get from current user
        SELECT agency_id INTO agency_id_val 
        FROM profiles 
        WHERE user_id = auth.uid();
    END IF;
    
    -- Determine resource_id (all tables must have an id field)
    resource_id_val := CASE
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
    END;
    
    -- Get current user ID - no need for system user ID now that user_id is nullable
    user_id_val := auth.uid();
    
    -- Only attempt database record if we can resolve the agency_id
    IF agency_id_val IS NOT NULL THEN
        -- Build details JSONB
        details_val := CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old_data', to_jsonb(OLD))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
            ELSE jsonb_build_object('new_data', to_jsonb(NEW))
        END;
    
        -- Insert audit record
        INSERT INTO audit_logs (
            agency_id, 
            user_id, 
            action, 
            resource_type, 
            resource_id, 
            details
        ) VALUES (
            agency_id_val,
            user_id_val,
            TG_OP,
            TG_TABLE_NAME,
            resource_id_val,
            details_val
        );
    END IF;
    
    -- For triggers set as AFTER event triggers
    IF TG_WHEN = 'AFTER' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- For triggers set as BEFORE event triggers
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE TRIGGER log_agencies_changes
AFTER INSERT OR UPDATE OR DELETE ON agencies
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER log_projects_changes
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER log_criteria_changes
AFTER INSERT OR UPDATE OR DELETE ON criteria
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER log_scoring_changes
AFTER INSERT OR UPDATE OR DELETE ON scoring
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER log_documents_changes
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Create triggers for updating timestamps
CREATE TRIGGER update_measures_updated_at
BEFORE UPDATE ON measures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_measure_projects_updated_at
BEFORE UPDATE ON measure_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_measure_reporting_updated_at
BEFORE UPDATE ON measure_reporting
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_measure_reporting_projects_updated_at
BEFORE UPDATE ON measure_reporting_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

--------------------------------------------------------------------------------
-- Row-Level Security Policies
--------------------------------------------------------------------------------

-- Enable Row Level Security on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_template_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's agency
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- First check domain-based superuser status
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise check organization_users table for admin role
    RETURN EXISTS (
        SELECT 1
        FROM organization_users
        WHERE user_id = auth.uid()
        AND (role = 'admin' OR is_superuser = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    -- First check domain-based superuser status
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise check organization_users table for admin or editor role
    RETURN EXISTS (
        SELECT 1
        FROM organization_users
        WHERE user_id = auth.uid()
        AND (role IN ('admin', 'manager') OR is_superuser = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- RLS Policies - Organizations
--------------------------------------------------------------------------------

-- Enable RLS on organization tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sharing ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to an organization
CREATE OR REPLACE FUNCTION has_organization_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Domain-based superusers have access to everything
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Check direct organization membership
    RETURN EXISTS (
        SELECT 1 
        FROM organization_users
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin of an organization
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Domain-based superusers are admins of everything
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is admin of the organization
    RETURN EXISTS (
        SELECT 1 
        FROM organization_users
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND (role = 'admin' OR is_superuser = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY organizations_view_policy ON organizations
    FOR SELECT
    USING (
        -- Users can view organizations they belong to
        has_organization_access(id)
        -- And parent/child organizations of their organizations
        OR EXISTS (
            WITH RECURSIVE org_hierarchy AS (
                -- Organizations the user is directly a member of
                SELECT o.id, o.parent_id
                FROM organizations o
                JOIN organization_users ou ON o.id = ou.organization_id
                WHERE ou.user_id = auth.uid()
                
                UNION
                
                -- All parents of those organizations
                SELECT o.id, o.parent_id
                FROM organizations o
                JOIN org_hierarchy oh ON o.id = oh.parent_id
                
                UNION
                
                -- All children of those organizations
                SELECT o.id, o.parent_id
                FROM organizations o
                JOIN org_hierarchy oh ON o.parent_id = oh.id
            )
            SELECT 1 FROM org_hierarchy WHERE id = organizations.id
        )
        -- Or the organization is public
        OR is_public = TRUE
    );

CREATE POLICY organizations_insert_policy ON organizations
    FOR INSERT
    WITH CHECK (
        -- Only agency admins can create top-level organizations
        (parent_id IS NULL AND is_admin())
        -- Users can create sub-organizations if they are admins of the parent
        OR (parent_id IS NOT NULL AND is_organization_admin(parent_id))
        -- Domain superusers can create any organization
        OR is_domain_superuser()
    );

CREATE POLICY organizations_update_policy ON organizations
    FOR UPDATE
    USING (is_organization_admin(id))
    WITH CHECK (is_organization_admin(id));

CREATE POLICY organizations_delete_policy ON organizations
    FOR DELETE
    USING (is_organization_admin(id));

-- Organization users policies
CREATE POLICY organization_users_view_policy ON organization_users
    FOR SELECT
    USING (
        -- Users can view members of organizations they belong to
        has_organization_access(organization_id)
        -- Domain superusers can view all memberships
        OR is_domain_superuser()
    );

CREATE POLICY organization_users_insert_policy ON organization_users
    FOR INSERT
    WITH CHECK (
        -- Only admins can add members
        is_organization_admin(organization_id)
    );

CREATE POLICY organization_users_update_policy ON organization_users
    FOR UPDATE
    USING (is_organization_admin(organization_id))
    WITH CHECK (is_organization_admin(organization_id));

CREATE POLICY organization_users_delete_policy ON organization_users
    FOR DELETE
    USING (is_organization_admin(organization_id));

-- Project sharing policies
CREATE POLICY project_sharing_view_policy ON project_sharing
    FOR SELECT
    USING (
        -- Users can view sharing for projects in their organizations
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id 
            AND has_organization_access(p.organization_id)
        )
        -- Or projects shared with their organizations
        OR has_organization_access(organization_id)
    );

CREATE POLICY project_sharing_insert_policy ON project_sharing
    FOR INSERT
    WITH CHECK (
        -- Only admins can share projects
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id 
            AND is_organization_admin(p.organization_id)
        )
    );

CREATE POLICY project_sharing_delete_policy ON project_sharing
    FOR DELETE
    USING (
        -- Only admins can remove sharing
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id 
            AND is_organization_admin(p.organization_id)
        )
    );

--------------------------------------------------------------------------------
-- RLS Policies - Documents
--------------------------------------------------------------------------------

-- Updated documents policies for new document structure
CREATE POLICY documents_view_policy ON documents
    FOR SELECT
    USING (
        -- Public documents are visible to all
        is_public = TRUE
        -- Project documents visible to those with project access
        OR (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN project_sharing ps ON p.id = ps.project_id
            WHERE p.id = documents.project_id
            AND (
                has_organization_access(p.organization_id)
                OR has_organization_access(ps.organization_id)
            )
        ))
        -- Organization documents visible to organization members
        OR (organization_id IS NOT NULL AND has_organization_access(organization_id))
        -- Agency documents visible to agency members
        OR (agency_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.agency_id = documents.agency_id
            AND profiles.user_id = auth.uid()
        ))
        -- Domain superusers can view all documents
        OR is_domain_superuser()
    );

CREATE POLICY documents_insert_policy ON documents
    FOR INSERT
    WITH CHECK (
        -- Project documents can be created by project admins
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        ))
        -- Organization documents can be created by organization admins
        OR (organization_id IS NOT NULL AND is_organization_admin(organization_id))
        -- Agency documents can be created by agency admins
        OR (agency_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.agency_id = agency_id
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        ))
        -- Domain superusers can create any document
        OR is_domain_superuser()
    );

CREATE POLICY documents_update_policy ON documents
    FOR UPDATE
    USING (
        -- Project documents can be updated by project admins
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        ))
        -- Organization documents can be updated by organization admins
        OR (organization_id IS NOT NULL AND is_organization_admin(organization_id))
        -- Agency documents can be updated by agency admins
        OR (agency_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.agency_id = agency_id
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        ))
        -- Domain superusers can update any document
        OR is_domain_superuser()
    )
    WITH CHECK (
        -- Project documents can be updated by project admins
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        ))
        -- Organization documents can be updated by organization admins
        OR (organization_id IS NOT NULL AND is_organization_admin(organization_id))
        -- Agency documents can be updated by agency admins
        OR (agency_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.agency_id = agency_id
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        ))
        -- Domain superusers can update any document
        OR is_domain_superuser()
    );

CREATE POLICY documents_delete_policy ON documents
    FOR DELETE
    USING (
        -- Project documents can be deleted by project admins
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        ))
        -- Organization documents can be deleted by organization admins
        OR (organization_id IS NOT NULL AND is_organization_admin(organization_id))
        -- Agency documents can be deleted by agency admins
        OR (agency_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.agency_id = agency_id
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        ))
        -- Domain superusers can delete any document
        OR is_domain_superuser()
    );

-- RLS policies for construction_documents
CREATE POLICY construction_documents_view_policy ON construction_documents
    FOR SELECT
    USING (
        -- Construction documents are visible to those with project access
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN project_sharing ps ON p.id = ps.project_id
            WHERE p.id = construction_documents.project_id
            AND (
                has_organization_access(p.organization_id)
                OR has_organization_access(ps.organization_id)
            )
        )
        -- Domain superusers can view all construction documents
        OR is_domain_superuser()
    );

CREATE POLICY construction_documents_insert_policy ON construction_documents
    FOR INSERT
    WITH CHECK (
        -- Construction documents can be created by project managers/contributors
        EXISTS (
            SELECT 1 FROM projects p
            JOIN project_users pu ON p.id = pu.project_id
            WHERE p.id = project_id
            AND pu.user_id = auth.uid()
            AND pu.role IN ('manager', 'contributor')
        )
        -- Or by organization admins/managers
        OR EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        )
        -- Domain superusers can create any construction document
        OR is_domain_superuser()
    );

CREATE POLICY construction_documents_update_policy ON construction_documents
    FOR UPDATE
    USING (
        -- Construction documents can be updated by project managers/contributors
        EXISTS (
            SELECT 1 FROM projects p
            JOIN project_users pu ON p.id = pu.project_id
            WHERE p.id = project_id
            AND pu.user_id = auth.uid()
            AND pu.role IN ('manager', 'contributor')
        )
        -- Or by organization admins/managers
        OR EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        )
        -- Document approvers can update approval status
        OR (
            is_approved = TRUE 
            AND approved_by = auth.uid()
        )
        -- Domain superusers can update any construction document
        OR is_domain_superuser()
    )
    WITH CHECK (
        -- Construction documents can be updated by project managers/contributors
        EXISTS (
            SELECT 1 FROM projects p
            JOIN project_users pu ON p.id = pu.project_id
            WHERE p.id = project_id
            AND pu.user_id = auth.uid()
            AND pu.role IN ('manager', 'contributor')
        )
        -- Or by organization admins/managers
        OR EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'manager')
        )
        -- Domain superusers can update any construction document
        OR is_domain_superuser()
    );

CREATE POLICY construction_documents_delete_policy ON construction_documents
    FOR DELETE
    USING (
        -- Construction documents can be deleted by project managers
        EXISTS (
            SELECT 1 FROM projects p
            JOIN project_users pu ON p.id = pu.project_id
            WHERE p.id = project_id
            AND pu.user_id = auth.uid()
            AND pu.role = 'manager'
        )
        -- Or by organization admins
        OR EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_users ou ON p.organization_id = ou.organization_id
            WHERE p.id = project_id
            AND ou.user_id = auth.uid()
            AND ou.role = 'admin'
        )
        -- Document creator can delete their own documents if not approved
        OR (
            created_by = auth.uid()
            AND is_approved = FALSE
        )
        -- Domain superusers can delete any construction document
        OR is_domain_superuser()
    );

--------------------------------------------------------------------------------
-- Optional Sample Data
--------------------------------------------------------------------------------

-- Insert a sample agency
INSERT INTO agencies (name, subdomain)
VALUES ('Demo Transportation Agency', 'demo');

-- Insert sample criteria
INSERT INTO criteria (agency_id, name, description, weight, category, type)
VALUES
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Safety', 'Improves safety conditions for all road users', 0.25, 'Safety', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Equity', 'Addresses transportation equity issues', 0.20, 'Social', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Environmental Impact', 'Reduces environmental harm', 0.15, 'Environment', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Cost Effectiveness', 'Value for investment', 0.20, 'Economic', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Congestion Relief', 'Reduces traffic congestion', 0.20, 'Operations', 'numeric');

-- ADMIN USER SETUP
-- NOTE: The admin user must first be created in Supabase Auth
-- with email: nathaniel@greendottransportation.com and password: Yuba530#
-- UUID: ab61773c-3a28-44d5-95c2-846fa5608811

-- Add admin user to profiles with admin role
INSERT INTO profiles (user_id, agency_id, role)
VALUES 
('ab61773c-3a28-44d5-95c2-846fa5608811', (SELECT id FROM agencies WHERE subdomain = 'demo'), 'admin');

-- Insert sample organizations
INSERT INTO organizations (name, description, type, agency_id)
VALUES 
('Yuba County', 'Yuba County Transportation Agency', 'county', (SELECT id FROM agencies WHERE subdomain = 'demo')),
('Marysville', 'City of Marysville', 'city', (SELECT id FROM agencies WHERE subdomain = 'demo')),
('Yuba City', 'City of Yuba City', 'city', (SELECT id FROM agencies WHERE subdomain = 'demo')),
('Sutter County', 'Sutter County Public Works', 'county', (SELECT id FROM agencies WHERE subdomain = 'demo'));

-- Set Marysville and Yuba City as children of Yuba County
UPDATE organizations 
SET parent_id = (SELECT id FROM organizations WHERE name = 'Yuba County')
WHERE name IN ('Marysville', 'Yuba City');

-- Insert a sample measure
INSERT INTO measures (name, code, description, organization_id, status, funding_amount, reporting_frequency, created_by)
VALUES (
    'Yuba County Transportation Sales Tax', 
    'Measure C', 
    'Half-cent sales tax for transportation improvements in Yuba County', 
    (SELECT id FROM organizations WHERE name = 'Yuba County'),
    'active',
    240000000,
    'quarterly',
    'ab61773c-3a28-44d5-95c2-846fa5608811'
);

-- Add sample measure organization relationships
INSERT INTO measure_organizations (measure_id, organization_id, role)
VALUES
(
    (SELECT id FROM measures WHERE code = 'Measure C'),
    (SELECT id FROM organizations WHERE name = 'Yuba County'),
    'owner'
),
(
    (SELECT id FROM measures WHERE code = 'Measure C'),
    (SELECT id FROM organizations WHERE name = 'Marysville'),
    'reporter'
),
(
    (SELECT id FROM measures WHERE code = 'Measure C'),
    (SELECT id FROM organizations WHERE name = 'Yuba City'),
    'reporter'
);

-- Insert a sample project
INSERT INTO projects (name, description, status, type, organization_id, created_by)
VALUES (
    'Fifth Street Bridge Replacement',
    'Replace the aging Fifth Street Bridge connecting Marysville and Yuba City',
    'active',
    'bridge',
    (SELECT id FROM organizations WHERE name = 'Yuba County'),
    'ab61773c-3a28-44d5-95c2-846fa5608811'
);

-- Link project to measure
INSERT INTO measure_projects (measure_id, project_id, funding_amount)
VALUES (
    (SELECT id FROM measures WHERE code = 'Measure C'),
    (SELECT id FROM projects WHERE name = 'Fifth Street Bridge Replacement'),
    50000000
);

-- Share project with child organizations
INSERT INTO project_sharing (project_id, organization_id, access_level)
VALUES
(
    (SELECT id FROM projects WHERE name = 'Fifth Street Bridge Replacement'),
    (SELECT id FROM organizations WHERE name = 'Marysville'),
    'report'
),
(
    (SELECT id FROM projects WHERE name = 'Fifth Street Bridge Replacement'),
    (SELECT id FROM organizations WHERE name = 'Yuba City'),
    'report'
);

-- Add sample document
INSERT INTO documents (
    project_id, 
    name, 
    description, 
    type, 
    category, 
    url, 
    is_llm_indexed,
    created_by
)
VALUES (
    (SELECT id FROM projects WHERE name = 'Fifth Street Bridge Replacement'),
    'Environmental Impact Report',
    'Final EIR for the Fifth Street Bridge Project',
    'pdf',
    'environmental',
    'https://example.com/documents/fifth-street-bridge-eir.pdf',
    TRUE,
    'ab61773c-3a28-44d5-95c2-846fa5608811'
);

--------------------------------------------------------------------------------
-- End of Schema
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- Cleanup (Development Only - Uncomment when needed)
--------------------------------------------------------------------------------

-- WARNING: This will delete all data!
/*
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS llm_logs CASCADE;
DROP TABLE IF EXISTS llm_config CASCADE;
DROP TABLE IF EXISTS scoring_template_criteria CASCADE;
DROP TABLE IF EXISTS scoring_templates CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS scoring CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS project_users CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS log_audit_event CASCADE;
DROP FUNCTION IF EXISTS get_user_agency_id CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_editor CASCADE;
*/ 

--------------------------------------------------------------------------------
-- Domain-based Superuser Management
--------------------------------------------------------------------------------

-- Function to grant superuser privileges based on email domain
CREATE OR REPLACE FUNCTION grant_domain_based_superuser_privileges()
RETURNS TRIGGER AS $$
DECLARE
    email_domain TEXT;
    org_record RECORD;
BEGIN
    -- Extract domain from email
    email_domain := split_part(NEW.email, '@', 2);
    
    -- Check if the email is from greendottransportation.com
    IF email_domain = 'greendottransportation.com' THEN
        -- For each organization, ensure the user has an admin role
        FOR org_record IN SELECT id FROM organizations
        LOOP
            -- Check if the user already has a role in this organization
            IF NOT EXISTS (
                SELECT 1 FROM organization_users 
                WHERE organization_id = org_record.id AND user_id = NEW.id
            ) THEN
                -- Insert a new record with admin role and superuser flag
                INSERT INTO organization_users (
                    organization_id, 
                    user_id, 
                    role, 
                    is_superuser
                ) VALUES (
                    org_record.id,
                    NEW.id,
                    'admin',
                    TRUE
                );
            ELSE
                -- Update the existing record to ensure admin role and superuser flag
                UPDATE organization_users
                SET 
                    role = 'admin',
                    is_superuser = TRUE
                WHERE 
                    organization_id = org_record.id AND 
                    user_id = NEW.id;
            END IF;
        END LOOP;
        
        -- Also ensure they have an admin role in their profile
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
            -- Insert new profile with admin role if none exists
            INSERT INTO profiles (
                user_id, 
                agency_id, 
                role
            ) 
            SELECT 
                NEW.id, 
                id, 
                'admin'
            FROM agencies 
            LIMIT 1;
        ELSE
            -- Update existing profile to admin role
            UPDATE profiles
            SET role = 'admin'
            WHERE user_id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically grant superuser privileges to users with @greendottransportation.com emails
CREATE TRIGGER grant_superuser_on_user_creation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION grant_domain_based_superuser_privileges();

-- Trigger to update superuser privileges when user email changes
CREATE TRIGGER update_superuser_on_user_update
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION grant_domain_based_superuser_privileges();

-- Helper function to check if a user is a superuser based on email domain
CREATE OR REPLACE FUNCTION is_domain_superuser()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    email_domain TEXT;
BEGIN
    -- Get the current user's email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    -- Extract domain from email
    IF user_email IS NOT NULL THEN
        email_domain := split_part(user_email, '@', 2);
        
        -- Check if the email is from the superuser domain
        IF email_domain = 'greendottransportation.com' THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

--------------------------------------------------------------------------------
-- RLS Policies - Measures & Reporting
--------------------------------------------------------------------------------

-- Enable RLS on measures tables
ALTER TABLE measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE measure_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE measure_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE measure_reporting ENABLE ROW LEVEL SECURITY;
ALTER TABLE measure_reporting_projects ENABLE ROW LEVEL SECURITY;

-- Helper function for measure access
CREATE OR REPLACE FUNCTION has_measure_access(measure_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Domain-based superusers have access to everything
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has direct access through organization membership
    RETURN EXISTS (
        SELECT 1 
        FROM measures m
        JOIN organization_users ou ON m.organization_id = ou.organization_id
        WHERE m.id = measure_id
        AND ou.user_id = auth.uid()
    )
    -- Or check if user has access through measure_organizations
    OR EXISTS (
        SELECT 1 
        FROM measure_organizations mo
        JOIN organization_users ou ON mo.organization_id = ou.organization_id
        WHERE mo.measure_id = measure_id
        AND ou.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for measure admin access
CREATE OR REPLACE FUNCTION has_measure_admin_access(measure_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Domain-based superusers have admin access to everything
    IF is_domain_superuser() THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is an admin of the owning organization
    RETURN EXISTS (
        SELECT 1 
        FROM measures m
        JOIN organization_users ou ON m.organization_id = ou.organization_id
        WHERE m.id = measure_id
        AND ou.user_id = auth.uid()
        AND (ou.role = 'admin' OR ou.is_superuser = TRUE)
    )
    -- Or check if user has admin access through measure_organizations
    OR EXISTS (
        SELECT 1 
        FROM measure_organizations mo
        JOIN organization_users ou ON mo.organization_id = ou.organization_id
        WHERE mo.measure_id = measure_id
        AND ou.user_id = auth.uid()
        AND (ou.role = 'admin' OR ou.is_superuser = TRUE)
        AND mo.role IN ('owner', 'administrator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Measures table policies
CREATE POLICY measures_view_policy ON measures
    FOR SELECT
    USING (has_measure_access(id));

CREATE POLICY measures_insert_policy ON measures
    FOR INSERT
    WITH CHECK (
        -- User must be admin of the organization owning the measure
        EXISTS (
            SELECT 1 
            FROM organization_users ou 
            WHERE ou.organization_id = organization_id
            AND ou.user_id = auth.uid()
            AND (ou.role = 'admin' OR ou.is_superuser = TRUE)
        )
        OR is_domain_superuser()
    );

CREATE POLICY measures_update_policy ON measures
    FOR UPDATE
    USING (has_measure_admin_access(id))
    WITH CHECK (has_measure_admin_access(id));

CREATE POLICY measures_delete_policy ON measures
    FOR DELETE
    USING (has_measure_admin_access(id));

-- Measure projects policies
CREATE POLICY measure_projects_view_policy ON measure_projects
    FOR SELECT
    USING (has_measure_access(measure_id));

CREATE POLICY measure_projects_insert_policy ON measure_projects
    FOR INSERT
    WITH CHECK (has_measure_admin_access(measure_id));

CREATE POLICY measure_projects_update_policy ON measure_projects
    FOR UPDATE
    USING (has_measure_admin_access(measure_id))
    WITH CHECK (has_measure_admin_access(measure_id));

CREATE POLICY measure_projects_delete_policy ON measure_projects
    FOR DELETE
    USING (has_measure_admin_access(measure_id));

-- Measure organizations policies
CREATE POLICY measure_organizations_view_policy ON measure_organizations
    FOR SELECT
    USING (has_measure_access(measure_id));

CREATE POLICY measure_organizations_insert_policy ON measure_organizations
    FOR INSERT
    WITH CHECK (has_measure_admin_access(measure_id));

CREATE POLICY measure_organizations_update_policy ON measure_organizations
    FOR UPDATE
    USING (has_measure_admin_access(measure_id))
    WITH CHECK (has_measure_admin_access(measure_id));

CREATE POLICY measure_organizations_delete_policy ON measure_organizations
    FOR DELETE
    USING (has_measure_admin_access(measure_id));

-- Measure reporting policies
CREATE POLICY measure_reporting_view_policy ON measure_reporting
    FOR SELECT
    USING (
        -- Users can view reports from measures they have access to
        has_measure_access(measure_id)
        -- And reports from their own organization
        OR has_organization_access(organization_id)
    );

CREATE POLICY measure_reporting_insert_policy ON measure_reporting
    FOR INSERT
    WITH CHECK (
        -- Users can create reports for their own organization if they have measure access
        has_organization_access(organization_id)
        AND has_measure_access(measure_id)
    );

CREATE POLICY measure_reporting_update_policy ON measure_reporting
    FOR UPDATE
    USING (
        -- Own organization's reports or measure admin
        (has_organization_access(organization_id) AND submitted_by = auth.uid())
        OR has_measure_admin_access(measure_id)
    )
    WITH CHECK (
        -- Own organization's reports or measure admin
        (has_organization_access(organization_id) AND submitted_by = auth.uid())
        OR has_measure_admin_access(measure_id)
    );

CREATE POLICY measure_reporting_delete_policy ON measure_reporting
    FOR DELETE
    USING (
        -- Only admins of the owning organization or measure admins can delete
        (is_organization_admin(organization_id) AND status = 'draft')
        OR has_measure_admin_access(measure_id)
    );

-- Measure reporting projects policies
CREATE POLICY measure_reporting_projects_view_policy ON measure_reporting_projects
    FOR SELECT
    USING (
        -- Users can view if they have access to the reporting
        EXISTS (
            SELECT 1 FROM measure_reporting mr
            WHERE mr.id = reporting_id
            AND (
                has_organization_access(mr.organization_id)
                OR has_measure_access(mr.measure_id)
            )
        )
    );

CREATE POLICY measure_reporting_projects_insert_policy ON measure_reporting_projects
    FOR INSERT
    WITH CHECK (
        -- Users can add projects to reports they own
        EXISTS (
            SELECT 1 FROM measure_reporting mr
            WHERE mr.id = reporting_id
            AND has_organization_access(mr.organization_id)
            AND (mr.submitted_by = auth.uid() OR is_organization_admin(mr.organization_id))
        )
    );

CREATE POLICY measure_reporting_projects_update_policy ON measure_reporting_projects
    FOR UPDATE
    USING (
        -- Users can update projects in reports they own
        EXISTS (
            SELECT 1 FROM measure_reporting mr
            WHERE mr.id = reporting_id
            AND (
                (has_organization_access(mr.organization_id) AND mr.submitted_by = auth.uid())
                OR is_organization_admin(mr.organization_id)
                OR has_measure_admin_access(mr.measure_id)
            )
        )
    )
    WITH CHECK (
        -- Users can update projects in reports they own
        EXISTS (
            SELECT 1 FROM measure_reporting mr
            WHERE mr.id = reporting_id
            AND (
                (has_organization_access(mr.organization_id) AND mr.submitted_by = auth.uid())
                OR is_organization_admin(mr.organization_id)
                OR has_measure_admin_access(mr.measure_id)
            )
        )
    );

CREATE POLICY measure_reporting_projects_delete_policy ON measure_reporting_projects
    FOR DELETE
    USING (
        -- Users can delete projects from reports they own
        EXISTS (
            SELECT 1 FROM measure_reporting mr
            WHERE mr.id = reporting_id
            AND (
                (has_organization_access(mr.organization_id) AND mr.submitted_by = auth.uid() AND mr.status = 'draft')
                OR is_organization_admin(mr.organization_id)
                OR has_measure_admin_access(mr.measure_id)
            )
        )
    ); 