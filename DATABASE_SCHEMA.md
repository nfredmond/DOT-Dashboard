# Database Schema Design

This document outlines the comprehensive database schema for the Planning Manager v5 transportation project management system. The database is implemented in PostgreSQL via Supabase, with row-level security policies for multi-tenant isolation.

## Database Design Principles

1. **Normalization**: Tables are designed to minimize redundancy while maintaining referential integrity
2. **Performance**: Optimized for common query patterns with appropriate indices
3. **Security**: Row-level security policies enforce multi-tenant isolation
4. **Extensibility**: Schema allows for agency-specific customizations
5. **Auditability**: Changes are tracked for compliance and accountability
6. **Offline Support**: Schema supports offline operations with synchronization

## Authentication and Authorization

The system uses Supabase Auth for authentication and implements a role-based access control system through RLS policies.

### Default Admin User

A default administrator account is included in the schema setup:

- **Email**: <nathaniel@greendottransportation.com>
- **Password**: Yuba530#
- **Role**: admin
- **UUID**: ab61773c-3a28-44d5-95c2-846fa5608811

This user has full administrative privileges for the demo agency, including:

- User management
- Project creation and deletion
- Agency settings management
- Full access to all system functions

### Access Roles

The system supports three access roles:

1. **Admin**: Full access to all features, including user management and deletion
2. **Editor**: Can create and edit data but cannot delete records or manage users
3. **Viewer**: Read-only access to data relevant to their agency

## Entity-Relationship Diagram

```txt
┌─────────────┐       ┌────────────┐       ┌────────────────┐
│   agencies  │       │    users   │       │    profiles    │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ name        │◄──┐   │ email      │   ┌──►│ user_id        │
│ subdomain   │   │   │ created_at │   │   │ agency_id      │
│ settings    │   │   └────────────┘   │   │ role           │
│ created_at  │   │        ▲           │   │ preferences    │
└─────────────┘   │        │           │   └────────────────┘
                  └────────┼───────────┘
                           │
┌─────────────┐       ┌────┴───────┐       ┌────────────────┐
│  projects   │       │  project_  │       │    scoring     │
├─────────────┤       │   users    │       ├────────────────┤
│ id          │◄──┐   ├────────────┤   ┌──►│ id             │
│ agency_id   │   │   │ project_id │   │   │ project_id     │
│ name        │   └───┤ user_id    │   │   │ criteria_id    │
│ description │       │ role       │   │   │ score          │
│ status      │       └────────────┘   │   │ notes          │
│ type        │                        │   │ created_by     │
│ location    │                        │   │ created_at     │
│ geometry    │                        │   │ version        │
│ metadata    │                        │   │ is_synced      │
│ created_by  │                        │   │ created_at     │
│ created_at  │                        │   │ updated_at     │
│ updated_at  │                        │   │ version        │
│ version     │                        │   │ is_synced      │
│ is_synced   │                        │   └────────────────┘
└─────────────┘                        │
      ▲                                │
      │                                │
┌─────┴───────┐       ┌────────────┐       │
│  documents  │       │  feedback  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ project_id  │       │ project_id │       │
│ name        │       │ user_id    │       │
│ type        │       │ rating     │       │
│ url         │       │ comment    │       │
│ metadata    │       │ location   │       │
│ created_by  │       │ created_at │       │
│ created_at  │       │ version    │       │
│ version     │       │ is_synced  │       │
│ is_synced   │       └────────────┘       │
└─────────────┘                            │
                                           │
┌─────────────┐       ┌────────────┐       │
│  llm_config │       │  llm_logs  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ agency_id   │       │ agency_id  │       │
│ provider    │       │ request    │       │
│ model       │       │ response   │
│ api_key_enc │       │ tokens     │       │
│ settings    │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
# Database Schema Design

This document outlines the comprehensive database schema for the Planning Manager v5 transportation project management system. The database is implemented in PostgreSQL via Supabase, with row-level security policies for multi-tenant isolation.

## Database Design Principles

1. **Normalization**: Tables are designed to minimize redundancy while maintaining referential integrity
2. **Performance**: Optimized for common query patterns with appropriate indices
3. **Security**: Row-level security policies enforce multi-tenant isolation
4. **Extensibility**: Schema allows for agency-specific customizations
5. **Auditability**: Changes are tracked for compliance and accountability
6. **Offline Support**: Schema supports offline operations with synchronization

## Authentication and Authorization

The system uses Supabase Auth for authentication and implements a role-based access control system through RLS policies.

### Default Admin User

A default administrator account is included in the schema setup:

- **Email**: <nathaniel@greendottransportation.com>
- **Password**: Yuba530#
- **Role**: admin
- **UUID**: ab61773c-3a28-44d5-95c2-846fa5608811

This user has full administrative privileges for the demo agency, including:

- User management
- Project creation and deletion
- Agency settings management
- Full access to all system functions

### Access Roles

The system supports three access roles:

1. **Admin**: Full access to all features, including user management and deletion
2. **Editor**: Can create and edit data but cannot delete records or manage users
3. **Viewer**: Read-only access to data relevant to their agency

## Entity-Relationship Diagram

```txt
┌─────────────┐       ┌────────────┐       ┌────────────────┐
│   agencies  │       │    users   │       │    profiles    │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ name        │◄──┐   │ email      │   ┌──►│ user_id        │
│ subdomain   │   │   │ created_at │   │   │ agency_id      │
│ settings    │   │   └────────────┘   │   │ role           │
│ created_at  │   │        ▲           │   │ preferences    │
└─────────────┘   │        │           │   └────────────────┘
                  └────────┼───────────┘
                           │
