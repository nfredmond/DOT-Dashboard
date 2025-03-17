"use client"

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, Activity, Map, BarChart, Users, Gauge } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  return (
    <main className="container mx-auto p-6">
      <div className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center space-y-8">
        <div className="rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Planning Manager</h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
          Scenario planning and modeling for forward-thinking transportation agencies
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" onClick={() => router.push('/scenarios')}>
            Explore Scenarios
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/scenarios/new')}>
            Create New Scenario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <TrendingUp className="h-6 w-6 text-primary mb-4" />
            <CardTitle>TrendNavigator</CardTitle>
            <CardDescription>
              Model transportation futures with growth trends, technology adoption, and policy impacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Forecast how changing trends like remote work, e-commerce, autonomous vehicles, 
              and demographic shifts will impact travel patterns.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios')}>
              Explore Scenarios
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <Activity className="h-6 w-6 text-primary mb-4" />
            <CardTitle>CAMP Modeling</CardTitle>
            <CardDescription>
              Chained Activity Modeling Process for detailed travel demand forecasting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Go beyond traditional four-step models with activity-based approaches that capture
              complex travel behaviors, trip chaining, and interdependencies.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios/compare')}>
              Compare Models
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <Map className="h-6 w-6 text-primary mb-4" />
            <CardTitle>GIS Integration</CardTitle>
            <CardDescription>
              Visualize impacts spatially across your region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See how scenarios affect different parts of your community with detailed
              maps showing impacts on congestion, accessibility, equity, and more.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios')}>
              Explore Impacts
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <BarChart className="h-6 w-6 text-primary mb-4" />
            <CardTitle>Performance Dashboard</CardTitle>
            <CardDescription>
              Track key metrics and visualize scenario outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor and compare scenarios with customizable dashboards showing VMT, 
              emissions, mode share, accessibility, and other key performance indicators.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios/compare')}>
              Compare Results
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <Users className="h-6 w-6 text-primary mb-4" />
            <CardTitle>Multi-Agency Collaboration</CardTitle>
            <CardDescription>
              Work together across jurisdictional boundaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Share scenarios and results with partner agencies, create collaborative
              plans, and align regional transportation strategies.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios')}>
              View Scenarios
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardHeader>
            <Gauge className="h-6 w-6 text-primary mb-4" />
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>
              Get explanations and recommendations for your scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Let AI assist in interpreting results, explaining impacts to stakeholders,
              and recommending policy actions based on your goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform" onClick={() => router.push('/scenarios')}>
              Explore Scenarios
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
