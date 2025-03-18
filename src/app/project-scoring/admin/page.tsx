"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  PencilIcon,
  PlusCircle,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Criterion, 
  ScoringTemplate,
  getCriteria, 
  createCriterion, 
  updateCriterion, 
  deleteCriterion,
  getScoringTemplates
} from "@/lib/scoring-service";

// Formula types with descriptions
const formulaTypes = [
  { id: 'linear', name: 'Linear', description: 'Score increases linearly with the metric value' },
  { id: 'stepped', name: 'Stepped', description: 'Score increases in defined steps based on thresholds' },
  { id: 'threshold', name: 'Threshold', description: 'Binary score based on whether a threshold is met' },
  { id: 'custom', name: 'Custom', description: 'Custom formula defined by administrator' },
];

// Categories for organizing criteria
const criteriaCategories = [
  { id: 'transportation', name: 'Transportation' },
  { id: 'environmental', name: 'Environmental' },
  { id: 'economic', name: 'Economic' },
  { id: 'social', name: 'Social' },
  { id: 'regional', name: 'Regional' },
  { id: 'custom', name: 'Custom' },
];

export default function ScoringAdmin() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [templates, setTemplates] = useState<ScoringTemplate[]>([]);
  const [activeTab, setActiveTab] = useState("criteria");
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Placeholder for the agency ID - in a real app, this would come from auth context
  const agencyId = "agency-123";

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [criteriaData, templatesData] = await Promise.all([
          getCriteria(agencyId),
          getScoringTemplates(agencyId)
        ]);
        
        setCriteria(criteriaData);
        setTemplates(templatesData);
      } catch (error) {
        console.error("Error loading scoring data:", error);
        // In a real app, show an error toast or message
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [agencyId]);

  const handleSaveCriterion = async (criterion: Omit<Criterion, 'id'> | Criterion) => {
    try {
      setIsLoading(true);
      
      let savedCriterion;
      if ('id' in criterion) {
        savedCriterion = await updateCriterion(criterion as Criterion);
        
        // Update the criteria list
        setCriteria(prev => 
          prev.map(c => c.id === savedCriterion.id ? savedCriterion : c)
        );
      } else {
        savedCriterion = await createCriterion({
          ...criterion,
          agencyId
        });
        
        // Add to the criteria list
        setCriteria(prev => [...prev, savedCriterion]);
      }
      
      setEditingCriterion(null);
      setIsAddingCriterion(false);
    } catch (error) {
      console.error("Error saving criterion:", error);
      // In a real app, show an error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    try {
      setIsLoading(true);
      await deleteCriterion(criterionId);
      setCriteria(prev => prev.filter(c => c.id !== criterionId));
    } catch (error) {
      console.error("Error deleting criterion:", error);
      // In a real app, show an error toast
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeWeights = () => {
    // Calculate the total weight
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    
    // If the total is 100, no need to normalize
    if (totalWeight === 100) return;
    
    // Normalize the weights to sum to 100
    const normalizedCriteria = criteria.map(c => ({
      ...c,
      weight: Math.round((c.weight / totalWeight) * 100)
    }));
    
    // Update all criteria with normalized weights
    Promise.all(
      normalizedCriteria.map(criterion => updateCriterion(criterion))
    )
      .then(updatedCriteria => {
        setCriteria(updatedCriteria);
      })
      .catch(error => {
        console.error("Error normalizing weights:", error);
        // In a real app, show an error toast
      });
  };

  const renderCriterionForm = () => {
    const criterion = editingCriterion || {
      name: '',
      description: '',
      weight: 10,
      category: 'transportation',
      type: 'numeric' as const,
      isActive: true,
      formulaType: 'linear' as const,
      agencyId
    };

    return (
      <Dialog open={!!editingCriterion || isAddingCriterion} onOpenChange={(open) => {
        if (!open) {
          setEditingCriterion(null);
          setIsAddingCriterion(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCriterion ? "Edit Scoring Criterion" : "Add Scoring Criterion"}
            </DialogTitle>
            <DialogDescription>
              Define how this criterion will be used to score projects
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Criterion Name</Label>
              <Input
                id="name"
                value={criterion.name}
                onChange={(e) => setEditingCriterion({
                  ...criterion,
                  name: e.target.value
                })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={criterion.description}
                onChange={(e) => setEditingCriterion({
                  ...criterion,
                  description: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="weight">Weight (%)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="weight"
                    min={1}
                    max={100}
                    step={1}
                    value={[criterion.weight]}
                    onValueChange={(value) => setEditingCriterion({
                      ...criterion,
                      weight: value[0]
                    })}
                  />
                  <span className="w-8 text-right">{criterion.weight}%</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="active">Active</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={criterion.isActive}
                    onCheckedChange={(checked) => setEditingCriterion({
                      ...criterion,
                      isActive: checked
                    })}
                  />
                  <Label htmlFor="active">{criterion.isActive ? "Yes" : "No"}</Label>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={criterion.category}
                onValueChange={(value) => setEditingCriterion({
                  ...criterion,
                  category: value
                })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {criteriaCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="formulaType">Scoring Formula</Label>
              <Select
                value={criterion.formulaType}
                onValueChange={(value: any) => setEditingCriterion({
                  ...criterion,
                  formulaType: value
                })}
              >
                <SelectTrigger id="formulaType">
                  <SelectValue placeholder="Select formula type" />
                </SelectTrigger>
                <SelectContent>
                  {formulaTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formulaTypes.find(t => t.id === criterion.formulaType)?.description}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="metricUnit">Metric Unit</Label>
              <Input
                id="metricUnit"
                value={criterion.metricUnit || ''}
                onChange={(e) => setEditingCriterion({
                  ...criterion,
                  metricUnit: e.target.value
                })}
                placeholder="e.g., tons CO2, $ savings, etc."
              />
            </div>
            
            {criterion.formulaType === 'custom' && (
              <div className="grid gap-2">
                <Label htmlFor="formula">Custom Formula</Label>
                <Textarea
                  id="formula"
                  value={criterion.formula || ''}
                  onChange={(e) => setEditingCriterion({
                    ...criterion,
                    formula: e.target.value
                  })}
                  placeholder="Enter formula or description"
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingCriterion(null);
              setIsAddingCriterion(false);
            }}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => handleSaveCriterion(criterion)}>
              {editingCriterion ? "Save Changes" : "Add Criterion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Scoring System Administration
            </h1>
            <p className="text-muted-foreground">
              Manage scoring criteria, weights, and templates
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/project-scoring')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Scoring
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criteria">Scoring Criteria</TabsTrigger>
            <TabsTrigger value="templates">Scoring Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="criteria" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scoring Criteria</CardTitle>
                    <CardDescription>
                      Define the criteria used to evaluate projects
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={normalizeWeights}>
                      Normalize Weights
                    </Button>
                    <Button onClick={() => setIsAddingCriterion(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Criterion
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {criteria.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No scoring criteria defined. Click "Add Criterion" to create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        criteria.map((criterion) => (
                          <TableRow key={criterion.id}>
                            <TableCell className="font-medium">
                              {criterion.name}
                              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                                {criterion.description}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {criteriaCategories.find(c => c.id === criterion.category)?.name || criterion.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{criterion.weight}%</TableCell>
                            <TableCell>
                              {criterion.isActive ? (
                                <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formulaTypes.find(t => t.id === criterion.formulaType)?.name || criterion.formulaType}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingCriterion(criterion)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCriterion(criterion.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            {renderCriterionForm()}
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scoring Templates</CardTitle>
                    <CardDescription>
                      Create templates for different project types
                    </CardDescription>
                  </div>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No templates defined. Click "Add Template" to create one.
                        </p>
                      </div>
                    ) : (
                      templates.map((template) => (
                        <Card key={template.id} className="overflow-hidden">
                          <CardHeader className="p-4 pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {template.name}
                                  {template.isDefault && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                      Default
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>{template.description}</CardDescription>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {template.projectTypes.map((type) => (
                                <Badge key={type} variant="outline">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm mb-2">
                              <span className="font-medium">Criteria: </span>
                              {template.criteria?.length || 0} criteria defined
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 