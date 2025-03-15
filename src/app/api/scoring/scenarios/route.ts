import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Get prioritization scenarios for the agency
    const { data, error } = await supabase
      .from('prioritization_scenarios')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching scenarios:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }
    
    // Format the response
    const scenarios = data.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      criteriaWeights: scenario.criteria_weights,
      filterSettings: scenario.filter_settings,
      agencyId: scenario.agency_id,
      createdBy: scenario.created_by,
      createdAt: scenario.created_at
    }));
    
    return NextResponse.json({ success: true, scenarios });
  } catch (error) {
    console.error('Error in scenarios API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, criteriaWeights, filterSettings, agencyId, userId } = body;
    
    if (!name || !agencyId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(cookies());
    
    // Create a new prioritization scenario
    const { data, error } = await supabase
      .from('prioritization_scenarios')
      .insert({
        name,
        description,
        criteria_weights: criteriaWeights,
        filter_settings: filterSettings,
        agency_id: agencyId,
        created_by: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating scenario:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create scenario' },
        { status: 500 }
      );
    }
    
    // Format the response
    const scenario = {
      id: data.id,
      name: data.name,
      description: data.description,
      criteriaWeights: data.criteria_weights,
      filterSettings: data.filter_settings,
      agencyId: data.agency_id,
      createdBy: data.created_by,
      createdAt: data.created_at
    };
    
    return NextResponse.json({ success: true, scenario });
  } catch (error) {
    console.error('Error in create scenario API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 