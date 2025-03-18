import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, 'Simulation name is required'),
  description: z.string().optional(),
  sample_rate: z.number().min(0.01).max(1),
  activity_count: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1)
  }),
  mode_preferences: z.object({
    walk: z.number().min(0).max(1),
    bike: z.number().min(0).max(1),
    transit: z.number().min(0).max(1),
    car: z.number().min(0).max(1)
  })
});

type FormValues = z.infer<typeof formSchema>;

export default function NewActivitySimulationPage(props) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: scenarioId } = router.query;
  
  const [scenarioName, setScenarioName] = useState('Scenario');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      sample_rate: 0.1,
      activity_count: {
        min: 3,
        max: 8
      },
      mode_preferences: {
        walk: 0.3,
        bike: 0.2,
        transit: 0.2,
        car: 0.3
      }
    }
  });
  
  useEffect(() => {
    if (!scenarioId) return;
    
    const fetchScenario = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch scenario: ${response.statusText}`);
        }
        
        const data = await response.json();
        setScenarioName(data.name || 'Scenario');
      } catch (err) {
        console.error('Error fetching scenario:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch scenario data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenario();
  }, [scenarioId]);
  
  const onSubmit = async (values: FormValues) => {
    if (!scenarioId) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/activity-simulations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          parameters: {
            activity_based: {
              sample_rate: values.sample_rate,
              activity_count: values.activity_count,
              mode_preferences: values.mode_preferences
            }
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create simulation: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Simulation created',
        description: 'Your activity-based simulation has been created and is now running.',
      });
      
      router.push(`/scenarios/${scenarioId}/activity-simulations/${data.id}`);
    } catch (err) {
      console.error('Error creating simulation:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create the simulation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <p>Loading scenario data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{`New Activity Simulation | ${scenarioName} | Planning Tool`}</title>
      </Head>
      
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/scenarios">Scenarios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/scenarios/${scenarioId}`}>{scenarioName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/scenarios/${scenarioId}/activity-simulations`}>
              Activity Simulations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>New Simulation</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">New Activity-Based Simulation</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Simulation Configuration</CardTitle>
                <CardDescription>
                  Configure and run an activity-based simulation for {scenarioName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Simulation Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Baseline 2023" {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name for this simulation run
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a description for this simulation run" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Additional details about the purpose of this simulation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sample_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Population Sample Rate: {(field.value * 100).toFixed(0)}%</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value * 100]}
                              onValueChange={(value) => field.onChange(value[0] / 100)}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of the total population to simulate (higher values increase accuracy but require more processing time)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="activity_count.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Activities Per Person</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={10} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription>
                              Minimum number of activities per person
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="activity_count.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Activities Per Person</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={20} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription>
                              Maximum number of activities per person
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Mode Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Set the relative preference weights for different travel modes
                      </p>
                      
                      <FormField
                        control={form.control}
                        name="mode_preferences.walk"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Walking: {(field.value * 100).toFixed(0)}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value * 100]}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mode_preferences.bike"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cycling: {(field.value * 100).toFixed(0)}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value * 100]}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mode_preferences.transit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Public Transit: {(field.value * 100).toFixed(0)}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value * 100]}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mode_preferences.car"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Car: {(field.value * 100).toFixed(0)}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value * 100]}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create and Run Simulation
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About Activity-Based Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm">
                  <p>
                    Activity-based simulation models the behavior of individual agents (people) 
                    throughout a day, generating realistic activity patterns and travel behaviors.
                  </p>
                  
                  <h4>Key Parameters:</h4>
                  
                  <ul>
                    <li>
                      <strong>Sample Rate</strong>: Controls the proportion of the population 
                      to simulate. Higher values are more accurate but take longer to run.
                    </li>
                    <li>
                      <strong>Activity Count</strong>: The range of activities each person 
                      will have in their daily schedule, including mandatory (work/school) 
                      and discretionary (shopping/leisure) activities.
                    </li>
                    <li>
                      <strong>Mode Preferences</strong>: Affects the likelihood of choosing 
                      different transportation modes based on distance, demographics, and 
                      availability.
                    </li>
                  </ul>
                  
                  <p>
                    The simulation generates synthetic populations, assigns activities, and 
                    creates travel itineraries between activities. Results provide insights 
                    into travel patterns, mode choices, and activity distributions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 