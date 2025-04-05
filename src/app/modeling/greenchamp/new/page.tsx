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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeftIcon, SaveIcon, PlayIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function NewGreenChampModelPage() {
  const router = useRouter();
  const [formStep, setFormStep] = useState<'basic' | 'zones' | 'network' | 'parameters'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Model created successfully",
        description: "Your travel demand model has been created and is ready to run.",
      });
      
      router.push("/modeling/greenchamp/runs");
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error",
        description: "There was an error creating your model. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">New Travel Demand Model</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs 
            defaultValue="basic" 
            value={formStep}
            onValueChange={(value) => setFormStep(value as any)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="zones">Study Zones</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="parameters">Model Parameters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Model Information</CardTitle>
                  <CardDescription>
                    Provide the basic details for your travel demand model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelName">Model Name</Label>
                      <Input 
                        id="modelName" 
                        placeholder="e.g., Downtown Transportation Plan 2024" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="baseYear">Base Year</Label>
                      <Select defaultValue="2023">
                        <SelectTrigger id="baseYear">
                          <SelectValue placeholder="Select base year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2022">2022</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                          <SelectItem value="2024">2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the purpose and scope of this model" 
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeOfDay">Time Periods</Label>
                      <Select defaultValue="all">
                        <SelectTrigger id="timeOfDay">
                          <SelectValue placeholder="Select time periods" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Day</SelectItem>
                          <SelectItem value="am-peak">AM Peak Only</SelectItem>
                          <SelectItem value="pm-peak">PM Peak Only</SelectItem>
                          <SelectItem value="peaks">AM & PM Peaks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select defaultValue="region1">
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="region1">Metro County</SelectItem>
                          <SelectItem value="region2">Central City</SelectItem>
                          <SelectItem value="region3">North County</SelectItem>
                          <SelectItem value="custom">Custom Region</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setFormStep('zones')}
                  >
                    Next Step
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="zones" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Study Zones Definition</CardTitle>
                  <CardDescription>
                    Define the transportation analysis zones (TAZs) for your model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zone Selection Method</Label>
                    <Select defaultValue="existing">
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone definition method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Use Existing TAZ System</SelectItem>
                        <SelectItem value="upload">Upload Custom Zones</SelectItem>
                        <SelectItem value="draw">Draw Study Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-md p-6 space-y-2">
                    <Label>Existing TAZ System</Label>
                    <Select defaultValue="county">
                      <SelectTrigger>
                        <SelectValue placeholder="Select TAZ system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="county">County TAZ System (1,245 zones)</SelectItem>
                        <SelectItem value="regional">Regional TAZ System (2,786 zones)</SelectItem>
                        <SelectItem value="city">City TAZ System (432 zones)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      County TAZ System includes demographic data from the latest Census and is compatible with the regional travel model.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Zone Filter (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can filter zones to define a specific study area
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by district" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Districts</SelectItem>
                          <SelectItem value="north">North District</SelectItem>
                          <SelectItem value="central">Central District</SelectItem>
                          <SelectItem value="south">South District</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input placeholder="Search for specific zones..." />
                    </div>
                  </div>
                  
                  <div className="h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    Map Visualization Placeholder
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFormStep('basic')}
                  >
                    Previous Step
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setFormStep('network')}
                  >
                    Next Step
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transportation Network</CardTitle>
                  <CardDescription>
                    Define the transportation network for your model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Network Selection</Label>
                    <Select defaultValue="base-network">
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base-network">Base Network (Current Year)</SelectItem>
                        <SelectItem value="future-network">Future Network (Planned Projects)</SelectItem>
                        <SelectItem value="custom">Custom Network</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      Base Network includes the current road and transit networks with 2023 link attributes.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Road Network</Label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="highways" className="rounded" checked readOnly />
                        <Label htmlFor="highways" className="font-normal">Highways</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="arterials" className="rounded" checked readOnly />
                        <Label htmlFor="arterials" className="font-normal">Arterials</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="collectors" className="rounded" checked readOnly />
                        <Label htmlFor="collectors" className="font-normal">Collectors</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="local-roads" className="rounded" />
                        <Label htmlFor="local-roads" className="font-normal">Local Roads</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Transit Network</Label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="rail" className="rounded" checked readOnly />
                        <Label htmlFor="rail" className="font-normal">Rail Transit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="brt" className="rounded" checked readOnly />
                        <Label htmlFor="brt" className="font-normal">Bus Rapid Transit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="local-bus" className="rounded" checked readOnly />
                        <Label htmlFor="local-bus" className="font-normal">Local Bus</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="other-transit" className="rounded" />
                        <Label htmlFor="other-transit" className="font-normal">Other Transit Services</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    Network Visualization Placeholder
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFormStep('zones')}
                  >
                    Previous Step
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setFormStep('parameters')}
                  >
                    Next Step
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Parameters</CardTitle>
                  <CardDescription>
                    Configure the parameters for your travel demand model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Parameter Set</Label>
                      <Select defaultValue="default">
                        <SelectTrigger>
                          <SelectValue placeholder="Select parameter set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Parameters</SelectItem>
                          <SelectItem value="calibrated">Calibrated Regional Parameters</SelectItem>
                          <SelectItem value="custom">Custom Parameters</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        Default parameters are based on the regional travel model and have been validated for 2023 conditions.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Advanced Parameters</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trip-generation">Trip Generation</Label>
                        <Select defaultValue="rates">
                          <SelectTrigger id="trip-generation">
                            <SelectValue placeholder="Trip generation method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rates">Production/Attraction Rates</SelectItem>
                            <SelectItem value="regression">Regression Model</SelectItem>
                            <SelectItem value="tour">Tour-Based Generation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trip-distribution">Trip Distribution</Label>
                        <Select defaultValue="gravity">
                          <SelectTrigger id="trip-distribution">
                            <SelectValue placeholder="Trip distribution method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gravity">Gravity Model</SelectItem>
                            <SelectItem value="fratar">Fratar Growth Factor</SelectItem>
                            <SelectItem value="destination">Destination Choice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mode-choice">Mode Choice</Label>
                        <Select defaultValue="logit">
                          <SelectTrigger id="mode-choice">
                            <SelectValue placeholder="Mode choice method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="logit">Multinomial Logit</SelectItem>
                            <SelectItem value="nested">Nested Logit</SelectItem>
                            <SelectItem value="rules">Rule-Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="assignment">Assignment</Label>
                        <Select defaultValue="equil">
                          <SelectTrigger id="assignment">
                            <SelectValue placeholder="Trip assignment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equil">User Equilibrium</SelectItem>
                            <SelectItem value="stochastic">Stochastic Assignment</SelectItem>
                            <SelectItem value="incremental">Incremental Assignment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Advanced Options</Label>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="feedback" className="rounded" checked readOnly />
                        <Label htmlFor="feedback" className="font-normal">Travel Time Feedback Loop</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="time-of-day" className="rounded" checked readOnly />
                        <Label htmlFor="time-of-day" className="font-normal">Time-of-Day Factors</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="value-of-time" className="rounded" />
                        <Label htmlFor="value-of-time" className="font-normal">Value of Time Distribution</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="emissions" className="rounded" />
                        <Label htmlFor="emissions" className="font-normal">Emissions Calculation</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFormStep('network')}
                  >
                    Previous Step
                  </Button>
                  <div className="space-x-2">
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
                          Create Model
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      disabled={isSubmitting}
                      variant="secondary"
                    >
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Create & Run
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </ProtectedRoute>
  );
} 