# API Documentation

This document outlines the available API endpoints and their usage in the Planning Manager application.

## Base URL

```
Production: https://api.planningmanager.com
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Verification email sent"
}
```

### Projects

#### List Projects

```http
GET /projects
Authorization: Bearer <jwt_token>
```

**Query Parameters**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `sort` (optional): Sort field (created_at, name, score)
- `order` (optional): Sort order (asc, desc)

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "description": "Project description",
      "status": "active",
      "score": 85,
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

#### Get Project

```http
GET /projects/{id}
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Project description",
  "status": "active",
  "score": 85,
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "criteria": {
    "safety": 4,
    "costBenefit": 5,
    "environmental": 3,
    "equity": 4
  },
  "attachments": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "type": "application/pdf",
      "size": 1024,
      "url": "https://storage.example.com/path/to/file"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Create Project

```http
POST /projects
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "criteria": {
    "safety": 4,
    "costBenefit": 5,
    "environmental": 3,
    "equity": 4
  }
}
```

**Response**
```json
{
  "id": "uuid",
  "name": "New Project",
  "description": "Project description",
  "status": "draft",
  "score": 85,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Project

```http
PUT /projects/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Project",
  "description": "Updated description",
  "criteria": {
    "safety": 5,
    "costBenefit": 5,
    "environmental": 4,
    "equity": 4
  }
}
```

**Response**
```json
{
  "id": "uuid",
  "name": "Updated Project",
  "description": "Updated description",
  "status": "active",
  "score": 90,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Delete Project

```http
DELETE /projects/{id}
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "message": "Project deleted successfully"
}
```

#### Project Scoring

#### Calculate Score

```http
POST /projects/{id}/score
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "criteria": {
    "safety": 5,
    "costBenefit": 4,
    "environmental": 3,
    "equity": 4
  },
  "weights": {
    "safety": 0.4,
    "costBenefit": 0.3,
    "environmental": 0.2,
    "equity": 0.1
  }
}
```

**Response**
```json
{
  "project_id": "uuid",
  "score": 85,
  "breakdown": {
    "safety": 20,
    "costBenefit": 12,
    "environmental": 6,
    "equity": 4
  },
  "calculated_at": "2024-01-01T00:00:00Z"
}
```

### Project Attachments

#### Upload Attachment

```http
POST /projects/{id}/attachments
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <file_data>
```

**Response**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "document.pdf",
  "type": "application/pdf",
  "size": 1024,
  "url": "https://storage.example.com/path/to/file",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

#### List Attachments

```http
GET /projects/{id}/attachments
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "type": "application/pdf",
      "size": 1024,
      "url": "https://storage.example.com/path/to/file",
      "uploaded_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GIS Features

#### Spatial Query

```http
POST /projects/spatial
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-122.4194, 37.7749],
        [-122.4184, 37.7749],
        [-122.4184, 37.7739],
        [-122.4194, 37.7739],
        [-122.4194, 37.7749]
      ]
    ]
  },
  "relation": "intersects"
}
```

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      }
    }
  ]
}
```

### User Management

#### Get Profile

```http
GET /users/me
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "preferences": {
    "theme": "light",
    "notifications": true
  }
}
```

#### Update Profile

```http
PUT /users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe",
  "preferences": {
    "theme": "dark",
    "notifications": false
  }
}
```

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "preferences": {
    "theme": "dark",
    "notifications": false
  },
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Organizations

#### List Organizations

```http
GET /organizations
Authorization: Bearer <jwt_token>
```

**Query Parameters**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `onlyMine` (optional): Filter by organizations the user is a member of (default: false)

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Organization Name",
      "description": "Organization description",
      "logo_url": "https://storage.example.com/organization_logos/org_123.png",
      "settings": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### Get Organization

```http
GET /organizations/{id}
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "id": "uuid",
  "name": "Organization Name",
  "description": "Organization description",
  "logo_url": "https://storage.example.com/organization_logos/org_123.png",
  "website": "https://example.org",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "primaryContactName": "Jane Smith",
  "primaryContactEmail": "jane@example.org",
  "primaryContactPhone": "555-123-4567",
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Create Organization

