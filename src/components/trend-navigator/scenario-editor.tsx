import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  Play, 
  Loader2, 
  Save, 
  ChevronLeft, 
  Settings,
  Calendar,
  BarChart2,
  Package,
  AlertTriangle
} from 'lucide-react';
import logger from '../../lib/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TrendNavigatorService from '@/lib/trend-navigator/trend-navigator-service';
import { Spinner } from '@/components/ui/spinner';
import TimelineEditor from './timeline-editor';
import TrendAssumptionsEditor from './trend-assumptions-editor';
import PolicyPackagesEditor from './policy-packages-editor';

// Define the schema for validation
const scenarioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_year: z.number(),
  horizon_years: z.array(z.number()).min(1, "At least one horizon year is required"),
  tags: z.array(z.string()).optional(),
  assumptions: z.record(z.any()).optional(),
  policy_packages: z.array(z.any()).optional()
});

interface ScenarioEditorProps {
  scenario: any | null;
  isNew?: boolean;
  isLoading?: boolean;
  onSave?: (scenarioData: any) => Promise<void>;
  onRun?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  organizationId: string;
  scenarioId?: string;
  _readOnly?: boolean;
}

export default function ScenarioEditor({
  scenario,
  isNew = false,
  isLoading = false,
  onSave,
  onRun,
  onDelete,
  onCancel,
  organizationId,
  scenarioId,
  _readOnly = false
}: ScenarioEditorProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
  const [horizonYears, setHorizonYears] = useState<number[]>([new Date().getFullYear() + 10]);
  const [assumptions, setAssumptions] = useState<any[]>([]);
  const [policyPackages, setPolicyPackages] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [_loading, setLoading] = useState(false);
  const [availableTrends, setAvailableTrends] = useState<any[]>([]);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof scenarioSchema>>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      name: '',
      description: '',
      base_year: new Date().getFullYear(),
      horizon_years: [new Date().getFullYear() + 20],
      tags: [],
      assumptions: {},
      policy_packages: []
    }
  });
  
  // Initialize service
  const trendNavigatorService = new TrendNavigatorService(organizationId);

  useEffect(() => {
    if (scenario) {
      setName(scenario.name || '');
      setDescription(scenario.description || '');
      setBaseYear(scenario.baseYear || new Date().getFullYear());
      setHorizonYears(scenario.horizonYears || [new Date().getFullYear() + 10]);
      setAssumptions(scenario.assumptions || []);
      setPolicyPackages(scenario.policyPackages || []);
      setTags(scenario.tags || []);
    }
  }, [scenario]);

  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) return;
      
      setLoading(true);
      try {
        const scenario = await trendNavigatorService.getScenario(scenarioId);
        form.reset({
          name: scenario.name,
          description: scenario.description || '',
          base_year: scenario.baseYear,
          horizon_years: scenario.horizonYears,
          tags: scenario.tags || [],
          assumptions: scenario.assumptions || {},
          policy_packages: scenario.policyPackages || []
        });
      } catch (error) {
        logger.error('Error loading scenario:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scenario data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadScenario();
  }, [scenarioId, organizationId]);
  
  useEffect(() => {
    const loadTrends = async () => {
      try {
        const trends = await trendNavigatorService.getAvailableTrends();
        setAvailableTrends(trends);
      } catch (error) {
        logger.error('Error loading trends:', error);
      }
    };
    
    loadTrends();
  }, [organizationId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (horizonYears.length === 0) {
      errors.horizonYears = 'At least one horizon year is required';
    }
    
    if (horizonYears.some(year => year <= baseYear)) {
      errors.horizonYears = 'All horizon years must be greater than the base year';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const _handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      
      await onSave({
        name,
        description,
        baseYear,
        horizonYears,
        assumptions,
        policyPackages,
        tags,
      });
      
      toast({
        title: isNew ? 'Scenario Created' : 'Scenario Updated',
        description: isNew 
          ? 'Your new scenario has been created successfully.' 
          : 'Your scenario has been updated successfully.',
      });
      
      if (isNew) {
        router.push('/scenarios');
      }
    } catch (error) {
      logger.error('Error saving scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scenario. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!onRun) return;
    
    try {
      await onRun();
      
      toast({
        title: 'Scenario Run Initiated',
        description: 'Your scenario is now running. This may take a few minutes.',
      });
    } catch (error) {
      logger.error('Error running scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to run scenario. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
      
      toast({
        title: 'Scenario Deleted',
        description: 'Your scenario has been deleted successfully.',
      });
      
      router.push('/scenarios');
    } catch (error) {
      logger.error('Error deleting scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scenario. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof scenarioSchema>) => {
    setLoading(true);
    try {
      let result;
      if (scenarioId) {
        result = await trendNavigatorService.updateScenario(scenarioId, values);
        toast({
          title: 'Success',
          description: 'Scenario updated successfully'
        });
      } else {
        result = await trendNavigatorService.createScenario(values);
        toast({
          title: 'Success',
          description: 'Scenario created successfully'
        });
      }
      
      if (onSave) {
        onSave(result);
      } else {
        router.push(`/scenarios/${result.id}`);
      }
    } catch (error) {
      logger.error('Error saving scenario:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scenario',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const _handleApplyTrend = async (trendKey: string, parameters: any) => {
    setLoading(true);
    try {
      if (scenarioId) {
        const result = await trendNavigatorService.applyTrend(trendKey, scenarioId, parameters);
        form.setValue('assumptions', result.assumptions);
        form.setValue('tags', result.tags);
        toast({
          title: 'Success',
          description: `Trend "${trendKey}" applied successfully`
        });
      } else {
        const currentTags = form.getValues('tags') || [];
        const currentAssumptions = form.getValues('assumptions') || {};
        
        const trend = availableTrends.find(t => (t as any).key === trendKey);
        if (!trend) return;
        
        const modifications = (trend as any).modifications || {};
        const modifiedAssumptions = { ...currentAssumptions };
        
        Object.entries(modifications).forEach(([path, modification]: [string, any]) => {
          const paramValue = parameters?.[path] !== undefined 
            ? parameters[path] 
            : modification.default_value;
          
          setNestedValue(modifiedAssumptions, path.split('.'), paramValue);
        });
        
        form.setValue('assumptions', modifiedAssumptions);
        form.setValue('tags', [...currentTags, trendKey]);
        
        toast({
          title: 'Success',
          description: `Trend "${trendKey}" applied to form`
        });
      }
    } catch (error) {
      logger.error('Error applying trend:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply trend. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setNestedValue = (obj: any, pathArray: string[], value: any) => {
    if (pathArray.length === 1) {
      obj[pathArray[0]] = value;
      return;
    }

    const currentKey = pathArray[0];
    if (!obj[currentKey]) {
      obj[currentKey] = {};
    }

    setNestedValue(obj[currentKey], pathArray.slice(1), value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onCancel}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {isNew ? 'Create New Scenario' : scenario?.name || 'Edit Scenario'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="outline"
              onClick={handleRun}
              disabled={isLoading || isSaving}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Scenario
            </Button>
          )}
          
          <Button
            variant="default"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? 'Create Scenario' : 'Save Changes'}
          </Button>
          
          {!isNew && (
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="trends">
              <BarChart2 className="h-4 w-4 mr-2" />
              Trend Assumptions
            </TabsTrigger>
            <TabsTrigger value="policies">
              <Package className="h-4 w-4 mr-2" />
              Policy Packages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter scenario name"
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your scenario"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseYear">Base Year</Label>
                    <Input
                      id="baseYear"
                      type="number"
                      value={baseYear}
                      onChange={(e) => setBaseYear(parseInt(e.target.value))}
                      min={2000}
                      max={2100}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline">
            <TimelineEditor
              baseYear={baseYear}
              horizonYears={horizonYears}
              onHorizonYearsChange={setHorizonYears}
              error={validationErrors.horizonYears}
            />
          </TabsContent>
          
          <TabsContent value="trends">
            <TrendAssumptionsEditor
              assumptions={assumptions}
              onChange={setAssumptions}
              baseYear={baseYear}
              horizonYears={horizonYears}
            />
          </TabsContent>
          
          <TabsContent value="policies">
            <PolicyPackagesEditor
              packages={policyPackages}
              _onChange={setPolicyPackages}
            />
          </TabsContent>
        </Tabs>
      )}
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>
                All data associated with this scenario, including results and insights, will be permanently deleted.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 