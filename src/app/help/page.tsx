"use client"

import React from "react";
import Image from "next/image";
import Link from "next/link";
// Import local images - using direct paths to public files
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircleIcon,
  SearchIcon,
  BookOpenIcon,
  MessageSquareIcon,
  FileTextIcon,
  UserIcon,
  Phone,
  Mail,
  Clock,
  Globe,
  Linkedin,
  CheckCircle,
} from "lucide-react";

export default function Help() {
  // FAQ data
  const faqs = [
    {
      question: "How do I create a new project?",
      answer:
        "To create a new project, navigate to the Project Map page and click on the 'Add New Project' button. Fill in the required information in the form and submit it. Your project will be created and appear on the map.",
    },
    {
      question: "How can I provide feedback on a project?",
      answer:
        "You can provide feedback on a project by visiting the Community page, finding the project you want to comment on, and clicking the 'Provide Feedback' button. Alternatively, you can use the Community Mapping feature to add location-specific feedback directly on the map with support for images and location pins.",
    },
    {
      question: "How do I create and use benefit-cost analyses?",
      answer:
        "To create a benefit-cost analysis, navigate to a project's detail page and click on the 'Benefit-Cost' tab. Click 'New Analysis' and fill in the required information including name, discount rate, and analysis horizon. Configure the monetization parameters in the 'Parameters' tab where you can define values for different categories like Value of Time, Emissions Costs, Safety Costs, Vehicle Operating Costs, and Health Benefits. Add benefits and costs in their respective sections, then view results in the Charts tab. You can also perform sensitivity analysis, Monte Carlo simulations, and compare multiple analyses side by side.",
    },
    {
      question: "What is the LLM Assistant?",
      answer:
        "The LLM Assistant is an AI-powered tool that helps with various tasks such as evaluating project descriptions against grant criteria, suggesting improvements to projects, generating reports, and drafting responses to community feedback. You can access it from the LLM Assistant page or use the chat interface available throughout the app.",
    },
    {
      question: "How do I use the Community Input Mapping Tool?",
      answer:
        "To use the Community Input Mapping Tool, go to the Community Feedback page and click on 'Map View'. The interactive map will display all feedback points. You can filter by project, feedback type, or date range. Click on any point to view details or use the 'Add Feedback' button to place a new marker. The 'Analysis' tab provides heat maps of feedback density and engagement metrics. You can export all data in CSV or GeoJSON format for further analysis.",
    },
    {
      question: "How do I use the CAMP and TrendNavigator modeling tools?",
      answer:
        "For travel demand modeling with CAMP, go to the Modeling section and select 'Travel Demand'. Set up your model by defining study areas, transportation zones, and networks, then configure parameters and run the model. For TrendNavigator scenario planning, navigate to the TrendNavigator section under Modeling, select a baseline CAMP model, and adjust trend variables like telecommuting rates, e-commerce adoption, and transit service changes. You can set different time horizons (5, 10, or 30 years) and compare scenarios to evaluate their impacts on metrics like VMT, emissions, and congestion.",
    },
    {
      question: "How do I generate a report?",
      answer:
        "To generate a report, go to the Reports page and click on 'Generate Report'. Select the report type, choose which projects to include, select the report elements you want, and choose your preferred output format. Then click 'Generate Report'. You can also schedule recurring reports from the Reports settings page.",
    },
    {
      question: "How do I change my notification settings?",
      answer:
        "You can change your notification settings by going to the Settings page, selecting the 'Notifications' tab, and adjusting your preferences for different types of notifications. You can enable or disable email, in-app, and mobile notifications separately.",
    },
    {
      question: "Can I use the app offline?",
      answer:
        "Yes, the Planning Manager v6 supports offline functionality. Your data will be stored locally and synchronized with the server when you reconnect to the internet. You can continue adding projects, updating information, and even creating scenarios while offline.",
    },
    {
      question: "How do I set up voice controls?",
      answer:
        "Voice controls are available throughout the app. Click on the microphone icon in the navigation bar to activate voice mode, or say 'Hey Assistant' if wake word detection is enabled. You can customize voice settings, including language and wake word, in the Settings page under the 'Voice' tab.",
    },
    {
      question: "How does the app integrate with other systems?",
      answer:
        "The Planning Manager v6 supports integration with CAMP for travel demand modeling, TrendNavigator for scenario planning, and MCP for project management. You can configure these integrations in the Admin panel under 'Integrations'. The app also provides API endpoints for custom integrations with other systems.",
    },
    {
      question: "Is my data secure in the app?",
      answer:
        "Yes, all data is stored securely using Supabase with row-level security policies. Each agency's data is isolated, and users can only access data based on their assigned permissions. All connections are encrypted, and the app follows security best practices for authentication and data protection.",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Find answers to common questions and get assistance
        </p>
      </div>

      <div className="relative">
        <SearchIcon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
        />
        <Input
          placeholder="Search for help topics..."
          className="pl-10 py-6 text-lg"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Who Are We?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We are Green DOT Transportation Solutions, a transportation planning and consulting firm based in Chico, CA.
          </p>
          <p>
            Green DOT Transportation Solutions was founded to fill a niche role in transportation planning services. Our goal is to improve transportation facilities and enhance the human travel experience by collaborating with local and regional agencies to streamline project development and project delivery.
          </p>
          <p>
            Our team has extensive experience in planning, programming, and monitoring transportation projects, as well as navigating complex federal and state processes. We work with built, natural, and human environments to create safe, efficient, and progressive transportation solutions.
          </p>
          <p>
            Strategically located in Chico, CA, we serve public agencies across Northern California. Green DOT is a California Corporation and a registered small business.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative w-48 h-48 overflow-hidden rounded-lg shadow-md bg-blue-100 flex items-center justify-center">
                <Image 
                  src="/images/team/Jeff-Schwein.jpg"
                  alt="Jeff Schwein" 
                  width={192}
                  height={192}
                  className="object-cover w-full h-full"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-500 opacity-0 hover:opacity-100 transition-opacity">
                  <UserIcon className="h-12 w-12" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-bold">Jeff Schwein</h3>
                <p className="text-gray-600">Owner & CEO</p>
                <p className="mt-2 text-sm">
                  With over 20 years of experience in transportation planning, Jeff leads our team with expertise in project development and implementation.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative w-48 h-48 overflow-hidden rounded-lg shadow-md bg-blue-100 flex items-center justify-center">
                <Image 
                  src="/images/team/Nathaniel-Redmond.jpg"
                  alt="Nathaniel Redmond" 
                  width={192}
                  height={192}
                  className="object-cover w-full h-full scale-110 object-top"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-500 opacity-0 hover:opacity-100 transition-opacity">
                  <UserIcon className="h-12 w-12" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-bold">Nathaniel Redmond</h3>
                <p className="text-gray-600">Planning Manager and Lead Software Developer</p>
                <p className="mt-2 text-sm">
                  Nathaniel specializes in GIS mapping, data analysis, and developing innovative transportation solutions for communities.
                </p>
              </div>
            </div>
          </div>
          
          <p className="mt-6">
            We are here to support you as you navigate and make the most of our Transportation Planning App.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpenIcon
                className="h-5 w-5 mr-2 text-blue-500"
              />
              User Guide
            </CardTitle>
            <CardDescription>
              Comprehensive documentation and tutorials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Our user guide provides detailed instructions on how to use all
              features of the Transportation Planning App.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/help/user-manual" passHref>
              <Button className="w-full">
                View User Guide
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquareIcon
                className="h-5 w-5 mr-2 text-green-500"
              />
              Contact Support
            </CardTitle>
            <CardDescription>
              Get help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Need personalized assistance? Our support team is ready to help
              with any questions or issues.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              Contact Support
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileTextIcon
                className="h-5 w-5 mr-2 text-purple-500"
              />
              Training Resources
            </CardTitle>
            <CardDescription>
              Learn how to effectively use the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Access tutorials, videos, and training materials to help you
              master the Transportation Planning App.
            </p>
            <ul className="text-sm space-y-1 mt-2">
              <li>
                <Link href="/help/benefit-cost" className="text-blue-500 hover:underline">
                  Benefit-Cost Analysis Guide
                </Link>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              View Training
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Can We Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We provide assistance on:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Getting Started – Walkthroughs for first-time users.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Feature Guidance – Step-by-step instructions on using planning and scheduling tools.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Troubleshooting – Resolving technical issues and answering your questions.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Feedback – Collecting user feedback for ongoing app improvements.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Email:</p>
                  <p className="text-sm">nathaniel@greendottransportation.com</p>
                  <p className="text-xs text-gray-500">(Expect a response within 24 hours during business days.)</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Phone:</p>
                  <p className="text-sm">530-492-9775</p>
                  <p className="text-xs text-gray-500">(Available for urgent issues during support hours.)</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MessageSquareIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">In-App Support:</p>
                  <p className="text-sm">Use the "Help" button located at the bottom right of the screen to chat directly with us or our support team.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Office Hours:</p>
                  <p className="text-sm">Monday – Friday, 9:00 AM – 5:00 PM</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Company Website:</p>
                  <p className="text-sm">www.greendottransportation.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Linkedin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">LinkedIn:</p>
                  <p className="text-sm">linkedin.com/in/nfredmond</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-3 justify-start">
              <BookOpenIcon className="mr-2 h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">User Manual</div>
                <div className="text-xs text-gray-500">Comprehensive documentation</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-3 justify-start">
              <HelpCircleIcon className="mr-2 h-5 w-5 text-amber-600" />
              <div className="text-left">
                <div className="font-medium">FAQ Section</div>
                <div className="text-xs text-gray-500">Common questions answered</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-3 justify-start">
              <FileTextIcon className="mr-2 h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Tutorial Videos</div>
                <div className="text-xs text-gray-500">Visual learning resources</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto py-3 justify-start">
              <MessageSquareIcon className="mr-2 h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Submit a Ticket</div>
                <div className="text-xs text-gray-500">For non-urgent inquiries</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                id={`i5edyu_${index}`}
              >
                <AccordionTrigger id={`rvcci1_${index}`}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent id={`60imz4_${index}`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            View All FAQs
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commitment to Your Success</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Our goal at Green DOT Transportation Solutions is to ensure you have a smooth and productive experience with the Transportation Planning Manager App. Please don't hesitate to reach out whenever you need assistance or have suggestions for improvements.
          </p>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="camp-trendnavigator">
          <AccordionTrigger>How do I use the CAMP and TrendNavigator modeling tools?</AccordionTrigger>
          <AccordionContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Travel Demand Modeling with CAMP:</p>
              <ol className="list-decimal pl-6 mb-2">
                <li>Navigate to the Modeling tab and select "CAMP Travel Demand"</li>
                <li>Define your study area by selecting TAZs or drawing a boundary</li>
                <li>Configure model parameters including:
                  <ul className="list-disc pl-6">
                    <li>Forecast year</li>
                    <li>Demographic assumptions</li>
                    <li>Network changes</li>
                    <li>Land use scenarios</li>
                  </ul>
                </li>
                <li>Run the model and view results through:
                  <ul className="list-disc pl-6">
                    <li>Heat maps showing demand patterns</li>
                    <li>Flow diagrams for corridor analysis</li>
                    <li>Detailed metrics tables</li>
                    <li>Comparative scenario analysis</li>
                  </ul>
                </li>
              </ol>
            </div>
            <div>
              <p className="font-semibold">TrendNavigator Scenario Planning:</p>
              <ol className="list-decimal pl-6">
                <li>Select "TrendNavigator" from the Modeling tab</li>
                <li>Choose a baseline CAMP model to build upon</li>
                <li>Adjust trend variables like:
                  <ul className="list-disc pl-6">
                    <li>Remote work adoption</li>
                    <li>Vehicle automation levels</li>
                    <li>Micromobility growth</li>
                    <li>Transit service changes</li>
                  </ul>
                </li>
                <li>Compare scenarios over different time horizons (5, 10, or 30 years)</li>
                <li>Generate reports showing impacts on transportation patterns, emissions, and accessibility</li>
              </ol>
            </div>
          </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