```http
POST /organizations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Organization Name",
  "description": "Organization description",
  "website": "https://example.org",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "primaryContactName": "Jane Smith",
  "primaryContactEmail": "jane@example.org",
  "primaryContactPhone": "555-123-4567",
  "settings": {}
}
```

**Response**
```json
{
  "data": {
    "id": "uuid",
    "name": "Organization Name",
    "description": "Organization description",
    "website": "https://example.org",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Organization

```http
PATCH /organizations/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Organization Name",
  "description": "Updated organization description"
}
```

**Response**
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Organization Name",
    "description": "Updated organization description",
    "logo_url": "https://storage.example.com/organization_logos/org_123.png",
    "website": "https://example.org",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

#### Upload Organization Logo

```http
POST /organizations/{id}/logo
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "logo": <file>
}
```

**Response**
```json
{
  "data": {
    "logoUrl": "https://storage.example.com/organization_logos/org_123_timestamp.png",
    "organization": {
      "id": "uuid",
      "name": "Organization Name",
      "logo_url": "https://storage.example.com/organization_logos/org_123_timestamp.png",
      "updated_at": "2024-01-02T00:00:00Z"
    }
  }
}
```

**Notes**
- Supported file formats: JPEG, PNG, GIF, SVG
- Maximum file size: 2MB
- Previous logo files are not automatically deleted

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Too Many Requests
- `500`: Internal Server Error

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project data",
    "details": {
      "name": "Project name is required",
      "location": "Invalid coordinates format"
    }
  }
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per IP per 15 minutes for public endpoints
- 1000 requests per user per hour for authenticated endpoints

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Versioning

The API version is specified in the URL:
```
/api/v1/projects
```

Current stable version: `v1`

## Pagination

List endpoints support pagination through query parameters:
- `page`: Page number (1-based)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## CORS

The API supports CORS for allowed origins. Include credentials for authenticated requests:

```javascript
fetch('https://api.planningmanager.com/projects', {
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## WebSocket API

Real-time updates are available through WebSocket connections:

```javascript
const ws = new WebSocket('wss://api.planningmanager.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

### Event Types

- `project.updated`
- `project.scored`
- `attachment.uploaded`
- `comment.created`

### Example WebSocket Message

```json
{
  "type": "project.updated",
  "data": {
    "project_id": "uuid",
    "changes": {
      "status": "active",
      "score": 85
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

# Project Feedback

## Get Project Feedback

**URL**: `/api/projects/{project_id}/feedback`  
**Method**: `GET`  
**Auth Required**: Yes

### Response

```json
{
  "feedback": [
    {
      "id": "feedback-id",
      "content": "Feedback content",
      "rating": 4,
      "category": "Environment",
      "user_id": "user-id",
      "created_at": "2023-11-15T10:30:45Z"
    }
  ]
}
```

# Project Scenarios

## List Project Scenarios

**URL**: `/api/projects/{projectId}/scenarios`  
**Method**: `GET`  
**Auth Required**: Yes

### Response

```json
[
  {
    "id": "scenario-id",
    "projectId": "project-id",
    "name": "Enhanced Safety Focus",
    "description": "A scenario that prioritizes safety improvements with pedestrian and bicycle facilities",
    "timeline": "2024-2026",
    "cost": 1200000.00,
    "benefits": ["Improved pedestrian safety", "Dedicated bike lanes", "Reduced vehicle speeds"],
    "drawbacks": ["Higher cost", "Longer implementation time"],
    "feasibility": 0.85,
    "impact": {"safety": 0.9, "mobility": 0.7, "cost": 0.6},
    "analysis": "This scenario would significantly improve safety metrics for all road users...",
    "createdAt": "2023-11-15T10:30:45Z"
  }
]
```

## Create Project Scenario

**URL**: `/api/projects/{projectId}/scenarios`  
**Method**: `POST`  
**Auth Required**: Yes

### Request

```json
{
  "name": "Enhanced Safety Focus",
  "description": "A scenario that prioritizes safety improvements with pedestrian and bicycle facilities",
  "timeline": "2024-2026",
  "cost": 1200000.00,
  "benefits": ["Improved pedestrian safety", "Dedicated bike lanes", "Reduced vehicle speeds"],
  "drawbacks": ["Higher cost", "Longer implementation time"],
  "feasibility": 0.85,
  "impact": {"safety": 0.9, "mobility": 0.7, "cost": 0.6},
  "analysis": "This scenario would significantly improve safety metrics for all road users..."
}
```

### Response

```json
{
  "id": "scenario-id",
  "projectId": "project-id",
  "name": "Enhanced Safety Focus",
  "description": "A scenario that prioritizes safety improvements with pedestrian and bicycle facilities",
  "timeline": "2024-2026",
  "cost": 1200000.00,
  "benefits": ["Improved pedestrian safety", "Dedicated bike lanes", "Reduced vehicle speeds"],
  "drawbacks": ["Higher cost", "Longer implementation time"],
  "feasibility": 0.85,
  "impact": {"safety": 0.9, "mobility": 0.7, "cost": 0.6},
  "analysis": "This scenario would significantly improve safety metrics for all road users...",
  "createdAt": "2023-11-15T10:30:45Z"
}
```

## Get Specific Scenario

**URL**: `/api/projects/{projectId}/scenarios/{scenarioId}`  
**Method**: `GET`  
**Auth Required**: Yes

### Response

```json
{
  "id": "scenario-id",
  "projectId": "project-id",
  "name": "Enhanced Safety Focus",
  "description": "A scenario that prioritizes safety improvements with pedestrian and bicycle facilities",
  "timeline": "2024-2026",
  "cost": 1200000.00,
  "benefits": ["Improved pedestrian safety", "Dedicated bike lanes", "Reduced vehicle speeds"],
  "drawbacks": ["Higher cost", "Longer implementation time"],
  "feasibility": 0.85,
  "impact": {"safety": 0.9, "mobility": 0.7, "cost": 0.6},
  "analysis": "This scenario would significantly improve safety metrics for all road users...",
  "createdAt": "2023-11-15T10:30:45Z"
}
```

## Update Scenario

**URL**: `/api/projects/{projectId}/scenarios/{scenarioId}`  
**Method**: `PATCH`  
**Auth Required**: Yes

### Request

```json
{
  "name": "Updated Scenario Name",
  "description": "Updated description",
  "cost": 1300000.00
}
```

### Response

```json
{
  "id": "scenario-id",
  "projectId": "project-id",
  "name": "Updated Scenario Name",
  "description": "Updated description",
  "timeline": "2024-2026",
  "cost": 1300000.00,
  "benefits": ["Improved pedestrian safety", "Dedicated bike lanes", "Reduced vehicle speeds"],
  "drawbacks": ["Higher cost", "Longer implementation time"],
  "feasibility": 0.85,
  "impact": {"safety": 0.9, "mobility": 0.7, "cost": 0.6},
  "analysis": "This scenario would significantly improve safety metrics for all road users...",
  "createdAt": "2023-11-15T10:30:45Z",
  "updatedAt": "2023-11-16T14:22:33Z"
}
```

## Delete Scenario

**URL**: `/api/projects/{projectId}/scenarios/{scenarioId}`  
**Method**: `DELETE`  
**Auth Required**: Yes

### Response

```json
{
  "success": true,
  "message": "Scenario deleted successfully"
}
```

## Compare Scenarios

**URL**: `/api/projects/{projectId}/scenarios/compare`  
**Method**: `PUT`  
**Auth Required**: Yes

### Request

```json
{
  "scenario1Id": "scenario1-id",
  "scenario2Id": "scenario2-id"
}
```

### Response

```json
{
  "id": "comparison-id",
  "projectId": "project-id",
  "scenario1Id": "scenario1-id",
  "scenario2Id": "scenario2-id",
  "comparison": "The Enhanced Safety Focus provides comprehensive safety improvements but at a higher cost and longer timeline. The Cost-Efficient Alternative addresses critical issues with a more limited budget and faster implementation.",
  "recommendation": "Recommend the Enhanced Safety Focus scenario if budget allows, as it provides superior long-term safety benefits and aligns better with community feedback.",
  "scores": {
    "overall": {"scenario1": 0.85, "scenario2": 0.75},
    "categories": {
      "safety": {"scenario1": 0.9, "scenario2": 0.7},
      "cost": {"scenario1": 0.6, "scenario2": 0.85},
      "timeline": {"scenario1": 0.7, "scenario2": 0.8}
    }
  },
  "createdAt": "2023-11-16T09:45:12Z"
}
``` 