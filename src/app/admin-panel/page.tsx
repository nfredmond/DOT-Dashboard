"use client"

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldIcon,
  UsersIcon,
  BrainIcon,
  DatabaseIcon,
  SettingsIcon,
  FileTextIcon,
  BarChartIcon,
  GlobeIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  KeyIcon,
  MapIcon,
  Database,
  Users,
  FileStack,
  Settings,
  Layers,
  ServerIcon,
  BrainCircuitIcon,
  ArrowLeftIcon,
  Zap,
  ExternalLink,
} from "lucide-react";
import { EnvironmentVariableManager } from "@/components/EnvironmentVariableManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SupabaseConfigManager } from "./components/SupabaseConfigManager";
import { OfflineDatabaseManager } from "./components/OfflineDatabaseManager";
import { MCPConfigManager } from "./components/MCPConfigManager";
import { UserManager } from "./components/UserManager";
import { ProjectManager } from "./components/ProjectManager";
import { useRouter } from "next/navigation";
import { ProjectScoringSettings } from "./components/ProjectScoringSettings";
import { MapSettingsManager } from "./components/MapSettingsManager";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  // Mock data for pending approvals
  const pendingApprovals = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@agency.gov",
      organization: "Caltrans District 4",
      role: "Planner",
      requestDate: "2023-07-25",
    },
    {
      id: 2,
      name: "Emily Johnson",
      email: "emily.johnson@planningmanager.org",
      organization: "Sacramento Area Council of Governments",
      role: "Manager",
      requestDate: "2023-07-24",
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "michael.chen@dot.ca.gov",
      organization: "California Department of Transportation",
      role: "Engineer",
      requestDate: "2023-07-23",
    },
  ];

  // Mock data for recent activities
  const recentActivities = [
    {
      id: 1,
      user: {
        name: "Alex Johnson",
        avatar: "https://github.com/yusufhilmi.png",
      },
      action: "Updated project scoring criteria",
      timestamp: "2023-07-25T14:32:00",
      details: "Modified weights for sustainability factors",
    },
    {
      id: 2,
      user: {
        name: "Maria Rodriguez",
        avatar: "https://github.com/furkanksl.png",
      },
      action: "Added new project",
      timestamp: "2023-07-25T11:15:00",
      details: "Created Highway 101 Expansion project",
    },
    {
      id: 3,
      user: {
        name: "David Chen",
        avatar: "https://github.com/identicons/app.png",
      },
      action: "Generated report",
      timestamp: "2023-07-24T16:45:00",
      details: "Q2 2023 Transportation Plan Update",
    },
    {
      id: 4,
      user: {
        name: "Sarah Wilson",
        avatar: "https://github.com/yusufhilmi.png",
      },
      action: "Approved user account",
      timestamp: "2023-07-24T10:20:00",
      details: "Approved account for james.taylor@agency.gov",
    },
    {
      id: 5,
      user: {
        name: "James Taylor",
        avatar: "https://github.com/furkanksl.png",
      },
      action: "Modified LLM settings",
      timestamp: "2023-07-23T15:10:00",
      details: "Updated prompt templates for grant evaluations",
    },
  ];

  // Mock data for system stats
  const systemStats = [
    {
      title: "Total Users",
      value: "127",
      change: "+12%",
      icon: UsersIcon,
      color: "text-blue-500",
    },
    {
      title: "Active Projects",
      value: "42",
      change: "+4%",
      icon: FileTextIcon,
      color: "text-green-500",
    },
    {
      title: "LLM Requests",
      value: "1,245",
      change: "+28%",
      icon: BrainIcon,
      color: "text-purple-500",
    },
    {
      title: "Storage Used",
      value: "45.8 GB",
      change: "+15%",
      icon: DatabaseIcon,
      color: "text-orange-500",
    },
  ];

  // Mock data for admin quick links
  const quickLinks = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: UsersIcon,
      link: "/user-management",
    },
    {
      title: "LLM Settings",
      description: "Configure AI models and prompt templates",
      icon: BrainIcon,
      link: "/llm-settings",
    },
    {
      title: "Scoring Criteria",
      description: "Customize project evaluation methodologies",
      icon: BarChartIcon,
      link: "/project-scoring",
    },
    {
      title: "API Integrations",
      description: "Manage external data connections",
      icon: GlobeIcon,
      link: "/api-integrations",
    },
    {
      title: "Audit Logs",
      description: "Review system activity and changes",
      icon: ClockIcon,
      link: "/audit-logs",
    },
    {
      title: "Report Templates",
      description: "Create and edit report templates",
      icon: FileTextIcon,
      link: "/report-templates",
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => router.push('/homepage')}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div>
          <h1
            className="text-3xl font-bold tracking-tight flex items-center"
          >
            <ShieldIcon className="mr-2 h-8 w-8 text-blue-500" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage system settings, users, and configurations
          </p>
        </div>

        <Tabs
          defaultValue="users"
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-9 w-full mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="scoring" className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="env-vars" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="supabase" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Supabase</span>
            </TabsTrigger>
            <TabsTrigger value="offline-db" className="flex items-center gap-2">
              <ServerIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Offline DB</span>
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-2">
              <BrainCircuitIcon className="h-4 w-4" />
              <span className="hidden sm:inline">MCP</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Map Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManager />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-8">
            <ProjectManager />
          </TabsContent>
          
          <TabsContent value="scoring" className="space-y-8">
            <ProjectScoringSettings />
          </TabsContent>
          
          <TabsContent value="env-vars" className="space-y-8">
            <EnvironmentVariableManager />
          </TabsContent>
          
          <TabsContent value="supabase" className="mt-0">
            <SupabaseConfigManager />
          </TabsContent>
          
          <TabsContent value="offline-db" className="mt-0">
            <OfflineDatabaseManager />
          </TabsContent>
          
          <TabsContent value="mcp" className="mt-0">
            <MCPConfigManager />
          </TabsContent>
          
          <TabsContent value="agents" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>AI Agent Management</CardTitle>
                <CardDescription>
                  Configure and manage OpenAI Agent capabilities including computer and browser access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
                  <h3 className="font-medium text-lg mb-2">Agent Tools</h3>
                  <p className="text-muted-foreground mb-4">
                    Access the dedicated Agent Tools interface to test and utilize computer access and web browsing capabilities
                  </p>
                  <Button 
                    className="gap-2" 
                    onClick={() => router.push('/agent-tools')}
                  >
                    <Zap className="h-4 w-4" />
                    Open Agent Tools
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                <div className="rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
                  <h3 className="font-medium text-lg mb-2">Agent Configuration</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up API keys, access controls, and configure tool permissions for the OpenAI Agents SDK
                  </p>
                  <div className="flex flex-col gap-4 max-w-lg">
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">API Key Status:</span>
                      <Badge variant="outline" className="justify-self-start flex items-center gap-1">
                        <CheckIcon className="h-3 w-3 text-green-500" />
                        Configured
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">Computer Access:</span>
                      <Badge variant="outline" className="justify-self-start flex items-center gap-1 bg-green-50">
                        <CheckIcon className="h-3 w-3 text-green-500" />
                        Enabled
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                      <span className="text-sm font-medium">Browser Access:</span>
                      <Badge variant="outline" className="justify-self-start flex items-center gap-1 bg-green-50">
                        <CheckIcon className="h-3 w-3 text-green-500" />
                        Enabled
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="layers" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Map Settings</CardTitle>
                <CardDescription>
                  Manage maps, base layers, and KMZ file uploads for different users and agencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapSettingsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
