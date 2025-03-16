/**
 * Screen Share Service
 * 
 * Provides functionality for screen capture, screenshot taking, and LLM analysis.
 */

import { analyzeImage } from '@/lib/openai-service';

/**
 * Custom type for display capture constraints
 * These extend the standard MediaTrackConstraints with display-specific properties
 */
interface DisplayMediaTrackConstraints {
  cursor?: 'always' | 'motion' | 'never';
  displaySurface?: 'browser' | 'window' | 'monitor';
  logicalSurface?: boolean;
  restrictOwnAudio?: boolean;
  suppressLocalAudioPlayback?: boolean;
  // Chrome-specific
  preferCurrentTab?: boolean;
}

/**
 * Options for screen capture
 */
export interface ScreenCaptureOptions {
  audio?: boolean;
  preferCurrentTab?: boolean;
  displaySurface?: 'browser' | 'window' | 'monitor';
}

/**
 * Result of screen capture operation
 */
export interface ScreenCaptureResult {
  stream: MediaStream | null;
  error?: string;
}

/**
 * Start capturing the screen
 * @param options Screen capture configuration options
 * @returns Promise resolving to ScreenCaptureResult
 */
export async function startScreenCapture(options: ScreenCaptureOptions = {}): Promise<ScreenCaptureResult> {
  try {
    // Check if the browser supports screen capture
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return {
        stream: null,
        error: 'Screen capture is not supported in this browser'
      };
    }

    // Create display media constraints
    const videoConstraints: DisplayMediaTrackConstraints = {
      cursor: 'always'
    };
    
    // Add display surface if specified
    if (options.displaySurface) {
      videoConstraints.displaySurface = options.displaySurface;
    }
    
    // Add preferCurrentTab for Chrome if requested
    if (options.preferCurrentTab) {
      videoConstraints.preferCurrentTab = true;
    }

    // Request media stream
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: videoConstraints as any,
      audio: options.audio || false
    });
    
    return { stream };
  } catch (error) {
    console.error('Error starting screen capture:', error);
    return {
      stream: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Stop screen capture 
 * @param stream The media stream to stop
 */
export function stopScreenCapture(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Take a screenshot from an active screen capture stream
 * @param stream The active screen capture media stream
 * @returns Promise resolving to a base64-encoded data URL of the screenshot
 */
export async function takeScreenshot(stream: MediaStream): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a video element to capture the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // When video is ready, take the screenshot
      video.onloadedmetadata = () => {
        // Set video size
        video.play();
        
        // Create a canvas to draw the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL (JPEG with 80% quality)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
        
        // Stop the video element
        video.pause();
        video.srcObject = null;
      };
      
      // Handle errors
      video.onerror = (err) => {
        reject(new Error(`Video error: ${err}`));
      };
      
    } catch (error) {
      reject(new Error(`Failed to take screenshot: ${error}`));
    }
  });
}

/**
 * Send a screenshot to the LLM for analysis
 * @param screenshotDataUrl Base64-encoded data URL of the screenshot
 * @param query The user's query about the screenshot
 * @returns Promise resolving to the LLM analysis 
 */
export async function sendScreenshotToLLM(screenshotDataUrl: string, query: string): Promise<string> {
  try {
    // First approach: Send to our API endpoint
    try {
      const formData = new FormData();
      formData.append('imageData', screenshotDataUrl);
      formData.append('query', query);
      
      const response = await fetch('/api/screen-share', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze screenshot');
      }
      
      const data = await response.json();
      return data.analysis;
    } catch (apiError) {
      console.warn('API error, falling back to client-side processing:', apiError);
      
      // Fall back to client-side processing if server request fails
      // Strip the MIME type prefix from the data URL
      const base64Image = screenshotDataUrl.replace(/^data:image\/\w+;base64,/, '');
      
      // Use our OpenAI service directly
      return await analyzeImage(base64Image, query);
    }
  } catch (error) {
    console.error('Error sending screenshot to LLM:', error);
    throw new Error('Failed to analyze screenshot: ' + (error instanceof Error ? error.message : String(error)));
  }
} 