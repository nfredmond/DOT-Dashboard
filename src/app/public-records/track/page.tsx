import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Clock, InfoIcon, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Track Public Records Request',
  description: 'Track the status of your public records request',
};

export default function TrackRequestPage() {
  return (
    <div className="container py-10 mx-auto">
      <div className="flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/public-records">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Track Your Request</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find Your Request</CardTitle>
            <CardDescription>
              Enter your request ID and email to check the status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestId">Request ID</Label>
                <Input 
                  id="requestId" 
                  placeholder="e.g., PRR-2023-0045" 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Your request ID was sent to you in the confirmation email
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trackEmail">Email Address</Label>
                <Input 
                  id="trackEmail" 
                  type="email" 
                  placeholder="Enter the email used for the request" 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Search className="h-4 w-4 mr-2" /> Track Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* This would be conditionally rendered if a request is found */}
        <div className="space-y-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Request Found</AlertTitle>
            <AlertDescription>
              We've found your request. Details are shown below.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Main Street Corridor Environmental Documents</CardTitle>
                  <CardDescription>Request ID: PRR-2023-0045</CardDescription>
                </div>
                <Badge>In Progress</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Submitted:</span>
                <span className="text-sm">June 10, 2023</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Estimated Completion:</span>
                <span className="text-sm">June 24, 2023</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Current Status:</span>
                <span className="text-sm">Collecting responsive records</span>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Request Description:</span>
                <p className="text-sm text-muted-foreground">
                  All environmental impact reports, assessments, and related documents for the Main Street 
                  Corridor Improvement Project from 2020-2023, including any traffic studies and public comments.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted-foreground/20" />
                <ol className="space-y-6 ml-6">
                  <TimelineItem 
                    status="Completed"
                    title="Request Received"
                    description="Your request has been received and assigned a tracking number."
                    date="June 10, 2023"
                  />
                  <TimelineItem 
                    status="Completed"
                    title="Initial Review"
                    description="Your request has been reviewed and assigned to the appropriate department."
                    date="June 12, 2023"
                  />
                  <TimelineItem 
                    status="InProgress"
                    title="Collecting Records"
                    description="Staff is currently gathering the requested documents and information."
                    date="June 15, 2023"
                  />
                  <TimelineItem 
                    status="Pending"
                    title="Legal Review"
                    description="Documents will be reviewed for any necessary redactions."
                    date="Pending"
                  />
                  <TimelineItem 
                    status="Pending"
                    title="Records Ready"
                    description="Documents will be prepared for delivery in your preferred format."
                    date="Pending"
                  />
                  <TimelineItem 
                    status="Pending"
                    title="Request Completed"
                    description="All responsive documents have been delivered."
                    date="Pending"
                  />
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Records Officer</span>
                  <span className="text-xs text-muted-foreground">June 15, 2023</span>
                </div>
                <p className="text-sm">
                  We're working on your request and have identified approximately 25 documents that may be responsive.
                  Some of these documents are quite large. Would you prefer to receive them in batches as they become
                  available, or all at once when the request is complete?
                </p>
              </div>
              
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">You</span>
                  <span className="text-xs text-muted-foreground">June 16, 2023</span>
                </div>
                <p className="text-sm">
                  I would prefer to receive the documents in batches as they become available. Thank you for your work on this request.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="newMessage">Reply</Label>
                <Input 
                  id="newMessage"
                  placeholder="Type your message here..." 
                />
                <Button size="sm">Send Message</Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="available">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Documents</TabsTrigger>
              <TabsTrigger value="pending">Pending Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="available" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Main Street Corridor Initial Environmental Assessment</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    PDF Document • 3.2 MB • Released on June 17, 2023
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="ml-auto">
                    Download
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Traffic Impact Study (2020)</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    PDF Document • 5.7 MB • Released on June 17, 2023
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="ml-auto">
                    Download
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-4">
              <div className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">Documents in Preparation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The following documents are still being processed
                </p>
                
                <ul className="text-sm space-y-2 text-left max-w-md mx-auto">
                  <li className="flex justify-between items-center">
                    <span>Public Comments Summary (2021-2022)</span>
                    <Badge variant="outline">Pending Review</Badge>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Environmental Impact Mitigation Plan</span>
                    <Badge variant="outline">Collecting</Badge>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Project Amendment Documents (2022)</span>
                    <Badge variant="outline">Collecting</Badge>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ 
  status, 
  title, 
  description, 
  date 
}: { 
  status: 'Completed' | 'InProgress' | 'Pending'; 
  title: string; 
  description: string; 
  date: string; 
}) {
  return (
    <li className="relative">
      <div className="absolute -left-9 mt-1.5">
        <div className={`h-4 w-4 rounded-full border-2 ${
          status === 'Completed' 
            ? 'bg-primary border-primary' 
            : status === 'InProgress'
              ? 'bg-yellow-500 border-yellow-500'
              : 'bg-background border-muted-foreground/50'
        }`} />
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium">{title}</h3>
          <Badge variant={
            status === 'Completed' 
              ? 'default' 
              : status === 'InProgress'
                ? 'secondary'
                : 'outline'
          } className="ml-auto">
            {status === 'Completed' 
              ? 'Complete' 
              : status === 'InProgress'
                ? 'In Progress'
                : 'Pending'
            }
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          {date}
        </p>
      </div>
    </li>
  );
} 