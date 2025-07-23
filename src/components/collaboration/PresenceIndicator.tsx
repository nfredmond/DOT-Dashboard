'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { PresenceInfo } from '@/lib/realtime/pusher-client';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  members: PresenceInfo[];
  isConnected: boolean;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showConnectionStatus?: boolean;
  className?: string;
}

export function PresenceIndicator({
  members,
  isConnected,
  maxDisplay = 5,
  size = 'md',
  showConnectionStatus = true,
  className,
}: PresenceIndicatorProps) {
  const avatarSizes = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };
  
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);
  
  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {showConnectionStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                isConnected 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              )}>
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {members.length > 0 && (
          <>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{members.length}</span>
            </div>
            
            <div className="flex -space-x-2">
              {displayMembers.map((member) => (
                <Tooltip key={member.userId}>
                  <TooltipTrigger asChild>
                    <Avatar className={cn(
                      avatarSizes[size],
                      'ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110'
                    )}>
                      <AvatarImage 
                        src={member.avatar} 
                        alt={member.userName}
                      />
                      <AvatarFallback className="font-medium">
                        {member.userName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{member.userName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      avatarSizes[size],
                      'flex items-center justify-center rounded-full bg-muted ring-2 ring-background font-medium cursor-pointer hover:bg-muted/80'
                    )}>
                      +{remainingCount}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{remainingCount} more {remainingCount === 1 ? 'person' : 'people'} viewing</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

interface PresenceAvatarProps {
  member: PresenceInfo;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showStatus?: boolean;
  isTyping?: boolean;
  className?: string;
}

export function PresenceAvatar({
  member,
  size = 'md',
  showName = false,
  showStatus = false,
  isTyping = false,
  className,
}: PresenceAvatarProps) {
  const avatarSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Avatar className={avatarSizes[size]}>
          <AvatarImage src={member.avatar} alt={member.userName} />
          <AvatarFallback>
            {member.userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {showStatus && (
          <div className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
            'bg-green-500'
          )} />
        )}
        
        {isTyping && (
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
            <div className="flex gap-0.5">
              <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{member.userName}</span>
          <span className="text-xs text-muted-foreground">{member.email}</span>
        </div>
      )}
    </div>
  );
} 