"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy, Check, RefreshCw, Download, Share2 } from 'lucide-react';
import { submitLLMFeedback } from '@/lib/llm/llmService';
import { useToast } from '@/components/ui/use-toast';

interface LLMResponseProps {
  content: string;
  isLoading?: boolean;
  feedbackId?: string;
  onReset?: () => void;
  className?: string;
}

export function LLMResponse({ content, isLoading, feedbackId, onReset, className = '' }: LLMResponseProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Check if the share API is available
  const isShareAvailable = typeof navigator !== 'undefined' && 'share' in navigator;

  // Handle feedback submission
  const handleFeedback = async (isPositive: boolean) => {
    if (!feedbackId) return;
    
    try {
      await submitLLMFeedback(feedbackId, isPositive);
      setFeedbackSubmitted(true);
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback. It helps improve our AI.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      
      toast({
        title: "Feedback Error",
        description: "Unable to submit feedback. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Copy content to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      
      toast({
        title: "Copied to Clipboard",
        description: "The content has been copied to your clipboard.",
        variant: "default",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      
      toast({
        title: "Copy Error",
        description: "Unable to copy to clipboard. Please try manually.",
        variant: "destructive",
      });
    }
  };

  // Download content as text file
  const handleDownload = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `llm-response-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Downloaded",
        description: "The content has been downloaded as a text file.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading content:", error);
      
      toast({
        title: "Download Error",
        description: "Unable to download the content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Share content functionality
  const handleShare = async () => {
    if (!isShareAvailable) {
      toast({
        title: "Share Not Supported",
        description: "Sharing is not supported in your browser.",
        variant: "default",
      });
      return;
    }
    
    try {
      await navigator.share({
        title: 'LLM Analysis',
        text: content,
      });
    } catch (error) {
      console.error("Error sharing content:", error);
      
      toast({
        title: "Share Error",
        description: "Unable to share the content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format markdown-like content with basic styling
  const formatContent = (text: string) => {
    // Replace headers
    let formattedText = text
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-2 mt-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mb-2 mt-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-md font-bold mb-1 mt-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>');
    
    // Replace bullet points
    formattedText = formattedText.replace(/- (.*?)(\n|$)/g, '<li class="ml-4 list-disc">$1</li>$2');
    
    // Replace numbered lists
    formattedText = formattedText.replace(/(\d+)\. (.*?)(\n|$)/g, '<li class="ml-4 list-decimal">$2</li>$3');
    
    return formattedText;
  };

  if (isLoading) {
    return (
      <Card className={`w-full overflow-hidden ${className}`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Generating response...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {content ? (
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No content available</p>
          </div>
        )}
      </CardContent>
      
      {content && (
        <CardFooter className="flex justify-between p-4 border-t bg-muted/50">
          <div className="flex space-x-2">
            {feedbackId && !feedbackSubmitted ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handleFeedback(true)}>
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleFeedback(false)}>
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Not Helpful
                </Button>
              </>
            ) : feedbackSubmitted ? (
              <span className="text-sm text-muted-foreground">Thanks for your feedback</span>
            ) : null}
          </div>
          
          <div className="flex space-x-2">
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RefreshCw className="h-4 w-4 mr-1" />
                New
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
            {isShareAvailable && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 