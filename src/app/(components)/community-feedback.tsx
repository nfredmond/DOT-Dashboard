"use client"

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquareIcon,
  MapPinIcon,
  ImageIcon,
  SendIcon,
  FileIcon,
  AlertCircleIcon,
} from "lucide-react";

export function CommunityFeedback() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [feedbackType, setFeedbackType] = useState("comment");
  const [selectedProject, setSelectedProject] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [attachments, setAttachments] = useState<Array<{name: string, size: string, type: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fix unused variable warning
  const _feedbackType = feedbackType;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setFeedbackText("");
      setAttachments([]);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquareIcon className="h-5 w-5 mr-2" />
          Submit Feedback
        </CardTitle>
        <CardDescription>
          Share your thoughts on transportation projects in your community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Tabs
              defaultValue="comment"
              onValueChange={setFeedbackType}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comment">
                  Comment
                </TabsTrigger>
                <TabsTrigger value="suggestion">
                  Suggestion
                </TabsTrigger>
                <TabsTrigger value="concern">
                  Concern
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Project
              </label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highway-101">
                    Highway 101 Expansion
                  </SelectItem>
                  <SelectItem value="downtown-transit">
                    Downtown Transit Center
                  </SelectItem>
                  <SelectItem value="bike-network">
                    Bike Lane Network Expansion
                  </SelectItem>
                  <SelectItem value="bridge-retrofit">
                    Bridge Retrofit Project
                  </SelectItem>
                  <SelectItem value="light-rail">
                    Light Rail Extension
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Feedback
              </label>
              <Textarea
                placeholder="Share your thoughts, suggestions, or concerns about this project..."
                className="min-h-[150px]"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Location (Optional)
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <MapPinIcon
                    className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  />

                  <Input
                    placeholder="Enter address or drop pin on map"
                    className="pl-8"
                  />
                </div>
                <Button type="button" variant="outline">
                  Map
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Specify a location related to your feedback
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Attachments (Optional)
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById("file-upload")!.click()}
                >
                  <FileIcon className="mr-2 h-4 w-4" />
                  Add Files
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    document.getElementById("image-upload")!.click()
                  }
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded-md"
                      id={`t3a5b8_${index}`}
                    >
                      <div className="flex items-center" id={`et2lkx_${index}`}>
                        <FileIcon
                          className="h-4 w-4 mr-2 text-muted-foreground"
                          id={`hmmaet_${index}`}
                        />

                        <div id={`hvlvnv_${index}`}>
                          <p
                            className="text-sm font-medium"
                            id={`k9oppu_${index}`}
                          >
                            {file.name}
                          </p>
                          <p
                            className="text-xs text-muted-foreground"
                            id={`j5t0sf_${index}`}
                          >
                            {file.size}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        id={`uloo46_${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showSuccess && (
              <div
                className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md flex items-center"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Your feedback has been submitted successfully. Thank you for
                your contribution!
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div
                    className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter
        className="flex flex-col items-start text-sm text-muted-foreground"
      >
        <div className="flex items-start">
          <AlertCircleIcon className="h-4 w-4 mr-2 mt-0.5" />
          <p>
            Your feedback will be reviewed by the project team and may be
            included in public reports. Personal information will be kept
            confidential.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
