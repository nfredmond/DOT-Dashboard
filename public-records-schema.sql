-- Schema for Public Records Request Management System
-- This script creates all necessary tables for the public records request functionality

-- Create tables for public records request management

-- Table for request submitters
CREATE TABLE IF NOT EXISTS prr_requesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    organization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for public records requests
CREATE TABLE IF NOT EXISTS prr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'submitted', 'initial_review', 'gathering_records', 
        'legal_review', 'records_ready', 'completed', 
        'denied', 'withdrawn', 'overdue'
    )),
    request_type TEXT NOT NULL CHECK (request_type IN (
        'general', 'project', 'financial', 'environmental', 'other'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    requester_id UUID REFERENCES prr_requesters(id),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    from_date TIMESTAMPTZ,
    to_date TIMESTAMPTZ,
    format_preference TEXT NOT NULL CHECK (format_preference IN ('electronic', 'paper')),
    estimated_completion_date TIMESTAMPTZ,
    special_instructions TEXT,
    legal_exemptions TEXT[],
    fee_estimate DECIMAL(10,2),
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_waived BOOLEAN DEFAULT FALSE,
    internal_notes TEXT,
    is_expedited BOOLEAN DEFAULT FALSE,
    needs_clarification BOOLEAN DEFAULT FALSE,
    extension_requested BOOLEAN DEFAULT FALSE,
    extension_reason TEXT,
    extension_date TIMESTAMPTZ
);

-- Table for request timeline entries
CREATE TABLE IF NOT EXISTS prr_request_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'submitted', 'initial_review', 'gathering_records', 
        'legal_review', 'records_ready', 'completed', 
        'denied', 'withdrawn', 'overdue'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL -- User ID or 'system'
);

-- Table for request documents
CREATE TABLE IF NOT EXISTS prr_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'collecting', 'ready', 'released')),
    reviewed_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    redacted BOOLEAN DEFAULT FALSE,
    page_count INTEGER
);

-- Table for messages between requesters and staff
CREATE TABLE IF NOT EXISTS prr_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES prr_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL, -- Can be user ID or requester ID
    sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'requester')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create necessary indices
CREATE INDEX IF NOT EXISTS idx_prr_requests_status ON prr_requests(status);
CREATE INDEX IF NOT EXISTS idx_prr_requests_request_type ON prr_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_prr_requests_requester ON prr_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_prr_requests_agency ON prr_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_prr_requests_assigned_to ON prr_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prr_timeline_request ON prr_request_timeline(request_id);
CREATE INDEX IF NOT EXISTS idx_prr_documents_request ON prr_documents(request_id);
CREATE INDEX IF NOT EXISTS idx_prr_messages_request ON prr_messages(request_id);

-- Create a storage bucket for document files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_records_documents', 'Public Records Documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for bucket access
CREATE POLICY "Public records documents are accessible to authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'public_records_documents' AND (
    -- Allow access if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow access if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

CREATE POLICY "Staff can upload public records documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public_records_documents' AND (
    -- Allow if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

CREATE POLICY "Staff can update public records documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public_records_documents' AND (
    -- Allow if user is the assigned staff member
    EXISTS (
        SELECT 1 FROM prr_requests 
        WHERE id::text = SPLIT_PART(storage.objects.name, '/', 1) 
        AND assigned_to = auth.uid()
    )
    OR
    -- Allow if user is an admin of the agency
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.id::text = SPLIT_PART(storage.objects.name, '/', 1)
        AND p.user_id = auth.uid()
        AND p.role = 'admin'
    )
));

-- Row-level security policies for tables
ALTER TABLE prr_requesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_request_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prr_messages ENABLE ROW LEVEL SECURITY;

-- Policies for requesters
CREATE POLICY "Admins and assigned staff can view requesters"
ON prr_requesters FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM prr_requests pr
        JOIN profiles p ON p.agency_id = pr.agency_id
        WHERE pr.requester_id = prr_requesters.id
        AND (
            p.user_id = auth.uid() AND p.role = 'admin'
            OR
            pr.assigned_to = auth.uid()
        )
    )
);

-- Policies for requests
CREATE POLICY "Requesters can view their own requests"
ON prr_requests FOR SELECT
TO authenticated
USING (
    requester_id IN (
        SELECT id FROM prr_requesters
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Admins can view all agency requests"
ON prr_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

CREATE POLICY "Assigned staff can view their requests"
ON prr_requests FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Admins can create requests"
ON prr_requests FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

CREATE POLICY "Assigned staff can update their requests"
ON prr_requests FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Admins can update agency requests"
ON prr_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND agency_id = prr_requests.agency_id
        AND role = 'admin'
    )
);

-- Create stored procedures for analytics
CREATE OR REPLACE FUNCTION get_prr_request_counts(agency_id_param UUID)
RETURNS TABLE(total_count BIGINT, open_count BIGINT, overdue_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status NOT IN ('completed', 'denied', 'withdrawn')) as open_count,
        COUNT(*) FILTER (WHERE status = 'overdue' OR (status NOT IN ('completed', 'denied', 'withdrawn') AND due_date < NOW())) as overdue_count
    FROM prr_requests
    WHERE agency_id = agency_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_avg_completion_time(agency_id_param UUID)
RETURNS TABLE(avg_days FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(EXTRACT(EPOCH FROM (completed_date - created_at)) / 86400) as avg_days
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND status = 'completed'
    AND completed_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_request_volume_by_month(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(month TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as count
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND created_at >= start_date_param
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_request_types(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        request_type as type,
        COUNT(*) as count
    FROM prr_requests
    WHERE agency_id = agency_id_param
    AND created_at >= start_date_param
    GROUP BY request_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_prr_department_workload(agency_id_param UUID, start_date_param TIMESTAMPTZ)
RETURNS TABLE(department TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(p.department, 'Unassigned') as department,
        COUNT(*) as count
    FROM prr_requests r
    LEFT JOIN profiles p ON r.assigned_to = p.user_id
    WHERE r.agency_id = agency_id_param
    AND r.created_at >= start_date_param
    GROUP BY p.department
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql; 