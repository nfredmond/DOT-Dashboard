# Planning Manager System Architecture

This document outlines the comprehensive system architecture for the Planning Manager transportation project management system. It provides a technical blueprint for implementing the complete vision.

## System Overview

The Planning Manager is a full-stack web application built on Next.js that enables transportation agencies to manage, score, prioritize, and visualize infrastructure projects. The architecture follows a modular, service-oriented approach with clear separation of concerns.

The application is deployed at [https://planningmanager.ai](https://planningmanager.ai).

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Pages   │  │ Components│  │   Hooks   │  │  Contexts │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Project  │  │  Scoring  │  │    GIS    │  │    LLM    │  │
│  │  Routes   │  │  Routes   │  │  Routes   │  │  Routes   │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Project  │  │  Scoring  │  │    GIS    │  │    LLM    │  │
│  │ Services  │  │ Services  │  │ Services  │  │ Services  │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     Supabase                           │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │  │
│  │  │PostgreSQL │  │    Auth   │  │     Storage       │  │  │
│  │  └───────────┘  └───────────┘  └───────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          OR                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Offline Database                       │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │  │
│  │  │ IndexedDB │  │Local Auth │  │  Local Storage    │  │  │
│  │  └───────────┘  └───────────┘  └───────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Integrations                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   LLM     │  │  Caltrans │  │  Census   │  │  Other    │  │
│  │   APIs    │  │    APIs   │  │   APIs    │  │   APIs    │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Architectural Principles

1. **Multi-Tenant Isolation**: Each agency's data is securely isolated through row-level security in Supabase
2. **Serverless Architecture**: Utilizes Next.js serverless functions for API routes
3. **Modular Design**: System components are loosely coupled for maintainability and scalability
4. **Progressive Enhancement**: Core features work without advanced capabilities, enriched when available
5. **Responsive Design**: UI adapts to various device sizes while maintaining functionality
6. **Security First**: Authentication, authorization, and data protection at every layer
7. **Performance Optimization**: Efficient data loading, caching, and rendering strategies

## Client Layer

The client layer consists of Next.js pages and React components that provide the user interface. Key aspects include:

### Pages Architecture

- **Route-Based Structure**: Following Next.js App Router pattern
- **Layout Composition**: Shared layouts with nested content areas
- **Server Components**: Where appropriate for improved performance
- **Client Components**: For interactive elements requiring state

### UI Component Library

- **Component Hierarchy**: Atomic design pattern (atoms, molecules, organisms)
- **Styling**: Tailwind CSS with shadcn/ui component system
- **Theming**: Support for light/dark modes and agency-specific branding
- **Accessibility**: WCAG 2.1 AA compliance throughout

### State Management

- **React Context**: For shared application state
- **React Query**: For server state management
- **Zustand**: For complex global state requirements

## API Layer

The API layer provides RESTful endpoints for client-server communication. It's implemented using Next.js API routes.

### API Route Structure

- **/api/projects**: Project CRUD operations
- **/api/scoring**: Scoring and prioritization
- **/api/gis**: GIS and mapping data
- **/api/llm**: LLM interaction endpoints
- **/api/auth**: Authentication and user management
- **/api/reports**: Report generation services
- **/api/external**: External API integrations

### API Design Principles

- **RESTful Conventions**: Standard HTTP methods and status codes
- **Versioning**: API versioning for backward compatibility
- **Rate Limiting**: Protection against abuse
- **Validation**: Input validation for all endpoints
- **Error Handling**: Consistent error formats and codes

## Service Layer

The service layer contains the business logic that sits between the API and data layers.

### Core Services

- **ProjectService**: Project management business logic
- **ScoringService**: Score calculation and prioritization
- **GISService**: Geospatial data processing
- **LLMService**: LLM prompt management and response processing
- **GreenChAMPService**: Travel demand modeling with GreenChAMP
- **TrendNavigatorService**: Emerging trends scenario modeling
- **ReportingService**: Report generation and formatting
- **UserService**: User and role management

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Strategy Pattern**: Interchangeable algorithms (e.g., scoring methods)
- **Factory Pattern**: Creation of complex objects
- **Observer Pattern**: Event-based notifications

## Data Layer

The data layer is built on Supabase, providing a robust foundation for data storage and management.

### Database Schema

- **Core Tables**: agencies, users, profiles, projects, scoring, etc.
- **Junction Tables**: project_users, project_criteria
- **Audit Tables**: audit_logs, llm_logs
- **Reference Tables**: criteria, categories

### Security Model

- **Row-Level Security**: Policies for multi-tenant isolation
- **Role-Based Access**: Different permission levels by role
- **Audit Logging**: Tracking of all data changes

### Storage Strategy

- **Document Storage**: Project documents, reports, and uploads
- **Caching**: Redis or similar for performance improvement
- **Backup Strategy**: Regular backups and disaster recovery

## External Integrations

### LLM Integration

- **Provider Abstraction**: Support for multiple LLM providers
- **Prompt Management**: Templating and versioning
- **Rate Limiting**: Managed usage to control costs
- **Fallback Strategies**: Graceful handling of service outages

### GIS Data Sources

- **Base Maps**: Mapbox GL JS tile providers
- **External Layers**: Integration with GIS data services
- **Geocoding**: Address lookup and reverse geocoding

### Government Data APIs

- **Caltrans APIs**: Traffic and infrastructure data
- **Census APIs**: Demographic data for equity analysis
- **Federal APIs**: Grant and funding information

## Deployment Architecture

### Production Environment

- **Hosting**: Vercel for Next.js frontend and API routes
- **Database**: Supabase for PostgreSQL database
- **Storage**: Supabase Storage or S3-compatible storage
- **CDN**: Edge caching for static assets

### Development Environment

- **Local Setup**: Docker containers for dependencies
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Environment Variables**: Managed via `.env` files and deployment secrets

## Security Architecture

### Authentication

- **Auth Providers**: Email/password, Google, Microsoft, SAML
- **MFA**: Two-factor authentication support
- **Session Management**: Secure cookie handling

### Authorization

- **RBAC**: Role-based access control
- **Permission Granularity**: Fine-grained permissions for resources
- **JWT**: Secure token-based authorization

### Data Protection

- **Encryption**: Data encryption at rest and in transit
- **PII Handling**: Special handling for personally identifiable information
- **Compliance**: GDPR, CCPA readiness

## Performance Optimization

### Frontend Optimization

- **Code Splitting**: Dynamic imports for route-based code splitting
- **Image Optimization**: Next.js Image component for optimized delivery
- **Bundle Size**: Monitoring and minimizing JavaScript bundle size

### Backend Optimization

- **Query Optimization**: Efficient database queries
- **Caching**: Strategic caching for frequently accessed data
- **Pagination**: Efficient data pagination for large datasets

### GIS Optimization

- **Tile Loading**: Optimized loading of map tiles
- **Feature Simplification**: Geometry simplification for complex shapes
- **Clustering**: Marker clustering for dense datasets

## Monitoring and Observability

### Logging

- **Application Logs**: Structured logging format
- **Error Tracking**: Integration with error monitoring service
- **Usage Metrics**: Feature usage tracking

### Performance Monitoring

- **API Performance**: Response time monitoring
- **Frontend Performance**: Core Web Vitals tracking
- **Database Performance**: Query performance monitoring

## Scaling Strategy

### Horizontal Scaling

- **Stateless Design**: API routes designed for horizontal scaling
- **Database Scaling**: Connection pooling and read replicas
- **Load Balancing**: Distribution of traffic across instances

### Resource Optimization

- **Caching Strategy**: Multi-level caching implementation
- **Database Indexing**: Optimized indices for common queries
- **Asset Optimization**: CDN and compression strategies

## Database Options

The Planning Manager supports two database options to accommodate different agency needs:

### Supabase Database (Default)

The default configuration uses Supabase as the data layer, providing:

- PostgreSQL database with PostGIS extension for spatial data
- Built-in authentication and user management
- File storage for documents and attachments
- Real-time data synchronization
- Row-level security policies for multi-tenant isolation
- Advanced querying capabilities

This option requires a Supabase account and is ideal for agencies that need full-featured database capabilities with real-time collaboration.

### Offline Database

The alternative configuration uses a fully client-side database approach:

- IndexedDB for structured data storage
- Local authentication with credential caching
- Browser storage for documents and attachments
- Offline-first operation with optional synchronization
- Data encryption for sensitive information

This option requires no external database service and is ideal for:
- Agencies with data sovereignty requirements
- Field operations with intermittent connectivity
- Organizations preferring to maintain full control of their data
- Simpler deployments without external dependencies

Both database options support the core functionality of the application, though some advanced features may have limited functionality in offline mode. The system is designed to allow seamless switching between the two options or using them in combination (offline mode for field work with periodic synchronization to Supabase). 