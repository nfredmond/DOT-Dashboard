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
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    type TEXT NOT NULL,
    location TEXT,
    geometry GEOMETRY,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- Project-related documents and files
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- Indices
--------------------------------------------------------------------------------

-- Indices for agencies table
CREATE INDEX agencies_created_at_idx ON agencies(created_at);

-- Indices for profiles table
CREATE INDEX profiles_agency_id_idx ON profiles(agency_id);
CREATE INDEX profiles_created_at_idx ON profiles(created_at);

-- Indices for projects table
CREATE INDEX projects_agency_id_idx ON projects(agency_id);
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
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
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
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'feedback' THEN
        -- Handle project relationship
        IF TG_OP = 'DELETE' THEN
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = NEW.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'scoring' THEN
        -- Handle project relationship
        IF TG_OP = 'DELETE' THEN
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.agency_id INTO agency_id_val 
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
            SELECT p.agency_id INTO agency_id_val 
            FROM projects p 
            WHERE p.id = OLD.project_id;
        ELSE
            SELECT p.agency_id INTO agency_id_val 
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
        SELECT agency_id
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- RLS Policies - Agency Level
--------------------------------------------------------------------------------

-- Agency policies
-- All users can view their agency
CREATE POLICY agency_view_policy ON agencies
    FOR SELECT
    USING (id = get_user_agency_id());

-- Profiles policies
-- Admins can view all profiles in their agency
CREATE POLICY profiles_admin_view_policy ON profiles
    FOR SELECT
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

-- Users can view their own profile
CREATE POLICY profiles_self_view_policy ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can insert/update profiles in their agency
CREATE POLICY profiles_admin_insert_policy ON profiles
    FOR INSERT
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

CREATE POLICY profiles_admin_update_policy ON profiles
    FOR UPDATE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    )
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

--------------------------------------------------------------------------------
-- RLS Policies - Project Management
--------------------------------------------------------------------------------

-- Projects policies
-- All users can view projects in their agency
CREATE POLICY projects_view_policy ON projects
    FOR SELECT
    USING (agency_id = get_user_agency_id());

-- Admins and editors can create projects
CREATE POLICY projects_insert_policy ON projects
    FOR INSERT
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

-- Admins and editors can update projects
CREATE POLICY projects_update_policy ON projects
    FOR UPDATE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    )
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

-- Only admins can delete projects
CREATE POLICY projects_delete_policy ON projects
    FOR DELETE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

-- Project users policies
-- All users can view project assignments in their agency
CREATE POLICY project_users_view_policy ON project_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_users.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );

-- Admins and editors can manage project users
CREATE POLICY project_users_insert_policy ON project_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_users.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

CREATE POLICY project_users_delete_policy ON project_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_users.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

--------------------------------------------------------------------------------
-- RLS Policies - Scoring System
--------------------------------------------------------------------------------

-- Criteria policies
-- All users can view criteria in their agency
CREATE POLICY criteria_view_policy ON criteria
    FOR SELECT
    USING (agency_id = get_user_agency_id());

-- Admins and editors can create and modify criteria
CREATE POLICY criteria_insert_policy ON criteria
    FOR INSERT
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

CREATE POLICY criteria_update_policy ON criteria
    FOR UPDATE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    )
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

-- Only admins can delete criteria
CREATE POLICY criteria_delete_policy ON criteria
    FOR DELETE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

-- Scoring policies
-- All users can view scoring in their agency
CREATE POLICY scoring_view_policy ON scoring
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scoring.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );

-- Admins and editors can create and update scores
CREATE POLICY scoring_insert_policy ON scoring
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scoring.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

CREATE POLICY scoring_update_policy ON scoring
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scoring.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scoring.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

-- Scoring templates policies
CREATE POLICY scoring_templates_view_policy ON scoring_templates
    FOR SELECT
    USING (agency_id = get_user_agency_id());

CREATE POLICY scoring_templates_insert_policy ON scoring_templates
    FOR INSERT
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

CREATE POLICY scoring_templates_update_policy ON scoring_templates
    FOR UPDATE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    )
    WITH CHECK (
        agency_id = get_user_agency_id() 
        AND is_admin_or_editor()
    );

CREATE POLICY scoring_templates_delete_policy ON scoring_templates
    FOR DELETE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );

-- Scoring template criteria policies
CREATE POLICY scoring_template_criteria_view_policy ON scoring_template_criteria
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM scoring_templates
            WHERE scoring_templates.id = scoring_template_criteria.template_id
            AND scoring_templates.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY scoring_template_criteria_insert_policy ON scoring_template_criteria
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM scoring_templates
            WHERE scoring_templates.id = scoring_template_criteria.template_id
            AND scoring_templates.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

CREATE POLICY scoring_template_criteria_delete_policy ON scoring_template_criteria
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM scoring_templates
            WHERE scoring_templates.id = scoring_template_criteria.template_id
            AND scoring_templates.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

--------------------------------------------------------------------------------
-- RLS Policies - Supporting Features
--------------------------------------------------------------------------------

-- Documents policies
CREATE POLICY documents_view_policy ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = documents.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY documents_insert_policy ON documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = documents.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

CREATE POLICY documents_delete_policy ON documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = documents.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin_or_editor()
    );

-- Feedback policies
CREATE POLICY feedback_view_policy ON feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = feedback.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );

-- Allow anonymous feedback insertion (handled at application level)
CREATE POLICY feedback_insert_policy ON feedback
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = feedback.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );

-- Only admins can delete feedback
CREATE POLICY feedback_delete_policy ON feedback
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = feedback.project_id
            AND projects.agency_id = get_user_agency_id()
        )
        AND is_admin()
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