┌─────────────┐       ┌────┴───────┐       ┌────────────────┐
│  projects   │       │  project_  │       │    scoring     │
├─────────────┤       │   users    │       ├────────────────┤
│ id          │◄──┐   ├────────────┤   ┌──►│ id             │
│ agency_id   │   │   │ project_id │   │   │ project_id     │
│ name        │   └───┤ user_id    │   │   │ criteria_id    │
│ description │       │ role       │   │   │ score          │
│ status      │       └────────────┘   │   │ notes          │
│ type        │                        │   │ created_by     │
│ location    │                        │   │ created_at     │
│ geometry    │                        │   │ version        │
│ metadata    │                        │   │ is_synced      │
│ created_by  │                        │   │ created_at     │
│ created_at  │                        │   │ updated_at     │
│ updated_at  │                        │   │ version        │
│ version     │                        │   │ is_synced      │
│ is_synced   │                        │   └────────────────┘
└─────────────┘                        │
      ▲                                │
      │                                │
┌─────┴───────┐       ┌────────────┐       │
│  documents  │       │  feedback  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ project_id  │       │ project_id │       │
│ name        │       │ user_id    │       │
│ type        │       │ rating     │       │
│ url         │       │ comment    │       │
│ metadata    │       │ location   │       │
│ created_by  │       │ created_at │       │
│ created_at  │       │ version    │       │
│ version     │       │ is_synced  │       │
│ is_synced   │       └────────────┘       │
└─────────────┘                            │
                                           │
┌─────────────┐       ┌────────────┐       │
│  llm_config │       │  llm_logs  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ agency_id   │       │ agency_id  │       │
│ provider    │       │ request    │       │
│ model       │       │ response   │
│ api_key_enc │       │ tokens     │       │
│ settings    │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
# Database Schema Design

This document outlines the comprehensive database schema for the Planning Manager v5 transportation project management system. The database is implemented in PostgreSQL via Supabase, with row-level security policies for multi-tenant isolation.

## Database Design Principles

1. **Normalization**: Tables are designed to minimize redundancy while maintaining referential integrity
2. **Performance**: Optimized for common query patterns with appropriate indices
3. **Security**: Row-level security policies enforce multi-tenant isolation
4. **Extensibility**: Schema allows for agency-specific customizations
5. **Auditability**: Changes are tracked for compliance and accountability
6. **Offline Support**: Schema supports offline operations with synchronization

## Authentication and Authorization

The system uses Supabase Auth for authentication and implements a role-based access control system through RLS policies.

### Default Admin User

A default administrator account is included in the schema setup:

- **Email**: <nathaniel@greendottransportation.com>
- **Password**: Yuba530#
- **Role**: admin
- **UUID**: ab61773c-3a28-44d5-95c2-846fa5608811

This user has full administrative privileges for the demo agency, including:

- User management
- Project creation and deletion
- Agency settings management
- Full access to all system functions

### Access Roles

The system supports three access roles:

1. **Admin**: Full access to all features, including user management and deletion
2. **Editor**: Can create and edit data but cannot delete records or manage users
3. **Viewer**: Read-only access to data relevant to their agency

## Entity-Relationship Diagram

