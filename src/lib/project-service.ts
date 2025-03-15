import { Project } from "@/types/project";
import { useState, useEffect } from "react";

// Define the ProjectDataIngestionRequest interface
interface ProjectDataIngestionRequest {
  rawData: string;
  format: 'json' | 'csv' | 'text' | 'html';
  source: string;
  projectIds?: string[]; // IDs of projects to update
  createNew?: boolean;   // Whether to create new projects
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateBeforeImport?: boolean;
  };
}

// Define the ProjectTemplate interface
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultValues: Partial<Project>;
  defaultFields?: string[]; // Fields to include by default
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  organizationId?: string;
}

// We'll use a simple id generator instead of uuid since it's not installed
// In a real application, you would install uuid with: npm install uuid @types/uuid
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Mock data store (would be replaced with actual API calls)
const projects: Project[] = [];
const templates: ProjectTemplate[] = [];

/**
 * Get all projects visible to the current user
 */
export async function getProjects(): Promise<Project[]> {
  // In a real app, this would call an API with proper filtering based on user access
  return [...projects];
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const project = projects.find(p => p.id === id);
  return project || null;
}

/**
 * Create a new project
 */
export async function createProject(projectData: Partial<Project>): Promise<Project> {
  // Create a new project with provided data and default values
  const newProject: Project = {
    id: generateId(),
    name: projectData.name || "Untitled Project",
    description: projectData.description || "",
    status: projectData.status || "Planned", // Changed from "Draft" to "Planned" which is in ProjectStatus type
    category: projectData.category || "Other",
    phases: projectData.phases || [],
    leadAgency: projectData.leadAgency || "",
    partners: projectData.partners || [],
    startDate: projectData.startDate || new Date().toISOString(),
    endDate: projectData.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCost: projectData.estimatedCost || 0,
    allocatedBudget: projectData.allocatedBudget || 0,
    fundingSources: projectData.fundingSources || [],
    coordinates: projectData.coordinates || { latitude: 0, longitude: 0 },
    mapType: projectData.mapType || "standard",
    location: projectData.location || "",
    isPublic: projectData.isPublic !== undefined ? projectData.isPublic : true,
    tags: projectData.tags || [],
    attachments: projectData.attachments || [],
    milestones: projectData.milestones || [],
    priority: projectData.priority || "Medium",
    accessControl: projectData.accessControl || [],
    environmentalDocumentation: projectData.environmentalDocumentation || { leadAgency: "" },
    nepaStatus: projectData.nepaStatus || "Not Started",
    ceqaStatus: projectData.ceqaStatus || "Not Started",
    environmentalDocumentType: projectData.environmentalDocumentType || "Not Required",
    environmentalClearanceDate: projectData.environmentalClearanceDate || "",
    pseBudget: projectData.pseBudget || 0,
    ceBudget: projectData.ceBudget || 0,
    geojson: projectData.geojson || null,
    boundingBox: projectData.boundingBox,
    scores: projectData.scores || {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0
    },
    benefits: projectData.benefits || {
      vmtReduction: 0,
      ghgReduction: 0,
      jobsCreated: 0,
      safetyImprovement: 0,
      congestionReduction: 0,
      benefitCostRatio: 0,
      economicBenefitEstimate: 0,
      improvedAccessibility: 0
    },
    organizationId: projectData.organizationId,
    organizationName: projectData.organizationName,
    isReviewCompleted: projectData.isReviewCompleted || false
  };
  
  // Add to local store (in a real app, this would be an API call)
  projects.push(newProject);
  
  return newProject;
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  // Find the project by ID
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) {
    return null; // Project not found
  }

  // Merge with existing project data
  const existingProject = projects[index];
  const updatedProject: Project = {
    ...existingProject,
    ...projectData,
    // Always update the timestamps
    updatedAt: new Date().toISOString()
  };

  // Update in local store
  projects[index] = updatedProject;

  return updatedProject;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  // Remove from local store
  projects.splice(index, 1);
  
  return true;
}

/**
 * Process AI-powered data ingestion for projects
 */
