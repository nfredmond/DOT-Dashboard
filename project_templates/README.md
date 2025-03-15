# Planning Manager Project Templates
This directory contains template files for quickly bootstrapping new transportation project types with consistent structure and configuration. These templates provide a foundation for creating specialized components and interfaces in the Planning Manager transportation management system.
## Overview
The project templates are based on Next.js with the App Router architecture. They include:- Proper TypeScript configuration- Tailwind CSS setup with shadcn/ui components- ESLint and other code quality tools- Base project structure for transportation management interfaces
## How to Use Templates
To create a new specialized transportation project interface:
1. Copy the relevant files from this template directory
2. Update the component names and functionality to match your specific project type
3. Customize the UI and data structure for your specific transportation project needs
4. Integrate with the main application as needed
## Template Structure
```bash
project_templates/
├── src/                 # Source code directory
│   ├── app/             # Next.js app directory
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript type definitions
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── components.json      # shadcn/ui configuration
```
## Available Templates
The templates provide starting points for different transportation project types:
1. **Basic Transportation Project**   - Standard project configuration   - Core metadata fields   - Basic scoring interface
2. **Road/Highway Project**   - Specialized for road infrastructure   - Traffic volume metrics   - Safety scoring criteria
3. **Transit Project**   - Public transportation focused   - Ridership metrics   - Accessibility scoring
4. **Active Transportation**   - Bicycle and pedestrian projects   - Safety and connectivity metrics   - Health impact assessment
## Customization
These templates can be customized by:
1. Modifying the scoring criteria in the configuration files
2. Adding transportation mode-specific fields to the data models
3. Extending the UI components for specialized visualization needs
4. Integrating with GIS mapping components as needed
## Integration with Main Application
To integrate a new project type created from these templates:
1. Add the new project type to the project type selector in the main application
2. Update the project creation wizard to include the new fields
3. Add the appropriate scoring criteria to the scoring interface
4. Update any reporting interfaces to include the new project type
## Learn More
For more information about Next.js, see the following resources:- [Next.js Documentation](https://nextjs.org/docs)- [Learn Next.js](https://nextjs.org/learn)
For Planning Manager-specific documentation, see the main README.md in the root directory.

