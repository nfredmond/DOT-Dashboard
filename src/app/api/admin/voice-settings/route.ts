import { NextRequest, NextResponse } from 'next/server';
import { defaultVoiceSettings, VoiceSettings } from '@/lib/voice-service';
import fs from 'fs/promises';
import path from 'path';

// Path to store settings
const settingsPath = path.join(process.cwd(), 'data', 'voice-settings.json');

/**
 * Load voice settings from disk
 * @returns Promise resolving to voice settings
 */
async function loadSettings(): Promise<VoiceSettings> {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    
    // Try to read the settings file
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data) as VoiceSettings;
  } catch (error) {
    // If the file doesn't exist or is invalid, return defaults
    console.log('Using default voice settings');
    return defaultVoiceSettings;
  }
}

/**
 * Save voice settings to disk
 * @param settings Voice settings to save
 * @returns Promise that resolves when settings are saved
 */
async function saveSettings(settings: VoiceSettings): Promise<void> {
  // Ensure the data directory exists
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  
  // Validate settings by merging with defaults (to ensure all required fields exist)
  const validatedSettings = {
    ...defaultVoiceSettings,
    ...settings
  };
  
  // Write settings to disk
  await fs.writeFile(
    settingsPath,
    JSON.stringify(validatedSettings, null, 2),
    'utf-8'
  );
}

/**
 * GET handler - Retrieve current voice settings
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await loadSettings();
    
    return NextResponse.json({
      settings
    });
  } catch (error) {
    console.error('Error loading voice settings:', error);
    
    return NextResponse.json(
      { error: 'Failed to load voice settings' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Save voice settings
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { settings } = body;
    
    // Validate received settings
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }
    
    // Save the settings
    await saveSettings(settings);
    
    return NextResponse.json({
      success: true,
      message: 'Voice settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving voice settings:', error);
    
    return NextResponse.json(
      { error: 'Failed to save voice settings' },
      { status: 500 }
    );
  }
} 