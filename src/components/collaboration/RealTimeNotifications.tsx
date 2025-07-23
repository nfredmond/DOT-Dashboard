'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, MapPin, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunityInputEvent, ProjectUpdateEvent } from '@/lib/realtime/pusher-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'community-input' | 'project-update' | 'member-activity';
  title: string;
  message: string;
  timestamp: number;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  read: boolean;
}

interface RealTimeNotificationsProps {
  communityInputEvents?: CommunityInputEvent[];
  projectUpdateEvents?: ProjectUpdateEvent[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoHideDuration?: number;
  className?: string;
}

export function RealTimeNotifications({
  communityInputEvents = [],
  projectUpdateEvents = [],
  position = 'top-right',
  maxNotifications = 5,
  autoHideDuration = 5000,
  className,
}: RealTimeNotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Process community input events
  useEffect(() => {
    communityInputEvents.forEach((event) => {
      const notification: Notification = {
        id: `ci-${event.inputId}-${event.timestamp}`,
        type: 'community-input',
        title: getInputEventTitle(event.action),
        message: `${event.userName} ${getInputEventMessage(event.action)}`,
        timestamp: event.timestamp,
        icon: getInputEventIcon(event.action),
        action: {
          label: 'View',
          href: `/community/input/${event.inputId}`,
        },
        read: false,
      };
      
      addNotification(notification);
    });
  }, [communityInputEvents]);
  
  // Process project update events
  useEffect(() => {
    projectUpdateEvents.forEach((event) => {
      const notification: Notification = {
        id: `pu-${event.projectId}-${event.timestamp}`,
        type: 'project-update',
        title: 'Project Updated',
        message: `${event.userName} ${getProjectEventMessage(event)}`,
        timestamp: event.timestamp,
        icon: <MapPin className="h-4 w-4" />,
        action: {
          label: 'View Project',
          href: `/projects/${event.projectId}`,
        },
        read: false,
      };
      
      addNotification(notification);
    });
  }, [projectUpdateEvents]);
  
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      
      // Auto-hide after duration
      if (autoHideDuration > 0) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, autoHideDuration);
      }
      
      return updated;
    });
  };
  
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const handleAction = (notification: Notification) => {
    if (notification.action) {
      markAsRead(notification.id);
      router.push(notification.action.href);
    }
  };
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };
  
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative bg-background border rounded-lg p-4 shadow-lg',
              'hover:shadow-xl transition-shadow',
              notification.read && 'opacity-75'
            )}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex gap-3">
              <div className={cn(
                'flex items-center justify-center h-10 w-10 rounded-full',
                notification.type === 'community-input' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
                notification.type === 'project-update' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
                notification.type === 'member-activity' && 'bg-green-100 text-green-600 dark:bg-green-900/20'
              )}>
                {notification.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
                
                {notification.action && (
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 h-auto mt-2"
                    onClick={() => handleAction(notification)}
                  >
                    {notification.action.label} →
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper functions
function getInputEventTitle(action: CommunityInputEvent['action']): string {
  switch (action) {
    case 'new':
      return 'New Community Input';
    case 'approved':
      return 'Input Approved';
    case 'rejected':
      return 'Input Rejected';
    case 'commented':
      return 'New Comment';
    default:
      return 'Community Update';
  }
}

function getInputEventMessage(action: CommunityInputEvent['action']): string {
  switch (action) {
    case 'new':
      return 'submitted new feedback';
    case 'approved':
      return 'approved community feedback';
    case 'rejected':
      return 'rejected community feedback';
    case 'commented':
      return 'commented on feedback';
    default:
      return 'updated feedback';
  }
}

function getInputEventIcon(action: CommunityInputEvent['action']): React.ReactNode {
  switch (action) {
    case 'new':
      return <Bell className="h-4 w-4" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    case 'commented':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getProjectEventMessage(event: ProjectUpdateEvent): string {
  if (event.field) {
    return `updated ${event.field}`;
  }
  
  switch (event.action) {
    case 'create':
      return 'created a new element';
    case 'update':
      return 'made changes';
    case 'delete':
      return 'removed an element';
    default:
      return 'made changes';
  }
}

// Notification Bell Icon with Badge
interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('relative', className)}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
} 