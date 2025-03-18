'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initSupabaseClient } from '@/lib/supabase-service';
import { ScenarioDefinition } from '@/types/trend-navigator';
import { getScenarios, createScenario } from '@/lib/trend-navigator-service';

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Filter,
  Search,
  TrendingUp,
  BarChart2,
} from 'lucide-react';

// Initialize Supabase client
const supabaseClient = initSupabaseClient();

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setIsLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Get the user's organization
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();
          
        const agencyId = profile?.agency_id;
        
        if (!agencyId) {
          setError('No organization associated with your account');
          setIsLoading(false);
          return;
        }
        
        // Load all TrendNavigator configurations for this agency
        const { data: configs } = await supabaseClient
          .from('trend_navigator_configs')
          .select('id')
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!configs || configs.length === 0) {
          setError('No TrendNavigator configuration found for your organization');
          setIsLoading(false);
          return;
        }
        
        // Use the first config
        const configId = configs[0].id;
        
        // Load scenarios for this config
        const scenariosData = await getScenarios(configId);
        setScenarios(scenariosData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load scenarios', err);
        setError('Failed to load scenarios. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadScenarios();
  }, [router]);

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
      
      // Get user info
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Get user's organization
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();
        
      const agencyId = profile?.agency_id;
      
      if (!agencyId) {
        toast({
          title: 'Error',
          description: 'No organization associated with your account',
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }
      
      // Get the first available config
      const { data: configs } = await supabaseClient
        .from('trend_navigator_configs')
        .select('id')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!configs || configs.length === 0) {
        toast({
          title: 'Error',
          description: 'No TrendNavigator configuration found for your organization',
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }
      
      const configId = configs[0].id;
      const currentYear = new Date().getFullYear();
      
      // Create the new scenario
      const scenario = await createScenario(
        configId,
        user.id,
        {
          name: newScenarioName,
          description: newScenarioDescription,
          baseYear: currentYear,
          horizonYears: [currentYear + 20],
          organizationId: agencyId,
        }
      );
      
      if (scenario) {
        toast({
          title: 'Success',
          description: 'New scenario created successfully',
        });
        
        // Redirect to the new scenario's edit page
        router.push(`/scenarios/${scenario.id}/edit`);
      } else {
        throw new Error('Failed to create scenario');
      }
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Scenarios</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push('/scenarios/compare')}
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
          <div className="flex">
            <div className="relative w-64 mr-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search scenarios..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {uniqueTags.length > 0 && (
              <div className="flex gap-2 ml-4">
                {filterTag && (
                  <Button 
                    variant="outline" 
                    className="h-10 px-3" 
                    onClick={() => setFilterTag(null)}
                  >
                    Clear filter
                  </Button>
                )}
                
                {uniqueTags.slice(0, 5).map(tag => (
                  <Badge 
                    key={tag} 
                    variant={filterTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                
                {uniqueTags.length > 5 && (
                  <Button variant="ghost" size="sm">
                    +{uniqueTags.length - 5} more
                  </Button>
                )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredScenarios.map((scenario) => (
              <Link href={`/scenarios/${scenario.id}`} key={scenario.id}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{scenario.name}</CardTitle>
                    <CardDescription>
                      {scenario.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Year:</span>
                        <span>{scenario.baseYear}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Horizon Years:</span>
                        <span>{scenario.horizonYears.join(', ')}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{new Date(scenario.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {scenario.tags && scenario.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {scenario.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="justify-between">
                    <Button variant="ghost" size="sm">View Details</Button>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.preventDefault();
                      router.push(`/scenarios/${scenario.id}/edit`);
                    }}>
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </DialogTrigger>
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
    </div>
  );
} 