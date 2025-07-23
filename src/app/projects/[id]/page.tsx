"use client"

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/use-toast";
import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  ShareIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ArrowLeftIcon,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  UserCircle2,
  Plus as PlusIcon,
  ChevronLeft,
  SquareStack
} from "lucide-react";
import { Project } from "@/types/project";
import Loading from "@/components/ui/loading";
import { ProjectTodoList } from '@/components/ui/Todo';

// Importing a mock database of projects
// In a real app, this would be replaced with a database call

// Dynamic import for the map component to avoid SSR issues
const _ProjectLocationMap = dynamic(() => import("@/components/projects/ProjectLocationMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center">Loading map...</div>
});

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

// Define the document/attachment types
const documentIcons: Record<string, React.ReactNode> = {
  'pdf': <FileTextIcon className="h-5 w-5 text-red-500" />,
  'doc': <FileTextIcon className="h-5 w-5 text-blue-500" />,
  'docx': <FileTextIcon className="h-5 w-5 text-blue-500" />,
  'xls': <FileTextIcon className="h-5 w-5 text-green-500" />,
  'xlsx': <FileTextIcon className="h-5 w-5 text-green-500" />,
  'ppt': <FileTextIcon className="h-5 w-5 text-orange-500" />,
  'pptx': <FileTextIcon className="h-5 w-5 text-orange-500" />,
  'jpg': <FileTextIcon className="h-5 w-5 text-purple-500" />,
  'png': <FileTextIcon className="h-5 w-5 text-purple-500" />,
  'default': <FileTextIcon className="h-5 w-5 text-gray-500" />,
};

