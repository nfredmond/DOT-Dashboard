"use client"

import React, { useState } from 'react';
import { MapboxProjectMappingWrapper } from '@/app/components/MapboxProjectMappingWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, PlusIcon, ExternalLink, BrainIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { ProjectMapLLMIntegration } from './components/ProjectMapLLMIntegration';
import { Project } from '@/types/project';
import { cn } from '@/lib/utils';

// Define a geometry type for mapping
export type GeometryType = 
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

// Create a simplified type for the mapping page
export type MappingProject = Partial<Project> & {
  id: string;
  name: string;
  description: string;
  coordinates: { latitude: number; longitude: number };
  location: string;
  status: string;
  category: string;
  allocatedBudget: number;
  startDate: string;
  endDate: string;
  geometry?: GeometryType;
};

export default function ProjectMappingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<MappingProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLLMAnalysis, setShowLLMAnalysis] = useState(false);
  const router = useRouter();

  // Mock projects data (in a real app, this would come from an API)
  const [projects, setProjects] = useState<MappingProject[]>([
    {
      id: '1',
      name: "Highway 101 Expansion",
      description: "Expansion of Highway 101 to reduce congestion",
      coordinates: { latitude: 34.42083, longitude: -119.698189 },
      status: 'Construction',
      location: "Santa Barbara, CA",
      category: "Highway",
      allocatedBudget: 24000000,
      startDate: "2023-05-15",
      endDate: "2024-12-31",
      geometry: {
        type: 'LineString',
        coordinates: [
          [-119.698189, 34.42083],
          [-119.702, 34.43],
        ]
      }
    },
    {
      id: '2',
      name: "Downtown Light Rail",
      description: "New light rail system connecting downtown area",
      coordinates: { latitude: 34.41889, longitude: -119.694792 },
      status: 'Planning',
      location: "Santa Barbara, CA",
      category: "Transit",
      allocatedBudget: 12000000,
      startDate: "2024-01-10",
      endDate: "2025-06-30",
      geometry: {
        type: 'Point',
        coordinates: [-121.4944, 38.581572]
      }
    },
    {
      id: '3',
      name: "Waterfront Pedestrian Bridge",
      description: "Pedestrian bridge connecting the harbor to downtown",
      coordinates: { latitude: 34.40639, longitude: -119.685278 },
      status: 'Complete',
      location: "Santa Barbara, CA",
      category: "Bicycle",
      allocatedBudget: 5000000,
      startDate: "2022-03-01",
      endDate: "2023-09-15",
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.419418, 37.774929],
          [-122.415, 37.78],
          [-122.41, 37.785],
          [-122.405, 37.79]
        ]
      }
    },
    {
      id: '4',
      name: "Bike Lane Expansion",
      description: "Adding protected bike lanes throughout the city",
      coordinates: { latitude: 34.4275, longitude: -119.713889 },
      status: 'Construction',
      location: "Santa Barbara, CA",
      category: "Bridge",
      allocatedBudget: 35000000,
      startDate: "2023-07-20",
      endDate: "2025-08-01",
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.4225, 37.82604],
          [-122.42, 37.83],
          [-122.415, 37.835]
        ]
      }
    },
    {
      id: '5',
      name: "Highway 192 Repair",
      description: "Repairing damage from recent storms",
      coordinates: { latitude: 34.455, longitude: -119.746944 },
      status: 'Planning',
      location: "Santa Barbara County, CA",
      category: "Planning Study",
      allocatedBudget: 1200000,
      startDate: "2024-04-01",
      endDate: "2025-03-31",
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.408, 37.786],
          [-122.405, 37.786],
          [-122.405, 37.79],
          [-122.408, 37.79],
          [-122.408, 37.786]
        ]]
      }
    },
  ]);

  // Filter projects based on active tab and search query
  const filteredProjects = projects.filter(project => {
    const categoryMatch = activeTab === "all" || project.category.toLowerCase() === activeTab.toLowerCase();
    const searchMatch = !searchQuery || 
                        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Style configurations
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return "secondary";
      case 'planning':
        return "default";
      case 'completed':
        return "outline";
      default:
        return "secondary";
    }
  };

  // Handle adding a new project
  const handleAddProject = () => {
    router.push('/projects/new');
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle project selection from sidebar
  const handleProjectSelect = (project: MappingProject) => {
    setSelectedProject(project);
  };

  // Handle project selection from map
  const handleMarkerClick = (mapProject: any) => {
    // Find the corresponding project in our projects array
    const project = projects.find(p => p.id === mapProject.id);
    if (project) {
      setSelectedProject(project);
    }
  };

  // Handle view details click
  const handleViewDetails = () => {
    if (selectedProject) {
      router.push(`/projects/${selectedProject.id}`);
    }
  };

  // Handler for updating a project after LLM analysis
  const handleUpdateProject = (updatedProject: MappingProject) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
    setSelectedProject(updatedProject);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-full">
        {/* Left sidebar */}
        <div className={`border-r bg-card ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg">Projects</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => router.push('/projects/new')}>
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSidebarOpen(false)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Projects filter and search */}
          <div className="p-4 border-b">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="mb-4"
            />
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Projects list */}
          <div className="flex-1 overflow-auto">
            <div className="space-y-1 p-2">
              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  className={`p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${selectedProject?.id === project.id ? 'bg-accent' : ''}`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">{project.name}</h3>
                    <Badge variant={getStatusBadgeColor(project.status)}>{project.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{project.category}</Badge>
                    <span className="text-xs text-muted-foreground">${project.allocatedBudget.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Map header */}
          <div className="p-4 border-b flex justify-between items-center bg-card">
            <div className="flex items-center">
              {!sidebarOpen && (
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <h1 className="font-bold text-xl">Project Mapping</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLLMAnalysis(!showLLMAnalysis)}>
                <BrainIcon className="h-4 w-4 mr-2" />
                {showLLMAnalysis ? 'Hide AI Analysis' : 'Show AI Analysis'}
              </Button>
              <Button size="sm" onClick={handleAddProject}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>
          
          {/* Map and details area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Map container */}
            <div className={cn("flex-grow overflow-hidden relative", sidebarOpen ? "" : "w-full")}>
                            <MapboxProjectMappingWrapper                 projects={filteredProjects}                 selectedProject={selectedProject}                onMarkerClick={handleMarkerClick}              />
              
              {/* Collapsed sidebar toggle */}
              {!sidebarOpen && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-4 left-4 z-10" 
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Show Projects
                </Button>
              )}
            </div>
            
            {/* Project details sidebar */}
            {selectedProject && (
              <div className={`border-l bg-card w-96 overflow-auto transition-all duration-300 ${showLLMAnalysis ? 'p-0' : 'p-4'}`}>
                {showLLMAnalysis ? (
                  // LLM Analysis panel
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h2 className="font-semibold flex items-center">
                          <BrainIcon className="h-5 w-5 mr-2 text-amber-500" />
                          AI Analysis
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowLLMAnalysis(false)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        AI-powered insights for {selectedProject.name}
                      </p>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <ProjectMapLLMIntegration 
                        selectedProject={selectedProject} 
                        onUpdateProject={handleUpdateProject}
                      />
                    </div>
                  </div>
                ) : (
                  // Project details panel
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-lg">{selectedProject.name}</h2>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Description</h3>
                        <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Location</h3>
                          <p className="text-sm text-muted-foreground">{selectedProject.location}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">Status</h3>
                          <Badge variant={getStatusBadgeColor(selectedProject.status)}>
                            {selectedProject.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">Category</h3>
                          <p className="text-sm text-muted-foreground">{selectedProject.category}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">Budget</h3>
                          <p className="text-sm text-muted-foreground">${selectedProject.allocatedBudget.toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">Start Date</h3>
                          <p className="text-sm text-muted-foreground">{selectedProject.startDate}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">End Date</h3>
                          <p className="text-sm text-muted-foreground">{selectedProject.endDate}</p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full text-sm"
                          onClick={() => setShowLLMAnalysis(true)}
                        >
                          <BrainIcon className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </Button>
                        <Button 
                          variant="default" 
                          className="w-full text-sm"
                          onClick={handleViewDetails}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 