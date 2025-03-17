import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Clock, FileSearch, InfoIcon, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Public Records Request Management',
  description: 'Submit and track public records requests',
};

export default function PublicRecordsPage() {
  return (
    <div className="container py-10 mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Public Records Request Portal</h1>
          <p className="text-lg text-muted-foreground">
            Submit and track requests for public transportation project records
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Submit a New Request</CardTitle>
              <CardDescription>
                Request specific documents or information about transportation projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/public-records/submit">
                <Button className="w-full" size="lg">
                  <Send className="mr-2 h-4 w-4" /> Submit New Request
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Track Existing Request</CardTitle>
              <CardDescription>
                Check the status of your submitted requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/public-records/track">
                <Button className="w-full" variant="outline" size="lg">
                  <FileSearch className="mr-2 h-4 w-4" /> Track Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Recently Released Records</h2>
          <p className="text-muted-foreground">
            Public records that have been recently processed and released
          </p>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="planning">Planning Documents</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Sample records - this would be populated from database */}
                <RecentRecordCard 
                  title="Main Street Corridor Improvement Plans"
                  date="Jun 15, 2023"
                  category="Planning Documents"
                  status="Released"
                />
                <RecentRecordCard 
                  title="2023 Transportation Budget Allocation"
                  date="May 30, 2023"
                  category="Financial"
                  status="Released"
                />
                <RecentRecordCard 
                  title="Downtown Transit Hub Environmental Assessment"
                  date="May 22, 2023"
                  category="Environmental"
                  status="Released"
                />
              </div>
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <RecentRecordCard 
                  title="Downtown Transit Hub Environmental Assessment"
                  date="May 22, 2023"
                  category="Environmental"
                  status="Released"
                />
              </div>
            </TabsContent>
            <TabsContent value="planning" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <RecentRecordCard 
                  title="Main Street Corridor Improvement Plans"
                  date="Jun 15, 2023"
                  category="Planning Documents"
                  status="Released"
                />
              </div>
            </TabsContent>
            <TabsContent value="financial" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <RecentRecordCard 
                  title="2023 Transportation Budget Allocation"
                  date="May 30, 2023"
                  category="Financial"
                  status="Released"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <h2 className="text-2xl font-bold tracking-tight">About Public Records Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard 
              icon={<CalendarDays className="h-6 w-6" />}
              title="Response Times"
              description="Requests are typically processed within 10 business days as required by law. Complex requests may take longer."
            />
            <InfoCard 
              icon={<Clock className="h-6 w-6" />}
              title="Processing Steps"
              description="Your request will be received, assigned to staff, reviewed, and fulfilled with appropriate documents."
            />
            <InfoCard 
              icon={<InfoIcon className="h-6 w-6" />}
              title="Privacy & Redactions"
              description="Personal information and other protected data will be redacted in accordance with privacy laws."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentRecordCard({ title, date, category, status }: { 
  title: string; 
  date: string; 
  category: string;
  status: 'Released' | 'Pending'; 
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={status === 'Released' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">{category}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <p className="text-sm text-muted-foreground">Released: {date}</p>
        <Link href={`/public-records/view/sample-id`}>
          <Button variant="ghost" size="sm">View Documents</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function InfoCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
} 