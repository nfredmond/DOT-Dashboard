import { NextRequest, NextResponse } from 'next/server';
import { isSesameAvailable, getAvailableSpeakers } from '@/lib/sesame-service';
import logger from '../../../../lib/logger';


/**
 * API endpoint to check if Sesame CSM is available and get available speakers
 */
export async function GET(_request: NextRequest) {
  try {
    const available = isSesameAvailable();
    
    // If Sesame is available, return available speakers
    const speakers = available ? getAvailableSpeakers() : [];
    
    return NextResponse.json({
      available,
      speakers
    });
  } catch (error) {
    logger.error('Error checking Sesame availability:', error);
    
    return NextResponse.json({
      available: false,
      error: 'Failed to check Sesame availability'
    });
  }
} 