export default function ProjectDetail() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { user: _ } = useAuth();
  const [_activeTab, _setActiveTab] = useState("overview");
  const projectId = params?.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        // Fetch project data
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        const result = await response.json();
        
        // Check if the response has a 'data' property (from API) or is the project directly (demo mode)
        const projectData = result.data || result;
        
        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, toast]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container py-8">
          <div className="flex justify-center my-12">
            <Loading size="lg" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p>Project not found or you don't have access to it.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/projects')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate completion percentage based on milestones
  const completedMilestones = project.milestones?.filter((m: any) => m.status === 'Completed').length || 0;
  const totalMilestones = project.milestones?.length || 1; // Avoid division by zero
  const completionPercentage = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Navigation and actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/projects')}
              className="mr-4"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  ID: {project.id}
                </Badge>
                {project.status && (
                  <Badge className={`${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                    {project.status}
                  </Badge>
                )}
                {project.category && (
                  <Badge variant="outline">
                    {project.category}
                  </Badge>
                )}
                {project.priority && (
                  <Badge className={`${priorityColors[project.priority as keyof typeof priorityColors] || 'bg-gray-100'}`}>
                    {project.priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/projects/edit/${project.id}`)}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="default" size="sm">
              <ShareIcon className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Project overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Project Overview
                </CardTitle>
                <CardDescription>
                  Created on {new Date(project.createdAt).toLocaleDateString()}
                  {project.updatedAt && ` • Last updated on ${new Date(project.updatedAt).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                      <span>{project.location || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Lead Agency</h3>
                    <div className="flex items-start">
                      <UsersIcon className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                      <span>{project.leadAgency || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Start Date</h3>
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                      <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">End Date</h3>
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                      <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {project.organizationName && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Organization</h3>
                    <div className="flex items-start">
                      <UserCircle2 className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                      <span>{project.organizationName}</span>
                    </div>
                  </div>
                )}
                
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Progress & Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Project Completion</span>
                    <span className="text-sm font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Estimated Cost</div>
                    <div className="font-bold">${project.estimatedCost?.toLocaleString() || '0'}</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Allocated Budget</div>
                    <div className="font-bold">${project.allocatedBudget?.toLocaleString() || '0'}</div>
                  </div>
                  
                  {project.phases && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Current Phase</div>
                      <div className="font-medium">
                        {project.phases.find((p: any) => p.status === 'In Progress')?.name || 'Not started'}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Days Remaining</div>
                    <div className="font-bold">
                      {project.endDate 
                        ? Math.max(0, Math.floor((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for different project sections */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detailed Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                {/* Environmental Documentation */}
                {project.environmentalDocumentation && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Environmental Documentation</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">NEPA Status</dt>
                        <dd>{project.nepaStatus || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">CEQA Status</dt>
                        <dd>{project.ceqaStatus || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                        <dd>{project.environmentalDocumentType || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Clearance Date</dt>
                        <dd>
                          {project.environmentalClearanceDate 
                            ? new Date(project.environmentalClearanceDate).toLocaleDateString() 
                            : 'Not specified'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
                
                <Separator />
                
                {/* Project Scores */}
                {project.scores && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Project Scores</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(project.scores).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                          <div className="text-gray-500 dark:text-gray-400 text-xs mb-1 capitalize">{key}</div>
                          <div className="font-bold">{value} / 100</div>
                          <Progress value={value} className="h-1 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Project Benefits */}
                {project.benefits && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expected Benefits</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                      {Object.entries(project.benefits).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </dt>
                          <dd className="font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>
                  Track and manage tasks for the {project.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="lg:max-w-3xl">
                <ProjectTodoList projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Project Documents</CardTitle>
                <CardDescription>
                  View and manage documents for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.attachments && project.attachments.length > 0 ? (
                  <div className="space-y-4">
                    {project.attachments.map((attachment: any, index: number) => {
                      const fileExt = attachment.name.split('.').pop().toLowerCase();
                      const icon = documentIcons[fileExt] || documentIcons.default;
                      
                      return (
                        <div key={index} className="flex items-center p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="mr-3">
                            {icon}
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium">{attachment.name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded on {new Date(attachment.uploadedAt).toLocaleDateString()}
                              {attachment.uploadedBy && ` by ${attachment.uploadedBy}`}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500">No documents have been uploaded for this project.</div>
                )}
                
                <div className="mt-6">
                  <Button variant="outline">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Upload New Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  View and manage the project timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Project Phases */}
                {project.phases && project.phases.length > 0 ? (
                  <div className="mb-8">
                    <h3 className="font-semibold mb-4">Project Phases</h3>
                    <div className="space-y-4">
                      {project.phases.map((phase: any, index: number) => (
                        <div key={index} className="relative pl-6 pb-8 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full 
                            ${phase.status === 'Completed' 
                              ? 'bg-green-500' 
                              : phase.status === 'In Progress' 
                                ? 'bg-blue-500' 
                                : 'bg-gray-300'}`}>
                          </div>
                          <div className="mb-1">
                            <span className="font-semibold">{phase.name}</span>
                            <Badge className="ml-2" variant={
                              phase.status === 'Completed' 
                                ? 'default' 
                                : phase.status === 'In Progress' 
                                  ? 'secondary' 
                                  : 'outline'
                            }>
                              {phase.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mb-1 flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(phase.startDate).toLocaleDateString()} to {new Date(phase.endDate).toLocaleDateString()}
                          </div>
                          {phase.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{phase.description}</p>
                          )}
                          {phase.completionPercentage !== undefined && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{phase.completionPercentage}%</span>
                              </div>
                              <Progress value={phase.completionPercentage} className="h-1" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 mb-6">No phases defined for this project.</div>
                )}
                
                {/* Project Milestones */}
                {project.milestones && project.milestones.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4">Project Milestones</h3>
                    <div className="space-y-3">
                      {project.milestones.map((milestone: any, index: number) => (
                        <div key={index} className="flex items-start">
                          {milestone.status === 'Completed' ? (
                            <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 mr-3 text-amber-500 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-medium">{milestone.name}</div>
                            <div className="text-sm text-gray-500">
                              Due: {new Date(milestone.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No milestones defined for this project.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="funding">
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Funding Details</CardTitle>
                <CardDescription>
                  View and manage funding sources and allocations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Estimated Cost</div>
                    <div className="text-2xl font-bold">${project.estimatedCost?.toLocaleString() || '0'}</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Allocated Budget</div>
                    <div className="text-2xl font-bold">${project.allocatedBudget?.toLocaleString() || '0'}</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Funding Gap</div>
                    <div className="text-2xl font-bold">
                      ${Math.max(0, (project.estimatedCost || 0) - (project.allocatedBudget || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Detailed Budget */}
                <div>
                  <h3 className="font-semibold mb-3">Detailed Budget</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">PSE Budget</div>
                      <div className="font-bold">${project.pseBudget?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Plans, Specifications & Estimates</div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">CE Budget</div>
                      <div className="font-bold">${project.ceBudget?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Construction Engineering</div>
                    </div>
                  </div>
                </div>
                
                {/* Funding Sources */}
                {project.fundingSources && project.fundingSources.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-3">Funding Sources</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-gray-500">Source</th>
                            <th className="text-left py-2 font-medium text-gray-500">Amount</th>
                            <th className="text-left py-2 font-medium text-gray-500">Status</th>
                            <th className="text-left py-2 font-medium text-gray-500">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.fundingSources.map((source: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 pr-4">{source.name}</td>
                              <td className="py-3 pr-4">${source.amount.toLocaleString()}</td>
                              <td className="py-3 pr-4">
                                <Badge variant={source.secured ? 'default' : 'outline'}>
                                  {source.secured ? 'Secured' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                                {source.description || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No funding sources have been specified for this project.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/projects/edit/${project.id}`)}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/scenarios`)}
          >
            <SquareStack className="mr-2 h-4 w-4" />
            Project Scenarios
          </Button>
          <Button 
            variant="default"
            onClick={() => router.push('/project-mapping')}
          >
            <MapPinIcon className="mr-2 h-4 w-4" />
            View on Map
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
} 