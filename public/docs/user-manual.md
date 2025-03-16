# Transportation Planning Manager User Manual

![Green DOT Transportation Solutions](../Circle_Green_TranspRoad.png)

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Experience Features](#user-experience-features)
4. [Project Management](#project-management)
5. [GIS Mapping](#gis-mapping)
6. [Project Scoring & Prioritization](#project-scoring--prioritization)
7. [Scenario Development](#scenario-development)
8. [Travel Demand Forecasting & Trend Analysis](#travel-demand-forecasting--trend-analysis)
9. [AI Assistant](#ai-assistant)
10. [Reporting](#reporting)
11. [User Management](#user-management)
12. [Community Feedback](#community-feedback)
13. [Troubleshooting](#troubleshooting)
14. [Glossary](#glossary)

## Introduction

The Transportation Planning Manager is a comprehensive web application designed for transportation agencies to manage, score, prioritize, and visualize infrastructure projects. This user manual provides detailed instructions on how to use all features of the system.

### System Requirements

* Modern web browser (Chrome, Firefox, Safari, Edge)
* Internet connection
* Screen resolution of 1280x720 or higher (1920x1080 recommended)

### Access and Login

1. Navigate to the application URL provided by your organization
2. Enter your username and password
3. Click "Log in" to access the system

## User Experience Features

### Onboarding for New Users

When logging into the application for the first time, you will be presented with an onboarding dialog that walks you through the core workflow:

1. **Welcome**: An introduction to the Transportation Planning Manager platform
2. **Projects**: Learn about creating transportation projects
3. **Scenarios**: Understand how to generate alternative scenarios for projects
4. **Scoring**: Discover how to score and prioritize projects
5. **Getting Started**: Options to create your first project or explore on your own

The onboarding dialog will only appear on your first visit. You can dismiss it at any time by clicking "Don't show this again" or by closing the dialog.

### Empty State Guidance

When you don't have data in certain areas of the application, you'll see helpful empty state displays:

- **Projects**: When no projects exist, you'll see guidance on creating your first project
- **Scenarios**: If you have projects but no scenarios, you'll be prompted to create scenarios
- **Project Scoring**: Without scoring criteria or projects, you'll receive information on how to set these up

Each empty state includes:
- An explanation of what the feature does
- Why no data is currently visible
- Clear buttons to take the next appropriate action
- Contextual guidance based on your role and current progress

### Demo Mode vs. Regular Usage

- **Demo Mode**: When using the application with demo credentials (`admin@example.com` / `password`), you'll see pre-populated sample data
- **Regular Mode**: When using your actual account, you'll start with empty states and build up your data through normal use

## Getting Started

### Dashboard Overview

After logging in, you'll be directed to the main dashboard which provides an overview of:

* Active projects
* Recent activity
* Important notifications
* Quick access to frequently used features

### Navigation

The main navigation menu is located on the left side of the screen and contains links to:

* Project Management
* Project Map
* Project Scoring
* Scenario Development
* Reports
* AI Assistant
* Community Feedback
* User Management (Admin only)
* Settings

## Project Management

### Creating a New Project

1. Navigate to the "Projects" page
2. Click "Add New Project" button
3. Fill in the required information:
   * Project Name
   * Description
   * Project Type
   * Estimated Cost
   * Start and End Dates
   * Project Status
   * Location (manual input or map selection)
4. Click "Save" to create the project

### Editing Projects

1. Navigate to the "Projects" page
2. Find the project you want to edit
3. Click the "Edit" button (pencil icon)
4. Modify the project information
5. Click "Save" to update the project

### Project Details

The project details page provides comprehensive information about a specific project:

* General Information (name, description, type)
* Financial Information (estimated cost, funding sources)
* Timeline (start date, end date, milestones)
* Location Details
* Attached Documents
* Related Projects
* Scoring and Prioritization Results
* Community Feedback

### Batch Operations

For managing multiple projects at once:

1. Navigate to the "Projects" page
2. Use checkboxes to select multiple projects
3. Use the "Batch Actions" dropdown to:
   * Delete selected projects
   * Change status of selected projects
   * Export selected projects
   * Generate reports for selected projects

## GIS Mapping

### Map Navigation

* Pan: Click and drag the map
* Zoom: Use the mouse wheel or the +/- buttons
* Reset View: Click the home button to return to the default view

### Layer Controls

1. Click the layers icon in the top-right corner of the map
2. Toggle layers on/off by clicking the checkbox next to each layer

Available layers include:
* Base Maps (OpenStreetMap, Satellite, Terrain)
* Projects Layer
* Administrative Boundaries
* Infrastructure Networks
* Environmental Features

### Project Visualization

Projects are displayed on the map as:

* Points for specific locations
* Lines for linear projects (roads, trails)
* Polygons for area projects

Color coding indicates:
* Green: Active projects
* Orange: Planned projects
* Blue: Completed projects
* Red: Delayed or problematic projects

### Drawing and Editing Features

1. Click the draw button in the map toolbar
2. Select the drawing tool (point, line, polygon)
3. Draw the feature on the map
4. Save the feature to associate it with a project

To edit an existing feature:
1. Select the feature on the map
2. Click the edit button
3. Modify the feature
4. Save changes

### Measurement Tools

1. Click the measurement button in the map toolbar
2. Select measurement type (distance or area)
3. Click points on the map to measure
4. The measurement will display on the map

## Project Scoring & Prioritization

### Scoring Criteria

The system uses multiple criteria for project scoring:

* Safety Impact
* Economic Benefits
* Environmental Impact
* Social Equity
* Cost Effectiveness
* Implementation Feasibility
* Public Support

### Scoring a Project

1. Navigate to "Project Scoring"
2. Select a project to score
3. For each criterion, assign a score using the slider or input field
4. Add comments to justify scores
5. Click "Calculate Overall Score" to see the weighted result
6. Click "Save Scoring" to store the results

### Comparative Analysis

To compare multiple projects:

1. Navigate to "Project Scoring"
2. Click "Compare Projects"
3. Select the projects you want to compare
4. View the side-by-side comparison of scores
5. Use the visualization tools to see comparative charts

### AI-Assisted Scoring

The system can provide scoring suggestions based on project data:

1. Navigate to "Project Scoring"
2. Select a project
3. Click "Get AI Suggestions"
4. Review the suggested scores and rationale
5. Accept or modify the suggestions
6. Click "Save Scoring" to finalize

## Scenario Development

### Creating Scenarios

1. Navigate to "Scenarios"
2. Click "Create New Scenario"
3. Select a base project
4. Define scenario parameters (cost, timeline, design variations)
5. Click "Generate Scenario"

### AI-Assisted Scenario Creation

1. Navigate to "Scenarios"
2. Click "AI-Assisted Scenario"
3. Select a base project
4. Specify scenario goals (e.g., "Reduce costs by 15%" or "Improve safety features")
5. Click "Generate Scenarios" to have the AI create variations

### Comparing Scenarios

1. Navigate to "Scenarios"
2. Click "Compare Scenarios"
3. Select the scenarios to compare
4. View the comparison table and charts
5. Use the "Export Comparison" button to save the analysis

## Travel Demand Forecasting & Trend Analysis

This section covers our advanced modeling tools for transportation planning and forecasting.

### CAMP Travel Demand Modeling

The Chained Activity Modeling Process (CAMP) provides robust travel demand forecasting capabilities:

#### Running a CAMP Model

1. Navigate to "Modeling" > "Travel Demand"
2. Define your study area by selecting TAZs or drawing a boundary
3. Upload or select demographic data
4. Configure transportation networks
5. Set model parameters and run

#### Analyzing CAMP Results

1. View heat maps of travel demand
2. Analyze corridor flows
3. Review metrics including VMT, mode share, and emissions
4. Export results for reporting

### TrendNavigator Scenario Planning

TrendNavigator allows you to explore how future trends and policies might impact travel patterns and demand.

#### Creating TrendNavigator Scenarios

1. Navigate to "Modeling" > "TrendNavigator"
2. Click "New Trend Scenario"
3. Select a baseline model (required CAMP model result)
4. Configure trend variables:
   - Telecommuting rates
   - E-commerce adoption
   - Shared mobility usage
   - Vehicle automation levels
   - Transit service changes
   - Land use patterns
5. Set time horizon (5, 10, or 30 years)
6. Click "Generate Scenario" to compute impacts

#### Comparing TrendNavigator Scenarios

1. Navigate to "Modeling" > "TrendNavigator" > "Comparison"
2. Select two or more scenarios to compare
3. View side-by-side metrics including:
   - Vehicle Miles Traveled (VMT)
   - Greenhouse gas emissions
   - Mode share changes
   - Congestion levels
   - Transit ridership
   - Accessibility metrics
4. Use the visualization tools to create charts for presentations
5. Export comparison as a PDF report or presentation slides

#### AI-Assisted Trend Analysis

1. Navigate to "Modeling" > "TrendNavigator"
2. Select a scenario
3. Click "AI Analysis"
4. The AI will provide:
   - Key insights from the scenario
   - Potential impacts and implications
   - Recommended policy considerations
   - Comparison to best practices
   - Suggested refinements to the scenario

### Integrating Models with Projects

1. Navigate to a project details page
2. Click "Link to Model" button
3. Select a CAMP or TrendNavigator model result
4. The project will now display relevant metrics from the model
5. Project scoring can incorporate model results to improve prioritization

## AI Assistant

### Using the AI Assistant

1. Navigate to "AI Assistant"
2. Type your question or request in the input field
3. Click "Send" to submit your query
4. View the AI's response

Common uses for the AI Assistant:
* Project analysis and recommendations
* Grant criteria evaluation
* Document drafting assistance
* Best practices suggestions
* Data analysis interpretation

### Document Analysis

To have the AI analyze a document:

1. Navigate to "AI Assistant"
2. Click "Upload Document"
3. Select the document to upload
4. Ask a question about the document
5. The AI will provide analysis based on the document content

## Reporting

### Generating Reports

1. Navigate to "Reports"
2. Click "Generate New Report"
3. Select report type (Project Summary, Financial Analysis, Progress Report, etc.)
4. Choose which projects to include
5. Select report elements and format options
6. Click "Generate Report"

### Customizing Reports

1. Navigate to "Reports"
2. Click "Custom Report"
3. Use the drag-and-drop interface to build your report
4. Select data sources and visualization types
5. Add text sections and explanations
6. Click "Generate Custom Report"

### Exporting Reports

Reports can be exported in multiple formats:
* PDF
* CSV
* Excel
* JSON

1. Generate or open a report
2. Click "Export"
3. Select the desired format
4. Click "Download"

## User Management

### User Roles

The system supports different user roles:

* **Administrator**: Full access to all features and settings
* **Project Manager**: Can create and manage projects, scenarios, and reports
* **Analyst**: Can view projects and create reports
* **Viewer**: Read-only access to projects and reports

### Adding Users (Admin only)

1. Navigate to "User Management"
2. Click "Add User"
3. Enter user information:
   * Name
   * Email
   * Role
   * Organization
4. Click "Create User"
5. The system will send an invitation to the new user

### Managing User Permissions

1. Navigate to "User Management"
2. Find the user you want to modify
3. Click "Edit Permissions"
4. Adjust permission settings
5. Click "Save Changes"

## Community Feedback

### Reviewing Feedback

1. Navigate to "Community Feedback"
2. View the list of feedback items
3. Click on an item to see details
4. Use filters to sort by project, date, or feedback type

### Responding to Feedback

1. Navigate to "Community Feedback"
2. Select a feedback item
3. Click "Respond"
4. Type your response
5. Click "Send Response"

### Community Input Mapping Tool

1. Navigate to "Community Feedback"
2. Click on "Map View" or "Community Input Map" 
3. View the interactive map with feedback points
4. Filter feedback by:
   - Project
   - Feedback type (concern, suggestion, support)
   - Date range
   - Status (new, in review, addressed)
5. Click on a map point to view detailed feedback
6. Add new location-based feedback using the "Add Feedback" button
7. Generate heat maps of feedback density using the "Analysis" tab
8. Export feedback data in CSV or GeoJSON format for further analysis

### AI Analysis of Feedback

1. Navigate to "Community Feedback"
2. Click "AI Analysis"
3. The system will categorize feedback and identify trends
4. Review the analysis dashboard
5. Use insights to inform project decisions

## Troubleshooting

### Common Issues

**Problem**: Unable to log in
**Solution**: 
* Verify your username and password
* Check that your account is active
* Clear browser cache and cookies
* Contact your administrator if problems persist

**Problem**: Map not loading correctly
**Solution**:
* Check your internet connection
* Try a different browser
* Ensure you have the latest browser version
* Disable browser extensions that might interfere

**Problem**: Unable to create or edit projects
**Solution**:
* Verify you have the necessary permissions
* Check if the project is locked for editing by another user
* Try refreshing the page
* Contact your administrator if problems persist

### Getting Help

For additional assistance:

1. Click the "Help" icon in the top-right corner
2. Browse the FAQ section
3. Use the search function to find specific topics
4. Contact technical support using the provided form

## Glossary of Terms

### A

**Activity-Based Model**: A transportation planning approach that predicts travel patterns based on activities people need to perform rather than simply trips between locations.

**ADA Compliance**: Standards ensuring accessibility for individuals with disabilities, following the Americans with Disabilities Act requirements.

### C

**CAMP**: Chained Activity Modeling Process, a methodology for travel demand forecasting that models trip chains rather than isolated trips.

**Community Feedback**: Input gathered from the public regarding transportation projects and plans.

### G

**GIS**: Geographic Information System, used for storing, analyzing, and displaying spatial or geographic data.

**Grant Criteria**: Specific requirements that must be met to qualify for funding from federal, state, or local sources.

### M

**Mode Share**: The percentage of travelers using a particular type of transportation (e.g., car, public transit, bicycle).

### P

**Project Prioritization**: The process of ranking transportation projects based on specific criteria to determine implementation order.

### T

**TAZ**: Traffic Analysis Zone, a geographic unit used in transportation planning for data aggregation and analysis.

**Transportation Demand Management (TDM)**: Strategies to reduce travel demand or redistribute it across different times, routes, or modes.

**Travel Demand Model**: A computational tool that forecasts future travel patterns based on land use, demographics, and transportation network characteristics.

**TrendNavigator**: Scenario planning tool that explores how future trends might impact transportation patterns.

### V

**VMT**: Vehicle Miles Traveled, a measure of the total distance traveled by vehicles in a specific area over a given time period. 