"use client"

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis } from "recharts";
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  ArrowUpDownIcon,
  InfoIcon,
} from "lucide-react";

export default function ProjectScoring() {
  const [sortBy, setSortBy] = useState("score");
  const [filterCategory, setFilterCategory] = useState("all");

  // Mock data for projects
  const projects = [
    {
      id: 1,
      name: "Highway 101 Expansion",
      category: "Highway",
      location: "Santa Barbara County",
      budget: "$24.5M",
      scores: {
        safety: 85,
        equity: 70,
        sustainability: 65,
        congestion: 90,
        costEffectiveness: 80,
      },
    },
    {
      id: 2,
      name: "Downtown Transit Center",
      category: "Transit",
      location: "Sacramento",
      budget: "$12.8M",
      scores: {
        safety: 75,
        equity: 90,
        sustainability: 85,
        congestion: 70,
        costEffectiveness: 65,
      },
    },
    {
      id: 3,
      name: "Bike Lane Network Expansion",
      category: "Active Transportation",
      location: "San Francisco",
      budget: "$5.3M",
      scores: {
        safety: 80,
        equity: 85,
        sustainability: 95,
        congestion: 60,
        costEffectiveness: 75,
      },
    },
    {
      id: 4,
      name: "Bridge Retrofit Project",
      category: "Bridge",
      location: "Oakland",
      budget: "$18.2M",
      scores: {
        safety: 95,
        equity: 60,
        sustainability: 70,
        congestion: 65,
        costEffectiveness: 75,
      },
    },
    {
      id: 5,
      name: "Light Rail Extension",
      category: "Transit",
      location: "San Jose",
      budget: "$32.1M",
      scores: {
        safety: 70,
        equity: 80,
        sustainability: 85,
        congestion: 85,
        costEffectiveness: 60,
      },
    },
  ];

  // Calculate total score for each project
  const projectsWithTotalScore = projects.map((project) => {
    const scores = project.scores;
    const totalScore = Math.round(
      scores.safety * 0.25 +
        scores.equity * 0.15 +
        scores.sustainability * 0.2 +
        scores.congestion * 0.25 +
        scores.costEffectiveness * 0.15,
    );
    return { ...project, totalScore };
  });

  // Sort projects based on selected criteria
  const sortedProjects = [...projectsWithTotalScore].sort((a, b) => {
    if (sortBy === "score") {
      return b.totalScore - a.totalScore;
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "budget") {
      return (
        parseFloat(b.budget.replace(/[^0-9.-]+/g, "")) -
        parseFloat(a.budget.replace(/[^0-9.-]+/g, ""))
      );
    }
    return 0;
  });

  // Filter projects by category if needed
  const filteredProjects =
    filterCategory === "all"
      ? sortedProjects
      : sortedProjects.filter(
          (p) => p.category.toLowerCase() === filterCategory.toLowerCase(),
        );

  // Data for charts
  const criteriaWeightData = [
    { name: "Safety", value: 25 },
    { name: "Congestion", value: 25 },
    { name: "Sustainability", value: 20 },
    { name: "Equity", value: 15 },
    { name: "Cost Effectiveness", value: 15 },
  ];

  const topProjectsData = sortedProjects.slice(0, 3).map((project) => ({
    name:
      project.name.length > 20
        ? project.name.substring(0, 20) + "..."
        : project.name,
    score: project.totalScore,
  }));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Highway":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Transit":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "Active Transportation":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Bridge":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Scoring
        </h1>
        <p className="text-muted-foreground">
          Evaluate and prioritize transportation projects based on multiple
          criteria
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Scoring Criteria Weights</CardTitle>
            <CardDescription>
              Current weighting for project evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="aspect-[none] h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Pie
                  data={criteriaWeightData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {criteriaWeightData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--chart-${index + 1}))`}
                      id={`jcv36x_${index}`}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Scoring Projects</CardTitle>
            <CardDescription>
              Highest ranked transportation projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="aspect-[none] h-[200px]"
            >
              <BarChart data={topProjectsData}>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                />
                <Bar
                  dataKey="score"
                  fill="hsl(var(--chart-1))"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring Actions</CardTitle>
            <CardDescription>
              Tools for project evaluation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">
              Run LLM Assessment
            </Button>
            <Button variant="outline" className="w-full">
              Customize Scoring Criteria
            </Button>
            <Button variant="outline" className="w-full">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export Scoring Report
            </Button>
            <div className="pt-2">
              <p
                className="text-sm text-muted-foreground flex items-center"
              >
                <InfoIcon className="h-4 w-4 mr-1" />
                Last updated: July 18, 2023
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <CardTitle>Project Scoring Table</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <SearchIcon
                  className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Search projects..."
                  className="pl-8 w-full sm:w-[200px]"
                />
              </div>
              <Select
                defaultValue="all"
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Categories
                  </SelectItem>
                  <SelectItem value="highway">
                    Highway
                  </SelectItem>
                  <SelectItem value="transit">
                    Transit
                  </SelectItem>
                  <SelectItem value="active transportation">
                    Active Transportation
                  </SelectItem>
                  <SelectItem value="bridge">
                    Bridge
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  Project Name
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    <span>Total Score</span>
                    <ArrowUpDownIcon
                      className="ml-2 h-4 w-4 cursor-pointer"
                      onClick={() =>
                        setSortBy(sortBy === "score" ? "name" : "score")
                      }
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => (
                <TableRow key={project.id} id={`glfi6c_${index}`}>
                  <TableCell className="font-medium" id={`jku456_${index}`}>
                    {project.name}
                  </TableCell>
                  <TableCell id={`1s2x9a_${index}`}>
                    <Badge
                      className={getCategoryColor(project.category)}
                      id={`dtol99_${index}`}
                    >
                      {project.category}
                    </Badge>
                  </TableCell>
                  <TableCell id={`3z1d67_${index}`}>
                    {project.location}
                  </TableCell>
                  <TableCell id={`u4g9wl_${index}`}>{project.budget}</TableCell>
                  <TableCell className="text-right" id={`x5i8ep_${index}`}>
                    <div
                      className="flex flex-col items-end"
                      id={`q2gwah_${index}`}
                    >
                      <span className="font-bold" id={`4dgqmq_${index}`}>
                        {project.totalScore}/100
                      </span>
                      <Progress
                        value={project.totalScore}
                        className="h-2 w-24 mt-1"
                        id={`3txlro_${index}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right" id={`x2mmrg_${index}`}>
                    <Button variant="ghost" size="sm" id={`zrbvjd_${index}`}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
