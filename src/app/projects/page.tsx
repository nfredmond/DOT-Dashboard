"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  PlusIcon, 
  MapIcon, 
  EditIcon, 
  TrashIcon, 
  FilterIcon,
  SearchIcon,
  ArrowUpDown,
  ChevronDownIcon,
  DatabaseIcon,
  SparklesIcon,
  RefreshCwIcon,
  FileTextIcon,
  ArrowLeftIcon,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { batchUpdateProjects, AIProjectSuggestion } from '@/lib/project-ai-service';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  mapType: string;
  location?: string;
  status?: string;
  category?: string;
  priority?: string;
  estimatedCost?: number;
}

const statusColors: Record<string, string> = {
  'Planned': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500',
  'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-500',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-500',
  'On Hold': 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-500',
  'Delayed': 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500',
  'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-500',
};

const priorityColors: Record<string, string> = {
  'Low': 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-500',
  'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-500',
  'High': 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-500',
  'Critical': 'bg-purple-100 text-purple-800 dark:bg-purple-400/20 dark:text-purple-500',
};

const ProjectsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock projects data - in a real app, this would come from an API
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'City Transportation Plan',
      description: 'Mapping transportation infrastructure and planning future improvements',
      createdAt: '2023-10-15',
      updatedAt: '2023-11-20',
      mapType: 'cartoPositron',
      location: 'Downtown',
      status: 'In Progress',
      category: 'Transit',
      priority: 'High',
      estimatedCost: 2500000
    },
    {
      id: '2',
      name: 'Urban Development Zones',
      description: 'Identifying and mapping urban development and zoning areas',
      createdAt: '2023-09-05',
      updatedAt: '2023-11-18',
      mapType: 'cartoDarkMatter',
      location: 'Citywide',
      status: 'Planned',
      category: 'Planning',
      priority: 'Medium',
      estimatedCost: 1200000
    },
    {
      id: '3',
      name: 'Environmental Impact Study',
      description: 'Mapping environmental factors and impact zones for new development',
      createdAt: '2023-11-01',
      updatedAt: '2023-11-15',
      mapType: 'cartoVoyager',
      location: 'North Region',
      status: 'On Hold',
      category: 'Highway',
      priority: 'Low',
      estimatedCost: 950000
    },
    {
      id: '4',
      name: 'Pedestrian Safety Improvement',
      description: 'Enhancing pedestrian safety at key intersections',
      createdAt: '2023-08-12',
      updatedAt: '2023-11-25',
      mapType: 'cartoPositron',
      location: 'Downtown',
      status: 'Approved',
      category: 'Pedestrian',
      priority: 'High',
      estimatedCost: 750000
    },
    {
      id: '5',
      name: 'Bicycle Network Expansion',
      description: 'Expanding bicycle lanes and infrastructure',
      createdAt: '2023-07-22',
      updatedAt: '2023-11-10',
      mapType: 'cartoVoyager',
      location: 'West Side',
      status: 'In Progress',
      category: 'Bicycle',
      priority: 'Medium',
      estimatedCost: 1850000
    }
  ]);

  // State for batch operations
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchUpdateDialogOpen, setBatchUpdateDialogOpen] = useState(false);
  const [batchUpdateText, setBatchUpdateText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, AIProjectSuggestion> | null>(null);
  
  const filteredProjects = projects
    .filter(project => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.location?.toLowerCase().includes(searchLower) ||
        project.status?.toLowerCase().includes(searchLower) ||
        project.category?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Handle different types of sorting
      if (sortBy === 'name' || sortBy === 'location' || sortBy === 'status') {
        const aValue = a[sortBy as keyof Project] || '';
        const bValue = b[sortBy as keyof Project] || '';
        
        return sortOrder === 'asc' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
      
      if (sortBy === 'estimatedCost') {
        const aValue = a[sortBy] || 0;
        const bValue = b[sortBy] || 0;
        
        return sortOrder === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      
      // Default sort by date
      const aDate = new Date(a[sortBy as 'createdAt' | 'updatedAt']).getTime();
      const bDate = new Date(b[sortBy as 'createdAt' | 'updatedAt']).getTime();
      
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

  const toggleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleDeleteProject = (projectId: string) => {
    // In a real app, this would call an API to delete the project
    setProjects(projects.filter(project => project.id !== projectId));
    
    // Clear from selected if it was selected
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
    
    toast({
      title: "Project Deleted",
      description: "The project has been successfully deleted."
    });
  };
  
  const handleDeleteSelected = () => {
    if (selectedProjects.length === 0) return;
    
    setProjects(prev => prev.filter(project => !selectedProjects.includes(project.id)));
    setSelectedProjects([]);
    
    toast({
      title: "Projects Deleted",
      description: `${selectedProjects.length} project(s) have been deleted.`
    });
  };
  
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const handleBatchUpdate = async () => {
    if (selectedProjects.length === 0 || !batchUpdateText.trim()) {
      toast({
        title: "Error",
        description: "Please select projects and enter update instructions.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingBatch(true);
    
    try {
      const results = await batchUpdateProjects(batchUpdateText, selectedProjects);
      setBatchResults(results);
      
      // Keep dialog open to show results
    } catch (error) {
      console.error("Error processing batch update:", error);
      toast({
        title: "Error",
        description: "Failed to process batch update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingBatch(false);
    }
  };
  
  const applyBatchUpdates = () => {
    if (!batchResults) return;
    
    // Apply the suggested updates to the projects
    const updatedProjects = [...projects];
    
    Object.entries(batchResults).forEach(([projectId, suggestion]) => {
      const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
      if (projectIndex >= 0) {
        updatedProjects[projectIndex] = {
          ...updatedProjects[projectIndex],
          ...suggestion.suggestedValues,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
    });
    
    setProjects(updatedProjects);
    setBatchResults(null);
    setBatchUpdateDialogOpen(false);
    setBatchUpdateText('');
    
    toast({
      title: "Batch Update Completed",
      description: `Successfully updated ${Object.keys(batchResults).length} project(s).`
    });
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/homepage')}
              className="mr-2"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setBatchUpdateDialogOpen(true)}
              disabled={selectedProjects.length === 0}
            >
              <SparklesIcon className="mr-2 h-4 w-4" />
              Batch Update
            </Button>
            <Button onClick={() => router.push('/projects/new')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
        
        {/* Batch Update Dialog */}
        <Dialog open={batchUpdateDialogOpen} onOpenChange={setBatchUpdateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Batch Update Projects</DialogTitle>
              <DialogDescription>
                {selectedProjects.length === 0 
                  ? "Please select projects to update" 
                  : `Update ${selectedProjects.length} selected project(s) using AI assistance`}
              </DialogDescription>
            </DialogHeader>
            
            {batchResults ? (
              // Show results of batch processing
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Update Summary</h3>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {Object.entries(batchResults).map(([projectId, result]) => {
                    const project = projects.find(p => p.id === projectId);
                    return (
                      <Card key={projectId} className="p-4">
                        <h4 className="font-medium">{project?.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.explanation}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {Object.entries(result.suggestedValues).map(([field, value]) => (
                            <div key={field}>
                              <span className="font-medium">{field}:</span>{' '}
                              <span className="text-primary">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setBatchResults(null);
                      setBatchUpdateText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={applyBatchUpdates}>
                    Apply All Updates
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              // Show batch update form
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batchUpdateText">
                      Enter update instructions in natural language
                    </Label>
                    <Textarea
                      id="batchUpdateText"
                      value={batchUpdateText}
                      onChange={(e) => setBatchUpdateText(e.target.value)}
                      placeholder="E.g., 'Update all selected projects to In Progress status' or 'Increase budget by 10% for all projects'"
                      className="h-32 mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Our AI will interpret your instructions and update the projects accordingly.
                    </p>
                  </div>
                  
                  <div className="text-sm bg-muted rounded-md p-3">
                    <h4 className="font-medium">Selected Projects:</h4>
                    <ul className="list-disc list-inside mt-1">
                      {selectedProjects.map(id => {
                        const project = projects.find(p => p.id === id);
                        return project ? (
                          <li key={id}>{project.name}</li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline"
                    onClick={() => setBatchUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBatchUpdate}
                    disabled={isProcessingBatch || selectedProjects.length === 0 || !batchUpdateText.trim()}
                  >
                    {isProcessingBatch ? (
                      <>
                        <Spinner className="mr-2" size="sm" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        Process Update
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Filter and Search Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Last Updated</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="estimatedCost">Budget</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Projects</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSearchTerm('In Progress')}>
                  In Progress Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchTerm('High')}>
                  High Priority Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchTerm('Downtown')}>
                  Downtown Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchTerm('')}>
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedProjects.length > 0 && (
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleDeleteSelected}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Project List */}
        {filteredProjects.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <div className="mx-auto mb-4 bg-muted rounded-full h-12 w-12 flex items-center justify-center">
                <MapIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No projects match your search criteria.' : 'You haven\'t created any projects yet. Create your first project to get started.'}
              </p>
              {searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              ) : (
                <Button onClick={() => router.push('/projects/new')}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">
                      <Checkbox 
                        checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th 
                      className="p-2 text-left font-medium cursor-pointer"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center">
                        Project Name
                        {sortBy === 'name' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="p-2 text-left font-medium">Category</th>
                    <th 
                      className="p-2 text-left font-medium cursor-pointer hidden md:table-cell"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy === 'status' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="p-2 text-left font-medium hidden md:table-cell">Priority</th>
                    <th 
                      className="p-2 text-left font-medium cursor-pointer hidden lg:table-cell"
                      onClick={() => toggleSort('location')}
                    >
                      <div className="flex items-center">
                        Location
                        {sortBy === 'location' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left font-medium cursor-pointer hidden lg:table-cell"
                      onClick={() => toggleSort('updatedAt')}
                    >
                      <div className="flex items-center">
                        Last Updated
                        {sortBy === 'updatedAt' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="p-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Checkbox 
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={() => toggleSelectProject(project.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{project.name}</td>
                      <td className="p-2">
                        {project.category && (
                          <span className="text-sm">{project.category}</span>
                        )}
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        {project.status && (
                          <Badge className={statusColors[project.status] || ''}>
                            {project.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        {project.priority && (
                          <Badge className={priorityColors[project.priority] || ''}>
                            {project.priority}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 hidden lg:table-cell">
                        {project.location}
                      </td>
                      <td className="p-2 text-muted-foreground hidden lg:table-cell">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/projects/${project.id}`)}
                            title="View Details"
                          >
                            <FileTextIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/project-mapping?id=${project.id}`)}
                          >
                            <MapIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/projects/edit/${project.id}`)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredProjects.length} project(s) found
              {selectedProjects.length > 0 && ` • ${selectedProjects.length} selected`}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProjectsPage; 