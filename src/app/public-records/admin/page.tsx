import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Calendar, Download, FileStack, Clock, AlertCircle, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const metadata: Metadata = {
  title: 'Public Records Request Admin',
  description: 'Administration panel for managing public records requests',
};

export default function PRRAdminPage() {
  return (
    <div className="container py-6 mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Public Records Request Management</h1>
            <p className="text-muted-foreground">
              Manage, process, and track public records requests
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/public-records">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" /> Portal Home
              </Button>
            </Link>
            <Button>
              <FileStack className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<FileStack className="h-5 w-5 text-blue-500" />}
            title="Total Requests"
            value="1,248"
            trend="+8%"
            trendDirection="up"
            description="All-time requests"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Open Requests"
            value="87"
            trend="+12%"
            trendDirection="up"
            description="Requiring attention"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            title="Overdue"
            value="14"
            trend="-3%"
            trendDirection="down"
            description="Past due date"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-green-500" />}
            title="Avg. Time"
            value="8.4 days"
            trend="-1.2 days"
            trendDirection="down"
            description="To completion"
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="relative grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search requests by ID, requester name, or keywords..."
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Date Range</DropdownMenuItem>
              <DropdownMenuItem>Status</DropdownMenuItem>
              <DropdownMenuItem>Request Type</DropdownMenuItem>
              <DropdownMenuItem>Department</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="closed">Closed Requests</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Requests (87)</CardTitle>
                <CardDescription>
                  Requests that require action or are currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0142</TableCell>
                      <TableCell>John Smith</TableCell>
                      <TableCell className="max-w-xs truncate">Traffic impact studies for Main St widening project</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Gathering Records</Badge>
                      </TableCell>
                      <TableCell>Jun 10, 2023</TableCell>
                      <TableCell>Jun 24, 2023</TableCell>
                      <TableCell>T. Johnson</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0142">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0141</TableCell>
                      <TableCell>Sarah Lee</TableCell>
                      <TableCell className="max-w-xs truncate">Public transit funding allocation</TableCell>
                      <TableCell>
                        <Badge>Legal Review</Badge>
                      </TableCell>
                      <TableCell>Jun 08, 2023</TableCell>
                      <TableCell>Jun 22, 2023</TableCell>
                      <TableCell>M. Williams</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0141">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0140</TableCell>
                      <TableCell>David Chen</TableCell>
                      <TableCell className="max-w-xs truncate">Bike lane project environmental documentation</TableCell>
                      <TableCell>
                        <Badge variant="outline">Initial Review</Badge>
                      </TableCell>
                      <TableCell>Jun 07, 2023</TableCell>
                      <TableCell>Jun 21, 2023</TableCell>
                      <TableCell>Unassigned</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0140">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0138</TableCell>
                      <TableCell>Maria Garcia</TableCell>
                      <TableCell className="max-w-xs truncate">Highway interchange project contracts</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Overdue</Badge>
                      </TableCell>
                      <TableCell>May 25, 2023</TableCell>
                      <TableCell>Jun 08, 2023</TableCell>
                      <TableCell>R. Singh</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0138">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0137</TableCell>
                      <TableCell>James Wilson</TableCell>
                      <TableCell className="max-w-xs truncate">Downtown transit hub planning documents</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Records Ready</Badge>
                      </TableCell>
                      <TableCell>May 23, 2023</TableCell>
                      <TableCell>Jun 06, 2023</TableCell>
                      <TableCell>K. Lopez</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0137">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing 5 of 87 requests
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="closed" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Closed Requests (1,161)</CardTitle>
                <CardDescription>
                  Completed, denied, or withdrawn requests
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Closed</TableHead>
                      <TableHead>Time to Close</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0136</TableCell>
                      <TableCell>Emily Adams</TableCell>
                      <TableCell className="max-w-xs truncate">2022 Transportation Budget Documents</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                      <TableCell>May 20, 2023</TableCell>
                      <TableCell>Jun 03, 2023</TableCell>
                      <TableCell>14 days</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0136">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0135</TableCell>
                      <TableCell>Robert Brown</TableCell>
                      <TableCell className="max-w-xs truncate">River Bridge Project Environmental Impact Report</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                      <TableCell>May 19, 2023</TableCell>
                      <TableCell>May 30, 2023</TableCell>
                      <TableCell>11 days</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0135">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRR-2023-0134</TableCell>
                      <TableCell>Lisa Thompson</TableCell>
                      <TableCell className="max-w-xs truncate">Traffic Signal Maintenance Contracts</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                      <TableCell>May 17, 2023</TableCell>
                      <TableCell>May 28, 2023</TableCell>
                      <TableCell>11 days</TableCell>
                      <TableCell className="text-right">
                        <Link href="/public-records/admin/requests/PRR-2023-0134">
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing 3 of 1,161 requests
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume</CardTitle>
                  <CardDescription>Requests received per month</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    [Chart visualization would go here]
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="flex w-full justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Year to date:</span> 428 requests
                    </div>
                    <Select defaultValue="2023">
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Processing Time</CardTitle>
                  <CardDescription>Average days to completion</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    [Chart visualization would go here]
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="flex w-full justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Average:</span> 8.4 days
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Target:</span> 10 days
                    </div>
                  </div>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Request Types</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    [Chart visualization would go here]
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="flex w-full justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Top category:</span> Project Documents
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Department Workload</CardTitle>
                  <CardDescription>Requests by department</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    [Chart visualization would go here]
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="flex w-full justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Most requests:</span> Planning
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  trend, 
  trendDirection, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              <p className={`text-xs font-medium ${
                trendDirection === 'up' 
                  ? 'text-green-500' 
                  : trendDirection === 'down' 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
              }`}>
                {trend}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 