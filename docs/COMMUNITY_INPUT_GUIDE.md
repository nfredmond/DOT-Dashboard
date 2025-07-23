# Community Input Tool Guide

## Overview

The Community Input Tool in Planning Manager v10 provides a comprehensive platform for collecting, managing, and analyzing public feedback on transportation projects. This guide covers all features including the enhanced mapping capabilities, AI-powered categorization, and administrative controls.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Features](#user-features)
3. [Administrative Features](#administrative-features)
4. [AI Integration](#ai-integration)
5. [Organization Customization](#organization-customization)
6. [API Reference](#api-reference)

## Getting Started

### Accessing Community Input

Navigate to the Community page from the main sidebar or visit `/community` while logged in.

### User Roles

- **Public Users**: Can submit feedback (if anonymous submissions are allowed)
- **Registered Users**: Can submit feedback and track their submissions
- **Editors**: Can moderate submissions and view analytics
- **Admins**: Full access to all features including settings and batch moderation

## User Features

### Map-Based Feedback

1. **Drawing Tools**
   - **Point**: Click to mark a specific location
   - **Line**: Draw lines for routes, paths, or corridors
   - **Polygon**: Create areas for zone-based feedback

2. **Location Search**
   - Use the search bar at the top of the map to find specific addresses or landmarks
   - The map will fly to the searched location

3. **Map Controls**
   - **Geolocation**: Click the navigation icon to center the map on your current location
   - **Zoom**: Use the + and - buttons or scroll to zoom
   - **Map Styles**: Switch between different map views (if enabled)

### Submitting Feedback

1. Select a drawing tool (Point, Line, or Area)
2. Draw on the map to indicate the location
3. Fill in the feedback form:
   - **Title**: Brief description (required)
   - **Category**: Select from available categories
   - **Description**: Detailed feedback (required)
   - **Photos**: Upload up to 5 images (optional)
4. Click Submit

### Viewing Feedback

- All approved feedback appears on the map with category-specific colors
- Use filters to show specific categories or statuses
- Click on any feedback marker to view details
- The feedback list on the right shows all submissions

## Administrative Features

### Admin Panel Access

Admins and editors can access the admin panel by clicking the "Admin Settings" button in the top-right corner of the community map.

### Moderation Tab

1. **Pending Reviews Counter**: Shows the number of submissions awaiting review
2. **Recent Submissions**: Lists the latest pending feedback
3. **Individual Moderation**:
   - Click the eye icon to review a submission
   - Add moderation notes
   - Approve or reject the submission

### Batch Moderation

New batch moderation capabilities allow processing multiple submissions at once:

1. Select multiple submissions using checkboxes
2. Click "Approve Selected" or "Reject Selected"
3. All selected items will be processed together

### Settings Tab

Configure how the community input system works:

- **Require Approval**: Toggle whether submissions need approval before appearing
- **AI Auto-Categorization**: Enable/disable AI assistance
- **Show Pending to Public**: Allow everyone to see pending submissions
- **Allow Voting**: Enable upvoting/downvoting on submissions

## AI Integration

### Auto-Categorization

When enabled, the AI system automatically:
1. Analyzes the title and description of submissions
2. Suggests the most appropriate category
3. Provides a confidence score (0-100%)
4. Auto-approves submissions above the configured threshold

### LLM Configuration

The system supports multiple AI providers:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Local models via Ollama

### Custom Instructions

Organizations can provide custom instructions to guide the AI categorization:
1. Navigate to Organization Settings > Community Input
2. Go to the Advanced tab
3. Enter custom instructions for your specific use case

## Organization Customization

### Managing Categories

Access category management at `/organizations/[id]/settings/community-input`

1. **Adding Categories**:
   - Enter a unique key (e.g., "safety")
   - Provide a display name
   - Add an optional description
   - Choose a color
   - Click "Add Category"

2. **Managing Existing Categories**:
   - Toggle categories on/off with the eye icon
   - Delete categories with the trash icon
   - Categories are displayed in order on the submission form

### Notification Settings

Configure email notifications for new submissions:
1. Go to the Notifications tab
2. Enter the notification email address
3. Save settings

### Moderation Rules

Advanced moderation options include:
- Keyword filtering
- Auto-approval for verified users
- Image content moderation
- Spam detection

## API Reference

### Endpoints

#### GET /api/community-inputs
Fetch community inputs with optional filters:
- `organizationId`: Filter by organization
- `status`: Filter by status (pending, approved, rejected)
- `category`: Filter by category key
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset

#### POST /api/community-inputs
Create a new community input:
```json
{
  "type": "point|line|polygon",
  "geometry": { /* GeoJSON geometry */ },
  "title": "Feedback title",
  "description": "Detailed description",
  "category": "category_key",
  "images": ["url1", "url2"],
  "projectId": "optional-project-uuid"
}
```

#### PATCH /api/community-inputs
Moderate a community input (admin/editor only):
```json
{
  "id": "input-uuid",
  "status": "approved|rejected",
  "moderationNote": "Optional note"
}
```

#### PATCH /api/community-inputs/batch
Batch moderate multiple inputs:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "status": "approved|rejected",
  "moderationNote": "Optional note"
}
```

### Database Schema

The community input system uses the following main tables:
- `community_inputs`: Main feedback storage
- `community_input_categories`: Organization-specific categories
- `community_input_images`: Associated images
- `community_input_votes`: User votes (if enabled)
- `organization_community_settings`: Per-organization settings

## Best Practices

1. **Category Design**:
   - Keep categories focused and distinct
   - Use clear, descriptive names
   - Limit to 5-8 categories for better UX

2. **Moderation Workflow**:
   - Review submissions regularly
   - Use batch actions for efficiency
   - Provide feedback through moderation notes

3. **AI Configuration**:
   - Set appropriate confidence thresholds
   - Provide clear custom instructions
   - Monitor AI categorization accuracy

4. **Community Engagement**:
   - Respond to submissions promptly
   - Use the agency response feature
   - Share how feedback influences decisions

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Mapbox token configuration
2. **Submissions not appearing**: Verify moderation settings
3. **AI categorization failing**: Check API keys and provider settings
4. **Upload errors**: Ensure image storage is configured

### Support

For additional support, contact your system administrator or refer to the main Planning Manager documentation. 