"use client"

import { useState, useEffect, useCallback, memo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Project, ProjectCategory, ProjectStatus, ProjectPriority } from '@/types/project';
import { useProjectWizard } from '@/contexts/ProjectWizardContext';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface BasicInfoStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = memo(({ projectData, onSave, errors }) => {
  const { config } = useProjectWizard();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: projectData.name ?? '',
    description: projectData.description ?? '',
    category: projectData.category ?? 'Transit' as ProjectCategory,
    status: projectData.status ?? 'Planned' as ProjectStatus,
    priority: projectData.priority ?? 'Medium' as ProjectPriority,
    startDate: projectData.startDate ?? new Date().toISOString().split('T')[0],
    endDate: projectData.endDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    leadAgency: projectData.leadAgency ?? '',
    tags: projectData.tags ?? [],
    organizationId: projectData.organizationId ?? (user ? user.id : ''),
    organizationName: projectData.organizationName ?? (user ? user.organization : ''),
  });
  
  const [tagInput, setTagInput] = useState('');
  
  // Use a more controlled approach with useEffect to prevent infinite loops
  useEffect(() => {
    const timer = setTimeout(() => {
      onSave(formData);
    }, 300); // Debounce the save

    return () => clearTimeout(timer);
  }, [formData, onSave]);

  // Update organization when user changes
  useEffect(() => {
    if (user && !projectData.organizationId) {
      setFormData(prev => ({
        ...prev,
        organizationId: user.id,
        organizationName: user.organization || ''
      }));
    }
  }, [user, projectData.organizationId]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleDateChange = useCallback((name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: date.toISOString().split('T')[0]
      }));
    }
  }, []);
  
  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);
  
  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter project name"
          className={errors.includes('Project name is required') ? 'border-destructive' : ''}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the project's purpose, goals, and scope"
          rows={4}
          className={errors.includes('Project description is required') ? 'border-destructive' : ''}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Project Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {config.projectCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Project Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {config.projectStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => handleSelectChange('priority', value)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {config.projectPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="leadAgency">Lead Agency/Department</Label>
          <Input
            id="leadAgency"
            name="leadAgency"
            value={formData.leadAgency}
            onChange={handleChange}
            placeholder="Agency responsible for this project"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization</Label>
          <Input
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Organization this project belongs to"
            readOnly={!!user && !!user.organization}
          />
          {!!user && !!user.organization && (
            <p className="text-xs text-muted-foreground mt-1">
              This project will be associated with your organization: {user.organization}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(new Date(formData.startDate), "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate ? new Date(formData.startDate) : undefined}
                onSelect={(date) => handleDateChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(new Date(formData.endDate), "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate ? new Date(formData.endDate) : undefined}
                onSelect={(date) => handleDateChange('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag} variant="secondary">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag, index) => (
            <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

BasicInfoStep.displayName = "BasicInfoStep";

export default BasicInfoStep; 