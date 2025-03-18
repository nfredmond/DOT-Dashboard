'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initSupabaseClient } from '@/lib/supabase-service';
import { 
  getScenario, 
  updateScenario, 
  deleteScenario,
  getScenarioTrends,
  getPolicyPackages 
} from '@/lib/trend-navigator-service';
import { ScenarioDefinition, ScenarioAssumption, PolicyPackage, TimeHorizon } from '@/types/trend-navigator';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Save, 
  ChevronLeft, 
  Trash,
  Plus,
  Edit,
  X
} from 'lucide-react';

// Initialize supabase client
const supabaseClient = initSupabaseClient();

export default function ScenarioEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scenario, setScenario] = useState<ScenarioDefinition | null>(null);
  const [availableTrends, setAvailableTrends] = useState<ScenarioAssumption[]>([]);
  const [availablePolicies, setAvailablePolicies] = useState<PolicyPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Form state for edited values
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
  const [horizonYears, setHorizonYears] = useState<TimeHorizon[]>([new Date().getFullYear() + 20]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Dialog states
  const [trendDialogOpen, setTrendDialogOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [horizonYearDialogOpen, setHorizonYearDialogOpen] = useState(false);
  const [newHorizonYear, setNewHorizonYear] = useState<number>(new Date().getFullYear() + 30);

  useEffect(() => {
    const loadData = async () => {
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
        
        // Load the scenario
        const scenarioData = await getScenario(params.id);
        if (!scenarioData) {
          setError('Scenario not found');
          setIsLoading(false);
          return;
        }
        setScenario(scenarioData);
        
        // Set form state
        setName(scenarioData.name);
        setDescription(scenarioData.description || '');
        setBaseYear(scenarioData.baseYear);
        setHorizonYears(scenarioData.horizonYears);
        setTags(scenarioData.tags || []);
        
        // Load available trends and policies
        const trendsData = await getScenarioTrends();
        setAvailableTrends(trendsData);
        
        const policiesData = await getPolicyPackages();
        setAvailablePolicies(policiesData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load scenario', err);
        setError('Failed to load scenario data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params.id, router]);

  const handleSave = async () => {
    if (!scenario) return;
    
    try {
      setIsSaving(true);
      
      const updatedScenario = await updateScenario(scenario.id, {
        name,
        description,
        baseYear,
        horizonYears,
        tags,
      });
      
      if (updatedScenario) {
        toast({
          title: 'Scenario updated',
          description: 'Your changes have been saved successfully.',
        });
        setScenario(updatedScenario);
      } else {
        throw new Error('Failed to update scenario');
      }
    } catch (err) {
      console.error('Error saving scenario', err);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scenario) return;
    
    try {
      setIsDeleting(true);
      
      const success = await deleteScenario(scenario.id);
      
      if (success) {
        toast({
          title: 'Scenario deleted',
          description: 'The scenario has been deleted successfully.',
        });
        router.push('/scenarios');
      } else {
        throw new Error('Failed to delete scenario');
      }
    } catch (err) {
      console.error('Error deleting scenario', err);
      toast({
        title: 'Error',
        description: 'Failed to delete scenario. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addHorizonYear = () => {
    if (newHorizonYear && !horizonYears.includes(newHorizonYear)) {
      const newYears = [...horizonYears, newHorizonYear].sort((a, b) => a - b);
      setHorizonYears(newYears);
      setNewHorizonYear(newHorizonYear + 10);
      setHorizonYearDialogOpen(false);
    }
  };

  const removeHorizonYear = (yearToRemove: number) => {
    setHorizonYears(horizonYears.filter(year => year !== yearToRemove));
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

  if (!scenario) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold">Scenario not found</h3>
          <Button className="mt-4" onClick={() => router.push('/scenarios')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/scenarios/${scenario.id}`)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Scenario
          </Button>
          <h1 className="text-3xl font-bold mt-2">Edit Scenario</h1>
          <p className="text-muted-foreground">{scenario.name}</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Scenario</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this scenario? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Edit the basic details of your scenario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter scenario name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose and scope of this scenario"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseYear">Base Year</Label>
                  <Input 
                    id="baseYear" 
                    type="number"
                    value={baseYear} 
                    onChange={(e) => setBaseYear(parseInt(e.target.value, 10))} 
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                  <p className="text-xs text-muted-foreground">
                    The reference year for current conditions
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Horizon Years</Label>
                    <Dialog open={horizonYearDialogOpen} onOpenChange={setHorizonYearDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Year
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Horizon Year</DialogTitle>
                          <DialogDescription>
                            Specify an additional future year to model in this scenario.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="horizonYear">Year</Label>
                            <Input 
                              id="horizonYear" 
                              type="number"
                              value={newHorizonYear} 
                              onChange={(e) => setNewHorizonYear(parseInt(e.target.value, 10))} 
                              min={baseYear + 1}
                              max={2100}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setHorizonYearDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addHorizonYear}>
                            Add
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {horizonYears.map((year) => (
                      <Badge key={year} variant="secondary" className="text-sm py-1">
                        {year}
                        <button 
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          onClick={() => removeHorizonYear(year)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {horizonYears.length === 0 && (
                      <p className="text-sm text-muted-foreground">No horizon years defined</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Future years to model in this scenario
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex">
                    <Input 
                      value={newTag} 
                      onChange={(e) => setNewTag(e.target.value)} 
                      placeholder="Add a tag"
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button onClick={addTag} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm py-1">
                        {tag}
                        <button 
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Trend Assumptions</CardTitle>
                    <CardDescription>
                      Key trends and assumptions for this scenario
                    </CardDescription>
                  </div>
                  <Dialog open={trendDialogOpen} onOpenChange={setTrendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Trend
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Add Trend Assumption</DialogTitle>
                        <DialogDescription>
                          Select a trend to add to your scenario or create a custom trend.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="trend">Trend Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a trend" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTrends.map((trend) => (
                                  <SelectItem key={trend.id} value={trend.id}>
                                    {trend.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom Trend</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Additional fields would be added here based on selection */}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTrendDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button>Add to Scenario</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {scenario.assumptions && scenario.assumptions.length > 0 ? (
                  <div className="space-y-6">
                    {scenario.assumptions.map((assumption, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{assumption.name}</h3>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {assumption.description || 'No description provided'}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {Object.entries(assumption.values).map(([horizon, value]) => (
                            <div key={horizon} className="space-y-2">
                              <Label className="text-xs text-muted-foreground">{horizon}</Label>
                              <div className="flex items-center">
                                <Slider
                                  defaultValue={[Number(value)]}
                                  max={100}
                                  step={1}
                                  className="flex-1 mr-2"
                                />
                                <span className="w-12 text-right">{value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No trends have been added to this scenario</p>
                    <Button onClick={() => setTrendDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Trend
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Policy Packages</CardTitle>
                    <CardDescription>
                      Policy interventions for this scenario
                    </CardDescription>
                  </div>
                  <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Policy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Add Policy Package</DialogTitle>
                        <DialogDescription>
                          Select a policy package to add to your scenario.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="policy">Policy Package</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a policy package" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePolicies.map((policy) => (
                                  <SelectItem key={policy.id} value={policy.id}>
                                    {policy.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Additional fields would be added here based on selection */}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button>Add to Scenario</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {scenario.policyPackages && scenario.policyPackages.length > 0 ? (
                  <div className="space-y-6">
                    {scenario.policyPackages.map((pkg, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{pkg.name}</h3>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pkg.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Capital Cost:</span>{' '}
                            <span className="font-medium">${pkg.totalCost.capital.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Annual Cost:</span>{' '}
                            <span className="font-medium">${pkg.totalCost.annual.toLocaleString()}/year</span>
                          </div>
                        </div>
                        
                        {pkg.policies && pkg.policies.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Included Policies:</h4>
                            <div className="flex flex-wrap gap-2">
                              {pkg.policies.map((policyId, i) => (
                                <Badge key={i} variant="outline">
                                  Policy {i + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No policy packages have been added to this scenario</p>
                    <Button onClick={() => setPolicyDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Policy Package
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced settings for this scenario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Export Format</Label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data Sharing</Label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="shareData" className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="shareData" className="text-sm font-normal">
                      Share anonymized data to improve model accuracy
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Danger Zone</Label>
                  <div className="border border-destructive/20 rounded-md p-4">
                    <h3 className="text-sm font-medium text-destructive mb-2">Delete Scenario</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once deleted, this scenario and all associated data will be permanently removed.
                    </p>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Scenario
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 