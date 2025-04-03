import React, { useState } from 'react';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Slider,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
} from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define form schema for validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  description: z.string().optional(),
  activityParams: z.object({
    population_synthesis: z.object({
      seed_penetration_rate: z.number().min(0.01).max(1),
      scaling_factor: z.number().min(1).max(100),
      random_seed: z.number().int().optional(),
      method: z.enum(['ipf', 'bayesian', 'simple'])
    }),
    activity_generation: z.object({
      min_activities_per_person: z.number().int().min(1).max(10),
      max_activities_per_person: z.number().int().min(1).max(20),
      prioritize_mandatory: z.boolean(),
      min_activity_duration: z.number().int().min(5).max(120),
      allow_activity_chaining: z.boolean()
    }),
    travel_itinerary: z.object({
      available_modes: z.array(z.string()),
      default_mode: z.string(),
      simulate_congestion: z.boolean(),
      simulate_transit: z.boolean()
    })
  }),
  config: z.object({
    agentSampleRate: z.number().min(0.01).max(1),
    simulationDay: z.string(),
    timeStep: z.number().int().min(1).max(60),
    spatialResolution: z.number().int().min(1).max(5),
    includeTransitSimulation: z.boolean(),
    includeTrafficSimulation: z.boolean(),
    maxIterations: z.number().int().min(1).max(10),
    convergenceCriteria: z.number().min(0.001).max(0.1),
    randomSeed: z.number().int().optional()
  })
});

type FormValues = z.infer<typeof formSchema>;

interface SimulationParametersFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  scenarioData: any;
}

export default function SimulationParametersForm({ 
  onSubmit, 
  isLoading,
  scenarioData: _scenarioData 
}: SimulationParametersFormProps) {
  const [activeTab, setActiveTab] = useState('population');
  
  // Set default form values
  const defaultValues: FormValues = {
    name: `Activity Simulation ${new Date().toLocaleDateString()}`,
    description: 'Activity-based travel simulation',
    activityParams: {
      population_synthesis: {
        seed_penetration_rate: 0.1,
        scaling_factor: 10,
        method: 'simple'
      },
      activity_generation: {
        min_activities_per_person: 2,
        max_activities_per_person: 5,
        prioritize_mandatory: true,
        min_activity_duration: 15,
        allow_activity_chaining: true
      },
      travel_itinerary: {
        available_modes: ['car', 'transit', 'walk', 'bike'],
        default_mode: 'car',
        simulate_congestion: false,
        simulate_transit: true
      }
    },
    config: {
      agentSampleRate: 0.1,
      simulationDay: new Date().toISOString().split('T')[0],
      timeStep: 15,
      spatialResolution: 2,
      includeTransitSimulation: true,
      includeTrafficSimulation: false,
      maxIterations: 1,
      convergenceCriteria: 0.01
    }
  };
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Simulation Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for this simulation" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name to identify this simulation run
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
                        placeholder="Enter a description for this simulation" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about this simulation run
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="population">Population</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="population" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Population Synthesis Parameters</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="activityParams.population_synthesis.seed_penetration_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seed Penetration Rate</FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-2">
                            <Slider
                              min={0.01}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">1%</span>
                              <span className="text-xs font-medium">{(field.value * 100).toFixed(0)}%</span>
                              <span className="text-xs text-muted-foreground">100%</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Percentage of total population to simulate (higher values require more processing)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activityParams.population_synthesis.scaling_factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scaling Factor</FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-2">
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">1x</span>
                              <span className="text-xs font-medium">{field.value}x</span>
                              <span className="text-xs text-muted-foreground">100x</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Each simulated agent represents this many actual people
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activityParams.population_synthesis.method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Synthesis Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple (Fast)</SelectItem>
                            <SelectItem value="ipf">Iterative Proportional Fitting (Balanced)</SelectItem>
                            <SelectItem value="bayesian">Bayesian (Detailed)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Method used to generate the synthetic population
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Activity Generation Parameters</h3>
                
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activityParams.activity_generation.min_activities_per_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. Activities Per Person</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={10} 
                              step={1} 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of activities each person will perform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityParams.activity_generation.max_activities_per_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max. Activities Per Person</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={20} 
                              step={1} 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of activities each person can perform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="activityParams.activity_generation.min_activity_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Activity Duration (minutes)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-2">
                            <Slider
                              min={5}
                              max={120}
                              step={5}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">5 min</span>
                              <span className="text-xs font-medium">{field.value} min</span>
                              <span className="text-xs text-muted-foreground">120 min</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Shortest duration for any activity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activityParams.activity_generation.prioritize_mandatory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Prioritize Mandatory Activities
                            </FormLabel>
                            <FormDescription>
                              Give higher priority to work, education, and home activities
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityParams.activity_generation.allow_activity_chaining"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Allow Activity Chaining
                            </FormLabel>
                            <FormDescription>
                              Allow multiple activities to be performed in sequence without returning home
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="travel" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Travel Itinerary Parameters</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="activityParams.travel_itinerary.available_modes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Transportation Modes</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {['car', 'transit', 'walk', 'bike', 'rideshare', 'scooter'].map((mode) => (
                            <FormItem key={mode} className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(mode)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, mode]);
                                    } else {
                                      field.onChange(field.value.filter(val => val !== mode));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="capitalize">
                                {mode}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormDescription>
                          Select all transportation modes that should be available in the simulation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activityParams.travel_itinerary.default_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Transportation Mode</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a default mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch('activityParams.travel_itinerary.available_modes').map((mode) => (
                              <SelectItem key={mode} value={mode}>
                                <span className="capitalize">{mode}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default transportation mode when no better option is available
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activityParams.travel_itinerary.simulate_transit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Simulate Public Transit
                            </FormLabel>
                            <FormDescription>
                              Include detailed public transit simulation (routes, schedules, transfers)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityParams.travel_itinerary.simulate_congestion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Simulate Traffic Congestion
                            </FormLabel>
                            <FormDescription>
                              Include traffic congestion effects (requires more processing time)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Simulation...
              </>
            ) : (
              'Run Simulation'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 