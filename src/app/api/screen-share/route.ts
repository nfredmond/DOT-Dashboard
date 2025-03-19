import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai-service';

/**
 * Configuration for the API route using the new App Router format
 * This increases the maximum upload size to accommodate large images
 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds

/**
 * API handler for screen sharing and analysis
 * 
 * This endpoint accepts a screenshot (as base64 data URL) and a query,
 * then processes it using a multimodal LLM to analyze the screen content.
 * 
 * @param request The incoming API request containing image data and query
 * @returns Response with the LLM analysis
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageData = formData.get('imageData') as string;
    const query = formData.get('query') as string;
    
    if (!imageData || !query) {
      return NextResponse.json({ 
        error: 'Image data and query are required' 
      }, { status: 400 });
    }
    
    // Strip the MIME type prefix from the data URL to get just the base64 data

const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Use OpenAI's API or any other multimodal LLM
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: query },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    const analysis = response.choices[0]?.message?.content || 
      "Sorry, I couldn't analyze the image. Please try again.";
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error processing screen share:', error);
    
    // Check if it's an OpenAI API error
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status || 500;
      const message = (error as any).message || 'Unknown error';
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${message}` 
      }, { status });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process screen share' 
    }, { status: 500 });
  }
} 