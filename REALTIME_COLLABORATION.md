# Real-Time Collaboration Feature

## Overview
The Planning Manager v10 now includes real-time collaboration features powered by Pusher. This enables:
- Live presence indicators showing who's viewing/editing
- Real-time community input notifications
- Instant project updates across all connected users
- Collaborative project planning sessions

## Setup

### 1. Environment Variables
Add the following to your `.env.local` file:

```env
# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Optional: Redis for enhanced real-time features
REDIS_URL=redis://localhost:6379
```

### 2. Pusher Account Setup
1. Create a free account at [pusher.com](https://pusher.com)
2. Create a new app
3. Copy the credentials to your `.env.local` file

## Features Implemented

### 1. Presence Indicators
Shows active users viewing or editing content in real-time.

```tsx
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration';

function ProjectHeader({ projectId }) {
  const { activeMembers, isConnected } = useRealTimeCollaboration({ projectId });
  
  return (
    <div className="flex justify-between items-center">
      <h1>Project Name</h1>
      <PresenceIndicator 
        members={activeMembers} 
        isConnected={isConnected} 
      />
    </div>
  );
}
```

### 2. Real-Time Notifications
Displays notifications for community input and project updates.

```tsx
import { RealTimeNotifications } from '@/components/collaboration/RealTimeNotifications';
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration';

function AppLayout({ children }) {
  const [communityEvents, setCommunityEvents] = useState([]);
  const [projectEvents, setProjectEvents] = useState([]);
  
  const { isConnected } = useRealTimeCollaboration({
    organizationId: user.organizationId,
    onCommunityInput: (event) => {
      setCommunityEvents(prev => [...prev, event]);
    },
    onProjectUpdate: (event) => {
      setProjectEvents(prev => [...prev, event]);
    }
  });
  
  return (
    <>
      <RealTimeNotifications 
        communityInputEvents={communityEvents}
        projectUpdateEvents={projectEvents}
      />
      {children}
    </>
  );
}
```

### 3. useRealTimeCollaboration Hook
Main hook for real-time features.

```tsx
const {
  isConnected,       // WebSocket connection status
  activeMembers,     // Currently active users
  error,            // Connection errors
  emit,             // Send events to other users
  getMember         // Get member info by userId
} = useRealTimeCollaboration({
  projectId,        // Subscribe to project updates
  organizationId,   // Subscribe to organization updates
  onProjectUpdate,  // Handle project updates
  onCommunityInput, // Handle community input updates
  onMembersChange   // Handle presence changes
});
```

## Architecture

### Channels
- `presence-project-{projectId}` - Project-specific presence and updates
- `presence-organization-{organizationId}` - Organization-wide presence
- `community-input-{organizationId}` - Community input notifications

### Events
- **Project Events**: `project-updated`, `project-field-changed`, `scenario-updated`, `task-updated`
- **Community Input Events**: `new-input`, `input-approved`, `input-rejected`, `input-commented`
- **Member Events**: `member-joined`, `member-left`

### Security
- All presence channels require authentication via `/api/pusher/auth`
- Users can only join channels for projects/organizations they have access to
- Server-side validation ensures data integrity

## API Integration

### Triggering Updates from Server
```typescript
import { triggerProjectUpdate, triggerCommunityInputUpdate } from '@/lib/realtime/pusher-server';

// In your API route
await triggerProjectUpdate(projectId, 'project-updated', {
  projectId,
  userId: user.id,
  userName: user.name,
  action: 'update',
  field: 'name',
  oldValue: oldName,
  newValue: newName,
  timestamp: Date.now()
});

// For community inputs
await triggerCommunityInputUpdate(organizationId, 'new-input', {
  inputId: newInput.id,
  action: 'new',
  userId: user.id,
  userName: user.name,
  data: newInput,
  timestamp: Date.now()
});
```

## Performance Considerations

### Connection Management
- Single Pusher connection shared across all components
- Automatic reconnection on network issues
- Channels are unsubscribed when components unmount

### Optimization Tips
1. Use `maxDisplay` prop on PresenceIndicator to limit avatars shown
2. Set appropriate `autoHideDuration` for notifications
3. Implement pagination for historical data
4. Use Redis for caching frequently accessed data

## Troubleshooting

### Connection Issues
1. Check Pusher credentials in `.env.local`
2. Verify Pusher app is active
3. Check browser console for WebSocket errors
4. Ensure authentication endpoint (`/api/pusher/auth`) is working

### Missing Updates
1. Verify user has access to the channel
2. Check event names match between client and server
3. Ensure server is triggering events after database updates
4. Check Pusher debug console for event delivery

## Future Enhancements
1. Cursor position tracking for collaborative editing
2. Typing indicators for forms
3. Conflict resolution for simultaneous edits
4. Activity feed with real-time updates
5. Push notifications for mobile devices
6. Offline support with sync on reconnect 