"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  MapIcon,
  BarChartIcon,
  BrainIcon,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react";

interface SidebarProps {
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

export function Sidebar({ setCurrentPage, currentPage }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "project-map", label: "Project Map", icon: MapIcon },
    { id: "project-scoring", label: "Project Scoring", icon: BarChartIcon },
    { id: "llm-assistant", label: "LLM Assistant", icon: BrainIcon },
    { id: "reports", label: "Reports", icon: FileTextIcon },
    { id: "community", label: "Community", icon: UsersIcon },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "help", label: "Help & Support", icon: HelpCircleIcon },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
    >
      <div
        className="p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <MapIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              RTPA Portal
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transportation Planning
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col justify-between">
        <nav className="px-2 space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                currentPage === item.id
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage(item.id)}
              id={`1c5qjb_${index}`}
            >
              <item.icon className="mr-2 h-5 w-5" id={`99uq9j_${index}`} />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="px-2 space-y-1 mt-auto">
          {bottomMenuItems.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setCurrentPage(item.id)}
              id={`82u2c8_${index}`}
            >
              <item.icon className="mr-2 h-5 w-5" id={`onm38t_${index}`} />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
