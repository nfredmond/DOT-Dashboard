-- Community Input Schema for Supabase
-- This schema supports location-based community feedback with moderation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Community Input Categories (customizable per organization)
CREATE TABLE IF NOT EXISTS community_input_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key)
);

-- Community Inputs
CREATE TABLE IF NOT EXISTS community_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('point', 'line', 'polygon')),
    geometry GEOGRAPHY(GEOMETRY, 4326) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES community_input_categories(id),
    category_key VARCHAR(50) NOT NULL, -- Denormalized for performance
    
    -- User information
    user_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    
    -- Status and moderation
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    llm_category VARCHAR(50), -- Auto-categorized by LLM
    llm_confidence DECIMAL(3,2), -- Confidence score 0-1
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_note TEXT,
    
    -- Organization response
    agency_response TEXT,
    agency_response_by UUID,
    agency_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Voting/engagement
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Metadata
    address TEXT, -- Reverse geocoded address
    project_id UUID REFERENCES projects(id), -- Optional link to project
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Input Images
CREATE TABLE IF NOT EXISTS community_input_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_id UUID NOT NULL REFERENCES community_inputs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    mime_type VARCHAR(50),
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Input Votes (to track who voted)
CREATE TABLE IF NOT EXISTS community_input_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_id UUID NOT NULL REFERENCES community_inputs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(input_id, user_id)
);

-- Organization Community Settings
CREATE TABLE IF NOT EXISTS organization_community_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Moderation settings
    requires_approval BOOLEAN DEFAULT TRUE,
    use_llm_moderation BOOLEAN DEFAULT TRUE,
    llm_auto_approve_threshold DECIMAL(3,2) DEFAULT 0.8, -- Auto-approve if confidence > threshold
    
    -- Display settings
    show_pending_to_public BOOLEAN DEFAULT FALSE,
    allow_anonymous_submission BOOLEAN DEFAULT FALSE,
    allow_voting BOOLEAN DEFAULT TRUE,
    allow_comments BOOLEAN DEFAULT TRUE,
    
    -- Notification settings
    notify_on_submission TEXT[] DEFAULT '{}', -- Email addresses
    notify_on_threshold INTEGER, -- Notify when input gets X votes
    
    -- Custom fields
    custom_fields JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id)
);

-- Indexes for performance
CREATE INDEX idx_community_inputs_org ON community_inputs(organization_id);
CREATE INDEX idx_community_inputs_status ON community_inputs(status);
CREATE INDEX idx_community_inputs_category ON community_inputs(category_key);
CREATE INDEX idx_community_inputs_user ON community_inputs(user_id);
CREATE INDEX idx_community_inputs_created ON community_inputs(created_at DESC);
CREATE INDEX idx_community_inputs_geometry ON community_inputs USING GIST (geometry);
CREATE INDEX idx_community_inputs_project ON community_inputs(project_id) WHERE project_id IS NOT NULL;

-- Full text search index
CREATE INDEX idx_community_inputs_search ON community_inputs 
    USING gin(to_tsvector('english', title || ' ' || description));

-- Row Level Security
ALTER TABLE community_input_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_input_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_input_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_community_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Community inputs: Public can view approved, users can create
CREATE POLICY "Anyone can view approved inputs" ON community_inputs
    FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create inputs" ON community_inputs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inputs" ON community_inputs
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can do everything
CREATE POLICY "Admins can manage all inputs" ON community_inputs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = community_inputs.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- Categories: Public can view, admins can manage
CREATE POLICY "Anyone can view active categories" ON community_input_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON community_input_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = community_input_categories.organization_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Triggers

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_community_input_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_inputs_timestamp 
    BEFORE UPDATE ON community_inputs
    FOR EACH ROW EXECUTE FUNCTION update_community_input_timestamp();

CREATE TRIGGER update_categories_timestamp 
    BEFORE UPDATE ON community_input_categories
    FOR EACH ROW EXECUTE FUNCTION update_community_input_timestamp();

-- Vote counting trigger
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE community_inputs SET upvotes = upvotes + 1 WHERE id = NEW.input_id;
        ELSE
            UPDATE community_inputs SET downvotes = downvotes + 1 WHERE id = NEW.input_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE community_inputs SET upvotes = upvotes - 1 WHERE id = OLD.input_id;
        ELSE
            UPDATE community_inputs SET downvotes = downvotes - 1 WHERE id = OLD.input_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote change
        IF OLD.vote_type != NEW.vote_type THEN
            IF OLD.vote_type = 'up' THEN
                UPDATE community_inputs SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.input_id;
            ELSE
                UPDATE community_inputs SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.input_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_input_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON community_input_votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Sample data for default categories
INSERT INTO community_input_categories (organization_id, key, name, color, icon, display_order) VALUES
    ('00000000-0000-0000-0000-000000000000', 'general', 'General', '#3b82f6', 'message-circle', 0),
    ('00000000-0000-0000-0000-000000000000', 'safety', 'Safety', '#ef4444', 'alert-triangle', 1),
    ('00000000-0000-0000-0000-000000000000', 'active_transport', 'Active Transportation', '#22c55e', 'bike', 2),
    ('00000000-0000-0000-0000-000000000000', 'maintenance', 'Maintenance', '#f59e0b', 'tool', 3),
    ('00000000-0000-0000-0000-000000000000', 'traffic', 'Traffic', '#8b5cf6', 'car', 4),
    ('00000000-0000-0000-0000-000000000000', 'accessibility', 'Accessibility', '#06b6d4', 'accessibility', 5),
    ('00000000-0000-0000-0000-000000000000', 'transit', 'Public Transit', '#ec4899', 'bus', 6),
    ('00000000-0000-0000-0000-000000000000', 'environment', 'Environment', '#10b981', 'tree', 7)
ON CONFLICT (organization_id, key) DO NOTHING; 