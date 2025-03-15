'use client';

import { useState } from 'react';
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
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronDown,
  FileStackIcon, 
  GripVertical,
  Info,
  PencilIcon,
  PlusCircle,
  Save,
  Trash2,
  XCircle
} from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define interface for scoring criteria
interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  isActive: boolean;
  category: string;
  formulaType: 'linear' | 'stepped' | 'threshold' | 'custom';
  formula?: string;
  dataSource?: string;
  metricUnit?: string;
  customPrompt?: string;
}

// Define interface for scoring template
interface ScoringTemplate {
  id: string;
  name: string;
  description: string;
  projectTypes: string[];
  isDefault: boolean;
  criteria: ScoringCriterion[];
}

// Default/sample scoring criteria
const defaultScoringCriteria: ScoringCriterion[] = [
  {
    id: 'safety',
    name: 'Safety',
    description: 'Improves safety for all road users and reduces accidents',
    weight: 20,
    isActive: true,
    category: 'transportation',
    formulaType: 'linear',
    metricUnit: 'Estimated accident reduction per year'
  },
  {
    id: 'equity',
    name: 'Equity',
    description: 'Provides benefits to disadvantaged communities',
    weight: 15,
    isActive: true,
    category: 'social',
    formulaType: 'linear',
    metricUnit: 'Percentage of benefits to disadvantaged communities'
  },
  {
    id: 'climate',
    name: 'Climate Impact',
    description: 'Reduces greenhouse gas emissions and supports climate goals',
    weight: 15,
    isActive: true,
    category: 'environmental',
    formulaType: 'linear',
    metricUnit: 'Metric tons CO2e reduced per year'
  },
  {
    id: 'congestion',
    name: 'Congestion Relief',
    description: 'Reduces traffic congestion and improves travel times',
    weight: 20,
    isActive: true,
    category: 'transportation',
    formulaType: 'linear',
    metricUnit: 'Vehicle hours of delay reduced per day'
  },
  {
    id: 'costEffectiveness',
    name: 'Cost Effectiveness',
    description: 'Provides good value for the investment',
    weight: 15,
    isActive: true,
    category: 'economic',
    formulaType: 'linear',
    metricUnit: 'Benefit-cost ratio'
  },
  {
    id: 'multimodal',
    name: 'Multimodal',
    description: 'Supports multiple transportation modes',
    weight: 15,
    isActive: true,
    category: 'transportation',
    formulaType: 'linear',
    metricUnit: 'Number of modes served'
  }
];

