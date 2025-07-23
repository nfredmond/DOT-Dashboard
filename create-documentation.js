const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Create a new workbook
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('File Documentation');

// Add headers
worksheet.columns = [
  { header: 'File/Directory', key: 'path', width: 40 },
  { header: 'Type', key: 'type', width: 15 },
  { header: 'Description', key: 'description', width: 60 },
  { header: 'Relationships', key: 'relationships', width: 60 }
];

// Define the structure information
const fileInfo = [
  // Root directories and key files
  { path: 'src/app', type: 'Directory', description: 'Main application directory using Next.js App Router, contains all routes and pages', relationships: 'Contains route definitions and page components' },
  { path: 'src/components', type: 'Directory', description: 'Reusable UI components used throughout the application', relationships: 'Used by app pages and other components' },
  { path: 'src/lib', type: 'Directory', description: 'Core utilities, services, and business logic', relationships: 'Provides services to components and pages' },
  { path: 'src/contexts', type: 'Directory', description: 'React contexts for state management', relationships: 'Provides state to components and pages' },
  { path: 'src/hooks', type: 'Directory', description: 'Custom React hooks for reusable logic', relationships: 'Used by components and pages' },
  { path: 'src/types', type: 'Directory', description: 'TypeScript type definitions and interfaces', relationships: 'Used throughout the codebase for type safety' },
  { path: 'src/utils', type: 'Directory', description: 'Helper functions and utility modules', relationships: 'Used by components, contexts, and services' },
  { path: 'src/styles', type: 'Directory', description: 'CSS and style-related files', relationships: 'Applied to components and pages' },
  
  // Key files in the app directory
  { path: 'src/app/layout.tsx', type: 'File', description: 'Root layout component that wraps all pages', relationships: 'Parent component for all routes' },
  { path: 'src/app/page.tsx', type: 'File', description: 'Homepage component', relationships: 'Entry point for the application' },
  
  // Components directory
  { path: 'src/components/AppLayout.tsx', type: 'File', description: 'Main application layout component', relationships: 'Used by multiple pages for consistent layout' },
  { path: 'src/components/ProtectedRoute.tsx', type: 'File', description: 'Component for route protection and authentication', relationships: 'Works with AuthContext to secure routes' },
  { path: 'src/components/maps', type: 'Directory', description: 'Map-related components', relationships: 'Used by map pages and features' },
  { path: 'src/components/ui', type: 'Directory', description: 'Basic UI components like buttons, cards, etc.', relationships: 'Used throughout the application' },
  { path: 'src/components/scenario-results.tsx', type: 'File', description: 'Component for displaying scenario analysis results', relationships: 'Used in scenario pages' },
  { path: 'src/components/scenario-map-view.tsx', type: 'File', description: 'Map view for scenario visualization', relationships: 'Uses Mapbox integration' },
  { path: 'src/components/scenario-insights.tsx', type: 'File', description: 'Component for displaying scenario insights and analytics', relationships: 'Uses data from scenario services' },
  { path: 'src/components/SimulationParametersForm.tsx', type: 'File', description: 'Form for configuring simulation parameters', relationships: 'Used in modeling and simulation features' },
  { path: 'src/components/MapboxScripts.tsx', type: 'File', description: 'Component that loads Mapbox scripts', relationships: 'Used by map components' },
  { path: 'src/components/ActivitySpatialVisualization.tsx', type: 'File', description: 'Component for visualizing spatial activity data', relationships: 'Uses map services and visualization libraries' },
  
  // Lib directory
  { path: 'src/lib/supabase', type: 'Directory', description: 'Supabase database integration services', relationships: 'Provides database access throughout the app' },
  { path: 'src/lib/models', type: 'Directory', description: 'Data models and schemas', relationships: 'Used by services and components' },
  { path: 'src/lib/map-utils.ts', type: 'File', description: 'Utility functions for map operations', relationships: 'Used by map components and services' },
  { path: 'src/lib/map-service.ts', type: 'File', description: 'Service for map data and operations', relationships: 'Used by map components' },
  { path: 'src/lib/map-config-service.ts', type: 'File', description: 'Service for map configuration', relationships: 'Configures maps used across the application' },
  { path: 'src/lib/benefit-cost-service.ts', type: 'File', description: 'Service for benefit-cost analysis', relationships: 'Used by project evaluation components' },
  { path: 'src/lib/ai-service.ts', type: 'File', description: 'AI integration service', relationships: 'Used by AI-related features and components' },
  { path: 'src/lib/llm-service.ts', type: 'File', description: 'Large language model integration service', relationships: 'Used by AI and natural language features' },
  { path: 'src/lib/predictive-maintenance.ts', type: 'File', description: 'Service for predictive maintenance algorithms', relationships: 'Used by maintenance planning features' },
  { path: 'src/lib/report-service.ts', type: 'File', description: 'Service for generating reports', relationships: 'Used by reporting components and pages' },
  { path: 'src/lib/utils.ts', type: 'File', description: 'General utility functions', relationships: 'Used throughout the application' },
  { path: 'src/lib/voice-service.ts', type: 'File', description: 'Service for voice recognition and processing', relationships: 'Used by voice input components' },
  { path: 'src/lib/project-service.ts', type: 'File', description: 'Service for project management operations', relationships: 'Used by project-related components and pages' },
  { path: 'src/lib/scoring-service.ts', type: 'File', description: 'Service for project scoring and evaluation', relationships: 'Used by project scoring components' },
  
  // Contexts
  { path: 'src/contexts/AuthContext.tsx', type: 'File', description: 'Context for authentication state and operations', relationships: 'Used throughout the app for auth-related features' },
  { path: 'src/contexts/mapbox-context.tsx', type: 'File', description: 'Context for Mapbox state and configuration', relationships: 'Used by map components' },
  { path: 'src/contexts/ProjectsContext.tsx', type: 'File', description: 'Context for project data and operations', relationships: 'Used by project-related components' },
  { path: 'src/contexts/SupabaseContext.tsx', type: 'File', description: 'Context for Supabase database access', relationships: 'Used by components that need database access' },
  { path: 'src/contexts/VoiceContext.tsx', type: 'File', description: 'Context for voice recognition and processing', relationships: 'Used by voice-related features' },
  { path: 'src/contexts/LLMContext.tsx', type: 'File', description: 'Context for language model integration', relationships: 'Used by AI-assistant features' },
  { path: 'src/contexts/ProjectWizardContext.tsx', type: 'File', description: 'Context for project creation wizard', relationships: 'Used by project creation flow' },
  
  // Types
  { path: 'src/types/project.ts', type: 'File', description: 'Type definitions for projects', relationships: 'Used by project-related components and services' },
  { path: 'src/types/database.types.ts', type: 'File', description: 'Database schema types', relationships: 'Used by database services and components' },
  { path: 'src/types/camp.ts', type: 'File', description: 'Types for CAMP (Context-Aware Mobility Planning) module', relationships: 'Used by CAMP-related components and services' },
  { path: 'src/types/benefit-cost.ts', type: 'File', description: 'Types for benefit-cost analysis', relationships: 'Used by benefit-cost services and components' },
  { path: 'src/types/trend-navigator.ts', type: 'File', description: 'Types for trend navigation and analysis', relationships: 'Used by trend visualization components' },
  
  // Key API routes
  { path: 'src/app/api/projects', type: 'Directory', description: 'API routes for project management', relationships: 'Used by project components and services' },
  { path: 'src/app/api/scenarios', type: 'Directory', description: 'API routes for scenario management', relationships: 'Used by scenario components' },
  { path: 'src/app/api/network-analysis', type: 'Directory', description: 'API routes for network analysis operations', relationships: 'Used by mapping and analysis features' },
  { path: 'src/app/api/screen-share', type: 'Directory', description: 'API routes for screen sharing functionality', relationships: 'Used by screen sharing components' },
  
  // Main app routes
  { path: 'src/app/projects', type: 'Directory', description: 'Project management pages', relationships: 'Uses project services and components' },
  { path: 'src/app/scenarios', type: 'Directory', description: 'Scenario management pages', relationships: 'Uses scenario services and components' },
  { path: 'src/app/modeling', type: 'Directory', description: 'Modeling and simulation pages', relationships: 'Uses modeling services and components' },
  { path: 'src/app/reports', type: 'Directory', description: 'Report generation and viewing pages', relationships: 'Uses report services' },
  { path: 'src/app/maintenance', type: 'Directory', description: 'Maintenance planning pages', relationships: 'Uses maintenance services' },
  { path: 'src/app/community', type: 'Directory', description: 'Community engagement pages', relationships: 'Uses community input services' },
  { path: 'src/app/admin', type: 'Directory', description: 'Administrative pages', relationships: 'Uses admin services and components' },
  
  // Config files
  { path: 'package.json', type: 'File', description: 'NPM package configuration, lists dependencies and scripts', relationships: 'Defines project dependencies and build scripts' },
  { path: 'next.config.js', type: 'File', description: 'Next.js configuration file', relationships: 'Configures the Next.js framework' },
  { path: 'tsconfig.json', type: 'File', description: 'TypeScript configuration', relationships: 'Configures TypeScript compiler options' },
  { path: 'tailwind.config.ts', type: 'File', description: 'Tailwind CSS configuration', relationships: 'Configures the styling framework' },
  { path: '.env.local', type: 'File', description: 'Environment variables for local development', relationships: 'Referenced by service configurations' },
  
  // Documentation
  { path: 'README.md', type: 'File', description: 'Main project documentation', relationships: 'Provides overview of the entire project' },
  { path: 'SYSTEM_ARCHITECTURE.md', type: 'File', description: 'System architecture documentation', relationships: 'Explains how components fit together' },
  { path: 'SUPABASE_SETUP.md', type: 'File', description: 'Supabase setup instructions', relationships: 'Referenced during database setup' },
  { path: 'MAPBOX_INTEGRATION.md', type: 'File', description: 'Mapbox integration guide', relationships: 'Referenced when working with map features' }
];

