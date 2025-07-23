'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Loader2, PlusCircleIcon, EditIcon, Trash2Icon } from 'lucide-react';
import {
  BenefitCostTemplate,
  BenefitCategory,
  CostCategory,
  BenefitCostAnalysisMethod,
  MonetizationParameters
} from '@/types/benefit-cost';
import {
  getBenefitCostTemplates,
  createBenefitCostTemplate,
  // updateBenefitCostTemplate, // To be created
  // deleteBenefitCostTemplate  // To be created
} from '@/lib/benefit-cost-service';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
// import { useUser } from '@/contexts/UserContext'; // Assuming a user context

const defaultNewTemplate: Partial<BenefitCostTemplate> = {
  name: '',
  description: '',
  parameters: DEFAULT_MONETIZATION_PARAMETERS, // Start with global defaults
  benefitCategories: [],
  costCategories: [],
  defaultDiscountRate: 0.07,
  defaultAnalysisHorizon: 20,
  methodologies: [BenefitCostAnalysisMethod.NET_PRESENT_VALUE],
  isPublic: false, // Default to private for new templates
  grantProgram: { name: '', url: '' },
};

export default function BcaTemplatesPage() {
  // const { organizationId } = useUser(); // Replace with actual orgId source
  const [organizationId, _setOrganizationId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<BenefitCostTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<BenefitCostTemplate> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID not available for fetching templates.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedTemplates = await getBenefitCostTemplates(organizationId);
      setTemplates(fetchedTemplates);
      setError(null);
    } catch (err) {
      console.error("Error fetching BCA templates:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
        fetchTemplates();
    }
  }, [fetchTemplates, organizationId]);

  const handleCreateNewTemplateClick = () => {
    setEditingTemplate(JSON.parse(JSON.stringify(defaultNewTemplate))); // Use a deep copy of defaults
    setShowTemplateForm(true);
  };

  const handleEditTemplateClick = (template: BenefitCostTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template))); // Deep copy
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!organizationId) return;
    // const service = new BenefitCostService(organizationId); // If service methods need instantiation
    // await service.deleteBenefitCostTemplate(templateId);
    toast({ title: "Placeholder", description: `Delete template ${templateId} (not implemented)` });
    // fetchTemplates(); // Refresh list
  };

  const handleSaveTemplate = async () => {
    if (!organizationId || !editingTemplate) return;

    setIsSaving(true);
    try {
      let savedTemplate;
      if (editingTemplate.id) {
        // savedTemplate = await updateBenefitCostTemplate(editingTemplate.id, editingTemplate, organizationId);
        toast({ title: "Placeholder", description: `Update template ${editingTemplate.name} (not implemented)` });
        savedTemplate = { ...editingTemplate, updatedAt: new Date().toISOString()} as BenefitCostTemplate;
      } else {
        // Ensure parameters is an object, not stringified JSON before sending to create
        const templateToCreate: Omit<BenefitCostTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
            ...defaultNewTemplate, // Start with defaults
            ...editingTemplate, // Overlay with form values
            name: editingTemplate.name || 'Untitled Template',
            parameters: typeof editingTemplate.parameters === 'string' 
                          ? JSON.parse(editingTemplate.parameters) 
                          : editingTemplate.parameters || DEFAULT_MONETIZATION_PARAMETERS,
            organizationId: organizationId, // Add organizationId for creation
        } as Omit<BenefitCostTemplate, 'id' | 'createdAt' | 'updatedAt'>; // Type assertion
        
        savedTemplate = await createBenefitCostTemplate(templateToCreate, organizationId);
        toast({ title: "Template Created", description: `Template "${savedTemplate.name}" created successfully.` });
      }
      fetchTemplates(); // Refresh list
      setShowTemplateForm(false);
      setEditingTemplate(null);
    } catch (err) {
      console.error("Error saving template:", err);
      toast({
        title: "Error Saving Template",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  // Main view: List of templates
  const renderTemplatesList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Benefit-Cost Analysis Templates</h1>
          <p className="text-muted-foreground">Manage reusable templates for your BCA.</p>
        </div>
        <Button onClick={handleCreateNewTemplateClick}>
          <PlusCircleIcon className="mr-2 h-4 w-4" /> Create New Template
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : templates.length === 0 ? (
        <p>No templates created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                {template.isPublic && <Badge variant="secondary">Public</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                <p className="text-xs mt-2">Categories: B-{template.benefitCategories?.length || 0}, C-{template.costCategories?.length || 0}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditTemplateClick(template)}><EditIcon className="mr-1 h-3 w-3"/> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:text-red-700"><Trash2Icon className="mr-1 h-3 w-3"/> Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Form view: Create/Edit Template
  const renderTemplateForm = () => {
    if (!editingTemplate) return null;
    // Helper to handle checkbox group changes for arrays like benefitCategories
    const handleCheckboxGroupChange = (
        field: keyof Pick<BenefitCostTemplate, 'benefitCategories' | 'costCategories' | 'methodologies'>,
        value: string,
        isChecked: boolean
    ) => {
        setEditingTemplate(prev => {
            if (!prev) return null;
            const currentValues = (prev[field] as string[] | undefined) || [];
            let newValues;
            if (isChecked) {
                newValues = [...currentValues, value];
            } else {
                newValues = currentValues.filter(item => item !== value);
            }
            return { ...prev, [field]: newValues };
        });
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{editingTemplate.id ? 'Edit Template' : 'Create New Template'}</h1>
        
        <Card>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                        id="template-name" 
                        value={editingTemplate.name || ''} 
                        onChange={(e) => setEditingTemplate(p => p ? {...p, name: e.target.value} : null)} 
                        placeholder="e.g., Standard Road Project Template"
                    />
                </div>
                <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea 
                        id="template-description" 
                        value={editingTemplate.description || ''} 
                        onChange={(e) => setEditingTemplate(p => p ? {...p, description: e.target.value} : null)} 
                        placeholder="Briefly describe this template's purpose or common use cases."
                    />
                </div>

                {/* Monetization Parameters (Placeholder with JSON Textarea) */}
                <div>
                    <Label htmlFor="template-parameters">Monetization Parameters (JSON)</Label>
                    <Textarea 
                        id="template-parameters" 
                        rows={10}
                        value={typeof editingTemplate.parameters === 'string' 
                                ? editingTemplate.parameters 
                                : JSON.stringify(editingTemplate.parameters || DEFAULT_MONETIZATION_PARAMETERS, null, 2)}
                        onChange={(e) => {
                            const val = e.target.value;
                            setEditingTemplate(p => {
                                if (!p) return null;
                                try {
                                    // Attempt to parse to ensure it's valid JSON for saving, but keep as string in form state if it makes it easier
                                    // Or parse directly into p.parameters if direct object manipulation is preferred for the form
                                    // For now, let's assume the service layer will handle stringified JSON if needed for `createBenefitCostTemplate`.
                                    // And that editingTemplate.parameters should hold the object, not string.
                                    return { ...p, parameters: JSON.parse(val) };
                                } catch (jsonError) {
                                    // If JSON is invalid during typing, maybe just update a temporary string state or mark as error.
                                    // For simplicity now, if parse fails, it keeps the old parameters object.
                                    // A better UX would show a validation error.
                                    console.warn("Invalid JSON for parameters");
                                    return p; // Or { ...p, parametersStringForForm: val }
                                }
                            });
                        }}
                        placeholder='Enter Monetization Parameters as a JSON object.'
                    />
                    <p className="text-xs text-muted-foreground mt-1">Edit the JSON directly, or use the global settings which are used by default if this is left unchanged from default.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label>Benefit Categories</Label>
                        <div className="space-y-2 mt-1 p-2 border rounded-md max-h-40 overflow-y-auto">
                            {Object.values(BenefitCategory).map(cat => (
                                <div key={cat} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`benefit-${cat}`}
                                        checked={(editingTemplate.benefitCategories || []).includes(cat)}
                                        onCheckedChange={(checked) => handleCheckboxGroupChange('benefitCategories', cat, !!checked)}
                                    />
                                    <Label htmlFor={`benefit-${cat}`} className="font-normal">{cat}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Cost Categories</Label>
                        <div className="space-y-2 mt-1 p-2 border rounded-md max-h-40 overflow-y-auto">
                            {Object.values(CostCategory).map(cat => (
                                <div key={cat} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`cost-${cat}`}
                                        checked={(editingTemplate.costCategories || []).includes(cat)}
                                        onCheckedChange={(checked) => handleCheckboxGroupChange('costCategories', cat, !!checked)}
                                    />
                                    <Label htmlFor={`cost-${cat}`} className="font-normal">{cat}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="template-discount-rate">Default Discount Rate (%)</Label>
                        <Input 
                            id="template-discount-rate" type="number" step="0.001" 
                            value={(editingTemplate.defaultDiscountRate || 0) * 100} 
                            onChange={(e) => setEditingTemplate(p => p ? {...p, defaultDiscountRate: parseFloat(e.target.value) / 100} : null)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="template-horizon">Default Analysis Horizon (Years)</Label>
                        <Input 
                            id="template-horizon" type="number" step="1" 
                            value={editingTemplate.defaultAnalysisHorizon || 20} 
                            onChange={(e) => setEditingTemplate(p => p ? {...p, defaultAnalysisHorizon: parseInt(e.target.value)} : null)} 
                        />
                    </div>
                </div>

                <div>
                    <Label>Default Methodologies</Label>
                    <div className="space-y-2 mt-1 p-2 border rounded-md">
                        {Object.values(BenefitCostAnalysisMethod).map(method => (
                            <div key={method} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`method-${method}`}
                                    checked={(editingTemplate.methodologies || []).includes(method)}
                                    onCheckedChange={(checked) => handleCheckboxGroupChange('methodologies', method, !!checked)}
                                />
                                <Label htmlFor={`method-${method}`} className="font-normal">{method.replace(/_/g, ' ').toLocaleLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                 <div>
                    <Label htmlFor="template-grant-name">Associated Grant Program (Optional)</Label>
                    <Input 
                        id="template-grant-name" 
                        value={editingTemplate.grantProgram?.name || ''} 
                        onChange={(e) => setEditingTemplate(p => p ? {...p, grantProgram: {...(p.grantProgram || {}), name: e.target.value}} : null)} 
                        placeholder="e.g., RAISE Grant 2024"
                    />
                </div>
                 <div>
                    <Label htmlFor="template-grant-url">Grant Program URL (Optional)</Label>
                    <Input 
                        id="template-grant-url" 
                        value={editingTemplate.grantProgram?.url || ''} 
                        onChange={(e) => setEditingTemplate(p => p ? {...p, grantProgram: {...(p.grantProgram || {}), url: e.target.value}} : null)} 
                        placeholder="https://www.transportation.gov/RAISEgrants"
                    />
                </div>

                 <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="template-is-public"
                        checked={editingTemplate.isPublic || false}
                        onCheckedChange={(checked) => setEditingTemplate(p => p ? {...p, isPublic: !!checked } : null)}
                    />
                    <Label htmlFor="template-is-public" className="font-normal">Make this template public (accessible to all users in the organization)</Label>
                </div>

            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelForm} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editingTemplate.id ? 'Save Changes' : 'Create Template'}
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {showTemplateForm ? renderTemplateForm() : renderTemplatesList()}
    </div>
  );
} 