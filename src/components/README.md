# Planning Manager Application Components
This directory contains the reusable UI components that make up the Planning Manager transportation project management system. The components are organized into subdirectories based on their functionality.

## Component Architecture
The Planning Manager application follows a modular component architecture, with a focus on reusability and maintainability. Components are built using React and TypeScript, with styling provided by Tailwind CSS and shadcn/ui.

### Directory Structure
```bash
components/
├── auth/           # Authentication-related components
├── projects/       # Project management components
├── ui/             # UI components based on shadcn/ui
├── AppLayout.tsx   # Main application layout wrapper
├── EnvironmentVariableManager.tsx  # Environment variable management
├── LeafletErrorBoundary.tsx        # Error boundary for Leaflet maps
└── ProtectedRoute.tsx              # Authentication route protection
```

## Core Components

### AppLayout.tsx
The main layout component that provides the structure for the entire application. It includes:
- Navigation sidebar with dynamic menu options
- Top navigation bar with user profile and actions
- Dynamic content area that adapts to different views
- Responsive design for desktop and mobile devices

### EnvironmentVariableManager.tsx
A component for managing and accessing environment variables throughout the application. It:
- Provides a UI for viewing and editing environment variables
- Validates environment variable formats
- Handles secure storage of sensitive values
- Supports different environment configurations

### LeafletErrorBoundary.tsx
An error boundary specifically designed for Leaflet map components. It:
- Catches and handles errors related to map rendering
- Provides fallback UI when maps fail to load
- Logs detailed error information for debugging
- Attempts to recover from common map errors

### ProtectedRoute.tsx
A component that handles route protection based on authentication status. It:
- Verifies user authentication before rendering protected routes
- Redirects unauthenticated users to the login page
- Supports role-based access control
- Preserves the intended destination for post-login redirection

## UI Components (ui/)
The `ui/` directory contains base UI components built with shadcn/ui. These components provide the foundation for the application's user interface, including:
- Buttons, inputs, and form controls
- Cards, panels, and containers
- Modal dialogs and popovers
- Navigation elements and menus

## Authentication Components (auth/)
The `auth/` directory contains components related to user authentication, including:
- Login and registration forms
- Password reset functionality
- User profile management
- Authentication state management

## Project Components (projects/)
The `projects/` directory contains components specific to transportation project management:
- Project creation wizard
- Project scoring interface
- Project details view
- Project listing and filtering
- Batch update tools

## Best Practices
When working with these components, follow these best practices:
1. **Component Isolation**: Keep components focused on a single responsibility
2. **Prop Typing**: Use TypeScript interfaces to define component props
3. **Composition**: Build complex UIs by composing smaller components
4. **State Management**: Use React context for state that needs to be shared
5. **Accessibility**: Ensure components meet WCAG accessibility standards
6. **Performance**: Optimize renders using React.memo and useCallback when appropriate
7. **Testing**: Write unit tests for components with complex logic

## Adding New Components
When adding new components:
1. Place the component in the appropriate subdirectory
2. Use consistent naming conventions (PascalCase for component files)
3. Create a TypeScript interface for the component props
4. Document the component's purpose and usage
5. Consider creating a storybook story for visual testing

