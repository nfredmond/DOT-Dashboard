# Supabase Database Setup Guide for Planning Manager v5

> **Important Note**: While this document covers setting up the Planning Manager with Supabase, agencies also have the option to use the built-in offline database functionality instead. The offline database operates entirely within the browser using IndexedDB and requires no external database service. This option is ideal for agencies with data sovereignty requirements, limited connectivity, or those who prefer to maintain data locally. See [OFFLINE_DATABASE.md](OFFLINE_DATABASE.md) for complete details on the offline database option.

This document outlines detailed instructions for setting up the database schema for the Planning Manager v5 application using Supabase. The database is designed for transportation planning agencies to manage projects, score them using customizable criteria, and track feedback.

## Domain Configuration

The Planning Manager application is now available at [https://planningmanager.ai](https://planningmanager.ai). When setting up your Supabase project, you should configure the following:

1. **Site URL:** Set to `https://planningmanager.ai` in the Supabase Authentication settings
2. **Redirect URLs:** Add `https://planningmanager.ai/api/auth/callback` and `https://planningmanager.ai/auth/callback` to the allowed redirect URLs 
3. **CORS Origins:** Add `https://planningmanager.ai` to the allowed CORS origins

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
10. [AI Model Integration](#ai-model-integration)
11. [Voice Interface Features](#voice-interface-features)

## Getting Started

To set up the database in Supabase:

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the entire schema from `supabase_schema.sql` file
6. Run the query

This will:
- Drop the existing public schema (if any exists)
- Recreate the schema with all required tables
- Set up Row Level Security
- Create necessary indexes
- Add sample AI models

## Schema Overview

The database schema includes the following main components:

- **Core Tables**: agencies, organizations, projects
- **User Management**: profiles, permissions
- **Project Scoring**: criteria, scoring, templates
- **Prioritization**: scenarios, weights
- **AI Integration**: ai_models for integration with various LLMs
- **Voice Interface**: voice_settings and voice_command_logs for voice assistant features

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

## AI Model Integration

The system now includes support for various AI language models through the following tables:

### ai_models

Stores information about supported AI models that can be used throughout the application.

- `id`: Unique identifier
- `name`: Model name (e.g., "GPT-4 Turbo", "Claude 3 Opus")
- `provider`: Provider name (e.g., "OpenAI", "Anthropic")
- `version`: Model version
- `description`: Brief description of the model's capabilities
- `thinking_capable`: Whether the model can perform complex reasoning
- `vision_capable`: Whether the model can process images
- `research_capable`: Whether the model can perform research tasks
- `code_capable`: Whether the model can generate/analyze code
- `voice_capable`: Whether the model works with voice features
- `max_token_limit`: Maximum token context length
- `cost_per_1k_tokens`: Cost per 1,000 tokens for billing
- `is_active`: Whether the model is currently available for use

The schema includes a function `get_best_model_for_task()` that automatically selects the most suitable and cost-effective model based on the specific task requirements.

## Voice Interface Features

The system now supports voice assistant functionality through the following tables:

### voice_settings

Stores user preferences for voice interactions.

- `id`: Unique identifier
- `user_id`: Reference to profiles table
- `voice_type`: Type of voice to use (e.g., "natural")
- `speed`: Speech rate multiplier
- `pitch`: Voice pitch adjustment
- `volume`: Voice volume adjustment
- `preferred_model_id`: User's preferred AI model for voice processing
- `wake_word`: Phrase to activate voice assistant
- `language`: Language code (e.g., "en-US")

### voice_command_logs

Records history of voice commands for analytics and improvement.

- `id`: Unique identifier
- `user_id`: Reference to profiles table
- `command_text`: The text of the voice command
- `model_id`: AI model used for processing
- `command_type`: Type of command
- `response_text`: System response
- `duration_ms`: Processing time in milliseconds
- `was_successful`: Whether the command was successful
- `context`: Additional context in JSON format

### Helper Functions and Views

- `get_user_voice_settings()`: Creates/retrieves voice settings for a user
- `log_voice_command()`: Records voice command activity
- `voice_activity_summary`: View for user voice activity metrics
- `model_usage_statistics`: View for AI model usage metrics

These new features enable voice interaction with the planning system, allowing users to query project information, submit updates, and perform various tasks through voice commands.
