# Planning Manager

A comprehensive transportation project management system built with Next.js, React, and Supabase.

## Overview

Planning Manager is a sophisticated web application designed for transportation agencies to manage, score, prioritize, and visualize infrastructure projects. It combines modern web technologies with advanced GIS capabilities and AI integration to provide a complete solution for transportation project planning and management.

![Planning Manager](public/Circle_Green_TranspRoad.png)

## Features

### 🚗 Project Management

- Create, edit, and manage transportation projects
- Track project status, budget, and timeline
- Batch operations for efficient management
- Customizable project metadata and categorization

### 🗺️ GIS Mapping

- Interactive maps powered by Leaflet
- Multiple basemap layer options (OSM, Carto, Satellite)
- Project location visualization with custom styling
- Drawing and editing geographic features
- Marker clustering for dense datasets
- Measurement tools for distance and area calculation

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Initialize the database:

- Follow the instructions in `SUPABASE_SETUP_SQL.md`
- Run the SQL setup scripts in your Supabase SQL editor

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
│   │   ├── project-scoring/ # Scoring and prioritization
│   │   ├── llm-assistant/   # AI assistant interface
│   │   └── agent-tools/     # OpenAI Agents interface
│   ├── components/          # Reusable React components
│   ├── contexts/            # React context providers
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
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - Detailed technical implementation

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

### Phase 2: Advanced Features (Current)

- Enhanced GIS capabilities with drawing tools and data visualization
- Project scoring and prioritization system
- AI/LLM integration with OpenAI and Anthropic
- Community engagement tools
- OpenAI Agents SDK integration with computer and web browsing capabilities

### Upcoming Phases

1. **Integration & Expansion** (2-3 weeks)
   - External API integrations
   - Advanced reporting capabilities
   - Mobile optimization

2. **Performance & Polish** (2 weeks)
   - Performance optimization
   - UI/UX refinements
   - Accessibility improvements

3. **Extended Features** (Ongoing)
   - Advanced analytics
   - Customizable workflows
   - Additional AI capabilities
   - Enhanced agent tools and domain-specific agents

For detailed information about the development plan and timeline, see our [Development Plan](docs/DEVELOPMENT_PLAN.md).

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

# Planning Manager v5

A comprehensive tool for planning, analyzing, and managing transportation projects with integrated AI capabilities.

## Features

- **Project Management**: Create, track, and manage transportation projects
- **Interactive Mapping**: Visualize projects on a map with GeoJSON support
- **Project Scoring**: Score and prioritize projects with customizable criteria
- **Scenario Development**: Generate and compare alternative project scenarios with AI assistance
- **AI-Powered Analysis**: Analyze project impacts using AI and structured prompts
- **Document Management**: Upload and organize project-related documents
- **Multi-user Collaboration**: Team collaboration with role-based permissions
- **Reporting**: Generate reports on project status, scoring, and prioritization
- **Analytics Dashboard**: Visualize key metrics and project distribution
- **Model Context Protocol**: Integration with flexible AI providers

## AI Integration

The application integrates Model Context Protocol (MCP) and OpenAI Agents SDK to provide intelligent analysis capabilities:

- **Project Analysis**: Analyze projects across various dimensions including environmental impact, equity, safety, and economic factors
- **Scenario Development**: Generate and compare alternative project scenarios
- **Demographic Analysis**: Analyze census data for equity considerations
- **Safety Analysis**: Analyze collision data to identify safety improvement opportunities

### Model Context Protocol Integration

The application supports using multiple LLM providers through the Model Context Protocol (MCP). This allows:

- Seamless switching between LLM providers
- Using specialized models for different analysis types
- Fallback to OpenAI when MCP is unavailable
- Enhanced capabilities with MCP-compatible servers

See [MCP_AGENTS_INTEGRATION.md](docs/MCP_AGENTS_INTEGRATION.md) for detailed documentation.

### Project Scenario Development

The Planning Manager includes a powerful scenario development tool that enables planners to:

- Generate multiple alternative scenarios for any project
- Create variations based on cost, timeline, design, funding sources, or phasing 
- Compare scenarios side-by-side with AI-powered analysis
- Refine scenarios based on stakeholder feedback
- Make data-driven decisions with comparative metrics

This feature leverages the PLANNING agent type and can work with any MCP-compatible provider or OpenAI.

See [SCENARIO_DEVELOPMENT.md](docs/SCENARIO_DEVELOPMENT.md) for complete documentation.

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure environment variables
4. Run the development server with `npm run dev`

## Environment Variables

```
DATABASE_URL=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_BASE_URL=
OPENAI_API_KEY=
```

## Documentation

- [MCP and Agents SDK Integration](docs/MCP_AGENTS_INTEGRATION.md)
- [Scenario Development](docs/SCENARIO_DEVELOPMENT.md)
- [Project Analysis](docs/PROJECT_ANALYSIS.md)
- [API Documentation](docs/API.md)

## License

MIT

# RTPA Portal

A comprehensive transportation planning application with advanced AI capabilities, voice integration, and real-time collaboration features.

## Features

### AI Model Integration

The application integrates with multiple AI models, providing a flexible and powerful foundation for various tasks:

- **Model Selection System**: Choose from various AI models based on your needs, with Claude 3.7 Sonnet Thinking as the default.
- **Task-Specific Model Selection**: The system automatically selects the most appropriate model based on task requirements.
- **Custom Model Support**: Add your own custom models to the system.
- **Model Capabilities**: Models are tagged with capabilities like thinking, vision, research, and code generation.

Supported models include:
1. Claude 3.7 Sonnet Thinking (default)
2. Claude 3.7 Sonnet
3. OpenAI o3-mini-thinking
4. OpenAI o3-mini
5. OpenAI o1-pro (research-focused)
6. Meta Llama 3
7. Google GEMMA 3
8. DeepSeek R1
9. xAI Grok 3
10. xAI Grok 3 Thinking

### Voice Integration

Interact with the application using natural language:

- **Speech-to-Text**: Uses OpenAI's Whisper for accurate transcription.
- **Text-to-Speech**: Supports OpenAI's TTS (default) and Sesame CSM.
- **Voice Commands**: Execute actions through voice commands.
- **Voice Agent**: A complete voice interface component for easy integration.
- **Multi-modal Interaction**: Combine voice with traditional UI interactions.

### Agent System

The application uses an agent-based architecture to process complex tasks:

- **Model Context Protocol (MCP)**: Provides context-aware processing of queries.
- **Agent SDK**: Extensible framework for building intelligent agents.
- **Voice Agent Service**: Bridges voice input with the agent ecosystem.

### Project Planning Tools

- Project creation and management
- Task assignment and tracking
- Document management
- Real-time collaboration
- Scoring and evaluation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Access to OpenAI and/or Anthropic API keys (for AI features)

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
   yarn
   ```

3. Configure environment variables:
   ```
   # Create a .env.local file with the following variables
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Configuration

### AI Models

Configure AI models in the Settings page or modify the default settings in:
- `src/lib/models/model-types.ts`

### Voice Settings

Voice settings can be configured in:
- `src/lib/voice-service.ts`

## Architecture

The application is built with:

- **Next.js**: React framework for the frontend
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Supabase**: Backend and authentication
- **AI Models**: Integration with various AI providers

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
