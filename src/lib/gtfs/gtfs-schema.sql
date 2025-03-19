-- GTFS Transit Data Schema
-- This schema defines tables for storing GTFS (General Transit Feed Specification) data
-- and supporting spatial queries on transit data

-- Feed Metadata
CREATE TABLE gtfs_feeds (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    agency_id TEXT NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    version TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'active', 'archived', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_feeds_org ON gtfs_feeds(organization_id);
CREATE INDEX idx_gtfs_feeds_status ON gtfs_feeds(status);

-- Agency Information
CREATE TABLE gtfs_agencies (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    agency_id TEXT NOT NULL,
    agency_name TEXT NOT NULL,
    agency_url TEXT NOT NULL,
    agency_timezone TEXT NOT NULL,
    agency_lang TEXT,
    agency_phone TEXT,
    agency_fare_url TEXT,
    agency_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_agencies_feed ON gtfs_agencies(feed_id);
CREATE INDEX idx_gtfs_agencies_org ON gtfs_agencies(organization_id);
CREATE UNIQUE INDEX idx_gtfs_agencies_feed_agency ON gtfs_agencies(feed_id, agency_id);

-- Routes
CREATE TABLE gtfs_routes (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    route_id TEXT NOT NULL,
    agency_id TEXT,
    route_short_name TEXT,
    route_long_name TEXT,
    route_desc TEXT,
    route_type INTEGER NOT NULL,
    route_url TEXT,
    route_color TEXT,
    route_text_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_routes_feed ON gtfs_routes(feed_id);
CREATE INDEX idx_gtfs_routes_org ON gtfs_routes(organization_id);
CREATE UNIQUE INDEX idx_gtfs_routes_feed_route ON gtfs_routes(feed_id, route_id);

-- Stops
CREATE TABLE gtfs_stops (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    stop_id TEXT NOT NULL,
    stop_code TEXT,
    stop_name TEXT NOT NULL,
    stop_desc TEXT,
    stop_lat DOUBLE PRECISION NOT NULL,
    stop_lon DOUBLE PRECISION NOT NULL,
    zone_id TEXT,
    stop_url TEXT,
    location_type INTEGER,
    parent_station TEXT,
    stop_timezone TEXT,
    wheelchair_boarding INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Spatial point for the stop location
    geom GEOMETRY(POINT, 4326)
);

CREATE INDEX idx_gtfs_stops_feed ON gtfs_stops(feed_id);
CREATE INDEX idx_gtfs_stops_org ON gtfs_stops(organization_id);
CREATE UNIQUE INDEX idx_gtfs_stops_feed_stop ON gtfs_stops(feed_id, stop_id);
CREATE INDEX idx_gtfs_stops_geom ON gtfs_stops USING GIST(geom);

-- Calendar 
CREATE TABLE gtfs_calendar (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    monday BOOLEAN NOT NULL,
    tuesday BOOLEAN NOT NULL,
    wednesday BOOLEAN NOT NULL,
    thursday BOOLEAN NOT NULL,
    friday BOOLEAN NOT NULL,
    saturday BOOLEAN NOT NULL,
    sunday BOOLEAN NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_calendar_feed ON gtfs_calendar(feed_id);
CREATE INDEX idx_gtfs_calendar_org ON gtfs_calendar(organization_id);
CREATE UNIQUE INDEX idx_gtfs_calendar_feed_service ON gtfs_calendar(feed_id, service_id);

-- Calendar Dates (exceptions)
CREATE TABLE gtfs_calendar_dates (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    date DATE NOT NULL,
    exception_type INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_calendar_dates_feed ON gtfs_calendar_dates(feed_id);
CREATE INDEX idx_gtfs_calendar_dates_org ON gtfs_calendar_dates(organization_id);
CREATE UNIQUE INDEX idx_gtfs_calendar_dates_feed_service_date ON gtfs_calendar_dates(feed_id, service_id, date);

-- Trips
CREATE TABLE gtfs_trips (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    route_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    trip_headsign TEXT,
    trip_short_name TEXT,
    direction_id INTEGER,
    block_id TEXT,
    shape_id TEXT,
    wheelchair_accessible INTEGER,
    bikes_allowed INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_trips_feed ON gtfs_trips(feed_id);
CREATE INDEX idx_gtfs_trips_org ON gtfs_trips(organization_id);
CREATE UNIQUE INDEX idx_gtfs_trips_feed_trip ON gtfs_trips(feed_id, trip_id);
CREATE INDEX idx_gtfs_trips_route ON gtfs_trips(feed_id, route_id);
CREATE INDEX idx_gtfs_trips_service ON gtfs_trips(feed_id, service_id);
CREATE INDEX idx_gtfs_trips_shape ON gtfs_trips(feed_id, shape_id);

-- Stop Times
CREATE TABLE gtfs_stop_times (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    trip_id TEXT NOT NULL,
    arrival_time TEXT,
    departure_time TEXT,
    stop_id TEXT NOT NULL,
    stop_sequence INTEGER NOT NULL,
    stop_headsign TEXT,
    pickup_type INTEGER,
    drop_off_type INTEGER,
    shape_dist_traveled DOUBLE PRECISION,
    timepoint INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_stop_times_feed ON gtfs_stop_times(feed_id);
CREATE INDEX idx_gtfs_stop_times_org ON gtfs_stop_times(organization_id);
CREATE INDEX idx_gtfs_stop_times_trip ON gtfs_stop_times(feed_id, trip_id);
CREATE INDEX idx_gtfs_stop_times_stop ON gtfs_stop_times(feed_id, stop_id);

-- Shapes
CREATE TABLE gtfs_shapes (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    shape_id TEXT NOT NULL,
    -- Store the full LineString for each shape (instead of individual points)
    -- This is more efficient for spatial queries
    geom GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_shapes_feed ON gtfs_shapes(feed_id);
CREATE INDEX idx_gtfs_shapes_org ON gtfs_shapes(organization_id);
CREATE UNIQUE INDEX idx_gtfs_shapes_feed_shape ON gtfs_shapes(feed_id, shape_id);
CREATE INDEX idx_gtfs_shapes_geom ON gtfs_shapes USING GIST(geom);

-- Frequencies
CREATE TABLE gtfs_frequencies (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    trip_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    headway_secs INTEGER NOT NULL,
    exact_times INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_frequencies_feed ON gtfs_frequencies(feed_id);
CREATE INDEX idx_gtfs_frequencies_org ON gtfs_frequencies(organization_id);
CREATE INDEX idx_gtfs_frequencies_trip ON gtfs_frequencies(feed_id, trip_id);

-- Transfers
CREATE TABLE gtfs_transfers (
    id BIGSERIAL PRIMARY KEY,
    feed_id UUID NOT NULL REFERENCES gtfs_feeds(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    from_stop_id TEXT NOT NULL,
    to_stop_id TEXT NOT NULL,
    transfer_type INTEGER NOT NULL,
    min_transfer_time INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gtfs_transfers_feed ON gtfs_transfers(feed_id);
CREATE INDEX idx_gtfs_transfers_org ON gtfs_transfers(organization_id);
CREATE INDEX idx_gtfs_transfers_from_stop ON gtfs_transfers(feed_id, from_stop_id);
CREATE INDEX idx_gtfs_transfers_to_stop ON gtfs_transfers(feed_id, to_stop_id);

-- Add Row Level Security policies
ALTER TABLE gtfs_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_calendar_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stop_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Users can view their organization's GTFS feeds" ON gtfs_feeds
    FOR SELECT USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their organization's GTFS feeds" ON gtfs_feeds
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    ));

CREATE POLICY "Users can update their organization's GTFS feeds" ON gtfs_feeds
    FOR UPDATE USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    ));

CREATE POLICY "Users can delete their organization's GTFS feeds" ON gtfs_feeds
    FOR DELETE USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Apply similar policies to all GTFS tables
CREATE POLICY "Users can view their organization's GTFS agencies" ON gtfs_agencies
    FOR SELECT USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view their organization's GTFS routes" ON gtfs_routes
    FOR SELECT USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view their organization's GTFS stops" ON gtfs_stops
    FOR SELECT USING (organization_id IN (
        SELECT agency_id FROM profiles WHERE user_id = auth.uid()
    ));

-- Continue similar policies for other tables...

-- Create stored procedures for GTFS operations
-- Procedure to clean up a GTFS feed and all its data
CREATE OR REPLACE FUNCTION delete_gtfs_feed(p_feed_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from all related tables
    DELETE FROM gtfs_transfers WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_frequencies WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_shapes WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_stop_times WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_trips WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_calendar_dates WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_calendar WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_stops WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_routes WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_agencies WHERE feed_id = p_feed_id;
    DELETE FROM gtfs_feeds WHERE id = p_feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to find stops within a radius of a point
CREATE OR REPLACE FUNCTION get_stops_in_radius(
    p_organization_id UUID,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
    stop_id TEXT,
    stop_code TEXT,
    stop_name TEXT,
    stop_desc TEXT,
    stop_lat DOUBLE PRECISION,
    stop_lon DOUBLE PRECISION,
    zone_id TEXT,
    stop_url TEXT,
    location_type INTEGER,
    parent_station TEXT,
    stop_timezone TEXT,
    wheelchair_boarding INTEGER,
    feed_id UUID,
    distance DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stop_id,
        s.stop_code,
        s.stop_name,
        s.stop_desc,
        s.stop_lat,
        s.stop_lon,
        s.zone_id,
        s.stop_url,
        s.location_type,
        s.parent_station,
        s.stop_timezone,
        s.wheelchair_boarding,
        s.feed_id,
        ST_Distance(
            s.geom::geography,
            ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
        ) AS distance
    FROM 
        gtfs_stops s
    WHERE 
        s.organization_id = p_organization_id
        AND ST_DWithin(
            s.geom::geography,
            ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
            p_radius_meters
        )
    ORDER BY 
        distance ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to get route shapes as GeoJSON
CREATE OR REPLACE FUNCTION get_route_shapes_as_geojson(p_feed_id UUID)
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
            'id', r.route_id,
            'geometry', ST_AsGeoJSON(s.geom)::jsonb,
            'properties', jsonb_build_object(
                'route_id', r.route_id,
                'route_short_name', r.route_short_name,
                'route_long_name', r.route_long_name,
                'route_type', r.route_type,
                'route_color', r.route_color
            )
        ) AS feature
        FROM gtfs_routes r
        JOIN gtfs_trips t ON r.feed_id = t.feed_id AND r.route_id = t.route_id
        JOIN gtfs_shapes s ON t.feed_id = s.feed_id AND t.shape_id = s.shape_id
        WHERE r.feed_id = p_feed_id
        GROUP BY r.route_id, r.route_short_name, r.route_long_name, r.route_type, r.route_color, s.geom
    ) AS features;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to get a specific route shape as GeoJSON
CREATE OR REPLACE FUNCTION get_route_shape_as_geojson(p_feed_id UUID, p_route_id TEXT)
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
            'id', r.route_id,
            'geometry', ST_AsGeoJSON(s.geom)::jsonb,
            'properties', jsonb_build_object(
                'route_id', r.route_id,
                'route_short_name', r.route_short_name,
                'route_long_name', r.route_long_name,
                'route_type', r.route_type,
                'route_color', r.route_color
            )
        ) AS feature
        FROM gtfs_routes r
        JOIN gtfs_trips t ON r.feed_id = t.feed_id AND r.route_id = t.route_id
        JOIN gtfs_shapes s ON t.feed_id = s.feed_id AND t.shape_id = s.shape_id
        WHERE r.feed_id = p_feed_id AND r.route_id = p_route_id
        GROUP BY r.route_id, r.route_short_name, r.route_long_name, r.route_type, r.route_color, s.geom
    ) AS features;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procedure to calculate transit accessibility for a location
CREATE OR REPLACE FUNCTION calculate_transit_accessibility(
    p_organization_id UUID,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION
)
RETURNS TABLE (
    accessibilityScore DOUBLE PRECISION,
    stopsWithin400m INTEGER,
    stopsWithin800m INTEGER,
    routesAvailable INTEGER,
    averageHeadway DOUBLE PRECISION
) AS $$
DECLARE
    point GEOMETRY;
    stops_400m INTEGER;
    stops_800m INTEGER;
    routes_count INTEGER;
    avg_headway DOUBLE PRECISION;
    score DOUBLE PRECISION;
BEGIN
    point := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326);
    
    -- Count stops within 400m
    SELECT COUNT(*) INTO stops_400m
    FROM gtfs_stops s
    WHERE s.organization_id = p_organization_id
    AND ST_DWithin(s.geom::geography, point::geography, 400);
    
    -- Count stops within 800m
    SELECT COUNT(*) INTO stops_800m
    FROM gtfs_stops s
    WHERE s.organization_id = p_organization_id
    AND ST_DWithin(s.geom::geography, point::geography, 800);
    
    -- Count unique routes available within 800m
    SELECT COUNT(DISTINCT r.route_id) INTO routes_count
    FROM gtfs_stops s
    JOIN gtfs_stop_times st ON s.feed_id = st.feed_id AND s.stop_id = st.stop_id
    JOIN gtfs_trips t ON st.feed_id = t.feed_id AND st.trip_id = t.trip_id
    JOIN gtfs_routes r ON t.feed_id = r.feed_id AND t.route_id = r.route_id
    WHERE s.organization_id = p_organization_id
    AND ST_DWithin(s.geom::geography, point::geography, 800);
    
    -- Calculate average headway (if frequency data exists)
    SELECT AVG(f.headway_secs) INTO avg_headway
    FROM gtfs_stops s
    JOIN gtfs_stop_times st ON s.feed_id = st.feed_id AND s.stop_id = st.stop_id
    JOIN gtfs_trips t ON st.feed_id = t.feed_id AND st.trip_id = t.trip_id
    JOIN gtfs_frequencies f ON t.feed_id = f.feed_id AND t.trip_id = f.trip_id
    WHERE s.organization_id = p_organization_id
    AND ST_DWithin(s.geom::geography, point::geography, 800);
    
    -- Calculate accessibility score (simplified algorithm)
    -- Score = (stops_400m * 1.0 + stops_800m * 0.5) * (routes_count / 5) * (1800 / (avg_headway or 1800))
    -- This gives higher scores for more stops, more routes, and lower headways
    -- Max theoretical score is around 100
    
    score := (stops_400m * 1.0 + (stops_800m - stops_400m) * 0.5) * 
             (LEAST(routes_count, 10) / 5.0) * 
             (1800 / NULLIF(COALESCE(avg_headway, 1800), 0));
             
    -- Cap score at 100
    score := LEAST(score, 100.0);
    
    RETURN QUERY SELECT 
        score AS accessibilityScore,
        stops_400m AS stopsWithin400m,
        stops_800m AS stopsWithin800m,
        routes_count AS routesAvailable,
        avg_headway AS averageHeadway;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 