# Supabase Database Setup Guide for Planning Manager v6

> **Important Note**: While this document covers setting up the Planning Manager with Supabase, agencies also have the option to use the built-in offline database functionality instead. The offline database operates entirely within the browser using IndexedDB and requires no external database service. This option is ideal for agencies with data sovereignty requirements, limited connectivity, or those who prefer to maintain data locally. See [OFFLINE_DATABASE.md](OFFLINE_DATABASE.md) for complete details on the offline database option.

This document outlines detailed instructions for setting up the database schema for the Planning Manager v6 application using Supabase. The database is designed for transportation planning agencies to manage projects, score them using customizable criteria, and track community feedback.

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
12. [Community Feedback System](#community-feedback-system)
13. [GreenChAMP and TrendNavigator Integration](#greenchamp-and-trendnavigator-integration)
14. [MCP Integration](#mcp-integration)

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

> **Important Note**: If you encounter a syntax error with `DESC` in the `get_best_model_for_task` function, ensure that the `DESC` keyword is placed outside the CASE statement in the ORDER BY clause, not inside it. The correct syntax should be:
> ```sql
> ORDER BY 
>     CASE 
>         WHEN p_task_type = 'analysis' THEN m.max_token_limit
>         WHEN p_task_type = 'conversation' THEN m.cost_per_1k_tokens
>         ELSE m.cost_per_1k_tokens
>     END DESC
> ```

## Schema Overview

The database schema includes the following main components:

- **Core Tables**: agencies, projects, profiles
- **User Management**: profiles, permissions
- **Project Scoring**: criteria, scoring
- **Project Scenarios**: scenarios, comparisons
- **AI Integration**: ai_models for integration with various LLMs
- **Voice Interface**: voice_settings and voice_command_logs for voice assistant features
- **Community Feedback**: feedback collection, categorization, and response tracking
- **Transportation Modeling**: GreenChAMP and TrendNavigator integration tables
- **Project Management**: Tasks, milestones, and progress tracking
- **Offline Support**: Sync tables for offline operation

## Core Tables

### Agency and User Tables

- **agencies**: Top-level entities representing transportation planning agencies
- **profiles**: User profiles with authentication information and agency association

### Project Tables

- **projects**: Transportation projects with metadata, location, status, and budgeting information
- **project_users**: Users assigned to specific projects
- **project_milestones**: Key milestones and deadlines for projects
- **document_attachments**: Files and attachments for projects

### Scoring Tables

- **criteria**: Scoring criteria definitions (safety, mobility, etc.)
- **scoring**: Individual scores for projects against criteria

### Scenario Tables

- **project_scenarios**: Alternative project approaches and design options
- **scenario_comparisons**: Comparisons between different project scenarios

## New in v6

### Community Feedback System

Planning Manager v6 includes a comprehensive community feedback system with the following tables:

- **community_feedback**: Stores public input on projects with optional geospatial data
- **community_feedback_votes**: Tracks community voting on feedback items
- **community_feedback_responses**: Agency responses to community feedback
- **community_feedback_categories**: Category management for organizing feedback
- **community_feedback_settings**: Agency-level settings for the feedback system

### GreenChAMP and TrendNavigator Integration

The following tables support integration with transportation modeling tools:

- **mcp_servers**: Connection information for MCP modeling servers
- **agent_settings**: Configuration for AI agents that interface with modeling tools

### Project Management Enhancements

New tables to support enhanced project management capabilities:

- **project_invoices**: Tracking of project invoices and payment status
- **project_contracts**: Contract management for projects
- **construction_progress**: Track progress of construction projects
- **custom_fields**: Agency-defined custom fields for projects
- **custom_field_values**: Values for custom fields on specific projects

## Security Implementation

The database implements several layers of security:

1. **Row-Level Security (RLS)**: Ensures each agency can only access their own data
2. **Role-Based Access Control**: Different permissions for admin, editor, and viewer roles
3. **Audit Logging**: All changes are tracked with user information

### Row-Level Security Structure

Each table is secured with RLS policies that limit data access based on:

- Agency membership: Users can only see data from their own agency
- User role: Different access levels depending on role (admin, editor, viewer)
- Project assignment: For project-specific tables, access is limited to users assigned to the project

## Performance Optimization

The schema includes numerous indices to ensure fast queries:

- Standard B-Tree indices for foreign key relationships
- GiST indices for spatial data (geometry columns)
- Indices on frequently filtered columns

## Offline Database Support

Planning Manager v6 includes robust support for offline operations. Key components:

- **sync_status**: Tracks the synchronization status of records
- **sync_queue**: Queues changes made offline for synchronization when online

## GreenChAMP and TrendNavigator Integration

To set up the transportation modeling modules:

1. Ensure you have the core schema installed
2. Apply the GreenChAMP and TrendNavigator extension using `greenchamp_trendnavigator_schema.sql`

## ELI5 Documentation

For a simplified explanation of the Planning Manager system, refer to the [PLANNING_MANAGER_ELI5.md](PLANNING_MANAGER_ELI5.md) document, which explains the system in plain language.

## For More Information

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Detailed documentation of each table
- [API.md](docs/API.md) - API documentation for developers
- [OFFLINE_DATABASE.md](OFFLINE_DATABASE.md) - Details on offline functionality
- [GreenChAMP_TrendNavigator_Integration.md](docs/GreenChAMP_TrendNavigator_Integration.md) - Transportation modeling guide
