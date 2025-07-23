# Planning Manager Spatial Visualization System

This project implements an interactive spatial visualization system for transportation planning, project management, and travel demand modeling. It provides comprehensive tools for managing transportation projects, analyzing benefits and costs, developing scenarios, and visualizing spatial data using the GreenChAMP (Green DOT Chained Activity Modelling Process) framework and TrendNavigator scenario planning tools.

> **📋 For a comprehensive overview of the application's current status, features, and deployment requirements, please see [README-COMPREHENSIVE.md](README-COMPREHENSIVE.md)**

## 🆕 Recent Updates

### Mapbox GL JS Integration

We've migrated from Mapbox GL JS to Mapbox GL JS for all mapping functionality, bringing significant improvements:

- **WebGL-powered maps** with vector tiles for superior performance
- **3D visualization** capabilities for terrain, buildings, and extrusions
- **Enhanced community input system** with drawing tools and AI classification
- **Administrative controls** for map settings and community feedback moderation

For details, see the [Mapbox Integration Guide](MAPBOX_INTEGRATION.md).

## Core Features

- **Project Management:** Complete transportation project management system with customizable workflows
- **Spatial Visualization:** Interactive maps powered by Mapbox GL JS for projects, community feedback, and transportation network analysis
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
- High-performance WebGL-powered maps with Mapbox GL JS
- Vector tile support for efficient large data visualization
- Customizable visualization components including heatmaps, clustering, and choropleth maps
- 3D terrain and building visualization capabilities
- Advanced styling through data-driven expressions
- Drawing and editing tools for interactive data creation
- Animation system for temporal data
- Real-time statistics updates
- Export capabilities (CSV, GeoJSON)
- Community input and feedback collection with spatial reference
- Administrative tools for map configuration and moderation

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
- Feedback categorization and sentiment analysis using AI
- Heat maps of community input
- Integration with project planning and prioritization
- AI-powered analysis of community needs
- Moderation tools for administrators
- Custom feedback categories and organization-specific settings

### AI-Powered Analysis
- LLM integration for project assessment
- Grant criteria evaluation
- Document analysis and summarization
- Data interpretation and insights
- Natural language interfaces for complex queries
- Community input classification and categorization

## Technical Implementation

The system consists of:

1. **React Components:**
   - Project management interfaces
   - Mapbox GL JS-based spatial visualization components
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
   - Mapbox GL JS integration

4. **Database:**
   - PostgreSQL with PostGIS for spatial data
   - Supabase for authentication and real-time capabilities
   - Row-level security for multi-tenant isolation
   - GeoJSON storage for project and community input geometries

## Getting Started1. Set up environment variables:   - Copy `env.example` to `.env.local`   - Fill in your API keys and configuration values   - See [env.example](env.example) for complete list of required and optional variables2. Install dependencies:
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
3. Use the Project Map to visualize projects spatially
4. Explore the Community section to collect and view public feedback
5. Use the Benefit-Cost section to perform economic analyses
6. Explore the GreenChAMP and TrendNavigator sections for travel demand modeling and scenario planning
7. Leverage the AI Assistant for advanced analysis and recommendations
8. Access Admin settings to configure maps, community input, and other system parameters

## Documentation

For detailed documentation, see:

- [Mapbox Integration Guide](MAPBOX_INTEGRATION.md)
- [GreenChAMP Technical Implementation Guide](docs/GreenChAMP%20Integration%20Technical%20Implementation%20Guide.md)
- [TrendNavigator Integration Guide](docs/greenchamp_trendnavigator_integration_guide.md)
- [Benefit-Cost Analysis Guide](docs/Integrating_CB_Analyses.md)
- [System Architecture](SYSTEM_ARCHITECTURE.md)
- [Deployment Guide](deployment.md)

## Future Enhancements

- Enhanced 3D visualization with Mapbox GL JS terrain and building extrusions
- Real-time collaborative editing and commenting on maps
- Mobile applications optimized for field data collection
- Advanced predictive analytics
- Enterprise SSO integration
- External API ecosystem
- Augmented reality visualization for field work

## Troubleshooting

### Map Not Loading or Map Errors

If you encounter issues with maps not loading:

1. Verify that your Mapbox access token is valid and properly set in the environment variables
2. Check the browser console for specific error messages
3. Make sure WebGL is enabled in your browser and your graphics drivers are up to date
4. If you see "Cannot read properties of undefined" errors, it may indicate that the Mapbox GL JS library hasn't fully loaded before it's being used

### TypeScript Error: Cannot read properties of undefined (reading 'spec')

If you encounter this error when running `npm run dev` or `npm run build`:

```
Command failed: npm i --package-lock-only --prefix c:/Projects/planning-manager-v7/.next/types
npm error Cannot read properties of undefined (reading 'spec')
```

Run one of the following commands to fix the issue:

1. Use the npm script:
   ```
   npm run fix-types
   ```

2. Or run the PowerShell script:
   ```
   .\fix-nextjs-types.ps1
   ```

3. Or run the batch file:
   ```
   fix-nextjs-types.bat
   ```

This is a known issue with Next.js's TypeScript type generation. These scripts fix the problem by:
1. Removing the problematic .next/types directory
2. Creating a new .next/types directory with a valid package.json
3. Updating tsconfig.json to exclude the .next directory
