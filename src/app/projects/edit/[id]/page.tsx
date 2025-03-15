"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectWizardProvider } from '@/contexts/ProjectWizardContext';
import { ProjectWizardWrapper } from '@/components/projects/ProjectWizardWrapper';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Project } from '@/types/project';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [projectData, setProjectData] = useState<Partial<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const projectId = params?.id as string;
  
  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided");
      setLoading(false);
      return;
    }
    
    // Fetch project data - this would be an API call in a real app
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For this demo, create mock data
        // In a real app, this would be:
        // const response = await fetch(`/api/projects/${projectId}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockProject: Partial<Project> = {
          id: projectId,
          name: "Sample Transportation Project",
          description: "This is a sample transportation project for demonstration purposes.",
          category: "Highway",
          status: "In Progress",
          priority: "High",
          location: "San Francisco Bay Area, CA",
          leadAgency: "Caltrans",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tags: ["Infrastructure", "Highway Improvement", "Safety"],
          estimatedCost: 5000000,
          allocatedBudget: 3500000,
          scores: {
            safety: 80,
            equity: 65,
            climate: 70,
            congestion: 85,
            costEffectiveness: 75,
            multimodal: 60
          },
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        };
        
        setProjectData(mockProject);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  const handleBack = () => {
    router.push('/projects');
  };
  
  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground">
            Update project details and save changes when complete.
          </p>
        </div>
        
        <ProjectWizardProvider>
          <ProjectWizardWrapper
            projectId={projectId}
            initialProject={projectData || undefined}
            isLoading={loading}
            error={error || undefined}
            onBack={handleBack}
          />
        </ProjectWizardProvider>
      </div>
    </ProtectedRoute>
  );
} 