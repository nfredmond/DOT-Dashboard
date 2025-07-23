'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MonetizationParameters } from '@/types/benefit-cost';
import { getOrganizationMonetizationParameters, saveOrganizationMonetizationParameters } from '@/lib/benefit-cost-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
// import { useUser } from '@/contexts/UserContext'; // Assuming a user context to get orgId

export default function EconomicParametersPage() {
  // const { organizationId } = useUser(); // Replace with actual orgId source
  const [parameters, setParameters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, _setOrganizationId] = useState<string | null>(null);

  const [initialParameters, setInitialParameters] = useState<MonetizationParameters | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParameters = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID is not available.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetchedParams = await getOrganizationMonetizationParameters(organizationId);
      setParameters(fetchedParams);
      setInitialParameters(JSON.parse(JSON.stringify(fetchedParams))); // Deep clone for reset
      setError(null);
    } catch (err) {
      console.error("Error fetching economic parameters:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch economic parameters');
      // Keep existing parameters if fetch fails, or set to default if preferred
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    // TODO: Replace mock organizationId with actual value from context or session
    if (organizationId) {
        fetchParameters();
    }
  }, [fetchParameters, organizationId]);

  // Placeholder for handleChange and handleSave
  const handleChange = (category: keyof MonetizationParameters | null, subKey: string | null, value: string) => {
    // Implement deep update of parameters state
    // console.log("handleChange:", category, subKey, value);
    setParameters(prevParams => {
      if (!prevParams) return null;
      const newParams = JSON.parse(JSON.stringify(prevParams)) as MonetizationParameters;
      const numericValue = parseFloat(value);
      const valToSet = isNaN(numericValue) ? value : numericValue;

      if (category && subKey) {
        if (!newParams[category]) {
          (newParams[category] as any) = {};
        }
        ((newParams[category] as any)[subKey] as any) = valToSet;
      } else if (subKey) { // Top-level parameter
        (newParams[subKey as keyof MonetizationParameters] as any) = valToSet;
      } else {
        // Should not happen with current structure
        console.error("handleChange called with invalid category/subKey combination");
      }
      return newParams;
    });
  };

  const handleSave = async () => {
    if (!organizationId || !parameters) {
      toast({
        title: "Error",
        description: "Cannot save parameters. Organization ID or parameters missing.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await saveOrganizationMonetizationParameters(organizationId, parameters);
      setInitialParameters(JSON.parse(JSON.stringify(parameters))); // Update initial params on successful save
      toast({
        title: "Success",
        description: "Economic parameters saved successfully.",
      });
    } catch (err) {
      console.error("Error saving economic parameters:", err);
      toast({
        title: "Error Saving Parameters",
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    if (initialParameters) {
      setParameters(JSON.parse(JSON.stringify(initialParameters)));
      toast({ title: "Form Reset", description: "Parameters have been reset to their last saved state." });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error && !parameters) {
    // Show error only if parameters couldn't be loaded at all
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  // Render the form (very basic structure for now)
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Global Economic Parameters</CardTitle>
          <CardDescription>
            Manage the default monetization parameters for your organization. These values will be used in Benefit-Cost Analyses unless overridden.
            {error && <p className="text-sm text-red-600 mt-2">Warning: {error}. Displaying last known or default values.</p>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form structure will go here */}
          {parameters && (
            <Accordion type="multiple" className="w-full" defaultValue={['valueOfTime', 'emissions', 'accidentCosts', 'vehicleOperating', 'discount', 'health']}>
              {/* Example for Value of Time */}
              {parameters.valueOfTime && typeof parameters.valueOfTime === 'object' && (
                <AccordionItem value="valueOfTime">
                  <AccordionTrigger>Value of Time</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.valueOfTime).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`valueOfTime-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input 
                          id={`valueOfTime-${key}`}
                          type="number" 
                          value={typeof val === 'number' ? val : ''} 
                          onChange={(e) => handleChange('valueOfTime', key, e.target.value)} 
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Accident Costs */}
              {parameters.accidentCosts && typeof parameters.accidentCosts === 'object' && (
                <AccordionItem value="accidentCosts">
                  <AccordionTrigger>Accident Costs</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.accidentCosts).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`accidentCosts-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input id={`accidentCosts-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('accidentCosts', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Vehicle Operating Costs */}
              {parameters.vehicleOperating && typeof parameters.vehicleOperating === 'object' && (
                <AccordionItem value="vehicleOperating">
                  <AccordionTrigger>Vehicle Operating Costs</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.vehicleOperating).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`vehicleOperating-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input id={`vehicleOperating-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('vehicleOperating', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Emissions */}
              {parameters.emissions && typeof parameters.emissions === 'object' && (
                <AccordionItem value="emissions">
                  <AccordionTrigger>Emissions Costs</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.emissions).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`emissions-${key}`} className="capitalize">{key.toUpperCase()}</Label>
                        <Input id={`emissions-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('emissions', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* Health Benefits */}
              {parameters.health && typeof parameters.health === 'object' && (
                <AccordionItem value="health">
                  <AccordionTrigger>Health Benefits</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.health).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`health-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input id={`health-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('health', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Property Values */}
              {parameters.propertyValues && typeof parameters.propertyValues === 'object' && (
                <AccordionItem value="propertyValues">
                  <AccordionTrigger>Property Value Impacts</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.propertyValues).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`propertyValues-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input id={`propertyValues-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('propertyValues', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Economic Impacts */}
              {parameters.economic && typeof parameters.economic === 'object' && (
                <AccordionItem value="economic">
                  <AccordionTrigger>Economic Impacts</AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {Object.entries(parameters.economic).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`economic-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input id={`economic-${key}`} type="number" value={typeof val === 'number' ? val : ''} onChange={(e) => handleChange('economic', key, e.target.value)} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Discount Rate (should be after other main categories) */}
              {parameters.discount && typeof parameters.discount === 'object' && (
                 <AccordionItem value="discount">
                    <AccordionTrigger>Discounting</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                        {Object.entries(parameters.discount).map(([key, val]) => (
                            <div key={key} className="grid grid-cols-2 gap-4 items-center">
                                <Label htmlFor={`discount-${key}`} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                <Input 
                                    id={`discount-${key}`} 
                                    type="number" 
                                    value={typeof val === 'number' ? val : ''} 
                                    onChange={(e) => handleChange('discount', key, e.target.value)} 
                                />
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>Reset</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Parameters
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 