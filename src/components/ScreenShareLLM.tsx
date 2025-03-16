"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Monitor, 
  Camera, 
  StopCircle, 
  Send, 
  RefreshCw, 
  Clipboard, 
  Loader2,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Download,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVoice } from '@/contexts/VoiceContext';
import { 
  startScreenCapture, 
  stopScreenCapture, 
  takeScreenshot, 
  sendScreenshotToLLM,
  ScreenCaptureOptions
} from '@/lib/screen-share-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ScreenShareLLM() {
  // Screen capture state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  
  // Screenshot state
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  
  // Analysis state
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { voiceEnabled, speak, stopSpeaking, isSpeaking } = useVoice();

  // Clean up the stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stopScreenCapture(stream);
      }
    };
  }, [stream]);

  // Handle starting screen capture
  const handleStartCapture = async () => {
    setCaptureError(null);
    setIsCapturing(true);
    
    try {
      const options: ScreenCaptureOptions = {
        audio: false,
        preferCurrentTab: false
      };
      
      const result = await startScreenCapture(options);
      
      if (result.error || !result.stream) {
        setCaptureError(result.error || 'Failed to start screen capture');
        setIsCapturing(false);
        return;
      }
      
      setStream(result.stream);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = result.stream;
      }
    } catch (err) {
      setCaptureError(`Failed to capture screen: ${err instanceof Error ? err.message : String(err)}`);
      setIsCapturing(false);
    }
  };
  
  // Handle stopping screen capture
  const handleStopCapture = () => {
    if (stream) {
      stopScreenCapture(stream);
      setStream(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    setIsCapturing(false);
  };
  
  // Handle taking a screenshot
  const handleTakeScreenshot = async () => {
    if (!stream) {
      setScreenshotError('No active screen capture');
      return;
    }
    
    setScreenshotError(null);
    setIsScreenshotting(true);
    
    try {
      const screenshot = await takeScreenshot(stream);
      setScreenshotData(screenshot);
      setAnalysis(null); // Clear previous analysis
    } catch (err) {
      setScreenshotError(`Failed to take screenshot: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScreenshotting(false);
    }
  };
  
  // Handle analyzing a screenshot
  const handleAnalyzeScreenshot = async () => {
    if (!screenshotData) {
      setAnalysisError('Please take a screenshot first');
      return;
    }
    
    if (!query.trim()) {
      setAnalysisError('Please enter a query about what you want to analyze');
      return;
    }
    
    setAnalysisError(null);
    setIsAnalyzing(true);
    
    try {
      const result = await sendScreenshotToLLM(screenshotData, query);
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Save screenshot to disk
  const handleSaveScreenshot = () => {
    if (!screenshotData) return;
    
    const link = document.createElement('a');
    link.href = screenshotData;
    link.download = `screenshot-${new Date().toISOString().replace(/:/g, '-')}.jpg`;
    link.click();
  };

  // Handle speech toggle for response
  const handleSpeechToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (analysis) {
      speak(analysis);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Interactive Screen Share Analysis</CardTitle>
        <CardDescription>
          Capture your screen, take screenshots, and analyze with AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="capture" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capture">Live Capture</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="capture" className="space-y-4">
            <div className="flex justify-between gap-2">
              {!isCapturing ? (
                <Button 
                  onClick={handleStartCapture} 
                  className="flex-1"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Start Screen Capture
                </Button>
              ) : (
                <Button 
                  onClick={handleStopCapture} 
                  variant="destructive"
                  className="flex-1"
                >
                  <VideoOff className="mr-2 h-4 w-4" />
                  Stop Capture
                </Button>
              )}
              
              <Button 
                onClick={handleTakeScreenshot} 
                disabled={!isCapturing || isScreenshotting}
                className="flex-1"
              >
                {isScreenshotting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Taking Screenshot...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Screenshot
                  </>
                )}
              </Button>
            </div>
            
            {captureError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {captureError}
              </div>
            )}
            
            {screenshotError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {screenshotError}
              </div>
            )}
            
            <div className="aspect-video bg-black rounded-md overflow-hidden relative">
              {isCapturing ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white text-sm">
                  Click "Start Screen Capture" to begin
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            {screenshotData ? (
              <div className="relative border rounded-md overflow-hidden group">
                <img 
                  src={screenshotData} 
                  alt="Screenshot" 
                  className="w-full h-auto object-contain"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={handleSaveScreenshot}
                    className="rounded-full"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video border border-dashed rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Take a screenshot in the "Live Capture" tab first
                </p>
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
              disabled={isAnalyzing || !screenshotData}
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
            
            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {analysisError}
              </div>
            )}
            
            {analysis && (
              <div className="p-4 bg-gray-50 border rounded-md">
                <h3 className="font-medium mb-2">Analysis:</h3>
                <div className="text-sm whitespace-pre-wrap">{analysis}</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>Note: Your screenshots are processed securely and not stored permanently.</p>
      </CardFooter>
    </Card>
  );
} 