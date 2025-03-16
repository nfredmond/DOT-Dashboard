import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { ProjectGeometry } from '@/types/project';

// POST /api/projects/process-geospatial - Process uploaded geospatial files
export async function POST(request: NextRequest) {
  const supabase = createClient(cookies());
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload KML, KMZ, GeoJSON, or Shapefile' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('geospatial-files')
      .upload(fileName, file);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('geospatial-files')
      .getPublicUrl(fileName);
    
    // Process the file to extract GeoJSON (simplified mock implementation)
    // In a real app, you would use libraries like togeojson, shpjs, etc.
    const geometry = await processGeospatialFile(file, fileType);
    
    // Store the file metadata in the database
    const { data: fileData, error: fileError } = await supabase
      .from('geospatial_files')
      .insert({
        name: fileName,
        original_name: file.name,
        file_type: fileType,
        uploaded_at: new Date().toISOString(),
        uploaded_by: session.user.id,
        file_size: file.size,
        project_id: projectId || null,
        url: publicUrl,
        geometry: geometry
      })
      .select()
      .single();
    
    if (fileError) throw fileError;
    
    // If a project ID was provided, update the project with the geometry
    if (projectId && geometry) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          geometry: geometry,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id
        })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
    }
    
    return NextResponse.json({
      data: {
        file: fileData,
        geometry: geometry
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error processing geospatial file:', error);
    return NextResponse.json(
      { error: 'Failed to process geospatial file' },
      { status: 500 }
    );
  }
}

// Helper function to determine file type from extension
function getFileType(filename: string): 'kmz' | 'kml' | 'geojson' | 'shapefile' | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'kmz':
      return 'kmz';
    case 'kml':
      return 'kml';
    case 'json':
    case 'geojson':
      return 'geojson';
    case 'zip': // Assuming zipped shapefiles
    case 'shp':
      return 'shapefile';
    default:
      return null;
  }
}

// Mock implementation of geospatial file processing
// In a real app, you would use proper libraries for each file type
async function processGeospatialFile(file: File, fileType: string): Promise<ProjectGeometry | null> {
  try {
    // For demonstration purposes, we'll just return a mock geometry
    // In a real implementation, you would:
    // 1. For KML/KMZ: Use togeojson library
    // 2. For Shapefiles: Use shpjs library
    // 3. For GeoJSON: Just parse the JSON
    
    if (fileType === 'geojson') {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Extract the first geometry if it's a FeatureCollection
      if (json.type === 'FeatureCollection' && json.features && json.features.length > 0) {
        return json.features[0].geometry;
      } else if (json.type === 'Feature') {
        return json.geometry;
      } else if (json.type === 'Point' || json.type === 'LineString' || json.type === 'Polygon') {
        return json;
      }
    }
    
    // Mock geometries for other file types
    if (fileType === 'kml' || fileType === 'kmz') {
      return {
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco
      };
    }
    
    if (fileType === 'shapefile') {
      return {
        type: 'Polygon',
        coordinates: [[
          [-122.4194, 37.7749],
          [-122.4194, 37.8049],
          [-122.3894, 37.8049],
          [-122.3894, 37.7749],
          [-122.4194, 37.7749]
        ]]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error processing file:', error);
    return null;
  }
} 