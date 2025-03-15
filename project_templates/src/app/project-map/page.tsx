"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayersIcon,
  ZoomInIcon,
  ZoomOutIcon,
  HomeIcon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
  MapPinIcon,
} from "lucide-react";

export default function ProjectMap() {
  const [mapType, setMapType] = useState("standard");
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);

  // Function to get color based on project type
  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "highway":
        return "bg-orange-500";
      case "transit":
        return "bg-indigo-500";
      case "active":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  // Mock projects data
  const projects = [
    {
      id: 1,
      name: "Highway 101 Expansion",
      lat: 34.42083,
      lng: -119.698189,
      type: "highway",
      status: "In Progress"
    },
    {
      id: 2,
      name: "Downtown Transit Center",
      lat: 38.581572,
      lng: -121.4944,
      type: "transit",
      status: "Planning"
    },
    {
      id: 3,
      name: "Bike Lane Network",
      lat: 37.774929,
      lng: -122.419418,
      type: "active",
      status: "Approved"
    },
    {
      id: 4,
      name: "Bridge Retrofit Project",
      lat: 37.82604,
      lng: -122.4225,
      type: "bridge",
      status: "In Progress"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Map
        </h1>
        <p className="text-muted-foreground">
          Visualize and manage transportation projects geographically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card
          className="lg:col-span-3 h-[calc(100vh-240px)] min-h-[500px] relative"
        >
          <CardHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                California Transportation Projects
              </CardTitle>
              <Tabs defaultValue="all" className="w-auto">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="highway">
                    Highway
                  </TabsTrigger>
                  <TabsTrigger value="transit">
                    Transit
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Active
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative h-full">
            {/* Map placeholder - in a real app, this would be a Leaflet map */}
            <div
              className="w-full h-full bg-gray-200 dark:bg-gray-700 relative"
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <p
                  className="text-gray-500 dark:text-gray-400 text-lg"
                >
                  Interactive map would be rendered here using Leaflet.js
                </p>

                {/* Sample project markers */}
                {projects.map((project, index) => (
                  <div
                    className="absolute"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                    }}
                    key={index}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-4 w-4 rounded-full ${getProjectTypeColor(
                              project.type
                            )} cursor-pointer`}
                          ></div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.status}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>

            {/* Map controls */}
            <div
              className="absolute top-4 right-4 flex flex-col space-y-2"
            >
              <Button variant="secondary" size="icon">
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <HomeIcon className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <LayersIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Map Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Map Type
                </label>
                <Select
                  defaultValue="standard"
                  onValueChange={setMapType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select map type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      Standard
                    </SelectItem>
                    <SelectItem value="satellite">
                      Satellite
                    </SelectItem>
                    <SelectItem value="terrain">
                      Terrain
                    </SelectItem>
                    <SelectItem value="traffic">
                      Traffic
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Layer Visibility
                </label>
                <Select
                  defaultValue="all"
                  onValueChange={setSelectedLayer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Layers
                    </SelectItem>
                    <SelectItem value="projects">
                      Projects Only
                    </SelectItem>
                    <SelectItem value="transit">
                      Transit Lines
                    </SelectItem>
                    <SelectItem value="bike">
                      Bike Lanes
                    </SelectItem>
                    <SelectItem value="highways">
                      Highways
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Search Location
                </label>
                <div className="relative">
                  <SearchIcon
                    className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    placeholder="Enter address or coordinates"
                    className="pl-8"
                  />
                </div>
              </div>

              <Button className="w-full">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter Projects
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="default" className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add New Project
              </Button>
              <Button variant="outline" className="w-full">
                Import Projects (GeoJSON)
              </Button>
              <Button variant="outline" className="w-full">
                Export Map Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
