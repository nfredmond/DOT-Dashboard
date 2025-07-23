# Quick Start Guide for Planning Manager v10

This guide will help you get Planning Manager v10 running on your local machine for development or evaluation.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/planning-manager-v10.git
cd planning-manager-v10
```

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and fill in the required values:

   **Minimum Required Configuration:**
   ```env
   # Database (choose one option)
   # Option 1: Use Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Option 2: Use offline database (no external database needed)
   OFFLINE_DATABASE_ENABLED=true
   
   # Mapping (required)
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
   
   # AI Services (at least one required)
   OPENAI_API_KEY=sk-your-openai-key
   # or
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   
   # Authentication
   AUTH_SECRET=your-32-character-secret
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Set Up the Database

### Option A: Using Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor in your Supabase dashboard
4. Run the following extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Copy and run the entire contents of `supabase_schema.sql`
6. Optionally, run `greenchamp_trendnavigator_schema.sql` for modeling features

### Option B: Using Offline Database

Simply set `OFFLINE_DATABASE_ENABLED=true` in your `.env.local` file. No additional setup required!

## Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3005](http://localhost:3005)

## Step 6: Log In

If using the demo database schema, you can log in with:
- **Email**: nathaniel@greendottransportation.com
- **Password**: Yuba530#

## Common Issues and Solutions

### TypeScript Type Generation Error

If you see an error about "Cannot read properties of undefined (reading 'spec')":

```bash
npm run fix-types
```

### Port Already in Use

If port 3005 is already in use, you can change it in `package.json`:
```json
"dev": "cross-env NODE_OPTIONS=\"--max_old_space_size=4096 --trace-warnings\" next dev -p YOUR_PORT_HERE"
```

### Missing API Keys

The application will start but some features won't work without proper API keys:
- Maps won't load without a valid Mapbox token
- AI features won't work without OpenAI or Anthropic keys
- Some data integrations require additional API keys

## Next Steps

1. **Explore the Application**: Navigate through the different sections to understand the features
2. **Read the Documentation**: See [README-COMPREHENSIVE.md](README-COMPREHENSIVE.md) for detailed information
3. **Configure Your Organization**: Set up your agency in the admin panel
4. **Add Projects**: Start adding transportation projects to test the system
5. **Test Features**: Try the mapping, scoring, and AI features

## Getting Help

- Check the [troubleshooting section](README.md#troubleshooting) in the main README
- Review the comprehensive documentation in [README-COMPREHENSIVE.md](README-COMPREHENSIVE.md)
- Contact support at support@planningmanager.ai

## Production Deployment

For production deployment instructions, see the [Deployment Guide](deployment.md) and the deployment section in [README-COMPREHENSIVE.md](README-COMPREHENSIVE.md). 