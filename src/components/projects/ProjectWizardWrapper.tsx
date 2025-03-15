"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { ProjectWizard } from './ProjectWizard';
import { Project } from '@/types/project';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectWizardWrapperProps {
  projectId?: string; // Optional - if provided, we're in edit mode
  initialProject?: Partial<Project>; // Optional - initial project data for edit mode
  isLoading?: boolean; // Optional - loading state for edit mode
  error?: string; // Optional - error message
  onBack?: () => void; // Optional - function to go back
}

export function ProjectWizardWrapper({
  projectId,
  initialProject,
  isLoading,
  error,
  onBack
}: ProjectWizardWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State to track project completion
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Handle save and submission with useCallback to avoid unnecessary re-renders
  const handleSubmitProject = useCallback(async (projectData: Partial<Project>) => {
    try {
      // Show loading toast
      toast({
        title: projectId ? "Updating project..." : "Creating project...",
        description: "Please wait while we process your request.",
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For a real implementation:
      // const response = await fetch(projectId ? `/api/projects/${projectId}` : '/api/projects', {
      //   method: projectId ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(projectData)
      // });
      // const data = await response.json();
      
      // Show success message
      toast({
        title: projectId ? "Project updated successfully" : "Project created successfully",
        description: projectId 
          ? `The project "${projectData.name}" has been updated.` 
          : `The project "${projectData.name}" has been created.`,
        variant: "default",
      });
      
      // Set completion state
      setIsCompleted(true);
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/projects');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your project. Please try again.",
        variant: "destructive",
      });
    }
  }, [projectId, toast, router]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading project data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => router.push('/projects')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-green-600 dark:text-green-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {projectId ? "Project Updated" : "Project Created"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {projectId
            ? "Your project has been successfully updated. Redirecting to projects page..."
            : "Your project has been successfully created. Redirecting to projects page..."}
        </p>
        <Button onClick={() => router.push('/projects')} variant="outline">
          Go to Projects Now
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      {onBack && (
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}
      
      {projectId ? (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Editing Project</AlertTitle>
          <AlertDescription>
            You are currently editing an existing project. All changes will be applied when you submit.
          </AlertDescription>
        </Alert>
      ) : null}
      
      <ProjectWizard
        projectId={projectId}
        initialData={initialProject}
        onSubmit={handleSubmitProject}
      />
    </div>
  );
} 