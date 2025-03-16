"use client"

import React from "react";
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
        "You can provide feedback on a project by visiting the Community page, finding the project you want to comment on, and clicking the 'Provide Feedback' button. Alternatively, you can use the Community Mapping feature to add location-specific feedback.",
    },
    {
      question: "What is the LLM Assistant?",
      answer:
        "The LLM Assistant is an AI-powered tool that helps with various tasks such as evaluating project descriptions against grant criteria, suggesting improvements to projects, generating reports, and drafting responses to community feedback.",
    },
    {
      question: "How do I generate a report?",
      answer:
        "To generate a report, go to the Reports page and click on 'Generate Report'. Select the report type, choose which projects to include, select the report elements you want, and choose your preferred output format. Then click 'Generate Report'.",
    },
    {
      question: "How do I change my notification settings?",
      answer:
        "You can change your notification settings by going to the Settings page, selecting the 'Notifications' tab, and adjusting your preferences for different types of notifications.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight flex items-center"
        >
          <HelpCircleIcon className="mr-2 h-8 w-8 text-blue-500" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Find answers to common questions and get support
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
              features of the Planning Manager.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              View User Guide
            </Button>
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
              Videos, webinars, and training materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Access our library of training resources to learn how to use the
              Planning Manager effectively.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              View Resources
            </Button>
          </CardFooter>
        </Card>
      </div>

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
    </div>
  );
}
