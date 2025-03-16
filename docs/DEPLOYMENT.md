# Deployment Guide

This guide provides instructions for deploying the Planning Manager application to production environments.

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- Vercel account (recommended) or another hosting platform
- Production-ready OpenAI API key

## Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Set Up Your Vercel Account

1. If you don't have a Vercel account, [sign up for free](https://vercel.com/signup).
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

#### 2. Connect Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. From the Vercel dashboard, click "Add New" > "Project".
3. Import your repository and configure project settings.

#### 3. Configure Environment Variables

Add the following environment variables in the Vercel dashboard:

```
DATABASE_URL=your_production_database_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_production_secret
OPENAI_API_KEY=your_production_api_key
MCP_URL=your_model_context_protocol_url (if applicable)
```

#### 4. Deploy

1. Click "Deploy" in the Vercel dashboard, or run:
   ```bash
   vercel --prod
   ```
2. Vercel will automatically build and deploy your application.

### Option 2: Docker Deployment

#### 1. Create a Dockerfile

```Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "run", "start:prod"]
```

#### 2. Update package.json for Production

Add the following script to your package.json:

```json
"scripts": {
  "start:prod": "node server.js"
}
```

#### 3. Build and Deploy Docker Image

```bash
# Build Docker image
docker build -t planning-manager .

# Run Docker container
docker run -p 3000:3000 --env-file .env.production planning-manager
```

### Option 3: Traditional Server Deployment

#### 1. Prepare Your Server

1. Set up a server with Node.js installed
2. Install PostgreSQL or use a managed database service
3. Configure a reverse proxy (Nginx or Apache) to serve your application

#### 2. Deploy Application

```bash
# Clone repository
git clone your-repo-url
cd planning-manager

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Start production server
npm start
```

## Database Migration in Production

Before deploying a new version with database schema changes:

```bash
# Generate SQL migrations
npx prisma migrate deploy
```

## Setting Up CI/CD

### GitHub Actions Example

Create a file `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Prisma Client
        run: npx prisma generate
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoring

### Application Monitoring

- Set up [Sentry](https://sentry.io) for error tracking
- Configure [New Relic](https://newrelic.com) or [Datadog](https://www.datadoghq.com) for performance monitoring

### Database Monitoring

- Use [PgHero](https://github.com/ankane/pghero) for PostgreSQL performance monitoring
- Set up database backups with [pgBackRest](https://pgbackrest.org/)

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Authentication**: Ensure NextAuth is configured properly for production
3. **Rate Limiting**: Implement rate limiting for API routes
4. **Database Access**: Use limited-privilege database users
5. **HTTPS**: Always use HTTPS in production

## Performance Optimization

1. **Caching**: Implement Redis or other caching layers
2. **CDN**: Use a CDN for static assets
3. **Database Indexing**: Ensure proper indexes on frequently queried columns
4. **Server Location**: Choose server regions close to your users

## Scaling Considerations

As your application grows, consider:

1. **Horizontal Scaling**: Deploy to multiple regions
2. **Database Scaling**: Implement read replicas
3. **Microservices**: Split large applications into microservices
4. **Serverless Functions**: Use serverless functions for API routes

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**: Check build logs for errors
2. **Database Connection**: Verify connection strings and network permissions
3. **Environment Variables**: Ensure all required variables are set
4. **Memory Issues**: Increase memory allocation if builds are failing

## Rollback Procedure

If a deployment introduces critical issues:

1. Revert to the last known good commit
2. Deploy the previous version
3. Run database migrations if necessary 