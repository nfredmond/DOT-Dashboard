# Planning Manager

A comprehensive transportation project management system built with Next.js, React, and Supabase.

## Overview

Planning Manager is a sophisticated web application designed for transportation agencies to manage, score, prioritize, and visualize infrastructure projects. It combines modern web technologies with advanced GIS capabilities and AI integration to provide a complete solution for transportation project planning and management.

The application is now available at [https://planningmanager.ai](https://planningmanager.ai).

![Planning Manager](public/Circle_Green_TranspRoad.png)

## Features

### 🚗 Project Management

- Create, edit, and manage transportation projects
- Track project status, budget, and timeline
- Batch operations for efficient management
- Customizable project metadata and categorization
- **Real-time project synchronization** between management and mapping systems
- **Event-driven integration** for consistent project visualization
- **Multi-step project wizard** with quick-add form for rapid project creation
- **Offline-capable project storage** with seamless synchronization

### 🗺️ GIS Mapping

- Interactive maps powered by Leaflet
- Multiple basemap layer options (OSM, Carto, Satellite)
- Project location visualization with custom styling
- Drawing and editing geographic features
- Marker clustering for dense datasets
- Measurement tools for distance and area calculation
- **Synchronized project visualization** with automatic updates
- **GeoJSON-compatible geometry** for standardized spatial data

### 📊 Project Scoring & Prioritization

- Customizable scoring criteria and categories
- Weighted scoring algorithms with auto-calculation
- Visual comparison tools and interactive charts
- AI-assisted scoring suggestions
- Multi-factor project evaluation framework

### 🤖 AI Integration

- Project analysis and enrichment using Claude and GPT models
- Automated scoring assistance and suggestions
- Report and documentation generation
- Community feedback analysis and categorization
- Contextual project assistant with document awareness
- **Agent capabilities** with computer access and web browsing using OpenAI Agents SDK
- Real-time streaming of agent reasoning and decision-making
- Specialized agents for analysis, file retrieval, and web research
- Agent handoffs for complex multi-stage tasks

### 👥 User Management

- Multi-tenant architecture with organization support
- Role-based access control (admin, member, viewer)
- Customizable user profiles and preferences
- Agency-specific settings and configurations
- Secure authentication via Supabase Auth
- Organization branding with custom logo uploads

### 🚀 User Experience

- Intuitive onboarding dialog for first-time users with step-by-step guidance
- Comprehensive empty state handling across all major features
- Contextual help and suggestions based on user progress
- Clear pathways to guide users from project creation to scoring
- Seamless transition between demo mode and production usage

### 📈 Reporting

- Custom report generation with templates
- Interactive data visualizations and charts
- Multiple export formats (PDF, CSV, JSON)
- AI-assisted report writing and summarization
- Analytics dashboard with key performance indicators

### 📝 Scenario Development

- Generate and compare alternative project scenarios with AI assistance
- Create variations based on cost, timeline, design, funding sources, or phasing
- Compare scenarios side-by-side with AI-powered analysis
- Refine scenarios based on stakeholder feedback
- Make data-driven decisions with comparative metrics

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **State Management**: React Context, SWR for data fetching
- **Backend**: Supabase, PostgreSQL with PostGIS extension
- **Authentication**: Supabase Auth with row-level security
- **Database**: PostgreSQL with spatial capabilities
- **GIS**: Leaflet.js, React-Leaflet, various Leaflet plugins
- **AI**: OpenAI GPT-4, Anthropic Claude, model-agnostic integration, OpenAI Agents SDK
- **Charts**: Recharts, D3.js for visualizations
- **Styling**: Tailwind CSS with custom configurations

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key (for AI features and Agents SDK)
- Anthropic API key (optional, for Claude models)

### Database Options

Planning Manager v6 supports two database options:

1. **Supabase Database (Default)**: A fully-featured PostgreSQL database hosted on Supabase with PostGIS support for geospatial data. This option requires a Supabase account and provides real-time synchronization, multi-user collaboration, and advanced querying capabilities. The v6 schema includes:
   - Enhanced project management tables with environmental documentation fields
   - Comprehensive funding source and milestone tracking
   - MCP and Agents SDK integration tables
   - Offline synchronization capabilities
   - Complete Row-Level Security (RLS) policies

2. **Offline Database**: A local IndexedDB-based database that operates entirely within the browser. This option is ideal for:
   - Agencies with strict data sovereignty requirements
   - Deployment scenarios with limited internet connectivity
   - Field workers who need to operate in offline environments
   - Organizations that prefer to maintain data locally

The offline database provides core functionality without requiring an external database service. It includes synchronization mechanisms for transferring data between online and offline modes when needed.

See [OFFLINE_DATABASE.md](OFFLINE_DATABASE.md) for complete documentation on the offline database option.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/planning-manager.git
cd planning-manager
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Supabase configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# To use offline database, set this to true
OFFLINE_DATABASE_ENABLED=false

# AI services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Initialize the database:

For Supabase (Default):
- Follow the instructions in `supabase_schema.sql` 
- Run the SQL setup scripts in your Supabase SQL editor
- This comprehensive script sets up the complete database schema including:
  - Project management tables
  - AI models and integration
  - MCP servers configuration
  - Agent settings
  - Offline synchronization support

For Offline Database:
- Set `OFFLINE_DATABASE_ENABLED=true` in your .env.local file
- The application will automatically set up the offline database when launched
- Configure offline database settings in the admin panel under "Database Settings"

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
planning-manager/
├── src/
│   ├── app/                 # Next.js app router pages and routes
│   │   ├── api/             # API route handlers
│   │   ├── projects/        # Project management pages
│   │   ├── project-map/     # GIS mapping interface
│   │   ├── project-mapping-wrapper/ # Map integration components
│   │   ├── project-scoring/ # Scoring and prioritization
│   │   ├── llm-assistant/   # AI assistant interface
│   │   └── agent-tools/     # OpenAI Agents interface
│   ├── components/          # Reusable React components
│   ├── contexts/            # React context providers
│   │   └── ProjectsContext.tsx # Central project management context
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and services
│   │   ├── api/             # API client functions
│   │   ├── db/              # Database helpers
│   │   ├── llm/             # AI/LLM integration
│   │   ├── agents-service.ts # OpenAI Agents integration
│   │   └── map/             # Map utilities
│   ├── styles/              # Global styles and Tailwind config
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── docs/                    # Documentation
│   └── PROJECT_MANAGEMENT_INTEGRATION.md # Project integration documentation
└── project_templates/       # Project templates and examples
```

## Documentation

Comprehensive documentation is available in the `docs` directory:

### Core Documentation

- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) - System design and component interactions
- [Database Schema](docs/DATABASE_SCHEMA.md) - Database structure and relationships
- [API Documentation](docs/API.md) - API endpoints and usage
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment process and configuration
- [User Manual](/public/docs/user-manual.md) - Comprehensive guide for end users

### Feature Documentation

- [GIS Features](docs/GIS_FEATURES.md) - Geographic Information System capabilities
- [LLM Integration](docs/LLM_INTEGRATION.md) - AI/LLM integration details
- [Agents Integration](docs/AGENTS_INTEGRATION.md) - OpenAI Agents SDK integration
- [MCP Agents Integration](docs/MCP_AGENTS_INTEGRATION.md) - Model Context Protocol integration
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - Detailed technical implementation
- [Project Management Integration](docs/PROJECT_MANAGEMENT_INTEGRATION.md) - Project management and map synchronization

### Development & Operations

- [Development Plan](docs/DEVELOPMENT_PLAN.md) - Project roadmap and development phases
- [Testing Strategy](docs/TESTING_STRATEGY.md) - Testing approach and methodologies
- [Security Documentation](docs/SECURITY.md) - Security measures and best practices

## Current Status & Roadmap

The Planning Manager is currently in active development, with the following status:

### Phase 1: Core Infrastructure (Completed)

- Database integration with PostgreSQL and PostGIS
- Core project management interface
- Authentication and user management system
- Basic GIS implementation with Leaflet

### Phase 2: Advanced Features (Completed)

- Enhanced GIS capabilities with drawing tools and data visualization
- Project scoring and prioritization system
- AI/LLM integration with OpenAI and Anthropic
- Community engagement tools
- OpenAI Agents SDK integration with computer and web browsing capabilities
- Project management integration with real-time synchronization

### Phase 3: Integration & Expansion (Current)

- External API integrations with transportation data sources
- Advanced reporting capabilities with templates
- Mobile optimization for field use
- Enhanced offline functionality for remote usage
- Improved agent tools for analyzing transportation impact data

### Upcoming Phases

- Performance optimization for large datasets
- Accessibility improvements (WCAG compliance)
- Advanced analytics and custom dashboards
- Workflow automation and templates
- Multi-language support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Leaflet](https://leafletjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI](https://openai.com/)
- [OpenAI Agents SDK](https://platform.openai.com/docs/agents)
- [Anthropic](https://www.anthropic.com/)
- [Green DOT Transportation Solutions](https://greendottransportation.com)
