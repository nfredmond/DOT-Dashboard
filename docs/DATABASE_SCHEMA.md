# Database Schema Documentation

This document outlines the database schema for the Planning Manager application, including tables, relationships, and indexes.

## Overview

The application uses PostgreSQL with PostGIS extension for spatial data handling. The database is hosted on Supabase.

## Tables

### Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX users_email_idx ON users (email);
CREATE INDEX users_role_idx ON users (role);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Projects

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    location GEOMETRY(POINT, 4326),
    metadata JSONB DEFAULT '{}',
    score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Indexes
CREATE INDEX projects_user_id_idx ON projects (user_id);
CREATE INDEX projects_organization_id_idx ON projects (organization_id);
CREATE INDEX projects_status_idx ON projects (status);
CREATE INDEX projects_score_idx ON projects (score);
CREATE INDEX projects_location_idx ON projects USING GIST (location);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Project Criteria

```sql
CREATE TABLE project_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    score INTEGER NOT NULL,
    weight NUMERIC(3,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 5),
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 1)
);

-- Indexes
CREATE INDEX project_criteria_project_id_idx ON project_criteria (project_id);
CREATE INDEX project_criteria_category_idx ON project_criteria (category);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON project_criteria
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Organizations

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX organizations_name_idx ON organizations (name);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Organization Members

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'member', 'viewer'))
);

-- Indexes
CREATE INDEX organization_members_organization_id_idx ON organization_members (organization_id);
CREATE INDEX organization_members_user_id_idx ON organization_members (user_id);
CREATE INDEX organization_members_role_idx ON organization_members (role);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Attachments

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX attachments_project_id_idx ON attachments (project_id);
CREATE INDEX attachments_type_idx ON attachments (type);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Comments

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX comments_project_id_idx ON comments (project_id);
CREATE INDEX comments_user_id_idx ON comments (user_id);
CREATE INDEX comments_parent_id_idx ON comments (parent_id);

-- Triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

### Activities

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX activities_user_id_idx ON activities (user_id);
CREATE INDEX activities_project_id_idx ON activities (project_id);
CREATE INDEX activities_action_idx ON activities (action);
CREATE INDEX activities_created_at_idx ON activities (created_at);
```

## Functions and Triggers

### Updated Timestamp

```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Project Score Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_project_score(project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_score NUMERIC := 0;
    total_weight NUMERIC := 0;
BEGIN
    SELECT 
        SUM(score * weight) / SUM(weight) INTO total_score
    FROM 
        project_criteria
    WHERE 
        project_id = $1;
    
    UPDATE projects
    SET score = total_score
    WHERE id = $1;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic score calculation
CREATE TRIGGER update_project_score
    AFTER INSERT OR UPDATE OR DELETE ON project_criteria
    FOR EACH ROW
    EXECUTE FUNCTION calculate_project_score(NEW.project_id);
```

## Row Level Security (RLS)

### Projects

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view organization projects"
    ON projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can modify their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organization admins can modify organization projects"
    ON projects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

### Comments

```sql
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view project comments"
    ON comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = comments.project_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = projects.organization_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = comments.project_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = projects.organization_id
                    AND user_id = auth.uid()
                )
            )
        )
    );
```

## Views

### Project Summary

```sql
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.score,
    u.name as owner_name,
    o.name as organization_name,
    COUNT(DISTINCT a.id) as attachment_count,
    COUNT(DISTINCT c.id) as comment_count,
    p.created_at,
    p.updated_at
FROM 
    projects p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN organizations o ON p.organization_id = o.id
    LEFT JOIN attachments a ON p.id = a.project_id
    LEFT JOIN comments c ON p.id = c.project_id
GROUP BY 
    p.id, p.name, p.status, p.score, u.name, o.name, p.created_at, p.updated_at;
```

### User Activity Summary

```sql
CREATE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT a.id) as activity_count,
    MAX(a.created_at) as last_activity
FROM 
    users u
    LEFT JOIN projects p ON u.id = p.user_id
    LEFT JOIN comments c ON u.id = c.user_id
    LEFT JOIN activities a ON u.id = a.user_id
GROUP BY 
    u.id, u.name;
```

## Indexes

### Spatial Indexes

```sql
-- Project location index
CREATE INDEX projects_location_gist_idx ON projects USING GIST (location);

-- Spatial clustering index
CREATE INDEX projects_location_cluster_idx ON projects 
USING GIST (ST_ClusterDBSCAN(location, eps := 0.01, minpoints := 3) OVER ());
```

### Full Text Search

```sql
-- Project search index
CREATE INDEX projects_search_idx ON projects 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Comment search index
CREATE INDEX comments_search_idx ON comments
USING GIN (to_tsvector('english', content));
```

## Materialized Views

### Project Statistics

```sql
CREATE MATERIALIZED VIEW project_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    status,
    COUNT(*) as project_count,
    AVG(score) as avg_score,
    MIN(score) as min_score,
    MAX(score) as max_score
FROM 
    projects
GROUP BY 
    DATE_TRUNC('month', created_at),
    status
WITH DATA;

-- Refresh schedule
CREATE OR REPLACE FUNCTION refresh_project_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW project_statistics;
END;
$$ LANGUAGE plpgsql;

-- Create a daily refresh job
SELECT cron.schedule('0 0 * * *', 'SELECT refresh_project_statistics()');
```

## Extensions

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Spatial functionality
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query analysis
CREATE EXTENSION IF NOT EXISTS "pg_cron";        -- Job scheduling
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
```

## Backup and Recovery

```sql
-- Backup function
CREATE OR REPLACE FUNCTION backup_database()
RETURNS void AS $$
BEGIN
    -- Create backup
    PERFORM pg_dump_all();
    
    -- Archive backup
    PERFORM archive_backup();
    
    -- Clean old backups
    PERFORM cleanup_old_backups();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily backups
SELECT cron.schedule('0 0 * * *', 'SELECT backup_database()');
```

## Performance Considerations

1. **Partitioning**
   - Consider partitioning large tables by date
   - Implement partitioning for activities and comments

2. **Vacuum**
   - Regular VACUUM ANALYZE on heavily modified tables
   - Monitor table bloat

3. **Maintenance**
   - Regular index maintenance
   - Statistics updates
   - Query optimization

## Security Considerations

1. **Access Control**
   - Row Level Security (RLS) policies
   - Role-based access control
   - Object-level permissions

2. **Data Protection**
   - Encryption at rest
   - Secure connections
   - Audit logging

3. **Monitoring**
   - Query performance
   - Resource usage
   - Security events
