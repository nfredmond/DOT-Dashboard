"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Project } from "@/types/project";
import { dispatchProjectEvent } from "@/lib/map/project-map-integration";

// Context type definition
export type ProjectsContextType = {
  projects: Project[];
  filteredProjects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProjectById: (projectId: string) => Project | undefined;
  setFilteredProjects: (projects: Project[]) => void;
  clearFilters: () => void;
};

// Create context with default values
const ProjectsContext = createContext<ProjectsContextType>({
  projects: [],
  filteredProjects: [],
  addProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
  getProjectById: () => undefined,
  setFilteredProjects: () => {},
  clearFilters: () => {},
});

// Define event names for project changes
export const PROJECT_EVENTS = {
  ADDED: 'project-added',
  UPDATED: 'project-updated',
  DELETED: 'project-deleted',
}

// Provider component
export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // Initialize projects from localStorage or API on mount
  useEffect(() => {
    // In a real app, you would fetch from your API
    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        setFilteredProjects(parsedProjects);
      } catch (error) {
        console.error("Failed to parse projects:", error);
      }
    }
  }, []);

  // Save projects to localStorage when they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("projects", JSON.stringify(projects));
    }
  }, [projects]);

  // Custom event dispatcher
  const dispatchProjectEvent = useCallback((eventName: string, project: Project) => {
    const event = new CustomEvent(eventName, { detail: project });
    window.dispatchEvent(event);
  }, []);

  // Add a new project
  const addProject = useCallback((project: Project) => {
    setProjects(prevProjects => {
      // Generate ID if not provided
      const newProject = {
        ...project,
        id: project.id || `project-${Date.now()}`
      };
      const updatedProjects = [...prevProjects, newProject];
      
      // Dispatch event for map integration
      dispatchProjectEvent('add', newProject);
      
      return updatedProjects;
    });
  }, [dispatchProjectEvent]);

  // Update an existing project
  const updateProject = useCallback((project: Project) => {
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p => 
        p.id === project.id ? project : p
      );
      
      // Dispatch event for map integration
      dispatchProjectEvent('update', project);
      
      return updatedProjects;
    });
  }, [dispatchProjectEvent]);

  // Delete a project
  const deleteProject = useCallback((projectId: string) => {
    setProjects(prevProjects => {
      const projectToDelete = prevProjects.find(p => p.id === projectId);
      const updatedProjects = prevProjects.filter(p => p.id !== projectId);
      
      // Dispatch event for map integration
      if (projectToDelete) {
        dispatchProjectEvent('delete', projectToDelete);
      }
      
      return updatedProjects;
    });
  }, [dispatchProjectEvent]);

  // Get a project by ID
  const getProjectById = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId);
  }, [projects]);

  // Clear filters and show all projects
  const clearFilters = useCallback(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // Context value
  const value = {
    projects,
    filteredProjects,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    setFilteredProjects,
    clearFilters,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

// Hook for using the projects context
export const useProjects = () => useContext(ProjectsContext); 