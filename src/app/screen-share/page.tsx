import { Metadata } from 'next';
import ScreenShareLLM from '@/components/ScreenShareLLM';

export const metadata: Metadata = {
  title: 'Screen Share Analysis | Planning Manager',
  description: 'Capture and analyze your screen with AI assistance',
};

export default function ScreenSharePage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Screen Share Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Capture your screen and get AI-powered insights and assistance
        </p>
      </div>
      
      <div className="mb-8">
        <ScreenShareLLM />
      </div>
      
      <div className="bg-muted p-4 rounded-lg text-sm">
        <h3 className="font-medium mb-2">How to use screen sharing:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click the <strong>Start Screen Capture</strong> button and select the window or tab you want to share</li>
          <li>The shared content will appear in the video preview</li>
          <li>Click <strong>Take Screenshot</strong> when you want to capture the current view</li>
          <li>Switch to the <strong>Analysis</strong> tab to review your screenshot</li>
          <li>Enter a specific question about what you see on the screen</li>
          <li>Click <strong>Analyze Screenshot</strong> to get AI-powered insights</li>
        </ol>
        <p className="mt-4 text-muted-foreground">
          <strong>Note:</strong> Your screenshots are processed securely and are not stored permanently.
        </p>
      </div>
    </div>
  );
} 