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
} from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");

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
      email: "emily.johnson@rtpa.org",
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
        avatar: "https://github.com/polymet-ai.png",
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
    <div className="space-y-6">
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
        defaultValue="overview"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          className="grid w-full grid-cols-4 lg:grid-cols-6"
        >
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            Users
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects
          </TabsTrigger>
          <TabsTrigger value="llm">
            LLM Settings
          </TabsTrigger>
          <TabsTrigger value="reports" className="hidden lg:block">
            Reports
          </TabsTrigger>
          <TabsTrigger value="system" className="hidden lg:block">
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {systemStats.map((stat, index) => (
              <Card key={index} id={`s4adg5_${index}`}>
                <CardContent className="p-6" id={`tqg0hv_${index}`}>
                  <div
                    className="flex justify-between items-start"
                    id={`wn9ape_${index}`}
                  >
                    <div id={`t9782s_${index}`}>
                      <p
                        className="text-sm font-medium text-muted-foreground"
                        id={`14s71u_${index}`}
                      >
                        {stat.title}
                      </p>
                      <p
                        className="text-3xl font-bold mt-2"
                        id={`xlmkdz_${index}`}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="text-xs text-green-500 mt-1"
                        id={`3uey4g_${index}`}
                      >
                        {stat.change} from last month
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${stat.color}`}
                      id={`9mq4k2_${index}`}
                    >
                      <stat.icon className="h-5 w-5" id={`30kyrx_${index}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  User accounts awaiting administrator approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.map((approval, index) => (
                    <div
                      key={approval.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-md"
                      id={`nooab2_${index}`}
                    >
                      <div className="mb-3 sm:mb-0" id={`0qik6o_${index}`}>
                        <p className="font-medium" id={`2z0gd8_${index}`}>
                          {approval.name}
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                          id={`u1kibd_${index}`}
                        >
                          {approval.email}
                        </p>
                        <div
                          className="flex items-center mt-1"
                          id={`ah0czt_${index}`}
                        >
                          <Badge
                            variant="outline"
                            className="mr-2"
                            id={`ayrg76_${index}`}
                          >
                            {approval.role}
                          </Badge>
                          <span
                            className="text-xs text-muted-foreground"
                            id={`lbto29_${index}`}
                          >
                            {approval.organization}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex space-x-2 self-end sm:self-auto"
                        id={`efyre9_${index}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-500"
                          id={`7g4ch2_${index}`}
                        >
                          <XIcon
                            className="h-4 w-4 mr-1"
                            id={`e48syh_${index}`}
                          />
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          id={`grah7z_${index}`}
                        >
                          <CheckIcon
                            className="h-4 w-4 mr-1"
                            id={`nxt87k_${index}`}
                          />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Pending Approvals
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Latest administrative actions in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-md"
                      id={`5iz7eb_${index}`}
                    >
                      <Avatar className="h-8 w-8" id={`yww0td_${index}`}>
                        <AvatarImage
                          src={activity.user.avatar}
                          alt={activity.user.name}
                          id={`4lhwwu_${index}`}
                        />

                        <AvatarFallback id={`efjlzc_${index}`}>
                          {activity.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1" id={`qjiy46_${index}`}>
                        <div
                          className="flex justify-between items-start"
                          id={`r3uq1x_${index}`}
                        >
                          <p className="font-medium" id={`hq4pkq_${index}`}>
                            {activity.action}
                          </p>
                          <span
                            className="text-xs text-muted-foreground"
                            id={`1ttb55_${index}`}
                          >
                            {new Date(activity.timestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p
                          className="text-sm text-muted-foreground"
                          id={`fh8yda_${index}`}
                        >
                          {activity.details}
                        </p>
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          id={`yozx0f_${index}`}
                        >
                          By {activity.user.name} •{" "}
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Activities
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">
              Quick Actions
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {quickLinks.map((link, index) => (
                <Card
                  key={index}
                  className="hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = link.link;
                  }}
                  id={`xd6fxi_${index}`}
                >
                  <CardContent
                    className="p-6 flex items-start space-x-4"
                    id={`du1tak_${index}`}
                  >
                    <div
                      className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-blue-500`}
                      id={`8ubhmv_${index}`}
                    >
                      <link.icon className="h-5 w-5" id={`94s8td_${index}`} />
                    </div>
                    <div id={`c2ucnn_${index}`}>
                      <h3 className="font-medium" id={`6gk1s2_${index}`}>
                        {link.title}
                      </h3>
                      <p
                        className="text-sm text-muted-foreground mt-1"
                        id={`i7roy9_${index}`}
                      >
                        {link.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Important notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-md flex items-start"
                >
                  <AlertCircleIcon
                    className="h-5 w-5 mr-3 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">
                      Database Backup Scheduled
                    </p>
                    <p className="text-sm mt-1">
                      A system maintenance is scheduled for July 30, 2023, at
                      2:00 AM PDT. The system may be unavailable for up to 30
                      minutes during this time.
                    </p>
                  </div>
                </div>
                <div
                  className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md flex items-start"
                >
                  <AlertCircleIcon
                    className="h-5 w-5 mr-3 mt-0.5"
                  />
                  <div>
                    <p className="font-medium">
                      LLM API Usage Near Limit
                    </p>
                    <p className="text-sm mt-1">
                      The current billing cycle's API usage is at 85% of the
                      allocated limit. Consider upgrading the plan or
                      implementing usage restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </div>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-center py-20 text-muted-foreground"
              >
                User management interface would be displayed here. Navigate to
                the User Management page for full functionality.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/user-management";
                }}
              >
                Go to User Management
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Project Administration</CardTitle>
                  <CardDescription>
                    Manage projects, templates, and scoring criteria
                  </CardDescription>
                </div>
                <Button>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Project administration interface would be displayed here.
                Navigate to the Project Scoring page for full functionality.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/project-scoring";
                }}
              >
                Go to Project Scoring
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>LLM Configuration</CardTitle>
                  <CardDescription>
                    Manage AI models, API keys, and prompt templates
                  </CardDescription>
                </div>
                <Button>
                  <BrainIcon className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-center py-20 text-muted-foreground"
              >
                LLM configuration interface would be displayed here. Navigate to
                the LLM Settings page for full functionality.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/llm-settings";
                }}
              >
                Go to LLM Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Report Administration</CardTitle>
                  <CardDescription>
                    Manage report templates and generation settings
                  </CardDescription>
                </div>
                <Button>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Report administration interface would be displayed here.
                Navigate to the Report Templates page for full functionality.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/report-templates";
                }}
              >
                Go to Report Templates
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    Manage system settings, backups, and maintenance
                  </CardDescription>
                </div>
                <Button>
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-center py-20 text-muted-foreground"
              >
                System configuration interface would be displayed here. This
                includes database settings, backups, and system maintenance
                options.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View System Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