```txt
┌─────────────┐       ┌────────────┐       ┌────────────────┐
│   agencies  │       │    users   │       │    profiles    │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ name        │◄──┐   │ email      │   ┌──►│ user_id        │
│ subdomain   │   │   │ created_at │   │   │ agency_id      │
│ settings    │   │   └────────────┘   │   │ role           │
│ created_at  │   │        ▲           │   │ preferences    │
└─────────────┘   │        │           │   └────────────────┘
                  └────────┼───────────┘
                           │
┌─────────────┐       ┌────┴───────┐       ┌────────────────┐
│  projects   │       │  project_  │       │    scoring     │
├─────────────┤       │   users    │       ├────────────────┤
│ id          │◄──┐   ├────────────┤   ┌──►│ id             │
│ agency_id   │   │   │ project_id │   │   │ project_id     │
│ name        │   └───┤ user_id    │   │   │ criteria_id    │
│ description │       │ role       │   │   │ score          │
│ status      │       └────────────┘   │   │ notes          │
│ type        │                        │   │ created_by     │
│ location    │                        │   │ created_at     │
│ geometry    │                        │   │ version        │
│ metadata    │                        │   │ is_synced      │
│ created_by  │                        │   │ created_at     │
│ created_at  │                        │   │ updated_at     │
│ updated_at  │                        │   │ version        │
│ version     │                        │   │ is_synced      │
│ is_synced   │                        │   └────────────────┘
└─────────────┘                        │
      ▲                                │
      │                                │
┌─────┴───────┐       ┌────────────┐       │
│  documents  │       │  feedback  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ project_id  │       │ project_id │       │
│ name        │       │ user_id    │       │
│ type        │       │ rating     │       │
│ url         │       │ comment    │       │
│ metadata    │       │ location   │       │
│ created_by  │       │ created_at │       │
│ created_at  │       │ version    │       │
│ version     │       │ is_synced  │       │
│ is_synced   │       └────────────┘       │
└─────────────┘                            │
                                           │
┌─────────────┐       ┌────────────┐       │
│  llm_config │       │  llm_logs  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ agency_id   │       │ agency_id  │       │
│ provider    │       │ request    │       │
│ model       │       │ response   │
│ api_key_enc │       │ tokens     │       │
│ settings    │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
# Database Schema Design

This document outlines the comprehensive database schema for the Planning Manager v5 transportation project management system. The database is implemented in PostgreSQL via Supabase, with row-level security policies for multi-tenant isolation.

## Database Design Principles

1. **Normalization**: Tables are designed to minimize redundancy while maintaining referential integrity
2. **Performance**: Optimized for common query patterns with appropriate indices
3. **Security**: Row-level security policies enforce multi-tenant isolation
4. **Extensibility**: Schema allows for agency-specific customizations
5. **Auditability**: Changes are tracked for compliance and accountability
6. **Offline Support**: Schema supports offline operations with synchronization

## Authentication and Authorization

The system uses Supabase Auth for authentication and implements a role-based access control system through RLS policies.

### Default Admin User

A default administrator account is included in the schema setup:

- **Email**: <nathaniel@greendottransportation.com>
- **Password**: Yuba530#
- **Role**: admin
- **UUID**: ab61773c-3a28-44d5-95c2-846fa5608811

This user has full administrative privileges for the demo agency, including:

- User management
- Project creation and deletion
- Agency settings management
- Full access to all system functions

### Access Roles

The system supports three access roles:

1. **Admin**: Full access to all features, including user management and deletion
2. **Editor**: Can create and edit data but cannot delete records or manage users
3. **Viewer**: Read-only access to data relevant to their agency

## Entity-Relationship Diagram

```

┌─────────────┐       ┌────────────┐       ┌────────────────┐
│   agencies  │       │    users   │       │    profiles    │
├─────────────┤       ├────────────┤       ├────────────────┤
│ id          │       │ id         │       │ id             │
│ name        │◄──┐   │ email      │   ┌──►│ user_id        │
│ subdomain   │   │   │ created_at │   │   │ agency_id      │
│ settings    │   │   └────────────┘   │   │ role           │
│ created_at  │   │        ▲           │   │ preferences    │
└─────────────┘   │        │           │   └────────────────┘
                  └────────┼───────────┘
                           │
┌─────────────┐       ┌────┴───────┐       ┌────────────────┐
│  projects   │       │  project_│       │    scoring     │
├─────────────┤       │   users    │       ├────────────────┤
│ id          │◄──┐   ├────────────┤   ┌──►│ id             │
│ agency_id   │   │   │ project_id │   │   │ project_id     │
│ name        │   └───┤ user_id    │   │   │ criteria_id    │
│ description │       │ role       │   │   │ score          │
│ status      │       └────────────┘   │   │ notes          │
│ type        │                        │   │ created_by     │
│ location    │                        │   │ created_at     │
│ geometry    │                        │   │ version        │
│ metadata    │                        │   │ is_synced      │
│ created_by  │                        │   │ created_at     │
│ created_at  │                        │   │ updated_at     │
│ updated_at  │                        │   │ version        │
│ version     │                        │   │ is_synced      │
│ is_synced   │                        │   └────────────────┘
└─────────────┘                        │
      ▲                                │
      │                                │
