'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Filter,
  Search,
  TrendingUp,
  BarChart2,
  ChevronRight
} from 'lucide-react';

// Define the ScenarioDefinition type
interface ScenarioDefinition {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  organizationId: string;
  baseYear: number;
  horizonYears: number[];
  tags?: string[];
  status?: string;
}

export default function ScenariosPage() {
  const router = useRouter();
  const { user, isAuthenticated: _isAuthenticated } = useAuth();
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setIsLoading(true);
        
        // Create demo scenarios for testing
        setTimeout(() => {
          // Mock data for demo purposes
          const demoScenarios: ScenarioDefinition[] = [
            {
              id: 'demo-scenario-1',
              name: 'High Growth Scenario',
              description: 'Assumes 2% annual growth in population and employment with aggressive technology adoption',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdById: user?.id || 'demo-user',
              organizationId: user?.organizationId || 'demo-org',
              baseYear: 2023,
              horizonYears: [2045],
              tags: ['Growth', 'Technology'],
              status: 'Active'
            },
            {
              id: 'demo-scenario-2',
              name: 'Low Growth with Transit Focus',
              description: 'Assumes 0.5% annual growth with heavy investment in public transportation',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdById: user?.id || 'demo-user',
              organizationId: user?.organizationId || 'demo-org',
              baseYear: 2023,
              horizonYears: [2045],
              tags: ['Transit', 'Sustainability'],
              status: 'Draft'
            },
            {
              id: 'demo-scenario-3',
              name: 'Telecommute Revolution',
              description: 'Explores impacts of 50% workforce transitioning to remote work',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdById: user?.id || 'demo-user',
              organizationId: user?.organizationId || 'demo-org',
              baseYear: 2023,
              horizonYears: [2045],
              tags: ['Telecommute', 'Technology'],
              status: 'Active'
            }
          ];
          
          setScenarios(demoScenarios);
          setIsLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Failed to load scenarios', err);
        setError('Failed to load scenarios. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadScenarios();
  }, [user]);

  // Get all unique tags from scenarios
  const uniqueTags = Array.from(new Set(scenarios.flatMap(s => s.tags || [])));

  // Filtered scenarios based on search and tag filter
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = searchTerm === '' || 
      scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scenario.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = !filterTag || 
      (scenario.tags && scenario.tags.includes(filterTag));
    
    return matchesSearch && matchesTag;
  });

  // Handle create scenario
  const handleCreateScenario = async () => {
    if (!newScenarioName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Scenario name is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // For demo purposes, create a new mock scenario
      const newScenario: ScenarioDefinition = {
        id: `demo-scenario-${scenarios.length + 1}`,
        name: newScenarioName,
        description: newScenarioDescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: user?.id || 'demo-user',
        organizationId: user?.organizationId || 'demo-org',
        baseYear: new Date().getFullYear(),
        horizonYears: [new Date().getFullYear() + 20],
        tags: [],
        status: 'Draft'
      };
      
      // Add the new scenario to the list
      setScenarios([newScenario, ...scenarios]);
      
      toast({
        title: 'Success',
        description: 'New scenario created successfully',
      });
      
      // Redirect to the new scenario's edit page
      router.push(`/scenarios/${newScenario.id}/edit`);
      
    } catch (err) {
      console.error('Error creating scenario', err);
      toast({
        title: 'Error',
        description: 'Failed to create scenario. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setNewScenarioOpen(false);
    }
  };

  // Handle compare scenarios
  const handleCompareScenarios = () => {
    router.push('/scenarios/compare');
  };

  // Loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Main content
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Scenarios</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleCompareScenarios}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Compare Scenarios
              </Button>
              <Button onClick={() => setNewScenarioOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search scenarios..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {uniqueTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  {filterTag && (
                    <Button 
                      variant="outline" 
                      className="h-10 px-3" 
                      onClick={() => setFilterTag(null)}
                    >
                      Clear filter
                    </Button>
                  )}
                  
                  {uniqueTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant={filterTag === tag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No scenarios found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || filterTag ? 
                  'Try changing your search or filter criteria' : 
                  'Create your first scenario to get started'}
              </p>
              {!(searchTerm || filterTag) && (
                <Button className="mt-4" onClick={() => setNewScenarioOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Scenario
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScenarios.map((scenario) => (
                <Link href={`/scenarios/${scenario.id}`} key={scenario.id} className="block">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-xl">{scenario.name}</CardTitle>
                        {scenario.status && (
                          <Badge variant={scenario.status === 'Active' ? 'default' : 'outline'}>
                            {scenario.status}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scenario.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scenario.tags?.map((tag, index) => (
                          <Badge variant="secondary" key={index} className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        Base Year: {scenario.baseYear} | Horizon: {scenario.horizonYears.join(', ')}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 flex justify-between">
                      <Button variant="link" className="p-0 flex items-center">
                        View Details 
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                      
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(scenario.updatedAt).toLocaleDateString()}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
            <DialogDescription>
              Start with a blank scenario or clone from an existing one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={newScenarioName} 
                onChange={(e) => setNewScenarioName(e.target.value)} 
                placeholder="Enter scenario name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description" 
                value={newScenarioDescription} 
                onChange={(e) => setNewScenarioDescription(e.target.value)} 
                placeholder="Briefly describe this scenario"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Scenario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
} 