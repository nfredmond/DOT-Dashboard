-- SWITRS (Statewide Integrated Traffic Records System) Integration Schema
-- This schema defines tables for storing California collision data from SWITRS/TIMS

-- Main collisions table
CREATE TABLE switrs_collisions (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,
    collision_date DATE NOT NULL,
    collision_time TIME,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location TEXT,
    primary_road TEXT,
    secondary_road TEXT,
    county_code TEXT,
    city_code TEXT,
    county_name TEXT,
    city_name TEXT,
    weather_condition TEXT,
    road_surface TEXT,
    road_condition TEXT,
    lighting_condition TEXT,
    pcf_violation TEXT,
    collision_severity_id INTEGER,
    severity_description TEXT,
    party_count INTEGER,
    injury_count INTEGER,
    fatality_count INTEGER,
    pedestrian_involved BOOLEAN DEFAULT FALSE,
    bicycle_involved BOOLEAN DEFAULT FALSE,
    motorcycle_involved BOOLEAN DEFAULT FALSE,
    truck_involved BOOLEAN DEFAULT FALSE,
    alcohol_involved BOOLEAN DEFAULT FALSE,
    drug_involved BOOLEAN DEFAULT FALSE,
    collision_type TEXT,
    hit_run_status TEXT,
    process_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Spatial point for the collision location
    geom GEOMETRY(POINT, 4326),
    UNIQUE(organization_id, case_id)
);

CREATE INDEX idx_switrs_collisions_org ON switrs_collisions(organization_id);
CREATE INDEX idx_switrs_collisions_date ON switrs_collisions(collision_date);
CREATE INDEX idx_switrs_collisions_severity ON switrs_collisions(collision_severity_id);
CREATE INDEX idx_switrs_collisions_geom ON switrs_collisions USING GIST(geom);
CREATE INDEX idx_switrs_collisions_county ON switrs_collisions(county_name);
CREATE INDEX idx_switrs_collisions_city ON switrs_collisions(city_name);
CREATE INDEX idx_switrs_collisions_pedestrian ON switrs_collisions(pedestrian_involved) WHERE pedestrian_involved = TRUE;
CREATE INDEX idx_switrs_collisions_bicycle ON switrs_collisions(bicycle_involved) WHERE bicycle_involved = TRUE;

-- Parties involved in collisions
CREATE TABLE switrs_parties (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,
    party_number INTEGER NOT NULL,
    party_type TEXT,
    at_fault BOOLEAN,
    age INTEGER,
    sex TEXT,
    sobriety_type TEXT,
    sobriety_test TEXT,
    sobriety_test_result TEXT,
    move_violation TEXT,
    cell_phone_in_use BOOLEAN,
    other_associated_factors TEXT,
    vehicle_make TEXT,
    vehicle_year INTEGER,
    vehicle_type TEXT,
    direction TEXT,
    safety_equipment TEXT,
    ejection TEXT,
    injury TEXT,
    injury_severity TEXT,
    financial_responsibility TEXT,
    school_bus_related BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, case_id, party_number)
);

CREATE INDEX idx_switrs_parties_org ON switrs_parties(organization_id);
CREATE INDEX idx_switrs_parties_case ON switrs_parties(case_id);
CREATE INDEX idx_switrs_parties_type ON switrs_parties(party_type);
CREATE INDEX idx_switrs_parties_age ON switrs_parties(age);
CREATE INDEX idx_switrs_parties_fault ON switrs_parties(at_fault);

-- Victims in collisions
CREATE TABLE switrs_victims (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,
    victim_number INTEGER NOT NULL,
    party_number INTEGER NOT NULL,
    victim_age INTEGER,
    victim_sex TEXT,
    victim_role TEXT,
    injury_severity TEXT,
    ejected TEXT,
    safety_equipment TEXT,
    seating_position TEXT,
    transportation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, case_id, victim_number)
);

CREATE INDEX idx_switrs_victims_org ON switrs_victims(organization_id);
CREATE INDEX idx_switrs_victims_case ON switrs_victims(case_id);
CREATE INDEX idx_switrs_victims_party ON switrs_victims(case_id, party_number);
CREATE INDEX idx_switrs_victims_severity ON switrs_victims(injury_severity);