┌─────┴───────┐       ┌────────────┐       │
│  documents  │       │  feedback  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ project_id  │       │ project_id │       │
│ name        │       │ user_id    │       │
│ type        │       │ rating     │       │
│ url         │       │ comment    │       │
│ metadata    │       │ location   │       │
│ created_by  │       │ created_at │       │
│ created_at  │       │ version    │       │
│ version     │       │ is_synced  │       │
│ is_synced   │       └────────────┘       │
└─────────────┘                            │
                                           │
┌─────────────┐       ┌────────────┐       │
│  llm_config │       │  llm_logs  │       │
├─────────────┤       ├────────────┤       │
│ id          │       │ id         │       │
│ agency_id   │       │ agency_id  │       │
│ provider    │       │ request    │       │
│ model       │       │ response   │
│ api_key_enc │       │ tokens     │       │
│ settings    │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_at  │       │ created_at │       │
│ updated_at  │       │ updated_at │       │
│ is_default  │       │ is_default │       │
│ metadata    │       │ metadata   │       │
│ created_by  │       │ created_by │       │
│ created_by  │                        │   └────────────────┘
│ created_at  │                        │
│ updated_at  │                        │   ┌────────────────┐
│ version     │                        │   │    criteria    │
│ is_synced   │                        │   ├────────────────┤
└─────────────┘                        │   │ id             │
      ▲                                └───┤ agency_id      │
      │                                    │ name           │
┌─────┴───────┐       ┌────────────┐       │ description    │
│  documents  │       │  feedback  │       │ weight         │
├─────────────┤       ├────────────┤       │ category       │
│ id          │       │ id         │       │ type           │
│ project_id  │       │ project_id │       │ is_active      │
│ name        │       │ user_id    │       │ created_at     │
│ type        │       │ rating     │       │ version        │
│ url         │       │ comment    │       │ is_synced      │
│ metadata    │       │ location   │       └────────────────┘
│ created_by  │       │ created_at │
│ created_at  │       │ version    │       ┌────────────────┐
│ version     │       │ is_synced  │       │ scoring_│
│ is_synced   │       └────────────┘       │ templates      │
└─────────────┘                            ├────────────────┤
                                           │ id             │
┌─────────────┐       ┌────────────┐       │ agency_id      │
│  llm_config │       │  llm_logs  │       │ name           │
├─────────────┤       ├────────────┤       │ description    │
│ id          │       │ id         │       │ is_default     │
│ agency_id   │       │ agency_id  │       │ metadata       │
│ provider    │       │ request    │       │ created_by     │
│ model       │       │ response   │       │ created_at     │
│ api_key_enc │       │ tokens     │       │ updated_at     │
│ settings    │       │ created_by │       └────────────────┘
│ created_at  │       │ created_at │
└─────────────┘       └────────────┘       ┌────────────────┐
                                           │   reports      │
┌─────────────┐       ┌────────────┐       ├────────────────┤
│ sync_status │       │ sync_queue │       │ id             │
├─────────────┤       ├────────────┤       │ agency_id      │
│ id          │       │ id         │       │ name           │
│ record_id   │       │ record_id  │       │ description    │
│ table_name  │       │ table_name │       │ type           │
│ version     │       │ operation  │       │ content        │
│ last_sync_at│       │ data       │       │ created_by     │
│ client_ver  │       │ created_at │       │ created_at     │
│ is_deleted  │       │ client_id  │       └────────────────┘
└─────────────┘       │ agency_id  │
                      └────────────┘       ┌────────────────┐
                                           │   audit_logs   │
                                           ├────────────────┤
                                           │ id             │
                                           │ agency_id      │
                                           │ user_id        │
                                           │ action         │
                                           │ resource_type  │
                                           │ resource_id    │
                                           │ details        │
                                           │ created_at     │
                                           └────────────────┘

