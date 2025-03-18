'use client';

import { useState, useRef } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircleIcon, 
  TrashIcon, 
  EditIcon, 
  SearchIcon,
  MapPinIcon,
  LoaderIcon,
  CalendarIcon,
  BrainIcon,
  FilterIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';



// Enhanced project interface with more detailed fields
interface Project {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  location: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  manager?: string;
  stakeholders?: string[];
  objectives?: string[];
  createdAt: string;
  updatedAt: string;
  files?: ProjectFile[];
  // New fields for enhanced project management
  scores?: {
    safety?: number;
    equity?: number;
    climate?: number;
    congestion?: number;
    costEffectiveness?: number;
    multimodal?: number;
  };
  // Civil engineering and construction fields
  nepaStatus?: string;
  ceqaStatus?: string;
  psAndEAmount?: number;
  ceAmount?: number;
  constructionAmount?: number;
  rightOfWayAmount?: number;
  environmentalAmount?: number;
  vmtReduction?: number;
  ghgReduction?: number;
  fundingSource?: string[];
  constructionStartDate?: string;
  constructionEndDate?: string;
  environmentalClearanceDate?: string;
  designCompletionDate?: string;
  rightOfWayCompletionDate?: string;
  // Integration with GIS
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  geojson?: any;
}

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
}

