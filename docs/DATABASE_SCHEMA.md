# Planning Manager v7 Database Schema

This document provides a comprehensive reference for the Planning Manager v7 database schema. The schema is designed to support full project management integration, LLM capabilities, MCP servers, and Agents SDK.

## Overview

The database schema is organized into the following categories:

1. **Core Tables**: Basic entities like agencies, profiles, and projects
2. **Project Management**: Project details, milestones, funding, and attachments
3. **Scoring & Prioritization**: Criteria definition and project scoring
4. **Scenario Planning**: Alternative project scenarios and comparisons
5. **AI & LLM Integration**: AI model definitions and voice settings
6. **MCP & Agents Integration**: Model Context Protocol and Agents SDK settings
7. **User Settings**: User preferences and voice configurations

## Database Extensions

The schema requires the following PostgreSQL extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
```

## Core Tables

### Agencies

```sql
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Profiles

```sql
CREATE TABLE profiles (
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
```

### Projects

```sql
CREATE TABLE projects (
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
```

### Project Users

```sql
CREATE TABLE project_users (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'contributor', 'viewer')),
    PRIMARY KEY (project_id, user_id)
);
```

## Project Management Tables

### Project Milestones

```sql
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    dependencies UUID[] DEFAULT '{}', -- Array of other milestone IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);
```

### Funding Sources

```sql
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    fiscal_year TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'secured', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sync fields
    version INTEGER DEFAULT 1,
    client_id TEXT,
    is_synced BOOLEAN DEFAULT TRUE
);
```

### Document Attachments

```sql
CREATE TABLE document_attachments (
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
```

## MCP & Agents Integration

### MCP Servers

```sql
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    capabilities JSONB DEFAULT '{"thinking": true, "vision": false, "research": true}',
    provider TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Agent Settings

```sql
CREATE TABLE agent_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{"thinking": true, "vision": false, "research": true}',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Sync Logs

```sql
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('upload', 'download', 'full')),
    entities_synced JSONB,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('started', 'completed', 'failed')),
    error_details TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

## Scoring & Prioritization

### Criteria

```sql
CREATE TABLE criteria (
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
```

### Scoring

```sql
CREATE TABLE scoring (
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
```

## Scenario Planning

### Project Scenarios

```sql
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
```

### Scenario Comparisons

```sql
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
```

## AI & LLM Integration

### AI Models

```sql
CREATE TABLE ai_models (
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
```

### Voice Settings

```sql
CREATE TABLE voice_settings (
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
```

### Voice Command Logs

```sql
CREATE TABLE voice_command_logs (
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
```

## User Settings

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    voice_settings_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Row-Level Security Policies

The schema implements comprehensive Row-Level Security (RLS) policies to ensure proper data isolation and authorization:

### Agency Security

```sql
CREATE POLICY agency_select_policy ON agencies
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM profiles WHERE agency_id = agencies.id
    ));

CREATE POLICY agency_insert_policy ON agencies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isGlobalAdmin = TRUE)
    );

CREATE POLICY agency_update_policy ON agencies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND agency_id = agencies.id AND role = 'admin')
    );
```

### Project Security

```sql
CREATE POLICY project_select_policy ON projects
    FOR SELECT USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY project_insert_policy ON projects
    FOR INSERT WITH CHECK (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY project_update_policy ON projects
    FOR UPDATE USING (
        auth.uid() = created_by OR
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')) OR
        EXISTS (SELECT 1 FROM project_users WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('manager', 'contributor'))
    );

CREATE POLICY project_delete_policy ON projects
    FOR DELETE USING (
        auth.uid() = created_by OR
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );
```

### MCP & Agents Security

```sql
CREATE POLICY mcp_servers_select_policy ON mcp_servers
    FOR SELECT USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY mcp_servers_insert_policy ON mcp_servers
    FOR INSERT WITH CHECK (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY mcp_servers_update_policy ON mcp_servers
    FOR UPDATE USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY mcp_servers_delete_policy ON mcp_servers
    FOR DELETE USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY agent_settings_select_policy ON agent_settings
    FOR SELECT USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY agent_settings_insert_policy ON agent_settings
    FOR INSERT WITH CHECK (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY agent_settings_update_policy ON agent_settings
    FOR UPDATE USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY agent_settings_delete_policy ON agent_settings
    FOR DELETE USING (
        agency_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );
```

## Database Functions

### Version Management for Sync

```sql
CREATE OR REPLACE FUNCTION increment_version() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.is_synced := TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for projects
CREATE TRIGGER update_projects_version
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Triggers for criteria
CREATE TRIGGER update_criteria_version
BEFORE UPDATE ON criteria
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Triggers for scoring
CREATE TRIGGER update_scoring_version
BEFORE UPDATE ON scoring
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Triggers for project_milestones
CREATE TRIGGER update_project_milestones_version
BEFORE UPDATE ON project_milestones
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Triggers for funding_sources
CREATE TRIGGER update_funding_sources_version
BEFORE UPDATE ON funding_sources
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Triggers for document_attachments
CREATE TRIGGER update_document_attachments_version
BEFORE UPDATE ON document_attachments
FOR EACH ROW
EXECUTE FUNCTION increment_version();
```

## Indexes

```sql
-- Improve query performance for projects
CREATE INDEX idx_projects_agency ON projects(agency_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_type_category ON projects(type, category);
CREATE INDEX idx_projects_geometry ON projects USING GIST(geometry);

-- Improve performance for project associations
CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_funding_sources_project ON funding_sources(project_id);
CREATE INDEX idx_document_attachments_project ON document_attachments(project_id);
CREATE INDEX idx_scores_project ON scoring(project_id);
CREATE INDEX idx_scores_criteria ON scoring(criteria_id);

-- Improve performance for MCP and agent settings
CREATE INDEX idx_mcp_servers_agency ON mcp_servers(agency_id);
CREATE INDEX idx_mcp_servers_active ON mcp_servers(is_active);
CREATE INDEX idx_agent_settings_agency ON agent_settings(agency_id);
CREATE INDEX idx_agent_settings_active ON agent_settings(is_active);
```

## Schema Management

### Full Schema Reset Script

```sql
-- Drop everything and reinstall from scratch
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Re-create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- Run all of the table creation SQL statements from above
```

## Using the Schema

This schema definition is comprehensive and designed to support all aspects of the Planning Manager v7 application. To use it:

1. Connect to your Supabase PostgreSQL database
2. Run the complete `supabase_schema.sql` script
3. Verify all tables, functions, and policies are created correctly
4. Set up any initial seed data required for your application

The schema supports both normal online operation with full Supabase integration and offline capabilities with synchronization support.
