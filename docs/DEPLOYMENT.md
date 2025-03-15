# Deployment Guide

This document outlines the deployment process and configuration for the Planning Manager application.

## Infrastructure Overview

The application is deployed using the following infrastructure:

- **Frontend**: Vercel (Next.js)
- **Backend**: Vercel Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry

## Prerequisites

1. **Accounts Required**
   - Vercel account
   - Supabase account
   - GitHub account
   - OpenAI API key (for AI features)

2. **Development Tools**
   ```bash
   # Required tools
   node -v  # v18.x or higher
   npm -v   # v9.x or higher
   git --version
   ```

## Environment Setup

### 1. Environment Variables

Create `.env.local` for local development:

```bash
# Base URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Storage Configuration
NEXT_PUBLIC_STORAGE_URL=your_storage_url

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_WEBSOCKETS=true
```

### 2. Supabase Setup

1. **Database Initialization**
   ```bash
   # Install Supabase CLI
   npm install -g supabase-cli

   # Login to Supabase
   supabase login

   # Initialize Supabase
   supabase init

   # Start local Supabase
   supabase start

   # Apply database migrations
   supabase db reset
   ```

2. **Database Migrations**
   ```sql
   -- Apply initial schema
   \i sql/schema.sql

   -- Apply RLS policies
   \i sql/policies.sql

   -- Create extensions
   \i sql/extensions.sql
   ```

## Local Development

1. **Install Dependencies**
   ```bash
   # Install project dependencies
   npm install

   # Install development dependencies
   npm install --save-dev @types/node @types/react typescript
   ```

2. **Run Development Server**
   ```bash
   # Start development server
   npm run dev

   # Run with debugger
   npm run dev:debug
   ```

3. **Testing Setup**
   ```bash
   # Run tests
   npm test

   # Run tests with coverage
   npm run test:coverage

   # Run E2E tests
   npm run test:e2e
   ```

## Production Deployment

### 1. Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link project
   vercel link
   ```

2. **Configure Project**
   ```bash
   # Deploy to production
   vercel --prod

   # Set environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy Configuration**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/next"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

### 2. Database Migration

```bash
# Generate migration
npm run migration:generate

# Apply migration
npm run migration:run

# Verify migration
npm run migration:status
```

### 3. SSL Configuration

```nginx
# NGINX configuration for SSL
server {
    listen 443 ssl http2;
    server_name planningmanager.com;

    ssl_certificate /etc/letsencrypt/live/planningmanager.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/planningmanager.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS configuration
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

## Monitoring and Logging

### 1. Application Monitoring

```typescript
// Sentry configuration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express()
  ]
});
```

### 2. Performance Monitoring

```typescript
// Performance monitoring setup
export const monitorPerformance = () => {
  if (typeof window !== 'undefined') {
    // Web Vitals
    reportWebVitals(sendToAnalytics);
    
    // Custom metrics
    performance.mark('app-start');
  }
};
```

### 3. Error Tracking

```typescript
// Error boundary configuration
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }
}
```

## Scaling Configuration

### 1. Caching Strategy

```typescript
// Redis cache configuration
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// Cache middleware
export const cacheMiddleware = async (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
  const key = `cache:${req.url}`;
  const cached = await redis.get(key);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  next();
};
```

### 2. Load Balancing

```nginx
# Load balancer configuration
upstream app_servers {
    least_conn;
    server app1.planningmanager.com:3000;
    server app2.planningmanager.com:3000;
    server app3.planningmanager.com:3000;
}

server {
    listen 80;
    server_name planningmanager.com;

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# Backup script

# Set variables
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="planning_manager"

# Create backup
pg_dump -Fc $DB_NAME > $BACKUP_DIR/backup_$DATE.dump

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.dump

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

### 2. Recovery Procedure

```bash
# Restore database
pg_restore -d planning_manager backup.dump

# Verify restoration
psql -d planning_manager -c "SELECT COUNT(*) FROM projects;"
```

## Security Measures

### 1. Security Headers

```typescript
// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### 2. Rate Limiting

```typescript
// Rate limiting configuration
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Maintenance Procedures

### 1. Database Maintenance

```sql
-- Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE planning_manager;
```

### 2. Cache Management

```typescript
// Cache invalidation
export const invalidateCache = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length) {
    await redis.del(...keys);
  }
};
```

## Troubleshooting

### 1. Common Issues

```typescript
// Health check endpoint
export default async function healthCheck(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connection
    await supabase.from('health').select('*');
    
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error });
  }
}
```

### 2. Logging

```typescript
// Logging configuration
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
```

## Continuous Integration/Deployment

### 1. GitHub Actions Workflow

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deployment Verification

### 1. Smoke Tests

```typescript
// Smoke test suite
describe('Smoke Tests', () => {
  test('Homepage loads', async () => {
    const res = await fetch('https://planningmanager.com');
    expect(res.status).toBe(200);
  });

  test('API is responsive', async () => {
    const res = await fetch('https://api.planningmanager.com/health');
    expect(res.status).toBe(200);
  });

  test('Database is connected', async () => {
    const { data, error } = await supabase
      .from('health')
      .select('*');
    expect(error).toBeNull();
  });
});
```

### 2. Monitoring Setup

```typescript
// Monitoring verification
const verifyMonitoring = async () => {
  // Verify Sentry
  Sentry.captureMessage('Monitoring test');

  // Verify analytics
  analytics.track('Deployment', {
    version: process.env.NEXT_PUBLIC_VERSION,
    environment: process.env.NODE_ENV
  });

  // Verify logging
  logger.info('Deployment complete');
};
``` 