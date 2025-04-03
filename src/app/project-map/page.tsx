"use client";

import { useState, useEffect } from 'react';
import { MapboxProjectMappingWrapper } from '@/app/components/MapboxProjectMappingWrapper';
import { ProjectsProvider, useProjects } from '@/contexts/ProjectsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Project } from '@/types/project';

// Main content component that will have access to the ProjectsContext
function ProjectMapContent() {
  const [ready, setReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const context = useProjects();
  
  // Ensure context is defined before destructuring
  if (!context) {
    throw new Error('ProjectMapContent must be used within a ProjectsProvider');
  }
  
  const { projects, filteredProjects, setFilteredProjects } = context;
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wait for client-side rendering
  useEffect(() => {
    setReady(true);
  }, []);
  
  // Filter projects when search term changes
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project: Project) => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects, setFilteredProjects]);
  
  // Handle project marker click
  const handleMarkerClick = (project: Project) => {
    setSelectedProject(project);
  };
  
  // Get appropriate color based on project status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-orange-100 text-orange-800';
      case 'Design': return 'bg-blue-100 text-blue-800';
      case 'Environmental': return 'bg-teal-100 text-teal-800';
      case 'RightOfWay': return 'bg-purple-100 text-purple-800';
      case 'Construction': return 'bg-red-100 text-red-800';
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get appropriate color based on project category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Highway': return 'bg-blue-100 text-blue-800';
      case 'Transit': return 'bg-purple-100 text-purple-800';
      case 'Bicycle': return 'bg-green-100 text-green-800';
      case 'Pedestrian': return 'bg-yellow-100 text-yellow-800';
      case 'Multimodal': return 'bg-indigo-100 text-indigo-800';
      case 'Safety': return 'bg-red-100 text-red-800';
      case 'Bridge': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Project Map</h1>
          <p className="text-muted-foreground">Interactive map showing all projects</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Projects</SheetTitle>
                <SheetDescription>
                  Filter the map by project status, category, or other criteria
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <div className="space-y-4">
                  {/* Filter controls would go here */}
                  <p className="text-sm text-muted-foreground">Filter functionality coming soon</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative bg-gray-100">
        <div className="absolute inset-0">
          {ready && (
            <MapboxProjectMappingWrapper 
              height="100%"
              width="100%"
              initialMapZoom={12}
              initialMapCenter={[-121.0149, 39.2615]} // Nevada City, CA (lng, lat)
              projects={filteredProjects}
              selectedProject={selectedProject}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
        
        {/* Project info panel */}
        {selectedProject && (
          <div className="absolute bottom-4 right-4 w-[350px] max-w-[90vw] bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setSelectedProject(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(selectedProject.status)}>
                {selectedProject.status}
              </Badge>
              <Badge className={getCategoryColor(selectedProject.category)}>
                {selectedProject.category}
              </Badge>
            </div>
            
            <p className="mt-2 text-sm text-gray-700">{selectedProject.description}</p>
            
            <div className="mt-3 text-sm">
              <div className="flex items-center text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {selectedProject.location || 'No location specified'}
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Start Date: </span>
                {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">End Date: </span>
                {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">Budget: </span>
                ${selectedProject.allocatedBudget?.toLocaleString() || 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">Priority: </span>
                {selectedProject.priority}
              </div>
            </div>
            
            <div className="mt-4">
              <Button className="w-full">View Project Details</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides the ProjectsContext
export default function ProjectMapPage() {
  return (
    <ProjectsProvider>
      <ProjectMapContent />
    </ProjectsProvider>
  );
}
