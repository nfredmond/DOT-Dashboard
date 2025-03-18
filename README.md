# Planning Manager Spatial Visualization System

This project implements an interactive spatial visualization system for activity-based travel simulations. It provides tools to generate, visualize, and analyze spatial patterns of activities and travel flows using the GreenChAMP (Green DOT Chained Activity Modelling Process) framework.

## Features

- **GreenChAMP Integration:** Comprehensive travel demand modeling using the Green DOT Chained Activity Modelling Process
- **TrendNavigator:** Scenario planning tools for modeling future trends and policy impacts
- **Interactive Map Visualization:** Uses Mapbox GL to render activities and travel patterns on an interactive map
- **Multiple Visualization Types:**
  - Activity Heatmap: Shows density of activities across space
  - Travel Flow Lines: Displays trips between locations with color-coding by mode
  - Activity Points: Shows individual activities with size based on duration
- **Advanced Filtering Capabilities:**
  - Filter by activity type (home, work, education, etc.)
  - Time-based filtering to show activities and trips at different times of day
  - Multiple time filter modes (active during, starting at, ending at)
- **Animation System:**
  - Animate activities and travel patterns throughout the day
  - Adjust animation speed (0.5x, 1x, 2x, 4x)
  - Real-time statistics updates during animation
- **Data Export Capabilities:**
  - Export filtered data in CSV format for statistical analysis
  - Export filtered data in GeoJSON format for GIS applications
  - Customize exports with selected data types (activities, trips, locations)
  - Apply current visualization filters to exported data
- **Interactive Statistics:** Dynamic statistics that update based on applied filters
- **API Integration:** Backend APIs for managing simulation runs and retrieving spatial data
- **Responsive Design:** Works on desktop and mobile devices

## Technical Implementation

The system consists of:

1. **React Components:**
   - `ActivitySpatialVisualization`: Core component for map visualization with filtering, animation, and export capabilities
   - `ActivitySimulationPage`: Results page with visualization tabs
   
2. **API Endpoints:**
   - `/api/scenarios/[id]/activity-simulations`: Manages simulation runs
   - `/api/scenarios/[id]/activity-simulations/[simulationId]/activities`: Retrieves activity data 
   - `/api/scenarios/[id]/activity-simulations/[simulationId]/itineraries`: Retrieves travel itinerary data
   - `/api/scenarios/[id]/activity-locations`: Retrieves location data

3. **Services:**
   - `ActivitySimulationService`: Orchestrates simulation runs and data storage
   - `GreenChAMPService`: Handles travel demand modeling using the GreenChAMP framework
   - `TrendNavigatorService`: Manages scenario planning and trend analysis

## Getting Started

1. Set up environment variables:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
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

1. Navigate to a scenario detail page
2. Create a new activity-based simulation or select an existing one
3. View the simulation results with the spatial visualization tab
4. Choose visualization types and filters to explore the data
5. Use the time filter to analyze patterns at different times of day:
   - Select "Active During" to see activities occurring during a time window
   - Select "Starting At" to see activities that begin during a time window
   - Select "Ending At" to see activities that end during a time window
6. Use the animation controls to visualize how patterns change over time:
   - Click the play button to start the animation
   - Adjust the animation speed using the speed selector
   - The time window automatically moves through the day
   - Statistics update in real-time as the animation progresses
7. Export data for further analysis:
   - Click the Export Data button in the card footer
   - Choose CSV format for tabular data or GeoJSON for spatial data
   - Select which data types to include (activities, trips, locations)
   - Choose whether to apply current filters to the exported data
   - Download the exported files for use in other analysis tools

## GreenChAMP Model

The GreenChAMP (Green DOT Chained Activity Modelling Process) is an integrated activity-based travel demand modeling framework that simulates individual activity patterns and travel behavior. Key features include:

- **Activity-Based Modeling:** Models travel as chains of activities performed by individuals
- **Policy Analysis:** Evaluate impacts of transportation policies on travel patterns
- **Environmental Assessment:** Calculate emissions and environmental impacts from transportation
- **Scenario Planning:** Model different future scenarios with TrendNavigator integration

For detailed documentation on GreenChAMP, see the [GreenChAMP Technical Implementation Guide](docs/GreenChAMP%20Integration%20Technical%20Implementation%20Guide.md).

## Future Enhancements

- 3D visualization of activity patterns
- Enhanced filtering by demographic attributes
- Comparative analysis between multiple simulation runs
