import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { useProjects } from '@/contexts/ProjectsContext';
import { 
  storeDraftProject, 
  loadDraftProject, 
  clearDraftProject 
} from '@/lib/map/project-map-integration';

/**
 * Project wizard step type
 */
export type ProjectWizardStep = 
  | 'basic-info' 
  | 'location' 
  | 'details' 
  | 'budget' 
  | 'schedule' 
  | 'documents' 
  | 'review';

/**
 * Hook for managing the project creation wizard
 * @returns Object with wizard state and functions
 */
export function useProjectWizard() {
  const router = useRouter();
  const { addProject } = useProjects();
  const [currentStep, setCurrentStep] = useState<ProjectWizardStep>('basic-info');
  const [projectData, setProjectData] = useState<Partial<Project>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the hook mounts, check for a draft project
  useEffect(() => {
    const draft = loadDraftProject();
    if (draft) {
      setProjectData(draft);
    }
  }, []);

  // Update project data for a specific field
  const updateProjectField = useCallback(<K extends keyof Project>(
    field: K, 
    value: Project[K]
  ) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));

    // Save to draft
    storeDraftProject({
      ...projectData,
      [field]: value
    });
  }, [projectData]);

  // Update multiple fields at once
  const updateProjectFields = useCallback((
    updates: Partial<Project>
  ) => {
    setProjectData(prev => ({
      ...prev,
      ...updates
    }));

    // Save to draft
    storeDraftProject({
      ...projectData,
      ...updates
    });
  }, [projectData]);

  // Move to the next step
  const nextStep = useCallback(() => {
    // Save current data
    storeDraftProject(projectData);

    // Determine next step
    switch (currentStep) {
      case 'basic-info':
        setCurrentStep('location');
        break;
      case 'location':
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('budget');
        break;
      case 'budget':
        setCurrentStep('schedule');
        break;
      case 'schedule':
        setCurrentStep('documents');
        break;
      case 'documents':
        setCurrentStep('review');
        break;
      case 'review':
        // Submit the project
        submitProject();
        break;
    }
  }, [currentStep, projectData]);

  // Move to the previous step
  const prevStep = useCallback(() => {
    // Save current data
    storeDraftProject(projectData);

    // Determine previous step
    switch (currentStep) {
      case 'location':
        setCurrentStep('basic-info');
        break;
      case 'details':
        setCurrentStep('location');
        break;
      case 'budget':
        setCurrentStep('details');
        break;
      case 'schedule':
        setCurrentStep('budget');
        break;
      case 'documents':
        setCurrentStep('schedule');
        break;
      case 'review':
        setCurrentStep('documents');
        break;
    }
  }, [currentStep, projectData]);

  // Jump to a specific step
  const goToStep = useCallback((step: ProjectWizardStep) => {
    storeDraftProject(projectData);
    setCurrentStep(step);
  }, [projectData]);

  // Submit the project
  const submitProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate the project data
      if (!projectData.name || !projectData.description) {
        throw new Error('Project name and description are required');
      }

      if (!projectData.coordinates && !projectData.geometry) {
        throw new Error('Project location is required');
      }

      // Create a proper Project object
      const newProject = {
        id: `project-${Date.now()}`,
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'Planning',
        category: projectData.category || 'Other',
        type: projectData.type || 'transportation',
        ...projectData
      } as Project;

      // Add the project
      addProject(newProject);

      // Clear the draft
      clearDraftProject();

      // Reset the form
      setProjectData({});

      // Redirect to the projects page
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  }, [projectData, addProject, router]);

  // Cancel the wizard
  const cancelWizard = useCallback(() => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel? Your changes will be lost.'
    );
    
    if (confirmCancel) {
      clearDraftProject();
      setProjectData({});
      router.push('/projects');
    }
  }, [router]);

  return {
    currentStep,
    projectData,
    isLoading,
    error,
    updateProjectField,
    updateProjectFields,
    nextStep,
    prevStep,
    goToStep,
    submitProject,
    cancelWizard
  };
} 