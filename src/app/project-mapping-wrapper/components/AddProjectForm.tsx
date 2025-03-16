"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects, type Project } from '@/contexts/ProjectsContext';
import { PlusCircle, MapPin, Edit3 } from 'lucide-react';

export function AddProjectForm() {
  const router = useRouter();
  const { addProject } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [useQuickAdd, setUseQuickAdd] = useState(true);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'Planning',
    category: 'Highway',
    coordinates: {
      latitude: 34.45,
      longitude: -119.7
    },
    allocatedBudget: 1000000,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'coordinates') {
        setFormData((prev) => {
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
      setFormData(prev => ({
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
        setFormData((prev) => {
          const currentCoordinates = prev.coordinates || { latitude: 34.45, longitude: -119.7 };
          
          return {
            ...prev,
            coordinates: {
              ...currentCoordinates,
              [child]: parseFloat(value) || 0
            }
          };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a unique ID
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: formData.name || 'New Project',
      description: formData.description || 'Project description',
      status: formData.status || 'Planning',
      category: formData.category || 'Highway',
      coordinates: formData.coordinates!,
      location: 'California',
      allocatedBudget: formData.allocatedBudget || 1000000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // One year ahead
      // Create a default point geometry
      geometry: {
        type: 'Point',
        coordinates: [
          formData.coordinates?.longitude || -119.7,
          formData.coordinates?.latitude || 34.45
        ]
      }
    };
    
    // Add the project to the context store
    addProject(newProject);
    
    // Reset form and close dialog
    resetForm();
    setIsOpen(false);
  };

  const handleFullWizardClick = () => {
    // Store the current form data in localStorage
    localStorage.setItem('pendingProjectData', JSON.stringify(formData));
    
    // Navigate to the full project wizard
    router.push('/projects/new');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Planning',
      category: 'Highway',
      coordinates: {
        latitude: 34.45,
        longitude: -119.7
      },
      allocatedBudget: 1000000,
    });
    setUseQuickAdd(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="absolute top-4 left-4 z-50"
          variant="default"
          onClick={() => setIsOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        
        <div className="flex space-x-2 my-4">
          <Button 
            variant={useQuickAdd ? "default" : "outline"} 
            onClick={() => setUseQuickAdd(true)}
            size="sm"
          >
            <MapPin className="mr-1 h-4 w-4" />
            Quick Add
          </Button>
          <Button 
            variant={!useQuickAdd ? "default" : "outline"}
            onClick={() => setUseQuickAdd(false)}
            size="sm"
          >
            <Edit3 className="mr-1 h-4 w-4" />
            Full Wizard
          </Button>
        </div>
        
        {useQuickAdd ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="p-2 border rounded-md"
                  >
                    <option value="Highway">Highway</option>
                    <option value="Transit">Transit</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Planning Study">Planning Study</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="p-2 border rounded-md"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Construction">Construction</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="coordinates.latitude">Latitude</Label>
                  <Input
                    id="coordinates.latitude"
                    name="coordinates.latitude"
                    type="number"
                    step="0.00001"
                    value={formData.coordinates?.latitude || 0}
                    onChange={handleNumericInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="coordinates.longitude">Longitude</Label>
                  <Input
                    id="coordinates.longitude"
                    name="coordinates.longitude"
                    type="number"
                    step="0.00001"
                    value={formData.coordinates?.longitude || 0}
                    onChange={handleNumericInputChange}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="allocatedBudget">Budget</Label>
                <Input
                  id="allocatedBudget"
                  name="allocatedBudget"
                  type="number"
                  step="1000"
                  value={formData.allocatedBudget}
                  onChange={handleNumericInputChange}
                />
              </div>
            </div>
          
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add Project</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-500">
              Continue to the full project wizard to add all project details including timeline, budget details, and more.
            </p>
            
            <div className="grid gap-2">
              <Label htmlFor="quick-name">Project Name</Label>
              <Input
                id="quick-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quick-lat">Latitude</Label>
                <Input
                  id="quick-lat"
                  name="coordinates.latitude"
                  type="number"
                  step="0.00001"
                  value={formData.coordinates?.latitude || 0}
                  onChange={handleNumericInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="quick-lng">Longitude</Label>
                <Input
                  id="quick-lng"
                  name="coordinates.longitude"
                  type="number"
                  step="0.00001"
                  value={formData.coordinates?.longitude || 0}
                  onChange={handleNumericInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleFullWizardClick}>Continue to Wizard</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 