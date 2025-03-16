/**
 * Screen Share Service
 * 
 * Provides functionality for capturing screenshots and sending them to the API
 * for analysis using multimodal LLMs.
 */

/**
 * Captures a screenshot of the current tab using the browser's API
 * @returns Promise resolving to a base64-encoded data URL of the screenshot
 */
export async function captureScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Check if browser supports the required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        reject(new Error('Screen capture is not supported in this browser'));
        return;
      }

      // Request screen sharing permission
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          // Create a video element to capture the stream
          const video = document.createElement('video');
          video.srcObject = stream;
          
          // When video metadata is loaded, take a screenshot
          video.onloadedmetadata = () => {
            video.play();
            
            // Create a canvas to draw the video frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw the current video frame to the canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Stop all tracks in the stream to end screen sharing
            stream.getTracks().forEach(track => track.stop());
            
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
        })
        .catch(error => {
          reject(new Error(`Screen capture permission denied: ${error.message}`));
        });
    } catch (error) {
      reject(new Error(`Failed to capture screenshot: ${error}`));
    }
  });
}

/**
 * Sends a screenshot to the API for analysis
 * @param imageData Base64-encoded data URL of the screenshot
 * @param query Text query describing what to analyze in the screenshot
 * @returns Promise resolving to the analysis result
 */
export async function analyzeScreenshot(imageData: string, query: string): Promise<string> {
  try {
    // Create form data to send to the API
    const formData = new FormData();
    formData.append('imageData', imageData);
    formData.append('query', query);
    
    // Send the request to the API
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
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw error;
  }
} 