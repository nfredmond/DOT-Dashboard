/**
 * Type definitions for the Screen Capture API
 * These extend the standard DOM MediaStream interfaces to add
 * display media specific capabilities.
 */

interface DisplayMediaStreamConstraints {
  /**
   * Video track constraints for screen sharing
   */
  video?: boolean | MediaTrackConstraints | DisplayMediaTrackConstraints;
  
  /**
   * Audio track constraints
   */
  audio?: boolean | MediaTrackConstraints;
}

/**
 * Extended media track constraints specific to display media
 */
interface DisplayMediaTrackConstraints extends MediaTrackConstraints {
  /**
   * Controls the capture of the mouse cursor
   */
  cursor?: 'always' | 'motion' | 'never';
  
  /**
   * Hint to the browser about what type of display surface to capture
   */
  displaySurface?: 'browser' | 'window' | 'monitor';
  
  /**
   * Whether to capture logical surface or physical pixels
   */
  logicalSurface?: boolean;
  
  /**
   * Whether audio playback from the captured display surface should be muted
   */
  suppressLocalAudioPlayback?: boolean;
  
  /**
   * Chrome-specific: Whether to prefer capturing the current browser tab
   */
  preferCurrentTab?: boolean;
}

/**
 * Extends the Navigator interface to include getDisplayMedia
 */
interface MediaDevices {
  /**
   * Prompts the user to select a display area, produces a MediaStream
   * containing a video track with the selected area plus optionally an audio track.
   */
  getDisplayMedia(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream>;
} 