# Project Management Integration System

## Overview

The Project Management Integration System provides seamless synchronization between the transportation project management components and the mapping visualization system. This integration ensures that projects are consistently displayed, updated, and managed across both interfaces, providing users with a unified experience.

## Key Components

### 1. Project Context (`ProjectsContext`)

**Location**: `src/contexts/ProjectsContext.tsx`

The central state management system for projects that:

- Maintains a shared project data store across the application
- Provides methods for adding, updating, and deleting projects
- Emits events when projects change for other components to listen
- Persists projects to localStorage for session consistency
- Handles data consistency and validation

```typescript
// Core project data type
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string; 
  category: string;
  priority: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  location: string;
  allocatedBudget: number;
  estimatedCost: number;
  startDate?: string;
  endDate?: string;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  // Enhanced fields for comprehensive project management
  pseBudget?: number;
  ceBudget?: number;
  constructionBudget?: number;
  rightOfWayBudget?: number;
  nepaStatus?: string;
  ceqaStatus?: string;
  environmentalDocumentType?: string;
  environmentalClearanceDate?: string;
  leadAgency?: string;
  partners?: string[];
  tags?: string[];
  isPublic?: boolean;
  mapType?: string;
  geojson?: any;
  // Tracking fields
  version?: number;
  clientId?: string;
  isSynced?: boolean;
}

// Event types for project changes
export const PROJECT_EVENTS = {
  ADDED: 'project-added',
  UPDATED: 'project-updated',
  DELETED: 'project-deleted',
}
```

### 2. Map Bridge (`MapBridge`)

**Location**: `src/app/project-mapping-wrapper/components/MapBridge.tsx`

A bridge component that:

- Listens for project events from the ProjectsContext
- Translates project data between management and mapping systems
- Dispatches synchronized updates to both map implementations
- Handles initial project loading and distribution
- Ensures correct geometry conversion between systems

### 3. Quick Add Project Form (`AddProjectForm`)

**Location**: `src/app/project-mapping-wrapper/components/AddProjectForm.tsx`

A user interface component that:

- Provides a quick-add form for creating new projects directly from the map
- Allows users to input basic project details (name, description, location)
- Offers option to continue to the full project wizard
- Stores partial project data in localStorage for the wizard to use
- Submits new projects to the central context

### 4. Full Project Wizard (`ProjectWizard`)

**Location**: `src/app/projects/new/page.tsx`

A comprehensive multi-step form that:

- Guides users through detailed project creation
- Retrieves partial data from the quick-add form if available
- Validates required project information
- Creates complete project records with all metadata
- Updates the central context with new projects
- Supports environmental documentation and funding data entry

### 5. DirectMapbox GL JSMap Component

**Location**: `src/app/project-mapping-wrapper/page.tsx`

The map implementation that:

- Displays project data using Mapbox GL JS mapping library
- Responds to project events through the MapBridge
- Renders different geometry types (points, lines, polygons)
- Updates when projects are added, modified, or removed
- Provides project visualization including popups with details

### 6. Project Map Legend (`ProjectMapLegend`)

**Location**: `src/app/project-mapping-wrapper/components/ProjectMapLegend.tsx`

A UI component that:

- Displays project categories and statuses with color-coding
- Allows filtering projects by status and category
- Toggles visibility of project types on the map
- Communicates filter changes to the map components
- Provides a clear visual legend for map interpretation

### 7. Project List (`ProjectList`)

**Location**: `src/app/project-mapping-wrapper/components/ProjectList.tsx`

A component that:

- Shows a filterable list of projects
- Allows clicking to highlight projects on the map
- Supports sorting by various project attributes
- Provides quick actions for project management
- Syncs selection state with the map view

## Synchronization Flow

1. **Adding a Project**:
   - User enters project data in either the quick form or full wizard
   - Component calls `addProject()` from the ProjectsContext
   - ProjectsContext stores the project and dispatches a 'project-added' event
   - MapBridge listens for the event and calls its `onProjectAdded` handler
   - DirectMapbox GL JSMap receives the project data and renders it on the map
   
2. **Updating a Project**:
   - Project data is updated in the management interface
   - `updateProject()` is called on the ProjectsContext
   - ProjectsContext updates the store and dispatches a 'project-updated' event
   - MapBridge captures the event and passes it to the map components
   - DirectMapbox GL JSMap updates the visualization with the changed data
   
