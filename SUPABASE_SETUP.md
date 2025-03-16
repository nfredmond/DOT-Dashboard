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

## Getting Started

To set up the database in Supabase:

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the SQL code from the `supabase_schema.sql` file
6. Execute the query

For a quick overview of the complete database structure, refer to `DATABASE_SCHEMA.md`.

If you need offline database support, see the [Offline Database Support](#offline-database-support) section.

### Admin User Access

The schema includes setup for an admin user with the following credentials:

- **Email**: <nathaniel@greendottransportation.com>
- **Password**: Yuba530#
- **Role**: admin (highest level access)
- **UUID**: ab61773c-3a28-44d5-95c2-846fa5608811

When executing the full schema, this user will be automatically assigned admin privileges for the demo agency. To use this account:

1. Ensure the user exists in Supabase Auth with the exact email address
2. Use the provided password to log in
3. The user will have full administrative access to the system

For production deployments, you should change these credentials and create your own admin users.

## Schema Overview

The database schema follows these design principles:

- **Multi-tenant**: Isolated data per agency through row-level security
- **Role-based access**: Different permissions for admins, editors, and viewers
- **Audit logging**: Comprehensive tracking of all data changes
- **Spatial support**: PostGIS integration for location-based data
- **Performance optimized**: Strategic indices for common query patterns
- **Offline capability**: Support for working offline with synchronization

The database consists of the following main components:

- Core tables (agencies, users, projects)
- Scoring system (criteria, scoring, templates)
- Document management
- Feedback collection
- LLM integration
- Reporting
- Audit logging
- Offline synchronization

## Core Tables

### Agencies & Users

Each organization using the system is represented as an "agency" with its own isolated data. Users are assigned to an agency with a specific role that determines their permissions.

```txt
┌─────────────┐       ┌────────────┐       ┌────────────────┐
│   agencies  │       │    users   │       │    profiles    │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ name        │◄──┐   │ email      │   ┌──►│ user_id        │
│ subdomain   │   │   │ created_at │   │   │ agency_id      │
│ settings    │   │   └────────────┘   │   │ role           │
│ created_at  │   │                    │   │ preferences    │
└─────────────┘   └────────────────────┘   └────────────────┘
```

### Projects & Scoring

Projects are the central entity, representing transportation initiatives that are scored against customizable criteria.

```txt
┌─────────────┐       ┌────────────┐       ┌────────────────┐
│  projects   │       │  criteria  │       │    scoring     │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ agency_id   │       │ agency_id  │       │ project_id     │
│ name        │       │ name       │◄──────┤ criteria_id    │
│ description │       │ description│       │ score          │
│ status      │◄──────┤ weight     │       │ notes          │
│ type        │       │ category   │       │ created_by     │
│ geometry    │       │ type       │       │ created_at     │
└─────────────┘       └────────────┘       └────────────────┘
```

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
