import React, { useState, useEffect } from 'react';
import { 
  BenefitCostAnalysis, 
  BenefitCostTemplate, 
  BenefitCategory, 
  CostCategory,
  BenefitValueCalculation,
  CostValueCalculation,
  BenefitCostTimeSeries,
  MonetizationParameters
} from '@/types/benefit-cost';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Button 
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { getBenefitCostTemplates } from '@/lib/benefit-cost-service';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../lib/logger';

interface BenefitCostFormProps {
  projectId: string;
  initialAnalysis?: BenefitCostAnalysis;
  onSave: (analysis: BenefitCostAnalysis) => void;
  onCancel: () => void;
}

export function BenefitCostForm({ projectId, initialAnalysis, onSave, onCancel }: BenefitCostFormProps) {
  const [templates, setTemplates] = useState<BenefitCostTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [analysis, setAnalysis] = useState<Partial<BenefitCostAnalysis>>(
    initialAnalysis || {
      id: uuidv4(),
      projectId,
      name: 'New Benefit-Cost Analysis',
      description: '',
      discountRate: 0.07,
      baseYear: new Date().getFullYear(),
      analysisHorizon: 20,
      benefits: [],
      costs: [],
      parameters: {},
      isPublic: false,
      status: 'draft',
      methodology: '',
      netPresentValue: 0,
      benefitCostRatio: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      annualBenefits: [],
      annualCosts: []
    }
  );
  
  const [activeTab, setActiveTab] = useState('general');
  
  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getBenefitCostTemplates();
        setTemplates(data);
        
        // If no template selected yet and we have templates, select the first one
        if (!selectedTemplate && data.length > 0) {
          setSelectedTemplate(data[0].id);
          
          // If new analysis (no initialAnalysis), apply template defaults
          if (!initialAnalysis) {
            setAnalysis(prev => ({
              ...prev,
              parameters: { 
                valueOfTime: {
                  commuter: 18.80,
                  commercial: 32.60,
                  freight: 38.50
                },
                accidentCosts: {
                  fatal: 11600000,
                  injury: 125000,
                  propertyDamage: 4500
                },
                emissions: {
                  co2: 51,
                  nox: 7400,
                  pm: 380000
                },
                vehicleOperating: {
                  fuelCost: 3.50,
                  maintenance: 0.15,
                  depreciation: 0.28
                },
                health: {
                  walking: 0.92,
                  biking: 0.41
                }
              },
              discountRate: data[0].defaultDiscountRate,
              analysisHorizon: data[0].defaultAnalysisHorizon,
              methodology: data[0].name
            }));
          }
        }
      } catch (error) {
        logger.error('Error loading benefit-cost templates:', error);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Ask for confirmation if there's already data
      if (analysis.benefits?.length || analysis.costs?.length) {
        const confirmed = window.confirm(
          'Changing the template will reset your current benefit and cost data. Continue?'
        );
        
        if (!confirmed) return;
      }
      
      // Apply template settings
      setAnalysis(prev => ({
        ...prev,
        parameters: { 
          valueOfTime: {
            commuter: 18.80,
            commercial: 32.60,
            freight: 38.50
          },
          accidentCosts: {
            fatal: 11600000,
            injury: 125000,
            propertyDamage: 4500
          },
          emissions: {
            co2: 51,
            nox: 7400,
            pm: 380000
          },
          vehicleOperating: {
            fuelCost: 3.50,
            maintenance: 0.15,
            depreciation: 0.28
          },
          health: {
            walking: 0.92,
            biking: 0.41
          }
        },
        discountRate: template.defaultDiscountRate,
        analysisHorizon: template.defaultAnalysisHorizon,
        methodology: template.name,
        benefits: [],
        costs: []
      }));
    }
  };
  
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    setAnalysis(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add a new benefit category
  const addBenefitCategory = (categoryName: string) => {
    // Check if this category already exists
    if (analysis.benefits?.some(b => b.category === categoryName)) {
      alert('This benefit category already exists in the analysis.');
      return;
    }
    
    // Create a new empty benefit
    const newBenefit: BenefitValueCalculation = {
      id: uuidv4(),
      category: categoryName as BenefitCategory,
      description: `Benefits from ${categoryName}`,
      annualValue: 0,
      growthRate: 0,
      presentValue: 0,
      totalValue: 0,
      annualValues: [],
      parameters: {}
    };
    
    setAnalysis(prev => ({
      ...prev,
      benefits: [...(prev.benefits || []), newBenefit]
    }));
  };
  
  // Add a new cost category
  const addCostCategory = (categoryName: string) => {
    // Check if this category already exists
    if (analysis.costs?.some(c => c.category === categoryName)) {
      alert('This cost category already exists in the analysis.');
      return;
    }
    
    // Create a new empty cost
    const newCost: CostValueCalculation = {
      id: uuidv4(),
      category: categoryName as CostCategory,
      description: `Costs for ${categoryName}`,
      annualValue: 0, 
      growthRate: 0,
      presentValue: 0,
      totalValue: 0,
      annualValues: [],
      parameters: {}
    };
    
    setAnalysis(prev => ({
      ...prev,
      costs: [...(prev.costs || []), newCost]
    }));
  };
  
  // Remove a benefit category
  const removeBenefitCategory = (index: number) => {
    setAnalysis(prev => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Remove a cost category
  const removeCostCategory = (index: number) => {
    setAnalysis(prev => ({
      ...prev,
      costs: prev.costs?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Update benefit values
  const updateBenefitValues = (index: number, field: string, value: any) => {
    setAnalysis(prev => {
      const newBenefits = [...(prev.benefits || [])];
      
      if (field === 'annualValue') {
        // Update the annual value and calculate present value (simplified)
        const annualValue = Number(value);
        const rate = prev.discountRate || 0.07;
        const years = prev.analysisHorizon || 20;
        
        // Simple present value calculation (not accounting for growth)
        let presentValue = 0;
        for (let i = 0; i < years; i++) {
          presentValue += annualValue / Math.pow(1 + rate, i);
        }
        
        newBenefits[index] = {
          ...newBenefits[index],
          annualValue,
          presentValue: Math.round(presentValue)
        };
      } else {
        newBenefits[index] = {
          ...newBenefits[index],
          [field]: value
        };
      }
      
      return {
        ...prev,
        benefits: newBenefits
      };
    });
  };
  
  // Update cost values
  const updateCostValues = (index: number, field: string, value: any) => {
    setAnalysis(prev => {
      const newCosts = [...(prev.costs || [])];
      
      if (field === 'annualValue') {
        // Update the annual value and calculate present value (simplified)
        const annualValue = Number(value);
        const rate = prev.discountRate || 0.07;
        const years = prev.analysisHorizon || 20;
        
        // Simple present value calculation (not accounting for growth)
        let presentValue = 0;
        for (let i = 0; i < years; i++) {
          presentValue += annualValue / Math.pow(1 + rate, i);
        }
        
        newCosts[index] = {
          ...newCosts[index],
          annualValue,
          presentValue: Math.round(presentValue)
        };
      } else {
        newCosts[index] = {
          ...newCosts[index],
          [field]: value
        };
      }
      
      return {
        ...prev,
        costs: newCosts
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!analysis.name) {
      alert('Please provide a name for this analysis.');
      return;
    }
    
    if (!analysis.baseYear) {
      alert('Please provide a base year for this analysis.');
      return;
    }
    
    if (!analysis.benefits || analysis.benefits.length === 0) {
      alert('Please add at least one benefit category.');
      return;
    }
    
    if (!analysis.costs || analysis.costs.length === 0) {
      alert('Please add at least one cost category.');
      return;
    }

    // Generate annual values for benefits and costs
    const formAnnualBenefits: BenefitCostTimeSeries[] = [];
    const formAnnualCosts: BenefitCostTimeSeries[] = [];
    
    const baseYear = analysis.baseYear || new Date().getFullYear();
    const years = analysis.analysisHorizon || 20;
    
    // Generate annual benefit values
    for (const benefit of analysis.benefits || []) {
      for (let i = 0; i < years; i++) {
        const year = baseYear + i;
        const growthFactor = Math.pow(1 + (benefit.growthRate || 0), i);
        const value = (benefit.annualValue || 0) * growthFactor;
        
        formAnnualBenefits.push({
          year,
          category: benefit.category as string,
          value,
          presentValue: value / Math.pow(1 + (analysis.discountRate || 0.07), i)
        });
      }
    }
    
    // Generate annual cost values
    for (const cost of analysis.costs || []) {
      for (let i = 0; i < years; i++) {
        const year = baseYear + i;
        const growthFactor = Math.pow(1 + (cost.growthRate || 0), i);
        const value = (cost.annualValue || 0) * growthFactor;
        
        formAnnualCosts.push({
          year,
          category: cost.category as string,
          value,
          presentValue: value / Math.pow(1 + (analysis.discountRate || 0.07), i)
        });
      }
    }
    
    // Calculate benefit-cost ratio based on present values
    const totalBenefitsPV = analysis.benefits?.reduce((sum, b) => sum + b.presentValue, 0) || 0;
    const totalCostsPV = analysis.costs?.reduce((sum, c) => sum + c.presentValue, 0) || 0;
    const bcRatio = totalCostsPV > 0 ? totalBenefitsPV / totalCostsPV : 0;
    const npv = totalBenefitsPV - totalCostsPV;
    
    // Update analysis with calculations
    const completedAnalysis: BenefitCostAnalysis = {
      ...analysis as BenefitCostAnalysis,
      annualBenefits: formAnnualBenefits,
      annualCosts: formAnnualCosts,
      benefitCostRatio: bcRatio,
      netPresentValue: npv,
      updatedAt: new Date().toISOString()
    };
    
    // Call the save handler with the current analysis
    onSave(completedAnalysis);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>
        
        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic information about this benefit-cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Analysis Template</Label>
                <Select 
                  value={selectedTemplate} 
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Templates provide default parameters and methodologies for specific grant programs.
                </p>
              </div>
              
              {/* Name and description */}
              <div className="space-y-2">
                <Label htmlFor="name">Analysis Name</Label>
                <Input 
                  id="name" 
                  value={analysis.name || ''} 
                  onChange={e => handleChange('name', e.target.value)} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={analysis.description || ''} 
                  onChange={e => handleChange('description', e.target.value)} 
                  rows={3}
                />
              </div>
              
              {/* Analysis parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseYear">Base Year</Label>
                  <Input 
                    id="baseYear" 
                    type="number" 
                    value={analysis.baseYear || new Date().getFullYear()} 
                    onChange={e => handleChange('baseYear', parseInt(e.target.value))} 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="analysisHorizon">Analysis Horizon (Years)</Label>
                  <Input 
                    id="analysisHorizon" 
                    type="number" 
                    min={1}
                    max={100}
                    value={analysis.analysisHorizon || 20} 
                    onChange={e => handleChange('analysisHorizon', parseInt(e.target.value))} 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <Input 
                    id="discountRate" 
                    type="number" 
                    min={0}
                    max={20}
                    step={0.1}
                    value={(analysis.discountRate || 0.07) * 100} 
                    onChange={e => handleChange('discountRate', parseFloat(e.target.value) / 100)} 
                    required
                  />
                  <p className="text-xs text-gray-500">
                    OMB Circular A-94 recommends 7% as the default
                  </p>
                </div>
              </div>
              
              {/* Status and visibility */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={analysis.status || 'draft'} 
                  onValueChange={value => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublic" 
                  checked={analysis.isPublic || false}
                  onCheckedChange={value => handleChange('isPublic', value)}
                />
                <Label htmlFor="isPublic">
                  Make this analysis visible to all organization members
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Benefits Tab */}
        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
              <CardDescription>
                Add and configure benefit categories for this analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add benefit button */}
              <div>
                <Label>Add a Benefit Category</Label>
                <div className="flex space-x-2 mt-1">
                  <Select onValueChange={addBenefitCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BenefitCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* List of current benefits */}
              <div className="space-y-4">
                {analysis.benefits?.map((benefit, index) => (
                  <Card key={`benefit-${index}`}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md">{benefit.category}</CardTitle>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeBenefitCategory(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 space-y-4">
                      {/* Annual value input */}
                      <div className="space-y-2">
                        <Label>Annual Value ($)</Label>
                        <Input 
                          type="number" 
                          value={benefit.annualValue || 0}
                          onChange={e => updateBenefitValues(
                            index, 
                            'annualValue', 
                            parseFloat(e.target.value)
                          )}
                        />
                        <p className="text-xs text-gray-500">
                          Enter the annual monetary value for this benefit
                        </p>
                      </div>
                      
                      {/* Growth rate input */}
                      <div className="space-y-2">
                        <Label>Annual Growth Rate (%)</Label>
                        <Input 
                          type="number"
                          min={-10}
                          max={10}
                          step={0.1} 
                          value={(benefit.growthRate || 0) * 100}
                          onChange={e => updateBenefitValues(
                            index, 
                            'growthRate', 
                            parseFloat(e.target.value) / 100
                          )}
                        />
                        <p className="text-xs text-gray-500">
                          Expected annual growth rate of this benefit
                        </p>
                      </div>
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={benefit.description || ''}
                          onChange={e => updateBenefitValues(index, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      
                      {/* Calculated present value */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Present Value:</span>
                          <span className="font-medium">${benefit.presentValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!analysis.benefits || analysis.benefits.length === 0) && (
                  <p className="text-center text-gray-500 italic py-4">
                    No benefit categories added yet. Use the dropdown above to add benefits.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Costs Tab */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Costs</CardTitle>
              <CardDescription>
                Add and configure cost categories for this analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add cost button */}
              <div>
                <Label>Add a Cost Category</Label>
                <div className="flex space-x-2 mt-1">
                  <Select onValueChange={addCostCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CostCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* List of current costs */}
              <div className="space-y-4">
                {analysis.costs?.map((cost, index) => (
                  <Card key={`cost-${index}`}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md">{cost.category}</CardTitle>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeCostCategory(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 space-y-4">
                      {/* Annual value */}
                      <div className="space-y-2">
                        <Label>Annual Cost ($)</Label>
                        <Input 
                          type="number" 
                          value={cost.annualValue || 0}
                          onChange={e => updateCostValues(
                            index, 
                            'annualValue', 
                            parseFloat(e.target.value)
                          )}
                        />
                        <p className="text-xs text-gray-500">
                          Enter the annual cost for this category
                        </p>
                      </div>
                      
                      {/* Growth rate input */}
                      <div className="space-y-2">
                        <Label>Annual Growth Rate (%)</Label>
                        <Input 
                          type="number"
                          min={-10}
                          max={10}
                          step={0.1} 
                          value={(cost.growthRate || 0) * 100}
                          onChange={e => updateCostValues(
                            index, 
                            'growthRate', 
                            parseFloat(e.target.value) / 100
                          )}
                        />
                        <p className="text-xs text-gray-500">
                          Expected annual growth rate of this cost
                        </p>
                      </div>
                      
                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={cost.description || ''}
                          onChange={e => updateCostValues(index, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      
                      {/* Calculated present value */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Present Value:</span>
                          <span className="font-medium">${cost.presentValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!analysis.costs || analysis.costs.length === 0) && (
                  <p className="text-center text-gray-500 italic py-4">
                    No cost categories added yet. Use the dropdown above to add costs.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Parameters Tab */}
        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Parameters</CardTitle>
              <CardDescription>
                Configure the parameters used for monetizing benefits and costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Value of time parameters */}
              <div>
                <h3 className="text-lg font-medium mb-2">Value of Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Commuter ($/hour)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.valueOfTime?.commuter || 18.8}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.valueOfTime || typeof newParams.valueOfTime !== 'object') {
                          newParams.valueOfTime = { commuter: 18.8, commercial: 32.6, freight: 38.5 };
                        }
                        (newParams.valueOfTime as any).commuter = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commercial ($/hour)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.valueOfTime?.commercial || 32.6}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.valueOfTime || typeof newParams.valueOfTime !== 'object') {
                          newParams.valueOfTime = { commuter: 18.8, commercial: 32.6, freight: 38.5 };
                        }
                        (newParams.valueOfTime as any).commercial = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Freight ($/hour)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.valueOfTime?.freight || 38.5}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.valueOfTime || typeof newParams.valueOfTime !== 'object') {
                          newParams.valueOfTime = { commuter: 18.8, commercial: 32.6, freight: 38.5 };
                        }
                        (newParams.valueOfTime as any).freight = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                </div>
                {/* Legacy value of time (for backward compatibility) */}
                {(analysis.parameters as MonetizationParameters)?.valueOfTime_legacy !== undefined && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm text-amber-700">
                      Legacy value of time: ${(analysis.parameters as MonetizationParameters)?.valueOfTime_legacy} per hour
                      <Button
                        variant="link"
                        className="h-auto p-0 ml-2 text-amber-700"
                        onClick={() => {
                          const newParams = {...(analysis.parameters || {})};
                          delete newParams.valueOfTime_legacy;
                          handleChange('parameters', newParams);
                        }}
                      >
                        Migrate to new format
                      </Button>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Safety parameters */}
              <div>
                <h3 className="text-lg font-medium mb-2">Safety Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fatality Cost ($)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.accidentCosts?.fatal || 11000000}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.accidentCosts || typeof newParams.accidentCosts !== 'object') {
                          newParams.accidentCosts = { fatal: 11000000, injury: 125000, propertyDamage: 4500 };
                        }
                        (newParams.accidentCosts as any).fatal = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Injury Cost ($)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.accidentCosts?.injury || 125000}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.accidentCosts || typeof newParams.accidentCosts !== 'object') {
                          newParams.accidentCosts = { fatal: 11000000, injury: 125000, propertyDamage: 4500 };
                        }
                        (newParams.accidentCosts as any).injury = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Property Damage Only ($)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.accidentCosts?.propertyDamage || 4500}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.accidentCosts || typeof newParams.accidentCosts !== 'object') {
                          newParams.accidentCosts = { fatal: 11000000, injury: 125000, propertyDamage: 4500 };
                        }
                        (newParams.accidentCosts as any).propertyDamage = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                </div>
                {/* Legacy safety values (for backward compatibility) */}
                {((analysis.parameters as MonetizationParameters)?.fatalityCost !== undefined || 
                  (analysis.parameters as MonetizationParameters)?.injuryCost !== undefined) && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm text-amber-700">
                      Legacy safety values detected
                      <Button
                        variant="link"
                        className="h-auto p-0 ml-2 text-amber-700"
                        onClick={() => {
                          const newParams = {...(analysis.parameters || {})};
                          const fatal = newParams.fatalityCost;
                          const injury = newParams.injuryCost;
                          if (!newParams.accidentCosts) {
                            newParams.accidentCosts = { 
                              fatal: fatal as number || 11000000, 
                              injury: injury as number || 125000, 
                              propertyDamage: 4500 
                            };
                          }
                          delete newParams.fatalityCost;
                          delete newParams.injuryCost;
                          handleChange('parameters', newParams);
                        }}
                      >
                        Migrate to new format
                      </Button>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Emissions parameters */}
              <div>
                <h3 className="text-lg font-medium mb-2">Emissions Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CO₂ ($/metric ton)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.emissions?.co2 || 51}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.emissions || typeof newParams.emissions !== 'object') {
                          newParams.emissions = { co2: 51, nox: 7400, pm: 380000 };
                        }
                        (newParams.emissions as any).co2 = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NOx ($/ton)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.emissions?.nox || 7400}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.emissions || typeof newParams.emissions !== 'object') {
                          newParams.emissions = { co2: 51, nox: 7400, pm: 380000 };
                        }
                        (newParams.emissions as any).nox = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PM ($/ton)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.emissions?.pm || 380000}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.emissions || typeof newParams.emissions !== 'object') {
                          newParams.emissions = { co2: 51, nox: 7400, pm: 380000 };
                        }
                        (newParams.emissions as any).pm = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                </div>
                {/* Legacy emissions value (for backward compatibility) */}
                {(analysis.parameters as MonetizationParameters)?.emissionsCostPerTon !== undefined && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm text-amber-700">
                      Legacy emissions value: ${(analysis.parameters as MonetizationParameters)?.emissionsCostPerTon} per ton
                      <Button
                        variant="link"
                        className="h-auto p-0 ml-2 text-amber-700"
                        onClick={() => {
                          const newParams = {...(analysis.parameters || {})};
                          delete newParams.emissionsCostPerTon;
                          handleChange('parameters', newParams);
                        }}
                      >
                        Migrate to new format
                      </Button>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Vehicle operating costs */}
              <div>
                <h3 className="text-lg font-medium mb-2">Vehicle Operating Costs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fuel Cost ($/gallon)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.vehicleOperating?.fuelCost || 3.5}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.vehicleOperating || typeof newParams.vehicleOperating !== 'object') {
                          newParams.vehicleOperating = { fuelCost: 3.5, maintenance: 0.15, depreciation: 0.28 };
                        }
                        (newParams.vehicleOperating as any).fuelCost = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maintenance ($/mile)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.vehicleOperating?.maintenance || 0.15}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.vehicleOperating || typeof newParams.vehicleOperating !== 'object') {
                          newParams.vehicleOperating = { fuelCost: 3.5, maintenance: 0.15, depreciation: 0.28 };
                        }
                        (newParams.vehicleOperating as any).maintenance = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Depreciation ($/mile)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.vehicleOperating?.depreciation || 0.28}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.vehicleOperating || typeof newParams.vehicleOperating !== 'object') {
                          newParams.vehicleOperating = { fuelCost: 3.5, maintenance: 0.15, depreciation: 0.28 };
                        }
                        (newParams.vehicleOperating as any).depreciation = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Health benefits */}
              <div>
                <h3 className="text-lg font-medium mb-2">Health Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Walking ($/mile)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.health?.walking || 0.92}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.health || typeof newParams.health !== 'object') {
                          newParams.health = { walking: 0.92, biking: 0.41 };
                        }
                        (newParams.health as any).walking = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Biking ($/mile)</Label>
                    <Input 
                      type="number" 
                      value={(analysis.parameters as MonetizationParameters)?.health?.biking || 0.41}
                      onChange={e => {
                        const newParams = {...(analysis.parameters || {})};
                        if (!newParams.health || typeof newParams.health !== 'object') {
                          newParams.health = { walking: 0.92, biking: 0.41 };
                        }
                        (newParams.health as any).biking = parseFloat(e.target.value);
                        handleChange('parameters', newParams);
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialAnalysis ? 'Update Analysis' : 'Create Analysis'}
        </Button>
      </div>
    </form>
  );
} 