-- Collision hotspots
CREATE TABLE switrs_hotspots (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius DOUBLE PRECISION NOT NULL, -- in meters
    collision_count INTEGER NOT NULL DEFAULT 0,
    fatality_count INTEGER NOT NULL DEFAULT 0,
    injury_count INTEGER NOT NULL DEFAULT 0,
    pedestrian_count INTEGER NOT NULL DEFAULT 0,
    bicyclist_count INTEGER NOT NULL DEFAULT 0,
    motorcycle_count INTEGER NOT NULL DEFAULT 0,
    most_common_violation TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    geom GEOMETRY(POINT, 4326)
);

CREATE INDEX idx_switrs_hotspots_org ON switrs_hotspots(organization_id);
CREATE INDEX idx_switrs_hotspots_geom ON switrs_hotspots USING GIST(geom);
CREATE INDEX idx_switrs_hotspots_collision_count ON switrs_hotspots(collision_count DESC);

-- SWITRS API credentials
CREATE TABLE switrs_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    api_key TEXT,
    username TEXT,
    password TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id)
);

CREATE INDEX idx_switrs_credentials_org ON switrs_credentials(organization_id);

-- SWITRS saved queries
CREATE TABLE switrs_saved_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    query_parameters JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_switrs_saved_queries_org ON switrs_saved_queries(organization_id);

-- Enable Row Level Security
ALTER TABLE switrs_collisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE switrs_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE switrs_victims ENABLE ROW LEVEL SECURITY;
ALTER TABLE switrs_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE switrs_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE switrs_saved_queries ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Users can view their organization's SWITRS collisions" ON switrs_collisions
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's SWITRS parties" ON switrs_parties
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's SWITRS victims" ON switrs_victims
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's SWITRS hotspots" ON switrs_hotspots
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's SWITRS credentials" ON switrs_credentials
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid()) AND
        auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin' AND agency_id = organization_id)
    );

CREATE POLICY "Users can view their organization's SWITRS saved queries" ON switrs_saved_queries
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

-- Admin-only insertion policies
CREATE POLICY "Admins can insert SWITRS collisions" ON switrs_collisions
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert SWITRS parties" ON switrs_parties
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert SWITRS victims" ON switrs_victims
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert SWITRS hotspots" ON switrs_hotspots
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "Admins can insert SWITRS credentials" ON switrs_credentials
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create SWITRS saved queries" ON switrs_saved_queries
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

-- Admin-only update policies
CREATE POLICY "Admins can update SWITRS credentials" ON switrs_credentials
    FOR UPDATE USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update SWITRS hotspots" ON switrs_hotspots
    FOR UPDATE USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND (role = 'admin' OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())))
    );

-- Stored procedures

-- Function to identify collision hotspots within an area
CREATE OR REPLACE FUNCTION identify_collision_hotspots(
    p_organization_id UUID,
    p_start_date TEXT,
    p_end_date TEXT,
    p_min_lat DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION,
    p_min_lng DOUBLE PRECISION,
    p_max_lng DOUBLE PRECISION,
    p_grid_size DOUBLE PRECISION,
    p_min_collisions INTEGER
)
RETURNS TABLE (
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius DOUBLE PRECISION,
    collision_count INTEGER,
    fatality_count INTEGER,
    injury_count INTEGER,
    pedestrian_count INTEGER,
    bicyclist_count INTEGER,
    motorcycle_count INTEGER,
    most_common_violation TEXT
) AS $$
DECLARE
    lat_step DOUBLE PRECISION;
    lng_step DOUBLE PRECISION;
    earth_radius DOUBLE PRECISION := 6371000; -- Earth radius in meters
