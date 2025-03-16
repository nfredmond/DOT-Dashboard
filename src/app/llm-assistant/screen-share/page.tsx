"use client";

import React from 'react';
import { ScreenShareLLM } from '@/components/ScreenShareLLM';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScreenSharePage() {
  const router = useRouter();

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Screen Share with AI</h1>
          <p className="text-muted-foreground">
            Share your screen with AI for analysis and assistance
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <ScreenShareLLM />
      
      <div className="bg-muted/30 p-4 rounded-lg border text-sm">
        <h3 className="font-medium mb-2">How to use Screen Share</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Click <strong>Start Capture</strong> and select the screen, window, or tab you want to share</li>
          <li>Click <strong>Take Screenshot</strong> to capture the current view</li>
          <li>Ask a question about the content in the input field</li>
          <li>Click <strong>Analyze</strong> to get AI insights about the shared content</li>
        </ol>
        <p className="mt-3 text-muted-foreground">
          Note: Screen sharing is private and processed locally. Screenshots are not stored permanently.
        </p>
      </div>
    </div>
  );
} 