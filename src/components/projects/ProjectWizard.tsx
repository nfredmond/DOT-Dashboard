"use client"

import React, { useState } from 'react';
import { useProjectWizard } from '@/contexts/ProjectWizardContext';
import { Project, createNewProject } from '@/types/project';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  FileEdit, 
  MapPin, 
  FileText, 
  BadgeDollarSign, 
  BarChart3, 
  ClipboardCheck,
  BrainCircuit
} from 'lucide-react';

// Import the actual wizard step components
import BasicInfoStep from './wizard-steps/BasicInfoStep';
import LocationStep from './wizard-steps/LocationStep';
import EnvironmentalStep from './wizard-steps/EnvironmentalStep';
import FundingStep from './wizard-steps/FundingStep';
import ScoringStep from './wizard-steps/ScoringStep';
import ReviewStep from './wizard-steps/ReviewStep';
import AiAssistance from './wizard-steps/AiAssistance';

// Define the interface for the component props
interface ProjectWizardProps {
  projectId?: string;
  initialData?: Partial<Project>;
  onSubmit: (data: Partial<Project>) => void;
}

// Define the Step interface for our custom stepper
interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function ProjectWizard({ projectId, initialData, onSubmit }: ProjectWizardProps) {
  // Use the project wizard context
  const { config, getEnabledSteps } = useProjectWizard();
  
  // Steps configuration
  const steps: Step[] = [
    { id: 'basic-info', label: 'Basic Info', icon: <FileEdit className="h-5 w-5" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="h-5 w-5" /> },
    { id: 'environmental', label: 'Environmental', icon: <FileText className="h-5 w-5" /> },
    { id: 'funding', label: 'Funding', icon: <BadgeDollarSign className="h-5 w-5" /> },
    { id: 'scoring', label: 'Scoring', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'review', label: 'Review', icon: <ClipboardCheck className="h-5 w-5" /> },
  ];
  
  // Filter steps based on enabled steps in config
  const enabledSteps = getEnabledSteps();
  const filteredSteps = steps.filter(step => {
    const configStep = enabledSteps.find(s => {
      switch(step.id) {
        case 'basic-info': return s.id === 'basic';
        case 'location': return s.id === 'location';
        case 'environmental': return s.id === 'environmental';
        case 'funding': return s.id === 'funding';
        case 'scoring': return s.id === 'scoring';
        case 'review': return s.id === 'custom'; // Using custom for review
        default: return false;
      }
    });
    return configStep?.enabled ?? true;
  });
  
  // State for wizard navigation and data
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [projectData, setProjectData] = useState<Partial<Project>>(initialData || createNewProject());
  const [errors, setErrors] = useState<string[]>([]);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
  
  // Get current step
  const currentStep = filteredSteps[currentStepIndex];
  
  // Function to handle data updates from each step
  const handleStepDataUpdate = (data: Partial<Project>) => {
    setProjectData(prev => ({ ...prev, ...data }));
  };
  
  // Function to navigate to the next step
  const handleNext = () => {
    // Validate current step
    const stepErrors = validateStep(currentStepIndex);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    // Clear errors and move to next step
    setErrors([]);
    setCurrentStepIndex(prev => Math.min(prev + 1, filteredSteps.length - 1));
  };
  
  // Function to navigate to the previous step
  const handlePrevious = () => {
    setErrors([]);
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };
  
  // Function to handle final submission
  const handleSubmit = () => {
    // Final validation
    const allErrors = validateAllSteps();
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }
    
    // Submit the data
    onSubmit(projectData);
  };
  
  // Map step id to context wizard category
  const getWizardCategory = (stepId: string) => {
    switch(stepId) {
      case 'basic-info': return 'basic';
      case 'location': return 'location';
      case 'environmental': return 'environmental';
      case 'funding': return 'funding';
      case 'scoring': return 'scoring';
      case 'review': return 'custom';
      default: return 'basic';
    }
  };
  
  // Function to validate the current step
  const validateStep = (stepIndex: number): string[] => {
    const stepId = filteredSteps[stepIndex]?.id;
    const errors: string[] = [];
    
    if (stepId === 'basic-info') {
      // Validate basic info
      if (!projectData.name?.trim()) {
        errors.push('Project name is required');
      }
      
      if (!projectData.description?.trim()) {
        errors.push('Project description is required');
      }
      
      if (!projectData.category) {
        errors.push('Project category is required');
      }
      
      if (!projectData.status) {
        errors.push('Project status is required');
      }
      
      if (!projectData.priority) {
        errors.push('Project priority is required');
      }
      
      if (!projectData.organizationName?.trim()) {
        errors.push('Organization is required');
      }
    }
    
    else if (stepId === 'location') {
      // Validate location
      if (!projectData.location?.trim()) {
        errors.push('Project location is required');
      }
      
      // Add more validations for coordinates if needed
    }
    
    else if (stepId === 'funding') {
      if (projectData.estimatedCost === undefined || projectData.estimatedCost < 0) {
        errors.push("Valid estimated cost is required");
      }
    }
    
    else if (stepId === 'environmental') {
      if (config.steps.find(s => s.id === 'environmental')?.required) {
        if (!projectData.environmentalDocumentType) {
          errors.push("Environmental document type is required");
        }
      }
    }
    
    else if (stepId === 'scoring') {
      if (config.steps.find(s => s.id === 'scoring')?.required) {
        if (!projectData.scores) {
          errors.push("Project scoring is required");
        }
      }
    }
    
    return errors;
  };
  
  // Function to validate all steps
  const validateAllSteps = (): string[] => {
    let allErrors: string[] = [];
    for (let i = 0; i < filteredSteps.length; i++) {
      const stepErrors = validateStep(i);
      allErrors = [...allErrors, ...stepErrors];
    }
    return allErrors;
  };
  
  // Function to apply AI suggestions
  const handleApplySuggestions = (suggestions: Partial<Project>) => {
    setProjectData(prev => ({ ...prev, ...suggestions }));
    setShowAiAssistant(false);
  };
  
  // Render the current step content
  const renderStepContent = () => {
    const step = filteredSteps[currentStepIndex];
    
    switch (step.id) {
      case 'basic-info':
        return (
          <BasicInfoStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      case 'location':
        return (
          <LocationStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      case 'environmental':
        return (
          <EnvironmentalStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      case 'funding':
        return (
          <FundingStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      case 'scoring':
        return (
          <ScoringStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      case 'review':
        return (
          <ReviewStep 
            projectData={projectData} 
            onSave={handleStepDataUpdate} 
            errors={errors} 
          />
        );
      default:
        return null;
    }
  };
  
  // Simple custom stepper component
  const CustomStepper = ({ steps, currentStep, onStepClick }: { 
    steps: Step[], 
    currentStep: number, 
    onStepClick: (index: number) => void 
  }) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div className="h-px bg-muted flex-1 min-w-[1rem] max-w-[2rem]" />
            )}
            <button
              type="button"
              onClick={() => onStepClick(index)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                ${index === currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : index < currentStep 
                    ? 'bg-muted hover:bg-muted/80' 
                    : 'bg-muted/50 hover:bg-muted/60'
                }
              `}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <CustomStepper 
            steps={filteredSteps} 
            currentStep={currentStepIndex} 
            onStepClick={setCurrentStepIndex} 
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
            <CardFooter className="border-t flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentStepIndex === filteredSteps.length - 1 ? (
                  <Button onClick={handleSubmit}>
                    <Save className="mr-2 h-4 w-4" />
                    {projectId ? 'Update Project' : 'Create Project'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6">
              {showAiAssistant ? (
                <AiAssistance
                  projectData={projectData}
                  currentStep={getWizardCategory(currentStep.id)}
                  onApplySuggestions={handleApplySuggestions}
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{currentStep.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {getStepDescription(currentStep.id)}
                    </p>
                    
                    {/* Progress indicators */}
                    <div className="mt-8 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Step completion</span>
                          <span className="font-medium">{getStepCompletion(currentStep.id, projectData)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${getStepCompletion(currentStep.id, projectData)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Overall completion</span>
                          <span className="font-medium">{getOverallCompletion(projectData, filteredSteps)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${getOverallCompletion(projectData, filteredSteps)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {config.allowAiAssistance && (
                    <div className="mt-8">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowAiAssistant(true)}
                      >
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Get AI Assistance
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get step description
function getStepDescription(stepId: string): string {
  switch (stepId) {
    case 'basic-info':
      return 'Provide essential details about your project including name, description, category, and priority.';
    case 'location':
      return 'Specify the project location, coordinates, and select the preferred map visualization type.';
    case 'environmental':
      return 'Enter environmental documentation information including NEPA/CEQA status and clearance dates.';
    case 'funding':
      return 'Add funding details including estimated cost, allocated budget, and funding sources.';
    case 'scoring':
      return 'Score your project across different criteria to determine priority and impact.';
    case 'review':
      return 'Review all project information before final submission.';
    default:
      return '';
  }
}

// Helper function to estimate step completion percentage
function getStepCompletion(stepId: string, data: Partial<Project>): number {
  switch (stepId) {
    case 'basic-info': {
      const fields = ['name', 'description', 'category', 'status', 'priority', 'startDate', 'endDate'];
      const filledFields = fields.filter(field => !!data[field as keyof Project]).length;
      return Math.round((filledFields / fields.length) * 100);
    }
    case 'location': {
      const hasLocation = !!data.location;
      const hasCoordinates = data.coordinates && (data.coordinates.latitude !== 0 || data.coordinates.longitude !== 0);
      const hasMapType = !!data.mapType;
      
      let filled = 0;
      if (hasLocation) filled++;
      if (hasCoordinates) filled++;
      if (hasMapType) filled++;
      
      return Math.round((filled / 3) * 100);
    }
    case 'environmental': {
      const fields = ['nepaStatus', 'ceqaStatus', 'environmentalDocumentType', 'environmentalClearanceDate'];
      const filledFields = fields.filter(field => !!data[field as keyof Project]).length;
      
      // Add extra points for environmental documentation details
      let documentationPoints = 0;
      if (data.environmentalDocumentation) {
        if (data.environmentalDocumentation.nepaDocumentNumber) documentationPoints += 0.33;
        if (data.environmentalDocumentation.ceqaDocumentNumber) documentationPoints += 0.33;
        if (data.environmentalDocumentation.leadAgency) documentationPoints += 0.33;
      }
      
      return Math.round(((filledFields + documentationPoints) / (fields.length + 1)) * 100);
    }
    case 'funding': {
      const baseFields = ['estimatedCost', 'allocatedBudget', 'pseBudget', 'ceBudget'];
      const filledBase = baseFields.filter(field => data[field as keyof Project] !== undefined).length;
      
      // Add extra points for funding sources
      const hasFundingSources = data.fundingSources && data.fundingSources.length > 0;
      
      return Math.round(((filledBase + (hasFundingSources ? 1 : 0)) / (baseFields.length + 1)) * 100);
    }
    case 'scoring': {
      if (!data.scores) return 0;
      
      const scoringCriteria = Object.keys(data.scores);
      if (scoringCriteria.length === 0) return 0;
      
      const filledScores = scoringCriteria.filter(key => (data.scores as any)[key] > 0).length;
      return Math.round((filledScores / scoringCriteria.length) * 100);
    }
    case 'review': {
      return data.isReviewCompleted ? 100 : 0;
    }
    default:
      return 0;
  }
}

// Helper function to calculate overall project completion
function getOverallCompletion(data: Partial<Project>, steps: Step[]): number {
  const stepIds = steps.map(step => step.id);
  
  const completions = stepIds.map(stepId => getStepCompletion(stepId, data));
  const total = completions.reduce((sum, value) => sum + value, 0);
  
  return Math.round(total / stepIds.length);
} 