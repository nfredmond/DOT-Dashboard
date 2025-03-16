"use client"

import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SearchIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  Search,
  Bell,
  MessageSquare,
  Mic,
} from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { useVoice } from "@/contexts/VoiceContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VoiceInputOutput } from "@/components/VoiceInputOutput";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const authContext = useContext(AuthContext);
  // Handle the case when auth context isn't available
  const user = authContext?.user || null;
  const logout = authContext?.logout || (() => {});
  
  const router = useRouter();
  const { voiceEnabled } = useVoice();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  const handleVoiceTranscriptSubmit = (transcript: string) => {
    // Here you can handle the voice transcript by sending it to your LLM/AI processing
    console.log('Voice input:', transcript);
    // For example, you could set search query or trigger a search
    if (transcript.toLowerCase().includes('search for')) {
      const searchTerm = transcript.toLowerCase().replace('search for', '').trim();
      // Set search term and trigger search
      console.log('Searching for:', searchTerm);
    }
  };

  return (
    <header
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
    >
      <div
        className="flex items-center justify-between px-4 py-3 md:px-6"
      >
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mr-2"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
            />
            <Input
              placeholder="Search projects, reports..."
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {user?.role && user.role === "global_admin" && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 dark:text-gray-400"
              onClick={() => router.push("/admin-panel")}
            >
              <ShieldIcon className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 dark:text-gray-400"
            onClick={() => router.push("/settings")}
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>

          {voiceEnabled && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              <div className="absolute right-0 mt-2 w-80 z-50">
                <VoiceInputOutput onTranscriptSubmit={handleVoiceTranscriptSubmit} />
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.profileImage}
                    alt={user?.firstName}
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {user?.role && (
                    <p className="text-xs mt-1">
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
