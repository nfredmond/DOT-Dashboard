"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  MapIcon,
  MapPinIcon,
  ClipboardListIcon,
  UsersIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  FileTextIcon,
  BrainIcon,
  MessageSquareTextIcon,
  ShieldIcon,
  BarChartIcon,
  GitBranchIcon,
  ListChecksIcon,
  MonitorIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

interface SidebarProps {
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

export function Sidebar({ setCurrentPage, currentPage }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "global_admin" || user?.role === "org_admin";
  
  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon, path: "/homepage" },
    { id: "projects", label: "Projects", icon: ClipboardListIcon, path: "/projects" },
    { id: "project-mapping", label: "Project Mapping", icon: MapIcon, path: "/project-mapping-wrapper" },
    { id: "scoring", label: "Project Scoring", icon: BarChartIcon, path: "/project-scoring" },
    { id: "scenarios", label: "Scenarios", icon: GitBranchIcon, path: "/scenarios" },
    { id: "reports", label: "Reports", icon: FileTextIcon, path: "/reports" },
    { id: "analysis", label: "AI Analysis", icon: BrainIcon, path: "/llm-assistant" },
    { id: "screen-share", label: "Screen Share", icon: MonitorIcon, path: "/screen-share" },
    { id: "community", label: "Community", icon: MessageSquareTextIcon, path: "/community" },
  ];

  const handleNavigation = (pageId: string, path: string) => {
    console.log("Navigating to:", pageId, path);
    setCurrentPage(pageId);
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
    >
      <div
        className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => handleNavigation("dashboard", "/homepage")}
      >
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <MapIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Planning Manager
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transportation Planning
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col justify-between">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                currentPage === item.id
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleNavigation(item.id, item.path)}
              id={`nav-item-${item.id}`}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="px-2 space-y-1 mt-auto">
          {isAdmin && (
            <Button
              variant={currentPage === "admin-panel" ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                currentPage === "admin-panel"
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleNavigation("admin-panel", "/admin-panel")}
              id="nav-item-admin-panel"
            >
              <ShieldIcon className="mr-2 h-5 w-5" />
              Admin Panel
            </Button>
          )}
          
          <Button
            variant={currentPage === "settings" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              currentPage === "settings"
                ? "bg-gray-100 dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => handleNavigation("settings", "/settings")}
            id="nav-item-settings"
          >
            <SettingsIcon className="mr-2 h-5 w-5" />
            Settings
          </Button>
          
          <Button
            variant={currentPage === "help" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              currentPage === "help"
                ? "bg-gray-100 dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => handleNavigation("help", "/help")}
            id="nav-item-help"
          >
            <HelpCircleIcon className="mr-2 h-5 w-5" />
            Help & Support
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 mt-2"
            onClick={handleLogout}
            id="nav-item-logout"
          >
            <LogOutIcon className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
