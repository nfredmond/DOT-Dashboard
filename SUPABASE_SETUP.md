# Supabase Database Setup Guide for Planning Manager v5

This document outlines detailed instructions for setting up the database schema for the Planning Manager v5 application using Supabase. The database is designed for transportation planning agencies to manage projects, score them using customizable criteria, and track feedback.

## Required Extensions

The following extensions must be enabled in your Supabase project:

1. **UUID Extension** - For unique identifier generation
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **PostGIS** - For geospatial data handling
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

3. **pgcrypto** - For encryption functions
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

4. **Vector** - For LLM embeddings and semantic search
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

You can enable these extensions in the Supabase dashboard under Database > Extensions, or run the commands above in the SQL Editor.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Schema Overview](#schema-overview)
3. [Core Tables](#core-tables)
4. [Security Implementation](#security-implementation)
5. [Performance Optimization](#performance-optimization)
6. [Offline Database Support](#offline-database-support)
7. [Sample Data](#sample-data)
8. [Development Notes](#development-notes)
9. [Demo Mode](#demo-mode)

## Getting Started

To set up the database in Supabase:

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the entire SQL code from the `supabase_schema.sql` file
6. Run the query to create all tables, indices, and sample data

**Important**: The SQL script will drop and recreate the public schema, removing all existing data. This is designed to give you a clean slate each time you run it.

## Demo Mode vs Real Authentication

The application supports two modes of operation:

### Demo Mode
- Activated when logging in with test credentials:
  - **Admin demo**: Email: `admin@example.com`, Password: `password`
  - **User demo**: Email: `user@example.com`, Password: `password`
- Uses pre-loaded sample data from the database
- Changes may not persist between sessions
- Ideal for testing and demonstration purposes

### Real Authentication Mode
- Activated when logging in with real credentials (e.g., `nathaniel@greendottransportation.com`)
- Connects to the actual Supabase database
- All changes are persisted
- Requires proper database setup with the complete schema

## Schema Overview

The database schema is organized around the following key concepts:

1. **Multi-Tenancy**: The system supports multiple transportation agencies, each with their own isolated data.
2. **Organizations**: Within an agency, multiple organizations (e.g., departments, member agencies) can exist.
3. **Projects**: The central entity representing transportation projects with various attributes.
4. **Scoring**: A flexible scoring system for evaluating and prioritizing projects.
5. **Geospatial Data**: Support for location-based analysis and visualization.
6. **Scenarios**: Alternative project approaches that can be compared and analyzed.

## Core Tables

### Agency and Organization Tables

- **agencies**: Top-level entities representing transportation planning agencies
- **organizations**: Departments or member agencies within a parent agency
- **profiles**: User profiles with authentication information

### Project Tables

- **projects**: Transportation projects with metadata, location, and status
- **project_users**: Users assigned to specific projects
- **project_milestones**: Key milestones and deadlines for projects
- **spatial_features**: Geospatial features related to projects
- **documents**: Files and attachments for projects
- **comments**: User comments on projects
- **feedback**: Public or stakeholder feedback

### Scoring Tables

- **criteria**: Scoring criteria definitions (safety, mobility, etc.)
- **scoring**: Individual scores for projects against criteria
- **scoring_templates**: Reusable templates for scoring projects
- **prioritization_scenarios**: Budget scenarios for prioritizing project lists

### Scenario Tables

- **project_scenarios**: Alternative project approaches and design options
- **scenario_comparisons**: Comparisons between different project scenarios

### System Tables

- **reports**: Saved and scheduled reports
- **audit_logs**: System audit trail
- **notifications**: User notifications
- **user_settings**: Per-user configuration
- **api_keys**: API access keys
- **llm_config**: Configuration for LLM (AI) features
- **llm_logs**: Logs of LLM interactions

## Security Implementation

The database implements several layers of security:

1. **Row-Level Security (RLS)**: Ensures each agency can only access their own data
2. **Role-Based Access Control**: Different permissions for admin, editor, and viewer roles
3. **Audit Logging**: All changes are tracked with user information
4. **API Key Encryption**: Sensitive credentials are encrypted

### Row-Level Security Structure

The RLS policies are organized into logical categories:

1. **Agency-Level Policies**: Control access to core agency data
2. **Project Management Policies**: Govern project creation and assignment
3. **Scoring System Policies**: Manage evaluation criteria and scoring
4. **Supporting Feature Policies**: Handle documents, feedback, and reports

### Key Security Policies

The schema implements several policy patterns:

- **Agency Isolation**: All users can only see data from their own agency
- **Role-Based Access**:
  - Admins can create, read, update, and delete data
  - Editors can create, read, and update but not delete
  - Viewers have read-only access
- **Relationship-Based Access**: Access to related tables (like scoring) is controlled through join conditions

### Helper Functions

The system includes several security helper functions:

- `get_user_agency_id()`: Returns the agency ID of the current authenticated user
- `is_admin()`: Checks if the current user has admin privileges
- `is_admin_or_editor()`: Checks if the current user can modify data

## Performance Optimization

The schema includes numerous indices to ensure fast queries:

- Standard B-Tree indices for foreign key relationships
- GiST indices for spatial data (geometry columns)
- Composite indices for common query patterns
- Unique constraints for data integrity

### Key Performance Features

- Strategic indices on all filter columns
- JSONB for flexible metadata storage
- GiST spatial indices for geospatial queries
- Automatic timestamp management

## Offline Database Support

The Planning Manager v5 includes support for offline operations, allowing users to continue working when disconnected from the network. This feature is particularly useful for field work in areas with limited connectivity.

### Setting Up Offline Support

To enable offline database capabilities:

1. First set up the base schema using `supabase_schema.sql`
2. Then apply the offline database extensions using `offline_database_schema.sql`

The offline support adds:

1. **Sync Tables**: For tracking changes and managing synchronization
2. **Version Tracking**: To detect conflicts and manage data versions
3. **Conflict Resolution**: Functions to handle synchronization conflicts
4. **API Support**: Backend functions for the sync process

### Key Components

```txt
┌─────────────┐       ┌────────────┐
│ sync_status │       │ sync_queue │
├─────────────┤       ├────────────┤
│ id          │       │ id         │
│ record_id   │       │ record_id  │
│ table_name  │       │ table_name │
│ version     │       │ operation  │
│ last_sync_at│       │ data       │
│ client_ver  │       │ created_at │
│ is_deleted  │       │ client_id  │
└─────────────┘       └────────────┘
```

### Security Considerations

Offline mode has additional security considerations:

- Local data is encrypted on the client device
- Permissions are re-verified during synchronization
- All sync operations are fully audited
- Data access in offline mode follows the same RLS policies

For complete details on the offline implementation, refer to `OFFLINE_DATABASE.md`.

## Sample Data

The SQL file includes optional sample data that can be used for testing:

- A demo transportation agency
- Sample evaluation criteria
- Basic project templates
- Default admin user for immediate access

## Development Notes

### Migrating Between Environments

When moving between development, staging, and production:

1. Use the full schema for new environment setup
2. For schema changes, create separate migration files
3. Test migrations in development before applying to production

### Cleaning Up (Development Only)

The SQL file includes commented code for dropping all tables and functions. This should ONLY be used in development environments, never in production.

### Extending the Schema

The schema is designed to be extensible:

- New criteria types can be added to the criteria table
- Project metadata can store additional structured data as JSONB
- New tables can be added with appropriate RLS policies

### Working with Supabase

The schema is optimized for use with Supabase's features:

- Auth integration with auth.users table
- Storage integration for documents
- Real-time subscriptions for collaborative features
- PostgREST API for client access

## Next Steps

After setting up the database:

1. Configure your application to connect to Supabase
2. Set up API routes for data access
3. Implement client-side authentication
4. Create your first agency and admin user
5. Configure offline sync capabilities if needed

For detailed implementation guidance, refer to the application documentation.
