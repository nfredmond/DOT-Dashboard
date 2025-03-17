"use client"

import { useState, useEffect } from 'react';
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
import { TrendingUp, Activity, Map, BarChart, Users, Gauge, ChevronRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    
    // Reset active card when hovering out of all cards
    const handleMouseOut = () => {
      setTimeout(() => setActiveCard(null), 300);
    };
    
    document.addEventListener('mouseleave', handleMouseOut);
    return () => document.removeEventListener('mouseleave', handleMouseOut);
  }, []);
  
  const animationClasses = {
    enter: 'transition-all duration-500 transform',
    visible: 'opacity-100 translate-y-0',
    hidden: 'opacity-0 translate-y-8',
  };
  
  return (
    <main className="container mx-auto p-6">
      <div className={`py-12 md:py-24 lg:py-32 flex flex-col items-center text-center space-y-8 ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden}`}>
        <div className="rounded-full bg-primary/10 p-4 w-20 h-20 flex items-center justify-center animate-pulse">
          <TrendingUp className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Planning Manager
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl animate-fade-in">
          Scenario planning and modeling for forward-thinking transportation agencies
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button 
            size="lg" 
            onClick={() => router.push('/scenarios')}
            className="group px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span>Explore Scenarios</span>
            <ChevronRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => router.push('/scenarios/new')}
            className="group px-6 py-3 border-2 transition-all duration-300 hover:scale-105"
          >
            <span>Create New Scenario</span>
            <ChevronRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'trendnav' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-100`}
          onMouseEnter={() => setActiveCard('trendnav')}
          onClick={() => router.push('/scenarios')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <TrendingUp className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">TrendNavigator</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              Explore Scenarios <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'camp' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-200`}
          onMouseEnter={() => setActiveCard('camp')}
          onClick={() => router.push('/scenarios/compare')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Activity className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">CAMP Modeling</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              Compare Models <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'gis' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-300`}
          onMouseEnter={() => setActiveCard('gis')}
          onClick={() => router.push('/project-mapping-wrapper')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Map className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">GIS Integration</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              Explore Impacts <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'dashboard' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-400`}
          onMouseEnter={() => setActiveCard('dashboard')}
          onClick={() => router.push('/scenarios/compare')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <BarChart className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">Performance Dashboard</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              Compare Results <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'agency' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-500`}
          onMouseEnter={() => setActiveCard('agency')}
          onClick={() => router.push('/admin-panel')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Users className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">Multi-Agency Collaboration</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              View Settings <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card 
          className={`group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 ${activeCard === 'ai' ? 'border-l-primary' : 'border-l-transparent'} ${animationClasses.enter} ${isVisible ? animationClasses.visible : animationClasses.hidden} delay-600`}
          onMouseEnter={() => setActiveCard('ai')}
          onClick={() => router.push('/llm-assistant')}
        >
          <CardHeader className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Gauge className="h-8 w-8 text-primary mb-4 transform group-hover:scale-110 transition-transform" />
            <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
            <CardDescription className="text-base">
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
            <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
              Explore AI Tools <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Planning Manager combines advanced modeling techniques with intuitive visualization tools 
          to help transportation agencies make data-driven decisions for the future of mobility.
        </p>
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/help')}
            className="mx-2"
          >
            Documentation
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/community')}
            className="mx-2"
          >
            Community Portal
          </Button>
        </div>
      </div>
    </main>
  );
}
