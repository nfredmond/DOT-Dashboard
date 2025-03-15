# Planning Manager API Documentation
This directory contains the API routes for the Planning Manager transportation project management system. The API routes are implemented using Next.js 14 App Router API routes.
## API Structure
The API follows a RESTful architecture organized by resource type:
```bash
api/
├── auth/              # Authentication endpoints
│   ├── login/         # User login
│   ├── register/      # User registration
│   └── [...nextauth]  # NextAuth.js configuration
├── projects/          # Project management endpoints
│   ├── [id]/          # Single project operations
│   └── batch/         # Batch operations on multiple projects
├── scoring/           # Project scoring endpoints
│   └── criteria/      # Scoring criteria configuration
├── mapping/           # GIS mapping related endpoints
│   ├── geojson/       # GeoJSON data for projects
│   └── feedback/      # Community feedback on map locations
├── documents/         # Document management endpoints
│   ├── upload/        # Document upload
│   └── [id]/          # Single document operations
└── ai/                # AI assistant endpoints
    ├── analyze/       # AI analysis of project data
    └── suggest/       # AI suggestions for improvements
```
## Request and Response Format
All API endpoints follow a consistent format:
### Requests
- GET requests for retrieving data
- POST requests for creating new resources
- PUT requests for updating existing resources
- DELETE requests for removing resources
Query parameters and request bodies are validated using Zod schemas.
### Responses
All responses follow this structure:
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}
```
## Authentication
The API uses NextAuth.js for authentication with the following providers:
- Email/password authentication
- Google OAuth
- Microsoft OAuth
Protected routes require a valid JWT token in the Authorization header:
```bash
Authorization: Bearer <token>
```
## Project Endpoints
### GET /api/projects
Retrieve a list of projects with optional filtering and pagination.
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Field to sort by (default: 'createdAt')
- `order`: Sort order ('asc' or 'desc', default: 'desc')
- `type`: Filter by project type
- `status`: Filter by project status
**Response:**
```typescript
{
  success: true,
  data: {
    projects: Project[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    }
  }
}
```
### GET /api/projects/[id]
Retrieve details for a single project.
**Response:**
```typescript
{
  success: true,
  data: Project
}
```
### POST /api/projects
Create a new project.
**Request Body:**
```typescript
{
  name: string;
  description: string;
  type: ProjectType;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  // Additional project fields...
}
```
**Response:**
```typescript
{
  success: true,
  data: Project
}
```
### PUT /api/projects/[id]
Update an existing project.
**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  // Fields to update...
}
```
**Response:**
```typescript
{
  success: true,
  data: Project
}
```
### DELETE /api/projects/[id]
Delete a project.
**Response:**
```typescript
{
  success: true,
  data: { id: string }
}
```
## Batch Operations
### POST /api/projects/batch
Update multiple projects at once.
**Request Body:**
```typescript
{
  projectIds: string[];
  updates: {
    status?: ProjectStatus;
    // Fields to update on all projects...
  }
}
```
**Response:**
```typescript
{
  success: true,
  data: {
    updated: string[];
    skipped: string[];
  }
}
```
## AI Integration Endpoints
### POST /api/ai/analyze
Analyze project data using AI.
**Request Body:**
```typescript
{
  projectId: string;
  analysisType: 'scoring' | 'improvement' | 'documentation';
}
```
**Response:**
```typescript
{
  success: true,
  data: {
    analysis: {
      // Analysis results...
    }
  }
}
```
### POST /api/ai/suggest
Get AI-generated suggestions for project improvements.
**Request Body:**
```typescript
{
  projectId: string;
  suggestionType: 'description' | 'scoring' | 'funding';
}
```
**Response:**
```typescript
{
  success: true,
  data: {
    suggestions: string[];
  }
}
```
## Error Handling
API errors use appropriate HTTP status codes and provide detailed error information:
```typescript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    details: {
      // Additional error details...
    }
  }
}
```
Common error codes:
- `INVALID_REQUEST`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error
## Rate Limiting
API endpoints are rate-limited to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
## Data Models
TypeScript interfaces for the main data models can be found in the `src/types` directory.
## Development Guidelines
When adding new API endpoints:
1. Follow the established directory structure
2. Use consistent request/response formats
3. Implement proper validation using Zod
4. Handle errors with appropriate status codes
5. Document the endpoint in this README
6. Add appropriate tests