```

## Table Definitions

### agencies

Stores information about each transportation agency using the system.

| Column     | Type        | Description                                       |
|------------|-------------|---------------------------------------------------|
| id         | UUID        | Primary key                                       |
| name       | TEXT        | Agency name                                       |
| subdomain  | TEXT        | Subdomain for agency portal                       |
| settings   | JSONB       | Agency-specific configuration settings            |
| created_at | TIMESTAMPTZ | Creation timestamp                                |

### users

Authentication table managed by Supabase Auth.

| Column     | Type        | Description                 |
|------------|--------------|-----------------------------|
| id         | UUID         | Primary key                 |
| email      | TEXT         | User email address          |
| created_at | TIMESTAMPTZ  | Creation timestamp          |

### profiles

User profiles with agency association and role information.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| user_id     | UUID        | Foreign key to users.id                         |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| role        | TEXT        | User role (admin, editor, viewer)               |
| preferences | JSONB       | User-specific preferences                       |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### projects

The core table storing transportation project information.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| name        | TEXT        | Project name                                    |
| description | TEXT        | Project description                             |
| status      | TEXT        | Project status (planning, active, completed)    |
| type        | TEXT        | Project type (road, transit, bicycle, etc.)     |
| location    | TEXT        | Textual location description                    |
| geometry    | GEOMETRY    | GIS geometry data (point, line, polygon)        |
| metadata    | JSONB       | Additional project data                         |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |
| updated_at  | TIMESTAMPTZ | Last update timestamp                           |

### project_users

Junction table for user-project associations.

| Column     | Type   | Description                  |
|------------|--------|------------------------------|
| project_id | UUID   | Foreign key to projects.id   |
| user_id    | UUID   | Foreign key to users.id      |
| role       | TEXT   | Role on this specific project|

### criteria

Scoring criteria definitions for project evaluation.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| name        | TEXT        | Criterion name                                  |
| description | TEXT        | Detailed description                            |
| weight      | NUMERIC     | Weight in overall scoring (0-1)                 |
| category    | TEXT        | Category (safety, equity, environment, etc.)    |
| type        | TEXT        | Data type (numeric, boolean, enum)              |
| is_active   | BOOLEAN     | Whether criterion is currently in use           |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### scoring

Project scores against defined criteria.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| project_id  | UUID        | Foreign key to projects.id                      |
| criteria_id | UUID        | Foreign key to criteria.id                      |
| score       | NUMERIC     | Score value                                     |
| notes       | TEXT        | Justification or notes for the score            |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### scoring_templates

Reusable templates for project scoring.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| name        | TEXT        | Template name                                   |
| description | TEXT        | Template description                            |
| is_default  | BOOLEAN     | Whether this is the default template            |
| metadata    | JSONB       | Additional template settings                    |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |
| updated_at  | TIMESTAMPTZ | Last update timestamp                           |

### scoring_template_criteria

Links criteria to templates with specific weights.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| template_id | UUID        | Foreign key to scoring_templates.id             |
| criteria_id | UUID        | Foreign key to criteria.id                      |
| weight      | NUMERIC     | Weight of this criterion in the template (0-1)  |

### documents

Project-related documents and files.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| project_id  | UUID        | Foreign key to projects.id                      |
| name        | TEXT        | Document name                                   |
| type        | TEXT        | Document type                                   |
| url         | TEXT        | Storage URL                                     |
| metadata    | JSONB       | Additional document metadata                    |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### feedback

Community and stakeholder feedback on projects.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| project_id  | UUID        | Foreign key to projects.id                      |
| user_id     | UUID        | Foreign key to users.id (null for anonymous)    |
| rating      | INTEGER     | Optional numeric rating                         |
| comment     | TEXT        | Feedback text                                   |
| location    | GEOMETRY    | Optional location reference                     |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### llm_config

Configuration for LLM integrations.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| provider    | TEXT        | LLM provider (OpenAI, Claude, etc.)             |
| model       | TEXT        | Specific model identifier                       |
| api_key_enc | TEXT        | Encrypted API key                               |
| settings    | JSONB       | Provider-specific settings                      |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### llm_logs

Logs of LLM interactions for auditing and cost tracking.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| request     | TEXT        | Request prompt                                  |
| response    | TEXT        | LLM response                                    |
| tokens      | INTEGER     | Token usage count                               |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### reports

Generated reports and documents.

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| id          | UUID        | Primary key                                     |
| agency_id   | UUID        | Foreign key to agencies.id                      |
| name        | TEXT        | Report name                                     |
| description | TEXT        | Report description                              |
| type        | TEXT        | Report type                                     |
| content     | TEXT        | Report content (Markdown/HTML)                  |
| created_by  | UUID        | Foreign key to users.id                         |
| created_at  | TIMESTAMPTZ | Creation timestamp                              |

### audit_logs

System audit trail for compliance and security.

| Column        | Type        | Description                                     |
|---------------|-------------|-------------------------------------------------|
| id            | UUID        | Primary key                                     |
| agency_id     | UUID        | Foreign key to agencies.id                      |
| user_id       | UUID        | Foreign key to users.id                         |
| action        | TEXT        | Action performed                                |
| resource_type | TEXT        | Type of resource affected                       |
| resource_id   | UUID        | ID of affected resource                         |
| details       | JSONB       | Additional details about the action             |
| created_at    | TIMESTAMPTZ | Creation timestamp                              |

### Sync Tables for Offline Support

#### sync_status

Tracks the synchronization state of individual records.

| Column        | Type        | Description                                     |
|---------------|-------------|-------------------------------------------------|
| id            | UUID        | Primary key                                     |
| record_id     | UUID        | ID of the tracked record                        |
| table_name    | TEXT        | Name of the table containing the record         |
| version       | INTEGER     | Current server-side version                     |
| last_sync_at  | TIMESTAMPTZ | Last time this record was synced                |
| client_version| INTEGER     | Last known client version                       |
| is_deleted    | BOOLEAN     | Whether the record has been deleted             |

#### sync_queue

Stores pending changes to be synchronized between client and server.

| Column        | Type        | Description                                     |
|---------------|-------------|-------------------------------------------------|
| id            | UUID        | Primary key                                     |
| record_id     | UUID        | ID of the affected record                       |
| table_name    | TEXT        | Name of the affected table                      |
| operation     | TEXT        | Operation type (INSERT, UPDATE, DELETE)         |
| data          | JSONB       | Record data                                     |
| created_at    | TIMESTAMPTZ | When the change was recorded                    |
| processed_at  | TIMESTAMPTZ | When the change was processed                   |
| client_id     | TEXT        | Client identifier                               |
| conflict_resolution | TEXT  | Strategy used if conflict was detected          |
| agency_id     | UUID        | Foreign key to agencies.id                      |

### Sync Columns on Existing Tables

The following columns are added to tables that support offline operations:

| Column      | Type        | Description                                     |
|-------------|-------------|-------------------------------------------------|
| version     | INTEGER     | Version counter for conflict detection          |
| client_id   | TEXT        | Optional identifier of the client that created/modified the record |
| is_synced   | BOOLEAN     | Whether the record is synchronized              |

These columns are added to:

- projects
- criteria
- scoring
- documents
- feedback

## Indices

| Table        | Columns                         | Type    | Purpose                                         |
|--------------|--------------------------------|---------|------------------------------------------------|
| agencies     | subdomain                      | UNIQUE  | Lookup by subdomain                            |
| agencies     | created_at                     | BTREE   | Chronological queries                          |
| profiles     | user_id                        | UNIQUE  | Enforce one profile per user                   |
| profiles     | (agency_id, user_id)           | UNIQUE  | Enforce unique user per agency                 |
| profiles     | agency_id                      | BTREE   | Filtering by agency                            |
| profiles     | created_at                     | BTREE   | Chronological queries                          |
| projects     | agency_id                      | BTREE   | Filtering by agency                            |
| projects     | created_by                     | BTREE   | Filtering by creator                           |
| projects     | status                         | BTREE   | Filtering by status                            |
| projects     | type                           | BTREE   | Filtering by type                              |
| projects     | created_at                     | BTREE   | Chronological queries                          |
| projects     | updated_at                     | BTREE   | Chronological queries                          |
| projects     | geometry                       | GIST    | Spatial queries                                |
| project_users| user_id                        | BTREE   | Filtering by user                              |
| criteria     | agency_id                      | BTREE   | Filtering by agency                            |
| criteria     | category                       | BTREE   | Filtering by category                          |
| criteria     | is_active                      | BTREE   | Filtering by active status                     |
| scoring      | project_id                     | BTREE   | Filtering by project                           |
| scoring      | criteria_id                    | BTREE   | Filtering by criteria                          |
| scoring      | created_by                     | BTREE   | Filtering by creator                           |
| scoring_templates | agency_id                 | BTREE   | Filtering by agency                            |
| scoring_templates | created_by                | BTREE   | Filtering by creator                           |
| scoring_template_criteria | template_id       | BTREE   | Filtering by template                          |
| scoring_template_criteria | criteria_id       | BTREE   | Filtering by criteria                          |
| documents    | project_id                     | BTREE   | Filtering by project                           |
| documents    | created_by                     | BTREE   | Filtering by creator                           |
| documents    | type                           | BTREE   | Filtering by type                              |
| feedback     | project_id                     | BTREE   | Filtering by project                           |
| feedback     | user_id                        | BTREE   | Filtering by user                              |
| feedback     | created_at                     | BTREE   | Chronological queries                          |
| feedback     | location                       | GIST    | Spatial queries                                |
| llm_config   | agency_id                      | BTREE   | Filtering by agency                            |
| llm_config   | provider                       | BTREE   | Filtering by provider                          |
| llm_logs     | agency_id                      | BTREE   | Filtering by agency                            |
| llm_logs     | created_by                     | BTREE   | Filtering by user                              |
| llm_logs     | created_at                     | BTREE   | Chronological queries                          |
| reports      | agency_id                      | BTREE   | Filtering by agency                            |
| reports      | created_by                     | BTREE   | Filtering by creator                           |
| reports      | type                           | BTREE   | Filtering by type                              |
| audit_logs   | agency_id                      | BTREE   | Filtering by agency                            |
| audit_logs   | user_id                        | BTREE   | Filtering by user                              |
| audit_logs   | resource_type                  | BTREE   | Filtering by resource type                     |
| audit_logs   | resource_id                    | BTREE   | Filtering by resource                          |
| audit_logs   | created_at                     | BTREE   | Chronological queries                          |
| audit_logs   | (resource_type, resource_id)   | BTREE   | Looking up logs for a specific resource        |

## Functions and Triggers

### Automated Timestamps

The database automatically manages update timestamps:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for scoring_templates table
CREATE TRIGGER update_scoring_templates_updated_at
BEFORE UPDATE ON scoring_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Audit Logging

All modifications to key tables are automatically logged:

```sql
-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        agency_id, user_id, action, resource_type, resource_id, details
    ) VALUES (
        -- Agency ID logic
        CASE
            WHEN TG_TABLE_NAME = 'agencies' THEN NEW.id
            WHEN TG_TABLE_NAME = 'profiles' THEN NEW.agency_id
            ELSE NEW.agency_id
        END,
        (SELECT auth.uid()),
        TG_OP,
        TG_TABLE_NAME,
        -- Resource ID logic
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        -- Details logic
        CASE
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old_data', to_jsonb(OLD))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
            ELSE jsonb_build_object('new_data', to_jsonb(NEW))
        END
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Sync Management

The database includes functions for managing offline synchronization:

#### increment_version()

Automatically increments the version number and marks records as needing synchronization.

```sql
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.is_synced = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### record_to_sync_queue()

Records changes to the sync queue for server-initiated changes.

```sql
CREATE OR REPLACE FUNCTION record_to_sync_queue()
RETURNS TRIGGER AS $$
DECLARE
    agency_id_val UUID;
    operation_val TEXT;
    data_val JSONB;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        operation_val := 'INSERT';
        data_val := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        operation_val := 'UPDATE';
        data_val := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        operation_val := 'DELETE';
        data_val := to_jsonb(OLD);
    END IF;
    
    -- ... determine agency_id based on table
    
    -- Insert into sync queue
    INSERT INTO sync_queue (
        record_id,
        table_name,
        operation,
        data,
        client_id,
        agency_id
    ) VALUES (
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_TABLE_NAME,
        operation_val,
        data_val,
        'server',
        agency_id_val
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

#### get_changes_since()

Retrieves all changes made since a specific timestamp for synchronization.

```sql
CREATE OR REPLACE FUNCTION get_changes_since(
    since_timestamp TIMESTAMPTZ,
    agency_id_param UUID,
    requested_tables TEXT[] DEFAULT ARRAY['projects', 'criteria', 'scoring', 'feedback', 'documents']
)
RETURNS TABLE (
    table_name TEXT,
    record_id UUID,
    data JSONB,
    operation TEXT,
    version INTEGER,
    updated_at TIMESTAMPTZ
) AS $$
-- ... function implementation
$$ LANGUAGE plpgsql;
```

#### resolve_sync_conflict()

Resolves conflicts between client and server versions of records.

```sql
CREATE OR REPLACE FUNCTION resolve_sync_conflict(
    record_id_param UUID,
    table_name_param TEXT,
    server_data JSONB,
    client_data JSONB,
    conflict_strategy TEXT DEFAULT 'server_wins'
)
RETURNS JSONB AS $$
-- ... function implementation
$$ LANGUAGE plpgsql;
```

## Row-Level Security Policies

The database implements comprehensive row-level security (RLS) policies to enforce multi-tenant isolation and role-based access control.

### Helper Functions

```sql
-- Get the current user's agency
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT agency_id
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the current user is an admin or editor
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Policy Categories

The RLS policies are organized into logical categories:

1. **Agency-Level Policies**: Control access to core agency data
2. **Project Management Policies**: Govern project creation and assignment
3. **Scoring System Policies**: Manage evaluation criteria and scoring
4. **Supporting Feature Policies**: Handle documents, feedback, and reports

### Key Policy Patterns

The system implements several policy patterns:

#### Agency Isolation

All data is isolated by agency:

```sql
-- Example: Projects are only visible to users in the same agency
CREATE POLICY projects_view_policy ON projects
    FOR SELECT
    USING (agency_id = get_user_agency_id());
```

#### Role-Based Access

Different roles have different permissions:

```sql
-- Example: Only admins can delete projects
CREATE POLICY projects_delete_policy ON projects
    FOR DELETE
    USING (
        agency_id = get_user_agency_id() 
        AND is_admin()
    );
```

#### Relationship-Based Access

Access to related tables is controlled through join conditions:

```sql
-- Example: Access to scoring is based on project ownership
CREATE POLICY scoring_view_policy ON scoring
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scoring.project_id
            AND projects.agency_id = get_user_agency_id()
        )
    );
