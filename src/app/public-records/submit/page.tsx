import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const metadata: Metadata = {
  title: 'Submit a Public Records Request',
  description: 'Submit a new request for public transportation project records',
};

export default function SubmitRequestPage() {
  return (
    <div className="container py-10 mx-auto">
      <div className="flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/public-records">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Submit a Public Records Request</h1>
        </div>

        <div className="bg-muted/40 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            This form allows you to request specific public records related to transportation projects managed by our agency. 
            Please provide as much detail as possible to help us locate the records you need.
          </p>
        </div>

        <form className="space-y-8">
          {/* Contact Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Your contact details for communications about this request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter your first name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter your last name" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@email.com" required />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll use this email to communicate about your request and send documents
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input id="organization" placeholder="Company, agency, or organization name" />
              </div>
            </CardContent>
          </Card>

          {/* Request Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                Information about the records you're requesting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestTitle">Request Title</Label>
                <Input 
                  id="requestTitle" 
                  placeholder="E.g., 'Main Street Project Environmental Impact Reports'" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Please be as specific as possible. Include relevant dates, locations, project names, 
                        document types, or any identifying information that will help us locate the records.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea 
                  id="description" 
                  placeholder="Describe the records you're seeking in detail..."
                  className="min-h-32"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Request Type</Label>
                <RadioGroup defaultValue="general" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general" className="font-normal">General Information Request</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="project" id="project" />
                    <Label htmlFor="project" className="font-normal">Specific Project Records</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="financial" id="financial" />
                    <Label htmlFor="financial" className="font-normal">Financial/Budget Documents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="environmental" id="environmental" />
                    <Label htmlFor="environmental" className="font-normal">Environmental Documents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal">Other (specify in description)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range (if applicable)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fromDate" className="text-xs">From</Label>
                    <Input id="fromDate" type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="toDate" className="text-xs">To</Label>
                    <Input id="toDate" type="date" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectSelect">Related Project (if known)</Label>
                <Select>
                  <SelectTrigger id="projectSelect">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downtown-transit">Downtown Transit Hub</SelectItem>
                    <SelectItem value="main-street">Main Street Corridor</SelectItem>
                    <SelectItem value="bike-network">City Bike Network</SelectItem>
                    <SelectItem value="highway-101">Highway 101 Expansion</SelectItem>
                    <SelectItem value="other">Other (specify in description)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Format Preference</Label>
                <RadioGroup defaultValue="electronic" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="electronic" id="electronic" />
                    <Label htmlFor="electronic" className="font-normal">Electronic (Email/Download)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paper" id="paper" />
                    <Label htmlFor="paper" className="font-normal">Paper Copies (may incur fees)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="attachments" />
                  <Label htmlFor="attachments" className="font-normal text-sm">
                    I'll need to provide additional documents to help locate these records
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="verify" required />
                  <Label htmlFor="verify" className="font-normal text-sm">
                    I verify that the information provided is accurate and complete
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col space-y-2">
            <Button type="submit" size="lg">Submit Request</Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              By submitting this form, you acknowledge that the information provided 
              may become part of the public record.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 