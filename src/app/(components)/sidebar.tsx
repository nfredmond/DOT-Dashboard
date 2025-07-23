"use client"

import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  MapIcon,
  ClipboardListIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  FileTextIcon,
  BrainIcon,
  MessageSquareTextIcon,
  ShieldIcon,
  BarChartIcon,
  GitBranchIcon,
  MonitorIcon,
  WrenchIcon,
  ActivityIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LineChartIcon,
  BarChart3Icon,
  LineChartIcon as LineChart,
  ScaleIcon,
  UsersIcon,
  LeafIcon,
} from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  subItems?: MenuItem[];
}

interface SidebarProps {
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

export function Sidebar({ setCurrentPage, currentPage }: SidebarProps) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    modeling: false,
    scenarios: false,
    projects: false,
  });
  
  // Handle the case when auth context isn't available
  const user = authContext?.user || null;
  const logout = authContext?.logout || (() => router.push('/login'));
  
  const isAdmin = user?.role === "global_admin" || user?.role === "org_admin";
  
  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon, path: "/homepage" },
    { 
      id: "projects", 
      label: "Projects", 
      icon: ClipboardListIcon, 
      path: "/projects",
      subItems: [
        { id: "project-list", label: "All Projects", icon: ClipboardListIcon, path: "/projects" },
        { id: "benefit-cost", label: "Benefit/Cost Analysis", icon: ScaleIcon, path: "/projects/benefit-cost" },
        { id: "project-scoring", label: "Project Scoring", icon: BarChartIcon, path: "/projects/scoring" },
      ]
    },
    { id: "project-mapping", label: "Project Mapping", icon: MapIcon, path: "/project-mapping-wrapper" },
    { 
      id: "scenarios", 
      label: "Scenarios", 
      icon: GitBranchIcon, 
      path: "/scenarios",
      subItems: [
        { id: "scenario-list", label: "All Scenarios", icon: GitBranchIcon, path: "/scenarios" },
        { id: "scenario-comparison", label: "Compare Scenarios", icon: BarChart3Icon, path: "/scenarios/compare" },
        { id: "scenario-generator", label: "Scenario Generator", icon: LineChart, path: "/scenarios/generator" },
        { id: "scenario-visualization", label: "Spatial Visualization", icon: MapIcon, path: "/scenarios/visualization" },
      ]
    },
    { 
      id: "modeling", 
      label: "Modeling", 
      icon: ActivityIcon, 
      path: "/modeling",
      subItems: [
        { id: "greenchamp", label: "GreenChAMP", icon: ActivityIcon, path: "/modeling/greenchamp/runs" },
        { id: "trendnavigator", label: "TrendNavigator", icon: TrendingUpIcon, path: "/modeling/trendnavigator" },
        { id: "integrated-analysis", label: "Integrated Analysis", icon: GitBranchIcon, path: "/modeling/integrated-analysis" },
        { id: "network-analysis", label: "Network Analysis", icon: LineChartIcon, path: "/modeling/network" },
        { id: "benefit-cost-modeling", label: "Benefit/Cost Tools", icon: ScaleIcon, path: "/modeling/benefit-cost" },
      ]
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: LineChartIcon,
      path: "/analytics",
      subItems: [
        { id: "greenchamp-dashboard", label: "GreenChAMP Dashboard", icon: ActivityIcon, path: "/analytics/greenchamp" },
        { id: "trendnav-dashboard", label: "TrendNavigator Dashboard", icon: TrendingUpIcon, path: "/analytics/trendnavigator" },
        { id: "benefit-cost-dashboard", label: "Benefit/Cost Dashboard", icon: ScaleIcon, path: "/analytics/benefit-cost" },
        { id: "equity-dashboard", label: "Equity Analysis", icon: UsersIcon, path: "/analytics/equity" },
        { id: "environmental-dashboard", label: "Environmental Impact", icon: LeafIcon, path: "/analytics/environmental" },
      ]
    },
    { id: "reports", label: "Reports", icon: FileTextIcon, path: "/reports" },
    { id: "maintenance", label: "Maintenance", icon: WrenchIcon, path: "/maintenance" },
    { id: "public-records", label: "Public Records", icon: FileTextIcon, path: "/public-records" },
    { id: "analysis", label: "AI Analysis", icon: BrainIcon, path: "/llm-assistant" },
    { id: "screen-share", label: "Screen Share", icon: MonitorIcon, path: "/screen-share" },
    { id: "community", label: "Community", icon: MessageSquareTextIcon, path: "/community" },
  ];

  const handleNavigation = (pageId: string, path: string) => {
    console.log("Navigating to:", pageId, path);
    setCurrentPage(pageId);
    router.push(path);
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      const isOpen = openCategories[item.id] || false;
      return (
        <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleCategory(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant={currentPage === item.id ? "secondary" : "ghost"}
              className={`w-full justify-between ${
                currentPage === item.id
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              id={`nav-item-${item.id}`}
            >
              <div className="flex items-center">
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </div>
              {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-8 space-y-1 mt-1">
            {item.subItems.map(subItem => (
              <Button
                key={subItem.id}
                variant={currentPage === subItem.id ? "secondary" : "ghost"}
                className={`w-full justify-start text-sm ${
                  currentPage === subItem.id
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => handleNavigation(subItem.id, subItem.path)}
                id={`nav-item-${subItem.id}`}
              >
                <subItem.icon className="mr-2 h-4 w-4" />
                {subItem.label}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }
    
    return (
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
    );
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

      <div className="flex-1 py-4 flex flex-col justify-between overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
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
