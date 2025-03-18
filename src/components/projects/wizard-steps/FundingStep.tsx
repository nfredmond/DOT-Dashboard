"use client"

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Project, FundingSource } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BadgeDollarSign, DollarSign, Info, Plus, XIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';

interface FundingStepProps {
  projectData: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  errors: string[];
}

const FundingStep: React.FC<FundingStepProps> = ({ projectData, onSave, errors }) => {
  const [formData, setFormData] = useState({
    estimatedCost: projectData.estimatedCost || 0,
    allocatedBudget: projectData.allocatedBudget || 0,
    pseBudget: projectData.pseBudget || 0, // Plans, Specifications & Estimates budget
    ceBudget: projectData.ceBudget || 0, // Construction Engineering budget
    fundingSources: projectData.fundingSources || [] as FundingSource[],
  });
  
  // State for new funding source form
  const [newFundingSource, setNewFundingSource] = useState({
    name: '',
    amount: 0,
    secured: false,
    description: '',
  });
  
  // Calculate total secured funding
  const totalSecuredFunding = formData.fundingSources
    .filter(source => source.secured)
    .reduce((sum, source) => sum + source.amount, 0);
  
  // Calculate total funding (secured and unsecured)
  const totalFunding = formData.fundingSources
    .reduce((sum, source) => sum + source.amount, 0);
  
  // Calculate funding gap
  const fundingGap = formData.estimatedCost - totalFunding;
  
  useEffect(() => {
    // Save form data whenever it changes
    onSave(formData);
  }, [formData, onSave]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['estimatedCost', 'allocatedBudget', 'pseBudget', 'ceBudget'].includes(name)) {
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNewFundingSourceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const numValue = parseFloat(value);
      setNewFundingSource(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setNewFundingSource(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSecuredChange = (checked: boolean) => {
    setNewFundingSource(prev => ({
      ...prev,
      secured: checked
    }));
  };
  
  const addFundingSource = () => {
    if (!newFundingSource.name.trim()) {
      return; // Don't add if name is empty
    }
    
    const newSource: FundingSource = {
      id: `source-${Date.now()}`, // Generate a unique ID
      ...newFundingSource
    };
    
    setFormData(prev => ({
      ...prev,
      fundingSources: [...prev.fundingSources, newSource]
    }));
    
    // Reset the form
    setNewFundingSource({
      name: '',
      amount: 0,
      secured: false,
      description: '',
    });
  };
  
  const removeFundingSource = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fundingSources: prev.fundingSources.filter(source => source.id !== id)
    }));
  };
  
  // Function to update funding source secured status
  const toggleSourceSecured = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fundingSources: prev.fundingSources.map(source => 
        source.id === id ? { ...source, secured: !source.secured } : source
      )
    }));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Project Budget</CardTitle>
          <CardDescription>
            Enter estimated cost and budget information for the project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Total Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedCost"
                  name="estimatedCost"
                  type="number"
                  value={formData.estimatedCost || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-8"
                  step="1000"
                  min="0"
                />
              </div>
              {errors.includes('Estimated cost is required and must be a positive number') && (
                <p className="text-xs text-destructive">Estimated cost is required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allocatedBudget">Allocated Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="allocatedBudget"
                  name="allocatedBudget"
                  type="number"
                  value={formData.allocatedBudget || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-8"
                  step="1000"
                  min="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pseBudget">PS&E Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pseBudget"
                  name="pseBudget"
                  type="number"
                  value={formData.pseBudget || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-8"
                  step="1000"
                  min="0"
                />
              </div>
              <p className="text-xs text-muted-foreground">Plans, Specifications & Estimates</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ceBudget">CE Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ceBudget"
                  name="ceBudget"
                  type="number"
                  value={formData.ceBudget || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-8"
                  step="1000"
                  min="0"
                />
              </div>
              <p className="text-xs text-muted-foreground">Construction Engineering</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Funding Sources</CardTitle>
              <CardDescription>
                Add all funding sources for this project
              </CardDescription>
            </div>
            <div className="text-sm font-medium">
              Gap: <span className={fundingGap > 0 ? "text-destructive" : "text-green-600"}>
                {formatCurrency(fundingGap)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Funding Sources List */}
            {formData.fundingSources.length > 0 ? (
              <div className="space-y-3">
                {formData.fundingSources.map((source) => (
                  <div 
                    key={source.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={source.secured}
                        onCheckedChange={() => toggleSourceSecured(source.id)}
                      />
                      <div>
                        <div className="font-medium">{source.name}</div>
                        {source.description && (
                          <div className="text-sm text-muted-foreground">{source.description}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`font-medium ${source.secured ? "text-green-600" : "text-muted-foreground"}`}>
                        {formatCurrency(source.amount)}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFundingSource(source.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between text-sm pt-2 border-t">
                  <div>Total Secured Funding:</div>
                  <div className="font-bold text-green-600">{formatCurrency(totalSecuredFunding)}</div>
                </div>
                
                <div className="flex justify-between text-sm pt-2">
                  <div>Total All Funding:</div>
                  <div className="font-bold">{formatCurrency(totalFunding)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BadgeDollarSign className="mx-auto h-10 w-10 opacity-20 mb-2" />
                <p>No funding sources added yet</p>
              </div>
            )}
            
            {/* Add New Funding Source Form */}
            <div className="p-3 border rounded-md bg-muted/30">
              <h3 className="font-medium mb-3">Add New Funding Source</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="fundingSourceName">Source Name</Label>
                  <Input
                    id="fundingSourceName"
                    name="name"
                    value={newFundingSource.name}
                    onChange={handleNewFundingSourceChange}
                    placeholder="e.g., Federal CMAQ, SB1, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fundingAmount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fundingAmount"
                      name="amount"
                      type="number"
                      value={newFundingSource.amount || ''}
                      onChange={handleNewFundingSourceChange}
                      placeholder="0.00"
                      className="pl-8"
                      step="1000"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fundingSourceSecured">Secured</Label>
                    <Switch
                      id="fundingSourceSecured"
                      checked={newFundingSource.secured}
                      onCheckedChange={handleSecuredChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Is this funding already secured or just potential?
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fundingSourceDescription">Description (Optional)</Label>
                  <Input
                    id="fundingSourceDescription"
                    name="description"
                    value={newFundingSource.description}
                    onChange={handleNewFundingSourceChange}
                    placeholder="Additional details about this funding source"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={addFundingSource}
                  disabled={!newFundingSource.name.trim() || newFundingSource.amount <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funding Source
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Alert className="bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        <Info className="h-4 w-4 mr-2" />
        <AlertDescription>
          Accurately tracking secured vs. potential funding sources helps with project prioritization and financial planning.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FundingStep; 