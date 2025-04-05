"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarIcon,
  LineChartIcon,
  MapIcon,
  TrainIcon,
  TrendingUpIcon,
  UsersIcon,
  GitBranchIcon,
  ActivityIcon,
} from "lucide-react";

export default function ModelingPage() {
  const [activeTab, setActiveTab] = useState("greenchamp");

  return (
    <ProtectedRoute>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transportation Modeling</h1>
          <p className="text-muted-foreground">
            Advanced travel demand modeling and future scenario planning tools
          </p>
        </div>

        <Tabs defaultValue="greenchamp" onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="greenchamp">GreenChAMP Travel Demand</TabsTrigger>
            <TabsTrigger value="trendnavigator">TrendNavigator Scenarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="greenchamp" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>New Model Run</CardTitle>
                  <CardDescription>
                    Configure and run a new travel demand model
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <ActivityIcon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Create a new GreenChAMP travel demand model with custom parameters for your region.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/modeling/greenchamp/new">
                      Create New Model
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Recent Model Runs</CardTitle>
                  <CardDescription>
                    View and manage your recent model runs
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <BarChart3Icon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Access previous model runs, view results, and compare outputs across different scenarios.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/modeling/greenchamp/runs">
                      View Model Runs
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Analysis Tools</CardTitle>
                  <CardDescription>
                    Advanced analysis of travel patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <LineChartIcon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Explore detailed analysis tools including corridor studies, accessibility analysis, and emissions forecasting.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/modeling/greenchamp/analysis">
                      Open Analysis Tools
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium">About GreenChAMP</h3>
              <p className="text-muted-foreground">
                GreenChAMP (Green DOT Chained Activity Modelling Process) is a comprehensive travel demand modeling framework that simulates transportation patterns and forecasts future scenarios.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <TrainIcon className="mr-2 h-4 w-4 text-primary" />
                    Multi-Modal Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Models car, transit, bike, and pedestrian travel patterns.
                  </p>
                </div>
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <MapIcon className="mr-2 h-4 w-4 text-primary" />
                    Spatial Visualization
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Interactive maps of travel flows and network performance.
                  </p>
                </div>
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <UsersIcon className="mr-2 h-4 w-4 text-primary" />
                    Equity Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Evaluates transportation impacts across demographic groups.
                  </p>
                </div>
              </div>
              <Button variant="link" className="px-0">
                <Link href="/help/greenchamp">
                  Learn more about GreenChAMP
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="trendnavigator" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>New Scenario</CardTitle>
                  <CardDescription>
                    Create a new future scenario
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <TrendingUpIcon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Develop a new scenario to explore future transportation trends and policy impacts.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/modeling/trendnavigator/new">
                      Create Scenario
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Manage Scenarios</CardTitle>
                  <CardDescription>
                    View and compare existing scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <GitBranchIcon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Access your scenarios, view results, and manage scenario settings.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/modeling/trendnavigator/scenarios">
                      View Scenarios
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Trend Library</CardTitle>
                  <CardDescription>
                    Explore and manage available trends
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className="relative h-40 w-40">
                      <CalendarIcon className="h-40 w-40 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Browse the trend library and configure parameters for future scenarios.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/modeling/trendnavigator/trends">
                      Open Trend Library
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium">About TrendNavigator</h3>
              <p className="text-muted-foreground">
                TrendNavigator is a scenario planning tool that helps you understand how future trends, technologies, and policies will impact transportation patterns.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <TrendingUpIcon className="mr-2 h-4 w-4 text-primary" />
                    Future Forecasting
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Model and visualize future transportation scenarios.
                  </p>
                </div>
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <LineChartIcon className="mr-2 h-4 w-4 text-primary" />
                    Trend Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Analyze impacts of emerging trends on mobility.
                  </p>
                </div>
                <div className="bg-background rounded-md p-4 shadow-sm">
                  <h4 className="font-medium flex items-center mb-2">
                    <BarChart3Icon className="mr-2 h-4 w-4 text-primary" />
                    Scenario Comparison
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Compare multiple future scenarios side by side.
                  </p>
                </div>
              </div>
              <Button variant="link" className="px-0">
                <Link href="/help/trendnavigator">
                  Learn more about TrendNavigator
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 bg-primary/5 rounded-lg p-6 shadow-sm border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Integrated Benefit-Cost Analysis</h3>
                  <p className="text-muted-foreground mb-4">
                    Both GreenChAMP and TrendNavigator integrate with our Benefit-Cost Analysis module for comprehensive economic evaluation.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-background rounded-md p-4 shadow-sm">
                      <h4 className="font-medium flex items-center mb-2">
                        <ArrowRightIcon className="mr-2 h-4 w-4 text-primary" />
                        Model Integration
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Import model results directly into benefit-cost analyses.
                      </p>
                    </div>
                    <div className="bg-background rounded-md p-4 shadow-sm">
                      <h4 className="font-medium flex items-center mb-2">
                        <ArrowRightIcon className="mr-2 h-4 w-4 text-primary" />
                        AI-Powered Insights
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Intelligent analysis of economic impacts and recommendations.
                      </p>
                    </div>
                    <div className="bg-background rounded-md p-4 shadow-sm">
                      <h4 className="font-medium flex items-center mb-2">
                        <ArrowRightIcon className="mr-2 h-4 w-4 text-primary" />
                        Risk Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Monte Carlo simulation and sensitivity testing of outcomes.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link href="/benefit-cost">
                      Open Benefit-Cost Module
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 