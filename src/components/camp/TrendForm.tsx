import React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendDefinition } from '@/types/trend-navigator';

interface TrendFormProps {
  initialData?: Partial<TrendDefinition>;
  onSubmit: (data: Partial<TrendDefinition>) => void;
  onCancel: () => void;
}

// Form schema for trend creation/editing
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  impacts: z.object({
    population: z.number().min(-100).max(100).optional(),
    employment: z.number().min(-100).max(100).optional(),
    tripGeneration: z.number().min(-100).max(100).optional(),
    networkCapacity: z.number().min(-100).max(100).optional(),
    networkSpeed: z.number().min(-100).max(100).optional(),
    modeChoice: z
      .object({
        auto: z.number().min(-100).max(100).optional(),
        transit: z.number().min(-100).max(100).optional(),
        walk: z.number().min(-100).max(100).optional(),
        bike: z.number().min(-100).max(100).optional(),
      })
      .optional(),
  }),
});

export default function TrendForm({ initialData, onSubmit, onCancel }: TrendFormProps) {
  // Initialize form with default values or initial data if editing
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      impacts: {
        population: initialData?.impacts?.population || 0,
        employment: initialData?.impacts?.employment || 0,
        tripGeneration: initialData?.impacts?.tripGeneration || 0,
        networkCapacity: initialData?.impacts?.networkCapacity || 0,
        networkSpeed: initialData?.impacts?.networkSpeed || 0,
        modeChoice: {
          auto: initialData?.impacts?.modeChoice?.auto || 0,
          transit: initialData?.impacts?.modeChoice?.transit || 0,
          walk: initialData?.impacts?.modeChoice?.walk || 0,
          bike: initialData?.impacts?.modeChoice?.bike || 0,
        },
      },
    },
  });

  const isEditing = !!initialData?.id;

  // Form submission handler
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...initialData,
      ...values,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Trend' : 'Create New Trend'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Autonomous Vehicles" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this transportation trend
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the trend and its expected impacts..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide context about this trend
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Socioeconomic Impacts */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Socioeconomic Impacts (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="impacts.population"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Effect on zonal population
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.employment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Effect on employment levels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.tripGeneration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Generation</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Impact on trip production/attraction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Mode Choice Impacts */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Mode Choice Impacts (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="impacts.modeChoice.auto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.modeChoice.transit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.modeChoice.walk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Walk</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.modeChoice.bike"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bike</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Network Impacts */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Network Impacts (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="impacts.networkCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Impact on road network capacity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="impacts.networkSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Speed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Impact on free-flow speeds
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? 'Save Changes' : 'Create Trend'}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 