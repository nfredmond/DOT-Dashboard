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

### Project Scoring

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