```

### Sync Table Policies

Policies for sync-related tables:

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
        -- ... similar checks for other tables
    );
```

## Synchronization Mechanism

The synchronization process manages data consistency between the client's offline database and the server.

### Synchronization Flow

1. **Client Pull**: Client requests all changes since last sync timestamp
2. **Server Push**: Client sends all local changes to server
3. **Conflict Resolution**: Server resolves conflicts using specified strategies
4. **Confirmation**: Server acknowledges successful sync
5. **Cleanup**: Client updates local sync metadata

### Conflict Resolution Strategies

The system supports multiple conflict resolution strategies:

1. **Server Wins**: Server version takes precedence (default)
2. **Client Wins**: Client version takes precedence
3. **Newest Wins**: Version with the highest version number wins
4. **Field-Level Merge**: Merge non-conflicting field changes

## Performance Considerations

The database schema includes several performance optimizations:

1. **Strategic Indices**: On columns used frequently in filtering and sorting
2. **JSONB for Flexibility**: Structured but flexible data storage for metadata
3. **GiST Spatial Indices**: For efficient geospatial queries
4. **Composite Indices**: For common multi-column filter patterns

For high-traffic instances, consider:

1. **Materialized Views**: For complex dashboard calculations
2. **Table Partitioning**: For high-volume tables like audit_logs
3. **Connection Pooling**: To manage database connections efficiently
4. **Query Optimization**: Regular review of slow queries

