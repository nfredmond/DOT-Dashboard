import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * This route handles the integration between Benefit-Cost Analysis and CAMP/TrendNavigator
 * It allows fetching data from CAMP models and scenarios to create or update BCA entries
 * 
 * Currently implemented as a mock for build purposes
 */

export const dynamic = 'force-dynamic';

// POST /api/projects/[id]/bca/camp-integration - Import data from CAMP/TrendNavigator
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Mock CAMP integration route called');
    
    // Return mock response
    return new NextResponse(JSON.stringify({
      success: true,
      analysis: {
        id: 'mock-analysis-id',
        name: 'Mock Analysis',
        description: 'Mock analysis for development',
        baseYear: 2023,
        analysisHorizon: 30,
        discountRate: 0.07,
        annualBenefits: [],
        annualCosts: [],
        presentValueBenefits: 0,
        presentValueCosts: 0,
        netPresentValue: 0,
        benefitCostRatio: 0,
        internalRateOfReturn: 0,
      },
      dataSource: 'mock',
      sourceId: 'mock-source-id'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error in mock CAMP integration:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'An error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 