3. **Deleting a Project**:
   - `deleteProject()` is called on the ProjectsContext
   - ProjectsContext removes the project and dispatches a 'project-deleted' event
   - MapBridge relays this event to the map components
   - DirectMapbox GL JSMap removes the project from visualization

## Event-Based Communication

The system uses a custom event system for cross-component communication:

```typescript
// Dispatching events
const dispatchProjectEvent = (eventName: string, project: Project) => {
  const event = new CustomEvent(eventName, { detail: project });
  window.dispatchEvent(event);
};

// Listening for events
window.addEventListener(PROJECT_EVENTS.ADDED, handleProjectAdded as EventListener);
window.addEventListener(PROJECT_EVENTS.UPDATED, handleProjectUpdated as EventListener);
window.addEventListener(PROJECT_EVENTS.DELETED, handleProjectDeleted as EventListener);
```

This event-based approach enables loose coupling between the project management and mapping systems, allowing them to evolve independently while maintaining synchronization.

## Project Data Storage

Projects are stored in multiple locations for resilience and persistence:

1. **In-Memory State**: Maintained by the ProjectsContext React state
2. **LocalStorage**: Persisted between sessions for offline capabilities
3. **Supabase Database** (when connected): For multi-user scenarios

The system handles synchronization between these storage locations automatically.

### Enhanced Database Support

In Planning Manager v7, the project management integration is fully supported by an enhanced database schema:

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

The schema includes additional supporting tables:

```sql
-- Project milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    completed_date TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Project funding sources
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL,
    fiscal_year TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project documents
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

## Offline Synchronization

Project data can be used offline and synchronized when connectivity is restored:

```sql
-- Sync status tracking
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

-- Sync queue for pending changes
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

-- Automatic version increments on updates
CREATE TRIGGER projects_version_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION increment_version();
```

## Geographic Data Handling

Projects use a standardized GeoJSON-compatible structure for spatial data:

```typescript
// Point geometry
geometry: {
  type: 'Point',
  coordinates: [-119.694792, 34.41889] // [longitude, latitude]
}

// LineString geometry
geometry: {
  type: 'LineString',
  coordinates: [
    [-119.698189, 34.42083],
    [-119.702, 34.43]
  ]
}

// Polygon geometry
geometry: {
  type: 'Polygon',
  coordinates: [[
    [-119.746944, 34.455],
    [-119.74, 34.455],
    [-119.74, 34.46],
    [-119.746944, 34.46],
    [-119.746944, 34.455]
  ]]
}
```

This follows the GeoJSON standard for interoperability with mapping libraries.

### Spatial Queries

The database supports spatial queries using PostGIS:

```sql
CREATE OR REPLACE FUNCTION find_projects_in_area(
    p_lat FLOAT, 
    p_lng FLOAT, 
    p_radius_meters FLOAT,
    p_agency_id UUID
)
RETURNS SETOF projects AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM projects p
    WHERE 
        p.agency_id = p_agency_id AND
        ST_DWithin(
            p.geometry,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
            p_radius_meters
        );
END;
$$ LANGUAGE plpgsql;
```

## Integration with Existing Systems

The integration system connects with several existing components:

1. **Authentication System**: Projects are associated with the authenticated user
2. **Agency Context**: Projects belong to a specific transportation agency
3. **Scoring System**: Projects can be scored and prioritized
4. **Document Management**: Projects can have associated documents
5. **AI Analysis**: Projects can be analyzed using AI/LLM capabilities

## Database Integration

When using Supabase as the backend database, the system:

1. Loads initial projects from the database on application start
2. Persists changes to the database when connectivity is available
3. Uses optimistic updates for responsive user experience
4. Handles conflict resolution for concurrent edits
5. Supports version tracking for synchronization

## Deployment Considerations

When deploying the integration system:

1. Ensure the ProjectsProvider is wrapped around components that need project data
2. Verify custom events work properly across the application's architecture
3. Test the synchronization with both online and offline scenarios
4. Validate proper type safety throughout the integration components
5. Configure proper database indexing for performance
6. Set up appropriate Row Level Security policies for data protection

## Best Practices for Extending

When extending the system:

1. Maintain the event-driven architecture for loose coupling
2. Follow the Project type interface for consistency
3. Dispatch appropriate events when modifying projects
4. Listen for relevant events when components need to react to changes
5. Use the MapBridge pattern for new map integrations
6. Ensure database triggers are properly maintained for version tracking
7. Follow the established schema patterns when adding new project-related tables 