### Offline Mode Performance

For optimal offline performance:

1. **Selective Sync**: Only sync necessary tables and records
2. **Batch Processing**: Process sync operations in batches
3. **Compression**: Compress data during sync operations
4. **Throttling**: Control sync frequency based on connectivity
5. **Prioritization**: Sync critical data first

## Security Considerations

Beyond row-level security, the schema implements several security features:

1. **No Direct Table Access**: All access through the Supabase API with RLS
2. **Encrypted API Keys**: Sensitive API keys are encrypted at rest
3. **Audit Trail**: Comprehensive logging of all data modifications
4. **Separation of Concerns**: Clear table boundaries and access patterns

Security best practices:

1. **Regular Key Rotation**: Implement procedures for rotating API keys
2. **Permission Audits**: Regularly review user permissions
3. **Data Minimization**: Only store necessary data
4. **Backups**: Implement regular backup procedures

### Offline Security

Offline support introduces additional security considerations:

1. **Local Encryption**: Sensitive data must be encrypted at rest on client devices
2. **Permission Verification**: All permissions are re-verified during sync
3. **Tamper Protection**: Digital signatures prevent tampering with offline data
4. **Data Minimization**: Only necessary data should be available offline

## Integration with Supabase

The schema is designed for optimal use with Supabase:

1. **Auth Integration**: Leverages Supabase auth.users for authentication
2. **Storage Integration**: Optimized for use with Supabase Storage
3. **PostgREST API**: Works with Supabase's RESTful API
4. **Realtime**: Compatible with Supabase's realtime subscriptions

To implement this schema:

1. Create a new Supabase project
2. Apply the schema using the SQL Editor
3. Configure RLS policies
4. Set up authentication providers
5. Connect the application using the Supabase client

### Offline Sync Implementation

For detailed offline implementation guidance:

1. Refer to `OFFLINE_DATABASE.md` for complete documentation
2. Apply the schema extensions in `offline_database_schema.sql`
3. Implement the client-side IndexedDB database
4. Create the synchronization API endpoints
5. Implement the conflict resolution UI
