"use client"

import React, { useState, useEffect } from 'react';
import { ProjectMapping } from '../components/ProjectMapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, PlusIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  address?: string;
  category?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
}

export default function ProjectMappingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Mock projects data (in a real app, this would come from an API)
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: "Highway 101 Expansion",
      description: "Expansion of Highway 101 to reduce congestion",
      latitude: 34.42083,
      longitude: -119.698189,
      status: "In Progress",
      address: "Santa Barbara, CA",
      category: "Highway",
      budget: "$24M",
      startDate: "2023-05-15",
      endDate: "2024-12-31"
    },
    {
      id: '2',
      name: "Downtown Transit Center",
      description: "New transit center to improve public transportation access",
      latitude: 38.581572,
      longitude: -121.4944,
      status: "Planning",
      address: "Sacramento, CA",
      category: "Transit",
      budget: "$12M",
      startDate: "2024-01-10",
      endDate: "2025-06-30"
    },
    {
      id: '3',
      name: "Bike Lane Network",
      description: "Network of protected bike lanes throughout the city",
      latitude: 37.774929,
      longitude: -122.419418,
      status: "Completed",
      address: "San Francisco, CA",
      category: "Active",
      budget: "$5M",
      startDate: "2022-03-01",
      endDate: "2023-09-15"
    },
    {
      id: '4',
      name: "Bridge Retrofit Project",
      description: "Seismic retrofit of major bridge",
      latitude: 37.82604,
      longitude: -122.4225,
      status: "In Progress",
      address: "San Francisco, CA",
      category: "Highway",
      budget: "$35M",
      startDate: "2023-07-20",
      endDate: "2025-08-01"
    },
  ]);

  // Filter projects based on active tab and search query
  const filteredProjects = projects.filter(project => {
    const categoryMatch = activeTab === "all" || 
                           project.category?.toLowerCase() === activeTab.toLowerCase();
    const searchMatch = !searchQuery || 
                        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Style configurations
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case 'planning': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case 'completed': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Mapping
          </h1>
          <p className="text-muted-foreground">
            Visualize and manage transportation projects with geospatial tools
          </p>
        </div>
        
        <div className="h-[calc(100vh-200px)] relative flex overflow-hidden border rounded-lg bg-background">
          {/* Projects Sidebar */}
          <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all ${sidebarOpen ? 'w-80' : 'w-0'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-8 w-8 p-0">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-3">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="highway">Highway</TabsTrigger>
                  <TabsTrigger value="transit">Transit</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <Input 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredProjects.map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition hover:shadow ${selectedProject?.id === project.id ? 'border-primary' : ''}`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{project.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {project.description.substring(0, 60)}
                          {project.description.length > 60 ? "..." : ""}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.budget && (
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{project.address}</span>
                        <span>{project.budget}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button className="w-full" onClick={handleAddProject}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="flex-1 relative">
            {!sidebarOpen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(true)} 
                className="absolute top-4 left-4 z-50 bg-white shadow-md"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            
            <ProjectMapping 
              projects={filteredProjects}
              initialCenter={[37.7749, -122.4194]} // San Francisco
              initialZoom={6}
              height="100%"
              width="100%"
            />
          </div>
          
          {/* Project Details Panel */}
          {selectedProject && (
            <div className="absolute bottom-4 right-4 z-[2000] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedProject.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <Badge className={getStatusBadgeColor(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                      <p className="text-sm font-medium">{selectedProject.category}</p>
                    </div>
                    
                    {selectedProject.budget && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                        <p className="text-sm font-medium">{selectedProject.budget}</p>
                      </div>
                    )}
                    
                    {selectedProject.startDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Timeline</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedProject.startDate).toLocaleDateString()} - 
                          {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'Ongoing'}
                        </p>
                      </div>
                    )}
                    
                    {selectedProject.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-sm font-medium">{selectedProject.address}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/projects/${selectedProject.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 