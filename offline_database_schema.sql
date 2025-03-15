-- Planning Manager v5 - Offline Database Support
-- SQL schema modifications to support offline functionality

--------------------------------------------------------------------------------
-- Sync Tables
--------------------------------------------------------------------------------

-- Create sync_status table to track synchronization state
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_version INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(record_id, table_name)
);

-- Create sync_queue table to track pending changes
CREATE TABLE sync_queue (
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

-- Create indices for sync tables
CREATE INDEX sync_status_record_id_idx ON sync_status(record_id);
CREATE INDEX sync_status_table_name_idx ON sync_status(table_name);
CREATE INDEX sync_queue_record_id_idx ON sync_queue(record_id);
CREATE INDEX sync_queue_agency_id_idx ON sync_queue(agency_id);
CREATE INDEX sync_queue_client_id_idx ON sync_queue(client_id);
CREATE INDEX sync_queue_processed_at_idx ON sync_queue(processed_at);

--------------------------------------------------------------------------------
-- Add Sync Columns to Existing Tables
--------------------------------------------------------------------------------

-- Add sync tracking columns to projects table
ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN client_id TEXT;
ALTER TABLE projects ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;

-- Add sync tracking columns to scoring table
ALTER TABLE scoring ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE scoring ADD COLUMN client_id TEXT;
ALTER TABLE scoring ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;

-- Add sync tracking columns to feedback table
ALTER TABLE feedback ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE feedback ADD COLUMN client_id TEXT;
ALTER TABLE feedback ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;

-- Add sync tracking columns to documents table
ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN client_id TEXT;
ALTER TABLE documents ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;

-- Add sync tracking columns to criteria table
ALTER TABLE criteria ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE criteria ADD COLUMN client_id TEXT;
ALTER TABLE criteria ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;

--------------------------------------------------------------------------------
-- Sync Management Functions
--------------------------------------------------------------------------------

-- Function to increment version number on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.is_synced = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for version tracking
CREATE TRIGGER increment_project_version
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_scoring_version
BEFORE UPDATE ON scoring
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_feedback_version
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_document_version
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_criteria_version
BEFORE UPDATE ON criteria
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Function to record changes to the sync queue
CREATE OR REPLACE FUNCTION record_to_sync_queue()
RETURNS TRIGGER AS $$
DECLARE
    agency_id_val UUID;
    operation_val TEXT;
    data_val JSONB;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        operation_val := 'INSERT';
        data_val := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        operation_val := 'UPDATE';
        data_val := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        operation_val := 'DELETE';
        data_val := to_jsonb(OLD);
    END IF;
    
    -- Determine agency_id based on table
    IF TG_TABLE_NAME = 'projects' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'scoring' THEN
        SELECT p.agency_id INTO agency_id_val 
        FROM projects p 
        WHERE p.id = CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
    ELSIF TG_TABLE_NAME = 'criteria' THEN
        agency_id_val := CASE WHEN TG_OP = 'DELETE' THEN OLD.agency_id ELSE NEW.agency_id END;
    ELSIF TG_TABLE_NAME = 'feedback' THEN
        SELECT p.agency_id INTO agency_id_val 
        FROM projects p 
        WHERE p.id = CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
    ELSIF TG_TABLE_NAME = 'documents' THEN
        SELECT p.agency_id INTO agency_id_val 
        FROM projects p 
        WHERE p.id = CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
    END IF;
    
    -- Insert into sync queue when changes occur from server
    -- Client changes will be tracked separately via the API
    IF (TG_OP = 'DELETE' OR NEW.client_id IS NULL) THEN
        INSERT INTO sync_queue (
            record_id,
            table_name,
            operation,
            data,
            client_id,
            agency_id
        ) VALUES (
            CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
            TG_TABLE_NAME,
            operation_val,
            data_val,
            'server',
            agency_id_val
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to record changes to sync queue
CREATE TRIGGER record_project_changes
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION record_to_sync_queue();

CREATE TRIGGER record_scoring_changes
AFTER INSERT OR UPDATE OR DELETE ON scoring
FOR EACH ROW EXECUTE FUNCTION record_to_sync_queue();

CREATE TRIGGER record_feedback_changes
AFTER INSERT OR UPDATE OR DELETE ON feedback
FOR EACH ROW EXECUTE FUNCTION record_to_sync_queue();

CREATE TRIGGER record_document_changes
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION record_to_sync_queue();

CREATE TRIGGER record_criteria_changes
AFTER INSERT OR UPDATE OR DELETE ON criteria
FOR EACH ROW EXECUTE FUNCTION record_to_sync_queue();

--------------------------------------------------------------------------------
-- Sync API Support Functions
--------------------------------------------------------------------------------

-- Function to get changes since a specific timestamp
CREATE OR REPLACE FUNCTION get_changes_since(
    since_timestamp TIMESTAMPTZ,
    agency_id_param UUID,
    requested_tables TEXT[] DEFAULT ARRAY['projects', 'criteria', 'scoring', 'feedback', 'documents']
)
RETURNS TABLE (
    table_name TEXT,
    record_id UUID,
    data JSONB,
    operation TEXT,
    version INTEGER,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    table_name_var TEXT;
BEGIN
    -- Loop through requested tables and return changes
    FOREACH table_name_var IN ARRAY requested_tables
    LOOP
        IF table_name_var = 'projects' AND 'projects' = ANY(requested_tables) THEN
            RETURN QUERY
            SELECT 
                'projects'::TEXT,
                p.id,
                to_jsonb(p),
                'UPDATE'::TEXT,
                p.version,
                p.updated_at
            FROM 
                projects p
            WHERE 
                p.agency_id = agency_id_param
                AND p.updated_at > since_timestamp;
        END IF;
        
        IF table_name_var = 'criteria' AND 'criteria' = ANY(requested_tables) THEN
            RETURN QUERY
            SELECT 
                'criteria'::TEXT,
                c.id,
                to_jsonb(c),
                'UPDATE'::TEXT,
                c.version,
                c.created_at
            FROM 
                criteria c
            WHERE 
                c.agency_id = agency_id_param
                AND c.created_at > since_timestamp;
        END IF;
        
        IF table_name_var = 'scoring' AND 'scoring' = ANY(requested_tables) THEN
            RETURN QUERY
            SELECT 
                'scoring'::TEXT,
                s.id,
                to_jsonb(s),
                'UPDATE'::TEXT,
                s.version,
                s.created_at
            FROM 
                scoring s
            JOIN 
                projects p ON s.project_id = p.id
            WHERE 
                p.agency_id = agency_id_param
                AND s.created_at > since_timestamp;
        END IF;
        
        IF table_name_var = 'feedback' AND 'feedback' = ANY(requested_tables) THEN
            RETURN QUERY
            SELECT 
                'feedback'::TEXT,
                f.id,
                to_jsonb(f),
                'UPDATE'::TEXT,
                f.version,
                f.created_at
            FROM 
                feedback f
            JOIN 
                projects p ON f.project_id = p.id
            WHERE 
                p.agency_id = agency_id_param
                AND f.created_at > since_timestamp;
        END IF;
        
        IF table_name_var = 'documents' AND 'documents' = ANY(requested_tables) THEN
            RETURN QUERY
            SELECT 
                'documents'::TEXT,
                d.id,
                to_jsonb(d),
                'UPDATE'::TEXT,
                d.version,
                d.created_at
            FROM 
                documents d
            JOIN 
                projects p ON d.project_id = p.id
            WHERE 
                p.agency_id = agency_id_param
                AND d.created_at > since_timestamp;
        END IF;
    END LOOP;
    
    -- Also include deleted records from sync_queue
    RETURN QUERY
    SELECT 
        sq.table_name,
        sq.record_id,
        sq.data,
        sq.operation,
        0,
        sq.created_at
    FROM 
        sync_queue sq
    WHERE 
        sq.agency_id = agency_id_param
        AND sq.operation = 'DELETE'
        AND sq.created_at > since_timestamp
        AND sq.table_name = ANY(requested_tables);
END;
$$ LANGUAGE plpgsql;

-- Function to resolve conflicts in sync data
CREATE OR REPLACE FUNCTION resolve_sync_conflict(
    record_id_param UUID,
    table_name_param TEXT,
    server_data JSONB,
    client_data JSONB,
    conflict_strategy TEXT DEFAULT 'server_wins'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    server_version INTEGER;
    client_version INTEGER;
    field_name TEXT;
    server_field_value JSONB;
    client_field_value JSONB;
BEGIN
    -- Extract versions
    server_version := (server_data->>'version')::INTEGER;
    client_version := (client_data->>'version')::INTEGER;
    
    -- Choose resolution strategy
    IF conflict_strategy = 'server_wins' THEN
        result := server_data;
    ELSIF conflict_strategy = 'client_wins' THEN
        result := client_data;
    ELSIF conflict_strategy = 'newest_wins' THEN
        IF client_version > server_version THEN
            result := client_data;
        ELSE
            result := server_data;
        END IF;
    ELSIF conflict_strategy = 'field_level_merge' THEN
        -- Start with server data
        result := server_data;
        
        -- Loop through each field in client data
        FOR field_name, client_field_value IN SELECT * FROM jsonb_each(client_data)
        LOOP
            -- Skip version and sync fields
            IF field_name NOT IN ('version', 'is_synced', 'client_id') THEN
                server_field_value := server_data->field_name;
                
                -- If field values differ, keep client value for non-system fields
                IF client_field_value IS DISTINCT FROM server_field_value THEN
                    result := jsonb_set(result, ARRAY[field_name], client_field_value);
                END IF;
            END IF;
        END LOOP;
        
        -- Use the higher version number
        IF client_version > server_version THEN
            result := jsonb_set(result, ARRAY['version'], to_jsonb(client_version));
        END IF;
    END IF;
    
    -- Set is_synced to true
    result := jsonb_set(result, ARRAY['is_synced'], 'true'::jsonb);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- Row-Level Security Policies
--------------------------------------------------------------------------------

-- Enable RLS on sync tables
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync tables
CREATE POLICY sync_queue_agency_policy ON sync_queue
    FOR ALL
    USING (agency_id = get_user_agency_id());

CREATE POLICY sync_status_policy ON sync_status
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sync_status.record_id
            AND projects.agency_id = get_user_agency_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM scoring
            WHERE scoring.id = sync_status.record_id
            AND EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = scoring.project_id
                AND projects.agency_id = get_user_agency_id()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM criteria
            WHERE criteria.id = sync_status.record_id
            AND criteria.agency_id = get_user_agency_id()
        )
        OR
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = sync_status.record_id
            AND EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = documents.project_id
                AND projects.agency_id = get_user_agency_id()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM feedback
            WHERE feedback.id = sync_status.record_id
            AND EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = feedback.project_id
                AND projects.agency_id = get_user_agency_id()
            )
        )
    );