// Add rows to the worksheet
fileInfo.forEach(item => {
  worksheet.addRow(item);
});

// Style the header row
worksheet.getRow(1).font = { bold: true };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F81BD' }
};
worksheet.getRow(1).font = {
  color: { argb: 'FFFFFFFF' },
  bold: true
};

// Add a second worksheet for module relationships
const relationshipsSheet = workbook.addWorksheet('Module Relationships');
relationshipsSheet.columns = [
  { header: 'Module', key: 'module', width: 20 },
  { header: 'Depends On', key: 'dependsOn', width: 30 },
  { header: 'Used By', key: 'usedBy', width: 30 },
  { header: 'Purpose', key: 'purpose', width: 50 }
];

// Define high-level module relationships
const moduleRelationships = [
  { 
    module: 'UI Components', 
    dependsOn: 'Contexts, Hooks, Services', 
    usedBy: 'Pages, Other Components', 
    purpose: 'Provide reusable UI elements and complex interactive components' 
  },
  { 
    module: 'Services', 
    dependsOn: 'Utilities, External APIs, Database', 
    usedBy: 'Components, Pages, API Routes', 
    purpose: 'Implement business logic and data access operations' 
  },
  { 
    module: 'Contexts', 
    dependsOn: 'Services, Utilities', 
    usedBy: 'Components, Pages, Other Contexts', 
    purpose: 'Manage state and provide data to the component tree' 
  },
  { 
    module: 'Hooks', 
    dependsOn: 'Services, Contexts, Utilities', 
    usedBy: 'Components, Pages', 
    purpose: 'Abstract and reuse stateful logic' 
  },
  { 
    module: 'Pages', 
    dependsOn: 'Components, Contexts, Hooks, Services', 
    usedBy: 'Users', 
    purpose: 'Provide route endpoints and orchestrate components' 
  },
  { 
    module: 'API Routes', 
    dependsOn: 'Services, Utilities, Database', 
    usedBy: 'Components, External Services', 
    purpose: 'Provide server-side endpoints for data operations' 
  },
  { 
    module: 'Map Components', 
    dependsOn: 'Mapbox, Map Services, GeoJSON', 
    usedBy: 'Pages, Map Features', 
    purpose: 'Visualize geographical data and enable spatial interactions' 
  },
  { 
    module: 'Project Management', 
    dependsOn: 'Project Services, Database', 
    usedBy: 'Users, Reporting', 
    purpose: 'Handle CRUD operations for transportation projects' 
  },
  { 
    module: 'Scenario Analysis', 
    dependsOn: 'Modeling Services, Project Data', 
    usedBy: 'Planning Features, Reports', 
    purpose: 'Create and analyze what-if scenarios for transportation planning' 
  },
  { 
    module: 'Authentication', 
    dependsOn: 'Auth Services, Database', 
    usedBy: 'All Secure Features', 
    purpose: 'Manage user sessions and authorization' 
  },
  { 
    module: 'AI Integration', 
    dependsOn: 'OpenAI/Anthropic, LLM Services', 
    usedBy: 'Voice Interface, Assistance Features', 
    purpose: 'Provide intelligent features and natural language processing' 
  }
];

