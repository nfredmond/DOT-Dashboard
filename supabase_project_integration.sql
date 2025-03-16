-- Project Management Integration System - Schema Updates
-- This file contains schema updates to support the project management integration system

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Update the projects table to include fields needed for map integration
ALTER TABLE IF EXISTS projects
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"latitude": 0, "longitude": 0}',
ADD COLUMN IF NOT EXISTS geometry JSONB; -- Stores GeoJSON-compatible geometry

-- Create a table for project synchronization status
CREATE TABLE IF NOT EXISTS project_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
    sync_error TEXT,
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a function to update the geometry column from coordinates
CREATE OR REPLACE FUNCTION update_project_geometry()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract latitude and longitude from coordinates JSONB
    IF NEW.coordinates IS NOT NULL AND 
       NEW.coordinates ? 'latitude' AND 
       NEW.coordinates ? 'longitude' THEN
        
        -- Create a Point geometry by default
        NEW.geometry = jsonb_build_object(
            'type', 'Point',
            'coordinates', jsonb_build_array(
                (NEW.coordinates->>'longitude')::float,
                (NEW.coordinates->>'latitude')::float
            )
        );
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geometry when coordinates change
DROP TRIGGER IF EXISTS trigger_update_project_geometry ON projects;
CREATE TRIGGER trigger_update_project_geometry
BEFORE INSERT OR UPDATE OF coordinates ON projects
FOR EACH ROW
EXECUTE FUNCTION update_project_geometry();

-- Create a table for project events for the event-based system
CREATE TABLE IF NOT EXISTS project_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL CHECK (event_type IN ('added', 'updated', 'deleted')),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_project_sync_status_project_id ON project_sync_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_event_type ON project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON projects USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_projects_geometry ON projects USING GIN (geometry);

-- Create a function to log project events
CREATE OR REPLACE FUNCTION log_project_event(
    p_event_type TEXT,
    p_project_id UUID,
    p_event_data JSONB
)
RETURNS UUID AS $$
DECLARE
    new_event_id UUID;
BEGIN
    INSERT INTO project_events (
        event_type,
        project_id,
        user_id,
        event_data
    ) VALUES (
        p_event_type,
        p_project_id,
        auth.uid(),
        p_event_data
    )
    RETURNING id INTO new_event_id;
    
    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all projects with their latest sync status
CREATE OR REPLACE FUNCTION get_projects_with_sync_status()
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    project_description TEXT,
    project_status TEXT,
    project_category TEXT,
    coordinates JSONB,
    geometry JSONB,
    location TEXT,
    allocated_budget NUMERIC,
    start_date TEXT,
    end_date TEXT,
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS project_id,
        p.name AS project_name,
        p.description AS project_description,
        p.status AS project_status,
        p.type AS project_category,
        p.coordinates,
        p.geometry,
        p.location,
        COALESCE((p.metadata->>'allocatedBudget')::NUMERIC, 0) AS allocated_budget,
        p.metadata->>'startDate' AS start_date,
        p.metadata->>'endDate' AS end_date,
        COALESCE(pss.last_synced_at, NOW()) AS last_synced_at,
        COALESCE(pss.sync_status, 'synced') AS sync_status
    FROM 
        projects p
    LEFT JOIN 
        project_sync_status pss ON p.id = pss.project_id
    WHERE 
        p.agency_id = get_user_agency_id()
    ORDER BY 
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- RLS for project_sync_status table
ALTER TABLE project_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_sync_status_select_policy ON project_sync_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY project_sync_status_insert_policy ON project_sync_status
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY project_sync_status_update_policy ON project_sync_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY project_sync_status_delete_policy ON project_sync_status
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

-- RLS for project_events table
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_events_select_policy ON project_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

CREATE POLICY project_events_insert_policy ON project_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.agency_id = get_user_agency_id()
        )
    );

-- Sample data to test the integration (commented out for safety)
/*
-- Sample projects with GeoJSON geometries
INSERT INTO projects (
    name, 
    description, 
    status, 
    type, 
    agency_id, 
    created_by,
    coordinates,
    geometry,
    location,
    metadata
) VALUES (
    'Highway 101 Expansion', 
    'Expansion of Highway 101 to reduce congestion', 
    'planning', 
    'Highway', 
    (SELECT id FROM agencies LIMIT 1), 
    (SELECT id FROM auth.users LIMIT 1),
    '{"latitude": 34.42083, "longitude": -119.698189}',
    '{"type": "LineString", "coordinates": [[-119.698189, 34.42083], [-119.702, 34.43]]}',
    'Santa Barbara, CA',
    '{"allocatedBudget": 24000000, "startDate": "2023-05-15", "endDate": "2024-12-31"}'
),
(
    'Downtown Light Rail', 
    'New light rail system connecting downtown area', 
    'planning', 
    'Transit', 
    (SELECT id FROM agencies LIMIT 1), 
    (SELECT id FROM auth.users LIMIT 1),
    '{"latitude": 34.41889, "longitude": -119.694792}',
    '{"type": "Point", "coordinates": [-119.694792, 34.41889]}',
    'Santa Barbara, CA',
    '{"allocatedBudget": 12000000, "startDate": "2024-01-10", "endDate": "2025-06-30"}'
);
*/ 