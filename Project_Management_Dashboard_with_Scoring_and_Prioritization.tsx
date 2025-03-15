"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  HelpCircle,
  MapPin,
  Plus,
  Search,
  Settings,
  TrendingUp,
} from "lucide-react"

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Sample data for charts and tables
  const projectScoreData = [
    { name: "Safety", score: 85, fill: "hsl(var(--chart-1))" },
    { name: "Equity", score: 70, fill: "hsl(var(--chart-2))" },
    { name: "Sustainability", score: 60, fill: "hsl(var(--chart-3))" },
    { name: "Congestion", score: 75, fill: "hsl(var(--chart-4))" },
    { name: "Cost Efficiency", score: 65, fill: "hsl(var(--chart-5))" },
  ]

  const projectStatusData = [
    { name: "Completed", value: 12 },
    { name: "In Progress", value: 18 },
    { name: "Planned", value: 25 },
    { name: "Delayed", value: 8 },
  ]

  const fundingAllocationData = [
    { month: "Jan", allocated: 1.2, spent: 0.8 },
    { month: "Feb", allocated: 1.5, spent: 1.2 },
    { month: "Mar", allocated: 1.8, spent: 1.5 },
    { month: "Apr", allocated: 2.1, spent: 1.7 },
    { month: "May", allocated: 2.4, spent: 1.9 },
    { month: "Jun", allocated: 2.7, spent: 2.2 },
  ]

  const recentProjects = [
    {
      id: 1,
      name: "Main Street Bike Lane Extension",
      status: "In Progress",
      priority: "High",
      score: 82,
      funding: "$1.2M",
      location: "Downtown",
      dueDate: "Aug 15, 2023",
    },
    {
      id: 2,
      name: "North County Transit Hub",
      status: "Planned",
      priority: "Medium",
      score: 75,
      funding: "$3.5M",
      location: "North County",
      dueDate: "Dec 10, 2023",
    },
    {
      id: 3,
      name: "Highway 101 Safety Improvements",
      status: "In Progress",
      priority: "High",
      score: 88,
      funding: "$2.8M",
      location: "Highway 101",
      dueDate: "Oct 22, 2023",
    },
    {
      id: 4,
      name: "Westside Pedestrian Bridge",
      status: "Delayed",
      priority: "Medium",
      score: 70,
      funding: "$1.5M",
      location: "Westside",
      dueDate: "Nov 30, 2023",
    },
    {
      id: 5,
      name: "Downtown Transit Signal Priority",
      status: "Completed",
      priority: "Low",
      score: 65,
      funding: "$0.8M",
      location: "Downtown",
      dueDate: "Jul 05, 2023",
    },
  ]

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ]

  const statusColors = {
    "Completed": "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500",
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-500",
    "Planned": "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500",
    "Delayed": "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500",
  }

  const priorityColors = {
    "High": "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500",
    "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500",
    "Low": "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500",
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-6 bg-background">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transportation Project Dashboard</h1>
              <p className="text-muted-foreground">Manage, analyze, and prioritize transportation projects</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-8 h-10 w-[200px] md:w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-[400px] grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">63</div>
                    <p className="text-xs text-muted-foreground">
                      +8% from last quarter
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Funding Allocated</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$12.4M</div>
                    <p className="text-xs text-muted-foreground">
                      +15% from last quarter
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">76.2</div>
                    <p className="text-xs text-muted-foreground">
                      +3.5 points from last quarter
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">68%</div>
                    <p className="text-xs text-muted-foreground">
                      +5% from last quarter
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Scores */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Scoring Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <BarChart
                        data={projectScoreData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {projectScoreData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Project Status */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[250px]">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value, name, props) => [`${value} projects`, props.payload.name]}
                        />
                      </PieChart>
                    </ChartContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {projectStatusData.map((status, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{status.name}: {status.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Funding Allocation */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Funding Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <LineChart
                        data={fundingAllocationData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value) => [`$${value}M`]}
                        />
                        <Line
                          type="monotone"
                          dataKey="allocated"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="spent"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ChartContainer>
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-[hsl(var(--chart-1))]" />
                        <span className="text-sm">Allocated</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-[hsl(var(--chart-2))]" />
                        <span className="text-sm">Spent</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Projects</CardTitle>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Project Name</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Priority</th>
                          <th className="text-left py-3 px-4 font-medium">Score</th>
                          <th className="text-left py-3 px-4 font-medium">Funding</th>
                          <th className="text-left py-3 px-4 font-medium">Location</th>
                          <th className="text-left py-3 px-4 font-medium">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProjects.map((project) => (
                          <tr key={project.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{project.name}</td>
                            <td className="py-3 px-4">
                              <Badge className={statusColors[project.status]}>
                                {project.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={priorityColors[project.priority]}>
                                {project.priority}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Progress value={project.score} className="w-[60px]" />
                                <span>{project.score}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{project.funding}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                {project.location}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                {project.dueDate}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projects Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Projects tab content would go here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reports Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Reports tab content would go here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}