"use client"

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectCard } from "(components)/project-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis } from "recharts";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  AlertCircleIcon,
} from "lucide-react";

const projectStatusData = [
  { name: "Jan", active: 40, completed: 24 },
  { name: "Feb", active: 30, completed: 13 },
  { name: "Mar", active: 20, completed: 18 },
  { name: "Apr", active: 27, completed: 10 },
  { name: "May", active: 18, completed: 15 },
  { name: "Jun", active: 23, completed: 12 },
  { name: "Jul", active: 34, completed: 17 },
];

const fundingData = [
  { name: "Jan", amount: 1200000 },
  { name: "Feb", amount: 1800000 },
  { name: "Mar", amount: 1400000 },
  { name: "Apr", amount: 2200000 },
  { name: "May", amount: 1600000 },
  { name: "Jun", amount: 2400000 },
  { name: "Jul", amount: 2000000 },
];

export default function Dashboard() {
  const recentProjects = [
    {
      id: 1,
      title: "Highway 101 Expansion",
      description:
        "Widening of Highway 101 between Santa Barbara and Ventura to reduce congestion",
      status: "In Progress",
      score: 85,
      category: "Highway",
      budget: "$24.5M",
      location: "Santa Barbara County",
      lastUpdated: "2023-07-15",
    },
    {
      id: 2,
      title: "Downtown Transit Center",
      description:
        "Construction of a new transit hub in downtown Sacramento with improved accessibility",
      status: "Planning",
      score: 78,
      category: "Transit",
      budget: "$12.8M",
      location: "Sacramento",
      lastUpdated: "2023-07-10",
    },
    {
      id: 3,
      title: "Bike Lane Network Expansion",
      description:
        "Adding 15 miles of protected bike lanes throughout San Francisco",
      status: "Approved",
      score: 92,
      category: "Active Transportation",
      budget: "$5.3M",
      location: "San Francisco",
      lastUpdated: "2023-07-05",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your transportation projects and planning activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              127
            </div>
            <p
              className="text-xs text-muted-foreground flex items-center"
            >
              <ArrowUpIcon
                className="mr-1 h-3 w-3 text-green-500"
              />
              <span className="text-green-500">
                12%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              42
            </div>
            <p
              className="text-xs text-muted-foreground flex items-center"
            >
              <ArrowUpIcon
                className="mr-1 h-3 w-3 text-green-500"
              />
              <span className="text-green-500">
                4%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle className="text-sm font-medium">
              Total Funding
            </CardTitle>
            <DollarSignIcon
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $245.8M
            </div>
            <p
              className="text-xs text-muted-foreground flex items-center"
            >
              <ArrowUpIcon
                className="mr-1 h-3 w-3 text-green-500"
              />
              <span className="text-green-500">
                18%
              </span>{" "}
              from last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <AlertCircleIcon
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              7
            </div>
            <p
              className="text-xs text-muted-foreground flex items-center"
            >
              <ArrowDownIcon
                className="mr-1 h-3 w-3 text-red-500"
              />
              <span className="text-red-500">
                3
              </span>{" "}
              from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>
              Monthly active vs. completed projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="aspect-[none] h-[250px]"
            >
              <BarChart data={projectStatusData}>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="active"
                  fill="hsl(var(--chart-1))"
                  radius={4}
                />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--chart-2))"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Funding Allocation</CardTitle>
            <CardDescription>
              Monthly funding trends in millions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="aspect-[none] h-[250px]"
            >
              <LineChart data={fundingData}>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={true}
                  radius={4}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Projects
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
