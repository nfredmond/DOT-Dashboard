"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  FileEdit,
  FolderPlus,
  Globe,
  ListTodo,
  Lightbulb,
  Settings,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';

const ComponentDescription = ({ title, description, icon, href }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  href: string;
}) => (
  <div className="flex gap-4 items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors">
    <div className="bg-primary/10 p-2 rounded-lg text-primary">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Link href={href}>
      <Button variant="ghost" size="icon">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  </div>
);

const SummaryPage = () => {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Project Management Tools</h1>
          <p className="text-muted-foreground">Summary of available project management components and features</p>
        </div>
        
        <Tabs defaultValue="wizard" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="wizard">
              <Wand2 className="h-4 w-4 mr-2" />
              Project Wizard
            </TabsTrigger>
            <TabsTrigger value="management">
              <ListTodo className="h-4 w-4 mr-2" />
              Management Tools
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wizard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Project Wizard Components</CardTitle>
                  <CardDescription>
                    A step-by-step interface for creating and updating project information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="Create New Project"
                    description="Start a new project from scratch using the interactive wizard"
                    icon={<FolderPlus className="h-5 w-5" />}
                    href="/projects/new"
                  />
                  <ComponentDescription 
                    title="Edit Existing Project"
                    description="Update a project's details and information using the wizard"
                    icon={<FileEdit className="h-5 w-5" />}
                    href="/projects"
                  />
                  <ComponentDescription 
                    title="Configuration Settings"
                    description="Configure the project wizard fields, steps, and behavior"
                    icon={<Settings className="h-5 w-5" />}
                    href="/settings/project-wizard"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information Steps</CardTitle>
                  <CardDescription>
                    Core project details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="Basic Info"
                    description="Project name, description, category, tags, etc."
                    icon={<FileEdit className="h-5 w-5" />}
                    href="/projects/new"
                  />
                  <ComponentDescription 
                    title="Location & Mapping"
                    description="Geographic location and interactive mapping"
                    icon={<Globe className="h-5 w-5" />}
                    href="/projects/new"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Specialized Steps</CardTitle>
                  <CardDescription>
                    Domain-specific project information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="Environmental Documentation"
                    description="NEPA and CEQA documentation, clearances, etc."
                    icon={<CheckSquare className="h-5 w-5" />}
                    href="/projects/new"
                  />
                  <ComponentDescription 
                    title="Funding & Budget"
                    description="Project costs, funding sources, budget allocation"
                    icon={<CheckSquare className="h-5 w-5" />}
                    href="/projects/new"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Project Management Tools</CardTitle>
                  <CardDescription>
                    Tools for managing and organizing projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="Projects Dashboard"
                    description="View, filter, and manage all your projects in one place"
                    icon={<ListTodo className="h-5 w-5" />}
                    href="/projects"
                  />
                  <ComponentDescription 
                    title="Batch Project Updates"
                    description="Update multiple projects at once with AI assistance"
                    icon={<Sparkles className="h-5 w-5" />}
                    href="/projects"
                  />
                  <ComponentDescription 
                    title="Team Collaboration"
                    description="Assign team members to projects and manage access"
                    icon={<Users className="h-5 w-5" />}
                    href="/team"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>AI-Powered Features</CardTitle>
                  <CardDescription>
                    Intelligent assistance for project creation and management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="AI Project Assistant"
                    description="Get AI-generated suggestions for project details and improvements"
                    icon={<Sparkles className="h-5 w-5" />}
                    href="/projects/new"
                  />
                  <ComponentDescription 
                    title="Batch AI Processing"
                    description="Process multiple projects with AI for updates and improvements"
                    icon={<Wand2 className="h-5 w-5" />}
                    href="/projects"
                  />
                  <ComponentDescription 
                    title="Document Analysis"
                    description="Extract project data from uploaded documents using AI"
                    icon={<FileEdit className="h-5 w-5" />}
                    href="/projects/new"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Project Analysis Tools</CardTitle>
                  <CardDescription>
                    Advanced analysis and visualization of project data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ComponentDescription 
                    title="Project Scoring & Prioritization"
                    description="Score and compare projects across multiple criteria"
                    icon={<BarChart3 className="h-5 w-5" />}
                    href="/projects"
                  />
                  <ComponentDescription 
                    title="Project Insights"
                    description="AI-generated insights and recommendations for projects"
                    icon={<Lightbulb className="h-5 w-5" />}
                    href="/projects"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 p-6 bg-primary/5 border rounded-lg">
          <h2 className="text-xl font-bold mb-2 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Key Features Implemented
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-medium mb-2">Project Wizard</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Multi-step wizard interface</li>
                <li>✓ Project Basic Information</li>
                <li>✓ Location & Mapping</li>
                <li>✓ Environmental Documentation</li>
                <li>✓ Funding & Budget</li>
                <li>✓ Project Scoring</li>
              </ul>
            </div>
            
            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-medium mb-2">AI Integration</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ AI Project Assistant</li>
                <li>✓ Batch Project Updates</li>
                <li>✓ Document Analysis</li>
                <li>✓ Suggestion Generation</li>
                <li>✓ Auto-scoring</li>
              </ul>
            </div>
            
            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-medium mb-2">Project Management</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Projects Dashboard</li>
                <li>✓ Filtering & Sorting</li>
                <li>✓ Batch Operations</li>
                <li>✓ Project Scoring</li>
                <li>✓ Edit & Update Projects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SummaryPage; 