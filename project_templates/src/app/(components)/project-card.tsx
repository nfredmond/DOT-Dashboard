"use client"

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPinIcon, CalendarIcon, DollarSignIcon } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  score: number;
  category: string;
  budget: string;
  location: string;
  lastUpdated: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Planning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Approved":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Highway":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Transit":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "Active Transportation":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          <Badge className={getCategoryColor(project.category)}>
            {project.category}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">
          {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p
          className="text-sm text-muted-foreground mb-4 line-clamp-2"
        >
          {project.description}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Project Score
            </span>
            <span
              className={`text-sm font-bold ${getScoreColor(project.score)}`}
            >
              {project.score}/100
            </span>
          </div>
          <Progress value={project.score} className="h-2" />

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center">
              <MapPinIcon
                className="h-4 w-4 mr-2 text-muted-foreground"
              />
              <span className="text-muted-foreground">
                {project.location}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSignIcon
                className="h-4 w-4 mr-2 text-muted-foreground"
              />
              <span className="text-muted-foreground">
                {project.budget}
              </span>
            </div>
            <div className="flex items-center">
              <CalendarIcon
                className="h-4 w-4 mr-2 text-muted-foreground"
              />
              <span className="text-muted-foreground">
                Updated: {new Date(project.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
