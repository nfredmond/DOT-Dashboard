# Community Input Mapping Tool

## Overview

The Community Input Mapping Tool is an advanced feature of the Planning Manager application that allows community members to provide location-specific feedback on transportation projects and issues. Users can add points, draw lines, or create polygons on a map to indicate specific locations or areas of concern, and attach comments, images, and categorize their input.

## Features

### For Community Members

- **Interactive Map Interface**: Intuitive interface for providing location-based feedback
- **Multiple Input Types**: 
  - Points for specific locations
  - Lines for routes or corridors
  - Polygons for areas or regions
- **Comment Submission**:
  - Title and description fields
  - Category selection
  - Image upload (multiple images supported)
- **Feedback Viewing**: See other community members' approved feedback
- **Filtering**: Filter inputs by category
- **Search**: Search for specific locations

### For Administrators

- **Moderation Dashboard**: Review, approve, or reject community input
- **Auto-moderation**: AI-powered content moderation to automatically approve safe content
- **AI Categorization**: Automatic categorization of inputs by topic (transportation, safety, etc.)
- **Organization-specific Settings**:
  - Custom categories
  - Moderation preferences
  - Auto-approval settings
- **Analytics**: View statistics and trends on community input

## Technical Implementation

### Front-end Components

- **Map Component**: Uses Mapbox GL JS.js for the interactive map
- **Drawing Tools**: EditControl from react-Mapbox GL JS-draw for geometry creation
- **Form Components**: Shadcn UI components for input form
- **Admin Interface**: Admin panel with moderation capabilities
- **Dialogs and Popovers**: For input forms and information display

### Back-end Services

- **API Endpoints**:
  - `GET /api/community-input`: Retrieve community input entries
  - `POST /api/community-input`: Submit new community input
  - `PATCH /api/community-input`: Update community input status (approval)
  - `DELETE /api/community-input`: Delete community input entries

- **Database Models**:
  - `community_feedback`: Main table for community input data
  - `community_feedback_votes`: For tracking upvotes/downvotes
  - `community_feedback_responses`: For comments on feedback
  - `community_feedback_categories`: Organization-specific categories
  - `community_feedback_settings`: Organization settings for feedback

- **AI Integration**:
  - Content moderation using OpenAI models
  - Automatic categorization of feedback
  - Customizable prompt templates per organization

### Geospatial Features

- **Geometry Storage**: PostGIS for storing and querying spatial data
- **Spatial Operations**:
  - Proximity searches
  - Area-based queries
  - Spatial aggregation

## User Workflow

### Community Member Workflow

1. Navigate to the Community page and select the Mapping tab
2. Use the map controls to find the relevant location
3. Select the appropriate input type (point, line, polygon)
4. Draw the geometry on the map
5. Complete the feedback form with details and images
6. Submit the feedback for review

### Administrator Workflow

1. Login as an administrator
2. Access the Community page and select the Mapping tab
3. Use the admin controls to open the moderation panel
4. Review pending community inputs
5. Approve, reject, or provide moderation notes
6. Configure auto-moderation and category settings

## Organization-specific Customization

Administrators can customize the community input tool for their organization:

- **Custom Categories**: Define organization-specific categories for feedback
- **Auto-moderation Settings**: Enable or disable AI-powered auto-approval
- **LLM Categorization**: Enable automatic categorization of submissions
- **Visibility Settings**: Control who can view feedback (public, organization-only)
- **Voting and Responses**: Enable or disable community engagement features

## Technical Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                │     │                 │     │                 │
│  Community     │     │  API Routes     │     │  Database       │
│  Input Map     │────▶│  & Controllers  │────▶│  & Models       │
│  Component     │     │                 │     │                 │
│                │     │                 │     │                 │
└────────────────┘     └─────────────────┘     └─────────────────┘
        │                      │                       │
        │                      │                       │
        ▼                      ▼                       ▼
┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                │     │                 │     │                 │
│  Admin         │     │  LLM Services   │     │  Spatial        │
│  Interface     │     │  & Moderation   │     │  Operations     │
│  Component     │     │                 │     │                 │
│                │     │                 │     │                 │
└────────────────┘     └─────────────────┘     └─────────────────┘
```

## Implementation Notes

- Uses dynamic imports for Mapbox GL JS components to ensure proper client-side rendering
- Implements error boundaries to handle map rendering issues
- Supports geolocation for users to find their current location
- Provides fallback mechanisms for when Mapbox GL JS cannot be loaded
- Ensures organization-specific data isolation in the database
- Uses optimistic UI updates for better user experience

## Future Enhancements

- Mobile-optimized input interface
- Real-time updates of new community input
- Integration with project prioritization scoring
- Heatmap visualization of feedback density
- Time-based filtering to see historical feedback
- Enhanced analytics dashboard for administrators
- Social sharing functionality
- Comment threading and discussions
- Email notifications for feedback status updates
- Integration with public meeting schedules 