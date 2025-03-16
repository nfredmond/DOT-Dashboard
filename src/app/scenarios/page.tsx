'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  Search, 
  GitBranch, 
  Calendar, 
  DollarSign, 
  ArrowUpDown,
  Plus,
  BarChart3
} from 'lucide-react';
import Loading from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ScenariosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
        
        // Fetch all scenarios across projects
        const allScenarios: any[] = [];
        for (const project of projectsData) {
          if (project.id) {
            const scenariosResponse = await fetch(`/api/projects/${project.id}/scenarios`);
            if (scenariosResponse.ok) {
              const projectScenarios = await scenariosResponse.json();
              projectScenarios.forEach((scenario: any) => {
                allScenarios.push({
                  ...scenario,
                  projectName: project.name,
                  projectId: project.id
                });
              });
            }
          }
        }
        setScenarios(allScenarios);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scenarios data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const filteredScenarios = scenarios.filter(scenario => {
    // Filter by search query
    const matchesSearch = 
      scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab selection
    if (activeTab === 'all') return matchesSearch;
    
    // Assuming we have a way to categorize scenarios (e.g., by feasibility)
    if (activeTab === 'highFeasibility') return matchesSearch && scenario.feasibility >= 0.7;
    if (activeTab === 'mediumFeasibility') return matchesSearch && scenario.feasibility >= 0.4 && scenario.feasibility < 0.7;
    if (activeTab === 'lowFeasibility') return matchesSearch && scenario.feasibility < 0.4;
    
    return matchesSearch;
  });
  
  const goToScenarioPage = (projectId: string) => {
    router.push(`/projects/${projectId}/scenarios`);
  };
  
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
  
  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Scenarios</h1>
            <p className="text-muted-foreground mt-1">
              View and manage alternative scenarios for all projects
            </p>
          </div>
          <Button className="mt-4 md:mt-0" onClick={() => router.push('/projects')}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Scenarios</TabsTrigger>
            <TabsTrigger value="highFeasibility">High Feasibility</TabsTrigger>
            <TabsTrigger value="mediumFeasibility">Medium Feasibility</TabsTrigger>
            <TabsTrigger value="lowFeasibility">Low Feasibility</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredScenarios.length > 0 ? (
            filteredScenarios.map((scenario, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-start">
                    {scenario.name}
                    <Badge 
                      variant={
                        scenario.feasibility >= 0.7 ? 'default' : 
                        scenario.feasibility >= 0.4 ? 'secondary' : 
                        'outline'
                      }
                    >
                      {scenario.feasibility >= 0.7 ? 'High' : 
                        scenario.feasibility >= 0.4 ? 'Medium' : 
                        'Low'} Feasibility
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Project: {scenario.projectName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {scenario.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {scenario.timeline}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      ${scenario.cost.toLocaleString()}
                    </div>
                  </div>
                  
                  {scenario.benefits && scenario.benefits.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Key Benefits:</p>
                      <ul className="text-xs list-disc list-inside">
                        {scenario.benefits.slice(0, 2).map((benefit: string, i: number) => (
                          <li key={i} className="truncate">{benefit}</li>
                        ))}
                        {scenario.benefits.length > 2 && (
                          <p className="text-xs text-gray-500">+{scenario.benefits.length - 2} more</p>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => goToScenarioPage(scenario.projectId)}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center h-40 border rounded-md bg-gray-50 dark:bg-gray-800/50">
              <div className="text-center">
                <GitBranch className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No scenarios found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or creating new scenarios</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border">
          <div>
            <h3 className="font-medium flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Scenario Statistics
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Total scenarios: {scenarios.length} across {projects.length} projects
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/project-scoring')}>
            View Project Scoring
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
} 