// Sample templates
const defaultTemplates: ScoringTemplate[] = [
  {
    id: 'transportation',
    name: 'Transportation Projects',
    description: 'Standard scoring criteria for all transportation projects',
    projectTypes: ['Highway', 'Transit', 'Active Transportation', 'Bridge', 'Safety', 'Operational Improvement'],
    isDefault: true,
    criteria: defaultScoringCriteria
  },
  {
    id: 'sustainableMobility',
    name: 'Sustainable Mobility',
    description: 'Focused on emissions reduction and active transportation',
    projectTypes: ['Transit', 'Active Transportation', 'Bicycle', 'Pedestrian'],
    isDefault: false,
    criteria: [
      ...defaultScoringCriteria,
      {
        id: 'vmt',
        name: 'VMT Reduction',
        description: 'Reduces vehicle miles traveled',
        weight: 20,
        isActive: true,
        category: 'environmental',
        formulaType: 'linear',
        metricUnit: 'Daily VMT reduction'
      }
    ]
  },
  {
    id: 'rural',
    name: 'Rural Projects',
    description: 'Criteria adjusted for rural community needs',
    projectTypes: ['Highway', 'Bridge', 'Safety', 'Transit'],
    isDefault: false,
    criteria: defaultScoringCriteria.map(c => ({
      ...c,
      weight: c.id === 'equity' ? 25 : c.id === 'multimodal' ? 10 : c.weight
    }))
  }
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

// Formula types with descriptions
const formulaTypes = [
  { id: 'linear', name: 'Linear', description: 'Score increases linearly with the metric value' },
  { id: 'stepped', name: 'Stepped', description: 'Score increases in defined steps based on thresholds' },
  { id: 'threshold', name: 'Threshold', description: 'Binary score based on whether a threshold is met' },
  { id: 'custom', name: 'Custom', description: 'Custom formula defined by administrator' },
];

export function ProjectScoringSettings() {
  const [templates, setTemplates] = useState<ScoringTemplate[]>(defaultTemplates);
  const [activeTemplate, setActiveTemplate] = useState<string>(defaultTemplates[0].id);
  const [editingCriterion, setEditingCriterion] = useState<ScoringCriterion | null>(null);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const { toast } = useToast();

  // Get the currently active template
  const currentTemplate = templates.find(t => t.id === activeTemplate) || templates[0];

  // Handle saving a criterion after editing
  const handleSaveCriterion = (criterion: ScoringCriterion) => {
    const updatedTemplates = templates.map(template => {
      if (template.id === activeTemplate) {
        const criteriaIndex = template.criteria.findIndex(c => c.id === criterion.id);
        
        if (criteriaIndex >= 0) {
          // Update existing criterion
          const updatedCriteria = [...template.criteria];
          updatedCriteria[criteriaIndex] = criterion;
          return { ...template, criteria: updatedCriteria };
        } else {
          // Add new criterion
          return {
            ...template,
            criteria: [...template.criteria, criterion]
          };
        }
      }
      return template;
    });
    
    setTemplates(updatedTemplates);
    setEditingCriterion(null);
    setIsAddingCriterion(false);
    
    toast({
      title: "Criterion Saved",
      description: `${criterion.name} has been saved successfully.`,
    });
  };

  // Handle criterion deletion
  const handleDeleteCriterion = (criterionId: string) => {
    const updatedTemplates = templates.map(template => {
      if (template.id === activeTemplate) {
        return {
          ...template,
          criteria: template.criteria.filter(c => c.id !== criterionId)
        };
      }
      return template;
    });
    
    setTemplates(updatedTemplates);
    
    toast({
      title: "Criterion Deleted",
      description: "The criterion has been removed from this template.",
    });
  };

  // Handle saving a template
  const handleSaveTemplate = () => {
    if (editingTemplateId) {
      // Update existing template
      const updatedTemplates = templates.map(template => 
        template.id === editingTemplateId 
          ? { ...template, name: newTemplateName, description: newTemplateDescription }
          : template
      );
      setTemplates(updatedTemplates);
      
      toast({
        title: "Template Updated",
        description: `${newTemplateName} has been updated successfully.`,
      });
    } else if (isAddingTemplate) {
      // Add new template
      const newTemplate: ScoringTemplate = {
        id: Date.now().toString(),
        name: newTemplateName,
        description: newTemplateDescription,
        projectTypes: [],
        isDefault: false,
        criteria: [...defaultScoringCriteria] // Start with default criteria
      };
      
      setTemplates([...templates, newTemplate]);
      setActiveTemplate(newTemplate.id);
      
      toast({
        title: "Template Created",
        description: `${newTemplateName} has been created successfully.`,
      });
    }
    
    // Reset state
    setEditingTemplateId(null);
    setIsAddingTemplate(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
  };

  // Handle template deletion
  const handleDeleteTemplate = (templateId: string) => {
    // Don't allow deleting the last template
    if (templates.length <= 1) {
      toast({
        title: "Cannot Delete Template",
        description: "At least one scoring template must exist in the system.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    
    // If the active template was deleted, set a new active template
    if (activeTemplate === templateId) {
      setActiveTemplate(updatedTemplates[0].id);
    }
    
    toast({
      title: "Template Deleted",
      description: "The scoring template has been removed.",
    });
  };

  // Handle making a template the default
  const handleSetDefaultTemplate = (templateId: string) => {
    const updatedTemplates = templates.map(template => ({
      ...template,
      isDefault: template.id === templateId
    }));
    
    setTemplates(updatedTemplates);
    
    toast({
      title: "Default Template Updated",
      description: "The selected template is now the default for new projects.",
    });
  };

  // Start adding a new criterion
  const handleAddCriterion = () => {
    const newCriterion: ScoringCriterion = {
      id: `criterion-${Date.now()}`,
      name: '',
      description: '',
      weight: 10,
      isActive: true,
      category: 'transportation',
      formulaType: 'linear',
    };
    
    setEditingCriterion(newCriterion);
    setIsAddingCriterion(true);
  };

  // Render the criterion editing form
  const renderCriterionForm = () => {
    if (!editingCriterion) return null;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Criterion Name</Label>
          <Input 
            id="name" 
            value={editingCriterion.name} 
            onChange={(e) => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
            placeholder="e.g., Safety, Equity, Climate Impact"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={editingCriterion.description} 
            onChange={(e) => setEditingCriterion({ ...editingCriterion, description: e.target.value })}
            placeholder="Describe what this criterion measures and why it's important"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={editingCriterion.category} 
              onValueChange={(value) => setEditingCriterion({ ...editingCriterion, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {criteriaCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (%)</Label>
            <div className="flex items-center gap-2">
              <Slider 
                id="weight"
                value={[editingCriterion.weight]} 
                min={0} 
                max={100} 
                step={5}
                onValueChange={(values) => setEditingCriterion({ ...editingCriterion, weight: values[0] })}
                className="flex-1"
              />
              <span className="w-10 text-center">{editingCriterion.weight}%</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="formulaType">Scoring Method</Label>
          <Select 
            value={editingCriterion.formulaType} 
            onValueChange={(value: 'linear' | 'stepped' | 'threshold' | 'custom') => 
              setEditingCriterion({ ...editingCriterion, formulaType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select scoring method" />
            </SelectTrigger>
            <SelectContent>
              {formulaTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="metricUnit">Metric Unit (Optional)</Label>
          <Input 
            id="metricUnit" 
            value={editingCriterion.metricUnit || ''} 
            onChange={(e) => setEditingCriterion({ ...editingCriterion, metricUnit: e.target.value })}
            placeholder="e.g., Tons CO2e/year, Crash reduction %, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dataSource">Data Source (Optional)</Label>
          <Input 
            id="dataSource" 
            value={editingCriterion.dataSource || ''} 
            onChange={(e) => setEditingCriterion({ ...editingCriterion, dataSource: e.target.value })}
            placeholder="e.g., CalEnviroScreen, CMAQ calculator, etc."
          />
        </div>
        
        {editingCriterion.formulaType === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="formula">Custom Formula</Label>
            <Textarea 
              id="formula" 
              value={editingCriterion.formula || ''} 
              onChange={(e) => setEditingCriterion({ ...editingCriterion, formula: e.target.value })}
              placeholder="Enter custom formula or logic"
              rows={3}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="isActive" 
            checked={editingCriterion.isActive}
            onCheckedChange={(checked) => setEditingCriterion({ ...editingCriterion, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customPrompt">
            <span className="flex items-center">
              AI Prompt (Optional)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Customize how the AI system evaluates this criterion when using automation.
                      Specify what to look for in project documents or data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </Label>
          <Textarea 
            id="customPrompt" 
            value={editingCriterion.customPrompt || ''} 
            onChange={(e) => setEditingCriterion({ ...editingCriterion, customPrompt: e.target.value })}
            placeholder="Example: When assessing safety, look for crash data, conflict points reduction, and collision history."
            rows={3}
          />
        </div>
      </div>
    );
  };

  // Calculate total weight for the current template
  const totalWeight = currentTemplate.criteria
    .filter(c => c.isActive)
    .reduce((sum, criterion) => sum + criterion.weight, 0);

  // Check if weights need normalization (should sum to 100%)
  const weightsNeedNormalization = totalWeight !== 100 && currentTemplate.criteria.length > 0;

  // Normalize weights to sum to 100%
  const normalizeWeights = () => {
    if (currentTemplate.criteria.length === 0) return;

    const activeCriteria = currentTemplate.criteria.filter(c => c.isActive);
    if (activeCriteria.length === 0) return;

    const normalizationFactor = 100 / totalWeight;
    
    const updatedTemplates = templates.map(template => {
      if (template.id === activeTemplate) {
        const updatedCriteria = template.criteria.map(criterion => {
          if (criterion.isActive) {
            // Round to nearest integer for simplicity
            const normalizedWeight = Math.round(criterion.weight * normalizationFactor);
            return { ...criterion, weight: normalizedWeight };
          }
          return criterion;
        });
        
        return { ...template, criteria: updatedCriteria };
      }
      return template;
    });
    
    setTemplates(updatedTemplates);
    
    toast({
      title: "Weights Normalized",
      description: "Scoring criteria weights have been adjusted to sum to 100%.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Project Scoring Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure how projects are evaluated and scored for prioritization
          </p>
        </div>
        <Button 
          onClick={() => {
            setIsAddingTemplate(true);
            setNewTemplateName('');
            setNewTemplateDescription('');
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Tabs 
        value={activeTemplate} 
        onValueChange={setActiveTemplate}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {templates.map(template => (
            <TabsTrigger key={template.id} value={template.id} className="relative">
              {template.name}
              {template.isDefault && (
                <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map(template => (
          <TabsContent key={template.id} value={template.id} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setNewTemplateName(template.name);
                            setNewTemplateDescription(template.description);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Template</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={template.isDefault ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSetDefaultTemplate(template.id)}
                          disabled={template.isDefault}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set as Default Template</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Template</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Scoring Criteria</h4>
                  <div className="flex items-center gap-2">
                    {weightsNeedNormalization && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={normalizeWeights}
                      >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Normalize Weights
                      </Button>
                    )}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleAddCriterion}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Criterion
                    </Button>
                  </div>
                </div>

                {/* Weight warning banner */}
                {weightsNeedNormalization && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-center text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400">
                    <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      Criteria weights sum to {totalWeight}%, not 100%. Consider normalizing weights for accurate scoring.
                    </p>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">Order</TableHead>
                      <TableHead>Criterion</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Formula</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.criteria.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground italic">
                          No scoring criteria defined. Add criteria to configure project evaluation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      template.criteria.map((criterion, index) => (
                        <TableRow key={criterion.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="ml-2">{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{criterion.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {criterion.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {criteriaCategories.find(c => c.id === criterion.category)?.name || criterion.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{criterion.weight}%</div>
                          </TableCell>
                          <TableCell>
                            {formulaTypes.find(f => f.id === criterion.formulaType)?.name || criterion.formulaType}
                          </TableCell>
                          <TableCell>
                            {criterion.isActive ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Criterion Dialog */}
      <Dialog open={!!editingCriterion} onOpenChange={(open) => !open && setEditingCriterion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isAddingCriterion ? 'Add Scoring Criterion' : 'Edit Scoring Criterion'}
            </DialogTitle>
            <DialogDescription>
              Define how this aspect of projects will be evaluated and scored
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="p-1">
              {renderCriterionForm()}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingCriterion(null);
                setIsAddingCriterion(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => editingCriterion && handleSaveCriterion(editingCriterion)}
              disabled={!editingCriterion?.name}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Criterion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog 
        open={!!editingTemplateId || isAddingTemplate} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingTemplateId(null);
            setIsAddingTemplate(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? 'Edit Template' : 'Create Scoring Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplateId 
                ? 'Update template details' 
                : 'Create a new scoring template for project evaluation'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input 
                id="templateName" 
                value={newTemplateName} 
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Highway Projects, Transit Projects, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea 
                id="templateDescription" 
                value={newTemplateDescription} 
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Describe when this template should be used"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingTemplateId(null);
                setIsAddingTemplate(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!newTemplateName}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingTemplateId ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 