# Mapbox Integration Guide

## Overview

The Planning Manager application now uses Mapbox GL JS instead of Mapbox GL JS for mapping functionality. This upgrade brings numerous benefits including better performance, improved visual quality, and more advanced mapping capabilities.

## Key Benefits

- **Enhanced Performance**: Mapbox GL JS uses WebGL for rendering, making it much faster for displaying large datasets
- **Vector Tiles**: Uses vector tiles instead of raster tiles, allowing for smoother zooming and rotation
- **Custom Styling**: More advanced styling options with Mapbox Style Specification
- **3D Capabilities**: Support for 3D buildings, terrain, and extrusions
- **Improved Mobile Support**: Better touch interaction and performance on mobile devices
- **Geolocation**: Enhanced geolocation services with better accuracy
- **Geocoding**: More accurate and comprehensive geocoding capabilities
- **Directions**: Improved routing and directions
- **Accessibility**: Better support for screen readers and keyboard navigation

## Configuration

### Environment Variables

The following environment variables are used for Mapbox configuration:

```
# Mapbox configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token_here
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/streets-v12
```

To get a Mapbox access token:
1. Create an account at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Navigate to your account dashboard
3. Create a new access token or use the default public token
4. Copy the token to your `.env.local` file

### Admin Settings

Organization administrators can customize mapping settings in the Admin Panel:

1. Navigate to **Admin > Map Settings**
2. The following settings can be configured:
   - Default map style
   - Initial center coordinates
   - Default zoom level
   - Custom Mapbox token (optional)
   - Community input settings

## Components Overview

### Core Components

- **MapboxProvider**: Context provider for Mapbox GL JS functionality
- **MapboxMap**: Base map component that renders the Mapbox GL map
- **MapboxSource**: Defines data sources for the map
- **MapboxLayer**: Renders different layer types on the map

### Project Mapping Components

- **MapboxProjectMapping**: Main component for displaying projects on the map
- **MapboxProjectMappingWrapper**: Wrapper component that handles dynamic imports and providers

### Community Input Components

- **MapboxCommunityInputMap**: Interactive map for collecting and displaying community feedback

## Integration with Projects

The Mapbox integration is fully connected with the project management system:

1. Projects displayed on the map use their geographic data (coordinates or geometry)
2. Project status and categories affect their visual appearance on the map
3. Clicking on project markers shows detailed information
4. Projects can be filtered and searched from the map interface

## GeoJSON Integration

The system converts project data to GeoJSON for display on the map:

- Point geometries are represented as GeoJSON Point features
- Line geometries are represented as GeoJSON LineString features
- Polygon geometries are represented as GeoJSON Polygon features

The `projectToGeoJSON` function in `src/lib/map/project-map-integration.js` handles this conversion.

## Community Input System

The new Mapbox-based community input system allows for:

1. **Drawing Tools**: Users can add points, lines, and polygons to the map
2. **Media Upload**: Support for image uploads with community feedback
3. **AI Classification**: Automatic categorization of feedback using AI
4. **Moderation**: Admin moderation workflow for community input
5. **Custom Categories**: Organizations can define their own feedback categories

### Using the Community Input Map

1. Navigate to **Community > Map View**
2. Use the drawing tools to add a point, line, or area to the map
3. Fill in the details in the form that appears
4. Submit your feedback
5. Administrators can review and approve submissions

## AI Integration

The community input system integrates with AI services:

1. **Input Classification**: Automatically categorizes community input based on text
2. **Image Moderation**: Optionally screens uploaded images for inappropriate content
3. **Spam Detection**: Identifies and filters potential spam submissions

## Database Schema

The Mapbox integration introduces several new tables in the database:

- `map_settings`: Stores organization-specific map configurations
- `community_input_categories`: Defines categories for community input
- `community_input_settings`: Stores settings for the community input system
- `community_input_moderators`: Manages users with moderation privileges
- `community_inputs`: Stores community feedback submissions
- `community_input_images`: Stores images attached to community input

Refer to the `supabase_schema.sql` file for the complete database schema.

## Troubleshooting

### Map Not Loading

If the map fails to load, check the following:

1. Verify that your Mapbox access token is valid
2. Check the browser console for errors
3. Ensure that the map container has a valid height and width
4. Verify that WebGL is supported and enabled in your browser

### Community Input Issues

If you encounter issues with the community input system:

1. Check that the Mapbox Draw plugin is properly loaded
2. Verify that the necessary permissions are set up in the database
3. Check the browser console for API errors
4. Verify that the correct organizations and categories are configured

## Mapbox vs. Mapbox GL JS

### Why We Migrated

We migrated from Mapbox GL JS to Mapbox GL JS for several reasons:

1. **Performance**: Mapbox GL JS offers significantly better performance for large datasets
2. **Vector Tiles**: Vector tiles allow for more fluid interaction and dynamic styling
3. **3D Support**: Ability to add 3D elements to maps
4. **Native Animations**: Smoother animations and transitions
5. **Better Mobile Support**: More responsive and touch-friendly on mobile devices

### Impact on Existing Code

The migration impacts the following areas:

1. **Map Components**: All Mapbox GL JS-based components have been replaced
2. **Geometry Handling**: GeoJSON processing has been updated for Mapbox compatibility
3. **Events**: Map event handling has been updated to use Mapbox events
4. **Controls**: Custom map controls have been reimplemented for Mapbox

## Further Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Examples](https://docs.mapbox.com/mapbox-gl-js/examples/)
- [Mapbox GL Draw](https://github.com/mapbox/mapbox-gl-draw)
- [React Components for Mapbox GL](https://visgl.github.io/react-map-gl/) 