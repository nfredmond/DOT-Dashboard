"use client"

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Book, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function UserManual() {
  // Define sections of the user manual
  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Dashboard Overview</h3>
          <p className="mb-4">
            After logging in, you'll be directed to the main dashboard which provides an overview of active projects, recent activity, important notifications, and quick access to frequently used features.
          </p>
          
          <h3 className="text-lg font-semibold mb-2">Navigation</h3>
          <p className="mb-4">
            The main navigation menu is located on the left side of the screen and contains links to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Project Management</li>
            <li>Project Map</li>
            <li>Project Scoring</li>
            <li>Scenario Development</li>
            <li>Reports</li>
            <li>AI Assistant</li>
            <li>Community Feedback</li>
            <li>User Management (Admin only)</li>
            <li>Settings</li>
          </ul>
        </>
      ),
    },
    {
      id: "project-management",
      title: "Project Management",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Creating a New Project</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to the "Projects" page</li>
            <li>Click "Add New Project" button</li>
            <li>Fill in the required information</li>
            <li>Click "Save" to create the project</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">Editing Projects</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to the "Projects" page</li>
            <li>Find the project you want to edit</li>
            <li>Click the "Edit" button (pencil icon)</li>
            <li>Modify the project information</li>
            <li>Click "Save" to update the project</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">Project Details</h3>
          <p className="mb-2">
            The project details page provides comprehensive information about a specific project:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>General Information (name, description, type)</li>
            <li>Financial Information (estimated cost, funding sources)</li>
            <li>Timeline (start date, end date, milestones)</li>
            <li>Location Details</li>
            <li>Attached Documents</li>
            <li>Related Projects</li>
            <li>Scoring and Prioritization Results</li>
            <li>Community Feedback</li>
          </ul>
        </>
      ),
    },
    {
      id: "gis-mapping",
      title: "GIS Mapping",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Map Navigation</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Pan: Click and drag the map</li>
            <li>Zoom: Use the mouse wheel or the +/- buttons</li>
            <li>Reset View: Click the home button to return to the default view</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Layer Controls</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Click the layers icon in the top-right corner of the map</li>
            <li>Toggle layers on/off by clicking the checkbox next to each layer</li>
          </ol>
          <p className="mb-2">Available layers include:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Base Maps (OpenStreetMap, Satellite, Terrain)</li>
            <li>Projects Layer</li>
            <li>Administrative Boundaries</li>
            <li>Infrastructure Networks</li>
            <li>Environmental Features</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Drawing and Editing Features</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Click the draw button in the map toolbar</li>
            <li>Select the drawing tool (point, line, polygon)</li>
            <li>Draw the feature on the map</li>
            <li>Save the feature to associate it with a project</li>
          </ol>
        </>
      ),
    },
    {
      id: "project-scoring",
      title: "Project Scoring & Prioritization",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Scoring Criteria</h3>
          <p className="mb-2">
            The system uses multiple criteria for project scoring:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Safety Impact</li>
            <li>Economic Benefits</li>
            <li>Environmental Impact</li>
            <li>Social Equity</li>
            <li>Cost Effectiveness</li>
            <li>Implementation Feasibility</li>
            <li>Public Support</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Scoring a Project</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Project Scoring"</li>
            <li>Select a project to score</li>
            <li>For each criterion, assign a score using the slider or input field</li>
            <li>Add comments to justify scores</li>
            <li>Click "Calculate Overall Score" to see the weighted result</li>
            <li>Click "Save Scoring" to store the results</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">AI-Assisted Scoring</h3>
          <p className="mb-2">
            The system can provide scoring suggestions based on project data:
          </p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Project Scoring"</li>
            <li>Select a project</li>
            <li>Click "Get AI Suggestions"</li>
            <li>Review the suggested scores and rationale</li>
            <li>Accept or modify the suggestions</li>
            <li>Click "Save Scoring" to finalize</li>
          </ol>
        </>
      ),
    },
    {
      id: "scenario-development",
      title: "Scenario Development",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Creating Scenarios</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Scenarios"</li>
            <li>Click "Create New Scenario"</li>
            <li>Select a base project</li>
            <li>Define scenario parameters (cost, timeline, design variations)</li>
            <li>Click "Generate Scenario"</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">AI-Assisted Scenario Creation</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Scenarios"</li>
            <li>Click "AI-Assisted Scenario"</li>
            <li>Select a base project</li>
            <li>Specify scenario goals (e.g., "Reduce costs by 15%" or "Improve safety features")</li>
            <li>Click "Generate Scenarios" to have the AI create variations</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">Comparing Scenarios</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Scenarios"</li>
            <li>Click "Compare Scenarios"</li>
            <li>Select the scenarios to compare</li>
            <li>View the comparison table and charts</li>
            <li>Use the "Export Comparison" button to save the analysis</li>
          </ol>
        </>
      ),
    },
    {
      id: "ai-assistant",
      title: "AI Assistant",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Using the AI Assistant</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "AI Assistant"</li>
            <li>Type your question or request in the input field</li>
            <li>Click "Send" to submit your query</li>
            <li>View the AI's response</li>
          </ol>
          <p className="mb-2">Common uses for the AI Assistant:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Project analysis and recommendations</li>
            <li>Grant criteria evaluation</li>
            <li>Document drafting assistance</li>
            <li>Best practices suggestions</li>
            <li>Data analysis interpretation</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Document Analysis</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "AI Assistant"</li>
            <li>Click "Upload Document"</li>
            <li>Select the document to upload</li>
            <li>Ask a question about the document</li>
            <li>The AI will provide analysis based on the document content</li>
          </ol>
        </>
      ),
    },
    {
      id: "reporting",
      title: "Reporting",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Generating Reports</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Reports"</li>
            <li>Click "Generate New Report"</li>
            <li>Select report type (Project Summary, Financial Analysis, Progress Report, etc.)</li>
            <li>Choose which projects to include</li>
            <li>Select report elements and format options</li>
            <li>Click "Generate Report"</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">Customizing Reports</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li>Navigate to "Reports"</li>
            <li>Click "Custom Report"</li>
            <li>Use the drag-and-drop interface to build your report</li>
            <li>Select data sources and visualization types</li>
            <li>Add text sections and explanations</li>
            <li>Click "Generate Custom Report"</li>
          </ol>
          
          <h3 className="text-lg font-semibold mb-2">Exporting Reports</h3>
          <p className="mb-2">Reports can be exported in multiple formats:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>PDF</li>
            <li>CSV</li>
            <li>Excel</li>
            <li>JSON</li>
          </ul>
        </>
      ),
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      content: (
        <>
          <h3 className="text-lg font-semibold mb-2">Common Issues</h3>
          
          <div className="mb-4">
            <p><strong>Problem</strong>: Unable to log in</p>
            <p><strong>Solution</strong>:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Verify your username and password</li>
              <li>Check that your account is active</li>
              <li>Clear browser cache and cookies</li>
              <li>Contact your administrator if problems persist</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <p><strong>Problem</strong>: Map not loading correctly</p>
            <p><strong>Solution</strong>:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Check your internet connection</li>
              <li>Try a different browser</li>
              <li>Ensure you have the latest browser version</li>
              <li>Disable browser extensions that might interfere</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <p><strong>Problem</strong>: Unable to create or edit projects</p>
            <p><strong>Solution</strong>:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Verify you have the necessary permissions</li>
              <li>Check if the project is locked for editing by another user</li>
              <li>Try refreshing the page</li>
              <li>Contact your administrator if problems persist</li>
            </ul>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Getting Help</h3>
          <p className="mb-2">For additional assistance:</p>
          <ol className="list-decimal pl-6 mb-4">
            <li>Click the "Help" icon in the top-right corner</li>
            <li>Browse the FAQ section</li>
            <li>Use the search function to find specific topics</li>
            <li>Contact technical support using the provided form</li>
          </ol>
        </>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/help" passHref>
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-primary" />
              User Manual
            </h1>
            <p className="text-muted-foreground">
              Comprehensive guide to using the Transportation Planning Manager
            </p>
          </div>
        </div>
        <div>
          <Link href="/docs/user-manual.pdf" target="_blank" passHref>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
              <p className="mb-4">
                The Transportation Planning Manager is a comprehensive web application designed for transportation agencies to manage, score, prioritize, and visualize infrastructure projects. This user manual provides detailed instructions on how to use all features of the system.
              </p>
              
              <h3 className="text-lg font-semibold mb-2">System Requirements</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Internet connection</li>
                <li>Screen resolution of 1280x720 or higher (1920x1080 recommended)</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2">Access and Login</h3>
              <ol className="list-decimal pl-6 mb-4">
                <li>Navigate to the application URL provided by your organization</li>
                <li>Enter your username and password</li>
                <li>Click "Log in" to access the system</li>
              </ol>
            </div>
            <div className="hidden md:block w-32 h-32 relative flex-shrink-0">
              <Image
                src="/Circle_Green_TranspRoad.png"
                alt="Transportation Planning Manager Logo"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sections.map((section) => (
            <Link 
              key={section.id} 
              href={`#${section.id}`}
              className="p-2 border rounded hover:bg-accent hover:text-accent-foreground transition-colors flex items-center"
            >
              <Book className="h-4 w-4 mr-2 text-primary" />
              {section.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Content with tabs for wide screens and accordion for narrow screens */}
      <div className="hidden md:block">
        <Tabs defaultValue={sections[0].id} className="w-full">
          <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} id={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="p-4 border rounded-md">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              {section.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile view with accordion */}
      <div className="md:hidden">
        <Accordion type="single" collapsible className="w-full">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} id={section.id}>
              <AccordionTrigger className="text-xl font-semibold">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="p-2">
                {section.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Glossary */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4" id="glossary">Glossary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">Project</h3>
            <p className="text-sm">A transportation initiative with defined scope, budget, and timeline</p>
          </div>
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">Scenario</h3>
            <p className="text-sm">An alternative version of a project with different parameters</p>
          </div>
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">GIS</h3>
            <p className="text-sm">Geographic Information System, used for spatial data visualization and analysis</p>
          </div>
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">Layer</h3>
            <p className="text-sm">A set of geographic data displayed on the map</p>
          </div>
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">Scoring</h3>
            <p className="text-sm">The process of evaluating projects based on defined criteria</p>
          </div>
          <div className="p-3 border rounded">
            <h3 className="font-semibold mb-1">AI Assistant</h3>
            <p className="text-sm">Artificial intelligence tool that provides analysis and recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
} 