--------------------------------------------------------------------------------
-- Cleanup Functions (For Development)
--------------------------------------------------------------------------------

-- WARNING: For development use only
/*
-- Drop added columns
ALTER TABLE projects DROP COLUMN IF EXISTS version;
ALTER TABLE projects DROP COLUMN IF EXISTS client_id;
ALTER TABLE projects DROP COLUMN IF EXISTS is_synced;

ALTER TABLE scoring DROP COLUMN IF EXISTS version;
ALTER TABLE scoring DROP COLUMN IF EXISTS client_id;
ALTER TABLE scoring DROP COLUMN IF EXISTS is_synced;

ALTER TABLE feedback DROP COLUMN IF EXISTS version;
ALTER TABLE feedback DROP COLUMN IF EXISTS client_id;
ALTER TABLE feedback DROP COLUMN IF EXISTS is_synced;

ALTER TABLE documents DROP COLUMN IF EXISTS version;
ALTER TABLE documents DROP COLUMN IF EXISTS client_id;
ALTER TABLE documents DROP COLUMN IF EXISTS is_synced;

ALTER TABLE criteria DROP COLUMN IF EXISTS version;
ALTER TABLE criteria DROP COLUMN IF EXISTS client_id;
ALTER TABLE criteria DROP COLUMN IF EXISTS is_synced;

-- Drop triggers
DROP TRIGGER IF EXISTS increment_project_version ON projects;
DROP TRIGGER IF EXISTS increment_scoring_version ON scoring;
DROP TRIGGER IF EXISTS increment_feedback_version ON feedback;
DROP TRIGGER IF EXISTS increment_document_version ON documents;
DROP TRIGGER IF EXISTS increment_criteria_version ON criteria;

DROP TRIGGER IF EXISTS record_project_changes ON projects;
DROP TRIGGER IF EXISTS record_scoring_changes ON scoring;
DROP TRIGGER IF EXISTS record_feedback_changes ON feedback;
DROP TRIGGER IF EXISTS record_document_changes ON documents;
DROP TRIGGER IF EXISTS record_criteria_changes ON criteria;

-- Drop functions
DROP FUNCTION IF EXISTS increment_version CASCADE;
DROP FUNCTION IF EXISTS record_to_sync_queue CASCADE;
DROP FUNCTION IF EXISTS get_changes_since CASCADE;
DROP FUNCTION IF EXISTS resolve_sync_conflict CASCADE;

-- Drop tables
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS sync_status CASCADE;
*/ 