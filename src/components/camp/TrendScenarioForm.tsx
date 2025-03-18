import React, { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TrendDefinition, TrendImpact, TrendScenario } from '@/types/trend-navigator';
import { Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrendScenarioFormProps {
  initialData?: Partial<TrendScenario>;
  availableTrends: TrendDefinition[];
  onSubmit: (data: Partial<TrendScenario>) => void;
  onCancel: () => void;
}

// Form schema for scenario creation/editing
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  trendImpacts: z.array(
    z.object({
      trendId: z.string(),
      intensity: z.number().min(0).max(100),
    })
  ),
});

export default function TrendScenarioForm({
  initialData,
  availableTrends,
  onSubmit,
  onCancel,
}: TrendScenarioFormProps) {
  const [selectedTrends, setSelectedTrends] = useState<TrendImpact[]>(
    initialData?.trendImpacts || []
  );
  const [currentTrend, setCurrentTrend] = useState<string>('');
  const [currentIntensity, setCurrentIntensity] = useState<number>(50);

  // Initialize form with default values or initial data if editing
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      trendImpacts: initialData?.trendImpacts || [],
    },
  });

  const isEditing = !!initialData?.id;

  // Get available trends (exclude already selected ones)
  const getAvailableTrends = () => {
    return availableTrends.filter(
      (trend) => !selectedTrends.some((selected) => selected.trendId === trend.id)
    );
  };

  // Add a trend to the selected trends
  const handleAddTrend = () => {
    if (!currentTrend) return;

    const newTrendImpact: TrendImpact = {
      trendId: currentTrend,
      intensity: currentIntensity,
    };

    const updatedTrends = [...selectedTrends, newTrendImpact];
    setSelectedTrends(updatedTrends);
    form.setValue('trendImpacts', updatedTrends);

    // Reset selection
    setCurrentTrend('');
    setCurrentIntensity(50);
  };

  // Remove a trend from the selected trends
  const handleRemoveTrend = (trendId: string) => {
    const updatedTrends = selectedTrends.filter((trend) => trend.trendId !== trendId);
    setSelectedTrends(updatedTrends);
    form.setValue('trendImpacts', updatedTrends);
  };

  // Update trend intensity
  const handleIntensityChange = (trendId: string, intensity: number) => {
    const updatedTrends = selectedTrends.map((trend) =>
      trend.trendId === trendId ? { ...trend, intensity } : trend
    );
    
    setSelectedTrends(updatedTrends);
    form.setValue('trendImpacts', updatedTrends);
  };

  // Get trend name by ID
  const getTrendNameById = (trendId: string): string => {
    const trend = availableTrends.find((t) => t.id === trendId);
    return trend?.name || 'Unknown trend';
  };

  // Form submission handler
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...initialData,
      ...values,
      trendImpacts: selectedTrends,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Scenario' : 'Create New Scenario'}</CardTitle>
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
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="2030 High Tech Scenario" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this scenario
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
                        placeholder="This scenario explores the impact of future technology trends..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide context about this scenario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trend Impacts */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Selected Trends</h3>
              
              {/* Display selected trends */}
              {selectedTrends.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No trends selected. Add trends below to include in this scenario.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTrends.map((trendImpact) => (
                    <div 
                      key={trendImpact.trendId} 
                      className="border rounded-md p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{getTrendNameById(trendImpact.trendId)}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTrend(trendImpact.trendId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Intensity</span>
                          <Badge>{trendImpact.intensity}%</Badge>
                        </div>
                        <Slider
                          value={[trendImpact.intensity]}
                          min={0}
                          max={100}
                          step={5}
                          className="py-4"
                          onValueChange={(values) => 
                            handleIntensityChange(trendImpact.trendId, values[0])
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Impact</span>
                          <span>High Impact</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new trend */}
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="text-sm font-medium">Add Trend</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select Trend</label>
                    <Select 
                      value={currentTrend} 
                      onValueChange={setCurrentTrend}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trend to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTrends().map((trend) => (
                          <SelectItem key={trend.id} value={trend.id}>
                            {trend.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Intensity: {currentIntensity}%
                    </label>
                    <Slider
                      value={[currentIntensity]}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                      onValueChange={(values) => setCurrentIntensity(values[0])}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddTrend}
                  disabled={!currentTrend}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trend
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedTrends.length === 0}>
              {isEditing ? 'Save Changes' : 'Create Scenario'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 