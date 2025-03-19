-- ESRI ArcGIS integration schema
-- This schema defines tables for storing ESRI service configurations and layer information

-- ESRI Services table
CREATE TABLE esri_services (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    service_url TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('FeatureService', 'MapService', 'ImageService', 'GeoprocessingService')),
    metadata JSONB DEFAULT '{}',
    credentials JSONB, -- Encrypted credentials for authentication
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_esri_services_org ON esri_services(organization_id);
CREATE INDEX idx_esri_services_type ON esri_services(service_type);

-- ESRI Service Layers
CREATE TABLE esri_service_layers (
    id BIGSERIAL PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES esri_services(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    layer_id INTEGER NOT NULL, -- The layer ID from the ESRI service
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    geometry_type TEXT,
    description TEXT,
    fields JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_esri_service_layers_service ON esri_service_layers(service_id);
CREATE INDEX idx_esri_service_layers_org ON esri_service_layers(organization_id);
CREATE UNIQUE INDEX idx_esri_service_layers_layer_id ON esri_service_layers(service_id, layer_id);

-- ESRI layer symbolization
CREATE TABLE esri_layer_symbolization (
    id BIGSERIAL PRIMARY KEY,
    layer_id BIGINT NOT NULL REFERENCES esri_service_layers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    style_name TEXT NOT NULL,
    style_type TEXT NOT NULL CHECK (style_type IN ('simple', 'categorized', 'graduated', 'heatmap', 'custom')),
    style_definition JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_esri_layer_symbolization_layer ON esri_layer_symbolization(layer_id);
CREATE INDEX idx_esri_layer_symbolization_org ON esri_layer_symbolization(organization_id);
CREATE INDEX idx_esri_layer_symbolization_default ON esri_layer_symbolization(layer_id, is_default);

-- ESRI feature caching
CREATE TABLE esri_feature_cache (
    id BIGSERIAL PRIMARY KEY,
    layer_id BIGINT NOT NULL REFERENCES esri_service_layers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    feature_id TEXT NOT NULL,
    attributes JSONB NOT NULL,
    geometry GEOMETRY,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (layer_id, feature_id)
);

CREATE INDEX idx_esri_feature_cache_layer ON esri_feature_cache(layer_id);
CREATE INDEX idx_esri_feature_cache_org ON esri_feature_cache(organization_id);
CREATE INDEX idx_esri_feature_cache_expires ON esri_feature_cache(expires_at);
CREATE INDEX idx_esri_feature_cache_geom ON esri_feature_cache USING GIST(geometry);

-- ESRI saved queries
CREATE TABLE esri_saved_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    layer_id BIGINT NOT NULL REFERENCES esri_service_layers(id) ON DELETE CASCADE,
    query_definition JSONB NOT NULL, -- Stores the query parameters
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_esri_saved_queries_org ON esri_saved_queries(organization_id);
CREATE INDEX idx_esri_saved_queries_user ON esri_saved_queries(user_id);
CREATE INDEX idx_esri_saved_queries_layer ON esri_saved_queries(layer_id);

-- Enable Row Level Security
ALTER TABLE esri_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE esri_service_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE esri_layer_symbolization ENABLE ROW LEVEL SECURITY;
ALTER TABLE esri_feature_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE esri_saved_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's ESRI services" ON esri_services
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's ESRI service layers" ON esri_service_layers
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's ESRI layer symbolization" ON esri_layer_symbolization
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their organization's ESRI feature cache" ON esri_feature_cache
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their own and organization saved queries" ON esri_saved_queries
    FOR SELECT USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid())
    );

-- Admin-only Insertion Policies
CREATE POLICY "Admins can insert ESRI services" ON esri_services
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert ESRI service layers" ON esri_service_layers
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Admin-only Update Policies
CREATE POLICY "Admins can update ESRI services" ON esri_services
    FOR UPDATE USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Admin-only Delete Policies
CREATE POLICY "Admins can delete ESRI services" ON esri_services
    FOR DELETE USING (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- User-specific Policies
CREATE POLICY "Users can insert their own saved queries" ON esri_saved_queries
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT agency_id FROM profiles WHERE user_id = auth.uid()) AND
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own saved queries" ON esri_saved_queries
    FOR UPDATE USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own saved queries" ON esri_saved_queries
    FOR DELETE USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Stored Procedures
-- Function to get features from an ESRI service layer for a specific area
CREATE OR REPLACE FUNCTION get_esri_features_for_area(
    p_service_id UUID, 
    p_layer_id INTEGER,
    p_min_x DOUBLE PRECISION,
    p_min_y DOUBLE PRECISION,
    p_max_x DOUBLE PRECISION,
    p_max_y DOUBLE PRECISION
)
RETURNS TABLE (
    feature_id TEXT,
    attributes JSONB,
    geometry GEOMETRY
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.feature_id,
        fc.attributes,
        fc.geometry
    FROM 
        esri_feature_cache fc
    JOIN 
        esri_service_layers sl ON fc.layer_id = sl.id
    WHERE 
        sl.service_id = p_service_id AND
        sl.layer_id = p_layer_id AND
        fc.geometry && ST_MakeEnvelope(p_min_x, p_min_y, p_max_x, p_max_y, 4326);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get simplified ESRI services list
CREATE OR REPLACE FUNCTION get_organization_esri_services(p_organization_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT, 
    service_url TEXT,
    service_type TEXT,
    layer_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.service_url,
        s.service_type,
        COUNT(l.id)::INTEGER AS layer_count
    FROM 
        esri_services s
    LEFT JOIN 
        esri_service_layers l ON s.id = l.service_id
    WHERE 
        s.organization_id = p_organization_id
    GROUP BY 
        s.id, s.name, s.service_url, s.service_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 