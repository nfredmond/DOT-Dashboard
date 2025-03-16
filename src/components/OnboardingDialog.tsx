import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderPlus, 
  GitBranch, 
  BarChart3, 
  FileText, 
  Map, 
  Brain, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');
  const router = useRouter();

  useEffect(() => {
    // Check if this is the first time the user is accessing the app
    const hasSeenOnboarding = localStorage.getItem('rtpa_onboarding_shown');
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('rtpa_onboarding_shown', 'true');
    setOpen(false);
  };

  const navigateTo = (path: string) => {
    handleClose();
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to the RTPA Portal</DialogTitle>
          <DialogDescription>
            Let's get you started with the transportation planning manager
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="get-started">Get Started</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="py-4">
            <div className="flex flex-col items-center text-center px-8 py-4">
              <img 
                src="/logo-icon.png" 
                alt="RTPA Logo" 
                className="w-20 h-20 mb-4" 
              />
              <h3 className="text-xl font-semibold mb-2">
                Welcome to Your Transportation Planning Hub
              </h3>
              <p className="mb-4">
                This platform helps you manage transportation projects, generate scenarios, 
                score and prioritize investments, and make data-driven decisions.
              </p>
              <p className="text-muted-foreground mb-4">
                Your organization doesn't have any data yet. Let's walk through how to get started.
              </p>
              <Button onClick={() => setActiveTab('projects')}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="py-4">
            <div className="flex gap-6">
              <div className="bg-primary/10 p-4 rounded-full h-fit">
                <FolderPlus className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 1: Create Projects</h3>
                <p className="mb-4">
                  Start by creating your first transportation project. Add project details like location, 
                  budget, timeline, and map the project boundaries.
                </p>
                <p className="text-muted-foreground mb-4">
                  The system needs projects before you can generate scenarios or run prioritization analysis.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('welcome')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('scenarios')}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="py-4">
            <div className="flex gap-6">
              <div className="bg-primary/10 p-4 rounded-full h-fit">
                <GitBranch className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 2: Generate Scenarios</h3>
                <p className="mb-4">
                  Once you have projects, you can generate alternative scenarios to explore different 
                  options, configurations, or approaches.
                </p>
                <p className="text-muted-foreground mb-4">
                  Compare scenarios to find the best solutions for your transportation challenges.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('projects')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('scoring')}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scoring" className="py-4">
            <div className="flex gap-6">
              <div className="bg-primary/10 p-4 rounded-full h-fit">
                <BarChart3 className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 3: Score and Prioritize</h3>
                <p className="mb-4">
                  Evaluate projects against criteria like safety, equity, climate impact, and cost effectiveness. 
                  Create prioritization scenarios with different weightings to optimize your investment strategy.
                </p>
                <p className="text-muted-foreground mb-4">
                  Scoring requires defined criteria, which can be set up by your administrator.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('scenarios')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('get-started')}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="get-started" className="py-4">
            <div className="flex flex-col items-center text-center px-8 py-4">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Ready to Get Started!
              </h3>
              <p className="mb-6">
                Now that you understand the basics, let's create your first project and begin
                exploring the platform's capabilities.
              </p>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Explore On My Own
                </Button>
                <Button 
                  onClick={() => navigateTo('/projects/new')}
                >
                  Create First Project
                  <FolderPlus className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Don't show this again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 