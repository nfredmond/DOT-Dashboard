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
│   │   ├── bca/       # Benefit-Cost Analysis endpoints
│   │   │   └── camp-integration/ # Integration with GreenChAMP (Green DOT Chained Activity Modelling Process) model data
│   │   └── batch/         # Batch operations on multiple projects
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

## Benefit-Cost Analysis API

The benefit-cost analysis API provides endpoints for creating, managing, and calculating benefit-cost analyses for transportation projects.

### `GET /api/projects/[id]/bca`

Retrieves all benefit-cost analyses for a specific project.

**Parameters:**
- `id` (path parameter): The UUID of the project

**Response:**
```typescript
{
  success: true,
  data: BenefitCostAnalysis[]
}
```

### `GET /api/projects/[id]/bca/[analysisId]`

Retrieves a specific benefit-cost analysis by ID.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Response:**
```typescript
{
  success: true,
  data: BenefitCostAnalysis
}
```

### `POST /api/projects/[id]/bca`

Creates a new benefit-cost analysis for a project.

**Parameters:**
- `id` (path parameter): The UUID of the project

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  discountRate: number;
  baseYear: number;
  analysisHorizon: number;
  parameters: MonetizationParameters;
  benefits?: BenefitValueCalculation[];
  costs?: CostValueCalculation[];
  methodology?: string;
  scenarioId?: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: BenefitCostAnalysis
}
```

### `PATCH /api/projects/[id]/bca/[analysisId]`

Updates an existing benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  discountRate?: number;
  baseYear?: number;
  analysisHorizon?: number;
  parameters?: MonetizationParameters;
  benefits?: BenefitValueCalculation[];
  costs?: CostValueCalculation[];
  methodology?: string;
  scenarioId?: string;
  isPublic?: boolean;
  status?: 'draft' | 'reviewed' | 'final';
}
```

**Response:**
```typescript
{
  success: true,
  data: BenefitCostAnalysis
}
```

### `DELETE /api/projects/[id]/bca/[analysisId]`

Deletes a benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Response:**
```typescript
{
  success: true,
  data: { id: string }
}
```

### `POST /api/projects/[id]/bca/[analysisId]/calculate`

Calculates or recalculates a benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Response:**
```typescript
{
  success: true,
  data: BenefitCostAnalysisResult
}
```

### `POST /api/projects/[id]/bca/[analysisId]/sensitivity`

Performs sensitivity analysis on a benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Request Body:**
```typescript
{
  parameters: {
    parameterName: string;
    baseValue: number;
    lowValue: number;
    highValue: number;
  }[]
}
```

**Response:**
```typescript
{
  success: true,
  data: SensitivityAnalysis
}
```

### `POST /api/projects/[id]/bca/[analysisId]/monte-carlo`

Performs Monte Carlo simulation on a benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project
- `analysisId` (path parameter): The UUID of the analysis

**Request Body:**
```typescript
{
  parameters: {
    parameterName: string;
    distribution: 'normal' | 'uniform' | 'triangular' | 'custom';
    mean?: number;
    standardDeviation?: number;
    min?: number;
    max?: number;
    mode?: number;
    customValues?: number[];
  }[];
  iterations: number;
}
```

**Response:**
```typescript
{
  success: true,
  data: MonteCarloSimulation
}
```

### `POST /api/projects/[id]/bca/camp-integration`

Integrates GreenChAMP (Green DOT Chained Activity Modelling Process) model data into a benefit-cost analysis.

**Parameters:**
- `id` (path parameter): The UUID of the project

**Request Body:**
```typescript
{
  analysisId: string;
  campModelId: string;
  scenarioId: string;
  options: {
    mapTravelTime: boolean;
    mapEmissions: boolean;
    mapSafety: boolean;
    mapVehicleOperating: boolean;
    mapHealth: boolean;
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string;
    updatedAnalysis: BenefitCostAnalysis;
  }
}
```

### Data Models

#### MonetizationParameters

The MonetizationParameters interface supports both legacy flat structure and the new structured format:

```typescript
interface MonetizationParameters {
  // Index signature for backward compatibility
  [key: string]: number | string | object | undefined;
  
  // Structured parameters for various benefit categories
  valueOfTime?: {
    commuter: number;
    commercial: number;
    freight: number;
  };
  
  // Emissions costs
  emissions?: {
    co2: number; // $ per metric ton
    nox: number; // $ per ton
    pm: number;  // $ per ton
  };
  
  // Safety/accident costs
  accidentCosts?: {
    fatal: number;     // $ per fatal accident
    injury: number;    // $ per injury accident
    propertyDamage: number; // $ per PDO accident
  };
  
  // Vehicle operating costs
  vehicleOperating?: {
    fuelCost: number;     // $ per gallon
    maintenance: number;  // $ per mile
    depreciation: number; // $ per mile
  };
  
  // Health benefits
  health?: {
    walking: number; // $ per mile walked
    biking: number;  // $ per mile biked
  };
  
  // Legacy fields for backward compatibility
  valueOfTime_legacy?: number;
  fatalityCost?: number;
  injuryCost?: number;
  emissionsCostPerTon?: number;
}
```

## Rate Limiting
API endpoints are rate-limited to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
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