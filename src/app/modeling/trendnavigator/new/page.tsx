"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function NewTrendNavigatorScenarioPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Scenario created successfully",
        description: "Your trend scenario has been created.",
      });
      
      router.push("/modeling/trendnavigator/scenarios");
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast({
        title: "Error",
        description: "There was an error creating your scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="mr-2"
            onClick={() => router.push("/modeling")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Future Scenario</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Information</CardTitle>
              <CardDescription>
                Define the basic details for your future scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenarioName">Scenario Name</Label>
                  <Input 
                    id="scenarioName" 
                    placeholder="e.g., High Telecommuting 2035" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseModel">Base Travel Model</Label>
                  <Select defaultValue="latest">
                    <SelectTrigger id="baseModel">
                      <SelectValue placeholder="Select base model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest Regional Model (2023)</SelectItem>
                      <SelectItem value="downtown">Downtown Transportation Study</SelectItem>
                      <SelectItem value="county">County Mobility Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the purpose and assumptions of this scenario" 
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horizonYear">Horizon Year</Label>
                  <Select defaultValue="2035">
                    <SelectTrigger id="horizonYear">
                      <SelectValue placeholder="Select horizon year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025 (Near-term)</SelectItem>
                      <SelectItem value="2035">2035 (Mid-term)</SelectItem>
                      <SelectItem value="2050">2050 (Long-term)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scenarioType">Scenario Type</Label>
                  <Select defaultValue="trend">
                    <SelectTrigger id="scenarioType">
                      <SelectValue placeholder="Select scenario type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trend">Technology Trend</SelectItem>
                      <SelectItem value="policy">Policy Package</SelectItem>
                      <SelectItem value="land-use">Land Use Change</SelectItem>
                      <SelectItem value="combined">Combined Scenario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trend Configuration</CardTitle>
              <CardDescription>
                Configure the trends and variables for this scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Telecommuting</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="telecommuting-rate">Telecommuting Rate</Label>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <Slider 
                      id="telecommuting-rate"
                      defaultValue={[35]} 
                      max={100} 
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentage of office workers who telecommute at least 3 days per week
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="telecommuting-vmt-reduction">VMT Reduction per Telecommuter</Label>
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <Slider 
                      id="telecommuting-vmt-reduction"
                      defaultValue={[70]} 
                      max={100} 
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentage reduction in vehicle miles traveled per telecommuting worker
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">E-commerce</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ecommerce-share">E-commerce Market Share</Label>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Slider 
                      id="ecommerce-share"
                      defaultValue={[45]} 
                      max={100} 
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentage of retail sales conducted online
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="delivery-efficiency">Delivery Vehicle Efficiency</Label>
                      <span className="text-sm font-medium">Medium</span>
                    </div>
                    <Select defaultValue="medium">
                      <SelectTrigger id="delivery-efficiency">
                        <SelectValue placeholder="Select efficiency level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Current patterns)</SelectItem>
                        <SelectItem value="medium">Medium (Enhanced logistics)</SelectItem>
                        <SelectItem value="high">High (Optimized routes + EVs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Efficiency of package delivery logistics and vehicle technology
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Autonomous Vehicles</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="av-adoption">AV Fleet Adoption</Label>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <Slider 
                      id="av-adoption"
                      defaultValue={[25]} 
                      max={100} 
                      step={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentage of vehicle fleet that is fully autonomous (L4/L5)
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="av-mode">Primary AV Deployment Model</Label>
                      <span className="text-sm font-medium">Mixed</span>
                    </div>
                    <Select defaultValue="mixed">
                      <SelectTrigger id="av-mode">
                        <SelectValue placeholder="Select deployment model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Primarily Private Ownership</SelectItem>
                        <SelectItem value="mixed">Mixed Ownership + Fleet Services</SelectItem>
                        <SelectItem value="fleet">Primarily Fleet Services (MaaS)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Primary deployment model for autonomous vehicles
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 animate-spin">⟳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Create Scenario
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  );
} 