export async function processProjectDataIngestion(request: ProjectDataIngestionRequest): Promise<{
  created: Project[];
  updated: Project[];
  errors: string[];
}> {
  const result = {
    created: [] as Project[],
    updated: [] as Project[],
    errors: [] as string[]
  };

  try {
    // In a real implementation, this would call an LLM API to analyze the raw data
    // and convert it into structured project data
    
    // For demonstration purposes, we'll simulate this with a simple parser
    
    // This is a placeholder for LLM processing
    // In reality, you would:
    // 1. Call an API endpoint for your LLM service
    // 2. Send the raw data and context about project structures
    // 3. Process the structured response
    
    const parsedData = simulateLLMProcessing(request.rawData);
    
    // Update existing projects if projectIds provided
    if (request.projectIds && request.projectIds.length > 0) {
      for (const projectId of request.projectIds) {
        try {
          const updatedProject = await updateProject(projectId, parsedData);
          if (updatedProject) {
            result.updated.push(updatedProject);
          } else {
            result.errors.push(`Project with ID ${projectId} not found`);
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown error';
          result.errors.push(`Failed to update project ${projectId}: ${errorMessage}`);
        }
      }
    }
    
    // Create new project if requested
    if (request.createNew) {
      try {
        const newProject = await createProject(parsedData);
        result.created.push(newProject);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        result.errors.push(`Failed to create new project: ${errorMessage}`);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    result.errors.push(`Data ingestion failed: ${errorMessage}`);
  }
  
  return result;
}

/**
 * Get all project templates
 */
export async function getProjectTemplates(): Promise<ProjectTemplate[]> {
  // In a real app, this would call an API
  return [...templates];
}

/**
 * Get a project template by ID
 */
export async function getProjectTemplateById(id: string): Promise<ProjectTemplate | null> {
  const template = templates.find(t => t.id === id);
  return template || null;
}

/**
 * Create a project from a template
 */
export async function createProjectFromTemplate(templateId: string, overrides: Partial<Project> = {}): Promise<Project | null> {
  const template = await getProjectTemplateById(templateId);
  if (!template) return null;
  
  const projectData = {
    ...template.defaultFields,
    ...overrides
  };
  
  return createProject(projectData);
}

/**
 * Simulate LLM processing for demo purposes
 * In a real implementation, this would be replaced with an actual API call to an LLM service
 */
function simulateLLMProcessing(rawData: string): Partial<Project> {
  // This is a simplified mock of what an LLM might extract
  // In a real app, this would be a call to an AI service
  
  // Just return some default data based on the input text
  return {
    name: extractProjectName(rawData),
    description: extractDescription(rawData),
    category: extractCategory(rawData),
    estimatedCost: extractTotalCost(rawData),
    allocatedBudget: extractTotalCost(rawData) * 0.8, // 80% of total cost for example
    location: "California", // Default location
    status: "Planned" as const,
    priority: "Medium" as const
  };
}

// Helper functions to simulate text extraction
// In reality, these would be replaced by LLM processing
function extractProjectName(text: string): string {
  const nameMatch = text.match(/Project(?:\s+Name)?[:|\s]+([^\n.]+)/i);
  return nameMatch ? nameMatch[1].trim() : "Extracted Project";
}

function extractDescription(text: string): string {
  const descMatch = text.match(/Description[:|\s]+([^\n]+(?:\n[^\n]+){0,3})/i);
  return descMatch ? descMatch[1].trim() : "";
}

function extractCategory(text: string): any {
  if (text.toLowerCase().includes("highway")) return "Highway";
  if (text.toLowerCase().includes("transit")) return "Transit";
  if (text.toLowerCase().includes("bike") || text.toLowerCase().includes("bicycle")) return "Bicycle";
  if (text.toLowerCase().includes("pedestrian") || text.toLowerCase().includes("sidewalk")) return "Pedestrian";
  return "Other";
}

function extractTotalCost(text: string): number {
  const costMatch = text.match(/cost[:|\s]+[\$]?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m|k|thousand)?/i);
  if (!costMatch) return 0;
  
  let cost = parseFloat(costMatch[1].replace(/,/g, ''));
  
  // Adjust for units
  if (costMatch[0].toLowerCase().includes('million') || costMatch[0].toLowerCase().includes('m')) {
    cost *= 1000000;
  } else if (costMatch[0].toLowerCase().includes('k') || costMatch[0].toLowerCase().includes('thousand')) {
    cost *= 1000;
  }
  
  return cost;
}

/**
 * React hook to fetch and manage projects
 */
export function useProjects() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refetch: fetchProjects };
} 