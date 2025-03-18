# Planning Manager Spatial Visualization System

This project implements an interactive spatial visualization system for transportation planning, project management, and travel demand modeling. It provides comprehensive tools for managing transportation projects, analyzing benefits and costs, developing scenarios, and visualizing spatial data using the GreenChAMP (Green DOT Chained Activity Modelling Process) framework and TrendNavigator scenario planning tools.

## Core Features

- **Project Management:** Complete transportation project management system with customizable workflows
- **Spatial Visualization:** Interactive maps for projects, community feedback, and transportation network analysis
- **Benefit-Cost Analysis:** Comprehensive economic analysis with advanced uncertainty modeling
- **GreenChAMP Integration:** Advanced travel demand modeling using the Green DOT Chained Activity Modelling Process
- **TrendNavigator:** Scenario planning tools for modeling future trends and policy impacts
- **Public Engagement:** Community feedback collection and analysis tools
- **AI-Powered Analysis:** LLM integration for project assessment and data analysis

## Detailed Features

### Project Management
- Project creation and tracking with customizable statuses and workflows
- Milestone and timeline management
- Document management and version control
- Team collaboration tools
- Custom fields and taxonomies
- Advanced filtering and reporting

### Spatial Visualization
- Interactive map visualization using Mapbox GL
- Multiple visualization types (heatmaps, flow lines, points)
- Advanced filtering capabilities by type, time, and attributes
- Animation system for temporal data
- Real-time statistics updates
- Export capabilities (CSV, GeoJSON)

### Benefit-Cost Analysis
- Comprehensive economic analysis framework
- Configurable monetization parameters for various benefit and cost categories
- Temporal distribution of benefits and costs
- Calculation of Net Present Value (NPV), Benefit-Cost Ratio (BCR), and Internal Rate of Return (IRR)
- Sensitivity analysis for key parameters
- Monte Carlo simulation with customizable probability distributions
- Comparison of multiple analyses
- Template system for consistent analyses
- Detailed visualization of results with interactive charts
- Export capabilities for reports and presentations

### GreenChAMP Integration
- Activity-based travel demand modeling
- Chained activity simulation for realistic travel patterns
- Environmental impact assessment (emissions, energy use)
- Equity analysis capabilities
- Accessibility metrics calculation
- Multi-modal transportation system modeling
- Land use and transportation interaction

### TrendNavigator
- Future scenario development based on GreenChAMP models
- Technology adoption modeling (telecommuting, e-commerce, shared mobility, vehicle automation)
- Transit service and land use pattern scenarios
- Multiple time horizon options (5, 10, 30 years)
- Side-by-side comparison of scenarios
- Comprehensive metrics (VMT, emissions, mode share, congestion, transit ridership, accessibility)
- AI-assisted trend analysis and recommendations

### Public Engagement
- Community feedback collection with spatial reference
- Feedback categorization and sentiment analysis
- Heat maps of community input
- Integration with project planning and prioritization
- AI-powered analysis of community needs

### AI-Powered Analysis
- LLM integration for project assessment
- Grant criteria evaluation
- Document analysis and summarization
- Data interpretation and insights
- Natural language interfaces for complex queries

## Technical Implementation

The system consists of:

1. **React Components:**
   - Project management interfaces
   - Spatial visualization components
   - Analysis and modeling tools
   - User management and administration
   
2. **API Endpoints:**
   - Project and data management
   - Authentication and authorization
   - Modeling and simulation
   - Data visualization and export
   
3. **Services:**
   - Project management services
   - Benefit-cost analysis engine
   - GreenChAMP modeling framework
   - TrendNavigator scenario planning
   - AI integration services

4. **Database:**
   - PostgreSQL with PostGIS for spatial data
   - Supabase for authentication and real-time capabilities
   - Row-level security for multi-tenant isolation

## Getting Started

1. Set up environment variables:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Usage

1. Log in to the system with your credentials
2. Navigate to the Projects section to manage transportation projects
3. Use the Benefit-Cost section to perform economic analyses
4. Explore the GreenChAMP and TrendNavigator sections for travel demand modeling and scenario planning
5. Use the Community Feedback tools to collect and analyze public input
6. Leverage the AI Assistant for advanced analysis and recommendations

## Documentation

For detailed documentation, see:

- [GreenChAMP Technical Implementation Guide](docs/GreenChAMP%20Integration%20Technical%20Implementation%20Guide.md)
- [TrendNavigator Integration Guide](docs/greenchamp_trendnavigator_integration_guide.md)
- [Benefit-Cost Analysis Guide](docs/Integrating_CB_Analyses.md)
- [System Architecture](SYSTEM_ARCHITECTURE.md)
- [Deployment Guide](deployment.md)

## Future Enhancements

- Enhanced 3D visualization
- Real-time collaborative editing
- Mobile application
- Advanced predictive analytics
- Enterprise SSO integration
- External API ecosystem