// Add module relationships to worksheet
moduleRelationships.forEach(item => {
  relationshipsSheet.addRow(item);
});

// Style the header row of relationships sheet
relationshipsSheet.getRow(1).font = { bold: true };
relationshipsSheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F81BD' }
};
relationshipsSheet.getRow(1).font = {
  color: { argb: 'FFFFFFFF' },
  bold: true
};

// Add a third worksheet for a technical overview
const overviewSheet = workbook.addWorksheet('Technical Overview');
overviewSheet.columns = [
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Technology', key: 'technology', width: 30 },
  { header: 'Description', key: 'description', width: 70 }
];

// Define technology stack information
const techStack = [
  { 
    category: 'Frontend Framework', 
    technology: 'Next.js', 
    description: 'React framework with server-side rendering capabilities and app router architecture' 
  },
  { 
    category: 'Language', 
    technology: 'TypeScript', 
    description: 'Strongly typed programming language that builds on JavaScript' 
  },
  { 
    category: 'Styling', 
    technology: 'Tailwind CSS', 
    description: 'Utility-first CSS framework for rapid UI development' 
  },
  { 
    category: 'UI Components', 
    technology: 'Custom + Radix UI', 
    description: 'Mix of custom components and Radix UI primitives' 
  },
  { 
    category: 'State Management', 
    technology: 'React Context', 
    description: 'Context API for sharing state between components' 
  },
  { 
    category: 'Database', 
    technology: 'Supabase', 
    description: 'Open source Firebase alternative with PostgreSQL database' 
  },
  { 
    category: 'Mapping', 
    technology: 'Mapbox GL JS', 
    description: 'JavaScript library for interactive, customizable maps' 
  },
  { 
    category: 'Mapping (Legacy)', 
    technology: 'Leaflet', 
    description: 'Open-source JavaScript library for mobile-friendly interactive maps' 
  },
  { 
    category: 'AI Integration', 
    technology: 'OpenAI API, Anthropic API', 
    description: 'Large language model APIs for natural language processing and generation' 
  },
  { 
    category: 'Form Handling', 
    technology: 'React Hook Form', 
    description: 'Performant, flexible and extensible forms with easy validation' 
  },
  { 
    category: 'Data Visualization', 
    technology: 'Recharts, Chart.js', 
    description: 'Libraries for creating interactive charts and graphs' 
  },
  { 
    category: 'Authentication', 
    technology: 'Custom Auth + Supabase Auth', 
    description: 'Authentication system using Supabase and custom implementations' 
  },
  { 
    category: 'Deployment', 
    technology: 'Custom Server', 
    description: 'Custom deployment on dedicated infrastructure' 
  },
  { 
    category: 'API Strategy', 
    technology: 'Next.js API Routes + External APIs', 
    description: 'Combination of internal API routes and external API integrations' 
  }
];

// Add tech stack to worksheet
techStack.forEach(item => {
  overviewSheet.addRow(item);
});

// Style the header row of tech stack sheet
overviewSheet.getRow(1).font = { bold: true };
overviewSheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F81BD' }
};
overviewSheet.getRow(1).font = {
  color: { argb: 'FFFFFFFF' },
  bold: true
};

// Save the workbook
workbook.xlsx.writeFile(path.join(__dirname, 'project-documentation.xlsx'))
  .then(() => {
    console.log('Excel file created successfully!');
  })
  .catch(err => {
    console.error('Error creating Excel file:', err);
  });