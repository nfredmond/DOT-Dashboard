"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Project, ProjectStatus, ProjectCategory, ProjectPriority, EnvironmentalStatus, EnvironmentalDocumentType } from "@/types/project";
import { dispatchProjectEvent } from "@/lib/map/project-map-integration";

// Helper function to create sample projects with all required properties
const createSampleProjects = (): Project[] => {
  const commonProperties = {
    priority: "Medium" as ProjectPriority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCost: 0,
    pseBudget: 0,
    ceBudget: 0,
    environmentalDocumentation: {
      leadAgency: "Caltrans",
    },
    nepaStatus: "Not Required" as EnvironmentalStatus,
    ceqaStatus: "Not Required" as EnvironmentalStatus,
    environmentalDocumentType: "None" as EnvironmentalDocumentType,
    environmentalClearanceDate: new Date().toISOString(),
    phases: [],
    milestones: [],
    scores: {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0,
      environmental: 0,
      economic: 0,
      feasibility: 0,
      overall: 0,
    },
    benefits: {
      vmtReduction: 0,
      ghgReduction: 0,
      jobsCreated: 0,
      safetyImprovement: 0,
      congestionReduction: 0,
      benefitCostRatio: 0,
      economicBenefitEstimate: 0,
      improvedAccessibility: 0,
    },
    mapType: "roadmap",
    leadAgency: "Local DOT",
    partners: [],
    fundingSources: [],
    tags: [],
    attachments: [],
    isPublic: true,
    accessControl: [],
    organizationId: "org-1",
    createdBy: "system",
  };

  return [
    {
      ...commonProperties,
      id: '1',
      name: "Highway 101 Expansion",
      description: "Expansion of Highway 101 to reduce congestion",
      coordinates: { latitude: 34.42083, longitude: -119.698189 },
      status: 'Construction' as ProjectStatus,
      location: "Santa Barbara, CA",
      category: "Highway" as ProjectCategory,
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
      ...commonProperties,
      id: '2',
      name: "Downtown Light Rail",
      description: "New light rail system connecting downtown area",
      coordinates: { latitude: 34.41889, longitude: -119.694792 },
      status: 'Planning' as ProjectStatus,
      location: "Santa Barbara, CA",
      category: "Transit" as ProjectCategory,
      allocatedBudget: 12000000,
      startDate: "2024-01-10",
      endDate: "2025-06-30",
      geometry: {
        type: 'Point',
        coordinates: [-119.694792, 34.41889]
      }
    },
    {
      ...commonProperties,
      id: '3',
      name: "Waterfront Pedestrian Bridge",
      description: "Pedestrian bridge connecting the harbor to downtown",
      coordinates: { latitude: 34.40639, longitude: -119.685278 },
      status: 'Complete' as ProjectStatus,
      location: "Santa Barbara, CA",
      category: "Bicycle" as ProjectCategory,
      allocatedBudget: 5000000,
      startDate: "2022-03-01",
      endDate: "2023-09-15",
      geometry: {
        type: 'LineString',
        coordinates: [
          [-119.685278, 34.40639],
          [-119.691, 34.41],
          [-119.695, 34.415],
        ]
      }
    }
  ];
};

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

// Create the context
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Define event names for project changes
export const PROJECT_EVENTS = {
  ADDED: 'project-added',
  UPDATED: 'project-updated',
  DELETED: 'project-deleted',
}

// Provider component
export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // Initialize with sample projects on first load
  useEffect(() => {
    // Load projects from API or local storage in a real app
    // For now, initialize with sample data
    const sampleProjects = createSampleProjects();
    console.log('ProjectsContext: Initializing with sample projects:', sampleProjects.length);
    setProjects(sampleProjects);
  }, []);

  // Update filtered projects when projects change
  useEffect(() => {
    console.log('ProjectsContext: Projects updated, setting filtered projects:', projects.length);
    setFilteredProjects(projects);
    
    // Debugging: Log project details
    projects.forEach(project => {
      console.log(`Project: ${project.name}, Status: ${project.status}, Category: ${project.category}`);
    });
  }, [projects]);

  // Add a new project
  const addProject = useCallback((project: Project) => {
    setProjects(prevProjects => [...prevProjects, project]);
    dispatchProjectEvent('add', project);
  }, []);

  // Update an existing project
  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
    dispatchProjectEvent('update', updatedProject);
  }, []);

  // Delete a project
  const deleteProject = useCallback((projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (projectToDelete) {
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      dispatchProjectEvent('delete', projectToDelete);
    }
  }, [projects]);

  // Get a project by ID
  const getProjectById = useCallback((projectId: string) => {
    return projects.find(project => project.id === projectId);
  }, [projects]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilteredProjects(projects);
  }, [projects]);

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
};

// Hook for using the projects context
export const useProjects = () => useContext(ProjectsContext); 