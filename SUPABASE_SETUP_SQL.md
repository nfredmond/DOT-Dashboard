# Supabase Database Setup SQL

This document contains the complete SQL code needed to set up the database schema for the Planning Manager in the Supabase SQL Editor. Copy and paste these statements in order to create the full database structure with proper relationships, indices, and security policies.

## Getting Started

1. Log in to your Supabase dashboard
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Paste the SQL code below
6. Run the query

## Initial Setup

First, we'll enable the required extensions:

```sql
-- Enable UUID extension (should be enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Schema Creation

Now, let's create all the tables in order of dependency:

```sql
-- Create agencies table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table (usually handled by Supabase Auth, just for reference)
-- DO NOT RUN THIS if using Supabase Auth - it's handled automatically
/*
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
*/

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(agency_id, user_id)
);

-- Create projects table
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
CREATE TABLE project_users (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'contributor', 'viewer')),
    PRIMARY KEY (project_id, user_id)
);

-- Create criteria table
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
CREATE TABLE scoring_template_criteria (
    template_id UUID NOT NULL REFERENCES scoring_templates(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1),
    PRIMARY KEY (template_id, criteria_id)
);

-- Create documents table
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
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    location GEOMETRY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create llm_config table
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
CREATE TABLE llm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    request TEXT,
    response TEXT,
    tokens INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reports table
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
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Set Up Indices

Next, let's create the necessary indices for performance optimization:

```sql
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
```

## Functions and Triggers

Let's create functions and triggers for automated actions:

```sql
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

-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        agency_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        CASE
            WHEN TG_TABLE_NAME = 'agencies' THEN NEW.id
            WHEN TG_TABLE_NAME = 'profiles' THEN NEW.agency_id
            ELSE NEW.agency_id
        END,
        (SELECT auth.uid()),
        TG_OP,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old_data', to_jsonb(OLD))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
            ELSE jsonb_build_object('new_data', to_jsonb(NEW))
        END
    );
    
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

-- You can add similar triggers for other tables as needed
```

## Row-Level Security Policies

Finally, let's implement row-level security policies for multi-tenant isolation:

```sql
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

-- Agency policies

-- All users can view their agency
CREATE POLICY agency_view_policy ON agencies
    FOR SELECT
    USING (id = get_user_agency_id());

-- Only superadmins can modify agencies (you'll need to implement this)
-- In a multi-tenant SaaS, agency creation would be handled by superadmin functions

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

-- Similar policies for other tables
-- For brevity, I'll include a few more examples but you should extend this to all tables

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

-- Continue defining policies for all other tables following these patterns
```

## Sample Data (Optional)

Finally, let's insert some sample data for testing:

```sql
-- Insert a sample agency
INSERT INTO agencies (name, subdomain)
VALUES ('Demo Transportation Agency', 'demo');

-- Insert a sample admin user (assuming the user already exists in auth.users)
-- You would replace 'auth-user-id-here' with an actual user ID
INSERT INTO profiles (user_id, agency_id, role)
VALUES 
('auth-user-id-here', (SELECT id FROM agencies WHERE subdomain = 'demo'), 'admin');

-- Insert sample criteria
INSERT INTO criteria (agency_id, name, description, weight, category, type)
VALUES
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Safety', 'Improves safety conditions for all road users', 0.25, 'Safety', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Equity', 'Addresses transportation equity issues', 0.20, 'Social', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Environmental Impact', 'Reduces environmental harm', 0.15, 'Environment', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Cost Effectiveness', 'Value for investment', 0.20, 'Economic', 'numeric'),
((SELECT id FROM agencies WHERE subdomain = 'demo'), 'Congestion Relief', 'Reduces traffic congestion', 0.20, 'Operations', 'numeric');

-- Insert a sample project (replace 'auth-user-id-here' with the actual user ID)
INSERT INTO projects (
    agency_id, 
    name, 
    description, 
    status, 
    type, 
    location, 
    geometry, 
    created_by
)
VALUES (
    (SELECT id FROM agencies WHERE subdomain = 'demo'),
    'Downtown Transit Corridor Improvement',
    'This project will add dedicated bus lanes and improve pedestrian crossings along Main Street.',
    'planning',
    'transit',
    'Downtown - Main Street Corridor',
    ST_GeomFromText('LINESTRING(-122.419 37.775, -122.415 37.770, -122.412 37.765, -122.410 37.760)', 4326),
    'auth-user-id-here'
);

-- Add a score for the project
INSERT INTO scoring (project_id, criteria_id, score, notes, created_by)
SELECT 
    (SELECT id FROM projects WHERE name = 'Downtown Transit Corridor Improvement'),
    (SELECT id FROM criteria WHERE name = 'Safety'),
    85,
    'Project significantly improves pedestrian safety with new crossings and signals.',
    'auth-user-id-here';
```

## Cleanup (For Development Only)

If you need to clean up and start over (only use in development, NOT production):

```sql
-- WARNING: This will delete all data!
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
```

## Next Steps

After running this SQL, you'll have a complete database schema with:

1. All necessary tables with proper relationships
2. Indices for optimal query performance
3. Row-level security policies for multi-tenant isolation
4. Triggers for audit logging and timestamp management
5. Optional sample data for testing

You can now proceed to connect your application to the Supabase database and start using the Planning Manager system.
