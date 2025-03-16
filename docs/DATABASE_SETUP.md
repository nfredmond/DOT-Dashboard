# Database Setup Guide

This guide provides instructions for setting up the database for the Planning Manager application.

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database URL (replace with your own PostgreSQL connection string)
DATABASE_URL="postgresql://username:password@localhost:5432/planning_manager?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI for AI Analysis
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Generate Prisma Client

Generate the Prisma client based on the schema:

```bash
npx prisma generate
```

### 4. Create and Apply Migrations

Push the database schema to your PostgreSQL instance:

```bash
# Apply migrations
npx prisma migrate dev --name init

# Or use db push for a development environment
npx prisma db push
```

### 5. Seed the Database (Optional)

To seed the database with initial data, run:

```bash
npx prisma db seed
```

## Database Schema

The main entities in the database are:

- **User**: Application users with authentication information
- **Project**: Transportation projects with details and metadata
- **ProjectScenario**: Alternative scenarios for projects
- **ScenarioComparison**: Comparisons between different scenarios

## Relationship Diagram

```
┌─────────┐         ┌─────────┐        ┌────────────────┐
│         │         │         │        │                │
│  User   ├─────────┤ Project ├────────┤ ProjectScenario│
│         │         │         │        │                │
└─────────┘         └────┬────┘        └────┬───────────┘
                         │                   │
                         │                   │
                         ▼                   ▼
                    ┌─────────────────────────┐
                    │                         │
                    │   ScenarioComparison    │
                    │                         │
                    └─────────────────────────┘
```

## Working with the Database

### Prisma Studio

Prisma Studio provides a visual interface to view and edit your data:

```bash
npx prisma studio
```

### Migrations

When you make changes to your schema, create a new migration:

```bash
npx prisma migrate dev --name descriptive_name
```

### Resetting the Database (Development Only)

To reset your development database:

```bash
npx prisma migrate reset
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure your PostgreSQL server is running and the connection string is correct.

2. **Migration Errors**: If migrations fail, try running:
   ```bash
   npx prisma migrate resolve --applied your_migration_name
   ```

3. **Prisma Client Generation**: If you encounter errors with the Prisma client, try:
   ```bash
   npx prisma generate --watch
   ```

4. **Schema Changes**: After making changes to the schema, always run:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

For more detailed information, see the [Prisma documentation](https://www.prisma.io/docs/). 