BEGIN
    -- Calculate grid step sizes in degrees
    -- These are rough approximations - at higher latitudes, longitude degrees are shorter
    lat_step := p_grid_size / (111000); -- 1 degree lat is approx 111km
    lng_step := p_grid_size / (111000 * COS(RADIANS((p_min_lat + p_max_lat) / 2))); -- Adjust for latitude
    
    RETURN QUERY
    WITH grid_cells AS (
        -- Create a grid of points covering the area
        SELECT 
            p_min_lat + (n_lat * lat_step) + (lat_step/2) AS lat,
            p_min_lng + (n_lng * lng_step) + (lng_step/2) AS lng,
            p_grid_size / 2 AS radius_meters -- Radius is half the grid size
        FROM 
            generate_series(0, CEILING((p_max_lat - p_min_lat) / lat_step)::INTEGER - 1) AS n_lat,
            generate_series(0, CEILING((p_max_lng - p_min_lng) / lng_step)::INTEGER - 1) AS n_lng
    ),
    cell_counts AS (
        -- Count collisions in each grid cell
        SELECT
            g.lat,
            g.lng,
            g.radius_meters AS radius,
            COUNT(c.id) AS collision_count,
            SUM(c.fatality_count) AS fatality_count,
            SUM(c.injury_count) AS injury_count,
            COUNT(c.id) FILTER (WHERE c.pedestrian_involved = TRUE) AS pedestrian_count,
            COUNT(c.id) FILTER (WHERE c.bicycle_involved = TRUE) AS bicyclist_count,
            COUNT(c.id) FILTER (WHERE c.motorcycle_involved = TRUE) AS motorcycle_count,
            (
                SELECT pcf_violation
                FROM switrs_collisions c2
                WHERE 
                    c2.organization_id = p_organization_id AND
                    c2.collision_date BETWEEN p_start_date::DATE AND p_end_date::DATE AND
                    ST_DWithin(
                        c2.geom::geography,
                        ST_SetSRID(ST_MakePoint(g.lng, g.lat), 4326)::geography,
                        g.radius_meters
                    )
                GROUP BY pcf_violation
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS most_common_violation
        FROM 
            grid_cells g
        JOIN 
            switrs_collisions c ON 
                c.organization_id = p_organization_id AND
                c.collision_date BETWEEN p_start_date::DATE AND p_end_date::DATE AND
                ST_DWithin(
                    c.geom::geography,
                    ST_SetSRID(ST_MakePoint(g.lng, g.lat), 4326)::geography,
                    g.radius_meters
                )
        GROUP BY 
            g.lat, g.lng, g.radius_meters
        HAVING 
            COUNT(c.id) >= p_min_collisions
    )
    SELECT 
        lat,
        lng,
        radius,
        collision_count,
        fatality_count,
        injury_count,
        pedestrian_count,
        bicyclist_count,
        motorcycle_count,
        most_common_violation
    FROM 
        cell_counts
    ORDER BY 
        collision_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hotspots as GeoJSON
CREATE OR REPLACE FUNCTION get_switrs_hotspots_geojson(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(features.feature)
    ) INTO result
    FROM (
        SELECT jsonb_build_object(
            'type', 'Feature',
            'id', h.id,
            'geometry', ST_AsGeoJSON(h.geom)::jsonb,
            'properties', jsonb_build_object(
                'id', h.id,
                'name', h.name,
                'description', h.description,
                'collision_count', h.collision_count,
                'fatality_count', h.fatality_count,
                'injury_count', h.injury_count,
                'pedestrian_count', h.pedestrian_count,
                'bicyclist_count', h.bicyclist_count,
                'motorcycle_count', h.motorcycle_count,
                'most_common_violation', h.most_common_violation,
                'radius', h.radius,
                'start_date', h.start_date,
                'end_date', h.end_date
            )
        ) AS feature
        FROM switrs_hotspots h
        WHERE h.organization_id = p_organization_id
    ) AS features;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collisions as GeoJSON
CREATE OR REPLACE FUNCTION get_switrs_collisions_geojson(
    p_organization_id UUID,
    p_start_date TEXT DEFAULT NULL,
    p_end_date TEXT DEFAULT NULL,
    p_min_lat DOUBLE PRECISION DEFAULT NULL,
    p_max_lat DOUBLE PRECISION DEFAULT NULL,
    p_min_lng DOUBLE PRECISION DEFAULT NULL,
    p_max_lng DOUBLE PRECISION DEFAULT NULL,
    p_center_lat DOUBLE PRECISION DEFAULT NULL,
    p_center_lng DOUBLE PRECISION DEFAULT NULL,
    p_radius DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    query_text TEXT;
    where_clauses TEXT := ' WHERE c.organization_id = $1';
    params JSONB := jsonb_build_array(p_organization_id);
    param_count INTEGER := 1;
BEGIN
    -- Add date range filter
    IF p_start_date IS NOT NULL THEN
        param_count := param_count + 1;
        where_clauses := where_clauses || ' AND c.collision_date >= $' || param_count || '::DATE';
        params := params || jsonb_build_array(p_start_date);
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        param_count := param_count + 1;
        where_clauses := where_clauses || ' AND c.collision_date <= $' || param_count || '::DATE';
        params := params || jsonb_build_array(p_end_date);
    END IF;
    
    -- Add bounding box filter
    IF p_min_lat IS NOT NULL AND p_max_lat IS NOT NULL AND p_min_lng IS NOT NULL AND p_max_lng IS NOT NULL THEN
        where_clauses := where_clauses || ' AND c.geom && ST_MakeEnvelope(' || 
            p_min_lng || ', ' || p_min_lat || ', ' || p_max_lng || ', ' || p_max_lat || ', 4326)';
    END IF;
    
    -- Add radius filter
    IF p_center_lat IS NOT NULL AND p_center_lng IS NOT NULL AND p_radius IS NOT NULL THEN
        where_clauses := where_clauses || ' AND ST_DWithin(c.geom::geography, ST_SetSRID(ST_MakePoint(' || 
            p_center_lng || ', ' || p_center_lat || '), 4326)::geography, ' || p_radius || ')';
    END IF;
    
    -- Build the query
    query_text := '
    SELECT jsonb_build_object(
        ''type'', ''FeatureCollection'',
        ''features'', jsonb_agg(features.feature)
    )
    FROM (
        SELECT jsonb_build_object(
            ''type'', ''Feature'',
            ''id'', c.case_id,
            ''geometry'', ST_AsGeoJSON(c.geom)::jsonb,
            ''properties'', jsonb_build_object(
                ''case_id'', c.case_id,
                ''collision_date'', c.collision_date,
                ''collision_time'', c.collision_time,
                ''primary_road'', c.primary_road,
                ''secondary_road'', c.secondary_road,
                ''severity'', c.severity_description,
                ''fatality_count'', c.fatality_count,
                ''injury_count'', c.injury_count,
                ''pedestrian_involved'', c.pedestrian_involved,
                ''bicycle_involved'', c.bicycle_involved,
                ''motorcycle_involved'', c.motorcycle_involved,
                ''truck_involved'', c.truck_involved,
                ''alcohol_involved'', c.alcohol_involved,
                ''pcf_violation'', c.pcf_violation
            )
        ) AS feature
        FROM switrs_collisions c' || 
        where_clauses || 
        ' LIMIT 5000
    ) AS features';
    
    -- Execute the query
    EXECUTE query_text USING params INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collision statistics
CREATE OR REPLACE FUNCTION get_switrs_collision_statistics(
    p_organization_id UUID,
    p_start_date TEXT DEFAULT NULL,
    p_end_date TEXT DEFAULT NULL,
    p_min_lat DOUBLE PRECISION DEFAULT NULL,
    p_max_lat DOUBLE PRECISION DEFAULT NULL,
    p_min_lng DOUBLE PRECISION DEFAULT NULL,
    p_max_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS TABLE (
    totalCollisions INTEGER,
    collisionsBySeverity JSONB,
    collisionsByYear JSONB,
    collisionsByType JSONB,
    topPrimaryCollisionFactors JSONB,
    involvedParties JSONB
) AS $$
DECLARE
    where_clauses TEXT := ' WHERE organization_id = $1';
    params TEXT[] := ARRAY[p_organization_id::TEXT];
    param_count INTEGER := 1;
    severity_results JSONB;
    year_results JSONB;
    type_results JSONB;
    pcf_results JSONB;
    involved_results JSONB;
BEGIN
    -- Add date range filter
    IF p_start_date IS NOT NULL THEN
        param_count := param_count + 1;
        where_clauses := where_clauses || ' AND collision_date >= $' || param_count || '::DATE';
        params := array_append(params, p_start_date);
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        param_count := param_count + 1;
        where_clauses := where_clauses || ' AND collision_date <= $' || param_count || '::DATE';
        params := array_append(params, p_end_date);
    END IF;
    
    -- Add bounding box filter
    IF p_min_lat IS NOT NULL AND p_max_lat IS NOT NULL AND p_min_lng IS NOT NULL AND p_max_lng IS NOT NULL THEN
        where_clauses := where_clauses || ' AND geom && ST_MakeEnvelope($' || 
            (param_count + 1) || ', $' || (param_count + 2) || ', $' || (param_count + 3) || ', $' || (param_count + 4) || ', 4326)';
        params := array_append(params, p_min_lng::TEXT);
        params := array_append(params, p_min_lat::TEXT);
        params := array_append(params, p_max_lng::TEXT);
        params := array_append(params, p_max_lat::TEXT);
        param_count := param_count + 4;
    END IF;
    
    -- Get total collisions
    EXECUTE 'SELECT COUNT(*) FROM switrs_collisions' || where_clauses
    USING params INTO totalCollisions;
    
    -- Get collisions by severity
    EXECUTE '
    SELECT jsonb_agg(jsonb_build_object(''severity'', severity_description, ''count'', count))
    FROM (
        SELECT 
            COALESCE(severity_description, ''Unknown'') AS severity_description, 
            COUNT(*) AS count
        FROM 
            switrs_collisions
        ' || where_clauses || '
        GROUP BY 
            severity_description
        ORDER BY 
            count DESC
    ) t'
    USING params INTO severity_results;
    
    -- Get collisions by year
    EXECUTE '
    SELECT jsonb_agg(jsonb_build_object(''year'', year, ''count'', count))
    FROM (
        SELECT 
            EXTRACT(YEAR FROM collision_date)::TEXT AS year, 
            COUNT(*) AS count
        FROM 
            switrs_collisions
        ' || where_clauses || '
        GROUP BY 
            year
        ORDER BY 
            year
    ) t'
    USING params INTO year_results;
    
    -- Get collisions by type
    EXECUTE '
    SELECT jsonb_agg(jsonb_build_object(''type'', collision_type, ''count'', count))
    FROM (
        SELECT 
            COALESCE(collision_type, ''Unknown'') AS collision_type, 
            COUNT(*) AS count
        FROM 
            switrs_collisions
        ' || where_clauses || '
        GROUP BY 
            collision_type
        ORDER BY 
            count DESC
    ) t'
    USING params INTO type_results;
    
    -- Get top primary collision factors
    EXECUTE '
    SELECT jsonb_agg(jsonb_build_object(''factor'', pcf_violation, ''count'', count))
    FROM (
        SELECT 
            COALESCE(pcf_violation, ''Unknown'') AS pcf_violation, 
            COUNT(*) AS count
        FROM 
            switrs_collisions
        ' || where_clauses || '
        GROUP BY 
            pcf_violation
        ORDER BY 
            count DESC
        LIMIT 10
    ) t'
    USING params INTO pcf_results;
    
    -- Get involved parties counts
    EXECUTE '
    SELECT jsonb_build_object(
        ''pedestrians'', SUM(CASE WHEN pedestrian_involved THEN 1 ELSE 0 END),
        ''bicyclists'', SUM(CASE WHEN bicycle_involved THEN 1 ELSE 0 END),
        ''motorcyclists'', SUM(CASE WHEN motorcycle_involved THEN 1 ELSE 0 END),
        ''trucks'', SUM(CASE WHEN truck_involved THEN 1 ELSE 0 END)
    )
    FROM 
        switrs_collisions
    ' || where_clauses
    USING params INTO involved_results;
    
    -- Return the results
    RETURN QUERY SELECT 
        totalCollisions,
        COALESCE(severity_results, '[]'::JSONB) AS collisionsBySeverity,
        COALESCE(year_results, '[]'::JSONB) AS collisionsByYear,
        COALESCE(type_results, '[]'::JSONB) AS collisionsByType,
        COALESCE(pcf_results, '[]'::JSONB) AS topPrimaryCollisionFactors,
        COALESCE(involved_results, '{}'::JSONB) AS involvedParties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 