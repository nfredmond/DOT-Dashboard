# Offline Database Support for Planning Manager v5

This document outlines the implementation of offline capabilities for the Planning Manager v5 application, allowing users to continue working with limited functionality when disconnected from the network.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Schema Modifications](#schema-modifications)
4. [Synchronization Mechanism](#synchronization-mechanism)
5. [Security Considerations](#security-considerations)
6. [Implementation Guide](#implementation-guide)
7. [Limitations](#limitations)

## Overview

The offline database feature allows users to:

- View existing projects, criteria, and scoring data
- Create new projects, comments, and scores
- Update existing projects and scores
- Track changes made while offline
- Synchronize changes when reconnecting to the network

This capability is particularly important for field work where network connectivity may be intermittent or unavailable.

## Architecture

The offline database implementation uses a multi-layer architecture:

1. **Local Storage**: IndexedDB database for client-side storage
2. **Sync Queue**: Queue for tracking offline changes
3. **Conflict Resolution**: System for handling synchronization conflicts
4. **Data Version Tracking**: Mechanism to manage data versioning

### Client-Side Database

The client-side database is implemented using IndexedDB with the following characteristics:

- Schema mirrors the main Supabase database with simplified structure
- Focus on frequently used tables (projects, criteria, scoring, feedback)
- Optimized for low-memory environments
- Encrypted storage for sensitive data

## Schema Modifications

To support offline functionality, the main database schema requires the following modifications:

### 1. New Sync-Related Tables

```sql
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
```

### 2. Column Additions to Existing Tables

Add the following columns to core tables that need offline support:

```sql
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
```

### 3. Functions for Sync Management

```sql
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
```

## Synchronization Mechanism

The synchronization process follows these steps:

1. **Pull Updates**: Client requests all changes since last sync time
2. **Push Local Changes**: Client sends all local changes in sync queue
3. **Conflict Resolution**: Server identifies and resolves conflicts
4. **Confirmation**: Server acknowledges successful sync
5. **Cleanup**: Client purges sync queue

### Sync API Endpoints

The following API endpoints should be implemented:

- `GET /api/sync/changes?since={timestamp}&tables={tables}` - Get all changes since last sync
- `POST /api/sync/push` - Push client changes to server
- `GET /api/sync/status` - Get sync status for the current user
- `POST /api/sync/resolve` - Resolve conflicts manually

### Conflict Resolution Strategy

Conflicts are resolved using the following hierarchy:

1. **Last-Write Wins**: For non-critical data updates
2. **Server Authority**: For critical system data
3. **Manual Resolution**: For complex conflicts where automatic resolution isn't possible
4. **Version Merging**: For compatible changes to different fields

## Security Considerations

Offline capabilities introduce several security challenges:

1. **Local Data Encryption**: Sensitive data must be encrypted at rest on the client
2. **Authentication Persistence**: Secure mechanisms for maintaining authentication state offline
3. **Permission Verification**: Server must verify permissions on sync
4. **Data Leakage Prevention**: Limit offline data to what's necessary

### Implementation Measures

```sql
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
    );
```

## Implementation Guide

### 1. Database Setup

1. Execute the schema modifications in the `supabase_schema.sql` file
2. Apply the additional SQL for sync tables and triggers

### 2. Client-Side Setup

1. Initialize the IndexedDB database with the required schema
2. Implement the data access layer to handle both online and offline modes
3. Create the sync queue management system

```javascript
// Example IndexedDB schema initialization
const dbPromise = indexedDB.open('PlanningManagerOffline', 1);

dbPromise.onupgradeneeded = function(event) {
  const db = event.target.result;
  
  // Projects store
  const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
  projectsStore.createIndex('agency_id', 'agency_id', { unique: false });
  projectsStore.createIndex('is_synced', 'is_synced', { unique: false });
  
  // Scoring store
  const scoringStore = db.createObjectStore('scoring', { keyPath: 'id' });
  scoringStore.createIndex('project_id', 'project_id', { unique: false });
  scoringStore.createIndex('is_synced', 'is_synced', { unique: false });
  
  // Sync queue store
  const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
  syncQueueStore.createIndex('record_id', 'record_id', { unique: false });
  syncQueueStore.createIndex('processed', 'processed', { unique: false });
};
```

### 3. Synchronization Process

Implement the sync process with error handling, retry logic, and conflict resolution:

```javascript
// Example synchronization function
async function synchronize() {
  // 1. Check if online
  if (!navigator.onLine) {
    return { success: false, reason: 'offline' };
  }
  
  try {
    // 2. Get last sync timestamp
    const lastSync = localStorage.getItem('last_sync_timestamp') || 0;
    
    // 3. Fetch server changes
    const serverChanges = await api.get(`/api/sync/changes?since=${lastSync}`);
    
    // 4. Apply server changes to local DB
    await applyServerChanges(serverChanges);
    
    // 5. Get local changes
    const localChanges = await getLocalChanges();
    
    // 6. Push local changes to server
    const pushResult = await api.post('/api/sync/push', localChanges);
    
    // 7. Handle conflicts if any
    if (pushResult.conflicts && pushResult.conflicts.length > 0) {
      await handleConflicts(pushResult.conflicts);
    }
    
    // 8. Update last sync timestamp
    localStorage.setItem('last_sync_timestamp', new Date().toISOString());
    
    // 9. Clean up sync queue
    await cleanupSyncQueue(pushResult.processed);
    
    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, reason: 'error', details: error };
  }
}
```

## Limitations

The offline database functionality has the following limitations:

1. **Reduced Feature Set**: Not all features are available offline
2. **Storage Constraints**: Limited by browser storage constraints (typically 50-250MB)
3. **Complex Operations**: Multi-table operations may have limited support
4. **Real-time Collaboration**: Not available offline
5. **Large Dataset Handling**: Performance issues with very large datasets

### Recommended Offline Usage Patterns

- Focus on limited project subsets when working offline
- Synchronize regularly when connectivity is available
- Use the "Export to Offline" feature to prepare for known offline periods
- Be aware of pending changes awaiting synchronization

## Conclusion

The offline database capabilities provide essential functionality for field workers and situations with limited connectivity. By carefully implementing the synchronization mechanism and adhering to security best practices, the Planning Manager v5 application can deliver a seamless experience across both online and offline modes.
