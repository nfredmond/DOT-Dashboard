'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { captureScreenshot, analyzeScreenshot } from '@/services/screen-share-service';
import { Loader2, Camera, Send } from 'lucide-react';

export default function ScreenSharePanel() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureScreenshot = async () => {
    setError(null);
    setIsCapturing(true);
    
    try {
      const screenshot = await captureScreenshot();
      setImageData(screenshot);
      setAnalysis(null); // Clear previous analysis
    } catch (err) {
      setError(`Failed to capture screenshot: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnalyzeScreenshot = async () => {
    if (!imageData) {
      setError('Please capture a screenshot first');
      return;
    }
    
    if (!query.trim()) {
      setError('Please enter a query about what you want to analyze');
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeScreenshot(imageData, query);
      setAnalysis(result);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Screen Share Analysis</CardTitle>
        <CardDescription>
          Capture your screen and ask questions about what you see
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <Button 
            onClick={handleCaptureScreenshot} 
            disabled={isCapturing}
            className="w-full"
          >
            {isCapturing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Capture Screenshot
              </>
            )}
          </Button>
          
          {imageData && (
            <div className="relative border rounded-md overflow-hidden">
              <img 
                src={imageData} 
                alt="Captured screenshot" 
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="query" className="text-sm font-medium">
              What would you like to know about this screen?
            </label>
            <Textarea
              id="query"
              placeholder="E.g., 'What are the main elements on this page?' or 'What is the error message saying?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={handleAnalyzeScreenshot} 
            disabled={isAnalyzing || !imageData}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Analyze Screenshot
              </>
            )}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {analysis && (
            <div className="p-4 bg-gray-50 border rounded-md">
              <h3 className="font-medium mb-2">Analysis:</h3>
              <div className="text-sm whitespace-pre-wrap">{analysis}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 