// Sample project data for demonstration
const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Downtown Corridor Improvements',
    type: 'Transportation',
    description: 'Infrastructure improvements to enhance traffic flow and pedestrian safety in the downtown area.',
    status: 'Active',
    location: 'Main Street',
    budget: 2500000,
    startDate: '2023-05-15',
    endDate: '2024-06-30',
    manager: 'Sarah Wilson',
    stakeholders: ['Downtown Business Association', 'City Council', 'Transit Authority'],
    objectives: ['Reduce congestion by 25%', 'Enhance pedestrian safety', 'Improve public transit access'],
    createdAt: '2023-08-15',
    updatedAt: '2023-11-02',
    files: [
      {
        id: 'f1',
        name: 'project-proposal.pdf',
        size: 2345678,
        type: 'application/pdf',
        url: '/files/project-proposal.pdf',
        uploadDate: '2023-08-15'
      },
      {
        id: 'f2',
        name: 'budget-breakdown.xlsx',
        size: 1234567,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '/files/budget-breakdown.xlsx',
        uploadDate: '2023-09-20'
      }
    ]
  },
  {
    id: '2',
    name: 'Bike Lane Network Expansion',
    type: 'Bicycle',
    description: 'Expanding the city\'s bike lane network to promote alternative transportation.',
    status: 'Planning',
    location: 'Citywide',
    budget: 1200000,
    startDate: '2023-12-01',
    endDate: '2024-08-31',
    manager: 'Michael Chen',
    stakeholders: ['Bicycle Coalition', 'Parks Department', 'Public Works'],
    objectives: ['Add 15 miles of protected bike lanes', 'Connect existing bike paths', 'Increase bicycle commuting by 15%'],
    createdAt: '2023-09-20',
    updatedAt: '2023-10-28'
  },
  {
    id: '3',
    name: 'Transit Route Optimization',
    type: 'Transit',
    description: 'Analyzing and optimizing public transit routes based on ridership and demand patterns.',
    status: 'Completed',
    location: 'North District',
    budget: 450000,
    startDate: '2023-02-10',
    endDate: '2023-08-30',
    manager: 'Robert Johnson',
    stakeholders: ['Transit Authority', 'Community Representatives'],
    objectives: ['Reduce wait times by 20%', 'Increase ridership by 10%', 'Optimize resource allocation'],
    createdAt: '2023-05-10',
    updatedAt: '2023-09-15'
  },
  {
    id: '4',
    name: 'School Zone Safety Improvements',
    type: 'Safety',
    description: 'Enhancing safety measures around school zones to protect students and improve traffic management.',
    status: 'Active',
    location: 'Various Schools',
    budget: 850000,
    startDate: '2023-06-15',
    endDate: '2023-12-20',
    manager: 'Emily Johnson',
    stakeholders: ['School Board', 'Parent-Teacher Association', 'Traffic Department'],
    objectives: ['Implement traffic calming measures', 'Enhance crosswalk visibility', 'Improve drop-off/pick-up procedures'],
    createdAt: '2023-07-22',
    updatedAt: '2023-10-30'
  }
];

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [_searchTerm, _setSearchTerm] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [_isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [_isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [_analyzing, setAnalyzing] = useState(false);
  const [_analysisComplete, setAnalysisComplete] = useState(false);
  const [_analysisProgress, setAnalysisProgress] = useState(0);
  const [detectedProjects, setDetectedProjects] = useState<Partial<Project>[]>([]);
  const [_selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);
  const [_isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [_batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // State for the project form
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    type: 'Transportation',
    description: '',
    status: 'Planning',
    location: '',
    budget: undefined,
    startDate: '',
    endDate: '',
    manager: '',
    stakeholders: [],
    objectives: []
  });

  // Add the missing currentProject state
  const [currentProject, setCurrentProject] = useState<Project>({
    id: '',
    name: '',
    type: '',
    description: '',
    status: '',
    location: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Filter projects based on search term
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  // Handle file input change
  const _handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(filesArray);
      // Reset any previously detected projects
      setDetectedProjects([]);
      setAnalysisComplete(false);
    }
  };

  // Simulate LLM analysis of files for multiple projects
  const _analyzeFilesWithLLM = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to analyze",
        description: "Please upload at least one project file for analysis.",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);
    setDetectedProjects([]);

    // Simulate LLM processing with progress updates
    const totalSteps = 5;
    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress(Math.floor((step / totalSteps) * 100));
    }

    // Simulate detecting multiple projects from the uploaded files
    // In a real application, this would be the result from the LLM analysis
    const mockDetectedProjects: Partial<Project>[] = [
      {
        name: "Downtown Transit Hub Renovation",
        description: "Modernization of the central transit hub with improved accessibility features and sustainable design elements.",
        type: "Transportation",
        location: "Downtown Metro Area",
        budget: 2800000,
        startDate: "2024-03-15",
        endDate: "2025-07-30",
        objectives: ["Improve passenger experience", "Increase capacity by 30%", "Reduce energy consumption by 25%"]
      },
      {
        name: "Green Corridor Development",
        description: "Creating a network of green spaces connecting major parks and recreational areas throughout the city.",
        type: "Infrastructure",
        location: "Citywide",
        budget: 1200000,
        startDate: "2024-04-01",
        endDate: "2025-03-31",
        objectives: ["Increase green space by 15%", "Create wildlife corridors", "Improve air quality in urban areas"]
      },
      {
        name: "Smart Traffic Management System",
        description: "Implementation of AI-powered traffic management system to optimize flow and reduce congestion.",
        type: "Transportation",
        location: "Metropolitan Area",
        budget: 950000,
        startDate: "2024-02-01",
        endDate: "2024-10-31",
        objectives: ["Reduce average commute time by 15%", "Decrease traffic congestion", "Lower carbon emissions from idling vehicles"]
      }
    ];

    // Filter out projects that might already exist (basic name matching)
    // In a real app, you would use more sophisticated matching criteria
    const existingProjectNames = projects.map(p => p.name.toLowerCase());
    const filteredProjects = mockDetectedProjects.filter(
      p => !existingProjectNames.includes(p.name?.toLowerCase() || '')
    );

    setDetectedProjects(filteredProjects);
    setSelectedProjectIndex(0);

    if (filteredProjects.length === 0) {
      toast({
        title: "No new projects detected",
        description: "All detected projects already exist in the system.",
        variant: "default"
      });
    } else {
      // Update form with the first detected project
      if (filteredProjects.length > 0) {
        setFormData(prev => ({
          ...prev,
          ...filteredProjects[0]
        }));
      }
    }

    setAnalyzing(false);
    setAnalysisComplete(true);

    toast({
      title: "Analysis Complete",
      description: `Detected ${filteredProjects.length} new projects from the uploaded files.`,
      variant: "default"
    });
  };

  const _selectProject = (index: number) => {
    if (index >= 0 && index < detectedProjects.length) {
      setSelectedProjectIndex(index);
      setFormData(prev => ({
        ...prev,
        ...detectedProjects[index]
      }));
    }
  };

  const _handleAddAllProjects = async () => {
    if (detectedProjects.length === 0) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: detectedProjects.length });

    const newProjects: Project[] = [];

    for (let i = 0; i < detectedProjects.length; i++) {
      // Update progress
      setBatchProgress({ current: i + 1, total: detectedProjects.length });

      // Prepare project data
      const projectData = detectedProjects[i];
      
      // Create project files array from uploaded files
      const projectFiles: ProjectFile[] = uploadedFiles.map(file => ({
        id: Math.random().toString(36).substring(2),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString()
      }));

      const newProject: Project = {
        id: Math.random().toString(36).substring(2),
        name: projectData.name || 'Untitled Project',
        type: projectData.type || 'Transportation',
        description: projectData.description,
        status: projectData.status || 'Planning',
        location: projectData.location || 'Unspecified',
        budget: projectData.budget,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        manager: projectData.manager,
        stakeholders: projectData.stakeholders,
        objectives: projectData.objectives,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: projectFiles
      };

      newProjects.push(newProject);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Add all the new projects
    setProjects(prev => [...prev, ...newProjects]);
    
    setIsBatchProcessing(false);
    resetForm();
    setIsAddProjectOpen(false);
    setDetectedProjects([]);

    toast({
      title: "Batch Processing Complete",
      description: `${newProjects.length} new projects have been added successfully.`,
      variant: "default"
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Transportation',
      description: '',
      status: 'Planning',
      location: '',
      budget: undefined,
      startDate: '',
      endDate: '',
      manager: '',
      stakeholders: [],
      objectives: []
    });
    setUploadedFiles([]);
    setAnalysisComplete(false);
    setDetectedProjects([]);
    setCurrentProjectId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProject = () => {
    // Validate form
    if (!formData.name || !formData.type || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Create project files array from uploaded files
    const projectFiles: ProjectFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString()
    }));

    const newProject: Project = {
      id: Math.random().toString(36).substring(2),
      name: formData.name || 'Untitled Project',
      type: formData.type || 'Transportation',
      description: formData.description,
      status: formData.status || 'Planning',
      location: formData.location || 'Unspecified',
      budget: formData.budget,
      startDate: formData.startDate,
      endDate: formData.endDate,
      manager: formData.manager,
      stakeholders: formData.stakeholders,
      objectives: formData.objectives,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: projectFiles
    };

    setProjects([...projects, newProject]);
    resetForm();
    setIsAddProjectOpen(false);

    toast({
      title: "Project Added",
      description: `${newProject.name} has been created successfully.`,
      variant: "default"
    });
  };

  const _handleEditClick = (projectId: string) => {
    const projectToEdit = projects.find(project => project.id === projectId);
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name,
        type: projectToEdit.type,
        description: projectToEdit.description || '',
        status: projectToEdit.status,
        location: projectToEdit.location,
        budget: projectToEdit.budget,
        startDate: projectToEdit.startDate,
        endDate: projectToEdit.endDate,
        manager: projectToEdit.manager,
        stakeholders: projectToEdit.stakeholders,
        objectives: projectToEdit.objectives
      });
      setCurrentProjectId(projectId);
      setIsEditProjectOpen(true);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
    toast({
      title: "Project Deleted",
      description: "The project has been removed successfully.",
      variant: "default"
    });
  };

  const handleUpdateProject = () => {
    if (!currentProjectId) return;
    
    // Update the projects array with the edited project
    setProjects(projects.map(project => 
      project.id === currentProjectId 
        ? { 
            ...project, 
            ...formData, 
            updatedAt: new Date().toISOString() 
          } 
        : project
    ));
    
    setIsEditProjectOpen(false);
    resetForm();
    
    toast({
      title: "Project Updated",
      description: "The project has been updated successfully.",
      variant: "default"
    });
  };
  
  // Add new state variables for the enhanced functionality
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMode, setWizardMode] = useState<'create' | 'update'>('create');
  const [_showScoring, _setShowScoring] = useState(false);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [processingAI, setProcessingAI] = useState(false);
  const [wizardTemplate, _setWizardTemplate] = useState('default');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  
  // Templates for different project types
  const wizardTemplates = [
    { id: 'default', name: 'Standard Transportation Project' },
    { id: 'highway', name: 'Highway Construction' },
    { id: 'transit', name: 'Transit Development' },
    { id: 'active', name: 'Active Transportation' },
    { id: 'planning', name: 'Transportation Planning' },
  ];
  
  // Fields to show in each wizard step
  const wizardSteps = {
    default: [
      {
        title: 'Basic Information',
        fields: ['name', 'type', 'description', 'location', 'status']
      },
      {
        title: 'Timeline & Budget',
        fields: ['startDate', 'endDate', 'budget', 'manager', 'stakeholders']
      },
      {
        title: 'Environmental & Engineering',
        fields: ['nepaStatus', 'ceqaStatus', 'environmentalClearanceDate', 'designCompletionDate']
      },
      {
        title: 'Construction Details',
        fields: ['psAndEAmount', 'ceAmount', 'constructionAmount', 'rightOfWayAmount', 'constructionStartDate', 'constructionEndDate']
      },
      {
        title: 'Benefits & Scoring',
        fields: ['vmtReduction', 'ghgReduction', 'scores']
      },
      {
        title: 'Geographic Information',
        fields: ['coordinates', 'geojson']
      }
    ],
    // Additional templates could be defined here
  };
  
  // Project statuses
  const projectStatuses = [
    'Planning', 'Environmental Review', 'Design', 'Right of Way', 'Construction', 'Complete', 'On Hold', 'Cancelled'
  ];
  
  // Project types
  const projectTypes = [
    'Highway', 'Transit', 'Active Transportation', 'Bridge', 'Safety', 'Operational Improvement', 'Planning Study', 'Other'
  ];
  
  // NEPA/CEQA statuses
  const environmentalStatuses = [
    'Not Started', 'In Progress', 'Categorical Exclusion', 'FONSI', 'EIS Required', 'ROD Issued', 'Exempt', 'N/A'
  ];
  
  // Scoring criteria
  const scoringCriteria = [
    { id: 'safety', name: 'Safety', description: 'Improves safety for all road users' },
    { id: 'equity', name: 'Equity', description: 'Provides benefits to disadvantaged communities' },
    { id: 'climate', name: 'Climate', description: 'Reduces greenhouse gas emissions' },
    { id: 'congestion', name: 'Congestion Relief', description: 'Reduces traffic congestion' },
    { id: 'costEffectiveness', name: 'Cost Effectiveness', description: 'Provides good value for investment' },
    { id: 'multimodal', name: 'Multimodal', description: 'Supports multiple transportation modes' }
  ];

  // Function to handle batch update with AI
  const handleBatchUpdateWithAI = async () => {
    if (!aiPrompt) {
      toast({
        title: "Error",
        description: "Please enter a description of the updates to make.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingAI(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would be replaced with actual AI processing logic
      const _updatedProjects = selectedProjectIds.map(id => {
        const project = projects.find(p => p.id === id);
        if (project) {
          // Example of what AI might do - interpret the prompt and make changes
          return {
            ...project,
            updatedAt: new Date().toISOString(),
            // Add some mock changes based on the prompt
            ...(aiPrompt.toLowerCase().includes('budget') ? { 
              budget: project.budget! * 1.1  // 10% increase
            } : {}),
            ...(aiPrompt.toLowerCase().includes('delay') ? {
              endDate: project.endDate ? new Date(new Date(project.endDate).setMonth(new Date(project.endDate).getMonth() + 3)).toISOString().split('T')[0] : undefined
            } : {}),
            ...(aiPrompt.toLowerCase().includes('ghg') || aiPrompt.toLowerCase().includes('emissions') ? {
              ghgReduction: Math.floor(Math.random() * 50) + 50  // Random value between 50-100
            } : {})
          };
        }
        return project;
      });
      
      // Update the projects
      // In a real app, this would call an API
      toast({
        title: "Success",
        description: `Updated ${selectedProjectIds.length} projects based on your prompt.`,
      });
      
      // Clear selections
      setSelectedProjectIds([]);
      setAiPrompt('');
      setShowBatchUpdate(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process updates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingAI(false);
    }
  };
  
  // Function to start the update wizard for a project
  const startUpdateWizard = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      setWizardMode('update');
      setWizardStep(1);
      setShowWizard(true);
    }
  };
  
  // Function to navigate wizard steps
  const handleWizardNavigation = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      if (wizardStep < 6) {
        setWizardStep(wizardStep + 1);
      } else {
        // Final step - save the project
        if (wizardMode === 'create') {
          handleAddProject();
        } else {
          handleUpdateProject();
        }
        setShowWizard(false);
        setWizardStep(1);
      }
    } else {
      if (wizardStep > 1) {
        setWizardStep(wizardStep - 1);
      }
    }
  };
  
  // Function to toggle project selection for batch operations
  const toggleProjectSelection = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds(selectedProjectIds.filter(id => id !== projectId));
    } else {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    }
  };
  
  // Function to select all projects or clear selection
  const toggleSelectAll = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };
  
  // This would show the wizard interface based on the current step
  const renderWizardStep = () => {
    const _template = wizardTemplates.find(t => t.id === wizardTemplate) ? wizardTemplate : 'default';
    const currentStepData = wizardSteps.default[wizardStep - 1];
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Step {wizardStep}: {currentStepData.title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentStepData.fields.includes('name') && (
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={currentProject.name || ''}
                onChange={(e) => handleInputChange(e)}
                name="name"
                placeholder="Enter project name"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('type') && (
            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select 
                value={currentProject.type || ''} 
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {currentStepData.fields.includes('description') && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentProject.description || ''}
                onChange={(e) => handleInputChange(e)}
                name="description"
                placeholder="Describe the project"
                rows={3}
              />
            </div>
          )}
          
          {currentStepData.fields.includes('location') && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={currentProject.location || ''}
                onChange={(e) => handleInputChange(e)}
                name="location"
                placeholder="Project location"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('status') && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={currentProject.status || ''} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {currentStepData.fields.includes('budget') && (
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={currentProject.budget || ''}
                onChange={(e) => handleInputChange(e)}
                name="budget"
                placeholder="Enter budget amount"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('startDate') && (
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={currentProject.startDate || ''}
                onChange={(e) => handleInputChange(e)}
                name="startDate"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('endDate') && (
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={currentProject.endDate || ''}
                onChange={(e) => handleInputChange(e)}
                name="endDate"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('nepaStatus') && (
            <div className="space-y-2">
              <Label htmlFor="nepaStatus">NEPA Status</Label>
              <Select 
                value={currentProject.nepaStatus || ''} 
                onValueChange={(value) => handleSelectChange('nepaStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select NEPA status" />
                </SelectTrigger>
                <SelectContent>
                  {environmentalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {currentStepData.fields.includes('ceqaStatus') && (
            <div className="space-y-2">
              <Label htmlFor="ceqaStatus">CEQA Status</Label>
              <Select 
                value={currentProject.ceqaStatus || ''} 
                onValueChange={(value) => handleSelectChange('ceqaStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CEQA status" />
                </SelectTrigger>
                <SelectContent>
                  {environmentalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {currentStepData.fields.includes('environmentalClearanceDate') && (
            <div className="space-y-2">
              <Label htmlFor="environmentalClearanceDate">Environmental Clearance Date</Label>
              <Input
                id="environmentalClearanceDate"
                type="date"
                value={currentProject.environmentalClearanceDate || ''}
                onChange={(e) => handleInputChange(e)}
                name="environmentalClearanceDate"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('psAndEAmount') && (
            <div className="space-y-2">
              <Label htmlFor="psAndEAmount">PS&E Amount ($)</Label>
              <Input
                id="psAndEAmount"
                type="number"
                value={currentProject.psAndEAmount || ''}
                onChange={(e) => handleInputChange(e)}
                name="psAndEAmount"
                placeholder="Enter PS&E amount"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('ceAmount') && (
            <div className="space-y-2">
              <Label htmlFor="ceAmount">CE Amount ($)</Label>
              <Input
                id="ceAmount"
                type="number"
                value={currentProject.ceAmount || ''}
                onChange={(e) => handleInputChange(e)}
                name="ceAmount"
                placeholder="Enter CE amount"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('vmtReduction') && (
            <div className="space-y-2">
              <Label htmlFor="vmtReduction">VMT Reduction (miles per day)</Label>
              <Input
                id="vmtReduction"
                type="number"
                value={currentProject.vmtReduction || ''}
                onChange={(e) => handleInputChange(e)}
                name="vmtReduction"
                placeholder="Estimated VMT reduction"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('ghgReduction') && (
            <div className="space-y-2">
              <Label htmlFor="ghgReduction">GHG Reduction (metric tons CO2e per year)</Label>
              <Input
                id="ghgReduction"
                type="number"
                value={currentProject.ghgReduction || ''}
                onChange={(e) => handleInputChange(e)}
                name="ghgReduction"
                placeholder="Estimated GHG reduction"
              />
            </div>
          )}
          
          {currentStepData.fields.includes('scores') && (
            <div className="space-y-4 md:col-span-2">
              <h4 className="font-medium">Project Scoring</h4>
              {scoringCriteria.map((criterion) => (
                <div key={criterion.id} className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor={`score-${criterion.id}`}>
                      {criterion.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        {criterion.description}
                      </span>
                    </Label>
                    <span className="text-sm font-medium">
                      {currentProject.scores?.[criterion.id as keyof typeof currentProject.scores] || 0}
                    </span>
                  </div>
                  <Input
                    id={`score-${criterion.id}`}
                    type="range"
                    min="0"
                    max="100"
                    value={currentProject.scores?.[criterion.id as keyof typeof currentProject.scores] || 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const updatedScores = { ...currentProject.scores, [criterion.id]: value };
                      setCurrentProject(prev => ({ ...prev, scores: updatedScores }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {currentStepData.fields.includes('coordinates') && (
            <div className="space-y-2 md:col-span-2">
              <h4 className="font-medium">Project Location</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Enter coordinates or select on map
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={currentProject.coordinates?.latitude || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      const updatedCoordinates = { 
                        ...currentProject.coordinates,
                        latitude: value 
                      };
                      setCurrentProject(prev => ({ ...prev, coordinates: updatedCoordinates }));
                    }}
                    placeholder="Latitude"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={currentProject.coordinates?.longitude || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      const updatedCoordinates = { 
                        ...currentProject.coordinates,
                        longitude: value 
                      };
                      setCurrentProject(prev => ({ ...prev, coordinates: updatedCoordinates }));
                    }}
                    placeholder="Longitude"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Button variant="outline" type="button" className="w-full">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Select on Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render batch update dialog
  const renderBatchUpdateDialog = () => (
    <Dialog open={showBatchUpdate} onOpenChange={setShowBatchUpdate}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Update Projects</DialogTitle>
          <DialogDescription>
            Use AI to update multiple projects at once. Describe the changes you want to make in plain language.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center mb-2">
              <BrainIcon className="h-5 w-5 mr-2 text-primary" />
              <h4 className="font-medium">Selected Projects: {selectedProjectIds.length}</h4>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {selectedProjectIds.map(id => {
                const project = projects.find(p => p.id === id);
                return project ? (
                  <Badge key={id} variant="outline" className="m-1">{project.name}</Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Describe the updates to make</Label>
            <Textarea
              id="ai-prompt"
              placeholder="Example: Update all selected projects to increase their budgets by 10% and delay completion dates by 3 months due to supply chain issues."
              rows={5}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBatchUpdate(false)}>Cancel</Button>
          <Button 
            onClick={handleBatchUpdateWithAI} 
            disabled={processingAI || selectedProjectIds.length === 0 || !aiPrompt.trim()}
          >
            {processingAI ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <BrainIcon className="h-4 w-4 mr-2" />
                Process Updates
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Now add the wizard and batch update functionality to the render
  return (
    <div className="space-y-6">
      {/* Table actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8 w-[200px] sm:w-[300px]"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (searchTerm) {
                  setFilteredProjects(projects.filter(project => 
                    project.name.toLowerCase().includes(searchTerm) || 
                    project.description?.toLowerCase().includes(searchTerm)
                  ));
                } else {
                  setFilteredProjects([]);
                }
              }}
            />
          </div>
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (selectedProjectIds.length > 0) {
                setShowBatchUpdate(true);
              } else {
                toast({
                  title: "No projects selected",
                  description: "Please select projects to update.",
                  variant: "destructive"
                });
              }
            }}
          >
            <BrainIcon className="h-4 w-4 mr-2" />
            Batch Update
          </Button>
          <Button size="sm" onClick={() => {
            resetForm();
            setWizardMode('create');
            setWizardStep(1);
            setShowWizard(true);
          }}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>
      
      {/* Project table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedProjectIds.length === projects.length && projects.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredProjects.length > 0 ? filteredProjects : projects).map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProjectSelection(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                  </TableCell>
                  <TableCell>{project.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.status}</Badge>
                  </TableCell>
                  <TableCell>{project.location}</TableCell>
                  <TableCell>${project.budget ? project.budget.toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    {project.startDate && project.endDate ? (
                      <div className="text-xs">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startUpdateWizard(project.id)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{project.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Project Creation/Update Wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {wizardMode === 'create' ? 'Create New Project' : 'Update Project'}
            </DialogTitle>
            <DialogDescription>
              {wizardMode === 'create' 
                ? `Step ${wizardStep} of 6 - ${wizardSteps.default[wizardStep - 1].title}` 
                : `Step ${wizardStep} of 6 - ${wizardSteps.default[wizardStep - 1].title}`}
            </DialogDescription>
          </DialogHeader>
          
          {/* Wizard step content */}
          {renderWizardStep()}
          
          {/* Wizard navigation */}
          <DialogFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleWizardNavigation('previous')}
                disabled={wizardStep === 1}
              >
                Previous
              </Button>
              <div className="flex items-center">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`h-2 w-2 rounded-full mx-1 ${
                      index + 1 === wizardStep 
                        ? 'bg-primary' 
                        : index + 1 < wizardStep 
                          ? 'bg-primary/50' 
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={() => handleWizardNavigation('next')}
              >
                {wizardStep === 6 ? (wizardMode === 'create' ? 'Create Project' : 'Update Project') : 'Next'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Batch Update Dialog */}
      {renderBatchUpdateDialog()}
    </div>
  );
} 