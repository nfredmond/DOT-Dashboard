"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects, type Project } from '@/contexts/ProjectsContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Calendar as CalendarIcon, Map, Building, Users, DollarSign, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';

const ProjectWizard: React.FC = () => {
  const router = useRouter();
  const { addProject, projects } = useProjects();
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  // Initialize with empty form data
  const [projectData, setProjectData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'Planning',
    category: 'Highway',
    coordinates: {
      latitude: 34.45,
      longitude: -119.7
    },
    location: '',
    allocatedBudget: 1000000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // One year ahead
  });
  
  // Check for pending project data from the quick form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('pendingProjectData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setProjectData(prev => ({
            ...prev,
            ...parsedData
          }));
          // Clear the stored data to avoid reusing it accidentally
          localStorage.removeItem('pendingProjectData');
        } catch (error) {
          console.error('Error parsing stored project data:', error);
        }
      }
    }
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'coordinates') {
        setProjectData((prev) => {
          // Ensure coordinates object exists with default values
          const currentCoordinates = prev.coordinates || { latitude: 34.45, longitude: -119.7 };
          
          return {
            ...prev,
            coordinates: {
              ...currentCoordinates,
              [child]: value
            }
          };
        });
      }
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'coordinates') {
        setProjectData((prev) => {
          // Ensure coordinates object exists with default values
          const currentCoordinates = prev.coordinates || { latitude: 34.45, longitude: -119.7 };
          
          return {
            ...prev,
            coordinates: {
              ...currentCoordinates,
              [child]: parseFloat(value) || 0 // Ensure we always have a number, default to 0 if NaN
            }
          };
        });
      }
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0 // Default to 0 if NaN
      }));
    }
  };
  
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: projectData.name || 'New Project',
      description: projectData.description || 'Project description',
      status: projectData.status || 'Planning',
      category: projectData.category || 'Highway',
      coordinates: projectData.coordinates,
      location: projectData.location || 'California',
      allocatedBudget: projectData.allocatedBudget || 1000000,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      // Create a default point geometry based on coordinates
      geometry: {
        type: 'Point',
        coordinates: [
          projectData.coordinates?.longitude || -119.7,
          projectData.coordinates?.latitude || 34.45
        ]
      }
    };
    
    // Add the project to the central context
    addProject(newProject);
    
    // Show success message
    setSuccess(true);
    
    // Redirect after a short delay
    setTimeout(() => {
      router.push('/project-mapping-wrapper');
    }, 2000);
  };
  
  // Render success message
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader className="bg-green-50 border-b">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <CardTitle className="text-green-700">Project Created Successfully!</CardTitle>
                <CardDescription>
                  Your project has been added to the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <p className="mb-4">
              The project "{projectData.name}" has been created and is now visible on the map.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm opacity-70">{projectData.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm opacity-70">{projectData.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm opacity-70">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  }).format(projectData.allocatedBudget || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm opacity-70">{projectData.location}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/projects/new')}
            >
              Add Another Project
            </Button>
            <Button
              onClick={() => router.push('/project-mapping-wrapper')}
            >
              View on Map
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Render wizard steps
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Step {currentStep} of 5: {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Location & Timeline' :
                  currentStep === 3 ? 'Budget & Funding' :
                  currentStep === 4 ? 'Project Details' : 'Review & Submit'
                }
              </CardDescription>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(step => (
                <div 
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === currentStep ? 'bg-primary' : 
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={projectData.name || ''}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={projectData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Describe the project and its objectives"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      value={projectData.category || 'Highway'}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="Highway">Highway</option>
                      <option value="Transit">Transit</option>
                      <option value="Bridge">Bridge</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Planning Study">Planning Study</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={projectData.status || 'Planning'}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="Planning">Planning</option>
                      <option value="Construction">Construction</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Location & Timeline */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Project Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={projectData.location || ''}
                    onChange={handleInputChange}
                    placeholder="City, State"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coordinates.latitude">Latitude</Label>
                    <Input
                      id="coordinates.latitude"
                      name="coordinates.latitude"
                      type="number"
                      step="0.00001"
                      value={projectData.coordinates?.latitude || ''}
                      onChange={handleNumericInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coordinates.longitude">Longitude</Label>
                    <Input
                      id="coordinates.longitude"
                      name="coordinates.longitude"
                      type="number"
                      step="0.00001"
                      value={projectData.coordinates?.longitude || ''}
                      onChange={handleNumericInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={projectData.startDate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Estimated Completion</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={projectData.endDate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <Map className="inline mr-2 h-4 w-4" />
                    We'll display your project at these coordinates on the map. Make sure they're accurate.
                  </p>
                </div>
              </div>
            )}
            
            {/* Step 3: Budget & Funding */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allocatedBudget">Estimated Budget</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </div>
                    <Input
                      id="allocatedBudget"
                      name="allocatedBudget"
                      type="number"
                      step="1000"
                      className="pl-8"
                      value={projectData.allocatedBudget || ''}
                      onChange={handleNumericInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Funding Source</Label>
                  <RadioGroup defaultValue="mixed">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="federal" id="federal" />
                      <Label htmlFor="federal">Federal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="state" id="state" />
                      <Label htmlFor="state">State</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local" id="local" />
                      <Label htmlFor="local">Local</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed">Mixed Sources</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <DollarSign className="inline mr-2 h-4 w-4" />
                    Budget information helps prioritize projects and track funding allocations.
                  </p>
                </div>
              </div>
            )}
            
            {/* Step 4: Project Details */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <RadioGroup defaultValue="new">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new">New Construction</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="improvement" id="improvement" />
                      <Label htmlFor="improvement">Improvement</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maintenance" id="maintenance" />
                      <Label htmlFor="maintenance">Maintenance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="study" id="study" />
                      <Label htmlFor="study">Planning Study</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <RadioGroup defaultValue="medium">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high">High Priority</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium Priority</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low">Low Priority</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g. safety, congestion, freight"
                  />
                  <p className="text-xs text-gray-500">Separate with commas</p>
                </div>
              </div>
            )}
            
            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm opacity-70">{projectData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm opacity-70">{projectData.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm opacity-70">{projectData.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm opacity-70">{projectData.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Timeline</p>
                      <p className="text-sm opacity-70">
                        {projectData.startDate && projectData.endDate ? 
                          `${new Date(projectData.startDate).toLocaleDateString()} to ${new Date(projectData.endDate).toLocaleDateString()}` : 
                          'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Budget</p>
                      <p className="text-sm opacity-70">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0
                        }).format(projectData.allocatedBudget || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm">{projectData.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Coordinates</h3>
                  <p className="text-sm">
                    Latitude: {projectData.coordinates?.latitude}, 
                    Longitude: {projectData.coordinates?.longitude}
                  </p>
                </div>
                
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Ready to Submit</AlertTitle>
                  <AlertDescription>
                    Review the information above and click submit to create this project
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={prevStep}
                >
                  <ArrowLeftCircle className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/project-mapping-wrapper')}
                >
                  Cancel
                </Button>
              )}
              
              {currentStep < 5 ? (
                <Button 
                  type="button"
                  onClick={nextStep}
                >
                  Next
                  <ArrowRightCircle className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit"
                >
                  Submit Project
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectWizard; 